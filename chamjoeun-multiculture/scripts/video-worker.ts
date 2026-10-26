import { query, transaction, pool } from "../src/lib/db.ts";
import { storage, storageConfigured, videoBucket } from "../src/lib/storage.ts";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  stat,
  statfs,
  rm,
} from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { resolve, join, relative, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
if (!storageConfigured())
  throw new Error(
    "Configure private S3/R2 storage before running the video worker.",
  );
function command(
  executable: string,
  args: string[],
  timeout = 8 * 60 * 60 * 1000,
): Promise<string> {
  return new Promise((ok, fail) => {
    const child = spawn(executable, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (b) => {
      stdout = (stdout + b).slice(-100000);
    });
    child.stderr.on("data", (b) => {
      stderr = (stderr + b).slice(-3000);
    });
    const timer = setTimeout(() => {
      child.kill();
      fail(new Error("변환 작업 시간 초과"));
    }, timeout);
    child.on("error", (e) => {
      clearTimeout(timer);
      fail(e);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      code === 0
        ? ok(stdout)
        : fail(new Error(`변환 명령 실패 (${code}): ${stderr.slice(-1000)}`));
    });
  });
}
async function* files(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(p);
    else yield p;
  }
}
async function one() {
  const job = await transaction(async (c) => {
    const { rows } = await c.query(
      "SELECT * FROM video_jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!rows[0]) return null;
    await c.query(
      "UPDATE video_jobs SET status='processing',stage='downloading',attempts=attempts+1,updated_at=now() WHERE id=$1",
      [rows[0].id],
    );
    return rows[0];
  });
  if (!job) return false;
  const base = resolve(".local/video-jobs"),
    dir = resolve(base, job.id);
  if (!/^[a-f0-9-]{36}$/.test(job.id) || !dir.startsWith(base + sep))
    throw new Error("Invalid job directory");
  await mkdir(dir, { recursive: true });
  const heartbeat = setInterval(() => {
    void query("UPDATE video_jobs SET updated_at=now() WHERE id=$1", [
      job.id,
    ]).catch(() => {});
  }, 30000);
  try {
    const [upload] = await query("SELECT * FROM video_uploads WHERE id=$1", [
      job.upload_id,
    ]);
    if (!upload) throw new Error("업로드 정보를 찾을 수 없습니다.");
    const space = await statfs(dir);
    if (
      Number(space.bavail) * Number(space.bsize) <
      Number(upload.expected_size) * 5 + 2 * 1024 ** 3
    )
      throw new Error("영상 처리용 임시 디스크 공간이 부족합니다.");
    const source = join(dir, "source.mp4"),
      out = join(dir, "hls");
    await mkdir(out, { recursive: true });
    const s3 = storage(),
      Bucket = videoBucket();
    const input = await s3.send(
      new GetObjectCommand({ Bucket, Key: job.source_key }),
    );
    if (!input.Body) throw new Error("영상 원본을 찾을 수 없습니다.");
    await pipeline(input.Body as Readable, createWriteStream(source));
    if ((await stat(source)).size !== Number(upload.expected_size))
      throw new Error("영상 원본 크기가 일치하지 않습니다.");
    const info = JSON.parse(
      await command(
        process.env.FFPROBE_PATH ?? "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration,format_name:stream=codec_type,codec_name,width,height",
          "-of",
          "json",
          source,
        ],
        120000,
      ),
    );
    const duration = Number(info.format?.duration);
    const video = info.streams.find(
      (s: { codec_type: string }) => s.codec_type === "video",
    );
    const audio = info.streams.find(
      (s: { codec_type: string }) => s.codec_type === "audio",
    );
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      video?.codec_name !== "h264" ||
      (audio && audio.codec_name !== "aac") ||
      !String(info.format?.format_name).includes("mp4")
    )
      throw new Error("MP4 · H.264/AAC 규격의 영상을 확인해 주세요.");
    const estimated =
      Number(upload.expected_size) +
      Math.ceil(
        ((duration * (5000000 + 2800000 + 1400000 + 3 * 128000)) / 8) * 1.15,
      );
    await transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(20261026)");
      const [{ used }] = (
        await c.query(
          "SELECT COALESCE(sum(reserved_bytes),0) used FROM video_uploads WHERE status<>'aborted' AND id<>$1",
          [upload.id],
        )
      ).rows;
      if (
        Number(used) + estimated >
        Number(process.env.VIDEO_STORAGE_CAP_GB ?? 500) * 1024 ** 3
      )
        throw new Error("변환 결과를 포함한 저장 예산 한도를 초과합니다.");
      await c.query("UPDATE video_uploads SET reserved_bytes=$1 WHERE id=$2", [
        estimated,
        upload.id,
      ]);
    });
    const profiles = [
      { height: 1080, rate: 5000000 },
      { height: 720, rate: 2800000 },
      { height: 480, rate: 1400000 },
    ];
    let master = "#EXTM3U\n#EXT-X-VERSION:3\n";
    for (const profile of profiles) {
      await query(
        "UPDATE video_jobs SET stage=$1,updated_at=now() WHERE id=$2",
        [`encoding_${profile.height}`, job.id],
      );
      const folder = join(out, String(profile.height));
      await mkdir(folder, { recursive: true });
      await command(process.env.FFMPEG_PATH ?? "ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        source,
        "-vf",
        `scale=-2:${profile.height}`,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-threads",
        "1",
        "-b:v",
        String(profile.rate),
        "-maxrate",
        String(profile.rate),
        "-bufsize",
        String(profile.rate * 2),
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-g",
        "150",
        "-keyint_min",
        "150",
        "-sc_threshold",
        "0",
        "-hls_time",
        "6",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "independent_segments",
        "-hls_segment_filename",
        join(folder, "segment-%06d.ts"),
        join(folder, "index.m3u8"),
      ]);
      const width =
        Math.round(
          ((Number(video.width) / Number(video.height)) * profile.height) / 2,
        ) * 2;
      master += `#EXT-X-STREAM-INF:BANDWIDTH=${profile.rate + 128000},RESOLUTION=${width}x${profile.height}\n${profile.height}/index.m3u8\n`;
    }
    await writeFile(join(out, "master.m3u8"), master);
    await query(
      "UPDATE video_jobs SET stage='thumbnail',updated_at=now() WHERE id=$1",
      [job.id],
    );
    await command(process.env.FFMPEG_PATH ?? "ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(Math.min(1, duration / 10)),
      "-i",
      source,
      "-frames:v",
      "1",
      "-vf",
      "scale=640:-2",
      join(out, "thumbnail.jpg"),
    ]);
    await query(
      "UPDATE video_jobs SET stage='uploading_outputs',updated_at=now() WHERE id=$1",
      [job.id],
    );
    const prefix = `lessons/${job.lesson_id}/v-${job.id}/`;
    let resultSize = 0;
    for await (const file of files(out)) {
      const key = relative(out, file).split(sep).join("/"),
        size = (await stat(file)).size;
      resultSize += size;
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: prefix + key,
          Body: createReadStream(file),
          ContentLength: size,
          ContentType: key.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : key.endsWith(".ts")
              ? "video/mp2t"
              : "image/jpeg",
          CacheControl: "private, no-store",
        }),
      );
    }
    await transaction(async (c) => {
      await c.query(
        "UPDATE lessons SET duration_seconds=$1,video_key=$2,video_status='ready' WHERE id=$3",
        [
          Math.round(duration * 1000) / 1000,
          prefix + "master.m3u8",
          job.lesson_id,
        ],
      );
      await c.query(
        "UPDATE video_jobs SET status='ready',stage='ready',error=NULL,updated_at=now() WHERE id=$1",
        [job.id],
      );
      await c.query(
        "UPDATE video_uploads SET status='ready',reserved_bytes=$1 WHERE id=$2",
        [Number(upload.expected_size) + resultSize, upload.id],
      );
    });
    console.log(`Video job completed: ${job.id}`);
  } catch (e) {
    const error = e instanceof Error ? e.message : "영상 변환 실패";
    await transaction(async (c) => {
      await c.query(
        "UPDATE video_jobs SET status='failed',stage='failed',error=$1,updated_at=now() WHERE id=$2",
        [error.slice(0, 2000), job.id],
      );
      await c.query("UPDATE lessons SET video_status='failed' WHERE id=$1", [
        job.lesson_id,
      ]);
      await c.query("UPDATE video_uploads SET status='failed' WHERE id=$1", [
        job.upload_id,
      ]);
    });
    console.error(`Video job failed: ${job.id}`);
  } finally {
    clearInterval(heartbeat);
    if (dir.startsWith(base + sep))
      await rm(dir, { recursive: true, force: true });
  }
  return true;
}
await query(
  "UPDATE video_jobs SET status='queued',stage='recovered' WHERE status='processing' AND updated_at<now()-interval '10 minutes'",
);
let stop = false;
process.on("SIGINT", () => {
  stop = true;
});
process.on("SIGTERM", () => {
  stop = true;
});
do {
  const worked = await one();
  if (process.argv.includes("--once")) break;
  if (!worked) await new Promise((r) => setTimeout(r, 3000));
} while (!stop);
await pool().end();

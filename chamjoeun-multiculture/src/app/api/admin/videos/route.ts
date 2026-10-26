import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { currentUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import {
  storage,
  storageConfigured,
  videoBucket,
  uploadPartSize,
} from "@/lib/storage";
const base = z.object({
  action: z.enum(["begin", "sign", "complete", "abort", "retry", "unlink"]),
  lessonId: z.uuid().optional(),
  uploadId: z.uuid().optional(),
  jobId: z.uuid().optional(),
  name: z.string().max(200).optional(),
  size: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 ** 3)
    .optional(),
  part: z.number().int().min(1).max(160).optional(),
});
export async function POST(request: NextRequest) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.APP_URL ?? "http://localhost:3000").origin
  )
    return NextResponse.json({ error: "접근할 수 없습니다." }, { status: 403 });
  const user = await currentUser();
  if (user?.role !== "admin")
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 },
    );
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const p = base.safeParse(payload);
  if (!p.success)
    return NextResponse.json(
      { error: "업로드 정보를 확인해 주세요. 파일당 최대 10GB입니다." },
      { status: 400 },
    );
  const d = p.data;
  if (!storageConfigured())
    return NextResponse.json(
      { error: "비공개 영상 스토리지 연동 설정이 필요합니다." },
      { status: 503 },
    );
  try {
    const s3 = storage(),
      Bucket = videoBucket();
    if (d.action === "begin") {
      if (!d.lessonId || !d.size || !d.name?.toLowerCase().endsWith(".mp4"))
        throw new Error("MP4 파일과 차시를 확인해 주세요.");
      const [lesson] = await query("SELECT id FROM lessons WHERE id=$1", [
        d.lessonId,
      ]);
      if (!lesson) throw new Error("차시를 찾을 수 없습니다.");
      const id = randomUUID(),
        Key = `originals/${id}/source.mp4`;
      const reserved = d.size * 4;
      const result = await transaction(async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(20261026)");
        const [{ used }] = (
          await c.query(
            "SELECT COALESCE(sum(reserved_bytes),0) used FROM video_uploads WHERE status<>'aborted'",
          )
        ).rows;
        const cap = Number(process.env.VIDEO_STORAGE_CAP_GB ?? 500) * 1024 ** 3;
        if (Number(used) + reserved > cap)
          throw new Error(
            "영상 저장 예산 한도에 도달했습니다. 기존 영상과 용량을 확인해 주세요.",
          );
        const remote = await s3.send(
          new CreateMultipartUploadCommand({
            Bucket,
            Key,
            ContentType: "video/mp4",
          }),
        );
        if (!remote.UploadId)
          throw new Error("업로드 세션을 생성하지 못했습니다.");
        await c.query(
          "INSERT INTO video_uploads(id,lesson_id,created_by,object_key,remote_upload_id,expected_size,reserved_bytes,original_name) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            id,
            d.lessonId,
            user.id,
            Key,
            remote.UploadId,
            d.size,
            reserved,
            d.name,
          ],
        );
        return {
          uploadId: id,
          partSize: uploadPartSize,
          parts: Math.ceil(d.size! / uploadPartSize),
        };
      });
      return NextResponse.json(result);
    }
    if (d.action === "retry") {
      if (!d.jobId) throw new Error("작업을 확인해 주세요.");
      await transaction(async (c) => {
        const r = await c.query(
          "UPDATE video_jobs SET status='queued',stage='waiting',error=NULL,updated_at=now() WHERE id=$1 AND status='failed' RETURNING lesson_id",
          [d.jobId],
        );
        if (!r.rows[0]) throw new Error("재처리할 작업이 없습니다.");
        await c.query(
          "UPDATE lessons SET video_status='processing' WHERE id=$1",
          [r.rows[0].lesson_id],
        );
      });
      return NextResponse.json({ success: true });
    }
    if (d.action === "unlink") {
      if (!d.lessonId) throw new Error("차시를 확인해 주세요.");
      await transaction(async (c) => {
        await c.query(
          "UPDATE lessons SET video_key=NULL,video_status='pending' WHERE id=$1",
          [d.lessonId],
        );
        await c.query(
          "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'영상 노출 중지',$2)",
          [user.id, d.lessonId],
        );
      });
      return NextResponse.json({
        success: true,
        note: "영상 노출을 중지했습니다. 원본 보관·스토리지 삭제는 운영 정책에 따라 별도 정리합니다.",
      });
    }
    if (!d.uploadId) throw new Error("업로드 세션을 확인해 주세요.");
    const [u] = await query("SELECT * FROM video_uploads WHERE id=$1", [
      d.uploadId,
    ]);
    if (!u || u.status !== "uploading")
      throw new Error("진행 중인 업로드가 아닙니다.");
    const command = { Bucket, Key: u.object_key, UploadId: u.remote_upload_id };
    if (d.action === "sign") {
      const total = Math.ceil(Number(u.expected_size) / uploadPartSize);
      if (!d.part || d.part > total)
        throw new Error("분할 번호를 확인해 주세요.");
      const url = await getSignedUrl(
        s3,
        new UploadPartCommand({ ...command, PartNumber: d.part }),
        { expiresIn: 900 },
      );
      return NextResponse.json({ url });
    }
    if (d.action === "abort") {
      await s3.send(new AbortMultipartUploadCommand(command));
      await query("UPDATE video_uploads SET status='aborted' WHERE id=$1", [
        u.id,
      ]);
      return NextResponse.json({ success: true });
    }
    if (d.action === "complete") {
      const remote = await s3.send(new ListPartsCommand(command));
      const parts = remote.Parts ?? [];
      if (
        remote.IsTruncated ||
        parts.length !== Math.ceil(Number(u.expected_size) / uploadPartSize) ||
        parts.reduce((n, p) => n + (p.Size ?? 0), 0) !== Number(u.expected_size)
      )
        throw new Error("업로드 용량이 일치하지 않습니다. 다시 시도해 주세요.");
      await s3.send(
        new CompleteMultipartUploadCommand({
          ...command,
          MultipartUpload: {
            Parts: parts.map((p) => ({
              ETag: p.ETag,
              PartNumber: p.PartNumber,
            })),
          },
        }),
      );
      await transaction(async (c) => {
        await c.query("UPDATE video_uploads SET status='queued' WHERE id=$1", [
          u.id,
        ]);
        await c.query(
          "UPDATE lessons SET video_status='processing' WHERE id=$1",
          [u.lesson_id],
        );
        await c.query(
          "INSERT INTO video_jobs(lesson_id,source_key,upload_id) VALUES($1,$2,$3)",
          [u.lesson_id, u.object_key, u.id],
        );
        await c.query(
          "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'영상 업로드 완료',$2)",
          [user.id, u.lesson_id],
        );
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "지원하지 않는 작업입니다." },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "영상 처리 요청에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}

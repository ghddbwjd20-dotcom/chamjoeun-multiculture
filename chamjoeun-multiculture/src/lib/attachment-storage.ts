import { query, transaction } from "@/lib/db";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
export const maxAttachmentSize = 10 * 1024 * 1024;
export function sniffMime(data: Buffer) {
  if (data.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return "image/jpeg";
  if (
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    data.subarray(0, 4).toString() === "RIFF" &&
    data.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
function filePath(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid attachment id");
  return join(resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? ".local/uploads"), `${id}.bin`);
}
export async function writeAttachment(id: string, data: Buffer) {
  if (process.env.VERCEL) {
    if (data.length > maxAttachmentSize) throw new Error("첨부파일은 10MB 이하로 등록해 주세요.");
    await transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(7042027)");
      const { rows } = await client.query("SELECT coalesce(sum(octet_length(data)),0)::bigint AS bytes FROM attachment_files");
      if (Number(rows[0].bytes) + data.length > 100 * 1024 * 1024) throw new Error("검토용 첨부파일 저장 한도(100MB)에 도달했습니다.");
      await client.query("INSERT INTO attachment_files(id,data) VALUES($1,$2)", [id,data]);
    });
    return;
  }
  const target = filePath(id);
  await mkdir(resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? ".local/uploads"), {
    recursive: true,
  });
  await writeFile(target, data, { flag: "wx" });
}
export async function readAttachment(id: string) {
  if (process.env.VERCEL) {
    const [file] = await query<{data:Buffer}>("SELECT data FROM attachment_files WHERE id=$1",[id]);
    if (!file) throw new Error("첨부파일을 찾을 수 없습니다.");
    return file.data;
  }
  return readFile(filePath(id));
}

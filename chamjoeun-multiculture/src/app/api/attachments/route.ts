import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser, rateLimit } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import {
  writeAttachment,
  sniffMime,
  maxAttachmentSize,
} from "@/lib/attachment-storage";
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
  if (!(await rateLimit(`attachment:${user.id}`, 50)))
    return NextResponse.json(
      { error: "잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  const length = Number(request.headers.get("content-length"));
  if (!length || length > maxAttachmentSize + 65536)
    return NextResponse.json(
      { error: "첨부파일은 10MB 이하로 등록해 주세요." },
      { status: 413 },
    );
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "파일을 확인해 주세요." },
      { status: 400 },
    );
  }
  const postId = form.get("postId"),
    file = form.get("file");
  if (
    !z.uuid().safeParse(postId).success ||
    !(file instanceof File) ||
    !file.size ||
    file.size > maxAttachmentSize
  )
    return NextResponse.json(
      { error: "게시글과 10MB 이하의 파일을 확인해 주세요." },
      { status: 400 },
    );
  const [post] = await query(
    "SELECT id FROM posts WHERE id=$1 AND deleted_at IS NULL",
    [postId],
  );
  if (!post)
    return NextResponse.json(
      { error: "게시글을 찾을 수 없습니다." },
      { status: 404 },
    );
  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(data);
  if (!mime)
    return NextResponse.json(
      { error: "PDF, JPG, PNG, WebP 파일만 첨부할 수 있습니다." },
      { status: 400 },
    );
  const id = randomUUID();
  await writeAttachment(id, data);
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO attachments(id,post_id,original_name,mime_type,size_bytes,uploaded_by) VALUES($1,$2,$3,$4,$5,$6)",
      [
        id,
        postId,
        file.name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(0, 180),
        mime,
        data.length,
        user.id,
      ],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'게시판 첨부파일 등록',$2)",
      [user.id, id],
    );
  });
  return NextResponse.json({ success: true, id }, { status: 201 });
}

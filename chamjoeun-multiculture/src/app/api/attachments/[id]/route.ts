import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, transaction } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { readAttachment } from "@/lib/attachment-storage";
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const [a] = await query(
    "SELECT a.*,p.published,p.deleted_at post_deleted_at FROM attachments a JOIN posts p ON p.id=a.post_id WHERE a.id=$1 AND a.deleted_at IS NULL",
    [id],
  );
  if (!a) return new NextResponse(null, { status: 404 });
  if (!a.published || a.post_deleted_at) {
    const user = await currentUser();
    if (user?.role !== "admin") return new NextResponse(null, { status: 404 });
  }
  let data: Buffer;
  try {
    data = await readAttachment(id);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": a.mime_type,
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(a.original_name).replace(/'/g, "%27")}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json(
      { error: "파일을 확인해 주세요." },
      { status: 400 },
    );
  await transaction(async (c) => {
    await c.query("UPDATE attachments SET deleted_at=now() WHERE id=$1", [id]);
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'첨부파일 숨김',$2)",
      [user.id, id],
    );
  });
  return NextResponse.json({ success: true });
}

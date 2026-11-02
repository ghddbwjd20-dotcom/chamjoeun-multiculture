import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (user?.role !== "admin") return new NextResponse(null, { status: 404 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const [document] = await query(
    "SELECT original_name,mime_type,data FROM agreement_documents WHERE id=$1",
    [id],
  );
  if (!document) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Length": String(document.data.length),
      "Content-Disposition": `attachment; filename="agreement"; filename*=UTF-8''${encodeURIComponent(document.original_name).replace(/'/g, "%27")}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

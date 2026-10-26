import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { certificatePdf, type DocumentSnapshot } from "@/lib/pdf";
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const [d] = await query(
    "SELECT * FROM issued_documents WHERE id=$1 AND (user_id=$2 OR $3='admin')",
    [id, user.id, user.role],
  );
  if (!d) return new NextResponse(null, { status: 404 });
  if (d.revoked_at)
    return new NextResponse("Revoked document", { status: 410 });
  const bytes = await certificatePdf(d.snapshot as DocumentSnapshot);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${d.document_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { issueDocument } from "@/lib/documents";
export async function POST(request: NextRequest) {
  const base = process.env.APP_URL ?? request.url;
  if (request.headers.get("origin") !== new URL(base).origin)
    return new NextResponse(null, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", base), 303);
  const form = await request.formData();
  const id = form.get("courseId");
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 400 });
  const result = await issueDocument(user.id, String(id), "completion");
  return result.id
    ? NextResponse.redirect(
        new URL(`/api/documents/${result.id}/pdf`, base),
        303,
      )
    : NextResponse.redirect(
        new URL(
          `/classroom?notice=${encodeURIComponent(result.error ?? "발급할 수 없습니다.")}`,
          base,
        ),
        303,
      );
}

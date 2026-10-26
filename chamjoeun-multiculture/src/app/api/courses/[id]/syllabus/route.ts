import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { syllabusPdf } from "@/lib/pdf";
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const [course] = await query(
    "SELECT c.* FROM courses c WHERE c.id=$1 AND ($2='admin' OR EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id=c.id AND e.user_id=$3 AND e.status IN ('active','completed')))",
    [id, user.role, user.id],
  );
  if (!course) return new NextResponse(null, { status: 403 });
  const lessons = await query(
    "SELECT title,position,duration_seconds FROM lessons WHERE course_id=$1 ORDER BY position",
    [id],
  );
  const bytes = await syllabusPdf(
    course as {
      title: string;
      description: string;
      instructor: string;
      completion_threshold: number;
      duration_days: number;
    },
    lessons as { title: string; position: number; duration_seconds: number }[],
  );
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="course-syllabus.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (process.env.NODE_ENV === "production")
    return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new NextResponse(null, { status: 404 });
  const [lesson] = await query(
    `SELECT l.id FROM lessons l JOIN courses c ON c.id=l.course_id JOIN enrollments e ON e.course_id=c.id AND e.user_id=$1 WHERE l.id=$2 AND c.slug='development-sample' AND l.video_key='development/institution-film.mp4' AND l.video_status='ready' AND e.status IN ('active','completed') AND e.expires_at>now()`,
    [user.id, id],
  );
  if (!lesson) return new NextResponse(null, { status: 403 });
  const data = await readFile(resolve("public/media/institution-film.mp4"));
  const size = data.length;
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  const range = request.headers.get("range");
  if (!range) {
    headers.set("Content-Length", String(size));
    return new NextResponse(new Uint8Array(data), { headers });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) {
    headers.set("Content-Range", `bytes */${size}`);
    return new NextResponse(null, { status: 416, headers });
  }
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end =
    match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  ) {
    headers.set("Content-Range", `bytes */${size}`);
    return new NextResponse(null, { status: 416, headers });
  }
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), {
    status: 206,
    headers,
  });
}

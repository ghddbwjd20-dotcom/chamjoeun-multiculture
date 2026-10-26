import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, rateLimit } from "@/lib/auth";
import { transaction } from "@/lib/db";
import {
  acceptInterval,
  mergeRanges,
  watchedSeconds,
  type Range,
} from "@/lib/progress";
const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("start"), lessonId: z.uuid() }),
  z.object({
    kind: z.literal("ping"),
    sessionId: z.uuid(),
    position: z.number().finite().min(0),
    playing: z.boolean(),
  }),
]);
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(process.env.APP_URL ?? "http://localhost:3000").origin
  )
    return NextResponse.json({ error: "접근할 수 없습니다." }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  if (!(await rateLimit(`watch:${user.id}`, 400)))
    return NextResponse.json({ error: "요청이 많습니다." }, { status: 429 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const p = schema.safeParse(body);
  if (!p.success)
    return NextResponse.json(
      { error: "잘못된 학습 정보입니다." },
      { status: 400 },
    );
  const result = await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `watch:${user.id}`,
    ]);
    const data = p.data;
    if (data.kind === "start") {
      const { rows } = await client.query(
        `SELECT l.id,lp.last_position FROM lessons l JOIN enrollments e ON e.course_id=l.course_id AND e.user_id=$1 LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1 WHERE l.id=$2 AND e.status IN ('active','completed') AND e.expires_at>now() AND l.video_status='ready' AND l.duration_seconds>0`,
        [user.id, data.lessonId],
      );
      if (!rows[0]) return null;
      await client.query("DELETE FROM watch_sessions WHERE user_id=$1", [
        user.id,
      ]);
      const r = await client.query(
        "INSERT INTO watch_sessions(user_id,lesson_id,last_position,expires_at) VALUES($1,$2,$3,now()+interval '4 hours') RETURNING id",
        [user.id, data.lessonId, Number(rows[0].last_position ?? 0)],
      );
      return {
        sessionId: r.rows[0].id,
        lastPosition: Number(rows[0].last_position ?? 0),
      };
    }
    const { rows } = await client.query(
      `SELECT s.*,l.duration_seconds,l.course_id,c.completion_threshold FROM watch_sessions s JOIN lessons l ON l.id=s.lesson_id JOIN courses c ON c.id=l.course_id JOIN enrollments e ON e.course_id=l.course_id AND e.user_id=s.user_id WHERE s.id=$1 AND s.user_id=$2 AND s.expires_at>now() AND e.status IN ('active','completed') AND e.expires_at>now() FOR UPDATE OF s,e`,
      [data.sessionId, user.id],
    );
    const s = rows[0];
    if (!s) return null;
    const elapsed = (Date.now() - new Date(s.last_ping_at).getTime()) / 1000;
    const interval = acceptInterval(
      Number(s.last_position),
      data.position,
      elapsed,
      data.playing,
      Number(s.duration_seconds),
    );
    const old = await client.query(
      "SELECT watched_ranges FROM lesson_progress WHERE user_id=$1 AND lesson_id=$2 FOR UPDATE",
      [user.id, s.lesson_id],
    );
    const ranges = mergeRanges(
      [
        ...((old.rows[0]?.watched_ranges ?? []) as Range[]),
        ...(interval ? [interval] : []),
      ],
      s.duration_seconds,
    );
    if (interval) {
      await client.query(
        "INSERT INTO learning_daily(user_id,day,seconds) VALUES($1,(now() AT TIME ZONE 'Asia/Seoul')::date,$2) ON CONFLICT(user_id,day) DO UPDATE SET seconds=learning_daily.seconds+EXCLUDED.seconds",
        [user.id, Math.min(elapsed, interval[1] - interval[0])],
      );
    }
    const seconds = watchedSeconds(ranges);
    const position = Math.min(s.duration_seconds, data.position);
    await client.query(
      `INSERT INTO lesson_progress(user_id,lesson_id,watched_ranges,watched_seconds,last_position) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,lesson_id) DO UPDATE SET watched_ranges=EXCLUDED.watched_ranges,watched_seconds=EXCLUDED.watched_seconds,last_position=EXCLUDED.last_position,updated_at=now()`,
      [user.id, s.lesson_id, JSON.stringify(ranges), seconds, position],
    );
    await client.query(
      "UPDATE watch_sessions SET last_position=$1,last_ping_at=now() WHERE id=$2",
      [position, s.id],
    );
    const stats = await client.query(
      `SELECT COALESCE(sum(l.duration_seconds),0) total,COALESCE(sum(p.watched_seconds),0) watched FROM lessons l LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.user_id=$1 WHERE l.course_id=$2`,
      [user.id, s.course_id],
    );
    const total = Number(stats.rows[0].total),
      watched = Number(stats.rows[0].watched);
    const progress = total > 0 ? Math.min(100, (watched / total) * 100) : 0;
    if (total > 0 && progress >= s.completion_threshold) {
      const done = await client.query(
        "UPDATE enrollments SET status='completed',completed_at=now() WHERE user_id=$1 AND course_id=$2 AND status='active' RETURNING id",
        [user.id, s.course_id],
      );
      if (done.rows[0])
        await client.query(
          "INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'자동 수료',$2,$3)",
          [user.id, done.rows[0].id, JSON.stringify({ progress })],
        );
    }
    return { watchedSeconds: seconds, courseProgress: Math.floor(progress) };
  });
  return result
    ? NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
    : NextResponse.json(
        { error: "수강권 또는 학습 세션이 만료되었습니다." },
        { status: 403 },
      );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { videoUrl } from "@/lib/video";
import { Player } from "@/components/player";
import { PageHeading } from "@/components/page-heading";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const [course] = await query(
    "SELECT c.*,e.expires_at FROM courses c JOIN enrollments e ON e.course_id=c.id AND e.user_id=$1 WHERE c.slug=$2 AND e.status IN ('active','completed') AND e.expires_at>now()",
    [user.id, slug],
  );
  if (!course) redirect("/classroom");
  const lessons = await query(
    "SELECT l.*,p.watched_seconds,p.last_position FROM lessons l LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.user_id=$1 WHERE l.course_id=$2 ORDER BY l.position",
    [user.id, course.id],
  );
  const { lesson } = await searchParams;
  const selected = lesson ? lessons.find((l) => l.id === lesson) : lessons[0];
  if (lesson && !selected) notFound();
  const isDevelopmentSample =
    process.env.NODE_ENV !== "production" &&
    course.slug === "development-sample" &&
    selected?.video_key === "development/institution-film.mp4";
  const src = isDevelopmentSample
    ? `/api/demo-video/${selected.id}`
    : selected?.video_status === "ready" && selected.video_key
      ? videoUrl(selected.video_key, user.id, course.expires_at)
      : null;
  return (
    <>
      <PageHeading
        eyebrow="LEARNING ROOM"
        title={course.title}
        description={selected?.title ?? "차시를 준비하고 있습니다."}
      />
      <div className="container content player-grid">
        <section>
          <Player
            key={selected?.id ?? "empty"}
            lessonId={selected?.id ?? ""}
            src={src}
          />
          <Link className="text-link" href="/classroom">
            ← 나의 강의실
          </Link>
        </section>
        <aside>
          <h2 className="section-title">차시 목록</h2>
          {lessons.map((l) => (
            <Link
              key={l.id}
              className={`player-lesson ${selected?.id === l.id ? "active" : ""}`}
              href={`/learn/${slug}?lesson=${l.id}`}
            >
              <b>
                {l.position}. {l.title}
              </b>
              <p>
                {Math.ceil(l.duration_seconds / 60)}분 · 진도{" "}
                {l.duration_seconds
                  ? Math.min(
                      100,
                      Math.floor(
                        (Number(l.watched_seconds ?? 0) / l.duration_seconds) *
                          100,
                      ),
                    )
                  : 0}
                %
              </p>
            </Link>
          ))}
          {!lessons.length && <p className="muted">등록된 차시가 없습니다.</p>}
        </aside>
      </div>
    </>
  );
}

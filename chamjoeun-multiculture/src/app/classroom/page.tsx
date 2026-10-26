import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { learningCourses } from "@/lib/learning";
import { PageHeading } from "@/components/page-heading";
import {
  ClassroomDashboard,
  type LessonRow,
} from "@/components/classroom-dashboard";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const notice = (await searchParams).notice?.slice(0, 200);
  const user = await requireUser();
  const courses = await learningCourses(user.id);
  const lessons = await query(
    "SELECT l.*,COALESCE(p.watched_seconds,0) watched_seconds,COALESCE(p.last_position,0) last_position,p.updated_at FROM lessons l JOIN enrollments e ON e.course_id=l.course_id AND e.user_id=$1 AND e.status<>'cancelled' LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.user_id=$1 ORDER BY l.position",
    [user.id],
  );
  const daily = await query(
    "SELECT to_char(d.day,'YYYY-MM-DD') AS day_label,COALESCE(a.seconds,0) seconds FROM generate_series((now() AT TIME ZONE 'Asia/Seoul')::date-6,(now() AT TIME ZONE 'Asia/Seoul')::date,interval '1 day') d(day) LEFT JOIN learning_daily a ON a.day=d.day::date AND a.user_id=$1 ORDER BY d.day",
    [user.id],
  );
  const documents = await query(
    "SELECT d.id,d.document_number,d.kind,d.issued_at,c.title FROM issued_documents d JOIN courses c ON c.id=d.course_id WHERE d.user_id=$1 AND d.revoked_at IS NULL ORDER BY d.issued_at DESC",
    [user.id],
  );
  const notices = await query(
    "SELECT id,title,created_at FROM posts WHERE published=true AND deleted_at IS NULL AND category='공지사항' ORDER BY pinned DESC,created_at DESC LIMIT 3",
  );
  return (
    <>
      <PageHeading
        eyebrow="MY CLASSROOM"
        title="나의 강의실"
        description="학습 진행률과 차시별 현황을 확인하고 마지막 학습에서 이어가세요. 수료와 발급문서까지 한곳에서 관리합니다."
      />
      <div className="container content">
        {notice && (
          <p className="alert" style={{ marginBottom: 25 }}>
            {notice}
          </p>
        )}
        <ClassroomDashboard
          name={user.name}
          courses={courses}
          lessons={
            lessons.map((l) => ({
              ...l,
              watched_seconds: Number(l.watched_seconds),
              last_position: Number(l.last_position),
              updated_at: l.updated_at?.toISOString() ?? null,
            })) as LessonRow[]
          }
          daily={
            daily.map((d) => ({ ...d, day: d.day_label, seconds: Number(d.seconds) })) as {
              day: string;
              seconds: number;
            }[]
          }
          documents={
            documents.map((d) => ({
              ...d,
              issued_at: d.issued_at.toISOString(),
            })) as {
              id: string;
              document_number: string;
              kind: string;
              title: string;
              issued_at: string;
            }[]
          }
          notices={
            notices.map((n) => ({
              ...n,
              created_at: n.created_at.toISOString(),
            })) as { id: string; title: string; created_at: string }[]
          }
        />
      </div>
    </>
  );
}

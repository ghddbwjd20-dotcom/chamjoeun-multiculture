import { query } from "@/lib/db";
export type LearningCourse = {
  id: string;
  enrollment_id: string;
  slug: string;
  title: string;
  category: string;
  instructor: string;
  status: string;
  enrolled_at: string;
  expires_at: string;
  completed_at: string | null;
  completion_threshold: number;
  watched: number;
  duration: number;
  lesson_count: number;
  completed_lessons: number;
  last_studied_at: string | null;
  progress: number;
};
export async function learningCourses(
  userId: string,
): Promise<LearningCourse[]> {
  const rows = await query(
    `SELECT c.id,e.id enrollment_id,c.slug,c.title,c.category,c.instructor,e.status,e.enrolled_at,e.expires_at,e.completed_at,c.completion_threshold,COALESCE(sum(p.watched_seconds),0) watched,COALESCE(sum(l.duration_seconds),0) duration,count(l.id) lesson_count,count(l.id) FILTER(WHERE l.duration_seconds>0 AND p.watched_seconds>=l.duration_seconds*c.completion_threshold/100.0) completed_lessons,max(p.updated_at) last_studied_at FROM enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN lessons l ON l.course_id=c.id LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.user_id=e.user_id WHERE e.user_id=$1 AND e.status<>'cancelled' GROUP BY c.id,e.id ORDER BY max(p.updated_at) DESC NULLS LAST,e.enrolled_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    ...r,
    id: r.id,
    enrollment_id: r.enrollment_id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    instructor: r.instructor,
    status: r.status,
    enrolled_at: r.enrolled_at.toISOString(),
    expires_at: r.expires_at.toISOString(),
    completed_at: r.completed_at?.toISOString() ?? null,
    completion_threshold: r.completion_threshold,
    watched: Number(r.watched),
    duration: Number(r.duration),
    lesson_count: Number(r.lesson_count),
    completed_lessons: Number(r.completed_lessons),
    last_studied_at: r.last_studied_at?.toISOString() ?? null,
    progress:
      Number(r.duration) > 0
        ? Math.min(
            100,
            Math.floor((Number(r.watched) / Number(r.duration)) * 100),
          )
        : 0,
  }));
}
export function formatStudyTime(seconds: number) {
  return seconds < 60
    ? `${Math.floor(seconds)}초`
    : `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)}시간 ` : ""}${Math.floor((seconds % 3600) / 60)}분`;
}

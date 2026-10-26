import { notFound } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import type { Course } from "@/lib/data";
import { CourseForm } from "@/components/course-form";
import { ActionForm } from "@/components/form";
import { addLesson } from "@/app/admin/actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [c] = await query<Course>("SELECT * FROM courses WHERE id=$1", [id]);
  if (!c) notFound();
  const lessons = await query(
    "SELECT * FROM lessons WHERE course_id=$1 ORDER BY position",
    [id],
  );
  return (
    <div className="split">
      <section className="info-card">
        <h2 className="section-title">과정 수정</h2>
        <CourseForm course={c} />
      </section>
      <section className="stack">
        <div className="info-card">
          <h2 className="section-title">차시 목록</h2>
          {lessons.length ? (
            <ol className="lesson-list">
              {lessons.map((l) => (
                <li key={l.id}>
                  <span>
                    {l.position}. {l.title}
                    <br />
                    <small className="muted">
                      {l.duration_seconds}초 · {l.video_status}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>아직 차시가 없습니다.</p>
          )}
        </div>
        <div className="info-card">
          <h2 className="section-title">차시 추가</h2>
          <ActionForm action={addLesson} label="차시 추가">
            <input name="course_id" type="hidden" value={id} />
            <label>
              차시명
              <input name="title" minLength={2} maxLength={150} required />
            </label>
            <label>
              순서
              <input
                name="position"
                type="number"
                min={1}
                max={1000}
                required
                defaultValue={lessons.length + 1}
              />
            </label>
            <label>
              영상 길이 (초)
              <input
                name="duration_seconds"
                type="number"
                min={1}
                max={86400}
                required
              />
            </label>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}

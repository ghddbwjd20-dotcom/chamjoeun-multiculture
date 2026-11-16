import Link from "next/link";
import { VideoUpload } from "@/components/video-upload";
import { storageConfigured } from "@/lib/storage";
import { notFound } from "next/navigation";
import { z } from "zod";
import { query } from "@/lib/db";
import type { Course } from "@/lib/data";
import { CourseForm } from "@/components/course-form";
import { ActionForm } from "@/components/form";
import {
  addLesson,
  updateLesson,
  deleteLesson,
  deleteDraftCourse,
} from "@/app/admin/actions";
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
    "SELECT l.*, j.id job_id, j.status job_status FROM lessons l LEFT JOIN LATERAL (SELECT id,status FROM video_jobs WHERE lesson_id=l.id ORDER BY created_at DESC LIMIT 1) j ON true WHERE l.course_id=$1 ORDER BY l.position",
    [id],
  );
  const storageReady = storageConfigured();
  const positions = new Set(lessons.map((lesson) => Number(lesson.position)));
  const nextPosition = Array.from(
    { length: 1000 },
    (_, index) => index + 1,
  ).find((position) => !positions.has(position));
  return (
    <div className="stack">
      <div>
        <Link href="/admin/courses" className="text-link">
          ← 과정 목록
        </Link>
        <h2 className="section-title">{c.title}</h2>
        <p>과정 정보 저장 → 차시 추가 → MP4 등록 → 재생 확인 후 공개</p>
      </div>
      <details className="info-card">
        <summary>과정 정보 수정 · 공개 / 보관</summary>
        <CourseForm course={c} />
        {c.status === "draft" && !lessons.length && (
          <ActionForm action={deleteDraftCourse} label="작성 중 과정 삭제">
            <input name="id" type="hidden" value={id} />
            <label className="checkbox">
              <input name="confirm" type="checkbox" required />이 과정의 삭제를
              확인합니다.
            </label>
          </ActionForm>
        )}
      </details>
      <section id="lessons" className="info-card">
        <h3>차시 추가</h3>
        <p>
          차시명과 순서를 입력하세요. 영상 길이는 변환할 때 자동으로 입력됩니다.
        </p>
        {nextPosition ? (
          <ActionForm action={addLesson} label="차시 추가">
            <input name="course_id" type="hidden" value={id} />
            <div className="split">
              <label>
                차시명
                <input
                  name="title"
                  placeholder="예: 1강 과정 소개"
                  minLength={2}
                  maxLength={150}
                  required
                />
              </label>
              <label>
                순서
                <input
                  name="position"
                  type="number"
                  min={1}
                  max={1000}
                  defaultValue={nextPosition}
                  required
                />
              </label>
            </div>
          </ActionForm>
        ) : (
          <p>차시를 최대 1,000개까지 등록할 수 있습니다.</p>
        )}
      </section>
      <section className="stack">
        <h3>차시 및 영상 {lessons.length}개</h3>
        {!storageReady && (
          <p className="alert">
            영상 저장소 설정을 완료하면 MP4를 업로드할 수 있습니다.{" "}
            <Link href="/admin/integrations">연동 상태 확인 →</Link>
          </p>
        )}
        {!lessons.length && (
          <p>첫 차시를 추가하면 여기에 영상 등록 칸이 표시됩니다.</p>
        )}
        {lessons.map((lesson) => (
          <article className="info-card stack" key={lesson.id}>
            <div>
              <span className="badge">
                {
                  (
                    {
                      pending: "영상 미등록",
                      processing: "변환 중",
                      ready: "재생 준비 완료",
                      failed: "변환 실패",
                    } as Record<string, string>
                  )[lesson.video_status]
                }
              </span>
              <h4>
                {lesson.position}. {lesson.title}
              </h4>
            </div>
            <VideoUpload
              lessonId={lesson.id}
              jobId={lesson.job_id}
              status={lesson.job_status ?? lesson.video_status}
              uploadEnabled={storageReady}
            />
            <details>
              <summary>차시 수정 · 삭제</summary>
              <ActionForm action={updateLesson} label="차시 수정 저장">
                <input name="id" type="hidden" value={lesson.id} />
                <label>
                  차시명
                  <input
                    name="title"
                    defaultValue={lesson.title}
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </label>
                <label>
                  순서
                  <input
                    name="position"
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={lesson.position}
                    required
                  />
                </label>
              </ActionForm>
              <ActionForm action={deleteLesson} label="차시 삭제">
                <input name="id" type="hidden" value={lesson.id} />
                <label className="checkbox">
                  <input name="confirm" type="checkbox" required />이 차시를
                  삭제합니다.
                </label>
              </ActionForm>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}

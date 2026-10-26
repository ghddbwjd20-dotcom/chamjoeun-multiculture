import Link from "next/link";
import { CheckoutButton } from "@/components/checkout-button";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import type { Course } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { ActionForm } from "@/components/form";
import { enroll } from "../actions";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c] = await query<Course>(
    "SELECT * FROM courses WHERE slug=$1 AND status='published'",
    [slug],
  );
  if (!c) notFound();
  const lessons = await query(
    "SELECT id,title,duration_seconds FROM lessons WHERE course_id=$1 ORDER BY position",
    [c.id],
  );
  return (
    <>
      <PageHeading
        eyebrow={c.category}
        title={c.title}
        description={c.summary}
      />
      <div className="container content detail-grid">
        <div className="prose">
          <h2>과정 소개</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{c.description || c.summary}</p>
          {c.slug === "development-sample" && (
            <section style={{ margin: "30px 0" }}>
              <h2>샘플 영상 미리보기</h2>
              <video
                src="/media/institution-film.mp4"
                poster="/images/learning-space.jpg"
                controls
                playsInline
                preload="metadata"
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#142d49",
                }}
                aria-label="개발 확인용 소개 샘플 영상"
              />
              <p style={{ fontSize: 11, marginTop: 10 }}>
                영상 재생을 확인하기 위한 약 12초의 소개 비주얼입니다. 실제 강의
                콘텐츠가 아닙니다.
              </p>
            </section>
          )}
          <h2>커리큘럼</h2>
          {lessons.length ? (
            <ol className="lesson-list">
              {lessons.map((l, i) => (
                <li key={l.id}>
                  <span>
                    {String(i + 1).padStart(2, "0")}　{l.title}
                  </span>
                  <span>{Math.ceil(l.duration_seconds / 60)}분</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>상세 커리큘럼을 준비하고 있습니다.</p>
          )}
          <h2>수료 안내</h2>
          <p>
            실제 시청 구간을 기준으로 진도를 계산합니다. 기본 수료 기준은 과정
            진도 {c.completion_threshold}%이며, 반복 시청과 건너뛴 구간은 중복
            인정하지 않습니다.
          </p>
        </div>
        <aside className="info-card">
          <span className="badge">{c.price ? "유료과정" : "무료과정"}</span>
          <p className="course-price" style={{ margin: "20px 0" }}>
            {c.price ? `${c.price.toLocaleString()}원` : "무료"}
          </p>
          <p>
            강사: {c.instructor || "안내 준비 중"}
            <br />
            수강기간: 신청 후 {c.duration_days}일<br />총 {lessons.length}개
            차시
          </p>
          {c.price > 0 ? (
            <CheckoutButton courseId={c.id} />
          ) : (
            <ActionForm
              action={enroll}
              label="무료 수강신청"
              className="actions"
            >
              <input type="hidden" name="courseId" value={c.id} />
            </ActionForm>
          )}
          <Link href="/contact" className="text-link">
            과정 문의 →
          </Link>
        </aside>
      </div>
    </>
  );
}

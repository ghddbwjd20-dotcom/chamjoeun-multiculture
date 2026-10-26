import Link from "next/link";
import { courses } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = (await searchParams).q?.slice(0, 100) ?? "";
  const list = await courses(q);
  return (
    <>
      <PageHeading
        eyebrow="ONLINE COURSES"
        title="나에게 맞는 배움을 찾아보세요"
        description="자체 운영 온라인 교육과정을 확인합니다. KIIP 과정조회는 공식 사회통합정보망을 이용해 주세요."
      />
      <div className="container content">
        <form className="search">
          <input
            name="q"
            aria-label="과정 검색"
            placeholder="과정명이나 분야를 검색하세요"
            defaultValue={q}
            maxLength={100}
          />
          <button className="button primary">검색</button>
        </form>
        {list.length ? (
          <div className="course-grid">
            {list.map((c) => (
              <Link
                href={`/courses/${c.slug}`}
                key={c.id}
                className="course-card"
              >
                <span className="badge">{c.category}</span>
                <h2>{c.title}</h2>
                <p>{c.summary}</p>
                <div className="course-meta">
                  <span>
                    {c.instructor || "강사 안내 준비 중"} · {c.lesson_count}개
                    차시
                  </span>
                  <span>{c.duration_days}일</span>
                </div>
                <div className="course-price">
                  {c.price === 0 ? "무료" : `${c.price.toLocaleString()}원`}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>
              {q ? "검색 결과가 없습니다" : "새로운 배움을 준비하고 있습니다"}
            </h2>
            <p>
              {q
                ? "다른 검색어로 다시 찾아보세요."
                : "개설 과정이 등록되면 이곳에서 확인하고 신청할 수 있습니다."}
            </p>
            <Link href="/contact" className="text-link">
              교육과정 문의 →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

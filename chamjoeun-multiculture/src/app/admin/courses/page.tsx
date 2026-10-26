import Link from "next/link";
import { query } from "@/lib/db";
import { CourseForm } from "@/components/course-form";
export default async function Page() {
  const courses = await query("SELECT * FROM courses ORDER BY created_at DESC");
  return (
    <div className="split">
      <section>
        <h2 className="section-title">교육과정</h2>
        {courses.length ? (
          <div className="stack">
            {courses.map((c) => (
              <Link
                href={`/admin/courses/${c.id}`}
                key={c.id}
                className="info-card"
              >
                <span className="badge">
                  {c.status === "published"
                    ? "공개"
                    : c.status === "draft"
                      ? "작성 중"
                      : "보관"}
                </span>
                <h3 style={{ marginTop: 15 }}>{c.title}</h3>
                <p>
                  {c.category} ·{" "}
                  {c.price ? `${c.price.toLocaleString()}원` : "무료"}
                </p>
                <span className="text-link">과정·차시 관리 →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">
            등록한 과정이 없습니다. 오른쪽에서 첫 과정을 등록하세요.
          </p>
        )}
      </section>
      <section className="info-card">
        <h2 className="section-title">새 과정 등록</h2>
        <CourseForm />
      </section>
    </div>
  );
}

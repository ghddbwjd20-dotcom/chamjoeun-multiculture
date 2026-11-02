import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeading } from "@/components/page-heading";

const pageSize = 10;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const requested = Number(params.page ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0
      ? Math.min(requested, 1000000)
      : 1;
  const inquiries = await query(
    `SELECT id,subject,message,status,answer,answered_at,created_at FROM inquiries
     WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3`,
    [user.id, pageSize + 1, (page - 1) * pageSize],
  );
  const date = (value: Date) =>
    value.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <>
      <PageHeading
        eyebrow="MY INQUIRIES"
        title="내 문의"
        description="로그인한 상태에서 접수한 문의와 기관의 답변을 확인합니다."
      />
      <div className="container content">
        <nav className="section-links">
          <Link href="/mypage">마이페이지</Link>
          <Link href="/contact">새 문의 작성</Link>
        </nav>
        <div className="stack">
          {inquiries.slice(0, pageSize).map((inquiry) => (
            <section className="info-card" key={inquiry.id}>
              <span className="badge">
                {inquiry.status === "answered" ? "답변 완료" : "답변 대기"}
              </span>
              <h2 style={{ marginTop: 15 }}>{inquiry.subject}</h2>
              <p className="muted">접수일 {date(inquiry.created_at)}</p>
              <p style={{ whiteSpace: "pre-wrap", margin: "22px 0" }}>
                {inquiry.message}
              </p>
              {inquiry.status === "answered" && inquiry.answer && (
                <div className="detail-section">
                  <h3>기관 답변</h3>
                  {inquiry.answered_at && (
                    <p className="muted">{date(inquiry.answered_at)}</p>
                  )}
                  <p style={{ whiteSpace: "pre-wrap", marginTop: 15 }}>
                    {inquiry.answer}
                  </p>
                </div>
              )}
            </section>
          ))}
          {!inquiries.length && (
            <p className="muted">
              이 페이지에 문의가 없습니다. 로그인 전에 접수한 문의는 목록에
              표시되지 않습니다.
            </p>
          )}
        </div>
        <nav
          className="section-links"
          aria-label="문의 목록 페이지"
          style={{ marginTop: 24 }}
        >
          {page > 1 && (
            <Link href={`/mypage/inquiries?page=${page - 1}`}>이전 페이지</Link>
          )}
          <span aria-current="page">{page}페이지</span>
          {inquiries.length > pageSize && (
            <Link href={`/mypage/inquiries?page=${page + 1}`}>다음 페이지</Link>
          )}
        </nav>
      </div>
    </>
  );
}

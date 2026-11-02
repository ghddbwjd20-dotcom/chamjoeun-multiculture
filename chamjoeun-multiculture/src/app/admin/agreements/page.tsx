import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatAgreementDate } from "@/lib/agreements";

export default async function Page() {
  await requireAdmin();
  const agreements = await query(`SELECT a.*,p.title,p.published,p.deleted_at,
    (SELECT jsonb_agg(jsonb_build_object('id',d.id,'name',d.original_name,'bytes',d.size_bytes) ORDER BY d.source_path)
     FROM agreement_documents d WHERE d.agreement_id=a.id) documents
    FROM agreements a JOIN posts p ON p.id=a.post_id ORDER BY a.signed_on DESC,a.source_key`);
  return (
    <>
      <h2 className="section-title">업무협약 원본·검수</h2>
      <p className="muted">
        공개 요약은 기관소식에서 관리합니다. 아래 원본과 행사 사진은 관리자만
        다운로드할 수 있습니다.
      </p>
      <div className="stack" style={{ marginTop: 24 }}>
        {agreements.map((agreement) => (
          <section className="info-card" key={agreement.id}>
            <span className="badge">
              {agreement.published && !agreement.deleted_at
                ? "요약 공개"
                : "요약 비공개"}{" "}
              ·{" "}
              {agreement.review_status === "needs_review"
                ? "확인 필요"
                : "자료 대조 완료"}
            </span>
            <h3 style={{ marginTop: 16 }}>{agreement.title}</h3>
            <p>협약일 {formatAgreementDate(agreement.signed_on)}</p>
            <p className="muted">
              협약 당사자: {agreement.parties.join(" / ")}
            </p>
            {agreement.review_note && (
              <p className="alert" style={{ marginTop: 16 }}>
                {agreement.review_note}
              </p>
            )}
            <div className="section-links">
              <Link href={`/admin/posts/${agreement.post_id}`}>
                요약·공개 여부 편집
              </Link>
              {agreement.published && !agreement.deleted_at && (
                <Link href={`/news/${agreement.post_id}`}>공개 글 보기</Link>
              )}
            </div>
            <ul>
              {(agreement.documents ?? []).map(
                (document: { id: string; name: string; bytes: number }) => (
                  <li key={document.id}>
                    <a href={`/api/admin/agreements/${document.id}`} download>
                      {document.name}
                    </a>{" "}
                    · {(document.bytes / 1024 ** 2).toFixed(1)}MB
                  </li>
                ),
              )}
            </ul>
          </section>
        ))}
        {!agreements.length && <p>등록된 협약 자료가 없습니다.</p>}
      </div>
    </>
  );
}

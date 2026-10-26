import { query } from "@/lib/db";
import { ActionForm } from "@/components/form";
import { answerInquiry } from "../actions";
export default async function Page() {
  const list = await query(
    "SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 100",
  );
  return (
    <>
      <h2 className="section-title">문의 관리</h2>
      <div className="stack">
        {list.map((i) => (
          <section className="info-card" key={i.id}>
            <span className="badge">
              {i.status === "answered" ? "답변 기록 완료" : "답변 대기"}
            </span>
            <h3 style={{ marginTop: 15 }}>{i.subject}</h3>
            <p className="muted">
              {i.name} · <a href={`mailto:${i.email}`}>{i.email}</a> ·{" "}
              {new Date(i.created_at).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </p>
            <p style={{ whiteSpace: "pre-wrap", margin: "22px 0" }}>
              {i.message}
            </p>
            <ActionForm action={answerInquiry} label="답변 기록 저장">
              <input name="id" type="hidden" value={i.id} />
              <label>
                관리자 답변
                <textarea
                  name="answer"
                  defaultValue={i.answer ?? ""}
                  minLength={5}
                  maxLength={5000}
                  required
                />
              </label>
            </ActionForm>
          </section>
        ))}
        {!list.length && <p className="muted">접수된 문의가 없습니다.</p>}
      </div>
    </>
  );
}

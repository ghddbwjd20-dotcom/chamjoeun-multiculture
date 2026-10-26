import { query } from "@/lib/db";
import { contactSettings } from "@/lib/site-settings";
import { ActionForm } from "@/components/form";
import { saveContact, savePromotion, hidePromotion } from "./actions";
export default async function Page() {
  const c = await contactSettings();
  const promotions = await query(
    "SELECT * FROM site_promotions ORDER BY starts_at DESC LIMIT 50",
  );
  return (
    <>
      <h2 className="section-title">기관 기본정보·배너·팝업</h2>
      <div className="split">
        <section className="info-card">
          <h3>기관 기본정보</h3>
          <ActionForm action={saveContact} label="기관정보 저장">
            {[
              ["name", "기관명"],
              ["phone", "대표전화"],
              ["email", "이메일"],
              ["address", "주소"],
              ["privacyOfficer", "개인정보 보호책임자"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  name={key}
                  defaultValue={c[key as keyof typeof c]}
                  required
                />
              </label>
            ))}
          </ActionForm>
        </section>
        <section className="info-card">
          <h3>배너·팝업 등록</h3>
          <ActionForm action={savePromotion} label="등록">
            <label>
              유형
              <select name="kind">
                <option value="banner">안내 배너</option>
                <option value="popup">팝업</option>
              </select>
            </label>
            <label>
              제목
              <input name="title" maxLength={100} required />
            </label>
            <label>
              내용
              <textarea name="body" maxLength={1000} />
            </label>
            <label>
              내부 연결 주소
              <input name="href" defaultValue="/news" required />
            </label>
            <label>
              노출 시작 (한국시간)
              <input name="starts_at" type="datetime-local" required />
            </label>
            <label>
              노출 종료 (한국시간)
              <input name="ends_at" type="datetime-local" required />
            </label>
            <label className="checkbox">
              <input name="active" type="checkbox" />
              <span>지정 기간에 노출</span>
            </label>
          </ActionForm>
        </section>
      </div>
      <div className="stack" style={{ marginTop: 35 }}>
        {promotions.map((p) => (
          <div className="info-card" key={p.id}>
            <h3>{p.title}</h3>
            <p>
              {p.kind} · {p.active ? "활성" : "중지"} ·{" "}
              {new Date(p.starts_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}{" "}
              ~{" "}
              {new Date(p.ends_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
            </p>
            {p.active && (
              <ActionForm action={hidePromotion} label="노출 중지">
                <input name="id" type="hidden" value={p.id} />
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

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
              ["mobile", "추가 연락처 (휴대전화)"],
              ["email", "이메일"],
              ["address", "주소"],
              ["privacyOfficer", "개인정보 보호책임자"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  name={key}
                  defaultValue={c[key as keyof typeof c]}
                  required={key !== "mobile"}
                />
              </label>
            ))}
            <h4>결제 심사용 사업자 정보</h4>
            <p className="muted">
              사업자등록증과 동일하게 입력해 주세요. 저장하면 푸터에 표시됩니다.
            </p>
            <label>
              대표자명
              <input
                name="representative"
                maxLength={60}
                defaultValue={c.representative}
              />
            </label>
            <label>
              사업자등록번호
              <input
                name="businessNumber"
                maxLength={12}
                placeholder="000-00-00000"
                defaultValue={c.businessNumber}
              />
            </label>
            <label>
              통신판매업 신고번호 (해당 시)
              <input
                name="salesRegistration"
                maxLength={80}
                defaultValue={c.salesRegistration}
              />
            </label>
            <label>
              취소·환불 안내
              <textarea
                name="refundPolicy"
                rows={7}
                maxLength={6000}
                defaultValue={c.refundPolicy}
                placeholder="기관에서 확정한 신청 방법, 수강 시작 전후 환불 기준, 처리 절차를 입력해 주세요."
              />
            </label>
            <p className="muted">
              저장한 환불 안내는 이용약관과 유료 과정 상세에 표시됩니다.
            </p>
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

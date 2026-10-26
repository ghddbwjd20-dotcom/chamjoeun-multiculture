import { query } from "@/lib/db";
import { ActionForm } from "@/components/form";
import { refundOrder, reconcileOrder } from "./actions";
export default async function Page() {
  const orders = await query(
    "SELECT o.*,u.name,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100",
  );
  return (
    <>
      <h2 className="section-title">결제·전체취소 관리</h2>
      {!process.env.TOSS_SECRET_KEY && (
        <p className="alert">
          토스페이먼츠 서버키가 설정되지 않았습니다. 실제 승인·취소는 실행하지
          않습니다.
        </p>
      )}
      <div className="stack" style={{ marginTop: 25 }}>
        {orders.map((o) => (
          <section className="info-card" key={o.id}>
            <span className="badge">{o.status}</span>
            <h3 style={{ marginTop: 15 }}>{o.course_title}</h3>
            <p>
              {o.name} · {o.email} · {o.amount.toLocaleString()}원<br />
              주문번호 {o.id}
            </p>
            <div className="split" style={{ marginTop: 20 }}>
              <ActionForm action={reconcileOrder} label="PG 상태 다시 조회">
                <input name="id" type="hidden" value={o.id} />
              </ActionForm>
              {o.status === "paid" && (
                <ActionForm action={refundOrder} label="전체취소·수강권 종료">
                  <input name="id" type="hidden" value={o.id} />
                  <label>
                    취소 사유
                    <input
                      name="reason"
                      minLength={5}
                      maxLength={200}
                      required
                    />
                  </label>
                </ActionForm>
              )}
            </div>
          </section>
        ))}
        {!orders.length && (
          <p className="muted">등록된 결제 내역이 없습니다.</p>
        )}
      </div>
    </>
  );
}

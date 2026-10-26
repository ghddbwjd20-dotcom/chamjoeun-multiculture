import { query, transaction } from "@/lib/db";
function authorization() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("결제 연동 설정이 필요합니다.");
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}
async function toss(path: string, body?: unknown, key?: string) {
  const r = await fetch(`https://api.tosspayments.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const result = await r.json();
  if (!r.ok)
    throw new Error(
      `결제 처리 확인이 필요합니다. (${result.code ?? r.status})`,
    );
  return result;
}
export async function confirmPayment(
  userId: string,
  orderId: string,
  paymentKey: string,
  amount: number,
) {
  const [order] = await query(
    "SELECT * FROM orders WHERE id=$1 AND user_id=$2",
    [orderId, userId],
  );
  if (!order || order.amount !== amount)
    throw new Error("주문 또는 결제금액을 확인할 수 없습니다.");
  if (order.status === "paid") return;
  if (order.status === "cancelled") throw new Error("취소된 주문입니다.");
  if (order.payment_key && order.payment_key !== paymentKey)
    throw new Error("결제 정보가 일치하지 않습니다.");
  await query(
    "UPDATE orders SET payment_key=$1 WHERE id=$2 AND payment_key IS NULL",
    [paymentKey, orderId],
  );
  const result = await toss(
    "/payments/confirm",
    { paymentKey, orderId, amount },
    `confirm-${orderId}`,
  );
  if (
    result.orderId !== orderId ||
    result.totalAmount !== amount ||
    result.status !== "DONE"
  )
    throw new Error("결제 승인 정보가 일치하지 않습니다.");
  await grantPaidOrder(orderId, paymentKey, amount);
}
async function grantPaidOrder(
  orderId: string,
  paymentKey: string,
  amount: number,
) {
  await transaction(async (c) => {
    const r = await c.query(
      "SELECT o.*,c.duration_days FROM orders o JOIN courses c ON c.id=o.course_id WHERE o.id=$1 FOR UPDATE OF o",
      [orderId],
    );
    const order = r.rows[0];
    if (!order || order.amount !== amount || order.status === "cancelled")
      throw new Error("주문 정보가 일치하지 않습니다.");
    if (order.status === "paid") return;
    await c.query(
      "UPDATE orders SET status='paid',paid_at=now(),payment_key=$1 WHERE id=$2",
      [paymentKey, orderId],
    );
    await c.query(
      "INSERT INTO enrollments(user_id,course_id,expires_at) VALUES($1,$2,now()+($3*interval '1 day')) ON CONFLICT(user_id,course_id) DO UPDATE SET status='active',enrolled_at=now(),expires_at=EXCLUDED.expires_at,completed_at=NULL WHERE enrollments.status='cancelled'",
      [order.user_id, order.course_id, order.duration_days],
    );
    await c.query(
      "INSERT INTO payment_events(id,order_id,type,payload) VALUES($1,$2,'approved',$3) ON CONFLICT DO NOTHING",
      [`approved:${paymentKey}`, orderId, JSON.stringify({ amount })],
    );
    await c.query(
      "INSERT INTO notifications(user_id,title,body,href) VALUES($1,'결제 완료','결제가 확인되어 수강권한이 부여되었습니다.','/classroom')",
      [order.user_id],
    );
    await c.query(
      "INSERT INTO delivery_jobs(user_id,channel,subject,body) VALUES($1,'email','참조은다문화 결제 완료','결제가 완료되었습니다. 나의 강의실에서 과정을 확인해 주세요.')",
      [order.user_id],
    );
  });
}
export async function reconcilePayment(orderId: string) {
  const [o] = await query("SELECT * FROM orders WHERE id=$1", [orderId]);
  if (!o?.payment_key) throw new Error("결제키가 아직 접수되지 않았습니다.");
  const result = await toss(`/payments/${encodeURIComponent(o.payment_key)}`);
  if (result.orderId !== orderId || result.totalAmount !== o.amount)
    throw new Error("조회된 결제 정보가 일치하지 않습니다.");
  if (result.status === "DONE")
    await grantPaidOrder(orderId, o.payment_key, o.amount);
  else if (result.status === "CANCELED")
    await transaction(async (c) => {
      await c.query("UPDATE orders SET status='cancelled' WHERE id=$1", [
        orderId,
      ]);
      await c.query(
        "UPDATE enrollments SET status='cancelled' WHERE user_id=$1 AND course_id=$2",
        [o.user_id, o.course_id],
      );
    });
  return result.status as string;
}
export async function cancelPayment(
  orderId: string,
  actorId: string,
  reason: string,
) {
  const [o] = await query("SELECT * FROM orders WHERE id=$1", [orderId]);
  if (o?.status === "cancelled") return;
  if (!o || o.status !== "paid" || !o.payment_key)
    throw new Error("승인 완료된 결제만 전체취소할 수 있습니다.");
  const [refund] = await query(
    "INSERT INTO refunds(order_id,reason,requested_by) VALUES($1,$2,$3) ON CONFLICT(order_id) DO UPDATE SET reason=EXCLUDED.reason RETURNING id",
    [orderId, reason, actorId],
  );
  const result = await toss(
    `/payments/${encodeURIComponent(o.payment_key)}/cancel`,
    { cancelReason: reason },
    `refund-${refund.id}`,
  );
  if (result.status !== "CANCELED")
    throw new Error("전체취소 결과를 확인해야 합니다.");
  await transaction(async (c) => {
    await c.query("UPDATE orders SET status='cancelled' WHERE id=$1", [
      orderId,
    ]);
    await c.query("UPDATE refunds SET status='completed' WHERE order_id=$1", [
      orderId,
    ]);
    await c.query(
      "UPDATE enrollments SET status='cancelled' WHERE user_id=$1 AND course_id=$2",
      [o.user_id, o.course_id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'결제 전체취소',$2,$3)",
      [actorId, orderId, JSON.stringify({ reason })],
    );
    await c.query(
      "INSERT INTO notifications(user_id,title,body,href) VALUES($1,'결제 전체취소','전체취소가 확인되어 해당 수강권한이 종료되었습니다.','/mypage')",
      [o.user_id],
    );
  });
}

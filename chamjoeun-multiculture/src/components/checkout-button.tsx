"use client";
import { useState } from "react";
import { createCheckout } from "@/app/payment-actions";
type TossWindow = Window & {
  TossPayments?: (key: string) => {
    payment: (options: { customerKey: string }) => {
      requestPayment: (options: unknown) => Promise<void>;
    };
  };
};
export function CheckoutButton({ courseId }: { courseId: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div style={{ marginTop: 25 }}>
      <button
        className="button primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await createCheckout(courseId);
            if ("error" in result) {
              setError(result.error ?? "결제 준비 중입니다.");
              return;
            }
            if (!(window as TossWindow).TossPayments)
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://js.tosspayments.com/v2/standard";
                script.onload = () => resolve();
                script.onerror = () =>
                  reject(new Error("결제창을 불러오지 못했습니다."));
                document.head.appendChild(script);
              });
            const payment = (window as TossWindow).TossPayments!(
              result.clientKey,
            ).payment({ customerKey: result.customerKey });
            await payment.requestPayment({
              method: "CARD",
              amount: { currency: "KRW", value: result.amount },
              orderId: result.orderId,
              orderName: result.title,
              successUrl: `${result.base}/api/payments/confirm`,
              failUrl: `${result.base}/payment-result?status=failed`,
              customerEmail: result.email,
              customerName: result.name,
            });
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "결제를 진행하지 못했습니다.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "결제 준비 중…" : "카드결제·수강신청"}
      </button>
      {error && (
        <p className="alert error" role="alert" style={{ marginTop: 15 }}>
          {error}
        </p>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export function PushPreference({ publicKey }: { publicKey: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker
      .getRegistration("/")
      .then(async (registration) => {
        setSubscribed(
          Boolean(await registration?.pushManager.getSubscription()),
        );
      })
      .catch(() => {});
  }, []);
  async function save(method: string, body: unknown) {
    const response = await fetch("/api/push", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("알림 설정을 저장하지 못했습니다.");
  }
  async function toggle() {
    setBusy(true);
    try {
      if (subscribed) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const sub = await registration?.pushManager.getSubscription();
        if (sub) {
          await save("DELETE", { endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        setSubscribed(false);
        setMessage("이 브라우저 알림을 해제했습니다.");
      } else {
        if ((await Notification.requestPermission()) !== "granted")
          throw new Error("브라우저 설정에서 알림을 허용해 주세요.");
        await navigator.serviceWorker.register("/push-sw.js");
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        const sub =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          }));
        try {
          await save("POST", sub.toJSON());
        } catch (error) {
          if (!existing) await sub.unsubscribe();
          throw error;
        }
        setSubscribed(true);
        setMessage("이 브라우저에서 알림을 받을 수 있습니다.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "브라우저 알림 설정을 확인해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="info-card" style={{ marginBottom: 24 }}>
      <h2>브라우저 알림</h2>
      {supported && (publicKey || subscribed) ? (
        <button
          type="button"
          className="button outline"
          disabled={busy}
          onClick={toggle}
        >
          {subscribed ? "이 브라우저 알림 끄기" : "이 브라우저 알림 받기"}
        </button>
      ) : (
        <p>
          {publicKey
            ? "이 브라우저에서는 푸시 알림을 사용할 수 없습니다."
            : "브라우저 알림 연결을 준비 중입니다."}
        </p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}

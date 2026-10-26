"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
export function SitePromotions({
  items,
}: {
  items: {
    id: string;
    kind: string;
    title: string;
    body: string;
    href: string;
  }[];
}) {
  const [dismissed, setDismissed] = useState<string[]>([]),
    [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setDismissed(
      JSON.parse(sessionStorage.getItem("cj-dismissed-promotions") ?? "[]"),
    );
    setReady(true);
  }, []);
  const popup = items.find(
    (i) => i.kind === "popup" && !dismissed.includes(i.id),
  );
  useEffect(() => {
    if (ready && popup && !dialog.current?.open) dialog.current?.showModal();
    if (!popup && dialog.current?.open) dialog.current.close();
  }, [ready, popup]);
  function close(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    sessionStorage.setItem("cj-dismissed-promotions", JSON.stringify(next));
    dialog.current?.close();
  }
  return (
    <>
      {items
        .filter((i) => i.kind === "banner" && !dismissed.includes(i.id))
        .map((i) => (
          <div key={i.id} className="site-notice-banner">
            <Link href={i.href}>
              <strong>{i.title}</strong>
              <span>{i.body}</span>
            </Link>
            <button aria-label="안내 배너 닫기" onClick={() => close(i.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      {ready && popup && (
        <dialog
          className="site-popup"
          ref={dialog}
          onCancel={(e) => {
            e.preventDefault();
            close(popup.id);
          }}
        >
          <button
            className="popup-close"
            onClick={() => close(popup.id)}
            aria-label="팝업 닫기"
          >
            <X size={22} />
          </button>
          <span className="eyebrow">CHAMJOEUN NOTICE</span>
          <h2>{popup.title}</h2>
          <p>{popup.body}</p>
          <Link
            className="button primary"
            href={popup.href}
            onClick={() => close(popup.id)}
          >
            자세히 보기 →
          </Link>
        </dialog>
      )}
    </>
  );
}

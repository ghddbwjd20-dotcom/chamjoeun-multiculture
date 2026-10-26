"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Download } from "lucide-react";
export function AttachmentUploader({
  postId,
  files,
}: {
  postId: string;
  files: { id: string; original_name: string; size_bytes: number }[];
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  return (
    <div className="attachment-manager">
      <h3>첨부파일 관리</h3>
      <p className="muted">
        PDF·JPG·PNG·WebP, 파일당 최대 10MB. 비공개 글의 첨부는 관리자만
        다운로드할 수 있습니다.
      </p>
      <ul className="attachment-list">
        {files.map((f) => (
          <li key={f.id}>
            <Paperclip size={16} />
            <a href={`/api/attachments/${f.id}`}>{f.original_name}</a>
            <span>{(f.size_bytes / 1024).toFixed(0)}KB</span>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await fetch(`/api/attachments/${f.id}`, {
                    method: "DELETE",
                  });
                  if (!r.ok) throw new Error();
                  setMessage("첨부파일을 숨겼습니다.");
                  router.refresh();
                } catch {
                  setMessage("파일을 숨기지 못했습니다.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              숨기기
            </button>
          </li>
        ))}
      </ul>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const file = input.current?.files?.[0];
          if (!file) return;
          setBusy(true);
          setMessage("");
          try {
            const data = new FormData();
            data.set("postId", postId);
            data.set("file", file);
            const r = await fetch("/api/attachments", {
              method: "POST",
              body: data,
            });
            const result = await r.json();
            if (!r.ok) throw new Error(result.error);
            setMessage("첨부파일을 등록했습니다.");
            if (input.current) input.current.value = "";
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "첨부파일을 등록하지 못했습니다.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          등록할 파일
          <input
            ref={input}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            required
          />
        </label>
        <button className="button outline" disabled={busy}>
          {busy ? "처리 중…" : "파일 업로드"}
        </button>
      </form>
      {message && (
        <p className="alert" role="status" style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </div>
  );
}

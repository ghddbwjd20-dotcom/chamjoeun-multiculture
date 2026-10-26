"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, RefreshCw } from "lucide-react";
async function api(data: unknown) {
  const response = await fetch("/api/admin/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "요청에 실패했습니다.");
  return result;
}
export function VideoUpload({
  lessonId,
  jobId,
  status,
}: {
  lessonId: string;
  jobId?: string;
  status: string;
}) {
  const input = useRef<HTMLInputElement>(null),
    aborted = useRef(false);
  const [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="video-upload-form">
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const file = input.current?.files?.[0];
          if (!file) return;
          if (
            file.size > 10 * 1024 ** 3 ||
            !file.name.toLowerCase().endsWith(".mp4")
          ) {
            setMessage("10GB 이하의 MP4 파일을 선택해 주세요.");
            return;
          }
          let uploadId: string | undefined;
          setBusy(true);
          setProgress(0);
          setMessage("업로드 준비 중…");
          aborted.current = false;
          try {
            const session = await api({
              action: "begin",
              lessonId,
              name: file.name,
              size: file.size,
            });
            uploadId = session.uploadId;
            for (let i = 1; i <= session.parts; i++) {
              if (aborted.current) throw new Error("업로드를 취소했습니다.");
              const { url } = await api({ action: "sign", uploadId, part: i });
              const blob = file.slice(
                (i - 1) * session.partSize,
                i * session.partSize,
              );
              await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", url);
                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable)
                    setProgress(
                      Math.min(
                        99,
                        Math.round(
                          (((i - 1) * session.partSize + e.loaded) /
                            file.size) *
                            100,
                        ),
                      ),
                    );
                };
                xhr.onload = () =>
                  xhr.status >= 200 && xhr.status < 300
                    ? resolve()
                    : reject(new Error("파일 전송에 실패했습니다."));
                xhr.onerror = () =>
                  reject(new Error("네트워크 연결을 확인해 주세요."));
                xhr.send(blob);
              });
            }
            setMessage("업로드 확인 및 변환 대기 등록 중…");
            await api({ action: "complete", uploadId });
            setProgress(100);
            setMessage(
              "업로드를 완료했습니다. 작업자가 HLS·썸네일을 자동 생성합니다.",
            );
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "업로드 실패");
            if (uploadId)
              try {
                await api({ action: "abort", uploadId });
              } catch {}
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          영상 파일 (MP4 · H.264/AAC, 최대 10GB)
          <input
            ref={input}
            type="file"
            accept="video/mp4,.mp4"
            disabled={busy}
            required
          />
        </label>
        {busy && (
          <>
            <progress
              max={100}
              value={progress}
              aria-label="영상 업로드 진행률"
            />
            <span>{progress}% 업로드</span>
          </>
        )}
        <button className="button outline" disabled={busy}>
          <Upload size={15} />
          {busy ? "업로드 중…" : "영상 업로드"}
        </button>
      </form>
      {busy && (
        <button
          className="text-link"
          onClick={() => {
            aborted.current = true;
          }}
        >
          현재 분할 전송 후 취소
        </button>
      )}
      {status === "failed" && jobId && (
        <button
          className="button outline"
          onClick={async () => {
            try {
              await api({ action: "retry", jobId });
              setMessage("재처리를 요청했습니다.");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "재처리 실패");
            }
          }}
        >
          <RefreshCw size={15} />
          인코딩 재처리
        </button>
      )}
      {status === "ready" && (
        <button
          className="text-link"
          onClick={async () => {
            try {
              const r = await api({ action: "unlink", lessonId });
              setMessage(r.note);
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "처리 실패");
            }
          }}
        >
          영상 노출 중지
        </button>
      )}
      {message && (
        <p role="status" className="alert" style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </div>
  );
}

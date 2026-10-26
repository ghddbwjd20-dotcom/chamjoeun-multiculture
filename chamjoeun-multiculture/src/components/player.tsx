"use client";
import { useEffect, useRef, useState } from "react";
export function Player({
  lessonId,
  src,
}: {
  lessonId: string;
  src: string | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("학습 기록을 준비하고 있습니다.");
  useEffect(() => {
    if (!src || !video.current) return;
    const el = video.current;
    let session = "",
      timer: ReturnType<typeof setInterval> | undefined,
      closed = false,
      busy = false;
    let cleanupMedia = () => {};
    async function ping(playing: boolean) {
      if (!session || busy || closed) return;
      busy = true;
      try {
        const r = await fetch("/api/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "ping",
            sessionId: session,
            position: el.currentTime,
            playing,
          }),
        });
        const d = await r.json();
        if (!r.ok) {
          el.pause();
          setMessage(d.error);
          return;
        }
        setMessage(`진도 저장 완료 · 과정 진도 ${d.courseProgress}%`);
      } catch {
        setMessage("진도를 저장하지 못했습니다. 연결을 확인해 주세요.");
      } finally {
        busy = false;
      }
    }
    async function start() {
      const r = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "start", lessonId }),
      });
      const d = await r.json();
      if (closed) return;
      if (!r.ok) {
        setMessage(d.error);
        return;
      }
      session = d.sessionId;
      const seek = () => {
        el.currentTime = Math.min(d.lastPosition || 0, el.duration || Infinity);
      };
      el.addEventListener("loadedmetadata", seek, { once: true });
      if (
        src!.startsWith("/api/demo-video/") ||
        el.canPlayType("application/vnd.apple.mpegurl")
      ) {
        el.src = src!;
      } else {
        const { default: Hls } = await import("hls.js");
        if (closed) return;
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src!);
          hls.attachMedia(el);
          cleanupMedia = () => hls.destroy();
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal)
              setMessage(
                "영상 연결을 확인해 주세요. 페이지를 새로고침해 주세요.",
              );
          });
        } else setMessage("이 브라우저에서는 영상을 재생할 수 없습니다.");
      }
      setMessage("학습 준비 완료 · 실제 시청 구간만 진도로 반영됩니다.");
      timer = setInterval(
        () => void ping(!el.paused && !el.seeking && !el.ended),
        10000,
      );
    }
    const onSeek = () => void ping(false);
    const onPause = () => void ping(true);
    const onEnded = () => void ping(true);
    el.addEventListener("seeked", onSeek);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    start().catch(() => setMessage("학습 기록 서버에 연결하지 못했습니다."));
    return () => {
      closed = true;
      if (timer) clearInterval(timer);
      cleanupMedia();
      el.removeEventListener("seeked", onSeek);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [lessonId, src]);
  return (
    <>
      <div className="video-shell">
        {src ? (
          <video
            ref={video}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            aria-label="강의 영상"
          />
        ) : (
          <p>
            강의 영상을 준비하고 있습니다.
            <br />
            영상 등록과 연동이 완료되면 재생할 수 있습니다.
          </p>
        )}
      </div>
      {src && (
        <p className="muted" role="status" style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </>
  );
}

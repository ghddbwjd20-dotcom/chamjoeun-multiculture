"use client";
import { useEffect, useRef, useState } from "react";
import { refreshedVideoRequest, videoTokenExpiry } from "@/lib/playback-url";
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
      stopped = false;
    let requests = Promise.resolve();
    let cleanupMedia = () => {};
    let cleanupSeek = () => {};
    let activeSrc = src;
    let nativePlayback = false;
    let renewing = false;
    let cleanupRenewal = () => {};
    function refreshSource(next: string | null | undefined) {
      if (!next || closed) return;
      if (!nativePlayback) {
        activeSrc = next;
        return;
      }
      const expiry = videoTokenExpiry(activeSrc);
      const nextExpiry = videoTokenExpiry(next);
      if (
        renewing ||
        expiry === null ||
        nextExpiry === null ||
        nextExpiry <= expiry ||
        expiry > Date.now() + 60000
      )
        return;
      const position = el.currentTime;
      const resume = !el.paused;
      renewing = true;
      activeSrc = next;
      const restore = () => {
        if (closed) return;
        el.currentTime = Math.min(position, el.duration || position);
        renewing = false;
        if (resume)
          void el.play().catch(() => {
            if (!closed)
              setMessage(
                "영상 연결을 갱신했습니다. 재생 버튼을 눌러 이어가세요.",
              );
          });
      };
      cleanupRenewal();
      el.addEventListener("loadedmetadata", restore, { once: true });
      cleanupRenewal = () => el.removeEventListener("loadedmetadata", restore);
      el.src = next;
      el.load();
    }
    function ping(playing: boolean) {
      if (
        !session ||
        stopped ||
        closed ||
        renewing ||
        !Number.isFinite(el.currentTime)
      )
        return;
      // Capture the position before serializing saves, including the final
      // keepalive request sent when the learner leaves the page.
      const snapshot = {
        kind: "ping",
        sessionId: session,
        position: el.currentTime,
        playing,
      };
      requests = requests.then(async () => {
        if (stopped) return;
        try {
          const r = await fetch("/api/watch", {
            method: "POST",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshot),
          });
          const d = await r.json();
          if (!r.ok) {
            stopped = true;
            el.pause();
            if (!closed)
              setMessage(d.error ?? "학습 기록을 저장할 수 없습니다.");
            return;
          }
          refreshSource(d.videoSrc);
          if (!closed)
            setMessage(`진도 저장 완료 · 과정 진도 ${d.courseProgress}%`);
        } catch {
          if (!closed)
            setMessage("진도를 저장하지 못했습니다. 연결을 확인해 주세요.");
        }
      });
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
      activeSrc = d.videoSrc ?? src!;
      const seek = () => {
        el.currentTime = Math.min(d.lastPosition || 0, el.duration || Infinity);
      };
      el.addEventListener("loadedmetadata", seek, { once: true });
      cleanupSeek = () => el.removeEventListener("loadedmetadata", seek);
      if (
        src!.startsWith("/api/demo-video/") ||
        el.canPlayType("application/vnd.apple.mpegurl")
      ) {
        nativePlayback = true;
        el.src = activeSrc;
      } else {
        const { default: Hls } = await import("hls.js");
        if (closed) return;
        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup(xhr, url) {
              xhr.open("GET", refreshedVideoRequest(url, activeSrc), true);
            },
          });
          hls.loadSource(activeSrc);
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
    const onPause = () => {
      if (!renewing) void ping(!el.seeking);
    };
    const onEnded = () => void ping(true);
    const onPlay = () => {
      if (!renewing) void ping(false);
    };
    const saveBeforeLeaving = () =>
      void ping(!el.paused && !el.seeking && !el.ended);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveBeforeLeaving();
      else void ping(false);
    };
    el.addEventListener("seeked", onSeek);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    window.addEventListener("pagehide", saveBeforeLeaving);
    document.addEventListener("visibilitychange", onVisibility);
    start().catch(() => {
      if (!closed) setMessage("학습 기록 서버에 연결하지 못했습니다.");
    });
    return () => {
      saveBeforeLeaving();
      closed = true;
      if (timer) clearInterval(timer);
      cleanupSeek();
      cleanupRenewal();
      cleanupMedia();
      el.removeEventListener("seeked", onSeek);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      window.removeEventListener("pagehide", saveBeforeLeaving);
      document.removeEventListener("visibilitychange", onVisibility);
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

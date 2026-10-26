"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
export function HeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true),
    [muted, setMuted] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
      setPlaying(false);
    }
  }, []);
  return (
    <div className="hero-film">
      <video
        ref={ref}
        src="/media/hero-navy.mp4"
        poster="/images/learning-space.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="교육과 정착을 함께하는 기관 소개 비주얼"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="film-caption">
        <span>LEARNING. CONNECTING. BELONGING.</span>
        <p>
          다른 시작을 잇고,
          <br />
          <strong>함께하는 내일을 만듭니다.</strong>
        </p>
      </div>
      <div className="film-controls">
        <span>
          기관 소개 비주얼 <small>CHAMJOEUN MULTICULTURE</small>
        </span>
        <button
          aria-label={muted ? "영상 소리 켜기" : "영상 음소거"}
          onClick={() => {
            if (ref.current) {
              ref.current.muted = !muted;
              setMuted(!muted);
            }
          }}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <button
          aria-label={playing ? "소개 영상 일시정지" : "소개 영상 재생"}
          onClick={() => {
            if (!ref.current) return;
            if (ref.current.paused)
              ref.current.play().catch(() => setPlaying(false));
            else ref.current.pause();
          }}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
      </div>
    </div>
  );
}

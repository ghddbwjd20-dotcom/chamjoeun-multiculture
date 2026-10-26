"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Play,
  Check,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
} from "lucide-react";
const views = [
  {
    tab: "온라인 강의",
    title: "나에게 맞는 배움, 지금 시작하세요.",
    subtitle: "관심 있는 분야의 과정을 살펴보고 배움을 시작합니다.",
    left: "추천 교육과정",
    right: "온라인 강의",
    tags: ["평생교육", "민간자격과정", "한국어교육"],
  },
  {
    tab: "수강과정",
    title: "배우고 싶은 과정을 한눈에.",
    subtitle: "과정 소개와 커리큘럼을 확인한 후 신청합니다.",
    left: "과정 안내",
    right: "커리큘럼",
    tags: ["과정 소개", "교육기간", "수강신청"],
  },
  {
    tab: "학습지원",
    title: "학습 중 궁금한 점도 함께.",
    subtitle: "강의 이용 방법과 학습 중 문의사항을 안내합니다.",
    left: "이용 안내",
    right: "학습 문의",
    tags: ["학습 방법", "영상 재생", "이용 문의"],
  },
  {
    tab: "나의 강의실",
    title: "어제의 배움을 오늘도 이어서.",
    subtitle: "학습 현황을 확인하고 마지막 시청 위치에서 이어봅니다.",
    left: "나의 수강과정",
    right: "학습 현황",
    tags: ["진도 확인", "이어보기", "수료 현황"],
  },
];
export function LmsShowcase() {
  const [at, setAt] = useState(0),
    [demo, setDemo] = useState(false);
  const v = views[at];
  const move = (n: number) => {
    setAt((at + n + views.length) % views.length);
    setDemo(false);
  };
  return (
    <div className="lms-showcase">
      <div className="lms-tab-row" role="tablist" aria-label="온라인 학습 기능">
        {views.map((view, i) => (
          <button
            key={view.tab}
            role="tab"
            id={`lms-tab-${i}`}
            aria-selected={at === i}
            aria-controls="lms-showcase-panel"
            onClick={() => {
              setAt(i);
              setDemo(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next =
                  (at + (e.key === "ArrowRight" ? 1 : -1) + views.length) %
                  views.length;
                setAt(next);
                document.getElementById(`lms-tab-${next}`)?.focus();
              }
            }}
            tabIndex={at === i ? 0 : -1}
          >
            <span>0{i + 1}</span>
            {view.tab}
          </button>
        ))}
      </div>
      <div
        className="lms-stage"
        id="lms-showcase-panel"
        role="tabpanel"
        aria-labelledby={`lms-tab-${at}`}
      >
        <div className="stage-note">
          <span className="eyebrow">A CLASSROOM THAT FITS YOUR LIFE</span>
          <h3>{v.title}</h3>
          <p>{v.subtitle}</p>
          <div>
            <Monitor size={17} />
            <span>PC</span>
            <Smartphone size={17} />
            <span>모바일</span>
          </div>
          <p className="preview-label">학습 기능 미리보기</p>
        </div>
        <div className="device-composition">
          <div className="monitor">
            <div className="monitor-camera" />
            <div className="monitor-display">
              <div className="browser-bar">
                <i />
                <i />
                <i />
                <span>참조은다문화 / {v.tab}</span>
              </div>
              <div className="screen-top">
                <b>
                  참조은다문화<span>(주)</span>
                </b>
                <small>배움으로 넓어지는 나의 가능성</small>
                <span className="avatar">배</span>
              </div>
              <div className="screen-inner">
                <aside>
                  <BookOpen size={21} />
                  <span>교육과정</span>
                  <b>{v.tab}</b>
                  <span>학습지원</span>
                </aside>
                <div className="screen-content">
                  <span className="eyebrow">MY LEARNING JOURNEY</span>
                  <h4>{v.left}</h4>
                  <div className="mini-course-row">
                    {v.tags.map((tag, i) => (
                      <div key={tag}>
                        <img
                          src={`/images/${["learning-space.jpg", "study-detail.jpg", "consultation-space.jpg"][i]}`}
                          alt=""
                        />
                        <small>{tag}</small>
                        <div className="mini-progress">
                          <i style={{ width: `${[38, 65, 24][i]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mini-learning">
                    <div className="mini-video">
                      {demo ? (
                        <video
                          src="/media/institution-film.mp4"
                          controls
                          autoPlay
                          playsInline
                          aria-label="LMS 소개 샘플 영상"
                        />
                      ) : (
                        <>
                          <img
                            src="/images/learning-space.jpg"
                            alt="학습 기능 예시"
                          />
                          <button
                            onClick={() => setDemo(true)}
                            aria-label="모니터에서 샘플 영상 재생"
                          >
                            <Play size={18} fill="currentColor" />
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      <b>{v.right}</b>
                      <p>하나씩, 나의 속도에 맞추어.</p>
                      <span>
                        <Check size={12} /> 배움과 일상을 연결합니다
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="monitor-chin">CHAMJOEUN EDUCATION</div>
          </div>
          <div className="monitor-stand" />
          <div className="monitor-foot" />
          <div className="phone">
            <div className="phone-speaker" />
            <span className="phone-brand">참조은다문화</span>
            <h4>{v.tab}</h4>
            <img src="/images/study-detail.jpg" alt="" />
            <strong>{v.tags[0]}</strong>
            <span className="phone-status">
              <i />
              학습을 이어가세요
            </span>
            <div className="mini-progress">
              <i style={{ width: "65%" }} />
            </div>
            <Link href="/classroom">나의 강의실 →</Link>
          </div>
        </div>
      </div>
      <div className="showcase-bottom">
        <p>언제 어디서나, 배움의 흐름이 이어지도록.</p>
        <div>
          <button onClick={() => move(-1)} aria-label="이전 학습 기능">
            <ChevronLeft size={20} />
          </button>
          <span>0{at + 1} / 04</span>
          <button onClick={() => move(1)} aria-label="다음 학습 기능">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="actions">
        <Link href="/courses" className="button primary">
          교육과정·수강신청 <ArrowUpRight size={17} />
        </Link>
        <Link href="/classroom" className="button outline">
          나의 강의실
        </Link>
      </div>
    </div>
  );
}

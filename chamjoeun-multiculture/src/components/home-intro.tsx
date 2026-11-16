"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  NotebookPen,
  Pause,
  Plane,
  Play,
  Presentation,
  Users,
  X,
} from "lucide-react";
import "./home-intro.css";

const socinet = "https://www.socinet.go.kr/soci/main/main.jsp?MENU_TYPE=S_TOP_SY";

const slides = [
  {
    image: "/images/home-reference-hero.jpg",
    alt: "다양한 문화의 사람들이 교육 상담을 나누는 장면",
    title: (
      <>
        교육을 통해
        <br />더 나은 내일을 만드는
        <br />
        참조은다문화
      </>
    ),
    description: (
      <>
        사람과 사람을 잇는 교육,
        <br />
        지속가능한 사회통합을 실현합니다.
      </>
    ),
  },
  {
    image: "/images/about-team.jpg",
    alt: "함께 이야기하며 배우는 다문화 학습자들",
    title: (
      <>
        서로의 문화를 잇고
        <br />
        새로운 시작을 함께하는
        <br />
        참조은다문화
      </>
    ),
    description: (
      <>
        다양한 배경을 존중하며,
        <br />
        한국에서의 안정적인 정착을 돕습니다.
      </>
    ),
  },
  {
    image: "/images/quick-kiip.jpg",
    alt: "한국어와 한국 문화를 함께 배우는 교육 현장",
    title: (
      <>
        배움의 기회를 넓혀
        <br />
        함께 성장하는 사회를 만드는
        <br />
        참조은다문화
      </>
    ),
    description: (
      <>
        한국어부터 평생교육까지,
        <br />
        일상에 필요한 배움을 연결합니다.
      </>
    ),
  },
];
const services = [
  {
    title: "동포체류지원센터",
    sub: "정착 상담 · 취업 · 이용안내",
    href: "/support#settlement",
    icon: Users,
  },
  {
    title: "사회통합프로그램(KIIP)",
    sub: "법무부 KIIP · 한국어와 한국사회",
    href: socinet,
    icon: NotebookPen,
  },
  {
    title: "조기적응프로그램",
    sub: "입국 초기 생활 안내",
    href: "/support#early",
    icon: Plane,
  },
  {
    title: "교육과정 / LMS",
    sub: "수강신청 · 나의 강의실",
    href: "/courses",
    icon: GraduationCap,
  },
  {
    title: "민간자격증",
    sub: "자격과정 안내",
    href: "/business#qualification",
    icon: Presentation,
  },
  {
    title: "지역사회서비스",
    sub: "지역 연계 프로그램",
    href: "/business#community",
    icon: HeartHandshake,
  },
  {
    title: "평생교육",
    sub: "다양한 교육 기회",
    href: "/business#lifelong",
    icon: BookOpen,
  },
];
const programs = [
  {
    title: "동포체류지원센터",
    image: "/images/quick-settlement.jpg",
    href: "/support#settlement",
    description:
      "외국인 동포의 안정적인 체류와 정착을 위한 상담 및 지원 서비스를 제공합니다.",
  },
  {
    title: "사회통합프로그램(KIIP)",
    image: "/images/quick-kiip.jpg",
    href: socinet,
    description:
      "법무부 지정 사회통합프로그램 운영기관으로 한국어와 한국사회 이해 교육을 제공합니다.",
  },
  {
    title: "조기적응프로그램",
    image: "/images/quick-early.jpg",
    href: "/support#early",
    description:
      "입국 초기 외국인의 한국 생활 적응을 돕는 맞춤형 정보를 제공합니다.",
  },
];
export function HomeIntro() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [hover, setHover] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!auto || hover || videoOpen) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [auto, hover, videoOpen]);
  useEffect(() => {
    if (videoOpen) dialog.current?.showModal();
    else {
      video.current?.pause();
      dialog.current?.close();
    }
  }, [videoOpen]);
  const step = (delta: number) => {
    setIndex((i) => (i + delta + slides.length) % slides.length);
    setAuto(false);
  };
  const closeVideo = () => {
    setVideoOpen(false);
    trigger.current?.focus();
  };
  const slide = slides[index];
  return (
    <div className="reference-home">
      <section
        className="ref-hero"
        aria-label="참조은다문화 소개"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocusCapture={() => setHover(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
        }}
      >
        <div className="ref-photo" aria-live="off">
          {slides.map((s, i) => (
            <img
              key={s.image}
              src={s.image}
              alt={s.alt}
              className={i === index ? "is-active" : ""}
              aria-hidden={i !== index}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          ))}
        </div>
        <div className="ref-container ref-hero-inner">
          <div className="ref-hero-copy">
            <p className="ref-eyebrow">FOR A STABLE TOMORROW TOGETHER</p>
            <h1>
              외국인의 <em>안정적인 정착</em>과<br />
              사회통합을 지원하는
              <br />
              참조은다문화입니다.
            </h1>
            <p className="ref-lead">
              다양한 배경의 사람들이 교육으로 새로운 시작을 함께하는 사회,
              <br className="ref-desktop-break" /> 참조은다문화가 만들어갑니다.
            </p>
            <Link href="/about" className="ref-outline-link">
              기관소개 바로가기 <ArrowRight size={17} />
            </Link>
            <div
              className="ref-slide-controls"
              role="group"
              aria-label="메인 소개 슬라이드 조작"
            >
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <small>03</small>
              <span className="ref-slide-progress" aria-hidden="true">
                <i
                  style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                />
              </span>
              <button onClick={() => step(-1)} aria-label="이전 소개">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setAuto((v) => !v)}
                aria-label={
                  auto
                    ? "소개 슬라이드 자동 전환 일시정지"
                    : "소개 슬라이드 자동 전환 재생"
                }
              >
                {auto ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button onClick={() => step(1)} aria-label="다음 소개">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <aside className="ref-story-card" aria-label="교육 이야기">
            <div className="ref-card-top">
              <span>
                <b>{String(index + 1).padStart(2, "0")}</b> / 03
              </span>
              <div>
                <button onClick={() => step(-1)} aria-label="이전 교육 이야기">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => step(1)} aria-label="다음 교육 이야기">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <span className="ref-card-rule" />
            <div aria-live="polite">
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
            <button
              className="ref-video-link"
              ref={trigger}
              onClick={() => setVideoOpen(true)}
              aria-haspopup="dialog"
            >
              <span className="ref-video-thumb">
                <img src="/images/hero-video-poster.jpg" alt="" />
                <i>
                  <Play size={16} fill="currentColor" />
                </i>
              </span>
              <span>
                <b>
                  참조은다문화를
                  <br />
                  소개합니다
                </b>
                <small>PLAY VIDEO</small>
              </span>
            </button>
          </aside>
        </div>
      </section>
      <section
        className="ref-container ref-services"
        aria-labelledby="ref-service-title"
      >
        <div className="ref-services-intro">
          <span className="ref-eyebrow">MAIN SERVICE</span>
          <h2 id="ref-service-title">주요 서비스</h2>
          <p>
            외국인의 한국 생활과 사회통합을 위한
            <br />
            다양한 프로그램을 제공합니다.
          </p>
        </div>
        <div className="ref-service-list">
          {services.map((s) => (
            <a
              key={s.title}
              href={s.href}
              {...(s.href.startsWith("https")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="ref-icon">
                <s.icon size={25} strokeWidth={1.6} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.sub}</p>
              <ArrowRight size={16} className="ref-service-arrow" />
            </a>
          ))}
        </div>
      </section>
      <section
        className="ref-container ref-programs"
        id="core"
        aria-labelledby="ref-program-title"
      >
        <div className="ref-program-intro">
          <span className="ref-eyebrow">OUR PROGRAM</span>
          <i />
          <h2 id="ref-program-title">
            법무부 지정 <em>주요 사업</em>
          </h2>
          <p>
            참조은다문화는 법무부와 함께
            <br />
            외국인이 한국사회에 안정적으로 정착하고
            <br />
            지역사회와 조화롭게 살아갈 수 있도록 지원합니다.
          </p>
          <Link href="/support">
            사업안내 더보기 <ArrowRight size={17} />
          </Link>
        </div>
        {programs.map((p, i) => (
          <a
            key={p.title}
            className="ref-program-card"
            href={p.href}
            {...(p.href.startsWith("https")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <img src={p.image} alt="" loading="lazy" />
            <div>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <ArrowRight size={16} className="ref-program-arrow" />
            </div>
          </a>
        ))}
      </section>
      <dialog
        className="ref-video-dialog"
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          closeVideo();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeVideo();
        }}
        aria-labelledby="ref-video-title"
      >
        <div className="ref-video-modal">
          <div>
            <h2 id="ref-video-title">참조은다문화 소개 비주얼</h2>
            <button onClick={closeVideo} aria-label="소개 영상 닫기" autoFocus>
              <X size={24} />
            </button>
          </div>
          {videoOpen && (
            <video
              ref={video}
              src="/media/hero-navy.mp4"
              poster="/images/hero-video-poster.jpg"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
          )}
        </div>
      </dialog>
    </div>
  );
}

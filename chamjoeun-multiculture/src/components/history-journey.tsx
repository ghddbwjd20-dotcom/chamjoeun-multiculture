"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Building2,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";
import { history } from "@/lib/content";

const periods = [
  { label: "지금의 참조은", range: "2023–2026", min: 2023, max: 2026 },
  { label: "배움의 확장", range: "2016–2021", min: 2016, max: 2021 },
  { label: "부산에서의 시작", range: "2010–2015", min: 2010, max: 2015 },
];
const entries = [...history].reverse();
const headlines: Record<string, string> = {
  "2026": "정착지원의 새로운 장",
  "2025": "산학협력으로 넓어지는 배움",
  "2024": "현장과 교육을 더 가깝게",
  "2023": "지역 대학과 함께 성장",
  "2021": "함께하는 교육의 기반",
  "2020": "현장에서 배우는 전문성",
  "2018": "정착과 디지털 교육의 확장",
  "2017": "지역 안에서 이어지는 배움",
  "2016": "평생교육의 문을 열다",
  "2015": "소식과 책으로 만나는 지역",
  "2014": "사회적 가치를 인정받다",
  "2013": "참조은다문화의 독립적인 시작",
  "2011": "사회통합을 향한 첫걸음",
  "2010": "부산에서 시작된 동행",
};
export function HistoryJourney() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [period, setPeriod] = useState(0);
  const [selected, setSelected] = useState("2026");
  const [expanded, setExpanded] = useState(false);
  const visible = entries.filter(
    ([year]) => +year >= periods[period].min && +year <= periods[period].max,
  );
  const index = entries.findIndex(([year]) => year === selected);
  const text = entries[index][1];
  const Icon =
    +selected >= 2023
      ? HeartHandshake
      : +selected >= 2016
        ? GraduationCap
        : Building2;
  function selectYear(year: string) {
    setSelected(year);
    setPeriod(
      periods.findIndex((item) => +year >= item.min && +year <= item.max),
    );
  }
  return (
    <section
      className="detail-section journey"
      id="history"
      aria-labelledby="journey-title"
    >
      <div className="journey-heading">
        <div>
          <span className="eyebrow">OUR JOURNEY · SINCE 2010</span>
          <h2 id="journey-title">
            함께 걸어온 길,
            <br />
            계속되는 변화.
          </h2>
        </div>
        <p>
          부산에서의 작은 시작부터 <br />
          배움과 정착을 연결하는 오늘까지.
        </p>
      </div>
      <div className="journey-periods" aria-label="연혁 시기 선택">
        {periods.map((item, i) => (
          <button
            key={item.min}
            disabled={!ready}
            aria-pressed={period === i}
            onClick={() => {
              setPeriod(i);
              setSelected(
                entries.find(
                  ([year]) => +year >= item.min && +year <= item.max,
                )![0],
              );
            }}
          >
            <span>{item.label}</span>
            <small>{item.range}</small>
          </button>
        ))}
      </div>
      <div className="journey-stage">
        <div className="journey-watermark" aria-hidden="true">
          {selected}
        </div>
        <article
          className="journey-feature"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="journey-year" key={`year-${selected}`}>
            <span>OUR MILESTONE</span>
            <strong>
              {selected}
              <i>.</i>
            </strong>
          </div>
          <div className="journey-story" key={`story-${selected}`}>
            <span className="journey-symbol">
              <Icon size={25} strokeWidth={1.5} />
            </span>
            <h3>{headlines[selected]}</h3>
            <ul>
              {text.split(" · ").map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </article>
        <div className="journey-controls">
          <span>
            <Sparkles size={14} /> 연도를 선택해 이야기를 만나보세요
          </span>
          <div>
            <button
              aria-label="이전 연혁"
              disabled={!ready || index === entries.length - 1}
              onClick={() => selectYear(entries[index + 1][0])}
            >
              <ArrowLeft size={19} />
            </button>
            <button
              aria-label="다음 연혁"
              disabled={!ready || index === 0}
              onClick={() => selectYear(entries[index - 1][0])}
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
      <nav className="journey-years" aria-label="연혁 연도 선택">
        {visible.map(([year]) => (
          <button
            key={year}
            disabled={!ready}
            aria-pressed={selected === year}
            onClick={() => setSelected(year)}
          >
            <span>{year}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </nav>
      <button
        className="journey-expand"
        disabled={!ready}
        aria-expanded={expanded}
        aria-controls="journey-full"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "전체 연혁 접기" : "전체 연혁 한눈에 보기"}
        <ChevronDown
          size={17}
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        />
      </button>
      <div id="journey-full" hidden={!expanded} className="journey-full">
        {entries.map(([year, detail]) => (
          <button
            key={year}
            aria-pressed={selected === year}
            onClick={() => selectYear(year)}
          >
            <b>{year}</b>
            <span>{detail}</span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

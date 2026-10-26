"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
const partners = [
  ["cup.png", "부산가톨릭대학교", "https://www.cup.ac.kr"],
  ["cuk.png", "고려사이버대학교", "https://www.cuk.edu"],
  ["dit.png", "동의과학대학교", "https://www.dit.ac.kr"],
  ["knou.png", "한국방송통신대학교", "https://www.knou.ac.kr"],
  ["gimhae.svg", "김해대학교", "https://www.gimhae.ac.kr"],
  ["dongnae.png", "동래교육지원청", "https://home.pen.go.kr/dongnae/main.do"],
  ["bukbu.png", "북부교육지원청", "https://home.pen.go.kr/bukbu/main.do"],
  ["seobu.png", "서부교육지원청", "https://home.pen.go.kr/seobu/main.do"],
];
export function Partners() {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <>
      <div className="partners-heading">
        <div>
          <span className="eyebrow">OUR NETWORK</span>
          <h2>함께하는 기관</h2>
          <p>교육기관·대학·지역사회와 더 넓은 배움의 기회를 만듭니다.</p>
        </div>
        <div className="rail-controls">
          <button
            aria-label="이전 협력기관"
            onClick={() =>
              rail.current?.scrollBy({ left: -400, behavior: "smooth" })
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="다음 협력기관"
            onClick={() =>
              rail.current?.scrollBy({ left: 400, behavior: "smooth" })
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="partner-rail" ref={rail}>
        {partners.map(([image, name, url]) => (
          <a href={url} target="_blank" rel="noopener noreferrer" key={name}>
            <img src={`/images/partners/${image}`} alt="" loading="lazy" />
            <strong>{name}</strong>
            <ArrowUpRight size={13} />
          </a>
        ))}
      </div>
    </>
  );
}

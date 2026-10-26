import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { detailedPrograms } from "@/lib/content";
import { Reveal } from "@/components/reveal";
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="EDUCATION & COMMUNITY"
        title="배움과 일상에 가까운 사업"
        description="평생교육부터 전문 역량, 지역사회서비스와 교육 자원까지. 대상과 목적에 맞는 교육·복지·도서 서비스를 연결합니다."
      />
      <div className="container content">
        <nav className="section-links" aria-label="주요사업 바로가기">
          {detailedPrograms.map((p) => (
            <a href={`#${p.slug}`} key={p.slug}>
              <span>{p.number}</span>
              {p.name}
              <ArrowUpRight size={15} />
            </a>
          ))}
        </nav>
        {detailedPrograms.map((p) => (
          <section
            className="business-detail detail-section"
            id={p.slug}
            key={p.slug}
          >
            <Reveal className="business-detail-intro">
              <div className="business-detail-image">
                <img
                  src={`/images/${p.image}`}
                  alt={`${p.name}을 표현한 콘셉트 이미지`}
                  loading="lazy"
                />
                <span>
                  {p.number} / {p.en.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="eyebrow">{p.en.toUpperCase()}</span>
                <h2>{p.name}</h2>
                <h3>{p.headline}</h3>
                <p className="detail-lead">{p.description}</p>
                <div className="audience">
                  <span>이런 분들을 위해</span>
                  <p>{p.audience}</p>
                </div>
                <div className="actions">
                  <Link
                    href={`/contact?kind=${p.slug === "books" ? "books" : "education"}`}
                    className="button primary"
                  >
                    {p.slug === "books" ? "도서납품 상담" : "교육·이용 상담"}{" "}
                    <ArrowUpRight size={16} />
                  </Link>
                  {["lifelong", "qualification"].includes(p.slug) && (
                    <Link href="/courses" className="button outline">
                      온라인 교육과정
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
            <div className="program-detail-items">
              {p.items.map(([title, text]) => (
                <article key={title}>
                  <Check size={18} />
                  <div>
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="process-block">
              <h3>{p.slug === "books" ? "도서납품 상담 흐름" : "이용 안내"}</h3>
              <ol>
                {p.steps.map((step, i) => (
                  <li key={step}>
                    <span>0{i + 1}</span>
                    <strong>{step}</strong>
                  </li>
                ))}
              </ol>
              <p>
                {p.slug === "qualification"
                  ? "개설 여부, 모집 일정, 수강료와 자격 관련 세부 기준은 과정별 안내 또는 상담에서 확인해 주세요."
                  : p.slug === "community"
                    ? "서비스별 이용 대상과 참여 조건이 다를 수 있습니다. 상담을 통해 해당 사업의 이용 절차를 확인해 주세요."
                    : p.slug === "books"
                      ? "도서명·ISBN·수량·희망 납품 장소와 일정을 알려주시면 품목과 공급 조건 확인에 도움이 됩니다."
                      : "과정별 운영 일정과 참여 방법은 현재 개설 과정 또는 기관 상담에서 확인해 주세요."}
              </p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

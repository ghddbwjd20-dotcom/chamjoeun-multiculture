import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  LibraryBig,
  Globe2,
  House,
  Users,
  BriefcaseBusiness,
  Monitor,
  Phone,
  MapPin,
} from "lucide-react";
import { socinet } from "@/lib/data";
import { detailedPrograms, values } from "@/lib/content";
import { query } from "@/lib/db";
import { HeroFilm } from "@/components/hero-film";
import { Reveal } from "@/components/reveal";
import { LmsShowcase } from "@/components/lms-showcase";
import { NewsTabs, type NewsItem } from "@/components/news-tabs";
import { Partners } from "@/components/partners";
const services = [
  {
    href: "/support#settlement",
    title: "동포체류지원센터",
    sub: "정착·상담·취업연계",
    icon: Users,
  },
  {
    href: socinet,
    title: "사회통합프로그램",
    sub: "KIIP 공식 과정조회",
    icon: Globe2,
  },
  {
    href: "/support#early",
    title: "조기적응프로그램",
    sub: "입국 초기 생활 안내",
    icon: House,
  },
  {
    href: "/courses",
    title: "교육과정 / LMS",
    sub: "온라인 과정·나의 강의실",
    icon: Monitor,
  },
  {
    href: "/business#qualification",
    title: "민간자격과정",
    sub: "직무·전문 역량 개발",
    icon: GraduationCap,
  },
  {
    href: "/business#community",
    title: "지역사회서비스",
    sub: "교육·복지 프로그램",
    icon: HeartHandshake,
  },
  {
    href: "/business#lifelong",
    title: "평생교육",
    sub: "문해·직업·역량 강화",
    icon: BookOpen,
  },
  {
    href: "/business#books",
    title: "도서납품",
    sub: "기관·학교·기업 도서 공급",
    icon: LibraryBig,
  },
];
const ministry = [
  {
    num: "01",
    name: "동포체류지원센터",
    en: "SETTLEMENT SUPPORT",
    description:
      "국내 체류 동포의 안정적인 정착과 자립을 위해 정착상담, 취업정보와 지역사회 연계를 지원합니다.",
    tags: ["정착상담", "취업지원", "기관 연계"],
    image: "consultation-space.jpg",
    href: "/support#settlement",
    label: "센터 안내",
  },
  {
    num: "02",
    name: "사회통합프로그램(KIIP)",
    en: "SOCIAL INTEGRATION",
    description:
      "한국어와 한국사회 이해교육으로 이민자의 생활 적응과 사회통합을 돕습니다. 공식 과정조회는 사회통합정보망에서 제공합니다.",
    tags: ["한국어교육", "한국사회 이해", "공식 과정조회"],
    image: "learning-space.jpg",
    href: socinet,
    label: "과정조회",
  },
  {
    num: "03",
    name: "조기적응프로그램",
    en: "EARLY ADAPTATION",
    description:
      "입국 초기 이민자에게 필요한 한국생활 정보와 기초 사회적응 정보를 안내해 새로운 출발을 돕습니다.",
    tags: ["초기 생활정보", "사회 적응", "이용 안내"],
    image: "study-detail.jpg",
    href: "/support#early",
    label: "프로그램 안내",
  },
];
export default async function Home() {
  const posts = await query(
    "SELECT id,title,category,created_at FROM posts WHERE published=true AND deleted_at IS NULL ORDER BY pinned DESC,created_at DESC LIMIT 40",
  );
  const news = posts.map((p) => ({
    ...p,
    created_at: new Date(p.created_at).toISOString(),
  })) as NewsItem[];
  return (
    <>
      <section className="editorial-hero">
        <div className="container hero-layout">
          <div className="editorial-hero-copy">
            <span className="eyebrow">CHAMJOEUN MULTICULTURE</span>
            <p className="institution-tag">
              외국인의 안정적인 정착과 교육을 지원하는 전문기관
            </p>
            <h1>
              배움에서 정착까지,
              <br />
              <span>사람의 가능성을</span>
              <br />
              연결합니다.
            </h1>
            <p className="hero-lead">
              다른 문화와 경험이 만나 새로운 가능성이 됩니다.
              <br />
              참조은다문화가 한국에서의 일상과 성장을 함께합니다.
            </p>
            <div className="actions">
              <Link className="button primary" href="/support#settlement">
                동포체류지원센터 <ArrowUpRight size={17} />
              </Link>
              <Link className="hero-about-link" href="/about">
                기관소개 <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span>PEOPLE · EDUCATION · COMMUNITY</span>
              <b>사람을 잇는 교육, 일상을 잇는 지원.</b>
            </div>
          </div>
          <HeroFilm />
        </div>
        <div className="container credential-line">
          <span>
            <b>2011</b> 사회통합프로그램 운영기관 지정
          </span>
          <span>
            <b>2014</b> 인증 사회적기업
          </span>
          <span>
            <b>2026</b> 동포체류지원센터 지정
          </span>
          <a href="/about#history">
            이어온 발자취 <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
      <section className="service-hub" id="quick">
        <div className="container">
          <Reveal className="service-hub-heading">
            <div>
              <span className="eyebrow">MAIN SERVICE</span>
              <h2>
                필요한 지원을,
                <br />
                <span>더 가까이.</span>
              </h2>
            </div>
            <p>
              정착부터 배움까지, 자주 찾는 서비스를
              <br />
              한곳에서 빠르게 확인하세요.
            </p>
          </Reveal>
          <div className="service-hub-grid">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 35}>
                <Link
                  href={s.href}
                  {...(s.href.startsWith("https")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <s.icon size={28} strokeWidth={1.35} />
                  <strong>{s.title}</strong>
                  <span>{s.sub}</span>
                  <ArrowUpRight size={15} className="hub-arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="ministry-section section" id="core">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">SETTLEMENT & SOCIAL INTEGRATION</span>
              <h2>
                안정적인 정착,
                <br />
                함께하는 사회통합.
              </h2>
            </div>
            <div>
              <span className="section-category">법무부 지정 주요사업</span>
              <p>
                동포체류지원센터를 중심으로 한국어와 한국사회 이해,
                <br />
                입국 초기 적응까지 필요한 지원을 연결합니다.
              </p>
              <Link href="/support" className="text-link">
                사업 안내 더보기 <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>
          <div className="ministry-grid">
            {ministry.map((s, i) => (
              <Reveal key={s.num} delay={i * 90}>
                <article className="ministry-card">
                  <a
                    href={s.href}
                    {...(s.href.startsWith("https")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="ministry-card-image"
                  >
                    <img src={`/images/${s.image}`} alt="" loading="lazy" />
                    <span>{s.num}</span>
                    <i>
                      <ArrowUpRight size={24} />
                    </i>
                  </a>
                  <span className="ministry-en">{s.en}</span>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="tag-list">
                    {s.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <a
                    href={s.href}
                    {...(s.href.startsWith("https")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-link"
                  >
                    {s.label} <ArrowRight size={16} />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="information-note">
            <Globe2 size={19} />
            <p>
              <b>사회통합프로그램(KIIP) 과정조회·신청 안내</b>
              <span>
                KIIP는 공식 사회통합정보망에서 조회·신청합니다. 자체 온라인
                교육과정 신청과 구분하여 이용해 주세요.
              </span>
            </p>
            <a href={socinet} target="_blank" rel="noopener noreferrer">
              공식 사이트 <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>
      <section className="programs-editorial section" id="programs">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">EDUCATION & COMMUNITY</span>
              <h2>
                배움의 깊이를 더하고,
                <br />
                일상의 가능성을 넓힙니다.
              </h2>
            </div>
            <div>
              <p>
                평생교육·민간자격·지역사회서비스·도서납품.
                <br />
                교육과 지역의 다양한 필요를 한 기관에서 이어갑니다.
              </p>
              <Link href="/business" className="text-link">
                전체 사업 보기 <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>
          <div className="editorial-program-grid">
            {detailedPrograms.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 100}>
                <article className="editorial-program">
                  <Link
                    href={`/business#${p.slug}`}
                    className="editorial-program-image"
                  >
                    <img src={`/images/${p.image}`} alt="" loading="lazy" />
                    <span>
                      {p.number} / {p.en.toUpperCase()}
                    </span>
                    <i>
                      <ArrowUpRight size={25} />
                    </i>
                  </Link>
                  <div className="editorial-program-copy">
                    <div>
                      <span className="eyebrow">{p.en.toUpperCase()}</span>
                      <h3>{p.name}</h3>
                    </div>
                    <p>{p.summary}</p>
                    <ul>
                      {p.items.slice(0, 3).map(([title]) => (
                        <li key={title}>{title}</li>
                      ))}
                    </ul>
                    <Link href={`/business#${p.slug}`} className="text-link">
                      자세히 알아보기 <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="lms-editorial section" id="education">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">ONLINE LEARNING</span>
              <h2>
                필요할 때, 어디서나.
                <br />
                나의 배움은 계속됩니다.
              </h2>
            </div>
            <p>
              기관의 교육 프로그램을 온라인에서도 이어갑니다.
              <br />
              교육과정 확인부터 수강과 학습 현황까지, 한곳에서.
            </p>
          </Reveal>
          <Reveal>
            <LmsShowcase />
          </Reveal>
        </div>
      </section>
      <section className="vision-compact" id="vision">
        <div className="container">
          <Reveal className="vision-layout">
            <div>
              <span className="eyebrow">OUR PHILOSOPHY</span>
              <h2>
                서로 다른 가능성이
                <br />
                함께 빛나는 사회.
              </h2>
              <Link href="/about#philosophy" className="text-link">
                설립이념 자세히 보기 <ArrowUpRight size={17} />
              </Link>
            </div>
            <div>
              <blockquote>
                “우리 모두 각자가 가진 능력과 개성을 발휘하여,
                <br />
                원하는 분야의 꿈과 미래를 만들어 나가면 좋겠습니다.”
              </blockquote>
              <p>
                경험과 능력, 문화적 배경의 차이를 존중합니다. 교육으로 가능성을
                발견하고,
                <br />그 가능성이 학습과 취업, 사회참여로 이어지도록 돕습니다.
              </p>
              <div className="value-chips">
                {values.map((v) => (
                  <span key={v.title}>{v.title}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section home-news-section" id="news">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">NEWS & STORIES</span>
              <h2>참조은다문화의 오늘.</h2>
            </div>
            <Link href="/news" className="text-link">
              기관소식 전체 보기 <ArrowUpRight size={17} />
            </Link>
          </Reveal>
          <Reveal className="home-news-grid">
            <NewsTabs posts={news} />
            <div className="news-feature-links">
              <Link href="/news?category=행사사진" className="news-feature">
                <img
                  src="/images/consultation-space.jpg"
                  alt=""
                  loading="lazy"
                />
                <span>
                  <small>GALLERY</small>
                  <b>행사·교육 이야기</b>
                  <em>현장의 소식과 활동을 만납니다.</em>
                </span>
                <ArrowUpRight />
              </Link>
              <Link href="/courses" className="news-feature education">
                <span>
                  <small>LEARNING JOURNEY</small>
                  <b>새로운 배움의 시작</b>
                  <em>교육과정부터 나의 강의실까지.</em>
                </span>
                <Monitor size={50} />
                <ArrowUpRight />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="partners-section">
        <div className="container">
          <Reveal>
            <Partners />
          </Reveal>
        </div>
      </section>
      <section className="editorial-contact" id="contact">
        <div className="container">
          <Reveal className="editorial-contact-layout">
            <div>
              <span className="eyebrow">LET’S CONNECT</span>
              <h2>
                당신의 다음 시작을
                <br />
                함께 이야기합니다.
              </h2>
              <p>
                교육 상담, 정착지원, 사업제휴와 도서납품까지.
                <br />
                필요한 내용을 남겨주시면 안내해 드리겠습니다.
              </p>
              <Link className="button primary" href="/contact">
                교육·사업제휴 문의 <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="contact-directory">
              <a href="tel:0515585629">
                <Phone size={22} />
                <span>
                  대표전화<strong>051-558-5629</strong>
                </span>
                <ArrowUpRight size={20} />
              </a>
              <a href="mailto:chamjoeund@gmail.com">
                <span className="directory-symbol">@</span>
                <span>
                  이메일<strong>chamjoeund@gmail.com</strong>
                </span>
                <ArrowUpRight size={20} />
              </a>
              <Link href="/about#visit">
                <MapPin size={22} />
                <span>
                  오시는 길<strong>부산 동래구 금강로 70</strong>
                  <small>참조은빌딩 5층, 7층</small>
                </span>
                <ArrowUpRight size={20} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

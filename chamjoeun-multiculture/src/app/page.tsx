import { contactSettings } from "@/lib/site-settings";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Monitor, Phone, MapPin } from "lucide-react";
import { detailedPrograms, values } from "@/lib/content";
import { query } from "@/lib/db";
import { HomeIntro } from "@/components/home-intro";
import { Reveal } from "@/components/reveal";
import { LmsShowcase } from "@/components/lms-showcase";
import { NewsTabs, type NewsItem } from "@/components/news-tabs";
import { Partners } from "@/components/partners";
import "@/components/home-continuation.css";
export default async function Home() {
  const contact = await contactSettings();
  const posts = await query(
    "SELECT id,title,category,created_at FROM posts WHERE published=true AND deleted_at IS NULL ORDER BY pinned DESC,created_at DESC LIMIT 40",
  );
  const news = posts.map((p) => ({
    ...p,
    created_at: new Date(p.created_at).toISOString(),
  })) as NewsItem[];
  return (
    <>
      <HomeIntro />
      <div className="home-continuation">
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
                      <span>{p.number}</span>
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
                  경험과 능력, 문화적 배경의 차이를 존중합니다. 교육으로
                  가능성을 발견하고,
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
                <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone size={22} />
                  <span>
                    대표전화<strong>{contact.phone}</strong>
                  </span>
                  <ArrowUpRight size={20} />
                </a>
                {contact.mobile && (
                  <a href={`tel:${contact.mobile.replace(/[^+\d]/g, "")}`}>
                    <Phone size={22} />
                    <span>
                      휴대전화<strong>{contact.mobile}</strong>
                    </span>
                    <ArrowUpRight size={20} />
                  </a>
                )}
                <a href={`mailto:${contact.email}`}>
                  <span className="directory-symbol">@</span>
                  <span>
                    이메일<strong>{contact.email}</strong>
                  </span>
                  <ArrowUpRight size={20} />
                </a>
                <Link href="/about#visit">
                  <MapPin size={22} />
                  <span>
                    오시는 길<strong>{contact.address}</strong>
                  </span>
                  <ArrowUpRight size={20} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}

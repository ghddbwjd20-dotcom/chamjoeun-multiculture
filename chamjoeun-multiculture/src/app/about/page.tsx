import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Reveal } from "@/components/reveal";
import { Partners } from "@/components/partners";
import { history, values } from "@/lib/content";
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="ABOUT CHAMJOEUN"
        title="사람과 교육을 연결합니다."
        description="다양한 배경을 가진 사람들이 자신의 가능성을 발견하고 지역사회의 구성원으로 함께 성장할 수 있도록. 참조은다문화가 배움과 정착의 여정을 함께합니다."
      />
      <div className="container content">
        <Reveal className="about-intro">
          <div className="about-intro-image">
            <img
              src="/images/learning-space.jpg"
              alt="자연광이 들어오는 도서관 참고 사진"
            />
            <span>PEOPLE · LEARNING · COMMUNITY</span>
          </div>
          <div>
            <span className="eyebrow">GREETINGS</span>
            <h2>
              다른 경험이 만나,
              <br />더 넓은 내일이 됩니다.
            </h2>
            <p className="lead">
              참조은다문화(주)는 외국인의 안정적인 정착과 교육을 지원하는
              전문기관이자, 교육과 사회서비스를 통해 함께 성장하는 사회를
              만들어가는 사회적기업입니다.
            </p>
            <p>
              2010년 부산에서 다문화 분야 활동을 시작한 이후 한국어와 한국사회
              이해교육, 이민자 정착지원, 평생교육, 진로·직업교육, 아동·청소년
              교육과 지역사회서비스로 사업 영역을 넓혀 왔습니다.
            </p>
            <p>
              동포체류지원센터와 사회통합프로그램(KIIP), 조기적응프로그램을
              중심으로 한국생활의 기반을 돕고, 민간자격과정과 성인문해교육 등
              다양한 배움의 기회를 제공합니다.
              정부기관·지방자치단체·교육기관·대학·지역사회와 연결해 교육이
              실질적인 생활의 변화로 이어지도록 노력합니다.
            </p>
            <p className="greeting-sign">
              참조은다문화(주) <strong>대표이사 배경숙</strong>
            </p>
          </div>
        </Reveal>
        <section className="detail-section" id="overview">
          <div className="detail-heading">
            <span className="eyebrow">ORGANIZATION AT A GLANCE</span>
            <h2>한눈에 보는 참조은다문화</h2>
          </div>
          <div className="institution-facts">
            {[
              ["2010", "다문화 분야 활동 시작"],
              ["2013", "독립법인 설립"],
              ["2014", "인증 사회적기업"],
              ["2026", "동포체류지원센터 지정"],
            ].map(([n, t]) => (
              <div key={n}>
                <b>{n}</b>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <dl className="facts-list">
            <dt>법인명</dt>
            <dd>참조은다문화 주식회사</dd>
            <dt>소재지</dt>
            <dd>부산광역시 동래구 금강로 70(온천동, 참조은빌딩) 5층·7층</dd>
            <dt>기관 성격</dt>
            <dd>
              교육·사회서비스를 제공하는 사회적기업, 이민자 정착·사회통합 지원
              전문기관
            </dd>
            <dt>주요 사업</dt>
            <dd>
              동포체류지원센터, 사회통합프로그램(KIIP), 조기적응프로그램,
              평생교육, 민간자격과정, 지역사회서비스투자사업, 도서납품
            </dd>
            <dt>사업 대상</dt>
            <dd>
              이민자·외국인·동포·다문화가정과 자녀, 아동·청소년, 성인과
              중장년층, 지역주민 및 교육·협력기관
            </dd>
          </dl>
        </section>
        <section className="detail-section" id="philosophy">
          <span className="eyebrow">PHILOSOPHY & DIRECTION</span>
          <h2>
            각자가 가진 가능성이
            <br />
            꿈과 미래로 이어지도록.
          </h2>
          <blockquote className="about-quote">
            우리 모두 각자가 가진 능력과 개성을 발휘하여,
            <br />
            원하는 분야의 꿈과 미래를 만들어 나가면 좋겠습니다.
          </blockquote>
          <p className="detail-lead">
            경험과 능력, 문화적 배경의 차이를 존중합니다. 교육으로 개인의
            가능성을 발견하고 그 가능성이 학습과 취업, 사회참여로 이어질 수
            있도록 지원합니다.
          </p>
          <div className="values-grid">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 60}>
                <article>
                  <span>0{i + 1}</span>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="detail-section history-layout" id="history">
          <div>
            <span className="eyebrow">OUR JOURNEY</span>
            <h2>
              2010년부터,
              <br />
              함께 걸어온 길.
            </h2>
            <p>
              부산에서 시작한 다문화 활동이
              <br />
              교육과 정착지원의 전문성으로 이어집니다.
            </p>
          </div>
          <div className="history-list">
            {[...history].reverse().map(([year, text]) => (
              <div key={year}>
                <b>{year}</b>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="detail-section" id="partners">
          <Partners />
          <div className="network-types">
            {[
              ["교육기관", "동래·북부·서부교육지원청 등"],
              [
                "대학",
                "부산가톨릭대학교·고려사이버대학교·동의과학대학교·김해대학교·한국방송통신대학교 등",
              ],
              ["진로기관", "동래·해운대·기장 진로교육지원센터 등"],
              [
                "지역·민간기관",
                "부산진지역자활센터·동래여성자원봉사자회·부산금정청년회의소 등",
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <Link href="/news?category=업무협약" className="text-link">
            업무협약 소식 보기 <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="detail-section" id="visit">
          <span className="eyebrow">VISIT US</span>
          <h2>참조은다문화에 오시는 길</h2>
          <div className="live-map">
            <iframe
              title="참조은다문화 위치 · 부산 동래구 금강로 70"
              src="https://maps.google.com/maps?q=%EB%B6%80%EC%82%B0%20%EB%8F%99%EB%9E%98%EA%B5%AC%20%EA%B8%88%EA%B0%95%EB%A1%9C%2070&amp;z=16&amp;output=embed"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div>
              <span>부산 동래구 금강로 70 · 참조은빌딩 5층, 7층</span>
              <a
                href="https://map.naver.com/p/search/부산%20동래구%20금강로%2070"
                target="_blank"
                rel="noopener noreferrer"
              >
                네이버 지도 ↗
              </a>
              <a
                href="https://map.kakao.com/?q=부산%20동래구%20금강로%2070"
                target="_blank"
                rel="noopener noreferrer"
              >
                카카오 지도 ↗
              </a>
            </div>
          </div>
          <div className="visit-layout">
            <div className="visit-address">
              <MapPin size={28} />
              <h3>부산 동래구 금강로 70</h3>
              <p>온천동, 참조은빌딩 5층·7층</p>
              <a
                className="button outline"
                href="https://map.naver.com/p/search/부산%20동래구%20금강로%2070"
                target="_blank"
                rel="noopener noreferrer"
              >
                네이버 지도에서 보기 <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="visit-info">
              <p>
                <Phone size={18} />
                <span>
                  대표전화 <a href="tel:0515585629">051-558-5629</a>
                </span>
              </p>
              <p>
                <Mail size={18} />
                <span>
                  이메일{" "}
                  <a href="mailto:chamjoeund@gmail.com">chamjoeund@gmail.com</a>
                </span>
              </p>
              <p>
                방문 상담을 원하시면 연락을 통해 사업별 이용 방법과 담당자
                안내를 먼저 확인해 주세요. 운영 일정은 기관으로 문의하시면
                안내해 드립니다.
              </p>
              <Link href="/contact" className="text-link">
                방문·이용 문의 <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

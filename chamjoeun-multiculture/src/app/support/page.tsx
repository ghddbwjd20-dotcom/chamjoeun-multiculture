import Link from "next/link";
import {
  ArrowUpRight,
  Users,
  BriefcaseBusiness,
  Network,
  BookOpen,
  Globe2,
  Phone,
} from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { socinet } from "@/lib/data";
import { Reveal } from "@/components/reveal";
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="SETTLEMENT & SOCIAL INTEGRATION"
        title="한국에서의 일상, 함께 시작합니다."
        description="동포체류지원센터를 중심으로 정착상담과 취업지원, 한국어·한국사회 이해교육과 초기 적응을 연결합니다."
      />
      <div className="container content">
        <nav className="section-links" aria-label="지원사업 바로가기">
          {[
            ["settlement", "동포체류지원센터"],
            ["kiip", "사회통합프로그램"],
            ["early", "조기적응프로그램"],
            ["korean", "한국어·한국문화"],
          ].map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
              <ArrowUpRight size={15} />
            </a>
          ))}
        </nav>
        <section className="detail-section" id="settlement">
          <Reveal className="support-detail-intro">
            <div>
              <span className="eyebrow">DONGPO SETTLEMENT SUPPORT CENTER</span>
              <h2>동포체류지원센터</h2>
              <h3>
                안정적인 정착이,
                <br />
                스스로 서는 힘이 되도록.
              </h3>
              <p>
                국내 체류 동포의 안정적인 정착과 자립을 지원하는 핵심사업입니다.
                한국생활에 필요한 정보와 정착상담을 제공하고, 취업과 지역사회
                자원 연계를 통해 실질적인 일상 기반을 돕습니다.
              </p>
              <Link href="/contact?kind=settlement" className="button primary">
                센터 이용·정착 상담 <ArrowUpRight size={16} />
              </Link>
            </div>
            <img
              src="/images/consultation-space.jpg"
              alt="상담과 협력을 위한 회의 공간 참고 사진"
            />
          </Reveal>
          <div className="support-service-grid" id="counsel">
            {[
              {
                Icon: Users,
                title: "정착상담",
                text: "생활·제도·정착 관련 상담과 필요한 정보 제공을 통해 한국사회 적응을 돕습니다.",
                list: [
                  "생활과 정착 관련 문의",
                  "필요한 정보와 지원 경로 안내",
                  "상담 내용을 바탕으로 한 연계",
                ],
              },
              {
                Icon: BriefcaseBusiness,
                title: "취업지원",
                text: "구직상담과 취업정보, 관련 기관 연계로 경제적 자립과 안정적인 사회정착을 지원합니다.",
                list: [
                  "구직 관련 상담",
                  "취업정보 안내",
                  "관련 기관·지역 자원 연계",
                ],
              },
              {
                Icon: Network,
                title: "지역사회 연계",
                text: "공공·교육·민간기관 등 지역사회 자원과 연결해 필요한 지원을 찾을 수 있도록 돕습니다.",
                list: [
                  "공공기관 이용 안내",
                  "교육·복지 자원 연결",
                  "지원 분야별 기관 연계",
                ],
              },
            ].map((s) => (
              <article key={s.title}>
                <s.Icon size={27} strokeWidth={1.3} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <ul>
                  {s.list.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="process-block">
            <h3>센터 이용 흐름</h3>
            <ol>
              {[
                "전화·온라인 이용문의",
                "상담 내용과 필요 확인",
                "담당자 상담·정보 안내",
                "필요 서비스·기관 연결",
              ].map((s, i) => (
                <li key={s}>
                  <span>0{i + 1}</span>
                  <strong>{s}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="detail-section" id="kiip">
          <div className="support-program-heading">
            <span className="eyebrow">
              KOREA IMMIGRATION & INTEGRATION PROGRAM
            </span>
            <h2>사회통합프로그램(KIIP)</h2>
            <p className="detail-lead">
              이민자가 한국사회 구성원으로 생활하는 데 필요한 한국어와 한국사회
              이해교육을 제공하여 한국생활 적응과 사회통합을 지원합니다.
            </p>
          </div>
          <div className="support-topic-grid">
            <article>
              <BookOpen size={25} />
              <h3>한국어교육</h3>
              <p>
                일상 의사소통과 한국생활에 필요한 한국어 학습을 통해 생활의
                기반을 다집니다.
              </p>
            </article>
            <article>
              <Globe2 size={25} />
              <h3>한국사회 이해</h3>
              <p>
                한국사회의 제도와 문화, 생활에 관한 이해를 높여 지역사회의
                일원으로 참여하도록 돕습니다.
              </p>
            </article>
          </div>
          <div className="official-link-panel">
            <div>
              <span className="eyebrow">OFFICIAL APPLICATION</span>
              <h3>과정조회·신청은 사회통합정보망에서.</h3>
              <p>
                참조은다문화 홈페이지는 KIIP 사업을 안내합니다.
                과정조회·수강신청과 신청 결과 확인은 공식
                사회통합정보망(Socinet)에서 진행해 주세요. 자체 온라인 강의실
                신청과는 별개의 절차입니다.
              </p>
            </div>
            <a
              href={socinet}
              target="_blank"
              rel="noopener noreferrer"
              className="button primary"
            >
              과정조회 <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
        <section className="detail-section" id="early">
          <Reveal className="business-detail-intro">
            <img
              className="detail-feature-image"
              src="/images/study-detail.jpg"
              alt="초기 적응 안내를 표현한 콘셉트 이미지"
              loading="lazy"
            />
            <div>
              <span className="eyebrow">EARLY ADAPTATION PROGRAM</span>
              <h2>조기적응프로그램</h2>
              <h3>
                입국 초기의 낯섦을,
                <br />
                생활에 필요한 이해로.
              </h3>
              <p className="detail-lead">
                국내에 입국한 이민자 등이 초기 단계에서 필요한 한국생활 정보와
                기초 사회적응 정보를 이해할 수 있도록 지원합니다. 생활의 차이를
                이해하고 새로운 환경에서 첫걸음을 시작하도록 돕습니다.
              </p>
              <ul className="detail-check-list">
                <li>입국 초기 한국생활에 필요한 기초 정보</li>
                <li>생활 적응과 사회 이해를 위한 안내</li>
                <li>대상과 참여 방법에 관한 이용 상담</li>
              </ul>
              <Link href="/contact?kind=settlement" className="button primary">
                프로그램 이용 문의 <ArrowUpRight size={16} />
              </Link>
            </div>
          </Reveal>
        </section>
        <section className="detail-section" id="korean">
          <span className="eyebrow">LANGUAGE & CULTURE</span>
          <h2>한국어·한국문화 교육</h2>
          <p className="detail-lead">
            한국어교육과 한국문화체험을 통해 의사소통 능력과 한국사회에 대한
            이해를 높입니다. 다양한 문화적 배경을 존중하면서 생활과 지역사회
            참여로 연결되는 배움을 지원합니다.
          </p>
          <div className="network-types">
            <div>
              <h3>한국어교육</h3>
              <p>일상 의사소통과 한국생활에 필요한 언어 이해를 돕습니다.</p>
            </div>
            <div>
              <h3>한국문화체험</h3>
              <p>문화를 경험하고 서로를 이해하는 교육과 활동을 연결합니다.</p>
            </div>
          </div>
          <Link href="/contact?kind=education" className="text-link">
            개설 프로그램 문의 <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="detail-section faq-section">
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>자주 묻는 질문</h2>
          {[
            [
              "KIIP 과정은 어디에서 신청하나요?",
              "공식 사회통합정보망(Socinet)에서 과정조회와 수강신청을 진행합니다. 위 과정조회 버튼으로 이동할 수 있습니다.",
            ],
            [
              "온라인 교육과정 신청과 KIIP 신청은 같은가요?",
              "아닙니다. 홈페이지의 교육과정·나의 강의실은 자체 온라인 교육을 위한 서비스입니다. KIIP 신청과 조회는 공식 사회통합정보망을 이용해 주세요.",
            ],
            [
              "정착·취업 관련 상담을 받고 싶습니다.",
              "대표전화 051-558-5629 또는 온라인 문의를 통해 상담할 내용을 알려주세요. 담당 분야에 맞는 이용 방법을 안내해 드립니다.",
            ],
            [
              "방문 전에 무엇을 확인하면 좋을까요?",
              "방문 목적과 상담 분야를 먼저 알려주시면 운영 일정과 필요한 안내사항을 확인하실 수 있습니다. 상담에 필요한 준비사항은 담당자의 안내를 받아주세요.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      </div>
    </>
  );
}

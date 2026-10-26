import { PageHeading } from "@/components/page-heading";
export default function Page() {
  return (
    <>
      <PageHeading
        eyebrow="TERMS OF SERVICE"
        title="이용약관"
        description="운영 전 최종 확인이 필요한 서비스 이용약관 초안입니다."
      />
      <article className="container content prose">
        <h2>1. 서비스 이용</h2>
        <p>
          본 서비스는 기관·사업 정보, 문의와 자체 온라인 교육을 제공합니다.
          사회통합프로그램(KIIP) 과정조회·신청은 공식 사회통합정보망에서
          제공합니다.
        </p>
        <h2>2. 회원과 계정</h2>
        <p>
          정확한 정보를 입력하고 이메일 인증을 완료해 주세요. 계정 공유·타인
          정보 이용과 부정한 학습 기록 조작은 허용하지 않습니다.
        </p>
        <h2>3. 수강과 수료</h2>
        <p>
          과정별 수강기간·수료 기준은 과정 안내에 표시합니다. 실제 시청한 구간을
          기준으로 진도를 계산하며 건너뛴 구간과 반복 시청 구간을 중복 인정하지
          않습니다.
        </p>
        <h2>4. 결제와 환불</h2>
        <p>
          결제·취소·환불 기준과 신청 절차는 유료 서비스 개시 전에 과정별 정책과
          함께 확정하여 안내합니다. 현재 개발 단계에서는 실제 유료결제를
          제공하지 않습니다.
        </p>
        <h2>5. 콘텐츠 이용</h2>
        <p>교육 영상과 자료의 무단 복제·배포·판매를 금지합니다.</p>
        <h2>6. 문의</h2>
        <p>051-558-5629 / chamjoeund@gmail.com</p>
        <p>개발 초안: 2026년 10월 26일</p>
      </article>
    </>
  );
}

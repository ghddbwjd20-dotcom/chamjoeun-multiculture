import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { ActionForm } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { register } from "@/app/auth-actions";
export default function Page() {
  return (
    <div className="container membership-layout registration">
      <aside className="membership-intro">
        <span className="eyebrow">YOUR LEARNING JOURNEY</span>
        <h1>
          새로운 배움의 시작,
          <br />
          참조은다문화와 함께.
        </h1>
        <p>
          하나의 계정으로 교육과정 확인부터
          <br />
          나의 강의실과 수료 현황까지 연결합니다.
        </p>
        <div className="membership-photo">
          <img
            src="/images/learning-space.jpg"
            alt="빛이 들어오는 도서관 참고 사진"
          />
        </div>
        <ul>
          <li>
            <BookOpen size={20} />
            <span>
              <b>나에게 맞는 교육과정</b>분야별 과정과 커리큘럼을 한눈에
              확인합니다.
            </span>
          </li>
          <li>
            <GraduationCap size={20} />
            <span>
              <b>나의 학습 기록</b>진도·이어보기·수료·발급 내역을 관리합니다.
            </span>
          </li>
          <li>
            <ShieldCheck size={20} />
            <span>
              <b>안전한 계정 관리</b>이메일 인증과 서버 세션으로 보호합니다.
            </span>
          </li>
        </ul>
        <p className="account-note">
          KIIP 과정조회·신청은 공식 사회통합정보망을 이용합니다.
        </p>
      </aside>
      <section className="membership-form-panel">
        <div className="membership-form-heading">
          <span className="eyebrow">CREATE ACCOUNT</span>
          <h2>회원가입</h2>
          <p>
            필수 정보부터 입력해 주세요. 선택 정보는 비워도 가입할 수 있습니다.
          </p>
        </div>
        <ActionForm action={register} label="가입하고 이메일 인증하기">
          <h3 className="form-section-title">
            기본 정보 <span>필수</span>
          </h3>
          <label>
            이름
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={60}
              required
              placeholder="실명을 입력해 주세요"
            />
            <small>수료증에 표시되는 이름입니다.</small>
          </label>
          <label>
            이메일 (로그인 아이디)
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              placeholder="name@example.com"
            />
            <small>이메일 인증과 계정 안내를 위해 사용합니다.</small>
          </label>
          <PasswordInput newPassword showStrength />
          <PasswordInput
            name="confirmPassword"
            label="비밀번호 확인"
            newPassword
          />
          <h3 className="form-section-title">
            추가 정보 <span>선택</span>
          </h3>
          <div className="split">
            <label>
              연락처
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={24}
                placeholder="010-0000-0000"
              />
            </label>
            <label>
              소속·기관
              <input
                name="organization"
                autoComplete="organization"
                maxLength={100}
                placeholder="소속이 있다면 입력해 주세요"
              />
            </label>
          </div>
          <fieldset className="interest-options">
            <legend>
              관심 분야 <small>중복 선택 가능</small>
            </legend>
            {["평생교육", "민간자격과정", "한국어교육", "지역사회서비스"].map(
              (c) => (
                <label key={c}>
                  <input type="checkbox" name="interests" value={c} />
                  <span>{c}</span>
                </label>
              ),
            )}
          </fieldset>
          <h3 className="form-section-title">약관 및 동의</h3>
          <label className="checkbox">
            <input type="checkbox" name="terms" required />
            <span>
              [필수]{" "}
              <Link href="/terms" target="_blank">
                이용약관
              </Link>
              에 동의합니다.
            </span>
          </label>
          <label className="checkbox">
            <input type="checkbox" name="privacy" required />
            <span>
              [필수]{" "}
              <Link href="/privacy" target="_blank">
                개인정보 수집·이용
              </Link>
              에 동의합니다.
            </span>
          </label>
          <label className="checkbox">
            <input type="checkbox" name="marketing" />
            <span>[선택] 교육·사업 소식 이메일 수신에 동의합니다.</span>
          </label>
          <p className="form-consent-note">
            선택 정보와 홍보 수신 동의는 가입 필수 조건이 아닙니다. 이메일
            인증을 완료한 뒤 로그인할 수 있습니다.
          </p>
        </ActionForm>
        <p className="auth-bottom">
          이미 계정이 있으신가요? <Link href="/login">로그인하기</Link>
        </p>
      </section>
    </div>
  );
}

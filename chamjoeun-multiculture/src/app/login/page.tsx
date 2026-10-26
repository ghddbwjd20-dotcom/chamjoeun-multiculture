import Link from "next/link";
import { BookOpen, ShieldCheck, HelpCircle, ArrowUpRight } from "lucide-react";
import { ActionForm } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { login } from "@/app/auth-actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; social?: string }>;
}) {
  const { verified, social } = await searchParams;
  return (
    <div className="container membership-layout login-layout">
      <aside className="membership-intro">
        <span className="eyebrow">CONTINUE YOUR JOURNEY</span>
        <h1>
          당신의 배움이
          <br />
          계속되는 곳.
        </h1>
        <p>
          어제의 학습을 오늘의 가능성으로.
          <br />
          나의 강의실에서 배움을 이어가세요.
        </p>
        <div className="membership-photo">
          <img src="/images/study-detail.jpg" alt="노트와 펜 참고 사진" />
        </div>
        <div className="login-support">
          <HelpCircle size={22} />
          <div>
            <b>이용에 도움이 필요하신가요?</b>
            <p>
              051-558-5629
              <br />
              chamjoeund@gmail.com
            </p>
          </div>
          <Link href="/contact" aria-label="이용 문의">
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </aside>
      <section className="membership-form-panel">
        <div className="membership-form-heading">
          <span className="eyebrow">MEMBER SIGN IN</span>
          <h2>로그인</h2>
          <p>이메일과 비밀번호를 입력해 주세요.</p>
        </div>
        {verified && (
          <p
            className={`alert ${verified === "yes" ? "" : "error"}`}
            style={{ marginBottom: 25 }}
          >
            {verified === "yes"
              ? "이메일 인증이 완료되었습니다. 로그인해 주세요."
              : "인증 링크가 만료되었거나 올바르지 않습니다."}
          </p>
        )}
        {social && (
          <p className="alert" style={{ marginBottom: 20 }}>
            {social === "link_required"
              ? "이미 가입된 이메일입니다. 기존 계정으로 로그인한 뒤 회원정보에서 소셜 계정을 연결해 주세요."
              : social === "not_configured"
                ? "선택한 소셜 로그인은 계정 연동 설정을 준비 중입니다. 이메일 로그인을 이용해 주세요."
                : "소셜 인증을 완료하지 못했습니다. 다시 시도해 주세요."}
          </p>
        )}
        <ActionForm action={login} label="로그인">
          <label>
            이메일
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              placeholder="가입한 이메일"
            />
          </label>
          <PasswordInput />
          <label className="checkbox">
            <input type="checkbox" name="remember" />
            <span>로그인 상태 유지 (7일)</span>
          </label>
        </ActionForm>
        <div className="social-signin-divider"><span>간편 로그인</span></div>
        <div className="social-login-buttons">
          {(["kakao", "naver", "google"] as const).map((provider) => (
            <a key={provider} className={`social-signin ${provider}`} href={`/api/social/${provider}`}>
              <span className="social-provider-icon" aria-hidden="true">{provider === "kakao" ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.4 2 10.5c0 2.7 1.8 5 4.5 6.3L5.4 21l4.8-3.2 1.8.2c5.5 0 10-3.4 10-7.5S17.5 3 12 3Z"/></svg> : provider === "naver" ? "N" : <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.3 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6a6.1 6.1 0 0 1-9.1-3.2H2.9v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.3 13.8a6 6 0 0 1 0-3.6V7.5H2.9a10 10 0 0 0 0 9l3.4-2.7Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9.1 5.5l3.4 2.7A6 6 0 0 1 12 6Z"/></svg>}</span>
              {{kakao:"카카오",naver:"네이버",google:"Google"}[provider]}로 로그인
            </a>
          ))}
        </div>
        <div className="login-links">
          <Link href="/forgot-password">비밀번호 재설정</Link>
          <Link href="/forgot-password?mode=verify">인증메일 재발송</Link>
        </div>
        <div className="signup-invitation">
          <h3>참조은다문화가 처음이신가요?</h3>
          <p>회원가입 후 교육과정과 나의 학습 현황을 확인할 수 있습니다.</p>
          <Link href="/register" className="button outline">
            회원가입 <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="secure-login-note">
          <ShieldCheck size={16} />
          <span>
            비밀번호는 단방향 해시로 저장되며 브라우저에 저장되지 않습니다.
          </span>
        </div>
      </section>
    </div>
  );
}

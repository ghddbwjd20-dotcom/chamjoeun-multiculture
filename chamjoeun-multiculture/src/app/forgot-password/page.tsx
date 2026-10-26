import Link from "next/link";
import { ActionForm } from "@/components/form";
import { requestReset, resendVerification } from "@/app/auth-recovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const verify = (await searchParams).mode === "verify";
  return (
    <div className="auth-container">
      <span className="eyebrow">ACCOUNT SUPPORT</span>
      <h1>{verify ? "인증메일 다시 받기" : "비밀번호 재설정"}</h1>
      <p>
        가입한 이메일을 입력해 주세요. {verify ? "인증" : "재설정"} 링크를
        안내합니다.
      </p>
      <ActionForm
        action={verify ? resendVerification : requestReset}
        label="안내메일 받기"
      >
        <label>
          가입 이메일
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </ActionForm>
      <p className="auth-bottom">
        <Link href="/login">로그인으로 돌아가기</Link>
      </p>
      <p className="account-note">
        이메일이 로그인 아이디입니다. 가입 이메일을 기억하지 못하면 기관에
        문의해 주세요.
      </p>
    </div>
  );
}

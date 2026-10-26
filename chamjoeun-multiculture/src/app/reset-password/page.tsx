import Link from "next/link";
import { ActionForm } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { resetPassword } from "@/app/auth-recovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="auth-container">
      <span className="eyebrow">RESET PASSWORD</span>
      <h1>새 비밀번호 설정</h1>
      <p>변경 후 모든 기존 로그인은 종료됩니다.</p>
      <ActionForm action={resetPassword} label="비밀번호 변경">
        <input type="hidden" name="token" value={token ?? ""} />
        <PasswordInput newPassword showStrength />
        <PasswordInput
          name="confirmPassword"
          label="비밀번호 확인"
          newPassword
        />
      </ActionForm>
      <p className="auth-bottom">
        <Link href="/login">로그인하기</Link>
      </p>
    </div>
  );
}

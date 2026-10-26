import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { digest } from "@/lib/auth";
import { ActionForm } from "@/components/form";
import { finishSocialSignup } from "./actions";
import Link from "next/link";
export default async function Page() {
  const token = (await cookies()).get("cj_social_pending")?.value;
  const [pending] = token
    ? await query(
        "SELECT email,name FROM social_pending WHERE token_hash=$1 AND expires_at>now()",
        [digest(token)],
      )
    : [];
  return (
    <div className="auth-container">
      <span className="eyebrow">SOCIAL SIGN UP</span>
      <h1>가입 정보 확인</h1>
      <p>소셜 인증 후 서비스 이용에 필요한 정보를 확인합니다.</p>
      <ActionForm action={finishSocialSignup} label="확인하고 가입">
        <label>
          이름
          <input
            name="name"
            defaultValue={pending?.name ?? ""}
            minLength={2}
            maxLength={60}
            required
          />
        </label>
        <label>
          이메일
          <input
            name="email"
            type="email"
            defaultValue={pending?.email ?? ""}
            required
          />
        </label>
        <label className="checkbox">
          <input name="terms" type="checkbox" required />
          <span>
            <Link href="/terms" target="_blank">
              이용약관
            </Link>{" "}
            동의 (필수)
          </span>
        </label>
        <label className="checkbox">
          <input name="privacy" type="checkbox" required />
          <span>
            <Link href="/privacy" target="_blank">
              개인정보 수집·이용
            </Link>{" "}
            동의 (필수)
          </span>
        </label>
      </ActionForm>
    </div>
  );
}

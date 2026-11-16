import Link from "next/link";
import { ActionForm } from "@/components/form";
import { findAccount } from "@/app/auth-recovery";

export default function Page() {
  return (
    <div className="auth-container">
      <h1>가입 이메일 찾기</h1>
      <p>
        가입할 때 등록한 이름과 휴대전화 번호를 입력하면, 등록된 번호로 일부
        가린 이메일을 안내합니다.
      </p>
      <ActionForm action={findAccount} label="문자로 가입 이메일 힌트 받기">
        <label>
          이름
          <input name="name" autoComplete="name" required maxLength={60} />
        </label>
        <label>
          휴대전화
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={24}
          />
        </label>
      </ActionForm>
      <p className="auth-bottom">
        <Link href="/login">로그인으로 돌아가기</Link> ·{" "}
        <Link href="/contact">기관에 문의하기</Link>
      </p>
    </div>
  );
}

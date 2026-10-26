import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { logout } from "@/app/auth-actions";
import { SiteNavigation } from "@/components/site-navigation";
export async function Header() {
  const user = await currentUser();
  return (
    <header className="site-header">
      <div className="utility">
        <div className="container">
          <span>외국인의 안정적인 정착과 교육을 지원하는 전문기관</span>
          <div>
            {user ? (
              <>
                <Link href="/classroom">나의 강의실</Link>
                <Link href="/mypage">{user.name}님</Link>
                {user.role === "admin" && <Link href="/admin">관리자</Link>}
                <form action={logout}>
                  <button>로그아웃</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">로그인</Link>
                <Link href="/register">회원가입</Link>
              </>
            )}
            <Link href="/contact">이용문의</Link>
          </div>
        </div>
      </div>
      <div className="container header-main">
        <Link className="brand" href="/">
          <img src="/images/logo.png" alt="" />
          <span>
            <span className="brand-name">
              참조은다문화<span className="corporation">(주)</span>
            </span>
            <small>CHAMJOEUN MULTICULTURE</small>
          </span>
        </Link>
        <SiteNavigation />
      </div>
    </header>
  );
}

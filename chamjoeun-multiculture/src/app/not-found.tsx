import Link from "next/link";
export default function Page() {
  return (
    <div className="error-page">
      <span className="eyebrow">404</span>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소가 변경되었거나 현재 제공하지 않는 페이지입니다.</p>
      <Link href="/" className="button primary">
        메인으로 이동
      </Link>
    </div>
  );
}

import Link from "next/link";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>참조은다문화(주)</h2>
          <p>외국인의 안정적인 정착과 교육을 지원하는 전문기관</p>
          <p>
            부산광역시 동래구 금강로 70
            <br />
            참조은빌딩 5층, 7층
          </p>
        </div>
        <div>
          <span className="eyebrow">CONTACT</span>
          <a className="footer-phone" href="tel:0515585629">
            051-558-5629
          </a>
          <a href="mailto:chamjoeund@gmail.com">chamjoeund@gmail.com</a>
        </div>
        <div className="footer-links">
          <Link href="/business">주요사업</Link>
          <Link href="/courses">온라인교육</Link>
          <Link href="/news">기관소식·자료실</Link>
          <Link href="/contact">사업제휴·교육문의</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <div>
          <span>© 2026 CHAMJOEUN MULTICULTURE.</span>
          <p className="visual-notice">
            일부 공간·사물 사진은 사업 이해를 돕기 위한 참고 이미지입니다.
          </p>
        </div>
        <div>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { contactSettings } from "@/lib/site-settings";
export async function Footer() {
  const contact = await contactSettings();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>{contact.name}</h2>
          <p>외국인의 안정적인 정착과 교육을 지원하는 전문기관</p>
          <p>{contact.address}</p>
        </div>
        <div>
          <span className="eyebrow">CONTACT</span>
          <a
            className="footer-phone"
            href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
          >
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
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

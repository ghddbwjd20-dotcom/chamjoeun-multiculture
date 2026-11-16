import Link from "next/link";
import { contactSettings } from "@/lib/site-settings";
export async function Footer() {
  const contact = await contactSettings();
  const phone = contact.phone.replace(/[^+\d]/g, "");
  const mobile = contact.mobile?.replace(/[^+\d]/g, "");
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>{contact.name}</h2>
          <p>외국인의 안정적인 정착과 교육을 지원하는 전문기관</p>
          <p>{contact.address}</p>
          {contact.representative && <p>대표자명 {contact.representative}</p>}
          {contact.businessNumber && (
            <p>사업자등록번호 {contact.businessNumber}</p>
          )}
          {contact.salesRegistration && (
            <p>통신판매업 신고번호 {contact.salesRegistration}</p>
          )}
        </div>
        <div className="footer-contact">
          <h2>연락처</h2>
          <dl>
            <div>
              <dt>대표전화</dt>
              <dd>
                <a href={`tel:${phone}`}>{contact.phone}</a>
              </dd>
            </div>
            {mobile && mobile !== phone && (
              <div>
                <dt>휴대전화</dt>
                <dd>
                  <a href={`tel:${mobile}`}>{contact.mobile}</a>
                </dd>
              </div>
            )}
            <div>
              <dt>이메일</dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </dd>
            </div>
          </dl>
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

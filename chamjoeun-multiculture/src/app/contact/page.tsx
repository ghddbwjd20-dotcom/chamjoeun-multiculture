import { PageHeading } from "@/components/page-heading";
import { ActionForm } from "@/components/form";
import { submitInquiry } from "./actions";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { contactSettings } from "@/lib/site-settings";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const q = await searchParams;
  const user = await currentUser();
  const contact = await contactSettings();
  const kind = ["books", "settlement"].includes(q.kind ?? "")
    ? q.kind
    : "education";
  return (
    <>
      <PageHeading
        eyebrow="CONTACT US"
        title="어떤 이야기를 나눌까요?"
        description="교육 상담, 기관 이용, 사업제휴와 도서납품 문의를 남겨주세요."
      />
      <div className="container content contact-grid">
        <div className="contact-details">
          <span className="eyebrow">GET IN TOUCH</span>
          <h2>{contact.name}</h2>
          <p>필요한 정보를 확인하고 안내드리겠습니다.</p>
          <dl>
            <dt>대표전화</dt>
            <dd>
              <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
                {contact.phone}
              </a>
            </dd>
            <dt>이메일</dt>
            <dd>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </dd>
            <dt>주소</dt>
            <dd>{contact.address}</dd>
          </dl>
        </div>
        <ActionForm action={submitInquiry} label="문의 접수하기">
          <p className="muted">
            {user ? (
              <>
                접수한 문의와 답변은{" "}
                <Link href="/mypage/inquiries">내 문의</Link>에서 확인할 수
                있습니다.
              </>
            ) : (
              <>
                <Link href="/login">로그인</Link> 후 문의하면 마이페이지에서도
                답변을 확인할 수 있습니다.
              </>
            )}
          </p>
          <label>
            문의 종류
            <select name="kind" defaultValue={kind}>
              <option value="education">교육·과정 문의</option>
              <option value="partnership">사업제휴</option>
              <option value="books">도서납품</option>
              <option value="settlement">정착지원·센터 이용</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>
            이름
            <input
              name="name"
              defaultValue={user?.name ?? ""}
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
            />
          </label>
          <label>
            답변받을 이메일
            <input
              name="email"
              defaultValue={user?.email ?? ""}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            제목
            <input name="subject" required minLength={2} maxLength={150} />
          </label>
          <label>
            문의 내용
            <textarea name="message" minLength={10} maxLength={5000} required />
          </label>
          <label className="checkbox">
            <input name="consent" type="checkbox" required />
            <span>
              [필수] 문의 응대를 위한 이름·이메일·문의 내용 수집에 동의합니다.
              보유기간과 권리 행사는 개인정보처리방침을 확인해 주세요.
            </span>
          </label>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ display: "none" }}
          />
        </ActionForm>
      </div>
    </>
  );
}

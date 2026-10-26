import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeading } from "@/components/page-heading";
import { ActionForm } from "@/components/form";
import { PasswordInput } from "@/components/password-input";
import { saveProfile, changePassword, withdraw } from "./actions";
export default async function Page() {
  const user = await requireUser();
  const [profile] = await query(
    "SELECT name,email,phone,organization,marketing_consent FROM users WHERE id=$1",
    [user.id],
  );
  const orders = await query(
    "SELECT o.*,COALESCE(NULLIF(o.course_title,''),c.title) title FROM orders o LEFT JOIN courses c ON c.id=o.course_id WHERE o.user_id=$1 ORDER BY o.created_at DESC",
    [user.id],
  );
  const social = await query(
    "SELECT provider FROM social_accounts WHERE user_id=$1",
    [user.id],
  );
  return (
    <>
      <PageHeading
        eyebrow="MY ACCOUNT"
        title="회원·결제 정보"
        description="회원정보, 비밀번호와 알림 동의, 결제 내역을 관리합니다."
      />
      <div className="container content">
        <nav className="section-links">
          <Link href="/classroom">나의 강의실</Link>
          <a href="#profile">회원정보</a>
          <a href="#payments">결제내역</a>
          <a href="#account-security">계정 관리</a>
        </nav>
        <section id="profile" className="detail-section">
          <div className="split">
            <div>
              <h2>회원정보 수정</h2>
              <p className="detail-lead">
                이메일은 로그인 아이디입니다. 이름을 변경해도 이미 발급된 문서는
                발급 당시 정보를 유지합니다.
              </p>
              <p style={{ marginTop: 20 }}>로그인 이메일: {profile.email}</p>
              <div className="social-account-links">
                <h3>소셜 계정 연결</h3>
                {["google", "naver", "kakao"].map((p) => (
                  <a
                    className="button outline"
                    key={p}
                    href={`/api/social/${p}?link=1`}
                  >
                    {{ google: "구글", naver: "네이버", kakao: "카카오" }[p]}{" "}
                    {social.some((s) => s.provider === p) ? "연결됨" : "연결"}
                  </a>
                ))}
              </div>
            </div>
            <ActionForm action={saveProfile} label="회원정보 저장">
              <label>
                이름
                <input
                  name="name"
                  defaultValue={profile.name}
                  required
                  minLength={2}
                  maxLength={60}
                />
              </label>
              <label>
                연락처
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone}
                  maxLength={24}
                />
              </label>
              <label>
                소속·기관
                <input
                  name="organization"
                  defaultValue={profile.organization}
                  maxLength={100}
                />
              </label>
              <label className="checkbox">
                <input
                  name="marketing"
                  type="checkbox"
                  defaultChecked={profile.marketing_consent}
                />
                <span>
                  교육·사업 소식 이메일 수신에 동의합니다. 해제하면 이후 홍보
                  발송 대상에서 제외됩니다.
                </span>
              </label>
            </ActionForm>
          </div>
        </section>
        <section className="detail-section" id="payments">
          <h2>결제 내역</h2>
          {orders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>과정</th>
                    <th>결제금액</th>
                    <th>상태</th>
                    <th>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id.slice(0, 8).toUpperCase()}</td>
                      <td>{o.title}</td>
                      <td>{o.amount.toLocaleString()}원</td>
                      <td>
                        {
                          {
                            pending: "결제 대기",
                            paid: "결제 완료",
                            failed: "실패",
                            cancelled: "전체취소",
                          }[
                            o.status as
                              "pending" | "paid" | "failed" | "cancelled"
                          ]
                        }
                      </td>
                      <td>
                        {new Date(o.created_at).toLocaleDateString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty">
              결제 내역이 없습니다. 무료 수강신청은 나의 강의실에서 확인할 수
              있습니다.
            </div>
          )}
          <Link href="/contact" className="text-link">
            결제·전체취소 문의 →
          </Link>
        </section>
        <section className="detail-section" id="account-security">
          <div className="split">
            <div>
              <h2>비밀번호 변경</h2>
              <p className="detail-lead">
                변경 후 기존 로그인 세션은 종료됩니다. 새 비밀번호로 다시
                로그인해 주세요.
              </p>
            </div>
            <ActionForm action={changePassword} label="비밀번호 변경">
              <PasswordInput name="currentPassword" label="현재 비밀번호" />
              <PasswordInput newPassword showStrength />
              <PasswordInput
                name="confirmPassword"
                label="새 비밀번호 확인"
                newPassword
              />
            </ActionForm>
          </div>
        </section>
        <section className="detail-section">
          <details className="withdraw-panel">
            <summary>회원탈퇴 안내</summary>
            <p>
              탈퇴하면 로그인과 수강 이용이 중단됩니다. 결제·발급 등 보관이
              필요한 이력의 처리 정책을 확인한 뒤 진행해 주세요.
            </p>
            <ActionForm action={withdraw} label="회원탈퇴">
              <PasswordInput />
              <label className="checkbox">
                <input name="confirm" type="checkbox" required />
                <span>
                  탈퇴 시 서비스 이용 중단과 개인정보 처리 안내를 확인했습니다.
                </span>
              </label>
            </ActionForm>
          </details>
        </section>
      </div>
    </>
  );
}

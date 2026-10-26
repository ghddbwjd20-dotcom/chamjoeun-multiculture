import { query } from "@/lib/db";
import { ActionForm } from "@/components/form";
import { manualComplete } from "../actions";
export default async function Page() {
  const members = await query(
    "SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC LIMIT 100",
  );
  const list = await query(
    "SELECT e.*,u.name,u.email,c.title FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id ORDER BY e.enrolled_at DESC LIMIT 100",
  );
  return (
    <>
      <h2 className="section-title">회원</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>권한</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.role}</td>
                <td>
                  {new Date(m.created_at).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="section-title" style={{ marginTop: 40 }}>
        수강신청 · 수동 수료
      </h2>
      <div className="stack">
        {list.map((e) => (
          <div className="info-card" key={e.id}>
            <span className="badge">{e.status}</span>
            <h3 style={{ marginTop: 12 }}>{e.title}</h3>
            <p>
              {e.name} · {e.email}
            </p>
            {e.status === "active" && (
              <ActionForm action={manualComplete} label="수동 수료 처리">
                <input name="id" type="hidden" value={e.id} />
                <label>
                  처리 사유
                  <input
                    name="reason"
                    required
                    minLength={5}
                    maxLength={1000}
                  />
                </label>
              </ActionForm>
            )}
          </div>
        ))}
        {!list.length && <p className="muted">수강신청 내역이 없습니다.</p>}
      </div>
    </>
  );
}

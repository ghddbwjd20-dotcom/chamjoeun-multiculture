import { query } from "@/lib/db";
export default async function Page() {
  const [s] = await query(
    `SELECT (SELECT count(*) FROM users) members,(SELECT count(*) FROM courses) courses,(SELECT count(*) FROM enrollments WHERE status<>'cancelled') enrollments,(SELECT count(*) FROM inquiries WHERE status='received') inquiries`,
  );
  const logs = await query(
    "SELECT a.action,a.created_at,u.name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 10",
  );
  return (
    <>
      <div className="stat-grid">
        {[
          ["가입 회원", s.members],
          ["교육과정", s.courses],
          ["수강신청", s.enrollments],
          ["미답변 문의", s.inquiries],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <h2 className="section-title">최근 운영 기록</h2>
      {logs.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>작업</th>
                <th>담당자</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i}>
                  <td>{l.action}</td>
                  <td>{l.name ?? "시스템"}</td>
                  <td>
                    {new Date(l.created_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">아직 운영 기록이 없습니다.</p>
      )}
      <div className="not-ready">
        현재 개발된 관리 메뉴입니다. 결제·문서 발급·알림·영상 업로드 관리는 다음
        개발 범위에 포함됩니다.
      </div>
    </>
  );
}

import { query } from "@/lib/db";
import { ActionForm } from "@/components/form";
import { saveTemplate, issueQualification, revokeDocument } from "./actions";
export default async function Page() {
  const templates = await query(
    "SELECT * FROM document_templates ORDER BY kind",
  );
  const documents = await query(
    "SELECT d.*,u.name,c.title FROM issued_documents d JOIN users u ON u.id=d.user_id JOIN courses c ON c.id=d.course_id ORDER BY issued_at DESC LIMIT 100",
  );
  const completed = await query(
    "SELECT e.user_id,e.course_id,u.name,u.email,c.title FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id WHERE e.status='completed' ORDER BY e.completed_at DESC LIMIT 100",
  );
  return (
    <>
      <h2 className="section-title">발급문서·양식 관리</h2>
      <div className="split">
        {templates.map((t) => (
          <section className="info-card" key={t.id}>
            <h3>
              {t.kind === "completion" ? "수료증" : "자격증"} 양식 · v
              {t.version}
            </h3>
            <ActionForm action={saveTemplate} label="양식 저장">
              <input name="id" type="hidden" value={t.id} />
              <label>
                문서 제목
                <input
                  name="title"
                  defaultValue={t.title}
                  maxLength={30}
                  required
                />
              </label>
              <label>
                발급기관
                <input
                  name="issuer"
                  defaultValue={t.issuer}
                  maxLength={60}
                  required
                />
              </label>
              <label>
                발급 문구
                <textarea
                  name="footer"
                  defaultValue={t.footer}
                  maxLength={300}
                  required
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={t.active}
                />
                <span>확정된 양식으로 발급 허용</span>
              </label>
            </ActionForm>
          </section>
        ))}
      </div>
      <h2 className="section-title" style={{ marginTop: 40 }}>
        자격증 발급
      </h2>
      <div className="stack">
        {completed.map((e) => (
          <section className="info-card" key={`${e.user_id}:${e.course_id}`}>
            <h3>
              {e.name} · {e.title}
            </h3>
            <p>{e.email}</p>
            <ActionForm action={issueQualification} label="자격증 발급">
              <input type="hidden" name="userId" value={e.user_id} />
              <input type="hidden" name="courseId" value={e.course_id} />
              <label>
                발급 기준 확인·사유
                <input name="reason" minLength={5} maxLength={1000} required />
              </label>
            </ActionForm>
          </section>
        ))}
      </div>
      <h2 className="section-title" style={{ marginTop: 40 }}>
        발급 이력
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>번호·문서</th>
              <th>수강생·과정</th>
              <th>PDF</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>
                  {d.document_number}
                  <br />
                  {d.kind === "completion" ? "수료증" : "자격증"}
                </td>
                <td>
                  {d.name}
                  <br />
                  {d.title}
                </td>
                <td>
                  {!d.revoked_at && (
                    <a href={`/api/documents/${d.id}/pdf`} target="_blank">
                      PDF 열기 ↗
                    </a>
                  )}
                </td>
                <td>
                  {d.revoked_at ? (
                    "취소됨"
                  ) : (
                    <ActionForm action={revokeDocument} label="발급 취소">
                      <input name="id" type="hidden" value={d.id} />
                      <label>
                        사유
                        <input name="reason" minLength={5} required />
                      </label>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

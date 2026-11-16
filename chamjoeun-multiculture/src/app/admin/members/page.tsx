import { sendMemberPasswordReset } from "@/app/auth-recovery";
import { mailConfigured } from "@/lib/mail";
import { query } from "@/lib/db";
import { ActionForm } from "@/components/form";
import { manualComplete } from "../actions";
import Link from "next/link";
import { z } from "zod";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const course = z.uuid().safeParse(params.course).success
    ? params.course!
    : "";
  const search =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.min(
    10000,
    Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const courses = await query("SELECT id,title FROM courses ORDER BY title,id");
  const members = await query(
    "SELECT id,name,email,role,created_at,email_verified_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100",
  );
  const list = await query(
    `SELECT e.*,u.name,u.email,c.title,stats.watched,stats.total,a.detail AS completion_detail,
      a.created_at AS completion_logged_at,actor.name AS completion_actor
      FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id
      LEFT JOIN LATERAL (
        SELECT COALESCE(sum(p.watched_seconds),0) watched,COALESCE(sum(l.duration_seconds),0) total
        FROM lessons l LEFT JOIN lesson_progress p ON p.lesson_id=l.id AND p.user_id=e.user_id
        WHERE l.course_id=e.course_id
      ) stats ON true
      LEFT JOIN LATERAL (
        SELECT actor_id,detail,created_at FROM audit_logs WHERE entity_id=e.id::text AND action='수동 수료'
        ORDER BY created_at DESC,id DESC LIMIT 1
      ) a ON e.status='completed'
      LEFT JOIN users actor ON actor.id=a.actor_id
      WHERE (NULLIF($1,'')::uuid IS NULL OR e.course_id=NULLIF($1,'')::uuid)
      AND (u.name ILIKE $2 OR u.email ILIKE $2)
      ORDER BY e.enrolled_at DESC,e.id DESC LIMIT 31 OFFSET $3`,
    [course, `%${search}%`, (page - 1) * 30],
  );
  const resetAvailable = mailConfigured() && Boolean(process.env.APP_URL);
  const pageHref = (n: number) =>
    `/admin/members?${new URLSearchParams({ course, q: search, page: String(n) })}`;
  return (
    <>
      <h2 className="section-title">회원</h2>
      {!resetAvailable && (
        <p className="alert">
          재설정 메일을 보내려면 이메일 발송 설정이 필요합니다.{" "}
          <Link href="/admin/integrations">연동 상태 확인 →</Link>
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>권한</th>
              <th>가입일</th>
              <th>계정 관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.role === "admin" ? "관리자" : "일반 회원"}</td>
                <td>
                  {new Date(m.created_at).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </td>
                <td>
                  {m.role === "member" && m.email_verified_at ? (
                    resetAvailable ? (
                      <details>
                        <summary>비밀번호 재설정 메일</summary>
                        <ActionForm
                          action={sendMemberPasswordReset}
                          label="링크 발송"
                        >
                          <input type="hidden" name="id" value={m.id} />
                          <label className="checkbox">
                            <input name="confirm" type="checkbox" required />
                            등록 이메일로 발송합니다.
                          </label>
                        </ActionForm>
                      </details>
                    ) : (
                      <span className="muted">메일 설정 대기</span>
                    )
                  ) : (
                    <span className="muted">
                      {m.role === "admin" ? "—" : "이메일 미인증"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="section-title" style={{ marginTop: 40 }}>
        과정별 수강생 · 학습 현황
      </h2>
      <form className="form member-enrollment-filters" method="get">
        <label>
          교육과정
          <select name="course" defaultValue={course}>
            <option value="">전체 과정</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          회원 이름 또는 이메일
          <input
            name="q"
            defaultValue={search}
            maxLength={100}
            placeholder="이름 또는 이메일 입력"
          />
        </label>
        <button className="button outline">조회</button>
      </form>
      <div className="stack">
        {list.slice(0, 30).map((e) => (
          <div className="info-card" key={e.id}>
            <span className="badge">{e.status}</span>
            <h3 style={{ marginTop: 12 }}>{e.title}</h3>
            <p>
              {e.name} · {e.email}
            </p>
            <p>
              인정 시청시간 {Math.floor(Number(e.watched) / 60)}분{" "}
              {Math.floor(Number(e.watched) % 60)}초 · 진도{" "}
              {Number(e.total) > 0
                ? Math.min(
                    100,
                    Math.floor((Number(e.watched) / Number(e.total)) * 100),
                  )
                : 0}
              %
            </p>
            {e.completion_logged_at && (
              <p>
                수동 수료 · {e.completion_actor ?? "관리자"} ·{" "}
                {new Date(e.completion_logged_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}{" "}
                · {e.completion_detail?.reason}
              </p>
            )}
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
      {(page > 1 || list.length > 30) && (
        <nav className="section-links" aria-label="수강생 목록 페이지">
          {page > 1 && <Link href={pageHref(page - 1)}>이전</Link>}
          <span>{page}페이지</span>
          {list.length > 30 && <Link href={pageHref(page + 1)}>다음</Link>}
        </nav>
      )}
    </>
  );
}

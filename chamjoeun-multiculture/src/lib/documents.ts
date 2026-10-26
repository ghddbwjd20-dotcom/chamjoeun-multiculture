import { randomUUID } from "node:crypto";
import { transaction } from "@/lib/db";
import type { DocumentSnapshot } from "@/lib/pdf";
export async function issueDocument(
  userId: string,
  courseId: string,
  kind: "completion" | "qualification",
  actorId = userId,
  reason = "",
) {
  return transaction(async (c) => {
    const { rows } = await c.query(
      "SELECT e.*,u.name,c.title,c.slug FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 AND e.course_id=$2 AND e.status='completed' FOR UPDATE OF e",
      [userId, courseId],
    );
    const e = rows[0];
    if (!e) return { error: "수료가 확인된 과정에서만 발급할 수 있습니다." };
    const existing = await c.query(
      "SELECT id FROM issued_documents WHERE user_id=$1 AND course_id=$2 AND kind=$3 AND revoked_at IS NULL",
      [userId, courseId, kind],
    );
    if (existing.rows[0]) return { id: existing.rows[0].id as string };
    const t = (
      await c.query("SELECT * FROM document_templates WHERE kind=$1", [kind])
    ).rows[0];
    const preview =
      process.env.NODE_ENV !== "production" && e.slug === "development-sample";
    if (!t?.active && !preview)
      return { error: "관리자가 발급 양식을 확정한 뒤 발급할 수 있습니다." };
    if (kind === "qualification" && actorId === userId)
      return { error: "자격증은 관리자 확인이 필요합니다." };
    const now = new Date(),
      id = randomUUID(),
      number = `CJ-${now.getUTCFullYear()}-${kind === "completion" ? "C" : "Q"}-${id.slice(0, 8).toUpperCase()}`;
    const snapshot: DocumentSnapshot = {
      name: e.name,
      courseTitle: e.title,
      issuer: t.issuer,
      title: t.title,
      footer: t.footer,
      completedAt: (e.completed_at ?? now).toISOString(),
      enrolledAt: e.enrolled_at.toISOString(),
      expiresAt: e.expires_at.toISOString(),
      issuedAt: now.toISOString(),
      number,
      version: t.version,
      preview,
    };
    await c.query(
      "INSERT INTO issued_documents(id,user_id,course_id,document_number,kind,template_id,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [id, userId, courseId, number, kind, t.id, JSON.stringify(snapshot)],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,$2,$3,$4)",
      [
        actorId,
        kind === "completion" ? "수료증 발급" : "자격증 발급",
        id,
        JSON.stringify({ reason, number }),
      ],
    );
    return { id };
  });
}

"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { transaction, query } from "@/lib/db";
import { issueDocument } from "@/lib/documents";
import type { FormState } from "@/components/form";
export async function saveTemplate(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({
      id: z.uuid(),
      title: z.string().min(2).max(30),
      issuer: z.string().min(2).max(60),
      footer: z.string().min(5).max(300),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "양식 정보를 확인해 주세요." };
  const d = p.data;
  await transaction(async (c) => {
    await c.query(
      "UPDATE document_templates SET title=$1,issuer=$2,footer=$3,active=$4,version=version+1,updated_at=now() WHERE id=$5",
      [d.title, d.issuer, d.footer, form.get("active") === "on", d.id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'문서 양식 변경',$2)",
      [user.id, d.id],
    );
  });
  revalidatePath("/admin/documents");
  return {
    success:
      "양식을 저장했습니다. 기존 발급 문서는 발급 당시 정보와 양식을 유지합니다.",
  };
}
export async function issueQualification(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({
      userId: z.uuid(),
      courseId: z.uuid(),
      reason: z.string().trim().min(5).max(1000),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "대상과 발급 사유를 확인해 주세요." };
  const r = await issueDocument(
    p.data.userId,
    p.data.courseId,
    "qualification",
    user.id,
    p.data.reason,
  );
  revalidatePath("/admin/documents");
  return r.id
    ? { success: "자격증을 발급하고 이력을 기록했습니다." }
    : { error: r.error };
}
export async function revokeDocument(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const p = z
    .object({ id: z.uuid(), reason: z.string().trim().min(5).max(1000) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "발급번호와 취소 사유를 확인해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "UPDATE issued_documents SET revoked_at=now(),revoke_reason=$1 WHERE id=$2",
      [p.data.reason, p.data.id],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id,detail) VALUES($1,'문서 발급 취소',$2,$3)",
      [user.id, p.data.id, JSON.stringify({ reason: p.data.reason })],
    );
  });
  revalidatePath("/admin/documents");
  return { success: "문서 발급을 취소했습니다. 이력은 보존됩니다." };
}

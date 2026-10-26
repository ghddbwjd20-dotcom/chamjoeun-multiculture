"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import type { FormState } from "@/components/form";
export async function saveContact(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const u = await requireAdmin();
  const p = z
    .object({
      name: z.string().min(2).max(60),
      phone: z.string().min(8).max(24),
      email: z.email(),
      address: z.string().min(5).max(200),
      privacyOfficer: z.string().min(2).max(30),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "기관 기본정보를 확인해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO site_settings(key,value) VALUES('contact',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()",
      [JSON.stringify(p.data)],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action) VALUES($1,'기관 기본정보 변경')",
      [u.id],
    );
  });
  revalidatePath("/", "layout");
  return { success: "기관 기본정보를 저장했습니다." };
}
export async function savePromotion(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const u = await requireAdmin();
  const p = z
    .object({
      kind: z.enum(["banner", "popup"]),
      title: z.string().trim().min(2).max(100),
      body: z.string().max(1000),
      href: z.string().regex(/^\/(?!\/)[a-zA-Z0-9/?=&%#_.-]*$/),
      starts_at: z.string().min(10),
      ends_at: z.string().min(10),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    return { error: "노출 내용과 내부 연결 주소를 확인해 주세요." };
  const d = p.data;
  const start = new Date(`${d.starts_at}+09:00`),
    end = new Date(`${d.ends_at}+09:00`);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start)
    return { error: "한국시간 기준 시작·종료 일시를 확인해 주세요." };
  await transaction(async (c) => {
    const r = await c.query(
      "INSERT INTO site_promotions(kind,title,body,href,starts_at,ends_at,active) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [
        d.kind,
        d.title,
        d.body,
        d.href,
        start,
        end,
        form.get("active") === "on",
      ],
    );
    await c.query(
      "INSERT INTO audit_logs(actor_id,action,entity_id) VALUES($1,'배너·팝업 등록',$2)",
      [u.id, r.rows[0].id],
    );
  });
  revalidatePath("/", "layout");
  return { success: "배너·팝업을 등록했습니다." };
}
export async function hidePromotion(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const u = await requireAdmin();
  const id = form.get("id");
  if (!z.uuid().safeParse(id).success)
    return { error: "항목을 확인해 주세요." };
  await query("UPDATE site_promotions SET active=false WHERE id=$1", [id]);
  revalidatePath("/", "layout");
  return { success: "노출을 중지했습니다." };
}

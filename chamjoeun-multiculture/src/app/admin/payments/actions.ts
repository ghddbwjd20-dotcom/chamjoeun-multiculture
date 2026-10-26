"use server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cancelPayment, reconcilePayment } from "@/lib/payments";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form";
export async function refundOrder(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const u = await requireAdmin();
  const p = z
    .object({ id: z.uuid(), reason: z.string().trim().min(5).max(200) })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "주문과 취소 사유를 확인해 주세요." };
  try {
    await cancelPayment(p.data.id, u.id, p.data.reason);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "결제 결과 확인이 필요합니다.",
    };
  }
  revalidatePath("/admin/payments");
  return { success: "전체취소와 수강권한 종료를 반영했습니다." };
}
export async function reconcileOrder(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = form.get("id");
  if (!z.uuid().safeParse(id).success)
    return { error: "주문을 확인해 주세요." };
  try {
    const status = await reconcilePayment(String(id));
    revalidatePath("/admin/payments");
    return { success: `PG 조회 결과: ${status}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "조회하지 못했습니다." };
  }
}

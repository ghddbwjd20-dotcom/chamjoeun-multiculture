"use server";
import { z } from "zod";
import { query } from "@/lib/db";
import { currentUser, rateLimit } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/form";
const schema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().max(254),
  kind: z.enum(["education", "partnership", "books", "settlement", "other"]),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal("on"),
});
export async function submitInquiry(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  if (form.get("website")) return { success: "문의가 접수되었습니다." };
  const p = schema.safeParse(Object.fromEntries(form));
  if (!p.success)
    return {
      error:
        "입력 내용과 개인정보 동의를 확인해 주세요. 문의 내용은 10자 이상 입력해 주세요.",
    };
  if (!(await rateLimit(`inquiry:${p.data.email.toLowerCase()}`, 5)))
    return { error: "접수가 많습니다. 잠시 후 다시 시도해 주세요." };
  const d = p.data;
  const user = await currentUser();
  await query(
    "INSERT INTO inquiries(name,email,kind,subject,message,user_id) VALUES($1,$2,$3,$4,$5,$6)",
    [
      d.name,
      d.email.toLowerCase(),
      d.kind,
      d.subject,
      d.message,
      user?.id ?? null,
    ],
  );
  revalidatePath("/mypage/inquiries");
  revalidatePath("/admin/inquiries");
  return {
    success: user
      ? "문의가 접수되었습니다. 마이페이지의 내 문의에서 답변을 확인할 수 있습니다."
      : "문의가 접수되었습니다. 남겨주신 이메일로 안내드리겠습니다.",
  };
}

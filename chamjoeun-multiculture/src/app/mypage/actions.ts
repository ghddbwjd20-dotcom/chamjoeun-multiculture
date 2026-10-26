"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import type { FormState } from "@/components/form";
export async function saveProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const p = z
    .object({
      name: z.string().trim().min(2).max(60),
      phone: z.string().max(24),
      organization: z.string().max(100),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "입력값을 확인해 주세요." };
  await query(
    "UPDATE users SET name=$1,phone=$2,organization=$3,marketing_consent=$4 WHERE id=$5",
    [
      p.data.name,
      p.data.phone,
      p.data.organization,
      form.get("marketing") === "on",
      user.id,
    ],
  );
  revalidatePath("/mypage");
  revalidatePath("/");
  return { success: "회원정보와 수신 동의를 저장했습니다." };
}
export async function changePassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const p = z
    .object({
      currentPassword: z.string().max(128),
      password: z.string().min(12).max(128),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword)
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    return {
      error: "현재 비밀번호와 12자 이상의 새 비밀번호 확인을 입력해 주세요.",
    };
  const [account] = await query("SELECT password_hash FROM users WHERE id=$1", [
    user.id,
  ]);
  if (!verifyPassword(p.data.currentPassword, account.password_hash))
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  await transaction(async (c) => {
    await c.query("UPDATE users SET password_hash=$1 WHERE id=$2", [
      hashPassword(p.data.password),
      user.id,
    ]);
    await c.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
  });
  (await cookies()).delete("cj_session");
  redirect("/login");
}
export async function withdraw(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.role === "admin")
    return { error: "관리자 계정은 운영 권한을 정리한 뒤 별도 처리해 주세요." };
  if (form.get("confirm") !== "on")
    return { error: "탈퇴 안내를 확인해 주세요." };
  const password = String(form.get("password") ?? "");
  if (password.length > 128) return { error: "비밀번호를 확인해 주세요." };
  const [account] = await query("SELECT password_hash FROM users WHERE id=$1", [
    user.id,
  ]);
  if (!verifyPassword(password, account.password_hash))
    return { error: "비밀번호를 확인해 주세요." };
  await transaction(async (c) => {
    await c.query(
      "UPDATE users SET name='탈퇴회원',email=$1,password_hash=$2,phone='',organization='',interests='[]',marketing_consent=false,deleted_at=now() WHERE id=$3",
      [
        `withdrawn-${user.id}@invalid.local`,
        hashPassword(randomBytes(32).toString("hex")),
        user.id,
      ],
    );
    await c.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
    await c.query("DELETE FROM social_accounts WHERE user_id=$1", [user.id]);
    await c.query("DELETE FROM auth_tokens WHERE user_id=$1", [user.id]);
    await c.query("DELETE FROM push_subscriptions WHERE user_id=$1", [user.id]);
  });
  (await cookies()).delete("cj_session");
  redirect("/");
}

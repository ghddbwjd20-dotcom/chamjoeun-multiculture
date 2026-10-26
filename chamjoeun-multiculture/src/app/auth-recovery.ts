"use server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { query, transaction } from "@/lib/db";
import { digest, rateLimit } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { mailPreview, mailConfigured, sendEmail } from "@/lib/mail";
import type { FormState } from "@/components/form";
async function requestToken(
  form: FormData,
  purpose: "reset" | "verify",
): Promise<FormState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!z.email().safeParse(email).success)
    return { error: "이메일을 확인해 주세요." };
  if (!(await rateLimit(`recovery:${email}`, 4)))
    return { error: "요청이 많습니다. 15분 후 다시 시도해 주세요." };
  if (!mailPreview() && !mailConfigured())
    return { error: "이메일 발송을 준비 중입니다. 기관에 문의해 주세요." };
  const [user] = await query(
    "SELECT id,email_verified_at FROM users WHERE email=$1 AND deleted_at IS NULL",
    [email],
  );
  const response: FormState = {
    success:
      "가입된 정보가 있으면 안내메일을 발송합니다. 이메일을 확인해 주세요.",
  };
  if (!user || (purpose === "verify" && user.email_verified_at))
    return response;
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')",
    [digest(token), user.id, purpose],
  );
  const path = purpose === "reset" ? "reset-password" : "verify";
  const url = `${process.env.APP_URL}/${path}?token=${token}`;
  if (mailPreview()) return { ...response, preview: url };
  try {
    await sendEmail(
      email,
      purpose === "reset"
        ? "참조은다문화 비밀번호 재설정"
        : "참조은다문화 이메일 인증",
      `30분 이내에 다음 주소에서 진행해 주세요.\n${url}`,
    );
  } catch {
    return { error: "메일을 발송하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  return response;
}
export async function requestReset(_: FormState, form: FormData) {
  return requestToken(form, "reset");
}
export async function resendVerification(_: FormState, form: FormData) {
  return requestToken(form, "verify");
}
export async function resetPassword(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const p = z
    .object({
      token: z.string().regex(/^[a-f0-9]{64}$/),
      password: z.string().min(12).max(128),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword)
    .safeParse(Object.fromEntries(form));
  if (!p.success)
    return {
      error: "12자 이상 비밀번호와 비밀번호 확인을 맞춰 입력해 주세요.",
    };
  const ok = await transaction(async (c) => {
    const r = await c.query(
      "DELETE FROM auth_tokens WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING user_id",
      [digest(p.data.token)],
    );
    if (!r.rows[0]) return false;
    await c.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2 AND deleted_at IS NULL",
      [hashPassword(p.data.password), r.rows[0].user_id],
    );
    await c.query("DELETE FROM sessions WHERE user_id=$1", [r.rows[0].user_id]);
    await c.query(
      "DELETE FROM auth_tokens WHERE user_id=$1 AND purpose='reset'",
      [r.rows[0].user_id],
    );
    return true;
  });
  return ok
    ? { success: "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요." }
    : { error: "링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요." };
}

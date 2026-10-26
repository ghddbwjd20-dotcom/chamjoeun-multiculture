"use server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, transaction } from "@/lib/db";
import { createSession, digest, rateLimit } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { FormState } from "@/components/form";
const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
  terms: z.literal("on"),
  privacy: z.literal("on"),
  confirmPassword: z.string().min(12),
  phone: z.string().max(24).optional(),
  organization: z.string().max(100).optional(),
});
export async function register(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "이름, 이메일, 12자 이상 비밀번호와 필수 동의를 확인해 주세요.",
    };
  const { name, email, password } = parsed.data;
  if (password !== parsed.data.confirmPassword)
    return { error: "비밀번호와 비밀번호 확인이 일치하지 않습니다." };
  if (!(await rateLimit(`register:${email}`, 3)))
    return { error: "잠시 후 다시 시도해 주세요." };
  const preview =
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_EMAIL_PREVIEW === "true";
  if (!preview && (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM))
    return { error: "현재 회원가입 준비 중입니다. 기관에 문의해 주세요." };
  const token = randomBytes(32).toString("hex");
  try {
    const userId = await transaction(async (client) => {
      const result = await client.query(
        "INSERT INTO users(name,email,password_hash,marketing_consent,phone,organization,interests,terms_accepted_at,privacy_accepted_at) VALUES($1,$2,$3,$4,$5,$6,$7,now(),now()) RETURNING id",
        [
          name,
          email,
          hashPassword(password),
          form.get("marketing") === "on",
          parsed.data.phone ?? "",
          parsed.data.organization ?? "",
          JSON.stringify(
            form
              .getAll("interests")
              .map(String)
              .filter((v) =>
                [
                  "평생교육",
                  "민간자격과정",
                  "한국어교육",
                  "지역사회서비스",
                ].includes(v),
              ),
          ),
        ],
      );
      const id = result.rows[0].id;
      await client.query(
        "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'verify',now()+interval '1 day')",
        [digest(token), id],
      );
      return id;
    });
    const url = `${process.env.APP_URL ?? "http://localhost:3000"}/verify?token=${token}`;
    if (!preview) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM,
          to: email,
          subject: "참조은다문화 이메일 인증",
          text: `아래 주소에서 이메일 인증을 완료해 주세요. 24시간 동안 유효합니다.\n${url}`,
        }),
      });
      if (!response.ok) {
        await query(
          "DELETE FROM users WHERE id=$1 AND email_verified_at IS NULL",
          [userId],
        );
        return {
          error: "인증메일을 발송하지 못했습니다. 잠시 후 다시 가입해 주세요.",
        };
      }
    }
    return {
      success: "이메일 인증 후 로그인할 수 있습니다.",
      ...(preview ? { preview: url } : {}),
    };
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return {
        error: "가입 정보를 확인해 주세요. 이미 가입했다면 로그인해 주세요.",
      };
    throw e;
  }
}
export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password = String(form.get("password") ?? "");
  if (!z.email().safeParse(email).success || password.length > 128)
    return { error: "이메일과 비밀번호를 확인해 주세요." };
  if (!(await rateLimit(`login:${email}`, 10)))
    return { error: "로그인 시도가 많습니다. 15분 후 다시 시도해 주세요." };
  const [user] = await query(
    "SELECT id,password_hash,email_verified_at FROM users WHERE email=$1 AND deleted_at IS NULL",
    [email],
  );
  if (
    !verifyPassword(
      password,
      user?.password_hash ?? hashPassword("dummy-verification-password"),
    ) ||
    !user
  )
    return { error: "이메일 또는 비밀번호가 맞지 않습니다." };
  if (!user.email_verified_at)
    return { error: "이메일 인증을 먼저 완료해 주세요." };
  await createSession(user.id, form.get("remember") === "on");
  redirect("/classroom");
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("cj_session")?.value;
  if (token)
    await query("DELETE FROM sessions WHERE token_hash=$1", [digest(token)]);
  jar.delete("cj_session");
  redirect("/");
}

"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { digest, createSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { mailPreview, mailConfigured, sendEmail } from "@/lib/mail";
import type { FormState } from "@/components/form";
export async function finishSocialSignup(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const p = z
    .object({
      name: z.string().trim().min(2).max(60),
      email: z
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      terms: z.literal("on"),
      privacy: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "이름, 이메일과 필수 동의를 확인해 주세요." };
  const jar = await cookies(),
    token = jar.get("cj_social_pending")?.value;
  if (!token)
    return {
      error: "인증 시간이 만료되었습니다. 소셜 로그인을 다시 시도해 주세요.",
    };
  const [pending] = await query(
    "SELECT * FROM social_pending WHERE token_hash=$1 AND expires_at>now()",
    [digest(token)],
  );
  if (!pending) return { error: "인증 시간이 만료되었습니다." };
  const verified = pending.email_verified && pending.email === p.data.email;
  if (!verified && !mailPreview() && !mailConfigured())
    return {
      error: "이메일 인증 발송 설정이 필요합니다. 기관에 문의해 주세요.",
    };
  const verifyToken = randomBytes(32).toString("hex");
  let id: string;
  try {
    id = await transaction(async (c) => {
      const row = await c.query(
        "INSERT INTO users(name,email,password_hash,email_verified_at,terms_accepted_at,privacy_accepted_at) VALUES($1,$2,$3,$4,now(),now()) RETURNING id",
        [
          p.data.name,
          p.data.email,
          hashPassword(randomBytes(32).toString("hex")),
          verified ? new Date() : null,
        ],
      );
      await c.query(
        "INSERT INTO social_accounts(provider,provider_user_id,user_id) VALUES($1,$2,$3)",
        [pending.provider, pending.provider_user_id, row.rows[0].id],
      );
      if (!verified)
        await c.query(
          "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'verify',now()+interval '1 day')",
          [digest(verifyToken), row.rows[0].id],
        );
      await c.query("DELETE FROM social_pending WHERE token_hash=$1", [
        digest(token),
      ]);
      return row.rows[0].id;
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      return {
        error:
          "이미 가입된 이메일 또는 계정입니다. 기존 계정에 로그인한 뒤 소셜 계정을 연결해 주세요.",
      };
    throw e;
  }
  jar.delete("cj_social_pending");
  if (verified) {
    await createSession(id);
    redirect("/classroom");
  }
  const url = `${process.env.APP_URL}/verify?token=${verifyToken}`;
  if (mailPreview())
    return {
      success: "이메일 인증 후 소셜 로그인으로 이용할 수 있습니다.",
      preview: url,
    };
  try {
    await sendEmail(
      p.data.email,
      "참조은다문화 이메일 인증",
      `인증 링크: ${url}`,
    );
  } catch {
    return {
      error:
        "가입 정보는 저장되었습니다. 로그인 화면에서 인증메일을 다시 요청해 주세요.",
    };
  }
  return { success: "이메일 인증 후 소셜 로그인으로 이용할 수 있습니다." };
}

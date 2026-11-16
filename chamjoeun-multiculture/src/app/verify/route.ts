import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/db";
import { notifyMember } from "@/lib/delivery";
import { digest } from "@/lib/auth";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return NextResponse.redirect(
      new URL("/login?verified=invalid", process.env.APP_URL ?? request.url),
    );
  const ok = await transaction(async (client) => {
    const { rows } = await client.query(
      "DELETE FROM auth_tokens WHERE token_hash=$1 AND purpose='verify' AND expires_at>now() RETURNING user_id",
      [digest(token)],
    );
    if (!rows[0]) return false;
    await client.query("UPDATE users SET email_verified_at=now() WHERE id=$1", [
      rows[0].user_id,
    ]);
    const id = rows[0].user_id;
    await notifyMember(
      client,
      id,
      "가입 완료",
      "참조은다문화 회원가입이 완료되었습니다.",
      "/mypage",
      `signup:${id}`,
      "signup",
    );
    return true;
  });
  return NextResponse.redirect(
    new URL(
      `/login?verified=${ok ? "yes" : "invalid"}`,
      process.env.APP_URL ?? request.url,
    ),
  );
}

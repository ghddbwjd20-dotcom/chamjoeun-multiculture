import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
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
    return true;
  });
  return NextResponse.redirect(
    new URL(
      `/login?verified=${ok ? "yes" : "invalid"}`,
      process.env.APP_URL ?? request.url,
    ),
  );
}

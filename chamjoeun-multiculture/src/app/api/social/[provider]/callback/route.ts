import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { currentUser, createSession, digest } from "@/lib/auth";
import { query } from "@/lib/db";
import { socialProvider, socialIdentity } from "@/lib/social";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const base = process.env.APP_URL ?? request.url;
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/login?social=${reason}`, base));
  const { provider } = await params;
  if (!socialProvider(provider)) return back("invalid");
  const jar = await cookies();
  const cookie = jar.get("cj_oauth_state")?.value ?? "",
    state = request.nextUrl.searchParams.get("state") ?? "",
    code = request.nextUrl.searchParams.get("code");
  jar.delete("cj_oauth_state");
  if (
    !code ||
    !state ||
    Buffer.byteLength(state) !== Buffer.byteLength(cookie) ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(cookie))
  )
    return back("invalid");
  const [session] = await query(
    "DELETE FROM oauth_sessions WHERE state_hash=$1 AND provider=$2 AND expires_at>now() RETURNING *",
    [digest(state), provider],
  );
  if (!session) return back("expired");
  try {
    const identity = await socialIdentity(
      provider,
      code,
      state,
      session.code_verifier,
    );
    if (!identity.subject) return back("invalid");
    if (session.link_user_id) {
      const current = await currentUser();
      if (!current || current.id !== session.link_user_id)
        return back("invalid");
      await query(
        "INSERT INTO social_accounts(provider,provider_user_id,user_id) VALUES($1,$2,$3)",
        [provider, identity.subject, current.id],
      );
      return NextResponse.redirect(new URL("/mypage", base));
    }
    const [account] = await query(
      "SELECT u.* FROM social_accounts a JOIN users u ON u.id=a.user_id WHERE a.provider=$1 AND a.provider_user_id=$2 AND u.deleted_at IS NULL",
      [provider, identity.subject],
    );
    if (account) {
      if (!account.email_verified_at)
        return NextResponse.redirect(
          new URL("/forgot-password?mode=verify", base),
        );
      await createSession(account.id);
      return NextResponse.redirect(new URL("/classroom", base));
    }
    if (identity.email) {
      const [existing] = await query(
        "SELECT id FROM users WHERE email=$1 AND deleted_at IS NULL",
        [identity.email.toLowerCase()],
      );
      if (existing) return back("link_required");
    }
    const token = randomBytes(32).toString("hex");
    await query(
      "INSERT INTO social_pending(token_hash,provider,provider_user_id,email,name,email_verified,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '10 minutes')",
      [
        digest(token),
        provider,
        identity.subject,
        identity.email.toLowerCase(),
        identity.name.slice(0, 60),
        identity.verified,
      ],
    );
    jar.set("cj_social_pending", token, {
      httpOnly: true,
      secure: base.startsWith("https://"),
      sameSite: "lax",
      path: "/social-onboarding",
      maxAge: 600,
    });
    return NextResponse.redirect(new URL("/social-onboarding", base));
  } catch {
    return back("failed");
  }
}

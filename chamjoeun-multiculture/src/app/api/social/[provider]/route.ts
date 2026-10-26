import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { currentUser, digest } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  socialProvider,
  socialConfig,
  socialAuthorization,
} from "@/lib/social";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const base = process.env.APP_URL ?? request.url;
  const { provider } = await params;
  if (!socialProvider(provider) || !socialConfig(provider))
    return NextResponse.redirect(new URL("/login?social=not_configured", base));
  const user = await currentUser();
  const linking = request.nextUrl.searchParams.get("link") === "1";
  if (linking && !user) return NextResponse.redirect(new URL("/login", base));
  const state = randomBytes(32).toString("hex"),
    verifier = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO oauth_sessions(state_hash,provider,code_verifier,link_user_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
    [digest(state), provider, verifier, linking ? user!.id : null],
  );
  (await cookies()).set("cj_oauth_state", state, {
    httpOnly: true,
    secure: base.startsWith("https://"),
    sameSite: "lax",
    path: "/api/social",
    maxAge: 600,
  });
  return NextResponse.redirect(socialAuthorization(provider, state, verifier));
}

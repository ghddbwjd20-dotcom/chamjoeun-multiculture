import { createHash } from "node:crypto";
export type SocialProvider = "google" | "naver" | "kakao";
export function socialProvider(value: string): value is SocialProvider {
  return ["google", "naver", "kakao"].includes(value);
}
export function socialConfig(provider: SocialProvider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`],
    clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${process.env.APP_URL}/api/social/${provider}/callback`,
  };
}
export function socialAuthorization(
  provider: SocialProvider,
  state: string,
  verifier: string,
) {
  const config = socialConfig(provider);
  if (!config) throw new Error("Social authentication is not configured");
  const url = new URL(
    provider === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : provider === "naver"
        ? "https://nid.naver.com/oauth2.0/authorize"
        : "https://kauth.kakao.com/oauth/authorize",
  );
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  }).toString();
  if (provider === "google") {
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set(
      "code_challenge",
      createHash("sha256").update(verifier).digest("base64url"),
    );
    url.searchParams.set("code_challenge_method", "S256");
  }
  if (provider === "kakao")
    url.searchParams.set("scope", "profile_nickname,account_email");
  return url;
}
export async function socialIdentity(
  provider: SocialProvider,
  code: string,
  state: string,
  verifier: string,
) {
  const config = socialConfig(provider);
  if (!config) throw new Error("Social authentication is not configured");
  const endpoint =
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : provider === "naver"
        ? "https://nid.naver.com/oauth2.0/token"
        : "https://kauth.kakao.com/oauth/token";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });
  if (provider === "google") body.set("code_verifier", verifier);
  if (provider === "naver") body.set("state", state);
  const tokenResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenResponse.ok) throw new Error("OAuth token exchange failed");
  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== "string")
    throw new Error("Missing access token");
  const profileResponse = await fetch(
    provider === "google"
      ? "https://openidconnect.googleapis.com/v1/userinfo"
      : provider === "naver"
        ? "https://openapi.naver.com/v1/nid/me"
        : "https://kapi.kakao.com/v2/user/me",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!profileResponse.ok) throw new Error("OAuth profile lookup failed");
  const p = await profileResponse.json();
  if (provider === "google")
    return {
      subject: String(p.sub ?? ""),
      email: String(p.email ?? ""),
      name: String(p.name ?? ""),
      verified: p.email_verified === true,
    };
  if (provider === "naver")
    return {
      subject: String(p.response?.id ?? ""),
      email: String(p.response?.email ?? ""),
      name: String(p.response?.name ?? p.response?.nickname ?? ""),
      verified: false,
    };
  return {
    subject: String(p.id ?? ""),
    email: String(p.kakao_account?.email ?? ""),
    name: String(p.kakao_account?.profile?.nickname ?? ""),
    verified:
      p.kakao_account?.is_email_verified === true &&
      p.kakao_account?.is_email_valid === true,
  };
}

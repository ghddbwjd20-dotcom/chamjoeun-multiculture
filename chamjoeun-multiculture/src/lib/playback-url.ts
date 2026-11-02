/** Client-side expiry is only a refresh hint; the gateway verifies signatures. */
export function videoTokenExpiry(source: string): number | null {
  try {
    const token = new URL(source).searchParams.get("token")?.split(".")[0];
    if (!token) return null;
    const payload = JSON.parse(
      atob(token.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

/** Apply the latest token to nested HLS requests, confined to this lesson. */
export function refreshedVideoRequest(request: string, source: string): string {
  try {
    const current = new URL(source);
    const target = new URL(request);
    const token = current.searchParams.get("token");
    const prefix = current.pathname.slice(
      0,
      current.pathname.lastIndexOf("/") + 1,
    );
    if (
      token &&
      target.origin === current.origin &&
      target.pathname.startsWith(prefix)
    ) {
      target.searchParams.set("token", token);
      return target.href;
    }
  } catch {}
  return request;
}

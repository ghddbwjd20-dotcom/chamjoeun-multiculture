// Cloudflare Worker module. Bind a PRIVATE R2 bucket as VIDEOS. Never enable r2.dev/public access.
const encoder = new TextEncoder();
async function verify(token, secret) {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !/^[a-f0-9]{64}$/.test(sig)) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const bytes = Uint8Array.from(sig.match(/../g), (x) => parseInt(x, 16));
    if (
      !(await crypto.subtle.verify("HMAC", key, bytes, encoder.encode(payload)))
    )
      return null;
    const raw = payload.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(raw));
    if (
      !Number.isFinite(data.exp) ||
      data.exp <= Date.now() / 1000 ||
      typeof data.prefix !== "string"
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = new Headers({
      "Access-Control-Allow-Origin": env.APP_ORIGIN,
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers":
        "Content-Range,Accept-Ranges,Content-Length",
      Vary: "Origin",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (origin && origin !== env.APP_ORIGIN)
      return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405, headers });
    const token = url.searchParams.get("token") ?? "";
    const data = await verify(token, env.VIDEO_SIGNING_SECRET);
    let path;
    try {
      path = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return new Response("Bad request", { status: 400, headers });
    }
    if (
      !data ||
      !path.startsWith(data.prefix) ||
      path.includes("..") ||
      path.includes("\\") ||
      !/^[a-zA-Z0-9_.\/-]+$/.test(path)
    )
      return new Response("Forbidden", { status: 403, headers });
    const object = await env.VIDEOS.get(path, { range: request.headers });
    if (!object) return new Response("Not found", { status: 404, headers });
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, no-store");
    if (path.endsWith(".m3u8")) {
      const source = await object.text();
      const make = (uri) => {
        const child = new URL(uri, url);
        if (
          child.origin !== url.origin ||
          !decodeURIComponent(child.pathname.slice(1)).startsWith(data.prefix)
        )
          throw new Error("Invalid manifest path");
        child.searchParams.set("token", token);
        return child.toString();
      };
      try {
        const output = source
          .split("\n")
          .map((line) =>
            line.startsWith("#")
              ? line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${make(uri)}"`)
              : line.trim()
                ? make(line.trim())
                : line,
          )
          .join("\n");
        headers.set("Content-Type", "application/vnd.apple.mpegurl");
        headers.delete("Content-Length");
        return new Response(request.method === "HEAD" ? null : output, {
          headers,
        });
      } catch {
        return new Response("Invalid manifest", { status: 500, headers });
      }
    }
    headers.set("Accept-Ranges", "bytes");
    let status = 200;
    if (object.range && "offset" in object.range) {
      const start = object.range.offset ?? 0;
      const length = object.range.length ?? object.size;
      headers.set(
        "Content-Range",
        `bytes ${start}-${start + length - 1}/${object.size}`,
      );
      headers.set("Content-Length", String(length));
      status = 206;
    }
    return new Response(request.method === "HEAD" ? null : object.body, {
      status,
      headers,
    });
  },
};

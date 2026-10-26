import { createHmac } from "node:crypto";
export function videoUrl(key: string, userId: string, expiresAt: Date) {
  if (!process.env.VIDEO_GATEWAY_URL || !process.env.VIDEO_SIGNING_SECRET)
    return null;
  if (
    !/^lessons\/[a-f0-9-]+\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.m3u8$/.test(
      key,
    )
  )
    return null;
  const prefix = key.slice(0, key.lastIndexOf("/") + 1);
  const exp = Math.min(
    Math.floor(Date.now() / 1000) + 900,
    Math.floor(expiresAt.getTime() / 1000),
  );
  const payload = Buffer.from(
    JSON.stringify({ prefix, exp, sub: userId }),
  ).toString("base64url");
  const sig = createHmac("sha256", process.env.VIDEO_SIGNING_SECRET)
    .update(payload)
    .digest("hex");
  return `${process.env.VIDEO_GATEWAY_URL.replace(/\/$/, "")}/${key}?token=${payload}.${sig}`;
}

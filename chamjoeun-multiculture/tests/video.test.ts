import { test } from "node:test";
import assert from "node:assert/strict";
import gateway from "../workers/video-gateway.mjs";
import { videoUrl } from "../src/lib/video.ts";
process.env.VIDEO_GATEWAY_URL = "https://video.example.test";
process.env.VIDEO_SIGNING_SECRET =
  "test-only-signing-key-at-least-32-characters";
const id = "01234567-89ab-4def-8123-456789abcdef";
const key = `lessons/${id}/master.m3u8`;
function env(text = "#EXTM3U\n720p/index.m3u8\n") {
  return {
    APP_ORIGIN: "https://app.example.test",
    VIDEO_SIGNING_SECRET: process.env.VIDEO_SIGNING_SECRET,
    VIDEOS: {
      get: async () => ({
        text: async () => text,
        writeHttpMetadata: () => {},
        body: text,
        size: text.length,
      }),
    },
  };
}
test("unsigned video requests are denied", async () => {
  const response = await gateway.fetch(
    new Request(`https://video.example.test/${key}`),
    env(),
  );
  assert.equal(response.status, 403);
});
test("signed HLS manifests keep authorization on nested playlists", async () => {
  const url = videoUrl(key, "test-user", new Date(Date.now() + 60000));
  assert.ok(url);
  const response = await gateway.fetch(new Request(url), env());
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /720p\/index.m3u8\?token=/);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});
test("valid tokens cannot read sibling lessons", async () => {
  const url = new URL(
    videoUrl(key, "test-user", new Date(Date.now() + 60000))!,
  );
  url.pathname = "/lessons/another-lesson/master.m3u8";
  const response = await gateway.fetch(new Request(url), env());
  assert.equal(response.status, 403);
});
test("expired tokens are denied", async () => {
  const url = videoUrl(key, "test-user", new Date(Date.now() - 1000))!;
  const response = await gateway.fetch(new Request(url), env());
  assert.equal(response.status, 403);
});

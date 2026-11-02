import { test } from "node:test";
import assert from "node:assert/strict";
import {
  refreshedVideoRequest,
  videoTokenExpiry,
} from "../src/lib/playback-url.ts";

const token = `${Buffer.from(JSON.stringify({ exp: 2000000000 })).toString("base64url")}.signature`;
const source = `https://video.example/lessons/a/master.m3u8?token=${token}`;
test("refresh tokens propagate to segments and preserve other request parameters", () => {
  const result = new URL(
    refreshedVideoRequest(
      "https://video.example/lessons/a/720/segment.ts?token=expired&part=2",
      source,
    ),
  );
  assert.equal(result.searchParams.get("token"), token);
  assert.equal(result.searchParams.get("part"), "2");
});
test("refresh never leaks tokens to another host or lesson", () => {
  for (const target of [
    "https://other.example/lessons/a/segment.ts",
    "https://video.example/lessons/another/segment.ts",
    "https://video.example/lessons/a/../b/segment.ts",
  ]) {
    assert.equal(refreshedVideoRequest(target, source), target);
  }
});
test("expiry hints handle signed sources and reject malformed tokens", () => {
  assert.equal(videoTokenExpiry(source), 2000000000000);
  for (const value of [
    "/api/demo-video/a",
    "https://video.example/test?token=invalid",
    "https://video.example/test",
  ])
    assert.equal(videoTokenExpiry(value), null);
});

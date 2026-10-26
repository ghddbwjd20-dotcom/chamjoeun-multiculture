import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeRanges,
  watchedSeconds,
  acceptInterval,
} from "../src/lib/progress.ts";
test("overlapping and repeated playback counts once", () => {
  const ranges = mergeRanges(
    [
      [0, 20],
      [10, 30],
      [0, 20],
    ],
    100,
  );
  assert.deepEqual(ranges, [[0, 30]]);
  assert.equal(watchedSeconds(ranges), 30);
});
test("seek jumps and pauses do not grant credit", () => {
  assert.equal(acceptInterval(30, 540, 10, true, 600), null);
  assert.equal(acceptInterval(20, 30, 10, false, 600), null);
  assert.equal(acceptInterval(30, 20, 10, true, 600), null);
});
test("normal and 2x playback accepted within wall time", () => {
  assert.deepEqual(acceptInterval(0, 10, 10, true, 100), [0, 10]);
  assert.deepEqual(acceptInterval(0, 20, 10, true, 100), [0, 20]);
  assert.equal(acceptInterval(0, 30, 10, true, 100), null);
});
test("clamp intervals and reject nonfinite data", () => {
  assert.deepEqual(
    mergeRanges(
      [
        [-5, 20],
        [80, 120],
        [NaN, 20],
        [30, 20],
      ],
      100,
    ),
    [
      [0, 20],
      [80, 100],
    ],
  );
  assert.equal(acceptInterval(0, Infinity, 10, true, 100), null);
  assert.equal(acceptInterval(0, 10, 300, true, 100), null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";
test("passwords are salted hashes and verify correctly", () => {
  const a = hashPassword("a-strong-password"),
    b = hashPassword("a-strong-password");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("a-strong-password", a), true);
  assert.equal(verifyPassword("wrong", a), false);
  assert.equal(verifyPassword("wrong", "malformed"), false);
});

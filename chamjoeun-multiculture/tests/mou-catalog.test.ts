import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mouCatalogSchema, agreementBody } from "../src/lib/mou-catalog.ts";
import { formatAgreementDate } from "../src/lib/agreements.ts";
const raw = JSON.parse(
  await readFile(new URL("../data/mou-catalog.json", import.meta.url), "utf8"),
);
test("reviewed catalog groups all source files and keeps draft agreement private", () => {
  const catalog = mouCatalogSchema.parse(raw);
  assert.equal(catalog.agreements.length, 21);
  assert.equal(catalog.agreements.flatMap((item) => item.sources).length, 31);
  assert.equal(
    catalog.agreements.filter((item) => item.reviewStatus === "reviewed")
      .length,
    20,
  );
  assert.equal(
    catalog.agreements.find((item) => item.key === "korea-cyber-202105")
      ?.reviewStatus,
    "needs_review",
  );
});
test("catalog rejects traversal, duplicate source assignment and impossible dates", () => {
  for (const path of [
    "../secret.pdf",
    "C:/secret.pdf",
    "/secret.pdf",
    "folder/../../secret.pdf",
    "folder\\secret.pdf",
  ]) {
    const copy = structuredClone(raw);
    copy.agreements[0].sources[0].path = path;
    assert.equal(mouCatalogSchema.safeParse(copy).success, false);
  }
  const duplicate = structuredClone(raw);
  duplicate.agreements[1].sources.push(duplicate.agreements[0].sources[0]);
  assert.equal(mouCatalogSchema.safeParse(duplicate).success, false);
  const invalidDate = structuredClone(raw);
  invalidDate.agreements[0].signedOn = "2021-02-30";
  assert.equal(mouCatalogSchema.safeParse(invalidDate).success, false);
});
test("month-only dates are preserved without inventing a signing day", () => {
  const item = mouCatalogSchema.parse(raw).agreements[0];
  assert.equal(formatAgreementDate(item.signedOn), "2021년 5월");
  assert.ok(agreementBody(item).includes("협약일: 2021년 5월\n"));
  assert.ok(!agreementBody(item).includes("2021년 5월 1일"));
});

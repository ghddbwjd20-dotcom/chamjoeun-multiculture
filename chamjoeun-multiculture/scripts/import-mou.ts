import { Client } from "pg";
import { readFile, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, basename } from "node:path";
import { createHash } from "node:crypto";
import { mouCatalogSchema, agreementBody } from "../src/lib/mou-catalog.ts";

const apply = process.argv.includes("--apply");
const catalog = mouCatalogSchema.parse(
  JSON.parse(await readFile("data/mou-catalog.json", "utf8")),
);
const root = await realpath(resolve(process.env.MOU_SOURCE_DIR ?? "../MOU"));
const files = new Map<string, { data: Buffer; mime: string; sha256: string }>();
for (const item of catalog.agreements)
  for (const source of item.sources) {
    const path = await realpath(resolve(root, source.path));
    const child = relative(root, path);
    if (
      child === ".." ||
      child.startsWith("../") ||
      child.startsWith("..\\") ||
      isAbsolute(child)
    )
      throw new Error("Source outside MOU directory");
    const data = await readFile(path);
    const hash = createHash("sha256").update(data).digest("hex");
    if (hash !== source.sha256)
      throw new Error(`Source changed since review: ${source.path}`);
    if (!data.length || data.length > 10 * 1024 ** 2)
      throw new Error(`Source size invalid: ${source.path}`);
    const mime =
      data.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
          ? "image/jpeg"
          : data
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : null;
    if (!mime) throw new Error(`Unsupported source: ${source.path}`);
    files.set(source.path, { data, mime, sha256: hash });
  }
console.log(
  `Verified ${catalog.agreements.length} agreements and ${files.size} source files (${(Array.from(files.values()).reduce((sum, file) => sum + file.data.length, 0) / 1024 ** 2).toFixed(1)} MB).`,
);
if (!apply) {
  console.log(
    "Dry run only. Add --apply to register summaries and private original files in DATABASE_URL.",
  );
} else {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 120000,
  });
  await db.connect();
  let inserted = 0,
    skipped = 0;
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(7042028)");
    for (const item of catalog.agreements) {
      const existing = (
        await db.query("SELECT id FROM agreements WHERE source_key=$1", [
          item.key,
        ])
      ).rows[0];
      let agreementId: string;
      if (existing) {
        agreementId = existing.id;
        skipped++;
      } else {
        const post = (
          await db.query(
            "INSERT INTO posts(title,category,body,published) VALUES($1,'업무협약',$2,$3) RETURNING id",
            [item.title, agreementBody(item), item.reviewStatus === "reviewed"],
          )
        ).rows[0];
        agreementId = (
          await db.query(
            "INSERT INTO agreements(source_key,post_id,partner_name,signed_on,parties,review_status,review_note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
            [
              item.key,
              post.id,
              item.partner,
              item.signedOn,
              JSON.stringify(item.parties),
              item.reviewStatus,
              item.reviewNote,
            ],
          )
        ).rows[0].id;
        inserted++;
      }
      for (const source of item.sources) {
        const file = files.get(source.path)!;
        const previous = (
          await db.query(
            "SELECT agreement_id,sha256 FROM agreement_documents WHERE source_path=$1",
            [source.path],
          )
        ).rows[0];
        if (previous) {
          if (
            previous.agreement_id !== agreementId ||
            previous.sha256 !== file.sha256
          )
            throw new Error(`Existing source differs: ${source.path}`);
          continue;
        }
        await db.query(
          "INSERT INTO agreement_documents(agreement_id,source_path,original_name,mime_type,sha256,size_bytes,data) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            agreementId,
            source.path,
            basename(source.path),
            file.mime,
            file.sha256,
            file.data.length,
            file.data,
          ],
        );
      }
    }
    await db.query("COMMIT");
    console.log(
      `Committed: ${inserted} new agreements; ${skipped} existing agreements preserved. Original files are admin-only.`,
    );
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

import { Client } from "pg";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const apply = process.argv.includes("--apply");
const images = JSON.parse(
  await readFile(".local/mou-public/index.json", "utf8"),
);
const prepared = [];
for (const image of images) {
  const data = await readFile(image.path);
  if (createHash("sha256").update(data).digest("hex") !== image.sha256)
    throw new Error("Prepared image changed");
  if (
    !data.length ||
    data.length > 4 * 1024 ** 2 ||
    data[0] !== 0xff ||
    data[1] !== 0xd8
  )
    throw new Error("Invalid public JPEG");
  const hex = createHash("sha256")
    .update(
      `mou-public:${image.agreementKey}:${image.sourcePath}:${image.page}`,
    )
    .digest("hex");
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  prepared.push({ ...image, data, id });
}
console.log(`Verified ${prepared.length} public images.`);
if (!apply) {
  console.log(
    "Dry run only. Use --apply to attach images to published agreements.",
  );
} else {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  await db.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(7042027)");
    const used = Number(
      (
        await db.query(
          "SELECT coalesce(sum(octet_length(data)),0)::bigint bytes FROM attachment_files",
        )
      ).rows[0].bytes,
    );
    const additions = [];
    for (const image of prepared) {
      const agreement = (
        await db.query(
          "SELECT a.post_id FROM agreements a JOIN posts p ON p.id=a.post_id WHERE a.source_key=$1 AND p.published=true AND p.deleted_at IS NULL",
          [image.agreementKey],
        )
      ).rows[0];
      if (!agreement) continue;
      const existing = (
        await db.query(
          "SELECT a.post_id,encode(sha256(f.data),'hex') hash FROM attachments a JOIN attachment_files f ON f.id=a.id WHERE a.id=$1",
          [image.id],
        )
      ).rows[0];
      if (existing) {
        if (
          existing.post_id !== agreement.post_id ||
          existing.hash !== image.sha256
        )
          throw new Error("Existing image differs");
        continue;
      }
      additions.push({ ...image, postId: agreement.post_id });
    }
    if (
      used + additions.reduce((sum, image) => sum + image.data.length, 0) >
      100 * 1024 ** 2
    )
      throw new Error("Attachment storage limit exceeded");
    const timestamp = Date.now();
    for (const [index, image] of additions.entries()) {
      await db.query(
        "INSERT INTO attachments(id,post_id,original_name,mime_type,size_bytes,created_at) VALUES($1,$2,$3,'image/jpeg',$4,$5)",
        [
          image.id,
          image.postId,
          image.name,
          image.data.length,
          new Date(timestamp + index),
        ],
      );
      await db.query("INSERT INTO attachment_files(id,data) VALUES($1,$2)", [
        image.id,
        image.data,
      ]);
    }
    await db.query("COMMIT");
    console.log(
      `Published ${additions.length} images. Existing attachments preserved.`,
    );
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

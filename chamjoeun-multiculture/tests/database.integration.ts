import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL to a development database.");
test("PostgreSQL migrations, enrollment uniqueness, and rollback", async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const email = `integration-${randomUUID()}@example.test`;
  try {
    await db.query("BEGIN");
    assert.ok(
      Number(
        (await db.query("SELECT count(*) FROM schema_migrations")).rows[0]
          .count,
      ) >= 2,
    );
    const u = await db.query(
      "INSERT INTO users(name,email,password_hash) VALUES('integration test',$1,'not-a-login-hash') RETURNING id",
      [email],
    );
    const c = await db.query(
      "INSERT INTO courses(slug,title,category,summary) VALUES($1,'test','test','test') RETURNING id",
      [`test-${randomUUID()}`],
    );
    await db.query(
      "INSERT INTO enrollments(user_id,course_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
      [u.rows[0].id, c.rows[0].id],
    );
    await db.query("SAVEPOINT duplicate_check");
    await assert.rejects(
      db.query(
        "INSERT INTO enrollments(user_id,course_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
        [u.rows[0].id, c.rows[0].id],
      ),
      (e: unknown) => (e as { code: string }).code === "23505",
    );
    await db.query("ROLLBACK TO SAVEPOINT duplicate_check");
    await db.query("ROLLBACK");
    assert.equal(
      (await db.query("SELECT id FROM users WHERE email=$1", [email])).rowCount,
      0,
    );
  } finally {
    await db.end();
  }
});
test("anonymous admin and watch API access are denied", async () => {
  const base = process.env.APP_URL ?? "http://127.0.0.1:3000";
  const admin = await fetch(`${base}/admin`, { redirect: "manual" });
  assert.ok([303, 307].includes(admin.status));
  assert.ok(admin.headers.get("location")?.includes("/login"));
  const request = {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "start", lessonId: randomUUID() }),
  };
  assert.equal((await fetch(`${base}/api/watch`, request)).status, 401);
  assert.equal(
    (
      await fetch(`${base}/api/watch`, {
        ...request,
        headers: { ...request.headers, Origin: "https://untrusted.example" },
      })
    ).status,
    403,
  );
});

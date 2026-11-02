import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL to a development database.");
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (
  !localHosts.has(new URL(process.env.DATABASE_URL).hostname) ||
  !localHosts.has(
    new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").hostname,
  )
) {
  throw new Error(
    "These integration tests temporarily change settings and require a local database and app server.",
  );
}
test("PostgreSQL migrations, enrollment uniqueness, and rollback", async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const email = `integration-${randomUUID()}@example.test`;
  try {
    await db.query("BEGIN");
    const applied = new Set(
      (await db.query("SELECT name FROM schema_migrations")).rows.map(
        (row) => row.name,
      ),
    );
    for (const file of (await readdir("db/migrations")).filter((name) =>
      name.endsWith(".sql"),
    )) {
      assert.ok(applied.has(file), `Missing migration: ${file}`);
    }
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
  const inquiries = await fetch(`${base}/mypage/inquiries`, {
    redirect: "manual",
  });
  assert.ok([303, 307].includes(inquiries.status));
  assert.ok(inquiries.headers.get("location")?.includes("/login"));
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

test("members can read only their own inquiries, including answers and pagination", async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const token = randomBytes(32).toString("hex");
  const marker = randomUUID();
  const base = process.env.APP_URL ?? "http://127.0.0.1:3000";
  let userId: string | undefined;
  let otherUserId: string | undefined;
  const inquiryIds: string[] = [];
  try {
    userId = (
      await db.query(
        "INSERT INTO users(name,email,password_hash,email_verified_at) VALUES('inquiry test',$1,'not-a-login-hash',now()) RETURNING id",
        [`inquiry-${marker}@example.test`],
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
      [createHash("sha256").update(token).digest("hex"), userId],
    );
    otherUserId = (
      await db.query(
        "INSERT INTO users(name,email,password_hash) VALUES('other inquiry test',$1,'not-a-login-hash') RETURNING id",
        [`other-inquiry-${marker}@example.test`],
      )
    ).rows[0].id;
    // Matching email alone must never grant access to a guest's or another member's inquiry.
    for (let index = 0; index < 13; index++) {
      const row = await db.query(
        `INSERT INTO inquiries(name,email,kind,subject,message,user_id,status,answer,answered_at,created_at)
         VALUES('test',$1,'other',$2,$3,$4,'answered',$5,now(),now()-($6 * interval '1 minute')) RETURNING id`,
        [
          `inquiry-${marker}@example.test`,
          `${index >= 11 ? "private" : "own"}-${marker}-${index}`,
          "integration inquiry body",
          index === 11 ? null : index === 12 ? otherUserId : userId,
          `answer-${marker}-${index}`,
          index,
        ],
      );
      inquiryIds.push(row.rows[0].id);
    }
    const headers = { Cookie: `cj_session=${token}` };
    const first = await fetch(`${base}/mypage/inquiries`, { headers });
    assert.equal(first.status, 200);
    const html = await first.text();
    assert.ok(html.includes(`own-${marker}-0`));
    assert.ok(html.includes(`answer-${marker}-0`));
    assert.ok(!html.includes(`own-${marker}-10`));
    assert.ok(!html.includes(`private-${marker}-11`));
    assert.ok(!html.includes(`private-${marker}-12`));
    const second = await fetch(`${base}/mypage/inquiries?page=2`, { headers });
    assert.equal(second.status, 200);
    const secondHtml = await second.text();
    assert.ok(secondHtml.includes(`own-${marker}-10`));
    assert.ok(!secondHtml.includes(`own-${marker}-0`));
    assert.ok(!secondHtml.includes(`private-${marker}-11`));
    assert.ok(!secondHtml.includes(`private-${marker}-12`));
  } finally {
    await db.query("DELETE FROM inquiries WHERE id=ANY($1::uuid[])", [
      inquiryIds,
    ]);
    if (userId) await db.query("DELETE FROM users WHERE id=$1", [userId]);
    if (otherUserId)
      await db.query("DELETE FROM users WHERE id=$1", [otherUserId]);
    await db.end();
  }
});

test("watch API saves final intervals, resumes, completes and rejects revoked access", async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const marker = randomUUID();
  const token = randomBytes(32).toString("hex");
  const base = process.env.APP_URL ?? "http://127.0.0.1:3000";
  let userId: string | undefined;
  let courseId: string | undefined;
  const post = (body: object) =>
    fetch(`${base}/api/watch`, {
      method: "POST",
      headers: {
        Origin: base,
        Cookie: `cj_session=${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  try {
    userId = (
      await db.query(
        "INSERT INTO users(name,email,password_hash,email_verified_at) VALUES('watch test',$1,'not-a-login-hash',now()) RETURNING id",
        [`watch-${marker}@example.test`],
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
      [createHash("sha256").update(token).digest("hex"), userId],
    );
    courseId = (
      await db.query(
        "INSERT INTO courses(slug,title,category,summary,completion_threshold) VALUES($1,'watch test','test','test',50) RETURNING id",
        [`watch-${marker}`],
      )
    ).rows[0].id;
    const lessonId = (
      await db.query(
        "INSERT INTO lessons(course_id,title,position,duration_seconds,video_status,video_key) VALUES($1,'test',1,60,'ready',$2) RETURNING id",
        [courseId, `lessons/${marker}/master.m3u8`],
      )
    ).rows[0].id;
    assert.equal((await post({ kind: "start", lessonId })).status, 403);
    await db.query(
      "INSERT INTO enrollments(user_id,course_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
      [userId, courseId],
    );
    const start = await post({ kind: "start", lessonId });
    assert.equal(start.status, 200);
    const first = await start.json();
    assert.equal(first.lastPosition, 0);
    await db.query(
      "UPDATE watch_sessions SET last_ping_at=now()-interval '10 seconds' WHERE id=$1",
      [first.sessionId],
    );
    const finalSave = await post({
      kind: "ping",
      sessionId: first.sessionId,
      position: 10,
      playing: true,
    });
    assert.equal(finalSave.status, 200);
    assert.equal((await finalSave.json()).watchedSeconds, 10);
    const resumed = await post({ kind: "start", lessonId });
    const second = await resumed.json();
    assert.equal(second.lastPosition, 10);
    assert.equal(
      (
        await post({
          kind: "ping",
          sessionId: first.sessionId,
          position: 11,
          playing: true,
        })
      ).status,
      403,
    );
    await db.query(
      "UPDATE watch_sessions SET last_ping_at=now()-interval '11 seconds' WHERE id=$1",
      [second.sessionId],
    );
    const completed = await post({
      kind: "ping",
      sessionId: second.sessionId,
      position: 31,
      playing: true,
    });
    assert.equal(completed.status, 200);
    const completedBody = await completed.json();
    assert.equal(completedBody.watchedSeconds, 31);
    assert.equal(completedBody.courseProgress, 51);
    assert.equal(
      (
        await db.query(
          "SELECT status FROM enrollments WHERE user_id=$1 AND course_id=$2",
          [userId, courseId],
        )
      ).rows[0].status,
      "completed",
    );
    await db.query(
      "UPDATE enrollments SET status='cancelled' WHERE user_id=$1 AND course_id=$2",
      [userId, courseId],
    );
    const revoked = await post({
      kind: "ping",
      sessionId: second.sessionId,
      position: 32,
      playing: true,
    });
    assert.equal(revoked.status, 403);
    assert.equal((await revoked.json()).videoSrc, undefined);
  } finally {
    if (userId) {
      await db.query("DELETE FROM audit_logs WHERE actor_id=$1", [userId]);
      await db.query("DELETE FROM learning_daily WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM lesson_progress WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM watch_sessions WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM enrollments WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM rate_limits WHERE key=$1", [
        `watch:${userId}`,
      ]);
    }
    if (courseId) {
      await db.query("DELETE FROM lessons WHERE course_id=$1", [courseId]);
      await db.query("DELETE FROM courses WHERE id=$1", [courseId]);
    }
    if (userId) await db.query("DELETE FROM users WHERE id=$1", [userId]);
    await db.end();
  }
});

test("saved contact settings reach public pages, footer and quick phone links", async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const base = process.env.APP_URL ?? "http://127.0.0.1:3000";
  const original = (
    await db.query("SELECT value FROM site_settings WHERE key='contact'")
  ).rows[0].value;
  const changed = {
    ...original,
    phone: "02-1234-5678",
    email: "contact-settings-test@example.test",
    address: "부산 테스트 주소 123",
    privacyOfficer: "테스트책임자",
  };
  try {
    await db.query("UPDATE site_settings SET value=$1 WHERE key='contact'", [
      JSON.stringify(changed),
    ]);
    for (const path of [
      "/",
      "/contact",
      "/about",
      "/login",
      "/privacy",
      "/terms",
      "/support",
    ]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(
        html.includes('href="tel:0212345678"'),
        `${path}: updated phone link`,
      );
      assert.ok(html.includes(changed.email), `${path}: updated email`);
      assert.ok(html.includes(changed.address), `${path}: updated address`);
      assert.ok(!html.includes(original.phone), `${path}: stale phone`);
      assert.ok(!html.includes(original.email), `${path}: stale email`);
      if (path === "/privacy") assert.ok(html.includes(changed.privacyOfficer));
    }
  } finally {
    await db.query("UPDATE site_settings SET value=$1 WHERE key='contact'", [
      JSON.stringify(original),
    ]);
    await db.end();
  }
});

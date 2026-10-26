import { Pool } from "pg";
import { hashPassword } from "../src/lib/password.ts";
if (
  process.env.NODE_ENV === "production" ||
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).hostname.match(
    /^(127\.0\.0\.1|localhost)$/,
  )
)
  throw new Error("Local development databases only.");
if (
  !process.env.DEV_ADMIN_PASSWORD ||
  process.env.DEV_ADMIN_PASSWORD.length < 12
)
  throw new Error(
    "Set a 12+ character DEV_ADMIN_PASSWORD in your local environment. No default password is provided.",
  );
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await db.connect();
try {
  await client.query("BEGIN");
  await client.query(
    "INSERT INTO users(name,email,password_hash,role,email_verified_at) VALUES('개발확인 관리자','dev-admin@example.test',$1,'admin',now()) ON CONFLICT(email) DO NOTHING",
    [hashPassword(process.env.DEV_ADMIN_PASSWORD)],
  );
  const r = await client.query(
    "INSERT INTO courses(slug,title,category,summary,description,instructor,status) VALUES('development-sample','개발 확인용 샘플 과정','개발 확인용','수강신청과 강의실 연결을 확인하기 위한 개발용 예시 과정입니다.','실제 운영 교육과정이 아닙니다. 실제 강의 영상과 강사 정보를 등록하기 전에 흐름을 확인하는 용도입니다.','운영 자료 등록 전','published') ON CONFLICT(slug) DO UPDATE SET slug=EXCLUDED.slug RETURNING id",
  );
  await client.query(
    "INSERT INTO lessons(course_id,title,position,duration_seconds) VALUES($1,'개발 확인용 차시 · 영상 준비 중',1,60) ON CONFLICT(course_id,position) DO NOTHING",
    [r.rows[0].id],
  );
  await client.query("COMMIT");
  console.log(
    "Local-only development fixtures prepared. Not a production seed.",
  );
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await db.end();
}

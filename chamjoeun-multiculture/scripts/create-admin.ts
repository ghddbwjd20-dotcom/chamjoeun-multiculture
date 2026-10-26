import { Pool } from "pg";
import { hashPassword } from "../src/lib/password.ts";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "ADMIN_EMAIL과 12자 이상의 ADMIN_PASSWORD 환경변수가 필요합니다. 기본 관리자 비밀번호는 없습니다.",
  );
const db = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await db.query(
    "INSERT INTO users(name,email,password_hash,role,email_verified_at) VALUES($1,$2,$3,'admin',now()) ON CONFLICT(email) DO UPDATE SET role='admin',password_hash=EXCLUDED.password_hash,email_verified_at=now()",
    [process.env.ADMIN_NAME ?? "운영관리자", email, hashPassword(password)],
  );
  console.log("관리자 계정을 생성/갱신했습니다.");
} finally {
  await db.end();
}

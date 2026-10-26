import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";
export type User = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
};
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("cj_session")?.value;
  if (!token) return null;
  const rows = await query<User>(
    "SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.deleted_at IS NULL",
    [digest(token)],
  );
  return rows[0] ?? null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/classroom");
  return user;
}
export async function createSession(userId: string, remember = false) {
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+($3 * interval '1 second'))",
    [digest(token), userId, remember ? 604800 : 28800],
  );
  (await cookies()).set("cj_session", token, {
    httpOnly: true,
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: 604800 } : {}),
  });
}
export async function rateLimit(key: string, limit = 8) {
  const [r] = await query<{ count: number }>(
    `INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END, reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING count`,
    [key],
  );
  return r.count <= limit;
}

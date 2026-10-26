import { readFile, writeFile, access } from "node:fs/promises";
import { Client } from "pg";
const password = (await readFile(".local/db-password", "utf8")).trim();
const client = new Client({
  host: "127.0.0.1",
  port: 55432,
  user: "chamjoeun",
  password,
  database: "postgres",
  connectionTimeoutMillis: 5000,
});
await client.connect();
try {
  if (
    !(await client.query("SELECT 1 FROM pg_database WHERE datname='chamjoeun'"))
      .rowCount
  )
    await client.query("CREATE DATABASE chamjoeun");
} finally {
  await client.end();
}
try {
  await access(".env.local");
} catch {
  await writeFile(
    ".env.local",
    `DATABASE_URL=postgresql://chamjoeun:${password}@127.0.0.1:55432/chamjoeun\nAPP_URL=http://127.0.0.1:3000\nDEV_EMAIL_PREVIEW=true\n`,
  );
}
console.log("Local database initialized.");

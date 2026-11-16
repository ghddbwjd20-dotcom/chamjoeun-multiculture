import { spawn } from "node:child_process";
import { mkdir, rename, readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

if (
  !process.env.BACKUP_DIR ||
  !(process.env.BACKUP_DATABASE_URL ?? process.env.DATABASE_URL)
) {
  throw new Error(
    "BACKUP_DIR과 BACKUP_DATABASE_URL 또는 DATABASE_URL을 설정해 주세요.",
  );
}
const url = new URL(
  process.env.BACKUP_DATABASE_URL ?? process.env.DATABASE_URL,
);
if (!["postgresql:", "postgres:"].includes(url.protocol))
  throw new Error("PostgreSQL 주소를 확인해 주세요.");
const env = {
  ...process.env,
  PGHOST: url.hostname,
  PGPORT: url.port || "5432",
  PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password),
  PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  PGSSLMODE: url.searchParams.get("sslmode") ?? "prefer",
  PGCONNECT_TIMEOUT: "15",
};
for (const [parameter, key] of [
  ["sslrootcert", "PGSSLROOTCERT"],
  ["sslcert", "PGSSLCERT"],
  ["sslkey", "PGSSLKEY"],
  ["channel_binding", "PGCHANNELBINDING"],
]) {
  const value = url.searchParams.get(parameter);
  if (value) env[key] = value;
}
function run(command, args) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { env, stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? accept()
        : reject(new Error(`${command} 실행 실패 (${code})`)),
    );
  });
}
const directory = resolve(process.env.BACKUP_DIR);
await mkdir(directory, { recursive: true, mode: 0o700 });
process.umask(0o077);
const day = new Date().toISOString().slice(0, 10);
const temporary = join(directory, `.chamjoeun-${randomUUID()}.partial`);
try {
  await run(process.env.PG_DUMP_PATH ?? "pg_dump", [
    "--format=custom",
    "--file",
    temporary,
  ]);
  if (!(await stat(temporary)).size)
    throw new Error("백업 파일이 비어 있습니다.");
  await run(process.env.PG_RESTORE_PATH ?? "pg_restore", ["--list", temporary]);
  await rename(temporary, join(directory, `chamjoeun-${day}.dump`));
  const cutoff = new Date(Date.parse(day) - 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const match = /^chamjoeun-(\d{4}-\d{2}-\d{2})\.dump$/.exec(entry.name);
    if (entry.isFile() && match && match[1] < cutoff)
      await rm(join(directory, entry.name));
  }
  console.log(`DB 백업 완료 (${day} UTC)`);
} finally {
  await rm(temporary, { force: true });
}

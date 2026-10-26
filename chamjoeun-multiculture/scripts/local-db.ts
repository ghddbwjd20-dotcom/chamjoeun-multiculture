import { randomBytes, createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access, cp } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
if (process.platform !== "win32")
  throw new Error(
    "Windows 로컬 도우미입니다. Linux/macOS에서는 docker compose up -d db를 사용하세요.",
  );
const require = createRequire(import.meta.url);
const native = resolve(
  dirname(require.resolve("@embedded-postgres/windows-x64")),
  "../native",
);
// PostgreSQL Windows binaries require an ASCII runtime path. A stable project-specific temp folder avoids Korean path encoding errors.
let previousHome: string | undefined;
try {
  previousHome = JSON.parse(await readFile(".local/runtime.json", "utf8")).home;
} catch {}
const home =
  process.env.LOCAL_PG_HOME ??
  previousHome ??
  join(
    tmpdir(),
    `chamjoeun-pg-${createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12)}`,
  );
const runtime = join(home, "runtime"),
  data = join(home, "data");
await mkdir(home, { recursive: true });
await mkdir(".local", { recursive: true });
try {
  await access(join(runtime, "bin", "initdb.exe"));
} catch {
  await cp(native, runtime, { recursive: true });
}
let password: string;
try {
  password = (await readFile(".local/db-password", "utf8")).trim();
} catch {
  password = randomBytes(24).toString("hex");
  await writeFile(".local/db-password", password, { mode: 0o600 });
}
function run(bin: string, args: string[]) {
  const r = spawnSync(join(runtime, "bin", bin), args, {
    encoding: "utf8",
    windowsHide: true,
    stdio: "ignore",
  });
  if (r.status !== 0)
    throw new Error(`${bin} failed: ${r.stderr ?? r.error ?? r.stdout}`);
  return r;
}
try {
  await access(join(data, "PG_VERSION"));
} catch {
  const pwfile = join(home, ".init-password");
  await writeFile(pwfile, password, { mode: 0o600 });
  run("initdb.exe", [
    "-D",
    data,
    "-U",
    "chamjoeun",
    "--auth=scram-sha-256",
    `--pwfile=${pwfile}`,
    "--encoding=UTF8",
    "--locale=C",
  ]);
  await writeFile(pwfile, "");
}
const status = spawnSync(
  join(runtime, "bin", "pg_ctl.exe"),
  ["status", "-D", data],
  { windowsHide: true },
);
if (status.status !== 0)
  run("pg_ctl.exe", [
    "start",
    "-D",
    data,
    "-l",
    join(home, "postgres.log"),
    "-o",
    "-h 127.0.0.1 -p 55432",
    "-w",
  ]);
const client = new Client({
  host: "127.0.0.1",
  port: 55432,
  user: "chamjoeun",
  password,
  database: "postgres",
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
    { mode: 0o600 },
  );
}
await writeFile(
  ".local/runtime.json",
  JSON.stringify({ home, data, runtime }, null, 2),
);
console.log(
  "PostgreSQL ready on 127.0.0.1:55432. Credentials: ignored .env.local; runtime location: ignored .local/runtime.json. Use npm run db:stop when finished.",
);

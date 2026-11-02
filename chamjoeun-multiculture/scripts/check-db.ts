import { Client } from "pg";
import { readdir } from "node:fs/promises";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("PostgreSQL: DATABASE_URL is not configured.");
  process.exit(1);
}
const client = new Client({
  connectionString: url,
  connectionTimeoutMillis: 8000,
});
try {
  const target = new URL(url);
  console.log(
    `Database target: ${["localhost", "127.0.0.1", "::1", "[::1]"].includes(target.hostname) ? "local" : "external"}`,
  );
  await client.connect();
  const { rows } = await client.query(
    "SELECT current_setting('server_version') AS version, pg_is_in_recovery() AS replica",
  );
  console.log(
    `PostgreSQL connected: ${rows[0].version}; ${rows[0].replica ? "replica" : "primary"}`,
  );
  const expected = (await readdir("db/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const applied = new Set(
    (await client.query("SELECT name FROM schema_migrations")).rows.map(
      (row) => row.name,
    ),
  );
  const pending = expected.filter((name) => !applied.has(name));
  console.log(
    `Migrations: ${expected.length - pending.length}/${expected.length} applied`,
  );
  if (pending.length) {
    console.error(`Pending: ${pending.join(", ")}`);
    process.exitCode = 1;
  }
} catch (error) {
  // Never print the connection string, password or provider response body.
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "CONNECTION_OR_SCHEMA_ERROR";
  console.error(
    `PostgreSQL check failed (${code}). Check the server and database configuration.`,
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

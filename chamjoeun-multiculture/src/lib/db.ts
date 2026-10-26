import { Pool, type PoolClient, type QueryResultRow } from "pg";
const globalDb = globalThis as unknown as { pool?: Pool };
export function pool() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  if (!globalDb.pool)
    globalDb.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      connectionTimeoutMillis: 4000,
    });
  return globalDb.pool;
}
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return (await pool().query<T>(text, values)).rows;
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

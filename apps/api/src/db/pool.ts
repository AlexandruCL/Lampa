import pg from "pg";
import type { Db, Tx } from "../seam.js";

export function createPool(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

export const asDb = (pool: pg.Pool): Db => ({ query: (text, params) => pool.query(text, params) });

export const asTx = (pool: pg.Pool): Tx => async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({ query: (text, params) => client.query(text, params) });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

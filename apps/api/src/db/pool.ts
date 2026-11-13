import pg from "pg";
import type { Db } from "../seam.js";

export function createPool(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

export const asDb = (pool: pg.Pool): Db => ({ query: (text, params) => pool.query(text, params) });

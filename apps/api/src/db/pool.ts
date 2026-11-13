import pg from "pg";

export function createPool(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return new pg.Pool({ connectionString: process.env.DATABASE_URL });
}

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { MIGRATIONS_TABLE_SQL, baseline, pending } from "./migrations.js";
import { createPool } from "./pool.js";

const migDir = join(import.meta.dirname, "..", "..", "..", "..", "db", "migrations");

async function main(): Promise<void> {
  const pool = createPool();
  try {
    const client = await pool.connect();
    try {
      const url = new URL(process.env.DATABASE_URL as string);
      console.log(`db:migrate on ${url.host}/${url.pathname.slice(1)}`);
      const files = (await readdir(migDir)).filter((f) => f.endsWith(".sql")).sort();

      await client.query(MIGRATIONS_TABLE_SQL);
      let applied = (await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name as string);

      const exists = await client.query("SELECT to_regclass('public.interaction_events') AS t");
      if (applied.length === 0 && exists.rows[0].t !== null) {
        for (const name of baseline(files)) {
          await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
          console.log(`baseline ${name}`);
        }
        applied = baseline(files);
      }

      let n = 0;
      for (const name of pending(files, applied)) {
        const sql = await readFile(join(migDir, name), "utf8");
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => {});
          throw err;
        }
        console.log(`applied ${name}`);
        n++;
      }
      console.log(`db:migrate done: ${n} applied`);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPool } from "./pool.js";
import { INSERT_SITE, parseSiteFile, siteParams, toSiteRow, toSitesJson } from "./seed.js";

const root = join(import.meta.dirname, "..", "..", "..", "..");

async function filesWith(dir: string, ext: string): Promise<string[]> {
  return (await readdir(dir)).filter((f) => f.endsWith(ext)).sort();
}

async function main(): Promise<void> {
  const pool = createPool();
  try {
    const client = await pool.connect();
    try {
      const url = new URL(process.env.DATABASE_URL as string);
      console.log(`db:reset on ${url.host}/${url.pathname.slice(1)}`);

      await client.query(await readFile(join(root, "db", "reset.sql"), "utf8"));

      const migDir = join(root, "db", "migrations");
      for (const f of await filesWith(migDir, ".sql")) {
        await client.query(await readFile(join(migDir, f), "utf8"));
        console.log(`applied ${f}`);
      }

      const siteDir = join(root, "content", "sites");
      const files = [];
      for (const f of await filesWith(siteDir, ".yaml")) {
        files.push(parseSiteFile(await readFile(join(siteDir, f), "utf8")));
      }

      await client.query("BEGIN");
      try {
        for (const file of files) await client.query(INSERT_SITE, siteParams(toSiteRow(file)));
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }

      await writeFile(
        join(root, "packages", "shared", "sites.json"),
        JSON.stringify(toSitesJson(files), null, 2) + "\n",
      );

      const t = await client.query(
        `SELECT count(*)::int AS n FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = ANY($1)`,
        [["sites", "windows", "panes", "echoes", "blobs", "interaction_events", "colour_readings"]],
      );
      const h = await client.query(
        `SELECT count(*)::int AS n FROM timescaledb_information.hypertables
         WHERE hypertable_name IN ('interaction_events', 'colour_readings')`,
      );
      const s = await client.query("SELECT count(*)::int AS n FROM sites");
      console.log(`db:reset done: ${t.rows[0].n} tables, ${h.rows[0].n} hypertables, ${s.rows[0].n} sites`);
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

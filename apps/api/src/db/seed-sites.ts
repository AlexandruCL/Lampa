import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createPool } from "./pool.js";
import { UPSERT_SITE, parseSiteFile, siteParams, toSiteRow, toSitesJson } from "./seed.js";

const root = join(import.meta.dirname, "..", "..", "..", "..");

async function main(): Promise<void> {
  const pool = createPool();
  try {
    const client = await pool.connect();
    try {
      const url = new URL(process.env.DATABASE_URL as string);
      console.log(`db:seed on ${url.host}/${url.pathname.slice(1)}`);

      const siteDir = join(root, "content", "sites");
      const files = [];
      for (const f of (await readdir(siteDir)).filter((f) => f.endsWith(".yaml")).sort()) {
        files.push(parseSiteFile(await readFile(join(siteDir, f), "utf8")));
      }

      await client.query("BEGIN");
      try {
        for (const file of files) await client.query(UPSERT_SITE, siteParams(toSiteRow(file)));
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      }

      await writeFile(
        join(root, "packages", "shared", "sites.json"),
        JSON.stringify(toSitesJson(files), null, 2) + "\n",
      );
      console.log(`db:seed done: ${files.length} sites`);
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

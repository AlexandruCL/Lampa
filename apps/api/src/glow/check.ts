// npm run glow:check: runs glowSql on the known events as VALUES lists (no table read, nothing written)
// and compares each site's glow with glowAt.
import { createPool } from "../db/pool.js";
import { glowAt, glowSql } from "./glow.js";
import { KNOWN_ACTIVITY, KNOWN_AT, KNOWN_SITES } from "./known.js";

const TOLERANCE = 0.000001;

// The known events are constants of this repo, so they go into the text as literals.
const sites = `(VALUES ${KNOWN_SITES.map((s) => `('${s.id}', ${s.glow_k}::real, 'published')`).join(", ")}) AS s(id, glow_k, status)`;
const activity = `(VALUES ${KNOWN_ACTIVITY.map((a) => `('${a.site_id}', '${a.bucket.toISOString()}'::timestamptz, ${a.w}::real)`).join(", ")}) AS a(site_id, bucket, w)`;

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set");
    return 1;
  }
  const pool = createPool();
  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ site_id: string; glow: number }>(glowSql(sites, activity), [KNOWN_AT]);
      const sql = new Map(rows.map((r) => [r.site_id, r.glow]));
      let failed = 0;
      for (const s of KNOWN_SITES) {
        const ts = glowAt(KNOWN_ACTIVITY.filter((a) => a.site_id === s.id), s.glow_k, KNOWN_AT);
        const got = sql.get(s.id);
        if (got === undefined || !(Math.abs(got - ts) <= TOLERANCE)) {
          console.log(`glow:check failed: ${s.id} sql ${got} ts ${ts}`);
          failed++;
        }
      }
      if (failed > 0) return 1;
      console.log(`glow:check ok: ${KNOWN_SITES.length} sites`);
      return 0;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Only the message is printed: a pg or URL parse error object can carry the connection string.
main().then(
  (code) => { process.exitCode = code; },
  (err: unknown) => {
    console.log(`glow:check failed: ${err instanceof Error ? err.message : "unknown error"}`);
    process.exitCode = 1;
  },
);

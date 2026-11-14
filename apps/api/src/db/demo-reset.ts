import { pathToFileURL } from "node:url";
import { bridges, sites } from "@lampa/shared";
import type { Db, Tx } from "../seam.js";
import { hslToHex } from "../pulse/colour.js";
import { asDb, asTx, createPool } from "./pool.js";
import { TODAY_START_SQL } from "./today.js";

export const DEMO_SESSION = "demo:reset";
export const DEMO_WINDOW_SITE = "mx";
export const DEMO_PANES = 47;
export const DEMO_LAMPS = 721; // LAMP_TARGET - 10: the simulator's first 10 sessions each send one lamp.
export const DEMO_LAMP_MIN_AGE_S = 120;
export const DEMO_SATURATION = 0.8;
export const DEMO_LIGHTNESS = 0.5;

export const DELETE_PANES_SQL = "DELETE FROM panes";
export const DELETE_WINDOWS_SQL = "DELETE FROM windows";
export const DELETE_ECHOES_SQL = "DELETE FROM echoes";
export const DELETE_ECHO_BLOBS_SQL = "DELETE FROM blobs WHERE key LIKE 'echo-%'";
export const DELETE_EVENTS_SQL = "DELETE FROM interaction_events";
export const PLACES_TO_DRAFT_SQL = "UPDATE sites SET status = 'draft' WHERE status = 'published' AND NOT (id = ANY($1))";
export const INSERT_WINDOW_SQL = `INSERT INTO windows (site_id, started_at) VALUES ($1, now() - interval '${DEMO_PANES} minutes') RETURNING id`;
export const INSERT_PANES_SQL = `INSERT INTO panes (window_id, slot, hue, saturation, lightness, hex, anon_id, caught_at)
SELECT $1, t.slot, t.hue, ${DEMO_SATURATION}, ${DEMO_LIGHTNESS}, t.hex, '${DEMO_SESSION}', now() - (${DEMO_PANES} - t.slot) * interval '1 minute'
FROM unnest($2::int[], $3::real[], $4::text[]) AS t(slot, hue, hex)`;
// Same filter as LAMPS_SQL in glow/lamps.ts.
export const LAMP_SITES_SQL = "SELECT id FROM sites WHERE status = 'published' AND NOT is_memorial AND 'lamp' = ANY(interactions) ORDER BY id";
export const LAMP_WINDOW_OK_SQL = `SELECT now() - make_interval(secs => ${DEMO_LAMP_MIN_AGE_S}) > ${TODAY_START_SQL} AS ok`;
export const INSERT_LAMPS_SQL = `INSERT INTO interaction_events (ts, session_id, site_id, kind, weight, props)
SELECT ${TODAY_START_SQL} + (t.n - 1) * ((now() - make_interval(secs => ${DEMO_LAMP_MIN_AGE_S}) - ${TODAY_START_SQL}) / ${DEMO_LAMPS}),
  '${DEMO_SESSION}', t.site_id, 'lamp', 0, '{}'
FROM unnest($1::text[]) WITH ORDINALITY AS t(site_id, n)`;
export const REFRESH_1M_SQL = "CALL refresh_continuous_aggregate('site_activity_1m', NULL, NULL)";
export const HAS_1H_SQL = "SELECT 1 FROM timescaledb_information.continuous_aggregates WHERE view_name = 'site_activity_1h'";
export const REFRESH_1H_SQL = "CALL refresh_continuous_aggregate('site_activity_1h', NULL, NULL)";

export function demoPanes(): { slot: number; hue: number; hex: string }[] {
  return Array.from({ length: DEMO_PANES }, (_, slot) => {
    const hue = (slot * 30) % 360;
    return { slot, hue, hex: hslToHex(hue, DEMO_SATURATION, DEMO_LIGHTNESS) };
  });
}

export function lampSiteFor(i: number, lampSites: string[]): string {
  return lampSites[i % lampSites.length]!;
}

export const TOO_CLOSE_TO_MIDNIGHT = "demo:reset: too close to midnight, run again after 00:03";

/** Returns the summary line, or null when too close to midnight (nothing was changed). */
export async function demoReset(db: Db, tx: Tx): Promise<string | null> {
  if (!(await db.query(LAMP_WINDOW_OK_SQL)).rows[0]?.ok) return null;

  const counts = await tx(async (t) => {
    const p = await t.query(DELETE_PANES_SQL);
    const w = await t.query(DELETE_WINDOWS_SQL);
    const c = await t.query(DELETE_ECHOES_SQL);
    const b = await t.query(DELETE_ECHO_BLOBS_SQL);
    const e = await t.query(DELETE_EVENTS_SQL);
    const d = await t.query(PLACES_TO_DRAFT_SQL, [[...sites, ...bridges].map((s) => s.id)]);

    const { id } = (await t.query(INSERT_WINDOW_SQL, [DEMO_WINDOW_SITE])).rows[0];
    const panes = demoPanes();
    await t.query(INSERT_PANES_SQL, [id, panes.map((x) => x.slot), panes.map((x) => x.hue), panes.map((x) => x.hex)]);

    const lampSites: string[] = (await t.query(LAMP_SITES_SQL)).rows.map((r) => r.id);
    if (!lampSites.length) throw new Error("no lamp site is published");
    await t.query(INSERT_LAMPS_SQL, [Array.from({ length: DEMO_LAMPS }, (_, i) => lampSiteFor(i, lampSites))]);
    return { e: e.rowCount, p: p.rowCount, w: w.rowCount, c: c.rowCount, b: b.rowCount, d: d.rowCount };
  });

  // Outside the transaction: without it, buckets older than the policy window keep the deleted events.
  await db.query(REFRESH_1M_SQL);
  if ((await db.query(HAS_1H_SQL)).rows.length) await db.query(REFRESH_1H_SQL);

  return `demo:reset done: ${counts.e} events, ${counts.p} panes, ${counts.w} windows, ${counts.c} echoes, ${counts.b} echo blobs deleted; ${counts.d} places to draft; mx window ${DEMO_PANES} of 48; ${DEMO_LAMPS} lamps today`;
}

async function main(): Promise<number> {
  const pool = createPool();
  try {
    const line = await demoReset(asDb(pool), asTx(pool));
    console.log(line ?? TOO_CLOSE_TO_MIDNIGHT);
    return line ? 0 : 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    },
  );
}

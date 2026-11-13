import type { SiteStats } from "../agent/session.js";
import { TODAY_START_SQL } from "../db/today.js";
import type { Db, LatestGlow } from "../seam.js";

// $1 is the site id. Colours are per site; lamps are city-wide (Fabi's decision).
export const STATS_SQL = `SELECT
  (SELECT count(*)::int FROM panes p JOIN windows w ON w.id = p.window_id
    WHERE w.site_id = $1 AND p.caught_at >= ${TODAY_START_SQL}) AS colours_today,
  (SELECT count(*)::int FROM interaction_events
    WHERE kind = 'lamp' AND ts >= ${TODAY_START_SQL}) AS lamps_today`;

export function createGetSiteStats(deps: { db: Db; latestGlow: LatestGlow }): (siteId: string) => Promise<SiteStats> {
  return async (siteId) => {
    const { rows } = await deps.db.query(STATS_SQL, [siteId]);
    const glow = deps.latestGlow()?.sites.find((s) => s.siteId === siteId)?.glow ?? 0;
    return { glow, coloursToday: rows[0].colours_today, lampsToday: rows[0].lamps_today };
  };
}

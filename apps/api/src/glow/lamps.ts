import { LAMP_TARGET, LampsMessage } from "@lampa/shared";
import { TODAY_START_SQL } from "../db/today.js";

export const LAMP_PRESENCE_S = 90;

// One row per lamp site; lit_today is city-wide (the rule of STATS_SQL) and repeats on every row.
// lighting_now is the distinct sessions with a lamp at the site in the last LAMP_PRESENCE_S, 0 for none;
// it reads the hypertable by its (site_id, ts DESC) index, as the per-minute aggregate is too coarse for 90 s.
export const LAMPS_SQL = `SELECT s.id AS site_id,
  (SELECT count(*)::int FROM interaction_events
    WHERE kind = 'lamp' AND ts >= ${TODAY_START_SQL}) AS lit_today,
  (SELECT count(DISTINCT e.session_id)::int FROM interaction_events e
    WHERE e.site_id = s.id AND e.kind = 'lamp' AND e.ts > now() - make_interval(secs => ${LAMP_PRESENCE_S})) AS lighting_now
FROM sites s
WHERE s.status = 'published' AND NOT s.is_memorial AND 'lamp' = ANY(s.interactions)
ORDER BY s.id`;

/** No rows (no lamp site) leaves litToday undefined, so parse throws. */
export function toLampsMessage(rows: { site_id: unknown; lit_today: unknown; lighting_now: unknown }[]): LampsMessage {
  return LampsMessage.parse({
    litToday: rows[0]?.lit_today,
    target: LAMP_TARGET,
    sites: rows.map((r) => ({ siteId: r.site_id, lightingNow: r.lighting_now })),
  });
}

import { PulseColourClock, PulseInteractions, type PulseCandles } from "@lampa/shared";
import { TODAY_START_SQL } from "../db/today.js";
import { candleId } from "../events/candles.js";
import { COLOURS_TODAY_SQL, SCREEN_CANDLES_SQL } from "../panes/state.js";
import { CLOCK_SATURATION, hslToHex } from "./colour.js";

// Lamps as STATS_SQL, colours as COLOURS_TODAY_SQL, visitors city-wide (concept 11.2 D).
export const SUMMARY_SQL = `SELECT
  (SELECT count(*)::int FROM interaction_events WHERE kind = 'lamp' AND ts >= ${TODAY_START_SQL}) AS lamps_today,
  (${COLOURS_TODAY_SQL}) AS colours_today,
  (SELECT coalesce(distinct_count(rollup(visitors_hll)), 0)::int FROM site_activity_1m WHERE bucket >= ${TODAY_START_SQL}) AS visitors_today`;

// $1 is the colour site ids.
export const INTERACTIONS_SQL = `SELECT time_bucket_gapfill('5 minutes', bucket) AS t, site_id, coalesce(sum(n), 0)::int AS n
FROM site_activity_1m
WHERE bucket > now() - INTERVAL '3 hours' AND bucket <= now() AND site_id = ANY($1)
GROUP BY t, site_id ORDER BY t`;

export const COLOUR_CLOCK_SQL = `SELECT extract(hour FROM bucket AT TIME ZONE 'Europe/Bucharest')::int AS hour,
  mod(degrees(atan2(sum(hue_sin), sum(hue_cos)))::numeric + 360, 360)::float8 AS mean_hue,
  (sum(lightness * panes) / sum(panes))::float8 AS lightness,
  sum(panes)::int AS panes
FROM colour_1h
WHERE bucket > now() - INTERVAL '30 days' AND site_id <> 'gallery'
GROUP BY 1 ORDER BY 1`;

export const LANGUAGES_SQL = `SELECT lang, count(*)::int AS conversations
FROM conversations
WHERE ts >= ${TODAY_START_SQL} AND lang IS NOT NULL
GROUP BY lang ORDER BY conversations DESC, lang`;

export const CANDLES_SQL = SCREEN_CANDLES_SQL;

export type InteractionRow = { t: Date; site_id: string; n: number };
export type ClockRow = { hour: number; mean_hue: number; lightness: number; panes: number };

/** Every site, its points in time order; a site missing from the rows gets zeros on the other sites' grid. */
export function toInteractions(rows: InteractionRow[], siteIds: string[]): PulseInteractions {
  const grid = [...new Set(rows.map((r) => r.t.toISOString()))].sort();
  return PulseInteractions.parse({
    sites: siteIds.map((siteId) => {
      const byT = new Map(rows.filter((r) => r.site_id === siteId).map((r) => [r.t.toISOString(), r.n]));
      return { siteId, points: grid.map((t) => ({ t, n: byT.get(t) ?? 0 })) };
    }),
  });
}

const localHour = (d: Date) =>
  Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Bucharest" }).format(d));

export function toColourClock(rows: ClockRow[], now: Date): PulseColourClock {
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const r = rows.find((x) => x.hour === hour);
    return r && r.panes > 0
      ? { hour, hex: hslToHex(r.mean_hue, CLOCK_SATURATION, r.lightness), panes: r.panes }
      : { hour, hex: null, panes: 0 };
  });
  return PulseColourClock.parse({ hours, currentHour: localHour(now) });
}

export function toCandles(rows: { ts: Date; session_id: string }[]): PulseCandles {
  return { candles: rows.map((r) => ({ id: candleId(r.ts, r.session_id), at: r.ts.toISOString() })) };
}

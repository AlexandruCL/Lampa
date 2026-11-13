import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { ScreenState } from "@lampa/shared";
import type { Db } from "../seam.js";
import { TODAY_START_SQL } from "../db/today.js";
import { candleId } from "../events/candles.js";

export const WINDOWS_SQL = `SELECT w.site_id, w.id::text AS window_id,
       COALESCE(json_agg(json_build_object('slot', p.slot, 'hex', p.hex)) FILTER (WHERE p.id IS NOT NULL), '[]'::json) AS panes
FROM windows w
LEFT JOIN panes p ON p.window_id = w.id
WHERE w.completed_at IS NULL AND w.site_id IS NOT NULL
GROUP BY w.id, w.site_id`;

export const COLOURS_TODAY_SQL = `SELECT count(*)::int AS n
FROM panes p
JOIN windows w ON w.id = p.window_id
WHERE w.site_id IS NOT NULL AND p.caught_at >= ${TODAY_START_SQL}`;

export const SCREEN_CANDLES_SQL = `SELECT e.ts, e.session_id, e.site_id
FROM interaction_events e
JOIN sites s ON s.id = e.site_id
WHERE e.kind = 'candle' AND s.is_memorial AND e.ts > now() - INTERVAL '24 hours'
ORDER BY e.ts ASC`;

export type WindowRow = { site_id: string; window_id: string; panes: { slot: number; hex: string }[] };
export type CandleRow = { ts: Date; session_id: string; site_id: string };

export function toScreenState(rows: WindowRow[], coloursToday: number, candleRows: CandleRow[] = []): ScreenState {
  const windows = rows.map((r) => {
    const panes: (string | null)[] = Array(48).fill(null);
    for (const p of r.panes) panes[p.slot] = p.hex;
    return { siteId: r.site_id, windowId: r.window_id, panes };
  });
  const candles = candleRows.map((r) => ({ id: candleId(r.ts, r.session_id), siteId: r.site_id, litAt: r.ts.toISOString() }));
  return ScreenState.parse({ windows, coloursToday, candles });
}

// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
const screenLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

export function createScreenStateRouter(deps: { db?: Db }): Router {
  const router = Router();
  router.get("/screen/state", screenLimiter, async (_req, res) => {
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    try {
      const [w, c, k] = await Promise.all([
        deps.db.query(WINDOWS_SQL),
        deps.db.query(COLOURS_TODAY_SQL),
        deps.db.query(SCREEN_CANDLES_SQL),
      ]);
      res.json(toScreenState(w.rows as WindowRow[], c.rows[0]?.n ?? 0, k.rows as CandleRow[]));
    } catch (err) {
      console.error("screen state failed: " + (err instanceof Error ? err.message : String(err)));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}

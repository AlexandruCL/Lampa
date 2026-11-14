import { FINALE_LEAD_MS, type FinaleMessage, GlowMessage, LAMP_TARGET, type LampsMessage } from "@lampa/shared";
import type { Db, GlowLoop } from "../seam.js";
import { glowSql } from "./glow.js";
import { LAMPS_SQL, toLampsMessage } from "./lamps.js";

export const GLOW_INTERVAL_MS = 5000;
export const NUDGE_MIN_GAP_MS = 1000;
export { FINALE_LEAD_MS }; // moved to the contract so the web finale shares it

export function startGlowLoop(deps: { db: Db; emit: (message: GlowMessage) => void; emitLamps?: (message: LampsMessage) => void; emitFinale?: (message: FinaleMessage) => void; intervalMs?: number; now?: () => Date }): GlowLoop {
  const now = deps.now ?? (() => new Date());
  let latest: GlowMessage | null = null;
  let latestLamps: LampsMessage | null = null;
  // litToday of the last lamps message sent; null at start, so a restart above the target does not replay the finale.
  let prevLit: number | null = null;
  let running: Promise<void> | null = null;
  let lastStart = -Infinity; // system clock, the one setTimeout runs on
  let nudgeTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const run = async () => {
    try {
      const { rows } = await deps.db.query(glowSql(), [now()]);
      const message = GlowMessage.parse({ sites: rows.map((r) => ({ siteId: r.site_id, glow: r.glow })) });
      deps.emit(message);
      latest = message;
    } catch (err) {
      // A failed tick is normal: db:reset drops the view under a running API.
      console.error(`glow tick failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!deps.emitLamps) return;
    try {
      const { rows } = await deps.db.query(LAMPS_SQL);
      const message = toLampsMessage(rows);
      deps.emitLamps(message);
      latestLamps = message;
      const prev = prevLit;
      prevLit = message.litToday;
      if (deps.emitFinale && prev !== null && prev < LAMP_TARGET && message.litToday >= LAMP_TARGET) {
        try {
          deps.emitFinale({ startAt: now().getTime() + FINALE_LEAD_MS });
        } catch (err) {
          console.error(`finale emit failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      console.error(`lamps tick failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const tick = () => {
    if (stopped) return Promise.resolve();
    if (!running) {
      lastStart = Date.now();
      running = run().finally(() => {
        running = null;
      });
    }
    return running;
  };

  const nudge = () => {
    if (stopped || nudgeTimer) return;
    nudgeTimer = setTimeout(() => {
      nudgeTimer = null;
      void tick();
    }, Math.max(0, NUDGE_MIN_GAP_MS - (Date.now() - lastStart)));
  };

  void tick();
  const interval = setInterval(() => void tick(), deps.intervalMs ?? GLOW_INTERVAL_MS);

  return {
    tick,
    nudge,
    latest: () => latest,
    latestLamps: () => latestLamps,
    stop: () => {
      stopped = true;
      clearInterval(interval);
      if (nudgeTimer) clearTimeout(nudgeTimer);
      nudgeTimer = null;
    },
  };
}

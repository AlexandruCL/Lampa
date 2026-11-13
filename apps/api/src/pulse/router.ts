import { PulseLanguages, PulseSummary, sites } from "@lampa/shared";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { Db, LatestGlow } from "../seam.js";
import {
  CANDLES_SQL, COLOUR_CLOCK_SQL, INTERACTIONS_SQL, LANGUAGES_SQL, SUMMARY_SQL,
  toCandles, toColourClock, toInteractions,
} from "./queries.js";

export const PULSE_CACHE_MS = 5000;

const colourSiteIds = sites.filter((s) => !s.is_memorial).map((s) => s.id);

export function createPulseRouter(deps: { db?: Db; latestGlow: LatestGlow; now?: () => Date }): Router {
  const router = Router();
  const now = deps.now ?? (() => new Date());

  // One route: its own limiter and its own cache, so a query runs at most once per PULSE_CACHE_MS.
  const endpoint = (name: string, build: (db: Db) => Promise<unknown>) => {
    let body: unknown;
    let at = 0;
    let pending: Promise<unknown> | undefined;
    // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
    const limiter = rateLimit({ windowMs: 60_000, limit: 120 });
    router.get(`/pulse/${name}`, limiter, async (_req, res) => {
      const db = deps.db;
      if (!db) return void res.status(503).json({ error: "unavailable" });
      try {
        if (body === undefined || now().getTime() - at >= PULSE_CACHE_MS) {
          pending ??= build(db)
            .then((b) => {
              body = b;
              at = now().getTime();
              return b;
            })
            .finally(() => {
              pending = undefined;
            });
          await pending;
        }
        res.set("Cache-Control", "public, max-age=5").json(body);
      } catch (err) {
        console.error(`pulse ${name} failed: ` + (err instanceof Error ? err.message : String(err)));
        res.status(503).json({ error: "unavailable" });
      }
    });
  };

  endpoint("summary", async (db) => {
    const { rows } = await db.query(SUMMARY_SQL);
    const latest = deps.latestGlow();
    const glow = sites
      .filter((s) => !s.is_memorial)
      .map((s) => ({ siteId: s.id, glow: latest?.sites.find((g) => g.siteId === s.id)?.glow ?? 0 }));
    const cityGlow = glow.length ? glow.reduce((a, g) => a + g.glow, 0) / glow.length : 0;
    return PulseSummary.parse({
      cityGlow,
      glow,
      lampsToday: rows[0]?.lamps_today ?? 0,
      coloursToday: rows[0]?.colours_today ?? 0,
      visitorsToday: rows[0]?.visitors_today ?? 0,
    });
  });
  endpoint("interactions", async (db) => toInteractions((await db.query(INTERACTIONS_SQL, [colourSiteIds])).rows, colourSiteIds));
  endpoint("colour-clock", async (db) => toColourClock((await db.query(COLOUR_CLOCK_SQL)).rows, now()));
  endpoint("languages", async (db) => PulseLanguages.parse({ languages: (await db.query(LANGUAGES_SQL)).rows }));
  endpoint("candles", async (db) => toCandles((await db.query(CANDLES_SQL)).rows));

  return router;
}

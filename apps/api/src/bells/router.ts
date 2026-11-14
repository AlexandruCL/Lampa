import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { BellIn, type BellMessage, type HarmonyMessage, SocketMessage, sites } from "@lampa/shared";
import { requireVisitor } from "../auth/session.js";
import type { Emit } from "../seam.js";
import { judgeHarmony, pruneRings, type Ring } from "./harmony.js";

export const RINGS_PER_SECOND = 5;
export const CLOCK_TOLERANCE_MS = 2000;

export type BellsDeps = { emit?: Emit; now?: () => number };

export function createBellsRouter(deps: BellsDeps): Router {
  const router = Router();
  // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
  const limiter = rateLimit({ windowMs: 1000, limit: RINGS_PER_SECOND, keyGenerator: (req) => req.visitor!.sub });
  // shortcut: rings are kept in memory in one API process, it breaks with two API instances; move to the database then
  const squares = new Map<string, { rings: Ring[]; lastHarmony: number }>();

  router.post("/bells/ring", requireVisitor, limiter, (req, res) => {
    const parsed = BellIn.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    const { siteId, tower } = parsed.data;
    // Only the seeded sites, so a made-up id cannot grow the map.
    if (!sites.some((s) => s.id === siteId)) return void res.status(404).json({ error: "unknown_site" });
    const now = (deps.now ?? Date.now)();
    const at = Math.abs(parsed.data.at - now) > CLOCK_TOLERANCE_MS ? now : parsed.data.at;
    const square = squares.get(siteId) ?? { rings: [], lastHarmony: -Infinity };
    squares.set(siteId, square);
    square.rings = [...pruneRings(square.rings, now), { tower, at }];
    const harmony = judgeHarmony(square.rings, now, square.lastHarmony);
    if (harmony) square.lastHarmony = now;
    res.status(204).end();
    try {
      deps.emit?.(`site:${siteId}`, SocketMessage.enum.bell, { siteId, tower, at } satisfies BellMessage);
      if (harmony) {
        const message: HarmonyMessage = { siteId, at: now };
        deps.emit?.(`site:${siteId}`, SocketMessage.enum.harmony, message);
        deps.emit?.("screen", SocketMessage.enum.harmony, message);
      }
    } catch (err) {
      console.error("bell emit failed: " + (err instanceof Error ? err.message : "unknown"));
    }
  });
  return router;
}

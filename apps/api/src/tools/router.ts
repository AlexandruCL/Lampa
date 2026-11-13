import { timingSafeEqual } from "node:crypto";
import { sites } from "@lampa/shared";
import { Router } from "express";
import { z } from "zod";
import type { SiteStats } from "../agent/session.js";
import type { Db } from "../seam.js";

// $1 is the site id. Never the audio, never the author.
export const RECENT_ECHO_SQL = `SELECT transcript, lang, created_at FROM echoes
  WHERE site_id = $1 AND status = 'approved' AND transcript IS NOT NULL
  ORDER BY created_at DESC LIMIT 1`;

const Body = z.object({ site_id: z.string() });

function secretMatches(given: string | undefined, secret: string): boolean {
  if (given === undefined) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createToolsRouter(deps: { db?: Db; getSiteStats?: (siteId: string) => Promise<SiteStats> }): Router {
  const router = Router();

  router.use("/tools", (req, res, next) => {
    const secret = process.env.AGENT_TOOL_SECRET; // read per request so tests can set it
    if (!secret) {
      res.status(503).json({ error: "unavailable" });
      return;
    }
    if (!secretMatches(req.get("X-Agent-Secret"), secret)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  });

  // Validates the body; answers and returns null on failure.
  const siteIdOf = (req: any, res: any): string | null => {
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_body" });
      return null;
    }
    const id = parsed.data.site_id;
    if (!sites.some((s) => s.id === id && !s.is_memorial)) {
      res.status(404).json({ error: "unknown_site" });
      return null;
    }
    return id;
  };

  const unavailable = (res: any, err: unknown) => {
    console.error(`tools failed: ${err instanceof Error ? err.message : String(err)}`);
    res.status(503).json({ error: "unavailable" });
  };

  router.post("/tools/get_site_stats", async (req, res) => {
    const siteId = siteIdOf(req, res);
    if (siteId === null) return;
    if (!deps.getSiteStats) {
      res.status(503).json({ error: "unavailable" });
      return;
    }
    try {
      const s = await deps.getSiteStats(siteId);
      res.json({ glow: s.glow, colours_today: s.coloursToday, lamps_lit_today: s.lampsToday });
    } catch (err) {
      unavailable(res, err);
    }
  });

  router.post("/tools/get_recent_echo", async (req, res) => {
    const siteId = siteIdOf(req, res);
    if (siteId === null) return;
    if (!deps.db) {
      res.status(503).json({ error: "unavailable" });
      return;
    }
    try {
      const { rows } = await deps.db.query(RECENT_ECHO_SQL, [siteId]);
      const r = rows[0];
      res.json({ echo: r ? { transcript: r.transcript, lang: r.lang, created_at: r.created_at } : null });
    } catch (err) {
      unavailable(res, err);
    }
  });

  return router;
}

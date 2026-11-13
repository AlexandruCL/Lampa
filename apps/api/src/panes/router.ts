import { Router } from "express";
import { PaneAccepted, PaneIn } from "@lampa/shared";
import type { OnPane, Tx } from "../seam.js";
import { requireVisitor, visitorLimiter } from "../auth/session.js";
import { userSub } from "../events/router.js";
import { WEIGHTS } from "../events/weights.js";
import { GALLERY_SITE_ID, PANES_PER_HOUR, RATE_WINDOW_MS, WINDOW_SLOTS, lowestEmptySlot, paneAuthor, paneTs, retryAfterS } from "./slots.js";

export type PanesDeps = { tx?: Tx; onPane?: OnPane; now?: () => Date };

const SITE_OK = `SELECT 1 FROM sites WHERE id = $1 AND status = 'published'
  AND (active_from IS NULL OR active_from <= now()) AND (active_until IS NULL OR active_until > now())
  AND 'colours' = ANY(interactions)`;
const LOCK = `SELECT pg_advisory_xact_lock(hashtext($1))`;
const RECENT = `SELECT count(*)::int AS n, min(p.caught_at) AS oldest FROM panes p JOIN windows w ON w.id = p.window_id
  WHERE w.site_id IS NOT DISTINCT FROM $1 AND coalesce(p.author_sub, p.anon_id) = $2 AND p.caught_at > $3`;
const OPEN_WINDOW = `SELECT id::text AS id FROM windows WHERE site_id IS NOT DISTINCT FROM $1 AND completed_at IS NULL
  ORDER BY started_at DESC LIMIT 1`;
const NEW_WINDOW = `INSERT INTO windows (site_id) VALUES ($1) RETURNING id::text AS id`;
const SLOTS = `SELECT slot FROM panes WHERE window_id = $1`;
const INSERT_PANE = `INSERT INTO panes (window_id, slot, hue, saturation, lightness, hex, author_sub, anon_id, caught_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
const INSERT_READING = `INSERT INTO colour_readings (ts, site_id, session_id, hue, saturation, lightness) VALUES ($1, $2, $3, $4, $5, $6)`;
const INSERT_EVENT = `INSERT INTO interaction_events (ts, session_id, user_sub, site_id, kind, weight) VALUES ($1, $2, $3, $4, 'colour', $5)`;
const COMPLETE = `UPDATE windows SET completed_at = now() WHERE id = $1`;

type Outcome = { status: 404 } | { status: 429; retryAfter: number } | { status: 201; body: PaneAccepted };

export function createPanesRouter(deps: PanesDeps): Router {
  const router = Router();
  router.post("/panes", requireVisitor, visitorLimiter, async (req, res) => {
    const parsed = PaneIn.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    if (!deps.tx) return void res.status(503).json({ error: "unavailable" });
    const pane = parsed.data;
    const visitor = req.visitor!;
    const now = (deps.now ?? (() => new Date()))();
    const ts = paneTs(pane.at, now);
    const gallery = pane.siteId === GALLERY_SITE_ID;
    const site = gallery ? null : pane.siteId;
    let out: Outcome;
    try {
      out = await deps.tx(async (db): Promise<Outcome> => {
        if (site && (await db.query(SITE_OK, [site])).rows.length === 0) return { status: 404 };
        await db.query(LOCK, ["panes:" + pane.siteId]);
        const recent = (await db.query(RECENT, [site, visitor.sub, new Date(now.getTime() - RATE_WINDOW_MS)])).rows[0];
        if (recent && recent.n >= PANES_PER_HOUR)
          return { status: 429, retryAfter: retryAfterS(new Date(recent.oldest), now) };
        const open = (await db.query(OPEN_WINDOW, [site])).rows[0];
        const windowId: string = open ? open.id : (await db.query(NEW_WINDOW, [site])).rows[0].id;
        const filled: number[] = (await db.query(SLOTS, [windowId])).rows.map((r) => r.slot);
        const slot = lowestEmptySlot(filled);
        if (slot === null) throw new Error("open window is full");
        const { author_sub, anon_id } = paneAuthor(visitor);
        await db.query(INSERT_PANE, [windowId, slot, pane.hue, pane.saturation, pane.lightness, pane.hex, author_sub, anon_id, ts]);
        await db.query(INSERT_READING, [ts, pane.siteId, visitor.sub, pane.hue, pane.saturation, pane.lightness]);
        if (site) await db.query(INSERT_EVENT, [ts, visitor.sub, userSub(visitor), site, WEIGHTS.colour]);
        const count = filled.length + 1;
        const completed = count === WINDOW_SLOTS;
        if (completed) await db.query(COMPLETE, [windowId]);
        return { status: 201, body: PaneAccepted.parse({ windowId, slot, count, completed }) };
      });
    } catch (err) {
      console.error("panes insert failed: " + (err instanceof Error ? err.message : "unknown"));
      return void res.status(503).json({ error: "unavailable" });
    }
    if (out.status === 404) return void res.status(404).json({ error: "unknown_site" });
    if (out.status === 429) {
      res.set("Retry-After", String(out.retryAfter));
      return void res.status(429).json({ error: "rate_limited" });
    }
    res.status(201).json(out.body);
    try {
      deps.onPane?.({ siteId: pane.siteId, windowId: out.body.windowId, slot: out.body.slot, hex: pane.hex, bin: pane.bin }, out.body.completed);
    } catch (err) {
      console.error("onPane failed: " + (err instanceof Error ? err.message : "unknown"));
    }
  });
  return router;
}

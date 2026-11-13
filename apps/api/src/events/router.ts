import { Router } from "express";
import { EventBatch, EventsAccepted, type EventKind } from "@lampa/shared";
import type { Db } from "../seam.js";
import { requireVisitor, visitorLimiter, type Visitor } from "../auth/session.js";
import { CLIENT_KINDS, WEIGHTS } from "./weights.js";

export const MAX_EVENT_AGE_MS = 600_000;

export const INSERT_EVENTS = `INSERT INTO interaction_events (ts, session_id, user_sub, site_id, kind, weight)
SELECT e.ts, $1::text, $2::text, e.site_id, e.kind, e.weight
FROM unnest($3::timestamptz[], $4::text[], $5::text[], $6::real[]) AS e(ts, site_id, kind, weight)
JOIN sites s ON s.id = e.site_id`;

export function toRows(batch: EventBatch, now: Date): { ts: string; siteId: string; kind: EventKind; weight: number }[] {
  return batch.events
    .filter((e) => CLIENT_KINDS.includes(e.kind))
    .map((e) => {
      const at = Date.parse(e.at);
      const fresh = at >= now.getTime() - MAX_EVENT_AGE_MS && at <= now.getTime();
      return { ts: fresh ? e.at : now.toISOString(), siteId: e.siteId, kind: e.kind, weight: WEIGHTS[e.kind] };
    });
}

export const userSub = (visitor: Visitor): string | null => (visitor.kind === "auth0" ? visitor.sub : null);

export function createEventsRouter(deps: { db?: Db; onStored?: () => void; now?: () => Date }): Router {
  const router = Router();
  router.post("/events", requireVisitor, visitorLimiter, async (req, res) => {
    const parsed = EventBatch.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const rows = toRows(parsed.data, (deps.now ?? (() => new Date()))());
    if (rows.length === 0) return void res.status(202).json({ accepted: 0 });
    try {
      const visitor = req.visitor!;
      const result = await deps.db.query(INSERT_EVENTS, [
        visitor.sub,
        userSub(visitor),
        rows.map((r) => r.ts),
        rows.map((r) => r.siteId),
        rows.map((r) => r.kind),
        rows.map((r) => r.weight),
      ]);
      const accepted = result.rowCount ?? 0;
      if (accepted > 0) deps.onStored?.();
      res.status(202).json(EventsAccepted.parse({ accepted }));
    } catch (err) {
      console.error("events insert failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}

import { Router } from "express";
import { CandleMessage, EventBatch, EventsAccepted, type EventKind } from "@lampa/shared";
import { candleId } from "./candles.js";
import { capTalkTurns, TALK_COUNT_SQL, TALK_WINDOW_MS } from "./talk.js";
import type { Db, OnEventsStored } from "../seam.js";
import { requireVisitor, visitorLimiter, type Visitor } from "../auth/session.js";
import { CLIENT_KINDS, WEIGHTS } from "./weights.js";

export const MAX_EVENT_AGE_MS = 600_000;

export const INSERT_EVENTS = `INSERT INTO interaction_events (ts, session_id, user_sub, site_id, kind, weight)
SELECT e.ts, $1::text, $2::text, e.site_id, e.kind, e.weight
FROM unnest($3::timestamptz[], $4::text[], $5::text[], $6::real[]) AS e(ts, site_id, kind, weight)
JOIN sites s ON s.id = e.site_id
WHERE NOT (e.kind = 'lamp' AND s.is_memorial) AND NOT (e.kind = 'candle' AND NOT s.is_memorial)
RETURNING ts, site_id, kind`;

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

export function createEventsRouter(deps: { db?: Db; onStored?: OnEventsStored; now?: () => Date }): Router {
  const router = Router();
  router.post("/events", requireVisitor, visitorLimiter, async (req, res) => {
    const parsed = EventBatch.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const now = (deps.now ?? (() => new Date()))();
    let rows = toRows(parsed.data, now);
    if (rows.length === 0) return void res.status(202).json({ accepted: 0 });
    try {
      const visitor = req.visitor!;
      if (rows.some((r) => r.kind === "talk_turn")) {
        const c = await deps.db.query(TALK_COUNT_SQL, [visitor.sub, new Date(now.getTime() - TALK_WINDOW_MS).toISOString()]);
        rows = capTalkTurns(rows, new Map(c.rows.map((r) => [r.site_id as string, r.n as number])));
        if (rows.length === 0) return void res.status(202).json({ accepted: 0 });
      }
      const result = await deps.db.query(INSERT_EVENTS, [
        visitor.sub,
        userSub(visitor),
        rows.map((r) => r.ts),
        rows.map((r) => r.siteId),
        rows.map((r) => r.kind),
        rows.map((r) => r.weight),
      ]);
      const accepted = result.rowCount ?? 0;
      res.status(202).json(EventsAccepted.parse({ accepted }));
      if (accepted > 0) {
        try {
          const candles = result.rows
            .filter((r) => r.kind === "candle")
            .map((r) => CandleMessage.parse({ id: candleId(r.ts, visitor.sub), siteId: r.site_id, litAt: r.ts.toISOString() }));
          deps.onStored?.(candles);
        } catch (err) {
          console.error("events onStored failed: " + (err instanceof Error ? err.message : "unknown"));
        }
      }
    } catch (err) {
      console.error("events insert failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}

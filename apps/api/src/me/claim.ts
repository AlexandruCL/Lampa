import { Router } from "express";
import { ClaimIn, ClaimResult } from "@lampa/shared";
import type { Tx } from "../seam.js";
import { requireVisitor, verifyAnon, visitorLimiter } from "../auth/session.js";

// $1 the anonymous sub, $2 the Auth0 sub. session_id is never rewritten, so aggregates and unique-visitor counts stay as they were.
export const CLAIM_PANES = "UPDATE panes SET author_sub = $2 WHERE anon_id = $1 AND author_sub IS NULL";
export const CLAIM_ECHOES = "UPDATE echoes SET author_sub = $2 WHERE anon_id = $1 AND author_sub IS NULL";
export const CLAIM_EVENTS = "UPDATE interaction_events SET user_sub = $2 WHERE session_id = $1 AND user_sub IS NULL";

export function createClaimRouter(deps: { tx?: Tx }): Router {
  const router = Router();
  router.post("/me/claim", requireVisitor, visitorLimiter, async (req, res) => {
    const visitor = req.visitor!;
    if (visitor.kind !== "auth0") return void res.status(403).json({ error: "forbidden" });
    const parsed = ClaimIn.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_body" });
    const anonSub = await verifyAnon(parsed.data.anonToken);
    if (!anonSub) return void res.status(400).json({ error: "invalid_anon_token" });
    if (!deps.tx) return void res.status(503).json({ error: "unavailable" });
    try {
      const counts = await deps.tx(async (db) => {
        const params = [anonSub, visitor.sub];
        const panes = (await db.query(CLAIM_PANES, params)).rowCount ?? 0;
        const echoes = (await db.query(CLAIM_ECHOES, params)).rowCount ?? 0;
        const events = (await db.query(CLAIM_EVENTS, params)).rowCount ?? 0;
        return { panes, echoes, events };
      });
      res.json(ClaimResult.parse(counts));
    } catch (err) {
      console.error("claim failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });
  return router;
}

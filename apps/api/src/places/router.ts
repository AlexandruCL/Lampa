import { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { PLACE_ID, PlaceDraft, PlaceIn, placeId } from "@lampa/shared";
import type { Db, OnEventsStored, Tx } from "../seam.js";
import { requireVisitor } from "../auth/session.js";
import { UPSERT_SITE, siteParams, toSiteRow } from "../db/seed.js";
import { PLACE_LIMIT, PLACE_WINDOW_MS, placeSiteFile } from "./content.js";

// UPSERT_SITE with status 'draft'; a published or seeded id returns no row.
export const UPSERT_DRAFT = UPSERT_SITE.replace("'published'", "'draft'") + "\nWHERE sites.status = 'draft' RETURNING id";

const writeSiteOnly: RequestHandler = (req, res, next) =>
  req.visitor!.permissions.includes("write:site") ? next() : void res.status(403).json({ error: "forbidden" });

export type PlacesDeps = { db?: Db; tx?: Tx; onStored?: OnEventsStored; fetch?: typeof fetch };

export function createPlacesRouter(deps: PlacesDeps): Router {
  const router = Router();
  // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
  const placeLimiter = rateLimit({
    windowMs: PLACE_WINDOW_MS,
    limit: PLACE_LIMIT,
    keyGenerator: (req) => req.visitor!.sub,
    message: { error: "rate_limited" },
  });

  router.post("/sites", requireVisitor, writeSiteOnly, placeLimiter, async (req, res) => {
    const parsed = PlaceIn.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_place" });
    const place = parsed.data;
    const id = placeId(place.name.en);
    if (!PLACE_ID.test(id)) return void res.status(400).json({ error: "invalid_id" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });

    try {
      const { rows } = await deps.db.query(UPSERT_DRAFT, siteParams(toSiteRow(placeSiteFile(id, place))));
      if (!rows[0]) return void res.status(409).json({ error: "site_exists" });
      res.status(201).json(PlaceDraft.parse({ id, status: "draft" }));
    } catch (err) {
      const { code, constraint } = err as { code?: string; constraint?: string };
      if (code === "23505" && constraint === "sites_slug_key") return void res.status(409).json({ error: "site_exists" });
      console.error("place insert failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });

  return router;
}

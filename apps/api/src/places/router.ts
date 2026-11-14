import { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { PLACE_ID, PlaceDraft, PlaceIn, PublishIn, PublishOut, placeId } from "@lampa/shared";
import type { Db, OnEventsStored, Tx } from "../seam.js";
import { requireVisitor } from "../auth/session.js";
import { UPSERT_SITE, siteParams, toSiteRow } from "../db/seed.js";
import { PLACE_LIMIT, PLACE_WINDOW_MS, placeSiteFile } from "./content.js";
import { runStep } from "./publish.js";

// UPSERT_SITE with status 'draft'; a published or seeded id returns no row.
export const UPSERT_DRAFT = UPSERT_SITE.replace("'published'", "'draft'") + "\nWHERE sites.status = 'draft' RETURNING id";
export const SELECT_PLACE = `SELECT id, name, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, interactions, persona, facts, status
FROM sites WHERE id = $1`;
export const PUBLISH_DRAFT = "UPDATE sites SET status = 'published' WHERE id = $1 AND status = 'draft'";

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

  router.post("/sites/:id/publish", requireVisitor, writeSiteOnly, async (req, res) => {
    const parsed = PublishIn.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: "invalid_step" });
    const { step } = parsed.data;
    const id = req.params.id as string;
    if (!PLACE_ID.test(id)) return void res.status(404).json({ error: "unknown_site" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const db = deps.db;

    try {
      const row = (await db.query(SELECT_PLACE, [id])).rows[0];
      if (!row) return void res.status(404).json({ error: "unknown_site" });
      if (row.status === "published") return void res.status(409).json({ error: "already_published" });

      if (step === "live") {
        await db.query(PUBLISH_DRAFT, [id]);
        deps.onStored?.();
        return void res.json(PublishOut.parse({ step, credits: 0 }));
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) return void res.status(503).json({ error: "unavailable" });
      const site = placeSiteFile(id, {
        name: row.name, lat: row.lat, lng: row.lng, facts: row.facts, persona: row.persona.traits, interactions: row.interactions,
      });
      const result = await runStep({ db, fetch: deps.fetch ?? fetch, apiKey }, site, step);
      if (result.outcome === "over_cap") return void res.status(409).json({ error: "over_cap" });
      if (result.outcome !== "done") {
        console.error(`place publish failed: ${result.failed?.file ?? "unknown"} ${result.failed?.status ?? result.outcome}`);
        return void res.status(502).json({ error: "generation_failed" });
      }
      res.json(PublishOut.parse({ step, credits: result.newCredits }));
    } catch (err) {
      console.error("place publish failed: " + (err instanceof Error ? err.message : "unknown"));
      res.status(503).json({ error: "unavailable" });
    }
  });

  return router;
}

import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { NearbySites, SiteDetail } from "@lampa/shared";
import type { Db, LatestGlow } from "../seam.js";

export const NEAR_SQL = `SELECT id, name, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, is_memorial,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::float8 AS distance_m
FROM sites
WHERE status = 'published'
  AND (active_from IS NULL OR active_from <= now()) AND (active_until IS NULL OR active_until > now())
  AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 2000)
ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
LIMIT 5`;

export const SITE_SQL = `SELECT id, name, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, is_memorial,
       radius_m, interactions, facts, directions_hint,
       (SELECT key FROM blobs WHERE starts_with(key, 'site-' || sites.id || '_bed-1-') ORDER BY key LIMIT 1) AS bed_key
FROM sites
WHERE id = $1 AND status = 'published'`;

export function parseNear(text: unknown): { lat: number; lng: number } | null {
  if (typeof text !== "string") return null;
  const parts = text.split(",");
  if (parts.length !== 2 || parts.some((p) => p.trim() === "")) return null;
  const [lat, lng] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
const sitesLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

export function createSitesRouter(deps: { db?: Db; latestGlow: LatestGlow }): Router {
  const router = Router();
  const glowOf = (id: string) => deps.latestGlow()?.sites.find((s) => s.siteId === id)?.glow ?? 0;
  const run = async (db: Db, sql: string, params: unknown[]) => {
    try {
      return (await db.query(sql, params)).rows;
    } catch (err) {
      console.error("sites query failed: " + (err instanceof Error ? err.message : String(err)));
      return null;
    }
  };

  router.get("/sites", sitesLimiter, async (req, res) => {
    const near = parseNear(req.query.near);
    if (!near) return void res.status(400).json({ error: "invalid_near" });
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const rows = await run(deps.db, NEAR_SQL, [near.lng, near.lat]);
    if (!rows) return void res.status(503).json({ error: "unavailable" });
    const sites = rows.map((r) => ({
      id: r.id, name: r.name.en, lat: r.lat, lng: r.lng, is_memorial: r.is_memorial,
      distance_m: r.distance_m, glow: glowOf(r.id),
    }));
    res.json(NearbySites.parse({ sites }));
  });

  router.get("/sites/:id", sitesLimiter, async (req, res) => {
    if (!deps.db) return void res.status(503).json({ error: "unavailable" });
    const rows = await run(deps.db, SITE_SQL, [req.params.id]);
    if (!rows) return void res.status(503).json({ error: "unavailable" });
    const r = rows[0];
    if (!r) return void res.status(404).json({ error: "unknown_site" });
    const lang = req.query.lang === "ro" ? "ro" : "en";
    res.json(SiteDetail.parse({
      id: r.id, name: r.name[lang], lat: r.lat, lng: r.lng, is_memorial: r.is_memorial,
      radius_m: r.radius_m, interactions: r.interactions, facts: r.facts,
      directions_hint: r.directions_hint?.[lang] ?? r.directions_hint?.en ?? "",
      glow: glowOf(r.id),
      // Take 1 of the bed that publishing stored in blobs; the bundled sites have none there.
      ...(r.bed_key ? { bed: "/blob/" + r.bed_key } : {}),
    }));
  });

  return router;
}

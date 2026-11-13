import type { Site } from "@lampa/shared";
import { parse } from "yaml";
import { z } from "zod";

export const SiteFile = z.looseObject({
  id: z.string().min(1),
  city: z.string(),
  name: z.object({ ro: z.string(), en: z.string() }),
  location: z.object({ lat: z.number(), lng: z.number() }),
  radius_m: z.number().positive(),
  interactions: z.array(z.string()),
  is_memorial: z.boolean().default(false),
  glow_k: z.number().positive(),
  persona: z.record(z.string(), z.unknown()).default({}),
  facts: z.array(z.unknown()).default([]),
  sound_bed: z.string().default(""),
  directions_hint: z.record(z.string(), z.string()).default({}),
  active: z
    .object({ from: z.string().nullable(), until: z.string().nullable() })
    .default({ from: null, until: null }),
});
export type SiteFile = z.infer<typeof SiteFile>;

export function parseSiteFile(text: string): SiteFile {
  return SiteFile.parse(parse(text));
}

export type SiteRow = {
  id: string;
  city: string;
  slug: string;
  name: { ro: string; en: string };
  lng: number;
  lat: number;
  radius_m: number;
  interactions: string[];
  persona: Record<string, unknown>;
  facts: unknown[];
  directions_hint: Record<string, string>;
  glow_k: number;
  is_memorial: boolean;
  active_from: string | null;
  active_until: string | null;
};

export function toSiteRow(file: SiteFile): SiteRow {
  return {
    id: file.id,
    city: file.city,
    slug: file.id,
    name: file.name,
    lng: file.location.lng,
    lat: file.location.lat,
    radius_m: file.radius_m,
    interactions: file.interactions,
    persona: file.persona,
    facts: file.facts,
    directions_hint: file.directions_hint,
    glow_k: file.glow_k,
    is_memorial: file.is_memorial,
    active_from: file.active.from,
    active_until: file.active.until,
  };
}

export function toSitesJson(files: SiteFile[]): Site[] {
  return files.map((f) => ({
    id: f.id,
    name: f.name.en,
    lat: f.location.lat,
    lng: f.location.lng,
    is_memorial: f.is_memorial,
  }));
}

export const INSERT_SITE = `INSERT INTO sites (id, city, slug, name, geom, radius_m, interactions, persona, facts,
                   directions_hint, glow_k, is_memorial, active_from, active_until, status)
VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, 'published')`;

const INSERTED = INSERT_SITE.slice(INSERT_SITE.indexOf("(") + 1, INSERT_SITE.indexOf(")"))
  .split(",")
  .map((c) => c.trim())
  .filter((c) => c !== "id");

export const UPSERT_SITE = `${INSERT_SITE}
ON CONFLICT (id) DO UPDATE SET ${INSERTED.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}`;

export function siteParams(row: SiteRow): unknown[] {
  return [
    row.id,
    row.city,
    row.slug,
    JSON.stringify(row.name),
    row.lng,
    row.lat,
    row.radius_m,
    row.interactions,
    JSON.stringify(row.persona),
    JSON.stringify(row.facts),
    JSON.stringify(row.directions_hint),
    row.glow_k,
    row.is_memorial,
    row.active_from,
    row.active_until,
  ];
}

import { GlowMessage, type Site, type SiteDetail } from "@lampa/shared";

const GALLERY_ID = "gallery";

/** The site ids of a glow message that are not in `known`, each once, never `gallery`. */
export function unknownIds(glow: unknown, known: ReadonlySet<string>): string[] {
  const parsed = GlowMessage.safeParse(glow);
  if (!parsed.success) return [];
  return [...new Set(parsed.data.sites.map((s) => s.siteId))].filter((id) => id !== GALLERY_ID && !known.has(id));
}

export const toSite = ({ id, name, lat, lng, is_memorial }: SiteDetail): Site => ({ id, name, lat, lng, is_memorial });

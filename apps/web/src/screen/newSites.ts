import { bridges, GlowMessage, type Site, type SiteDetail } from "@lampa/shared";

const GALLERY_ID = "gallery";

const BRIDGE_IDS = new Set(bridges.map((b) => b.id));

/** The site ids of a glow message that are not in `known`, each once, never `gallery` or a bridge (bridges stay off the screen). */
export function unknownIds(glow: unknown, known: ReadonlySet<string>): string[] {
  const parsed = GlowMessage.safeParse(glow);
  if (!parsed.success) return [];
  return [...new Set(parsed.data.sites.map((s) => s.siteId))].filter((id) => id !== GALLERY_ID && !BRIDGE_IDS.has(id) && !known.has(id));
}

export const toSite = ({ id, name, lat, lng, is_memorial }: SiteDetail): Site => ({ id, name, lat, lng, is_memorial });

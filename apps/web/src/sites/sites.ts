import { bridges, sites, type Site } from "@lampa/shared";

// interactions and bed (the full URL of its sound bed) are set only for a place fetched from GET /sites/:id; the bundled sites leave them out.
// bells: the Dialogue of the Bells, only at Piața Unirii.
export type PhoneSite = Site & { lamp: boolean; bells?: boolean; interactions?: string[]; bed?: string };

export const SITES: PhoneSite[] = sites.map((site) => ({ ...site, lamp: !site.is_memorial, ...(site.id === "unirii" ? { bells: true } : {}) }));

/** The bridges on the Bega, upstream to downstream. A bridge offers only the bottle, so it lists its interactions like a fetched place. */
export const BRIDGES: PhoneSite[] = bridges.map((site) => ({ ...site, lamp: false, interactions: ["bottle"] }));
export const isBridge = (site: PhoneSite): boolean => site.interactions?.includes("bottle") ?? false;

/** Where a phone can arrive: the five sites and the bridges. SITES stays the five, for the sites list and the next-site suggestion. */
export const PLACES: PhoneSite[] = [...SITES, ...BRIDGES];

export function findSite(id: string): PhoneSite | undefined {
  return PLACES.find((s) => s.id === id);
}

import { sites, type Site } from "@lampa/shared";

// interactions and bed (the full URL of its sound bed) are set only for a place fetched from GET /sites/:id; the bundled sites leave them out.
// bells: the Dialogue of the Bells, only at Piața Unirii.
export type PhoneSite = Site & { lamp: boolean; bells?: boolean; interactions?: string[]; bed?: string };

export const SITES: PhoneSite[] = sites.map((site) => ({ ...site, lamp: !site.is_memorial, ...(site.id === "unirii" ? { bells: true } : {}) }));

export function findSite(id: string): PhoneSite | undefined {
  return SITES.find((s) => s.id === id);
}

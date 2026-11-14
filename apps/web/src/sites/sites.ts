import { sites, type Site } from "@lampa/shared";

// interactions and bed (the full URL of its sound bed) are set only for a place fetched from GET /sites/:id; the bundled sites leave them out.
export type PhoneSite = Site & { lamp: boolean; interactions?: string[]; bed?: string };

export const SITES: PhoneSite[] = sites.map((site) => ({ ...site, lamp: !site.is_memorial }));

export function findSite(id: string): PhoneSite | undefined {
  return SITES.find((s) => s.id === id);
}

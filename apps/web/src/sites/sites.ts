import { sites, type Site } from "@lampa/shared";

// interactions is set only for a place fetched from GET /sites/:id; the bundled sites leave it out.
export type PhoneSite = Site & { lamp: boolean; interactions?: string[] };

export const SITES: PhoneSite[] = sites.map((site) => ({ ...site, lamp: !site.is_memorial }));

export function findSite(id: string): PhoneSite | undefined {
  return SITES.find((s) => s.id === id);
}

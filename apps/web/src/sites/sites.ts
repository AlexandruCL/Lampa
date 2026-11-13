import { sites, type Site } from "@lampa/shared";

export type PhoneSite = Site & { lamp: boolean };

export const SITES: PhoneSite[] = sites.map((site) => ({ ...site, lamp: !site.is_memorial }));

export function findSite(id: string): PhoneSite | undefined {
  return SITES.find((s) => s.id === id);
}

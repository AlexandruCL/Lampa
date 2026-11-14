import type { SiteSound } from "@lampa/shared";

/** The sound of places added from /curate, as `GET /sites/:id` gave it, kept for the page. Bundled sites use clips.json. */
const sounds = new Map<string, SiteSound>();

export const registerSiteSound = (siteId: string, sound: SiteSound): void => void sounds.set(siteId, sound);
export const siteSound = (siteId: string): SiteSound | undefined => sounds.get(siteId);

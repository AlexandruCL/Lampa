/** A place added from /curate: `bed` and `greeting` (language → URL) as `GET /sites/:id` gives them, "/blob/<key>" relative to the API. */
export type SiteSound = { bed: string | null; greeting: Record<string, string> };

/** The sound of places added from /curate, kept for the page, so the beacon and the Talk greeting find it. Bundled sites use clips.json. */
const sounds = new Map<string, SiteSound>();

export const registerSiteSound = (siteId: string, sound: SiteSound): void => void sounds.set(siteId, sound);
export const siteSound = (siteId: string): SiteSound | undefined => sounds.get(siteId);

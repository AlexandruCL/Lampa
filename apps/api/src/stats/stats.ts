import type { SiteStats } from "../agent/session.js";
import type { Db, LatestGlow } from "../seam.js";

export function createGetSiteStats(_deps: { db: Db; latestGlow: LatestGlow }): (siteId: string) => Promise<SiteStats> {
  return async () => ({ glow: 0, coloursToday: 0, lampsToday: 0 });
}

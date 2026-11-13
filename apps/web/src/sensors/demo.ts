import { findSite } from "../sites/sites";

/** What `?demo=1` injects in place of the real location and compass (DESIGN.md 7.16). */
export type Demo = { lat: number; lng: number; accuracy: 5; heading: number };

export function isDemo(search: string): boolean {
  return new URLSearchParams(search).get("demo") === "1";
}

/** The route's site wins over `&at=`; an unknown id or none sits on `mx`. `&heading=` is taken mod 360, else 0. */
export function readDemo(search: string, routeSiteId?: string): Demo | null {
  if (!isDemo(search)) return null;
  const q = new URLSearchParams(search);
  const site = findSite(routeSiteId ?? q.get("at") ?? "mx") ?? findSite("mx")!;
  const deg = Number(q.get("heading"));
  return { lat: site.lat, lng: site.lng, accuracy: 5, heading: Number.isFinite(deg) ? ((deg % 360) + 360) % 360 : 0 };
}

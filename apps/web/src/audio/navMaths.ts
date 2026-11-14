import { haversineM, type LatLng } from "../geo/geo";

// Patrick's decisions, hour 24 (B3-3.a.1).
export const COMPASS_SITES = 3;
export const COMPASS_GAIN = 0.25;
export const BEACON_GAIN = 1;
export const FAR_M = 500;
export const NEAR_M = 40;
export const FAR_FACTOR = 0.3;
export const CUTOFF_FAR_HZ = 400;
export const CUTOFF_NEAR_HZ = 8000;
export const SMOOTH_S = 0.1;
export const MEMORIAL_FADE_S = 3;

/** 0 at FAR_M or more (and for an unknown distance), 1 at NEAR_M or less, linear between. */
function nearness(m: number | null): number {
  if (m === null) return 0;
  return Math.min(1, Math.max(0, (FAR_M - m) / (FAR_M - NEAR_M)));
}

export function distanceFactor(m: number | null): number {
  return FAR_FACTOR + (1 - FAR_FACTOR) * nearness(m);
}

/** Log scale: 400 × 20^t, so each step closer opens the filter by the same musical interval. */
export function cutoffFor(m: number | null): number {
  return CUTOFF_FAR_HZ * (CUTOFF_NEAR_HZ / CUTOFF_FAR_HZ) ** nearness(m);
}

/** Concept 7.6: the site's angle relative to where the phone faces, on the unit circle around the listener. */
export function pannerPosition(bearing: number | null, heading: number | null): { x: number; z: number } {
  if (bearing === null || heading === null) return { x: 0, z: -1 };
  const rel = ((((bearing - heading + 540) % 360) - 180) * Math.PI) / 180;
  return { x: Math.sin(rel), z: -Math.cos(rel) };
}

/** The COMPASS_SITES nearest sites other than the target, any glow, the memorial included. */
export function compassSites<S extends LatLng & { id: string }>(
  sites: readonly S[],
  position: LatLng | null,
  targetId: string | null,
): S[] {
  if (!position) return [];
  return sites
    .filter((s) => s.id !== targetId)
    .map((site) => ({ site, m: haversineM(position, site) }))
    .sort((a, b) => a.m - b.m)
    .slice(0, COMPASS_SITES)
    .map((e) => e.site);
}

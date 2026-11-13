import { haversineM, type LatLng } from "./geo";

// Concept PDF section 9.7: "Geofence: enter when distance < r + min(accuracy, 30 m);
// exit when distance > r + 25 m; ignore fixes with accuracy > 60 m; a QR scan overrides".
export const SITE_RADIUS_M = 40; // every site (Ionut's decision, hour 1)
export const ENTER_ACCURACY_CAP_M = 30;
export const EXIT_MARGIN_M = 25;
export const MAX_ACCURACY_M = 60;

export type FenceState = { insideId: string | null };
export type Fix = LatLng & { accuracy: number };
type FenceSite = LatLng & { id: string };

/** A QR open of `/s/:siteId` starts inside that site whatever GPS says. */
export function initialFence(qrSiteId?: string): FenceState {
  return { insideId: qrSiteId ?? null };
}

export function stepFence(state: FenceState, fix: Fix, sites: readonly FenceSite[]): FenceState {
  if (fix.accuracy > MAX_ACCURACY_M) return state;

  if (state.insideId !== null) {
    const here = sites.find((s) => s.id === state.insideId);
    // An id missing from `sites` has no position to stay near, so a good fix ends it.
    if (here && haversineM(fix, here) <= SITE_RADIUS_M + EXIT_MARGIN_M) return state;
  }

  // The exit band (over r + 25 m) overlaps the enter band (up to r + 30 m), so the site just left is skipped.
  const enterM = SITE_RADIUS_M + Math.min(fix.accuracy, ENTER_ACCURACY_CAP_M);
  let nearest: { id: string; d: number } | null = null;
  for (const s of sites) {
    if (s.id === state.insideId) continue;
    const d = haversineM(fix, s);
    if (d < enterM && (!nearest || d < nearest.d)) nearest = { id: s.id, d };
  }
  const insideId = nearest?.id ?? null;
  return insideId === state.insideId ? state : { insideId };
}

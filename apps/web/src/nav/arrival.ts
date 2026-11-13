import type { FenceState } from "../geo/geofence";

/** The geofence entered the chosen site, never the site just left (Ionut's decision, hour 7). */
export function hasArrived(fence: FenceState, targetId: string, fromId: string | null): boolean {
  return fence.insideId === targetId && targetId !== fromId;
}

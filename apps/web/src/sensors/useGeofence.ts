import { useState } from "react";
import { initialFence, stepFence, type FenceState, type Fix } from "../geo/geofence";
import { SITES } from "../sites/sites";

/**
 * Each fix goes through stepFence exactly once (it is not idempotent near the exit band),
 * so the state moves during render on a new `position` object, not in an effect StrictMode replays.
 * Callers pass a new object per fix and the same object otherwise.
 */
export function useGeofence(position: Fix | null, qrSiteId?: string): FenceState {
  const [s, setS] = useState(() => ({ qr: qrSiteId, last: position, fence: stepIf(initialFence(qrSiteId), position) }));

  if (s.qr !== qrSiteId) {
    setS({ qr: qrSiteId, last: position, fence: initialFence(qrSiteId) });
  } else if (s.last !== position) {
    setS({ qr: s.qr, last: position, fence: stepIf(s.fence, position) });
  }
  return s.fence;
}

function stepIf(fence: FenceState, position: Fix | null): FenceState {
  return position ? stepFence(fence, position, SITES) : fence;
}

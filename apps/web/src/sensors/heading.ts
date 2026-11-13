import type { Fix } from "../geo/geofence";
import { smoothHeading } from "./useCompass";

// Concept 9.7: "blend with GPS course while walking" (Ionut's decision, hour 7).
export const COURSE_MIN_SPEED_MPS = 1.0;
export const COURSE_MAX_ACCURACY_M = 30;
export const COURSE_WEIGHT = 0.5;

/** The compass heading moved half-way toward the GPS course while the visitor walks; the compass alone otherwise. */
export function blendHeading(compass: number | null, fix: Fix | null): number | null {
  if (!fix || typeof fix.course !== "number") return compass;
  if ((fix.speed ?? 0) < COURSE_MIN_SPEED_MPS || fix.accuracy > COURSE_MAX_ACCURACY_M) return compass;
  // smoothHeading returns the course itself when there is no compass.
  return smoothHeading(compass, fix.course, COURSE_WEIGHT);
}

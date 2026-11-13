import { rgbDistance } from "./picker";
import type { Reading } from "./reading";

/** A colour held this long is caught. */
export const HOLD_MS = 2000;
/** Over this RGB distance from the hold's first reading, the hold breaks. */
export const COLOUR_DISTANCE_MAX = 48;
/** Over this rotation in degrees per second, the hold breaks (Ionut's decision, hour 4). */
export const ROTATION_MAX_DPS = 20;
/** After a break no hold starts for this long: the Ring's reset time, DESIGN.md 6.3 (Ionut's decision, hour 5). */
export const RESET_MS = 200;

export type HoldState = { first: Reading | null; startedAt: number | null; pausedUntil: number | null; caught: boolean };

export const initialHold: HoldState = { first: null, startedAt: null, pausedUntil: null, caught: false };

/** One lens reading through the hold. `rotation` null (no motion data) never breaks a hold; `at` in ms. */
export function stepHold(state: HoldState, input: { reading: Reading; rotation: number | null; at: number }): HoldState {
  const { reading, rotation, at } = input;
  if (state.caught) return state;
  const spinning = rotation !== null && rotation > ROTATION_MAX_DPS;
  if (state.first !== null && state.startedAt !== null) {
    if (spinning || rgbDistance(state.first, reading) > COLOUR_DISTANCE_MAX) {
      return { ...state, first: null, startedAt: null, pausedUntil: at + RESET_MS };
    }
    return at - state.startedAt >= HOLD_MS ? { ...state, caught: true } : state;
  }
  if (spinning || (state.pausedUntil !== null && at < state.pausedUntil)) return state;
  return { first: reading, startedAt: at, pausedUntil: null, caught: false };
}

export function isHolding(state: HoldState): boolean {
  return state.startedAt !== null && !state.caught;
}

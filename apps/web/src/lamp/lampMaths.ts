/** Raise gesture and lamp event timing (Patrick's decisions, hour 24). Pure, so it runs in the node tests. */
export const RAISE_DEG = 60;
export const LOWER_DEG = 40;
export const RAISE_HOLD_MS = 1500;
export const LOWER_HOLD_MS = 500;
export const LAMP_EVENT_MS = 60000;

/** Tilt from flat, 0 to 90, the same whether the phone is raised screen forward or tipped past vertical. */
export function pitchFromBeta(beta: number | null): number | null {
  if (beta === null) return null;
  const b = Math.abs(beta);
  return b > 90 ? 180 - b : b;
}

export type RaiseState = { phase: "down"; aboveSince: number | null } | { phase: "lit"; belowSince: number | null };

export const RAISE_START: RaiseState = { phase: "down", aboveSince: null };

/** A null pitch counts as neither above nor below: it resets the running hold and never changes the phase. */
export function stepRaise(
  state: RaiseState,
  pitch: number | null,
  nowMs: number,
): { state: RaiseState; progress: number } {
  if (state.phase === "down") {
    if (pitch === null || pitch < RAISE_DEG) return { state: { phase: "down", aboveSince: null }, progress: 0 };
    const aboveSince = state.aboveSince === null ? nowMs : state.aboveSince;
    if (nowMs - aboveSince >= RAISE_HOLD_MS) return { state: { phase: "lit", belowSince: null }, progress: 1 };
    return { state: { phase: "down", aboveSince }, progress: (nowMs - aboveSince) / RAISE_HOLD_MS };
  }
  if (pitch === null || pitch >= LOWER_DEG) return { state: { phase: "lit", belowSince: null }, progress: 1 };
  const belowSince = state.belowSince === null ? nowMs : state.belowSince;
  if (nowMs - belowSince >= LOWER_HOLD_MS) return { state: RAISE_START, progress: 0 };
  return { state: { phase: "lit", belowSince }, progress: 1 };
}

/** The next `lamp` event is due once a whole `LAMP_EVENT_MS` has passed for each one already sent. */
export function lampEventDue(litAtMs: number, sentCount: number, nowMs: number): boolean {
  return nowMs - litAtMs >= sentCount * LAMP_EVENT_MS;
}

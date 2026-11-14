// Pure candle stepper: motion-only stillness lights the candle (DESIGN.md 6.22, 7.11).
export const CANDLE_HOLD_MS = 10_000;
export const CANDLE_DEMO_HOLD_MS = 5_000;
export const STILL_MAX_DPS = 5;
export const NO_MOTION_MS = 3_000;
export const CANDLE_TICK_MS = 100;

export type CandleState = { openedAt: number; stillSince: number | null; sawRate: boolean; lit: boolean; fallback: boolean };

export function initialCandle(at: number): CandleState {
  return { openedAt: at, stillSince: null, sawRate: false, lit: false, fallback: false };
}

export function stepCandle(s: CandleState, input: { rate: number | null; at: number; holdMs: number }): CandleState {
  const { rate, at, holdMs } = input;
  if (s.lit || s.fallback) return s;
  if (rate === null && !s.sawRate) return at - s.openedAt >= NO_MOTION_MS ? { ...s, fallback: true } : s;
  // No reading after a rate was seen counts as not still.
  if (rate === null) return { ...s, stillSince: null };
  if (rate < STILL_MAX_DPS) {
    const stillSince = s.stillSince ?? at;
    return { ...s, stillSince, sawRate: true, lit: at - stillSince >= holdMs };
  }
  return { ...s, stillSince: null, sawRate: true };
}

export function candleProgress(s: CandleState, at: number, holdMs: number): number {
  if (s.lit) return 1;
  if (s.stillSince === null) return 0;
  return Math.min(1, Math.max(0, (at - s.stillSince) / holdMs));
}

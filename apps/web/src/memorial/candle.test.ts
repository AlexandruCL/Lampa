import { describe, expect, it } from "vitest";
import {
  CANDLE_DEMO_HOLD_MS,
  CANDLE_HOLD_MS,
  CANDLE_TICK_MS,
  type CandleState,
  candleProgress,
  initialCandle,
  stepCandle,
} from "./candle";

// Feed one rate every tick from `from` to `to` inclusive.
function run(s: CandleState, rate: number | null, from: number, to: number, holdMs = CANDLE_HOLD_MS): CandleState {
  for (let at = from; at <= to; at += CANDLE_TICK_MS) s = stepCandle(s, { rate, at, holdMs });
  return s;
}

describe("stepCandle", () => {
  it("still for 10 s lights the candle", () => {
    expect(run(initialCandle(0), 1, 0, 10_000).lit).toBe(true);
  });

  it("still for 9.9 s does not", () => {
    expect(run(initialCandle(0), 1, 0, 9_900).lit).toBe(false);
  });

  it("5 s is enough with the demo hold", () => {
    expect(run(initialCandle(0), 1, 0, 4_900, CANDLE_DEMO_HOLD_MS).lit).toBe(false);
    expect(run(initialCandle(0), 1, 0, 5_000, CANDLE_DEMO_HOLD_MS).lit).toBe(true);
  });

  it("a rate of exactly 5 deg/s counts as moving", () => {
    const s = run(initialCandle(0), 5, 0, 20_000);
    expect(s.lit).toBe(false);
    expect(s.stillSince).toBeNull();
    expect(s.sawRate).toBe(true);
  });

  it("moving resets the hold to zero", () => {
    let s = run(initialCandle(0), 1, 0, 9_000);
    s = stepCandle(s, { rate: 30, at: 9_100, holdMs: CANDLE_HOLD_MS });
    expect(s.stillSince).toBeNull();
    s = run(s, 1, 9_200, 19_100);
    expect(s.lit).toBe(false);
    s = stepCandle(s, { rate: 1, at: 19_200, holdMs: CANDLE_HOLD_MS });
    expect(s.lit).toBe(true);
  });

  it("no rate for 3 s shows the fallback", () => {
    const s = run(initialCandle(1_000), null, 1_000, 4_000);
    expect(s.fallback).toBe(true);
    expect(s.lit).toBe(false);
  });

  it("no rate for 2.9 s does not", () => {
    expect(run(initialCandle(1_000), null, 1_000, 3_900).fallback).toBe(false);
  });

  it("a rate seen before 3 s means no fallback later", () => {
    let s = run(initialCandle(0), null, 0, 2_800);
    s = stepCandle(s, { rate: 1, at: 2_900, holdMs: CANDLE_HOLD_MS });
    s = run(s, null, 3_000, 10_000);
    expect(s.fallback).toBe(false);
  });

  it("a null after a rate resets the hold", () => {
    let s = run(initialCandle(0), 1, 0, 9_000);
    s = stepCandle(s, { rate: null, at: 9_100, holdMs: CANDLE_HOLD_MS });
    expect(s.stillSince).toBeNull();
    s = run(s, 1, 9_200, 10_000);
    expect(s.lit).toBe(false);
  });

  it("a lit candle stays lit when the phone moves", () => {
    const lit = run(initialCandle(0), 1, 0, 10_000);
    expect(lit.lit).toBe(true);
    expect(stepCandle(lit, { rate: 90, at: 10_100, holdMs: CANDLE_HOLD_MS })).toBe(lit);
    expect(stepCandle(lit, { rate: null, at: 10_200, holdMs: CANDLE_HOLD_MS })).toBe(lit);
  });
});

describe("candleProgress", () => {
  it("progress is 0 when not still, half after 5 of 10 s, 1 when lit", () => {
    const fresh = initialCandle(0);
    expect(candleProgress(fresh, 5_000, CANDLE_HOLD_MS)).toBe(0);
    const still = run(fresh, 1, 0, 5_000);
    expect(candleProgress(still, 5_000, CANDLE_HOLD_MS)).toBe(0.5);
    const lit = run(still, 1, 5_100, 10_000);
    expect(candleProgress(lit, 10_000, CANDLE_HOLD_MS)).toBe(1);
    expect(candleProgress(still, 20_000, CANDLE_HOLD_MS)).toBe(1);
  });
});

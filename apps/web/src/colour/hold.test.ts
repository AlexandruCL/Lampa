import { describe, expect, it } from "vitest";
import { initialHold, isHolding, stepHold, type HoldState } from "./hold";
import type { Reading } from "./reading";

/** A reading where only r, g, b matter to the hold. */
const rgb = (r: number, g: number, b: number, bin: number | null = 0): Reading => ({
  r, g, b, hex: "#000000", hue: 0, saturation: 1, lightness: 0.5, bin,
});

const BASE = rgb(200, 40, 40);
const AT_48 = rgb(248, 40, 40); // distance exactly 48
const AT_49 = rgb(249, 40, 40); // distance 49

/** Feeds [reading, rotation, at] steps through stepHold from `state`. */
function run(state: HoldState, ...steps: [Reading, number | null, number][]): HoldState {
  return steps.reduce((s, [reading, rotation, at]) => stepHold(s, { reading, rotation, at }), state);
}

describe("stepHold", () => {
  it("the first steady reading starts a hold", () => {
    const s = run(initialHold, [BASE, 5, 1000]);
    expect(s).toEqual({ first: BASE, startedAt: 1000, pausedUntil: null, caught: false });
    expect(isHolding(s)).toBe(true);
    expect(isHolding(initialHold)).toBe(false);
  });

  it("readings within distance 48 for 2000 ms catch the first reading", () => {
    const s = run(initialHold, [BASE, 0, 0], [AT_48, 0, 1000], [AT_48, 0, 2000]);
    expect(s.caught).toBe(true);
    expect(s.first).toBe(BASE);
    expect(isHolding(s)).toBe(false);
  });

  it("1999 ms is not caught", () => {
    const s = run(initialHold, [BASE, 0, 0], [BASE, 0, 1999]);
    expect(s.caught).toBe(false);
    expect(isHolding(s)).toBe(true);
  });

  it("a reading at distance over 48 breaks the hold and does not start one", () => {
    const s = run(initialHold, [BASE, 0, 0], [AT_49, 0, 500]);
    expect(s).toEqual({ first: null, startedAt: null, pausedUntil: 700, caught: false });
    expect(isHolding(s)).toBe(false);
  });

  it("no hold starts within 200 ms of a break and the first reading after it starts one", () => {
    const broken = run(initialHold, [BASE, 0, 0], [AT_49, 0, 500]);
    const waiting = run(broken, [AT_49, 0, 699]);
    expect(waiting).toBe(broken);
    expect(run(waiting, [AT_49, 0, 700])).toEqual({ first: AT_49, startedAt: 700, pausedUntil: null, caught: false });
  });

  it("a reading at distance exactly 48 keeps the hold", () => {
    const s = run(initialHold, [BASE, 0, 0], [AT_48, 0, 500]);
    expect(s).toEqual({ first: BASE, startedAt: 0, pausedUntil: null, caught: false });
  });

  it("rotation over 20 degrees per second breaks the hold and nothing starts until it drops", () => {
    const broken = run(initialHold, [BASE, 0, 0], [BASE, 20.1, 500]);
    expect(broken).toEqual({ first: null, startedAt: null, pausedUntil: 700, caught: false });
    const spinning = run(broken, [BASE, 30, 900], [BASE, 25, 1500]);
    expect(spinning).toBe(broken);
    expect(run(spinning, [BASE, 10, 1600])).toEqual({ first: BASE, startedAt: 1600, pausedUntil: null, caught: false });
    expect(run(initialHold, [BASE, 21, 0])).toBe(initialHold);
  });

  it("rotation exactly 20 keeps the hold", () => {
    const s = run(initialHold, [BASE, 20, 0], [BASE, 20, 1000], [BASE, 20, 2000]);
    expect(s.caught).toBe(true);
    expect(s.first).toBe(BASE);
  });

  it("null rotation lets colour distance alone decide", () => {
    expect(run(initialHold, [BASE, null, 0], [AT_48, null, 2000])).toMatchObject({ first: BASE, caught: true });
    expect(run(initialHold, [BASE, null, 0], [AT_49, null, 1000])).toMatchObject({ first: null, pausedUntil: 1200 });
  });

  it("a caught state ignores later readings", () => {
    const caught = run(initialHold, [BASE, 0, 0], [BASE, 0, 2000]);
    expect(run(caught, [AT_49, 0, 2100], [BASE, 90, 2200], [rgb(0, 0, 0, null), null, 5000])).toBe(caught);
  });

  it("night glass can be caught", () => {
    const night = rgb(12, 12, 14, null);
    const s = run(initialHold, [night, null, 0], [night, null, 2000]);
    expect(s.caught).toBe(true);
    expect(s.first).toBe(night);
  });
});

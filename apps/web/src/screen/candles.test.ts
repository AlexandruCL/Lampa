import { expect, it } from "vitest";
import {
  CANDLE_MAX,
  CANDLE_SPREAD,
  CANDLE_TAU_MS,
  applyCandle,
  applyCandleState,
  candleAlpha,
  candleDecay,
  candlePosition,
} from "./candles";

const NOW = Date.parse("2026-11-13T20:00:00Z");
const msg = (id: string, ageMs = 0, siteId = "cathedral") => ({
  id,
  siteId,
  litAt: new Date(NOW - ageMs).toISOString(),
});

it("decay is 1 at lighting and about 0.37 after six hours", () => {
  expect(candleDecay(NOW, NOW)).toBe(1);
  expect(candleDecay(NOW - CANDLE_TAU_MS, NOW)).toBeCloseTo(0.3679, 4);
});

it("alpha is 0.9 at decay 1 and 0.25 at decay 0", () => {
  expect(candleAlpha(1)).toBeCloseTo(0.9);
  expect(candleAlpha(0)).toBe(0.25);
});

it("a candle older than the minimum decay is not added", () => {
  // decay 0.05 is reached at tau * ln(20), about 18 h
  const list = applyCandle([], msg("old", 19 * 3600_000), NOW);
  expect(list).toEqual([]);
  expect(applyCandle([], msg("fresh", 17 * 3600_000), NOW)).toHaveLength(1);
});

it("a duplicate id is ignored", () => {
  const list = applyCandle([], msg("a"), NOW);
  expect(applyCandle(list, msg("a", 1000), NOW)).toBe(list);
});

it("a candle for a colour site is ignored", () => {
  const list = applyCandle([], msg("a"), NOW);
  expect(applyCandle(list, msg("b", 0, "mx"), NOW)).toBe(list);
  expect(applyCandle(list, msg("c", 0, "nowhere"), NOW)).toBe(list);
  expect(applyCandle(list, { id: "d", siteId: "cathedral", litAt: "not a date" }, NOW)).toBe(list);
  expect(applyCandle(list, { id: "e" }, NOW)).toBe(list);
});

it("the 201st candle drops the oldest", () => {
  const messages = Array.from({ length: CANDLE_MAX + 1 }, (_, i) => msg(`c${i}`, (CANDLE_MAX + 1 - i) * 1000));
  const list = applyCandleState([], messages, NOW);
  expect(list).toHaveLength(CANDLE_MAX);
  expect(list.some((c) => c.id === "c0")).toBe(false);
  expect(list.at(-1)?.id).toBe(`c${CANDLE_MAX}`);
});

it("the same id gives the same position", () => {
  expect(candlePosition("abc-123")).toEqual(candlePosition("abc-123"));
  expect(candlePosition("abc-123")).not.toEqual(candlePosition("abc-124"));
});

it("sequential ids land apart", () => {
  const points = Array.from({ length: 10 }, (_, i) => candlePosition(`demo-candle-${i + 1}`));
  for (const [i, a] of points.entries())
    for (const b of points.slice(i + 1)) expect(Math.hypot(a.dx - b.dx, a.dy - b.dy)).toBeGreaterThanOrEqual(0.1);
});

it("every position lies inside the spread", () => {
  for (let i = 0; i < 1000; i++) {
    const { dx, dy } = candlePosition(`candle-${i}`);
    expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(CANDLE_SPREAD);
  }
});

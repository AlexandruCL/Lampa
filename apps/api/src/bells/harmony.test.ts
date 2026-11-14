import { describe, expect, it } from "vitest";
import { judgeHarmony, pruneRings, type Ring } from "./harmony.js";

const NOW = 100_000;
const rings = (catholic: number[], serbian: number[]): Ring[] => [
  ...catholic.map((at) => ({ tower: "catholic" as const, at })),
  ...serbian.map((at) => ({ tower: "serbian" as const, at })),
];

describe("judgeHarmony", () => {
  it("three rings in rhythm are a harmony", () => {
    expect(judgeHarmony(rings([96_000, 97_000, 98_000], [96_200, 96_900, 98_300]), NOW)).toBe(true);
  });

  it("one pair more than 300 ms apart is no harmony", () => {
    expect(judgeHarmony(rings([96_000, 97_000, 98_000], [96_200, 96_900, 98_301]), NOW)).toBe(false);
  });

  it("one tower alone is no harmony", () => {
    expect(judgeHarmony(rings([96_000, 97_000, 98_000], []), NOW)).toBe(false);
  });

  it("two rings each are not enough", () => {
    expect(judgeHarmony(rings([97_000, 98_000], [97_000, 98_000]), NOW)).toBe(false);
  });

  it("a ring older than 6 seconds does not count", () => {
    expect(judgeHarmony(rings([93_999, 97_000, 98_000], [93_999, 97_000, 98_000]), NOW)).toBe(false);
  });

  it("only the last three rings of each tower are judged", () => {
    expect(judgeHarmony(rings([95_000, 96_000, 97_000, 98_000], [96_000, 97_000, 98_000]), NOW)).toBe(true);
  });

  it("no harmony within 10 seconds of the last one", () => {
    const r = rings([96_000, 97_000, 98_000], [96_000, 97_000, 98_000]);
    expect(judgeHarmony(r, NOW, NOW - 9_999)).toBe(false);
    expect(judgeHarmony(r, NOW, NOW - 10_000)).toBe(true);
  });
});

describe("pruneRings", () => {
  it("keeps the last 10 seconds", () => {
    expect(pruneRings(rings([90_000, 90_001], []), NOW)).toEqual(rings([90_001], []));
  });
});

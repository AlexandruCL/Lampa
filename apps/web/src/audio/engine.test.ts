import { describe, expect, it } from "vitest";
import type { Clips, SiteClips } from "./clips";
import { bedGain, bedUrl } from "./engine";

const site = (beds: string[]): SiteClips => ({ beds, greeting: {}, answers: {}, narrations: {}, tapToAsk: [] });
const c: Clips = {
  sites: { a: site(["a/bed-1-x.wav", "a/bed-2-y.wav"]), b: site([]) },
  project: { waltz: [] },
};

describe("bedGain", () => {
  it("an asleep site plays at 0.3", () => {
    expect(bedGain(0, false)).toBeCloseTo(0.3);
    expect(bedGain(null, false)).toBeCloseTo(0.3);
  });

  it("full glow plays at 1", () => {
    expect(bedGain(1, false)).toBeCloseTo(1);
  });

  it("half glow plays at 0.65", () => {
    expect(bedGain(0.5, false)).toBeCloseTo(0.65);
  });

  it("glow outside 0..1 is clamped", () => {
    expect(bedGain(-0.5, false)).toBeCloseTo(0.3);
    expect(bedGain(2, false)).toBeCloseTo(1);
  });

  it("the memorial plays at 0.5 whatever the glow", () => {
    for (const g of [null, 0, 0.5, 1, 2]) expect(bedGain(g, true)).toBe(0.5);
  });
});

describe("bedUrl", () => {
  it("bedUrl plays take 1 without a pick", () => {
    expect(bedUrl("a", c, {})).toBe("/audio/a/bed-1-x.wav");
  });

  it("bedUrl plays take 2 when picked", () => {
    expect(bedUrl("a", c, { a: 2 })).toBe("/audio/a/bed-2-y.wav");
  });

  it("bedUrl is null for a site without beds", () => {
    expect(bedUrl("b", c, {})).toBeNull();
    expect(bedUrl("unknown", c, {})).toBeNull();
  });
});

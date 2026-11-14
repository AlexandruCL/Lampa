import { describe, expect, it } from "vitest";
import type { Clips, SiteClips } from "./clips";
import { bedGain, bedTarget, bedUrl, healStep } from "./engine";

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

describe("bedTarget", () => {
  it("bedTarget is 0 when muted", () => {
    for (const g of [null, 0, 0.5, 1]) {
      expect(bedTarget(g, false, true)).toBe(0);
      expect(bedTarget(g, true, true)).toBe(0);
    }
  });

  it("bedTarget is the memorial 0.5 when not muted", () => {
    for (const g of [null, 0, 1]) expect(bedTarget(g, true, false)).toBe(0.5);
  });

  it("bedTarget follows the glow when not muted", () => {
    expect(bedTarget(0, false, false)).toBeCloseTo(0.3);
    expect(bedTarget(0.5, false, false)).toBeCloseTo(0.65);
    expect(bedTarget(1, false, false)).toBeCloseTo(1);
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

describe("healStep", () => {
  it("rebuilds once when the context runs again after a lapse", () => {
    let s = healStep(false, "running", false);
    expect(s).toEqual({ lapsed: false, rebuild: false });
    for (const state of ["suspended", "interrupted"]) {
      s = healStep(s.lapsed, state, false);
      expect(s).toEqual({ lapsed: true, rebuild: false });
    }
    s = healStep(s.lapsed, "running", false);
    expect(s).toEqual({ lapsed: false, rebuild: true });
    // The visibilitychange after the statechange must not rebuild a second time.
    expect(healStep(s.lapsed, "running", false)).toEqual({ lapsed: false, rebuild: false });
  });

  it("a hidden page counts as a lapse", () => {
    // iOS may report "running" throughout; hiding alone marks the lapse, and only the return heals.
    let s = healStep(false, "running", true);
    expect(s).toEqual({ lapsed: true, rebuild: false });
    s = healStep(s.lapsed, "running", false);
    expect(s).toEqual({ lapsed: false, rebuild: true });
    expect(healStep(s.lapsed, "running", false)).toEqual({ lapsed: false, rebuild: false });
  });
});

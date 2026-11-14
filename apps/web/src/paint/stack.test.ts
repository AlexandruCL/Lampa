import { describe, expect, it } from "vitest";
import { FOV_LONG_DEG, stackProgress, stackSize, trailOffset } from "./stack";

describe("trailOffset", () => {
  it("a turn of half the field of view reaches the edge of the frame, on either side", () => {
    expect(trailOffset(0, 1280)).toBe(0);
    expect(trailOffset(FOV_LONG_DEG / 2, 1280)).toBeCloseTo(640);
    expect(trailOffset(-FOV_LONG_DEG / 2, 1280)).toBeCloseTo(-640);
  });

  it("a turn past 90 degrees stays far off the same side", () => {
    expect(trailOffset(170, 1280)).toBeGreaterThan(1280);
    expect(trailOffset(-170, 1280)).toBeLessThan(-1280);
  });
});

describe("stackSize", () => {
  it("caps the long edge at 1280 and keeps the aspect ratio", () => {
    expect(stackSize(1920, 1080)).toEqual({ w: 1280, h: 720 });
    expect(stackSize(1080, 1920)).toEqual({ w: 720, h: 1280 });
  });

  it("never scales a small frame up", () => {
    expect(stackSize(640, 480)).toEqual({ w: 640, h: 480 });
  });

  it("takes another cap", () => {
    expect(stackSize(4000, 3000, 800)).toEqual({ w: 800, h: 600 });
  });

  it("a frame with no size still gives a 1 by 1 canvas", () => {
    expect(stackSize(0, 0)).toEqual({ w: 1, h: 1 });
  });
});

describe("stackProgress", () => {
  it("runs from 0 to 1 and clamps outside", () => {
    expect(stackProgress(-5, 8000)).toBe(0);
    expect(stackProgress(0, 8000)).toBe(0);
    expect(stackProgress(2000, 8000)).toBe(0.25);
    expect(stackProgress(8000, 8000)).toBe(1);
    expect(stackProgress(9000, 8000)).toBe(1);
  });

  it("a zero duration is already done", () => {
    expect(stackProgress(0, 0)).toBe(1);
  });
});

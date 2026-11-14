import { describe, expect, it } from "vitest";
import { createFlickDetector } from "./flick";

describe("createFlickDetector", () => {
  it("is true on the upward crossing only", () => {
    const flick = createFlickDetector();
    expect([100, 250, 400, 300, 100].map((rate, i) => flick(rate, i * 16))).toEqual([false, true, false, false, false]);
  });

  it("a second crossing inside the refractory time is ignored, a later one counts", () => {
    const flick = createFlickDetector(250, 350);
    expect(flick(300, 0)).toBe(true);
    expect(flick(0, 100)).toBe(false);
    expect(flick(300, 349)).toBe(false);
    expect(flick(0, 400)).toBe(false);
    expect(flick(300, 500)).toBe(true);
  });
});

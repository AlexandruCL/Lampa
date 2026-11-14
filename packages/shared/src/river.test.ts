import { describe, expect, it } from "vitest";
import { BEGA, alongM, bottleAlongM, catchable } from "./river.js";
import { bridges } from "./sites.js";

// 0.001° of longitude on the equator is 111.195 m.
const line = [[0, 0], [0, 0.001], [0.001, 0.001]] as const;

describe("alongM", () => {
  it("is the distance from the line's start to the nearest point on it", () => {
    expect(alongM({ lat: 0.0002, lng: 0.0005 }, line)).toBeCloseTo(55.6, 1);
    expect(alongM({ lat: 0.0005, lng: 0.0012 }, line)).toBeCloseTo(166.8, 1); // on the second segment
  });

  it("clamps to the ends of the line", () => {
    expect(alongM({ lat: 0, lng: -0.01 }, line)).toBe(0);
    expect(alongM({ lat: 0.01, lng: 0.001 }, line)).toBeCloseTo(222.4, 1);
  });
});

describe("bottleAlongM and catchable", () => {
  it("a bottle drifts downstream, towards the line's start, at the given speed", () => {
    expect(bottleAlongM(1000, 0, 0, 0.05)).toBe(1000);
    expect(bottleAlongM(1000, 0, 3_600_000, 0.05)).toBeCloseTo(820);
    expect(bottleAlongM(100, 0, 3_600_000, 0.05)).toBeCloseTo(-80); // past the start
  });

  it("a bridge catches a bottle within 150 m of it, on either side", () => {
    expect(catchable(650, 500)).toBe(true);
    expect(catchable(350, 500)).toBe(true);
    expect(catchable(651, 500)).toBe(false);
    expect(catchable(349, 500)).toBe(false);
    expect(catchable(520, 500, 10)).toBe(false);
  });
});

describe("the bridges", () => {
  const along = bridges.map((b) => alongM(b));
  const end = alongM({ lat: BEGA.at(-1)![0], lng: BEGA.at(-1)![1] });

  it("sit on the Bega line, not past its ends", () => {
    expect(bridges.length).toBeGreaterThanOrEqual(2);
    for (const a of along) {
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(end);
    }
  });

  it("are listed from upstream to downstream, each out of the next one's catch window", () => {
    for (let i = 1; i < along.length; i++) expect(along[i - 1]! - along[i]!).toBeGreaterThan(300);
  });
});

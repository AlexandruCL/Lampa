import type { Site } from "@lampa/shared";
import { describe, expect, it } from "vitest";
import { navMix, type Mix } from "./nav";

const here = { lat: 45.75, lng: 21.22 };
// Each 0.001 deg of latitude is about 111 m north.
const site = (id: string, dLat: number): Site => ({ id, name: id, lat: here.lat + dLat, lng: here.lng, is_memorial: false }) as Site;
// t, the target, about 1 km north; a, b, c, d about 11, 222, 333 and 444 m north.
const sites = [site("t", 0.009), site("a", 0.0001), site("b", 0.002), site("c", 0.003), site("d", 0.004)];

const close = (m: Mix | undefined, want: Mix) => {
  expect(m).toBeDefined();
  for (const k of ["level", "cutoff", "x", "z"] as const) expect(m![k]).toBeCloseTo(want[k]);
};

describe("navMix", () => {
  it("the far target is the beacon at 0.3 and 400 Hz, ahead; the three nearest others are the compass", () => {
    const m = navMix({ position: here, heading: 0, targetId: "t", sites });
    expect([...m.keys()]).toEqual(["t", "a", "b", "c"]);
    close(m.get("t"), { level: 0.3, cutoff: 400, x: 0, z: -1 });
    expect(m.get("a")!.level).toBeCloseTo(0.25);
  });

  it("demo: the beacon counts as near and only its pan follows the heading; the compass keeps real distances", () => {
    const m = navMix({ position: here, heading: 90, targetId: "t", sites, demo: true });
    close(m.get("t"), { level: 1, cutoff: 8000, x: -1, z: 0 });
    expect(m.get("b")!.level).toBeLessThan(0.25);
  });

  it("no position: the target only, centred, at 0.3 and 400 Hz", () => {
    const m = navMix({ position: null, heading: 90, targetId: "t", sites });
    expect([...m.keys()]).toEqual(["t"]);
    close(m.get("t"), { level: 0.3, cutoff: 400, x: 0, z: -1 });
  });

  it("no position in demo: the target only, centred, at 1 and 8000 Hz (Patrick, hour 25)", () => {
    const m = navMix({ position: null, heading: 90, targetId: "t", sites, demo: true });
    expect([...m.keys()]).toEqual(["t"]);
    close(m.get("t"), { level: 1, cutoff: 8000, x: 0, z: -1 });
  });
});

import { describe, expect, it } from "vitest";
import { compassSites, cutoffFor, distanceFactor, pannerPosition } from "./navMaths";

describe("distanceFactor", () => {
  it("is 1 near, 0.3 far, linear between, 0.3 unknown", () => {
    expect(distanceFactor(39)).toBe(1);
    expect(distanceFactor(40)).toBe(1);
    expect(distanceFactor(270)).toBeCloseTo(0.65);
    expect(distanceFactor(500)).toBeCloseTo(0.3);
    expect(distanceFactor(501)).toBeCloseTo(0.3);
    expect(distanceFactor(null)).toBeCloseTo(0.3);
  });
});

describe("cutoffFor", () => {
  it("is 8000 Hz near, 400 Hz far, 400 unknown", () => {
    expect(cutoffFor(39)).toBeCloseTo(8000);
    expect(cutoffFor(40)).toBeCloseTo(8000);
    expect(cutoffFor(500)).toBeCloseTo(400);
    expect(cutoffFor(501)).toBeCloseTo(400);
    expect(cutoffFor(null)).toBeCloseTo(400);
  });

  it("is log-scaled: the midpoint is the geometric mean, not 4200 Hz", () => {
    expect(cutoffFor(270)).toBeCloseTo(400 * Math.sqrt(20), 1); // ≈ 1788.9
  });
});

describe("pannerPosition", () => {
  const at = (bearing: number | null, heading: number | null) => pannerPosition(bearing, heading);

  it("straight ahead", () => {
    const p = at(45, 45);
    expect(p.x).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(-1);
  });

  it("90 right and 90 left", () => {
    const right = at(90, 0);
    expect(right.x).toBeCloseTo(1);
    expect(right.z).toBeCloseTo(0);
    const left = at(0, 90);
    expect(left.x).toBeCloseTo(-1);
    expect(left.z).toBeCloseTo(0);
  });

  it("behind", () => {
    const p = at(180, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(1);
  });

  it("wraps across north: 1 seen from 359 is 2 to the right, 359 from 1 is 2 to the left", () => {
    const r = at(1, 359);
    expect(r.x).toBeCloseTo(Math.sin((2 * Math.PI) / 180));
    expect(r.z).toBeCloseTo(-Math.cos((2 * Math.PI) / 180));
    const l = at(359, 1);
    expect(l.x).toBeCloseTo(-Math.sin((2 * Math.PI) / 180));
  });

  it("centred ahead when bearing or heading is unknown", () => {
    expect(at(null, 10)).toEqual({ x: 0, z: -1 });
    expect(at(10, null)).toEqual({ x: 0, z: -1 });
  });
});

describe("compassSites", () => {
  const here = { lat: 45.75, lng: 21.22 };
  // Each 0.001 deg of latitude is about 111 m north.
  const site = (id: string, dLat: number) => ({ id, lat: here.lat + dLat, lng: here.lng });
  const sites = [site("far", 0.009), site("a", 0.001), site("memorial", 0.002), site("b", 0.003), site("c", 0.004)];

  it("takes the three nearest, the memorial included", () => {
    expect(compassSites(sites, here, null).map((s) => s.id)).toEqual(["a", "memorial", "b"]);
  });

  it("skips the target when it is among the nearest", () => {
    expect(compassSites(sites, here, "a").map((s) => s.id)).toEqual(["memorial", "b", "c"]);
  });

  it("is empty with no position", () => {
    expect(compassSites(sites, null, "a")).toEqual([]);
  });
});

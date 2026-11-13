import { describe, expect, it } from "vitest";
import { findSite } from "../sites/sites";
import { bearingDeg, haversineM } from "./geo";

describe("geo", () => {
  it("haversine of a point to itself is 0", () => {
    const p = { lat: 45.7579, lng: 21.229 };
    expect(haversineM(p, p)).toBe(0);
  });

  it("haversine Unirii to Victoriei is within 1% of 548.19 m", () => {
    // 548.19 m was computed at hour 1 with the spherical law of cosines on the same 6371008.8 m radius,
    // an independent formula, so this checks haversineM against a second derivation.
    const d = haversineM(findSite("unirii")!, findSite("victoriei")!);
    expect(Math.abs(d - 548.19) / 548.19).toBeLessThan(0.01);
  });

  it("bearing due north is 0 and due east is 90", () => {
    expect(bearingDeg({ lat: 45, lng: 21 }, { lat: 46, lng: 21 })).toBeCloseTo(0, 9);
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90, 9);
  });

  it("bearing wraps to under 360", () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: -1 })).toBeCloseTo(270, 9);
    const nearlyNorth = bearingDeg({ lat: 0, lng: 0 }, { lat: 1, lng: -0.0001 });
    expect(nearlyNorth).toBeGreaterThan(359);
    expect(nearlyNorth).toBeLessThan(360);
  });
});

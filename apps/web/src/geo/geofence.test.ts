import { describe, expect, it } from "vitest";
import { SITES } from "../sites/sites";
import { initialFence, stepFence } from "./geofence";

const M_PER_DEG_LAT = (6371008.8 * Math.PI) / 180;
const A = { id: "a", lat: 45.75, lng: 21.23 };
const B = { id: "b", lat: A.lat + 100 / M_PER_DEG_LAT, lng: A.lng }; // 100 m north of A
const sites = [A, B];
/** A fix `m` metres due north of A (along a meridian, so haversine gives exactly `m`). */
const north = (m: number, accuracy: number) => ({ lat: A.lat + m / M_PER_DEG_LAT, lng: A.lng, accuracy });
const south = (m: number, accuracy: number) => north(-m, accuracy);

describe("geofence", () => {
  it("enters when the distance is under r plus the accuracy", () => {
    expect(stepFence(initialFence(), south(45, 10), sites).insideId).toBe("a"); // 45 < 40 + 10
    expect(stepFence(initialFence(), south(55, 10), sites).insideId).toBeNull(); // 55 > 40 + 10
  });

  it("accuracy counts at most 30 m toward entering", () => {
    expect(stepFence(initialFence(), south(69, 50), sites).insideId).toBe("a"); // 69 < 40 + 30
    expect(stepFence(initialFence(), south(71, 50), sites).insideId).toBeNull(); // 71 > 40 + 30, not 40 + 50
  });

  it("a fix with accuracy over 60 m is ignored", () => {
    const outside = initialFence();
    expect(stepFence(outside, south(0, 61), sites)).toBe(outside);
    const inside = { insideId: "a" };
    expect(stepFence(inside, south(500, 61), sites)).toBe(inside);
    expect(stepFence(outside, south(0, 60), sites).insideId).toBe("a"); // 60 m itself still counts
  });

  it("stays inside in the band between the enter and exit distances", () => {
    expect(stepFence(initialFence(), south(60, 5), sites).insideId).toBeNull(); // too far to enter
    const inside = { insideId: "a" };
    expect(stepFence(inside, south(60, 5), sites)).toBe(inside); // but not far enough to exit
    expect(stepFence(inside, south(65, 5), sites)).toBe(inside); // exactly r + 25 is not beyond it
  });

  it("exits beyond r plus 25 m", () => {
    expect(stepFence({ insideId: "a" }, south(66, 5), sites).insideId).toBeNull();
    // 67 m is also under the enter distance 40 + 30, yet the site just left is not re-entered by the same fix.
    expect(stepFence({ insideId: "a" }, south(67, 30), sites).insideId).toBeNull();
  });

  it("an exit fix can enter another site at once", () => {
    expect(stepFence({ insideId: "a" }, north(90, 5), sites).insideId).toBe("b"); // 90 m from A, 10 m from B
  });

  it("a QR start counts as inside until a GPS exit", () => {
    const qr = initialFence("unirii");
    expect(qr).toEqual({ insideId: "unirii" });
    const unirii = SITES.find((s) => s.id === "unirii")!;
    const at = (m: number, accuracy: number) => ({ lat: unirii.lat + m / M_PER_DEG_LAT, lng: unirii.lng, accuracy });
    expect(stepFence(qr, at(60, 20), SITES)).toBe(qr); // GPS alone would not have entered here
    expect(stepFence(qr, at(70, 60), SITES).insideId).toBeNull(); // a real exit fix ends it
  });

  it("a poor fix does not end a QR start", () => {
    const qr = initialFence("unirii");
    const victoriei = SITES.find((s) => s.id === "victoriei")!;
    expect(stepFence(qr, { ...victoriei, accuracy: 61 }, SITES)).toBe(qr);
  });
});

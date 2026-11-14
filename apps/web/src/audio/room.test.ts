import { sites } from "@lampa/shared";
import { describe, expect, it } from "vitest";
import { roomGain, roomPan, roomSites } from "./room";

describe("roomGain", () => {
  it("is 0.8 × glow, clamped to 0..1", () => {
    expect(roomGain(0)).toBe(0);
    expect(roomGain(0.5)).toBeCloseTo(0.4);
    expect(roomGain(1)).toBeCloseTo(0.8);
    expect(roomGain(1.2)).toBeCloseTo(0.8);
  });
});

describe("roomPan", () => {
  it("runs from −0.8 at the left edge through 0 at the centre to 0.8 at the right edge", () => {
    expect(roomPan(0, 1380)).toBeCloseTo(-0.8);
    expect(roomPan(690, 1380)).toBeCloseTo(0);
    expect(roomPan(1380, 1380)).toBeCloseTo(0.8);
  });
});

describe("roomSites", () => {
  it("the colour sites only: never the memorial, never the Gallery", () => {
    const placed = new Map([...sites.map((s) => [s.id, { x: 0 }] as const), ["gallery", { x: 0 }] as const]);
    const ids = roomSites(placed);
    expect(ids).toEqual(sites.filter((s) => !s.is_memorial).map((s) => s.id));
    expect(ids).toHaveLength(4);
    expect(ids).not.toContain("cathedral");
    expect(ids).not.toContain("gallery");
  });
});

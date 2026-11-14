import { sites } from "@lampa/shared";
import { afterAll, describe, expect, it, vi } from "vitest";
import { ROOM_MASTER, roomGain, roomPan, roomSites, setRoomLevel } from "./room";

describe("roomGain", () => {
  it("is ROOM_MASTER × glow, clamped to 0..1", () => {
    expect(roomGain(0)).toBe(0);
    expect(roomGain(0.5)).toBeCloseTo(ROOM_MASTER / 2);
    expect(roomGain(1)).toBeCloseTo(ROOM_MASTER);
    expect(roomGain(1.2)).toBeCloseTo(ROOM_MASTER);
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
    const placed = [...sites.map((s) => ({ id: s.id, x: 0 })), { id: "gallery", x: 0 }];
    const ids = roomSites(placed);
    expect(ids).toEqual(sites.filter((s) => !s.is_memorial).map((s) => s.id));
    expect(ids).toHaveLength(4);
    expect(ids).not.toContain("cathedral");
    expect(ids).not.toContain("gallery");
  });
});

describe("setRoomLevel", () => {
  const gain = { value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  const master = { gain, connect: vi.fn() };
  const ctx = { currentTime: 5, destination: {}, createGain: vi.fn(() => master) };
  vi.stubGlobal("AudioContext", function () {
    return ctx;
  });
  afterAll(() => vi.unstubAllGlobals());

  it("ramps one master gain, connected to the destination, from its current level", () => {
    setRoomLevel(0, 0.5);
    expect(master.connect).toHaveBeenCalledWith(ctx.destination);
    expect(gain.setValueAtTime).toHaveBeenCalledWith(1, 5);
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 5.5);
    ctx.currentTime = 50;
    setRoomLevel(1, 4);
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(1, 54);
    expect(ctx.createGain).toHaveBeenCalledOnce();
  });
});

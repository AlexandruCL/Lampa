import { afterEach, describe, expect, it, vi } from "vitest";
import { primeDevice, requestCompass, requestLocation } from "./primer";
import { headingFromEvent, smoothHeading } from "./useCompass";

/** A fake Geolocation whose getCurrentPosition answers with `answer`, or never when it is undefined. */
const fakeGeo = (answer?: { code: number }) =>
  ({
    getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) => {
      if (answer) fail(answer as GeolocationPositionError);
    },
  }) as unknown as Geolocation;

describe("sensors", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("ios heading is taken from webkitCompassHeading", () => {
    expect(headingFromEvent({ alpha: 10, webkitCompassHeading: 123 }, "ios")).toBe(123);
    expect(headingFromEvent({ alpha: 10 }, "ios")).toBeNull(); // relative alpha never counts on iOS
  });

  it("android heading is 360 minus alpha", () => {
    expect(headingFromEvent({ alpha: 90 }, "absolute")).toBe(270);
    expect(headingFromEvent({ alpha: 0 }, "absolute")).toBe(0);
  });

  it("a null alpha gives no heading", () => {
    expect(headingFromEvent({ alpha: null }, "absolute")).toBeNull();
  });

  it("a denied requestPermission maps to compass denied", async () => {
    const w = { DeviceOrientationEvent: { requestPermission: () => Promise.resolve("denied") } };
    expect(await requestCompass(w)).toBe("denied");
  });

  it("no requestPermission and an absolute event maps to compass granted", async () => {
    expect(await requestCompass({ DeviceOrientationEvent: {}, ondeviceorientationabsolute: null })).toBe("granted");
    expect(await requestCompass({})).toBe("unavailable");
  });

  it("a location timeout maps to granted and a denial to denied", async () => {
    expect(await requestLocation(fakeGeo(), 5)).toBe("granted");
    expect(await requestLocation(fakeGeo({ code: 1 }), 5)).toBe("denied");
    expect(await requestLocation(fakeGeo({ code: 2 }), 5)).toBe("granted"); // only a denial is "denied"
  });

  it("demo priming asks for no location or motion permission", async () => {
    const getCurrentPosition = vi.fn();
    const watchPosition = vi.fn();
    const requestPermission = vi.fn(() => Promise.resolve("granted"));
    const resume = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition, watchPosition } });
    vi.stubGlobal("window", { DeviceOrientationEvent: { requestPermission } });
    vi.stubGlobal("DeviceOrientationEvent", { requestPermission });
    vi.stubGlobal("AudioContext", class { state = "running"; resume = resume; });

    expect(await primeDevice({ demo: true })).toEqual({ location: "granted", compass: "granted", audio: "running" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(watchPosition).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(resume).toHaveBeenCalledOnce();
  });

  it("smoothing from 350 toward 10 crosses north, not south", () => {
    expect(smoothHeading(350, 10, 0.2)).toBeCloseTo(354);
    expect(smoothHeading(10, 350, 0.2)).toBeCloseTo(6);
  });
});

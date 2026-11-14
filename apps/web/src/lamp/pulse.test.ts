import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LightSurface } from "./LightSurface";
import { pulseDelayMs } from "./pulse";

describe("pulseDelayMs", () => {
  it.each([
    [0, 0, 0],
    [1000, 0, -1000],
    [3999, 0, -3999],
    [4000, 0, 0],
    [8001, 0, -1],
    [1000, -3000, -2000], // server time -2000: before epoch still lands in 0..-3999
    [10_000, -1500, -500],
  ])("device %s, offset %s gives %s", (deviceNow, offset, delay) => {
    expect(pulseDelayMs(deviceNow, offset)).toBe(delay);
  });
});

describe("LightSurface pulse", () => {
  it("stays steady while the clock offset is unknown", () => {
    const out = renderToStaticMarkup(createElement(LightSurface, { exit: null, children: "Your lamp is lit." }));
    expect(out).toContain('class="_pulse');
    expect(out).not.toContain("pulsing");
    expect(out).not.toContain("animation-delay");
  });
});

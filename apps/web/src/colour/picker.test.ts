import { describe, expect, it } from "vitest";
import { pickColour, rgbDistance, SAMPLE_SIZE } from "./picker";

type RGB = [number, number, number];
const N = SAMPLE_SIZE * SAMPLE_SIZE; // 4096

/** A 64x64 RGBA frame: each [count, colour] group in order, the rest filled with `rest`. */
function frame(rest: RGB, ...groups: [number, RGB][]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(N * 4);
  const colours = groups.flatMap(([count, c]) => Array<RGB>(count).fill(c));
  for (let i = 0; i < N; i++) out.set([...(colours[i] ?? rest), 255], i * 4);
  return out;
}

const RED: RGB = [255, 0, 0];
const BLUE: RGB = [0, 0, 255];
const GREEN: RGB = [0, 255, 0];
const GREY: RGB = [128, 128, 128];

describe("pickColour", () => {
  it("a uniform vivid red array reads red, bin 0, hex #ff0000", () => {
    const r = pickColour(frame(RED));
    expect(r).toMatchObject({ r: 255, g: 0, b: 0, hex: "#ff0000", bin: 0 });
  });

  it("a vivid minority beats a grey majority, not the plain average", () => {
    const r = pickColour(frame(GREY, [Math.round(N * 0.3), BLUE]));
    expect(r.bin).toBe(8);
    expect(r.hex).toBe("#0000ff");
  });

  it("the strongest bin wins by saturation times value, not by pixel count", () => {
    const dullOrange: RGB = [255, 217, 179]; // hue 30, saturation 0.3, value 1
    const r = pickColour(frame(GREEN, [Math.round(N * 0.6), dullOrange]));
    expect(r.bin).toBe(4);
    expect(r.hex).toBe("#00ff00");
  });

  it("the result is the average of the winning bin's pixels only", () => {
    const r = pickColour(frame([0, 200, 0], [1600, RED], [1600, [205, 0, 0]]));
    expect(r).toMatchObject({ r: 230, g: 0, b: 0, bin: 0 });
  });

  it("reds on both sides of 0 degrees share bin 0", () => {
    // 30% at hue 350 and 30% at hue 10 each lose to 40% blue alone, but win together
    const r = pickColour(frame(BLUE, [1229, [255, 0, 43]], [1229, [255, 43, 0]]));
    expect(r.bin).toBe(0);
    expect(r).toMatchObject({ r: 255, g: 22, b: 22 });
  });

  it("an all-grey array is night glass with bin null and the average grey", () => {
    const r = pickColour(frame([150, 150, 150], [N / 2, [100, 100, 100]]));
    expect(r).toMatchObject({ r: 125, g: 125, b: 125, bin: null });
  });

  it("a dark array is night glass", () => {
    const r = pickColour(frame([40, 0, 0]));
    expect(r).toMatchObject({ r: 40, g: 0, b: 0, bin: null });
  });

  it("204 vivid pixels of 4096 is night glass and 205 is not", () => {
    expect(pickColour(frame(GREY, [204, RED])).bin).toBeNull();
    const r = pickColour(frame(GREY, [205, RED]));
    expect(r.bin).toBe(0);
    expect(r.hex).toBe("#ff0000");
  });

  it("hex is lower case and matches r, g, b", () => {
    const r = pickColour(frame([171, 205, 239]));
    expect(r.hex).toBe("#abcdef");
    expect(r.hex).toBe("#" + [r.r, r.g, r.b].map((c) => c.toString(16).padStart(2, "0")).join(""));
  });

  it("hue, saturation and lightness are the HSL of the result", () => {
    const r = pickColour(frame([200, 100, 50]));
    expect(r.hue).toBeCloseTo(20, 6);
    expect(r.saturation).toBeCloseTo(0.6, 6);
    expect(r.lightness).toBeCloseTo(250 / 510, 6);
    const grey = pickColour(frame(GREY));
    expect(grey).toMatchObject({ hue: 0, saturation: 0 });
    // a fully saturated colour stays at exactly 1, never 1 plus a rounding error
    expect(pickColour(frame([0, 0, 1])).saturation).toBe(1);
    expect(pickColour(frame([255, 217, 179])).saturation).toBe(1);
  });
});

describe("rgbDistance", () => {
  it("rgbDistance of black and white is about 441.67", () => {
    const black = pickColour(frame([0, 0, 0]));
    const white = pickColour(frame([255, 255, 255]));
    expect(rgbDistance(black, white)).toBeCloseTo(441.67, 2);
    expect(rgbDistance(white, white)).toBe(0);
  });
});

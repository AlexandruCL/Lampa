import { colourName, hexHue, hueBin } from "@lampa/shared";
import { expect, it } from "vitest";

it("hueBin puts 345, 0 and 14 in bin 0 and 15 in bin 1", () => {
  expect([345, 0, 14].map(hueBin)).toEqual([0, 0, 0]);
  expect(hueBin(15)).toBe(1);
});

it("hueBin puts 344 in bin 11", () => {
  expect(hueBin(344)).toBe(11);
});

it("hexHue of pure red, green and blue is 0, 120 and 240", () => {
  expect(["#ff0000", "#00ff00", "#0000ff"].map(hexHue)).toEqual([0, 120, 240]);
});

it("hexHue of a grey is null", () => {
  expect(hexHue("#808080")).toBeNull();
});

it("colourName of a grey is Night glass", () => {
  expect(colourName("#808080").en).toBe("Night glass");
});

it("colourName of #FF8800 is Orange", () => {
  expect(colourName("#FF8800").en).toBe("Orange");
});

import { describe, expect, it } from "vitest";
import { BIN_COUNT, hueBin } from "./bins";

describe("hueBin", () => {
  it("hue 0 and hue 359 are bin 0", () => {
    expect(hueBin(0)).toBe(0);
    expect(hueBin(359)).toBe(0);
  });

  it("hue 14.9 is bin 0 and hue 15 is bin 1", () => {
    expect(hueBin(14.9)).toBe(0);
    expect(hueBin(15)).toBe(1);
  });

  it("hue 344.9 is bin 11 and hue 345 is bin 0", () => {
    expect(hueBin(344.9)).toBe(11);
    expect(hueBin(345)).toBe(0);
  });

  it("each bin's lower edge maps to its own index", () => {
    expect(BIN_COUNT).toBe(12);
    for (let i = 0; i < BIN_COUNT; i++) expect(hueBin((i * 30 + 345) % 360)).toBe(i);
  });

  it("hue 360 and hue -15 wrap", () => {
    expect(hueBin(360)).toBe(0);
    expect(hueBin(-15)).toBe(0);
    expect(hueBin(-16)).toBe(11);
    expect(hueBin(375)).toBe(1);
  });
});

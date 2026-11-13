import { describe, expect, it } from "vitest";
import { hslToHex } from "./colour.js";

describe("hslToHex", () => {
  it("hslToHex of 0, 1, 0.5 is #ff0000", () => expect(hslToHex(0, 1, 0.5)).toBe("#ff0000"));
  it("hslToHex of 240, 1, 0.5 is #0000ff", () => expect(hslToHex(240, 1, 0.5)).toBe("#0000ff"));
});

import { describe, expect, it } from "vitest";
import { caughtLine, parseLight } from "./tools";

describe("parseLight", () => {
  it("a valid call gives the colour at a quarter of its intensity", () =>
    expect(parseLight({ color: "#C8102e", intensity: 0.5 })).toEqual({ hex: "#C8102e", alpha: 0.125 }));
  it("intensity 2 clamps to alpha 0.25", () => expect(parseLight({ color: "#c8102e", intensity: 2 })?.alpha).toBe(0.25));
  it("intensity -1 clamps to alpha 0", () => expect(parseLight({ color: "#c8102e", intensity: -1 })?.alpha).toBe(0));
  it.each([
    ["a colour name", { color: "red", intensity: 0.5 }],
    ["five hex digits", { color: "#12345", intensity: 0.5 }],
    ["no intensity", { color: "#c8102e" }],
    ["a NaN intensity", { color: "#c8102e", intensity: NaN }],
    ["null", null],
  ])("%s gives null", (_, params) => expect(parseLight(params)).toBeNull());
});

it("caughtLine names the colour in English", () => expect(caughtLine("#c8102e")).toBe("caught Red (#c8102e)"));

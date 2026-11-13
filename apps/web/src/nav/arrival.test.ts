import { describe, expect, it } from "vitest";
import { hasArrived } from "./arrival";

describe("hasArrived", () => {
  it("entering the chosen site arrives", () => {
    expect(hasArrived({ insideId: "mx" }, "mx", "unirii")).toBe(true);
  });

  it("being inside another site does not arrive", () => {
    expect(hasArrived({ insideId: "victoriei" }, "mx", "unirii")).toBe(false);
    expect(hasArrived({ insideId: null }, "mx", "unirii")).toBe(false);
  });

  it("the site just left never arrives", () => {
    expect(hasArrived({ insideId: "unirii" }, "unirii", "unirii")).toBe(false);
  });

  it("no site just left still arrives", () => {
    expect(hasArrived({ insideId: "mx" }, "mx", null)).toBe(true);
  });
});

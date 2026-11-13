import { describe, expect, it } from "vitest";
import { cameraStatus, lensSquare, maxRotation } from "./camera";

describe("cameraStatus", () => {
  it("a NotAllowedError maps to denied", () => {
    expect(cameraStatus({ name: "NotAllowedError" })).toBe("denied");
  });

  it("a NotFoundError maps to unavailable", () => {
    expect(cameraStatus({ name: "NotFoundError" })).toBe("unavailable");
  });

  it("an unknown error maps to unavailable", () => {
    expect(cameraStatus(new Error("boom"))).toBe("unavailable");
    expect(cameraStatus(null)).toBe("unavailable");
  });
});

describe("lensSquare", () => {
  it("lensSquare of a 1280 by 720 frame in a 390 by 844 view at 64 starts at 608, 270", () => {
    expect(lensSquare(1280, 720, 390, 844, 64)).toEqual({ sx: 608, sy: 270, side: 64 });
  });

  it("lensSquare shrinks to a frame smaller than the sample", () => {
    expect(lensSquare(48, 36, 390, 844, 64).side).toBe(36);
  });

  it("lensSquare stays inside the frame", () => {
    // unclamped sy would be floor(29.4 - 32) = -3
    const { sx, sy, side } = lensSquare(100, 70, 390, 844, 64);
    expect(sy).toBe(0);
    expect(sx).toBeGreaterThanOrEqual(0);
    expect(sx + side).toBeLessThanOrEqual(100);
    expect(sy + side).toBeLessThanOrEqual(70);
  });
});

describe("maxRotation", () => {
  it("maxRotation takes the largest absolute axis", () => {
    expect(maxRotation({ alpha: 10, beta: -42, gamma: null })).toBe(42);
  });

  it("maxRotation of null axes is null", () => {
    expect(maxRotation({ alpha: null, beta: null, gamma: null })).toBeNull();
    expect(maxRotation(null)).toBeNull();
  });
});

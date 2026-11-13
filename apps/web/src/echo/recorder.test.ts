import { describe, expect, it } from "vitest";
import { baseMimeType, clampDuration, micStatus, pickMimeType, secondsLeft, tooShort } from "./recorder";

describe("pickMimeType", () => {
  it("webm with opus is picked when supported", () => {
    expect(pickMimeType(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("mp4 is picked when webm is not supported", () => {
    expect(pickMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
  });

  it("nothing supported gives null", () => {
    expect(pickMimeType(() => false)).toBeNull();
  });
});

describe("baseMimeType", () => {
  it("the base type drops the codecs", () => {
    expect(baseMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(baseMimeType("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
  });

  it("an unknown type counts as mp4", () => {
    expect(baseMimeType("")).toBe("audio/mp4");
    expect(baseMimeType("audio/ogg;codecs=opus")).toBe("audio/mp4");
  });
});

describe("micStatus", () => {
  it("a NotAllowedError maps to denied", () => {
    expect(micStatus({ name: "NotAllowedError" })).toBe("denied");
  });

  it("a NotFoundError maps to unavailable", () => {
    expect(micStatus({ name: "NotFoundError" })).toBe("unavailable");
  });
});

describe("timing", () => {
  it("20 seconds are left at the start and 0 at 20000 ms", () => {
    expect(secondsLeft(0)).toBe(20);
    expect(secondsLeft(20000)).toBe(0);
    expect(secondsLeft(25000)).toBe(0);
  });

  it("14 seconds are left at 6001 ms", () => {
    expect(secondsLeft(6001)).toBe(14);
  });

  it("999 ms is too short and 1000 ms is not", () => {
    expect(tooShort(999)).toBe(true);
    expect(tooShort(1000)).toBe(false);
  });

  it("a duration over 20000 ms is clamped to 20000", () => {
    expect(clampDuration(20345.6)).toBe(20000);
    expect(clampDuration(4321.6)).toBe(4322);
  });
});

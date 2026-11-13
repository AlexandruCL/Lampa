import { describe, expect, it } from "vitest";
import type { Fix } from "../geo/geofence";
import { blendHeading } from "./heading";

const fix = (over: Partial<Fix> = {}): Fix => ({ lat: 45.75, lng: 21.23, accuracy: 10, course: 90, speed: 1.4, ...over });

describe("blendHeading", () => {
  it("standing still keeps the compass", () => {
    expect(blendHeading(40, fix({ speed: 0 }))).toBe(40);
  });
  it("walking moves the compass half-way to the course", () => {
    expect(blendHeading(40, fix({ course: 90 }))).toBeCloseTo(65);
  });
  it("the blend crosses north by the short way", () => {
    expect(blendHeading(350, fix({ course: 30 }))).toBeCloseTo(10);
    expect(blendHeading(30, fix({ course: 350 }))).toBeCloseTo(10);
  });
  it("a speed of exactly 1.0 counts and 0.9 does not", () => {
    expect(blendHeading(40, fix({ speed: 1.0 }))).toBeCloseTo(65);
    expect(blendHeading(40, fix({ speed: 0.9 }))).toBe(40);
  });
  it("an accuracy of 31 m keeps the compass", () => {
    expect(blendHeading(40, fix({ accuracy: 30 }))).toBeCloseTo(65);
    expect(blendHeading(40, fix({ accuracy: 31 }))).toBe(40);
  });
  it("no compass and a course gives the course", () => {
    expect(blendHeading(null, fix({ course: 90 }))).toBe(90);
  });
  it("no compass and no course gives null", () => {
    expect(blendHeading(null, fix({ course: null }))).toBeNull();
    expect(blendHeading(null, null)).toBeNull();
  });
  it("a fix without a course keeps the compass", () => {
    expect(blendHeading(40, fix({ course: undefined }))).toBe(40);
    expect(blendHeading(40, fix({ course: null }))).toBe(40);
  });
});

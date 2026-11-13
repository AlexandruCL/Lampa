import { expect, it } from "vitest";
import { applyGlow, glowAlpha, glowLine, glowWord, haloAlpha } from "./glow";

it("a valid message sets the listed sites", () => {
  const next = applyGlow({}, { sites: [{ siteId: "mx", glow: 0.4 }, { siteId: "unirii", glow: 1 }] });
  expect(next).toEqual({ mx: 0.4, unirii: 1 });
});

it("sites not listed keep their value", () => {
  const next = applyGlow({ mx: 0.4, bastion: 0.7 }, { sites: [{ siteId: "mx", glow: 0.9 }] });
  expect(next).toEqual({ mx: 0.9, bastion: 0.7 });
});

it("a glow above 1 is ignored and the state object is unchanged", () => {
  const state = { mx: 0.4 };
  const next = applyGlow(state, { sites: [{ siteId: "mx", glow: 1.2 }] });
  expect(next).toBe(state);
  expect(state).toEqual({ mx: 0.4 });
});

it("a message that is not an object is ignored", () => {
  const state = { mx: 0.4 };
  for (const message of ["glow", 7, null, undefined]) expect(applyGlow(state, message)).toBe(state);
});

it("glowWord at 0, 0.14, 0.15, 0.59, 0.60, 0.99 and 1", () => {
  expect([0, 0.14, 0.15, 0.59, 0.6, 0.99, 1].map(glowWord)).toEqual([
    "Asleep",
    "Asleep",
    "Waking",
    "Waking",
    "Awake",
    "Awake",
    "Fully lit",
  ]);
});

it("glowLine prints Awake, 72%", () => {
  expect(glowLine(0.72)).toBe("Awake, 72%");
});

it("glowAlpha is 0.25 under 0.15 and 1 at 1", () => {
  expect(glowAlpha(0)).toBe(0.25);
  expect(glowAlpha(0.14)).toBe(0.25);
  expect(glowAlpha(1)).toBe(1);
});

it("haloAlpha is 0 under 0.15 and 0.35 at 1", () => {
  expect(haloAlpha(0)).toBe(0);
  expect(haloAlpha(0.14)).toBe(0);
  expect(haloAlpha(1)).toBe(0.35);
});

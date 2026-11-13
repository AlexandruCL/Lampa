import { expect, it } from "vitest";
import { mixHex, paneShare, slotShape, SLOTS } from "./rose";

const TURN = 2 * Math.PI;

it("slot 0 starts at 12 o'clock and spans one eighth", () => {
  expect(slotShape(0)).toEqual({ r0: 0, r1: 0.3, a0: 0, a1: TURN / 8 });
});

it("slots 8 to 23 sit between 0.34R and 0.62R", () => {
  for (let slot = 8; slot <= 23; slot++) expect(slotShape(slot)).toMatchObject({ r0: 0.34, r1: 0.62 });
  expect(slotShape(7).r1).toBe(0.3);
  expect(slotShape(24).r0).toBe(0.66);
});

it("slot 47 ends where slot 24 starts", () => {
  const [last, first] = [slotShape(47), slotShape(24)];
  expect(last.a1 % TURN).toBeCloseTo(first.a0, 12);
  expect([last.r0, last.r1]).toEqual([first.r0, first.r1]);
});

it("every slot from 0 to 47 has r0 under r1 and a0 under a1", () => {
  expect(SLOTS).toBe(48);
  for (let slot = 0; slot < SLOTS; slot++) {
    const s = slotShape(slot);
    expect(s.r0).toBeLessThan(s.r1);
    expect(s.a0).toBeLessThan(s.a1);
  }
  expect(() => slotShape(48)).toThrow(RangeError);
});

it("paneShare is 0.45 at glow 0 and 1 at glow 1", () => {
  expect(paneShare(0)).toBeCloseTo(0.45, 12);
  expect(paneShare(1)).toBeCloseTo(1, 12);
});

it("mixHex at share 1 is the pane colour and at share 0 is the background", () => {
  expect(mixHex("#ff8800", "#0e121a", 1)).toBe("#ff8800");
  expect(mixHex("#ff8800", "#0e121a", 0)).toBe("#0e121a");
  expect(mixHex("#ffffff", "#000000", 0.5)).toBe("#808080");
});

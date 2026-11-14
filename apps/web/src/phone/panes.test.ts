import { describe, expect, it } from "vitest";
import { addCityColour, applyPane, applySnapshot, averageGlow, cityFromWindows, emptyCity, emptyWindow, nextEmptySlot } from "./panes";

describe("panes", () => {
  it("the first pane sets the window id and its slot", () => {
    const s = applyPane(emptyWindow, { windowId: "w1", slot: 3, hex: "#aabbcc" });
    expect(s.windowId).toBe("w1");
    expect(s.filled[3]).toBe("#aabbcc");
    expect(s.filled.filter(Boolean)).toHaveLength(1);
  });
  it("a pane of the same window fills its slot and keeps the others", () => {
    const a = applyPane(emptyWindow, { windowId: "w1", slot: 3, hex: "#aabbcc" });
    const b = applyPane(a, { windowId: "w1", slot: 5, hex: "#112233" });
    expect(b.filled[3]).toBe("#aabbcc");
    expect(b.filled[5]).toBe("#112233");
  });
  it("a pane of a new window clears the old panes", () => {
    const a = applyPane(emptyWindow, { windowId: "w1", slot: 3, hex: "#aabbcc" });
    const b = applyPane(a, { windowId: "w2", slot: 0, hex: "#112233" });
    expect(b.windowId).toBe("w2");
    expect(b.filled[3]).toBeNull();
    expect(b.filled.filter(Boolean)).toHaveLength(1);
  });
  it("a snapshot fills an empty window, keeps live panes of the same window, and loses to a live pane of another window", () => {
    const stored = { windowId: "w1", panes: emptyWindow.filled.map((_, i) => (i === 3 ? "#aabbcc" : null)) };
    expect(applySnapshot(emptyWindow, stored)).toEqual({ windowId: "w1", filled: stored.panes });
    const same = applySnapshot(applyPane(emptyWindow, { windowId: "w1", slot: 5, hex: "#112233" }), stored);
    expect([same.filled[3], same.filled[5]]).toEqual(["#aabbcc", "#112233"]);
    const newer = applyPane(emptyWindow, { windowId: "w2", slot: 0, hex: "#112233" });
    expect(applySnapshot(newer, stored)).toBe(newer);
  });
  it("the city window takes colours from the sites in turn and stops at 48", () => {
    const site = (hex: string, n: number) => ({ panes: emptyWindow.filled.map((_, i) => (i < n ? hex : null)) });
    const few = cityFromWindows([site("#aa0000", 2), site("#00bb00", 1)]);
    expect(few.filled.slice(0, 4)).toEqual(["#aa0000", "#00bb00", "#aa0000", null]);
    const full = cityFromWindows([site("#aa0000", 48), site("#00bb00", 48), site("#0000cc", 3)]);
    expect(full.filled).toHaveLength(48);
    expect(full.filled.filter((h) => h === "#0000cc")).toHaveLength(3);
    expect(full.filled).not.toContain(null);
    expect(cityFromWindows([])).toEqual(emptyCity);
  });
  it("a new city colour fills the first empty slot, then replaces the slots of a full window in turn", () => {
    const one = addCityColour(emptyCity, "#111111");
    expect([one.filled[0], one.filled[1], one.next]).toEqual(["#111111", null, 0]);
    const full = { filled: Array<string | null>(48).fill("#000000"), next: 47 };
    const a = addCityColour(full, "#aaaaaa");
    expect([a.filled[47], a.next]).toEqual(["#aaaaaa", 0]);
    const b = addCityColour(a, "#bbbbbb");
    expect([b.filled[0], b.filled[47], b.next]).toEqual(["#bbbbbb", "#aaaaaa", 1]);
  });
  it("averageGlow is the mean over the sites, and null for none", () => {
    expect(averageGlow([0.2, 0.6, 1, 0])).toBeCloseTo(0.45);
    expect(averageGlow([])).toBeNull();
  });
  it("nextEmptySlot is the lowest empty index and null when full", () => {
    const a = applyPane(applyPane(emptyWindow, { windowId: "w", slot: 0, hex: "#000000" }), { windowId: "w", slot: 2, hex: "#000000" });
    expect(nextEmptySlot(a)).toBe(1);
    expect(nextEmptySlot({ windowId: "w", filled: Array(48).fill("#000000") })).toBeNull();
  });
});

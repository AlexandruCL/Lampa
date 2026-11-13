import { describe, expect, it } from "vitest";
import { applyPane, emptyWindow, nextEmptySlot } from "./panes";

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
  it("nextEmptySlot is the lowest empty index and null when full", () => {
    const a = applyPane(applyPane(emptyWindow, { windowId: "w", slot: 0, hex: "#000000" }), { windowId: "w", slot: 2, hex: "#000000" });
    expect(nextEmptySlot(a)).toBe(1);
    expect(nextEmptySlot({ windowId: "w", filled: Array(48).fill("#000000") })).toBeNull();
  });
});

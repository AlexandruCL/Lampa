import { expect, it } from "vitest";
import { applyPane, applyState, applyWindowComplete, emptyWindows } from "./windows";

const COLOUR_SITES = ["mx", "unirii", "victoriei", "bastion"];
const panes = (n: number, hex = "#ff8800") => Array.from({ length: n }, (_, i) => (i % 2 ? hex : null));
const pane = (over: Record<string, unknown> = {}) => ({ siteId: "unirii", windowId: "w1", slot: 3, hex: "#ff8800", ...over });

it("a valid state fills the listed windows and sets coloursToday", () => {
  const before = emptyWindows(COLOUR_SITES);
  const after = applyState(before, {
    windows: [
      { siteId: "unirii", windowId: "w1", panes: panes(48) },
      { siteId: "elsewhere", windowId: "w9", panes: panes(48) },
    ],
    coloursToday: 7,
  });
  expect(after.windows.unirii).toEqual({ windowId: "w1", panes: panes(48) });
  expect(after.windows.mx).toBe(before.windows.mx);
  expect(after.windows).not.toHaveProperty("elsewhere");
  expect(after.coloursToday).toBe(7);
});

it("an invalid state returns the same object", () => {
  const before = emptyWindows(COLOUR_SITES);
  expect(applyState(before, { windows: [], coloursToday: -1 })).toBe(before);
  expect(applyState(before, "not a state")).toBe(before);
});

it("a state with 47 panes in a window is invalid", () => {
  const before = emptyWindows(COLOUR_SITES);
  expect(applyState(before, { windows: [{ siteId: "unirii", windowId: "w1", panes: panes(47) }], coloursToday: 1 })).toBe(before);
});

it("a pane sets its slot and adds one to coloursToday", () => {
  const before = applyState(emptyWindows(COLOUR_SITES), { windows: [{ siteId: "unirii", windowId: "w1", panes: panes(48, "#112233") }], coloursToday: 5 });
  const after = applyPane(before, pane({ slot: 0 }));
  expect(after.windows.unirii.panes[0]).toBe("#ff8800");
  expect(after.windows.unirii.panes[1]).toBe("#112233");
  expect(after.windows.unirii.windowId).toBe("w1");
  expect(after.coloursToday).toBe(6);
  expect(before.windows.unirii.panes[0]).toBeNull();
});

it("the first pane with coloursToday null makes it 1", () => {
  expect(applyPane(emptyWindows(COLOUR_SITES), pane()).coloursToday).toBe(1);
});

it("a pane for an unknown site returns the same object", () => {
  const before = emptyWindows(COLOUR_SITES);
  expect(applyPane(before, pane({ siteId: "nowhere" }))).toBe(before);
  expect(applyPane(before, pane({ siteId: "toString" }))).toBe(before);
});

it("a pane with slot 48 returns the same object", () => {
  const before = emptyWindows(COLOUR_SITES);
  expect(applyPane(before, pane({ slot: 48 }))).toBe(before);
});

it("a pane with a new windowId empties the window first", () => {
  const before = applyPane(applyPane(emptyWindows(COLOUR_SITES), pane({ slot: 1 })), pane({ slot: 2 }));
  const after = applyPane(before, pane({ windowId: "w2", slot: 5, hex: "#00ff00" }));
  expect(after.windows.unirii.windowId).toBe("w2");
  expect(after.windows.unirii.panes.filter(Boolean)).toEqual(["#00ff00"]);
  expect(after.windows.unirii.panes[5]).toBe("#00ff00");
  expect(after.coloursToday).toBe(3);
});

it("window complete empties the matching window", () => {
  const before = applyPane(emptyWindows(COLOUR_SITES), pane());
  const after = applyWindowComplete(before, { siteId: "unirii", windowId: "w1" });
  expect(after.windows.unirii).toEqual({ windowId: null, panes: Array(48).fill(null) });
  expect(after.coloursToday).toBe(1);
});

it("window complete for another windowId returns the same object", () => {
  const before = applyPane(emptyWindows(COLOUR_SITES), pane());
  expect(applyWindowComplete(before, { siteId: "unirii", windowId: "w0" })).toBe(before);
  expect(applyWindowComplete(before, { siteId: "nowhere", windowId: "w1" })).toBe(before);
  expect(applyWindowComplete(before, { siteId: "unirii" })).toBe(before);
});

it("the cathedral never gets a window", () => {
  const before = emptyWindows(COLOUR_SITES);
  expect(before.windows).not.toHaveProperty("cathedral");
  expect(applyPane(before, pane({ siteId: "cathedral" }))).toBe(before);
});

import { PaneMessage } from "@lampa/shared";
import { expect, it } from "vitest";
import { nextDemoMessage } from "./demoFeed";
import { sites } from "./sites.fixture";
import { applyPane, applyWindowComplete, emptyWindows, type WindowsState } from "./windows";

const COLOUR_SITES = sites.filter((s) => !s.is_memorial).map((s) => s.id);

// mulberry32: a fixed seed gives the same sequence on every run.
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs the feed through the same apply path as the hook; returns every message and the final state. */
function run(state: WindowsState, random: () => number, steps: number) {
  const messages: ReturnType<typeof nextDemoMessage>[] = [];
  for (let i = 0; i < steps; i++) {
    const m = nextDemoMessage(state, random);
    messages.push(m);
    state = applyPane(state, m.pane);
    if (m.complete) state = applyWindowComplete(state, m.complete);
  }
  return { messages, state };
}

it("a demo pane takes the lowest free slot", () => {
  let state = emptyWindows(["unirii"]);
  for (const slot of [0, 1, 3]) state = applyPane(state, { siteId: "unirii", windowId: "demo-7", slot, hex: "#112233" });
  expect(nextDemoMessage(state, seeded(1)).pane).toMatchObject({ siteId: "unirii", windowId: "demo-7", slot: 2 });
  expect(nextDemoMessage(emptyWindows(["unirii"]), seeded(1)).pane.slot).toBe(0);
});

it("a demo pane never targets the cathedral", () => {
  const { messages } = run(emptyWindows(COLOUR_SITES), seeded(2), 400);
  const targets = new Set(messages.map((m) => m.pane.siteId));
  expect(targets).not.toContain("cathedral");
  expect([...targets].sort()).toEqual([...COLOUR_SITES].sort());
});

it("the 48th pane carries a completion for the same windowId", () => {
  const { messages } = run(emptyWindows(["bastion"]), seeded(3), 48);
  expect(messages.slice(0, 47).every((m) => m.complete === undefined)).toBe(true);
  const last = messages[47];
  expect(last.pane.slot).toBe(47);
  expect(last.complete).toEqual({ siteId: "bastion", windowId: last.pane.windowId });
});

it("the pane after a completion uses a new windowId", () => {
  const { messages } = run(emptyWindows(["mx"]), seeded(4), 49);
  const n = Number(messages[47].pane.windowId.replace("demo-", ""));
  expect(messages[0].pane.windowId).toBe(`demo-${n}`);
  expect(messages[48].pane).toMatchObject({ windowId: `demo-${n + 1}`, slot: 0 });
  expect(messages[48].complete).toBeUndefined();
});

it("every demo message passes PaneMessage", () => {
  const { messages } = run(emptyWindows(COLOUR_SITES), seeded(5), 300);
  for (const m of messages) expect(PaneMessage.safeParse(m.pane).success).toBe(true);
  expect(messages.some((m) => m.complete)).toBe(true);
});

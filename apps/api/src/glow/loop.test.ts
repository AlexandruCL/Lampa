import type { GlowMessage, LampsMessage } from "@lampa/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db, GlowLoop } from "../seam.js";
import { glowSql } from "./glow.js";
import { LAMPS_SQL } from "./lamps.js";
import { startGlowLoop } from "./loop.js";

type Row = { site_id: string; glow: unknown };

let rows: Row[];
let query: ReturnType<typeof vi.fn<Db["query"]>>;
let emit: ReturnType<typeof vi.fn<(message: GlowMessage) => void>>;
const spyErrors = () => vi.spyOn(console, "error").mockImplementation(() => {});
let errors: ReturnType<typeof spyErrors>;
let loop: GlowLoop | undefined;

const start = (extra: { now?: () => Date } = {}) => (loop = startGlowLoop({ db: { query }, emit, ...extra }));

beforeEach(() => {
  vi.useFakeTimers();
  rows = [];
  query = vi.fn<Db["query"]>(async () => ({ rows, rowCount: rows.length }));
  emit = vi.fn<(message: GlowMessage) => void>();
  errors = spyErrors();
});

afterEach(() => {
  loop?.stop();
  loop = undefined;
  errors.mockRestore();
  vi.useRealTimers();
});

describe("glow loop", () => {
  it("a tick sends every row of the query as one GlowMessage, zeros included", async () => {
    rows = [
      { site_id: "opera", glow: 0.75 },
      { site_id: "cathedral", glow: 0 },
      { site_id: "bastion", glow: 0 },
    ];
    await start().tick();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith({
      sites: [
        { siteId: "opera", glow: 0.75 },
        { siteId: "cathedral", glow: 0 },
        { siteId: "bastion", glow: 0 },
      ],
    });
  });

  it("the query gets the loop's time as its one parameter", async () => {
    const at = new Date("2026-11-13T18:00:00Z");
    await start({ now: () => at }).tick();
    expect(query).toHaveBeenCalledWith(glowSql(), [at]);
  });

  it("a glow that arrives as a string is not sent and the latest message stays", async () => {
    rows = [{ site_id: "opera", glow: 0.5 }];
    const l = start();
    await l.tick();
    rows = [{ site_id: "opera", glow: "0.9" }];
    await vi.advanceTimersByTimeAsync(5000);
    expect(query).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(l.latest()).toEqual({ sites: [{ siteId: "opera", glow: 0.5 }] });
    expect(errors).toHaveBeenCalledWith(expect.stringMatching(/^glow tick failed: /));
  });

  it("a failing query is logged, sends nothing, and the next tick still runs", async () => {
    query.mockRejectedValueOnce(new Error('relation "site_glow" does not exist'));
    rows = [{ site_id: "opera", glow: 0.2 }];
    const l = start();
    await expect(l.tick()).resolves.toBeUndefined();
    expect(errors).toHaveBeenCalledWith('glow tick failed: relation "site_glow" does not exist');
    expect(emit).not.toHaveBeenCalled();
    expect(l.latest()).toBeNull();
    await vi.advanceTimersByTimeAsync(5000);
    expect(emit).toHaveBeenCalledWith({ sites: [{ siteId: "opera", glow: 0.2 }] });
  });

  it("an emit that throws does not reject the tick", async () => {
    rows = [{ site_id: "opera", glow: 0.3 }];
    const l = start();
    await l.tick();
    emit.mockImplementationOnce(() => {
      throw new Error("socket gone");
    });
    rows = [{ site_id: "opera", glow: 0.6 }];
    await expect(l.tick()).resolves.toBeUndefined();
    expect(errors).toHaveBeenCalledWith("glow tick failed: socket gone");
    expect(l.latest()).toEqual({ sites: [{ siteId: "opera", glow: 0.3 }] });
  });

  it("the loop ticks at once and then every 5000 ms", async () => {
    start();
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(query).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("a tick that is still running is not started twice", async () => {
    let release!: () => void;
    query.mockImplementationOnce(() => new Promise((resolve) => (release = () => resolve({ rows: [], rowCount: 0 }))));
    const l = start();
    const first = l.tick();
    expect(l.tick()).toBe(first);
    expect(query).toHaveBeenCalledTimes(1);
    release();
    await first;
    await l.tick();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("nudge runs one extra tick, and a second nudge within 1000 ms adds none", async () => {
    const l = start();
    await l.tick();
    await vi.advanceTimersByTimeAsync(400);
    l.nudge();
    l.nudge();
    await vi.advanceTimersByTimeAsync(599);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(query).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3999);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("latest is null before the first tick and the last message after it", async () => {
    rows = [{ site_id: "opera", glow: 0.1 }];
    const l = start();
    expect(l.latest()).toBeNull();
    await l.tick();
    expect(l.latest()).toEqual({ sites: [{ siteId: "opera", glow: 0.1 }] });
    rows = [{ site_id: "opera", glow: 0.4 }];
    await vi.advanceTimersByTimeAsync(5000);
    expect(l.latest()).toEqual({ sites: [{ siteId: "opera", glow: 0.4 }] });
  });

  it("stop ends the ticks and a waiting nudge", async () => {
    const l = start();
    await l.tick();
    l.nudge();
    l.stop();
    await vi.advanceTimersByTimeAsync(20000);
    await l.tick();
    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe("lamps in the loop", () => {
  let lampRows: { site_id: string; lit_today: unknown; lighting_now: unknown }[];
  let emitLamps: ReturnType<typeof vi.fn<(message: LampsMessage) => void>>;
  const lampsOf = (litToday: number): LampsMessage => ({ litToday, target: 731, sites: [{ siteId: "mx", lightingNow: 0 }] });
  const startWithLamps = () => (loop = startGlowLoop({ db: { query }, emit, emitLamps }));

  beforeEach(() => {
    rows = [{ site_id: "opera", glow: 0.5 }];
    lampRows = [{ site_id: "mx", lit_today: 3, lighting_now: 0 }];
    // Answers by SQL text, so a test can fail one query and not the other.
    query.mockImplementation(async (text) => (text === LAMPS_SQL ? { rows: lampRows, rowCount: lampRows.length } : { rows, rowCount: rows.length }));
    emitLamps = vi.fn<(message: LampsMessage) => void>();
  });

  it("a tick emits glow, then lamps", async () => {
    const order: string[] = [];
    emit.mockImplementation(() => void order.push("glow"));
    emitLamps.mockImplementation(() => void order.push("lamps"));
    await startWithLamps().tick();
    expect(order).toEqual(["glow", "lamps"]);
    expect(query.mock.calls.map(([text]) => text)).toEqual([glowSql(), LAMPS_SQL]);
    expect(emitLamps).toHaveBeenCalledWith(lampsOf(3));
  });

  it("a failed lamps query still emits glow", async () => {
    query.mockImplementation(async (text) => {
      if (text === LAMPS_SQL) throw new Error("lamps gone");
      return { rows, rowCount: rows.length };
    });
    const l = startWithLamps();
    await l.tick();
    expect(emit).toHaveBeenCalledWith({ sites: [{ siteId: "opera", glow: 0.5 }] });
    expect(l.latest()).toEqual({ sites: [{ siteId: "opera", glow: 0.5 }] });
    expect(emitLamps).not.toHaveBeenCalled();
    expect(l.latestLamps()).toBeNull();
    expect(errors).toHaveBeenCalledWith("lamps tick failed: lamps gone");
  });

  it("a failed glow query still emits lamps", async () => {
    query.mockImplementation(async (text) => {
      if (text !== LAMPS_SQL) throw new Error("glow gone");
      return { rows: lampRows, rowCount: lampRows.length };
    });
    const l = startWithLamps();
    await l.tick();
    expect(errors).toHaveBeenCalledWith("glow tick failed: glow gone");
    expect(emit).not.toHaveBeenCalled();
    expect(emitLamps).toHaveBeenCalledWith(lampsOf(3));
    expect(l.latestLamps()).toEqual(lampsOf(3));
  });

  it("latestLamps is null before the first tick and the last message after", async () => {
    const l = startWithLamps();
    expect(l.latestLamps()).toBeNull();
    await l.tick();
    expect(l.latestLamps()).toEqual(lampsOf(3));
    lampRows = [{ site_id: "mx", lit_today: 5, lighting_now: 0 }];
    await vi.advanceTimersByTimeAsync(5000);
    expect(l.latestLamps()).toEqual(lampsOf(5));
    // An emitLamps that throws keeps the last message sent.
    emitLamps.mockImplementationOnce(() => {
      throw new Error("socket gone");
    });
    lampRows = [{ site_id: "mx", lit_today: 9, lighting_now: 0 }];
    await l.tick();
    expect(errors).toHaveBeenCalledWith("lamps tick failed: socket gone");
    expect(l.latestLamps()).toEqual(lampsOf(5));
  });

  it("no emitLamps runs no lamps query", async () => {
    const l = start();
    await l.tick();
    await vi.advanceTimersByTimeAsync(5000);
    expect(query.mock.calls.map(([text]) => text)).toEqual([glowSql(), glowSql()]);
    expect(l.latestLamps()).toBeNull();
  });
});

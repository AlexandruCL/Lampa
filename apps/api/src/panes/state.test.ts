import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScreenState } from "@lampa/shared";
import type { Db } from "../seam.js";
import { candleId } from "../events/candles.js";
import { COLOURS_TODAY_SQL, createScreenStateRouter, SCREEN_CANDLES_SQL, toScreenState, WINDOWS_SQL } from "./state.js";

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

async function get(opts: { rows?: any[]; n?: number; noDb?: boolean; fail?: boolean; candles?: any[] } = {}) {
  const db: Db = {
    query: async (text) => {
      if (opts.fail) throw new Error("boom");
      const rows =
        text === COLOURS_TODAY_SQL ? [{ n: opts.n ?? 0 }]
        : text === WINDOWS_SQL ? (opts.rows ?? [])
        : text === SCREEN_CANDLES_SQL ? (opts.candles ?? [])
        : [];
      return { rows, rowCount: rows.length };
    },
  };
  const app = express();
  app.use(createScreenStateRouter({ db: opts.noDb ? undefined : db }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  return fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/screen/state`);
}

describe("toScreenState", () => {
  it("an open window lists 48 entries with each hex at its slot and null elsewhere", () => {
    const s = toScreenState([{ site_id: "mx", window_id: "w1", panes: [{ slot: 0, hex: "#aabbcc" }, { slot: 47, hex: "#112233" }] }], 2);
    const p = s.windows[0].panes;
    expect(p).toHaveLength(48);
    expect(p[0]).toBe("#aabbcc");
    expect(p[47]).toBe("#112233");
    expect(p.filter((x) => x === null)).toHaveLength(46);
    expect(s.windows[0]).toMatchObject({ siteId: "mx", windowId: "w1" });
  });

  it("a window with no panes lists 48 nulls", () => {
    const s = toScreenState([{ site_id: "mx", window_id: "w1", panes: [] }], 0);
    expect(s.windows[0].panes).toEqual(Array(48).fill(null));
  });

  it("no open windows gives an empty list", () => {
    expect(toScreenState([], 0).windows).toEqual([]);
  });

  it("coloursToday passes through", () => {
    expect(toScreenState([], 17).coloursToday).toBe(17);
  });
});

describe("screen candles", () => {
  const ts = new Date("2026-06-01T12:00:00.000Z");

  it("screen state lists memorial candles as CandleMessage", async () => {
    const res = await get({ candles: [{ ts, session_id: "anon:x", site_id: "cat" }] });
    const body = ScreenState.parse(await res.json());
    expect(body.candles).toEqual([{ id: candleId(ts, "anon:x"), siteId: "cat", litAt: ts.toISOString() }]);
  });

  it("a screen candle id does not contain the session", async () => {
    const res = await get({ candles: [{ ts, session_id: "anon:x", site_id: "cat" }] });
    expect(JSON.stringify(await res.json())).not.toContain("anon:x");
  });

  it("SCREEN_CANDLES_SQL reads only memorial sites in the last 24 hours", () => {
    expect(SCREEN_CANDLES_SQL).toContain("kind = 'candle'");
    expect(SCREEN_CANDLES_SQL).toContain("s.is_memorial");
    expect(SCREEN_CANDLES_SQL).toContain("now() - INTERVAL '24 hours'");
    expect(SCREEN_CANDLES_SQL).toContain("ORDER BY e.ts ASC");
  });

  it("no candle gives candles []", async () => {
    expect(ScreenState.parse(await (await get()).json()).candles).toEqual([]);
  });
});

describe("GET /screen/state", () => {
  it("GET /screen/state answers 200 with a body that parses as ScreenState", async () => {
    const res = await get({ rows: [{ site_id: "mx", window_id: "w1", panes: [{ slot: 3, hex: "#aabbcc" }] }], n: 5 });
    expect(res.status).toBe(200);
    const body = ScreenState.parse(await res.json());
    expect(body.coloursToday).toBe(5);
    expect(body.windows[0].panes[3]).toBe("#aabbcc");
  });

  it("no db answers 503", async () => {
    const res = await get({ noDb: true });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });

  it("a failing query answers 503", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await get({ fail: true });
    expect(res.status).toBe(503);
    expect(spy).toHaveBeenCalledWith("screen state failed: boom");
  });

  it("no token is needed", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBeNull();
  });
});

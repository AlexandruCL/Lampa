import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db, Tx } from "../seam.js";
import { createPanesRouter, type PanesDeps } from "./router.js";

process.env.SESSION_SECRET = "test-secret";

const NOW = new Date("2026-06-01T12:00:00.000Z");
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
type Script = { site?: boolean; recent?: { n: number; oldest: Date | null }; open?: string | null; slots?: number[]; fail?: RegExp };

function fakeTx(s: Script = {}) {
  const calls: Call[] = [];
  const db: Db = {
    query: async (text, params = []) => {
      calls.push({ text, params: params as any[] });
      if (s.fail?.test(text)) throw new Error("boom");
      const rows = (r: any[]) => ({ rows: r, rowCount: r.length });
      if (/FROM sites/.test(text)) return rows(s.site === false ? [] : [{ "?column?": 1 }]);
      if (/count\(\*\)/.test(text)) return rows([s.recent ?? { n: 0, oldest: null }]);
      if (/FROM windows WHERE/.test(text)) return rows(s.open === null ? [] : [{ id: s.open ?? "w-1" }]);
      if (/INSERT INTO windows/.test(text)) return rows([{ id: "w-new" }]);
      if (/SELECT slot/.test(text)) return rows((s.slots ?? []).map((slot) => ({ slot })));
      return rows([]);
    },
  };
  const tx: Tx = (fn) => fn(db);
  const writes = () => calls.filter((c) => /^\s*(INSERT|UPDATE)/.test(c.text));
  return { calls, tx, writes, find: (re: RegExp) => calls.find((c) => re.test(c.text)) };
}

async function start(deps: PanesDeps) {
  const app = express();
  app.use(express.json());
  app.use(createPanesRouter({ now: () => NOW, ...deps }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = await new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject("anon:test")
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
  return (body: unknown, auth = true) =>
    fetch(`${base}/panes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
}

const pane = (siteId = "mx", at = new Date(NOW.getTime() - 60_000).toISOString()) =>
  ({ siteId, hue: 200, saturation: 0.5, lightness: 0.5, hex: "#4080bf", bin: null, at });

describe("POST /panes", () => {
  it("a valid pane answers 201 with windowId, slot, count and completed false", async () => {
    const f = fakeTx({ slots: [0, 1] });
    const res = await (await start({ tx: f.tx }))(pane());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ windowId: "w-1", slot: 2, count: 3, completed: false });
  });

  it("the pane, the reading and the colour event share one ts", async () => {
    const f = fakeTx();
    const p = pane();
    await (await start({ tx: f.tx }))(p);
    expect(f.find(/INTO panes/)!.params[8]).toBe(p.at);
    expect(f.find(/INTO colour_readings/)!.params[0]).toBe(p.at);
    expect(f.find(/INTO interaction_events/)!.params[0]).toBe(p.at);
  });

  it("the colour event carries weight 3", async () => {
    const f = fakeTx();
    await (await start({ tx: f.tx }))(pane());
    expect(f.find(/INTO interaction_events/)!.params).toEqual([pane().at, "anon:test", null, "mx", 3]);
  });

  it("the 48th pane answers completed true, closes the window and calls onPane with completed true", async () => {
    const f = fakeTx({ slots: Array.from({ length: 47 }, (_, i) => i) });
    const onPane = vi.fn();
    const res = await (await start({ tx: f.tx, onPane }))(pane());
    expect(await res.json()).toEqual({ windowId: "w-1", slot: 47, count: 48, completed: true });
    expect(f.find(/UPDATE windows/)!.params).toEqual(["w-1"]);
    expect(onPane).toHaveBeenCalledWith({ siteId: "mx", windowId: "w-1", slot: 47, hex: "#4080bf" }, true);
  });

  it("no open window inserts one with the site id", async () => {
    const f = fakeTx({ open: null });
    const res = await (await start({ tx: f.tx }))(pane());
    expect(f.find(/INSERT INTO windows/)!.params).toEqual(["mx"]);
    expect((await res.json()).windowId).toBe("w-new");
  });

  it("the sixth pane in an hour answers 429 with Retry-After and writes nothing", async () => {
    const f = fakeTx({ recent: { n: 5, oldest: new Date(NOW.getTime() - 3_000_000) } });
    const res = await (await start({ tx: f.tx }))(pane());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("600");
    expect(await res.json()).toEqual({ error: "rate_limited" });
    expect(f.writes()).toHaveLength(0);
  });

  it("a Gallery pane opens a window with a null site, stores a reading with site_id gallery and no interaction event", async () => {
    const f = fakeTx({ open: null });
    const res = await (await start({ tx: f.tx }))(pane("gallery"));
    expect(res.status).toBe(201);
    expect(f.find(/FROM sites/)).toBeUndefined();
    expect(f.find(/INSERT INTO windows/)!.params).toEqual([null]);
    expect(f.find(/INTO colour_readings/)!.params[1]).toBe("gallery");
    expect(f.find(/INTO interaction_events/)).toBeUndefined();
  });

  it("the Cathedral answers 404 unknown_site and writes nothing", async () => {
    const f = fakeTx({ site: false });
    const res = await (await start({ tx: f.tx }))(pane("cathedral"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_site" });
    expect(f.writes()).toHaveLength(0);
  });

  it("an unknown site answers 404 unknown_site", async () => {
    const f = fakeTx({ site: false });
    const res = await (await start({ tx: f.tx }))(pane("nope"));
    expect(res.status).toBe(404);
    expect(f.writes()).toHaveLength(0);
  });

  it("a body that fails PaneIn answers 400 invalid_body", async () => {
    const f = fakeTx();
    const res = await (await start({ tx: f.tx }))({ ...pane(), hex: "red" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
    expect(f.calls).toHaveLength(0);
  });

  it("no token answers 401", async () => {
    const res = await (await start({ tx: fakeTx().tx }))(pane(), false);
    expect(res.status).toBe(401);
  });

  it("no tx answers 503", async () => {
    const res = await (await start({}))(pane());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });

  it("a failing query answers 503 and onPane is not called", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const f = fakeTx({ fail: /INTO colour_readings/ });
    const onPane = vi.fn();
    const res = await (await start({ tx: f.tx, onPane }))(pane());
    expect(res.status).toBe(503);
    expect(onPane).not.toHaveBeenCalled();
  });

  it("onPane throwing still answers 201", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await (await start({ tx: fakeTx().tx, onPane: () => { throw new Error("socket"); } }))(pane());
    expect(res.status).toBe(201);
  });

  it("an anonymous visitor's sub goes to anon_id in the pane insert", async () => {
    const f = fakeTx();
    await (await start({ tx: f.tx }))(pane());
    expect(f.find(/INTO panes/)!.params.slice(6, 8)).toEqual([null, "anon:test"]);
  });
});

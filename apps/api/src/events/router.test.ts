import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSERT_EVENTS, MAX_EVENT_AGE_MS, createEventsRouter, toRows, userSub } from "./router.js";
import { candleId } from "./candles.js";
import { TALK_COUNT_SQL } from "./talk.js";

process.env.SESSION_SECRET = "test-secret";

const NOW = new Date("2026-06-01T12:00:00.000Z");
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
// calls holds the inserts; all holds every query, the talk count included.
function fakeDb(rowCount: number | null | Error = 1, opts: { rows?: any[]; counts?: any[]; countFails?: boolean } = {}) {
  const calls: Call[] = [];
  const all: Call[] = [];
  return {
    calls,
    all,
    db: {
      query: async (text: string, params?: unknown[]) => {
        all.push({ text, params: params as any[] });
        if (text === TALK_COUNT_SQL) {
          if (opts.countFails) throw new Error("count boom");
          return { rows: opts.counts ?? [], rowCount: 0 };
        }
        calls.push({ text, params: params as any[] });
        if (rowCount instanceof Error) throw rowCount;
        return { rows: opts.rows ?? [], rowCount };
      },
    },
  };
}

async function start(deps: Parameters<typeof createEventsRouter>[0]) {
  const app = express();
  app.use(express.json());
  app.use(createEventsRouter({ now: () => NOW, ...deps }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = await new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject("anon:test")
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
  return (body: unknown, auth = true) =>
    fetch(`${base}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
}

const ev = (kind: string, siteId = "mx", at = NOW.toISOString()) => ({ kind, siteId, at });

describe("POST /events", () => {
  it("no token is rejected with 401", async () => {
    const res = await (await start({ db: fakeDb().db }))({ events: [ev("wake")] }, false);
    expect(res.status).toBe(401);
  });

  it("a body that fails EventBatch answers 400 invalid_body", async () => {
    const f = fakeDb();
    const res = await (await start({ db: f.db }))({ events: [] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
    expect(f.calls).toHaveLength(0);
  });

  it("a wake is stored with weight 1 and the visitor's subject as session_id", async () => {
    const f = fakeDb();
    const res = await (await start({ db: f.db }))({ events: [ev("wake")] });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ accepted: 1 });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0]!.params).toEqual(["anon:test", null, [NOW.toISOString()], ["mx"], ["wake"], [1]]);
  });

  it("the weights are wake 1, talk_turn 0.5, lamp 2, echo_heard 0.2, candle 0 and arrived 0", async () => {
    const f = fakeDb(6);
    const kinds = ["wake", "talk_turn", "lamp", "echo_heard", "candle", "arrived"];
    await (await start({ db: f.db }))({ events: kinds.map((k) => ev(k)) });
    expect(f.calls[0]!.params[4]).toEqual(kinds);
    expect(f.calls[0]!.params[5]).toEqual([1, 0.5, 2, 0.2, 0, 0]);
  });

  it("a weight sent by the client is ignored", async () => {
    const f = fakeDb();
    await (await start({ db: f.db }))({ events: [{ ...ev("wake"), weight: 99 }] });
    expect(f.calls[0]!.params[5]).toEqual([1]);
  });

  it("colour and echo_approved are skipped, and a batch of only those runs no query and answers 202 with accepted 0", async () => {
    const f = fakeDb();
    const post = await start({ db: f.db });
    const only = await post({ events: [ev("colour"), ev("echo_approved")] });
    expect(only.status).toBe(202);
    expect(await only.json()).toEqual({ accepted: 0 });
    expect(f.calls).toHaveLength(0);
    await post({ events: [ev("colour"), ev("lamp")] });
    expect(f.calls[0]!.params[4]).toEqual(["lamp"]);
  });

  it("accepted is the insert's row count, so an unknown site id is not counted", async () => {
    const f = fakeDb(1);
    const res = await (await start({ db: f.db }))({ events: [ev("wake"), ev("wake", "atlantis")] });
    expect(await res.json()).toEqual({ accepted: 1 });
    const zero = await (await start({ db: fakeDb(null).db }))({ events: [ev("wake")] });
    expect(await zero.json()).toEqual({ accepted: 0 });
  });

  it("at within the last 10 minutes is kept, and an older or a future at becomes the server's time", () => {
    const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
    const rows = toRows(
      { events: [ev("wake", "a", at(-MAX_EVENT_AGE_MS)), ev("wake", "a", at(-MAX_EVENT_AGE_MS - 1)), ev("wake", "a", at(1)), ev("wake", "a", at(0))] } as any,
      NOW,
    );
    expect(rows.map((r) => r.ts)).toEqual([at(-MAX_EVENT_AGE_MS), NOW.toISOString(), NOW.toISOString(), at(0)]);
  });

  it("userSub is null for an anonymous visitor and the sub for an Auth0 visitor", () => {
    expect(userSub({ sub: "anon:x", kind: "anon", permissions: [] })).toBeNull();
    expect(userSub({ sub: "auth0|1", kind: "auth0", permissions: [] })).toBe("auth0|1");
  });

  it("a failing insert answers 503 unavailable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await (await start({ db: fakeDb(new Error("boom")).db }))({ events: [ev("wake")] });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
    expect(spy).toHaveBeenCalledWith("events insert failed: boom");
  });

  it("without a database it answers 503 unavailable", async () => {
    const res = await (await start({}))({ events: [ev("wake")] });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });

  it("onStored runs when rows were stored and not when accepted is 0", async () => {
    const onStored = vi.fn();
    await (await start({ db: fakeDb(1).db, onStored }))({ events: [ev("wake")] });
    expect(onStored).toHaveBeenCalledTimes(1);
    await (await start({ db: fakeDb(0).db, onStored }))({ events: [ev("wake")] });
    expect(onStored).toHaveBeenCalledTimes(1);
  });

  it("a lamp at a memorial site is not stored", async () => {
    const f = fakeDb();
    await (await start({ db: f.db }))({ events: [ev("lamp")] });
    expect(f.calls[0]!.text).toContain("NOT (e.kind = 'lamp' AND s.is_memorial)");
    expect(f.calls[0]!.params[4]).toEqual(["lamp"]);
  });

  it("a candle at a site that is not a memorial is not stored", async () => {
    const f = fakeDb();
    await (await start({ db: f.db }))({ events: [ev("candle")] });
    expect(f.calls[0]!.text).toContain("NOT (e.kind = 'candle' AND NOT s.is_memorial)");
    expect(f.calls[0]!.params[4]).toEqual(["candle"]);
  });

  it("a stored candle reaches onStored as a CandleMessage", async () => {
    const onStored = vi.fn();
    const ts = new Date(NOW);
    const f = fakeDb(2, { rows: [{ ts, site_id: "cat", kind: "candle" }, { ts, site_id: "mx", kind: "wake" }] });
    await (await start({ db: f.db, onStored }))({ events: [ev("candle", "cat"), ev("wake")] });
    expect(onStored).toHaveBeenCalledWith([{ id: candleId(ts, "anon:test"), siteId: "cat", litAt: ts.toISOString() }]);
  });

  it("the candle id does not contain the session", async () => {
    const onStored = vi.fn();
    const f = fakeDb(1, { rows: [{ ts: new Date(NOW), site_id: "cat", kind: "candle" }] });
    await (await start({ db: f.db, onStored }))({ events: [ev("candle", "cat")] });
    expect(JSON.stringify(onStored.mock.calls[0]![0])).not.toContain("anon:test");
  });

  it("onStored gets an empty list when no candle was stored", async () => {
    const onStored = vi.fn();
    const f = fakeDb(1, { rows: [{ ts: new Date(NOW), site_id: "mx", kind: "wake" }] });
    await (await start({ db: f.db, onStored }))({ events: [ev("wake")] });
    expect(onStored).toHaveBeenCalledWith([]);
  });

  it("onStored throwing still answers 202", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onStored = vi.fn(() => { throw new Error("socket down"); });
    const res = await (await start({ db: fakeDb().db, onStored }))({ events: [ev("wake")] });
    expect(res.status).toBe(202);
    expect(spy).toHaveBeenCalledWith("events onStored failed: socket down");
  });

  it("a sixth talk_turn in 10 minutes is not stored", async () => {
    const f = fakeDb(1, { counts: [{ site_id: "mx", n: 5 }] });
    const res = await (await start({ db: f.db }))({ events: [ev("talk_turn")] });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ accepted: 0 });
    expect(f.calls).toHaveLength(0);
    expect(f.all[0]!.params).toEqual(["anon:test", new Date(NOW.getTime() - 600_000).toISOString()]);
  });

  it("a batch with no talk_turn runs one query", async () => {
    const f = fakeDb();
    await (await start({ db: f.db }))({ events: [ev("wake")] });
    expect(f.all).toHaveLength(1);
  });

  it("a failing count query answers 503", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const f = fakeDb(1, { countFails: true });
    const res = await (await start({ db: f.db }))({ events: [ev("talk_turn")] });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
    expect(f.calls).toHaveLength(0);
  });

  it("INSERT_EVENTS joins sites and sets no lang, mode or props", () => {
    expect(INSERT_EVENTS).toContain("JOIN sites s ON s.id = e.site_id");
    expect(INSERT_EVENTS).not.toMatch(/\b(lang|mode|props)\b/);
  });
});

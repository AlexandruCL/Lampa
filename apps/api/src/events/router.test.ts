import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSERT_EVENTS, MAX_EVENT_AGE_MS, createEventsRouter, toRows, userSub } from "./router.js";

process.env.SESSION_SECRET = "test-secret";

const NOW = new Date("2026-06-01T12:00:00.000Z");
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
function fakeDb(rowCount: number | null | Error = 1) {
  const calls: Call[] = [];
  return {
    calls,
    db: {
      query: async (text: string, params?: unknown[]) => {
        calls.push({ text, params: params as any[] });
        if (rowCount instanceof Error) throw rowCount;
        return { rows: [], rowCount };
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

  it("INSERT_EVENTS joins sites and sets no lang, mode or props", () => {
    expect(INSERT_EVENTS).toContain("JOIN sites s ON s.id = e.site_id");
    expect(INSERT_EVENTS).not.toMatch(/\b(lang|mode|props)\b/);
  });
});

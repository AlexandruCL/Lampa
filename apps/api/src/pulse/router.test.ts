import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { candleId } from "../events/candles.js";
import type { Db } from "../seam.js";
import { PULSE_CACHE_MS, createPulseRouter } from "./router.js";
import { CANDLES_SQL, LANGUAGES_SQL, SUMMARY_SQL } from "./queries.js";

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Opts = { rows?: Record<string, any[]>; glow?: { siteId: string; glow: number }[] | null; noDb?: boolean; fail?: boolean };
async function start(opts: Opts = {}) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const calls: string[] = [];
  const clock = { ms: Date.parse("2026-07-01T10:00:00Z") };
  const db: Db = {
    query: async (text) => {
      calls.push(text);
      if (opts.fail) throw new Error("boom");
      const rows = text === SUMMARY_SQL ? [{ lamps_today: 3, colours_today: 5, visitors_today: 9 }] : (opts.rows?.[text] ?? []);
      return { rows, rowCount: rows.length };
    },
  };
  const app = express();
  app.use(
    createPulseRouter({
      db: opts.noDb ? undefined : db,
      latestGlow: () => (opts.glow === null ? null : { sites: opts.glow ?? [] }),
      now: () => new Date(clock.ms),
    }),
  );
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { get: (path: string) => fetch(base + path), calls, clock };
}

describe("summary", () => {
  it("summary leaves the Cathedral out of glow", async () => {
    const { get } = await start({ glow: [{ siteId: "cathedral", glow: 1 }, { siteId: "mx", glow: 0.4 }] });
    const body = await (await get("/pulse/summary")).json();
    expect(body.glow.map((g: any) => g.siteId)).toEqual(["mx", "unirii", "victoriei", "bastion"]);
    expect(body).toMatchObject({ lampsToday: 3, coloursToday: 5, visitorsToday: 9 });
  });
  it("cityGlow is the mean of the four sites", async () => {
    const { get } = await start({
      glow: [{ siteId: "mx", glow: 1 }, { siteId: "unirii", glow: 0.5 }, { siteId: "victoriei", glow: 0.5 }, { siteId: "bastion", glow: 0 }],
    });
    expect((await (await get("/pulse/summary")).json()).cityGlow).toBe(0.5);
  });
  it("a missing glow counts as 0", async () => {
    const { get } = await start({ glow: null });
    const body = await (await get("/pulse/summary")).json();
    expect(body.cityGlow).toBe(0);
    expect(body.glow.every((g: any) => g.glow === 0)).toBe(true);
  });
});

describe("cache and limits", () => {
  it("a second request within 5 s runs no query", async () => {
    const { get, calls, clock } = await start();
    await get("/pulse/summary");
    clock.ms += PULSE_CACHE_MS - 1;
    await get("/pulse/summary");
    expect(calls).toHaveLength(1);
  });
  it("a request after 5 s runs the query again", async () => {
    const { get, calls, clock } = await start();
    await get("/pulse/summary");
    clock.ms += PULSE_CACHE_MS;
    await get("/pulse/summary");
    expect(calls).toHaveLength(2);
  });
  it("a failing query answers 503 and is not cached", async () => {
    const { get, calls } = await start({ fail: true });
    const res = await get("/pulse/summary");
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
    await get("/pulse/summary");
    expect(calls).toHaveLength(2);
  });
  it("no db answers 503", async () => {
    const { get } = await start({ noDb: true });
    expect((await get("/pulse/summary")).status).toBe(503);
  });
  it("Cache-Control is public, max-age=5", async () => {
    const { get } = await start();
    expect((await get("/pulse/summary")).headers.get("cache-control")).toBe("public, max-age=5");
  });
  it("no token is needed", async () => {
    const { get } = await start();
    expect((await get("/pulse/summary")).status).toBe(200);
  });
  it("the 121st summary request in a minute answers 429 and interactions still answers 200", async () => {
    const { get } = await start();
    for (let i = 0; i < 120; i++) expect((await get("/pulse/summary")).status).toBe(200);
    expect((await get("/pulse/summary")).status).toBe(429);
    expect((await get("/pulse/interactions")).status).toBe(200);
  });
  it("each endpoint keeps its own cache", async () => {
    const { get, calls } = await start();
    for (const p of ["summary", "languages", "candles", "interactions", "colour-clock"]) {
      await get(`/pulse/${p}`);
      await get(`/pulse/${p}`);
    }
    expect(calls).toHaveLength(5);
  });
});

describe("other endpoints", () => {
  it("languages answers most first", async () => {
    const { get } = await start({ rows: { [LANGUAGES_SQL]: [{ lang: "ro", conversations: 4 }, { lang: "en", conversations: 2 }] } });
    expect(await (await get("/pulse/languages")).json()).toEqual({
      languages: [{ lang: "ro", conversations: 4 }, { lang: "en", conversations: 2 }],
    });
  });
  it("candles answer ids and times, never a session", async () => {
    const ts = new Date("2026-07-01T09:00:00Z");
    const { get } = await start({ rows: { [CANDLES_SQL]: [{ ts, session_id: "secret-session", site_id: "cathedral" }] } });
    const text = await (await get("/pulse/candles")).text();
    expect(JSON.parse(text)).toEqual({ candles: [{ id: candleId(ts, "secret-session"), at: ts.toISOString() }] });
    expect(text).not.toContain("secret-session");
    expect(text).not.toContain("cathedral");
  });
  it("candles reads only memorial sites", async () => {
    const { get, calls } = await start();
    await get("/pulse/candles");
    expect(calls[0]).toBe(CANDLES_SQL);
    expect(CANDLES_SQL).toContain("is_memorial");
  });
  it("interactions lists the four colour sites even with no rows", async () => {
    const { get } = await start();
    const body = await (await get("/pulse/interactions")).json();
    expect(body.sites.map((s: any) => s.siteId)).toEqual(["mx", "unirii", "victoriei", "bastion"]);
  });
});

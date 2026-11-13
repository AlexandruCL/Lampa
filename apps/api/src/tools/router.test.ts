import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RECENT_ECHO_SQL, createToolsRouter } from "./router.js";

const SECRET = "tool-secret";
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  process.env.AGENT_TOOL_SECRET = SECRET;
  vi.restoreAllMocks();
});
process.env.AGENT_TOOL_SECRET = SECRET;

async function start(deps: Parameters<typeof createToolsRouter>[0]) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const app = express();
  app.use(express.json());
  app.use(createToolsRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (tool: string, body: unknown, secret: string | null = SECRET, raw = false) =>
    fetch(`${base}/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret === null ? {} : { "X-Agent-Secret": secret }) },
      body: raw ? (body as string) : JSON.stringify(body),
    });
}

const stats = { glow: 0.5, coloursToday: 7, lampsToday: 11 };
const okStats = async () => stats;

describe("secret check", () => {
  it("no AGENT_TOOL_SECRET answers 503", async () => {
    const post = await start({ getSiteStats: okStats });
    delete process.env.AGENT_TOOL_SECRET;
    const res = await post("get_site_stats", { site_id: "mx" });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });

  it("a missing X-Agent-Secret answers 401", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", { site_id: "mx" }, null);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("a wrong X-Agent-Secret answers 401", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", { site_id: "mx" }, "tool-secreX");
    expect(res.status).toBe(401);
  });

  it("a secret of another length answers 401", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", { site_id: "mx" }, "short");
    expect(res.status).toBe(401);
  });

  it("the secret check runs before the body check", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", {}, "wrong-secret");
    expect(res.status).toBe(401);
  });
});

describe("body", () => {
  it("a body without site_id answers 400", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
  });

  it("the Cathedral answers 404 unknown_site", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_recent_echo", { site_id: "cathedral" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_site" });
  });

  it("an unknown site answers 404", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", { site_id: "nowhere" });
    expect(res.status).toBe(404);
  });
});

describe("get_site_stats", () => {
  it("get_site_stats answers glow, colours_today and lamps_lit_today", async () => {
    const post = await start({ getSiteStats: okStats });
    const res = await post("get_site_stats", { site_id: "mx" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ glow: 0.5, colours_today: 7, lamps_lit_today: 11 });
  });

  it("get_site_stats answers 503 when getSiteStats throws", async () => {
    const post = await start({
      getSiteStats: async () => {
        throw new Error("down");
      },
    });
    const res = await post("get_site_stats", { site_id: "mx" });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
  });
});

describe("get_recent_echo", () => {
  const dbWith = (rows: any[]) => {
    const calls: { text: string; params: unknown[] | undefined }[] = [];
    return {
      calls,
      db: {
        query: async (text: string, params?: unknown[]) => {
          calls.push({ text, params });
          return { rows, rowCount: rows.length };
        },
      },
    };
  };

  it("get_recent_echo answers the newest approved echo", async () => {
    const { db, calls } = dbWith([{ transcript: "hello", lang: "en", created_at: "2026-06-01T10:00:00.000Z" }]);
    const post = await start({ db });
    const res = await post("get_recent_echo", { site_id: "mx" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echo: { transcript: "hello", lang: "en", created_at: "2026-06-01T10:00:00.000Z" } });
    expect(calls).toEqual([{ text: RECENT_ECHO_SQL, params: ["mx"] }]);
  });

  it("get_recent_echo answers echo null when there is none", async () => {
    const post = await start({ db: dbWith([]).db });
    const res = await post("get_recent_echo", { site_id: "mx" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echo: null });
  });

  it("get_recent_echo answers 503 without a db", async () => {
    const post = await start({});
    const res = await post("get_recent_echo", { site_id: "mx" });
    expect(res.status).toBe(503);
  });
});

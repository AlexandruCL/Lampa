import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentRouter, type AgentDeps } from "./session.js";

process.env.SESSION_SECRET = "test-secret";

const API_KEY = "sk_test_never_leak_0123456789";
const AGENT_ID = "agent_test_42";
const SIGNED = "wss://signed.test/convai?token=abc";
const ENDPOINT = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";

let servers: Server[] = [];
beforeEach(() => {
  vi.stubEnv("ELEVENLABS_API_KEY", API_KEY);
  vi.stubEnv("ELEVENLABS_AGENT_ID", AGENT_ID);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
});

// A fresh app per test, so each one gets its own rate-limit store.
async function start(deps: AgentDeps) {
  const app = express();
  app.use(createAgentRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = await new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject("anon:agent-test")
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
  return (query: string, auth = true) =>
    fetch(`${base}/agent/session${query}`, auth ? { headers: { Authorization: `Bearer ${token}` } } : {});
}

const upstreamOk = () => vi.fn<typeof fetch>(async () => Response.json({ signed_url: SIGNED }));
const expectUnavailable = async (res: Response) => {
  expect(res.status).toBe(503);
  expect(await res.text()).toBe('{"error":"agent_unavailable"}');
};

describe("GET /agent/session answers", () => {
  it("no token is rejected with 401", async () => {
    const get = await start({ fetch: upstreamOk() });
    const res = await get("?site=mx", false);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("a missing site answers 404 unknown_site", async () => {
    const upstream = upstreamOk();
    const res = await (await start({ fetch: upstream }))("");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_site" });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("an unknown site answers 404 unknown_site", async () => {
    const upstream = upstreamOk();
    const res = await (await start({ fetch: upstream }))("?site=atlantis");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_site" });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("the cathedral answers 404 no_persona and makes no upstream call", async () => {
    const upstream = upstreamOk();
    const getPersona = vi.fn(async () => ({ prompt: "p", firstMessage: "f", voiceId: "v" }));
    const res = await (await start({ fetch: upstream, getPersona }))("?site=cathedral");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "no_persona" });
    expect(upstream).not.toHaveBeenCalled();
    expect(getPersona).not.toHaveBeenCalled();
  });

  it("a persona site answers signedUrl and the seven dynamic variables", async () => {
    const res = await (await start({ fetch: upstreamOk() }))("?site=mx");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      signedUrl: SIGNED,
      dynamicVariables: {
        visitor_name: "traveller",
        local_time: expect.any(String),
        site_glow: 0,
        colours_today: 0,
        lamps_lit_today: 0,
        sites_visited: "none yet",
        returning_visitor: "no",
      },
    });
  });

  it("the upstream call carries the agent id and the xi-api-key header", async () => {
    const upstream = upstreamOk();
    await (await start({ fetch: upstream }))("?site=unirii");
    expect(upstream).toHaveBeenCalledTimes(1);
    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe(`${ENDPOINT}?agent_id=${AGENT_ID}`);
    expect(init?.headers).toEqual({ "xi-api-key": API_KEY });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("the answer and its headers never contain the API key", async () => {
    // The second upstream echoes the key in an error body, as a 401 from a real API may.
    const echoing = vi.fn<typeof fetch>(async () => new Response(`{"detail":"invalid key ${API_KEY}"}`, { status: 401 }));
    for (const upstream of [upstreamOk(), echoing]) {
      const res = await (await start({ fetch: upstream }))("?site=mx");
      expect(await res.text()).not.toContain(API_KEY);
      for (const [, value] of res.headers) expect(value).not.toContain(API_KEY);
    }
  });

  it("without getPersona the answer has no overrides", async () => {
    const body = await (await (await start({ fetch: upstreamOk() }))("?site=mx")).json();
    expect(body).not.toHaveProperty("overrides");
  });

  it("with getPersona the overrides carry the prompt, first message, language and voice", async () => {
    const getPersona = vi.fn(async () => ({ prompt: "You are the square.", firstMessage: "Bună!", voiceId: "voice_1" }));
    const body = await (await (await start({ fetch: upstreamOk(), getPersona }))("?site=victoriei&lang=ro")).json();
    expect(getPersona).toHaveBeenCalledWith("victoriei", "ro");
    expect(body.overrides).toEqual({
      agent: { prompt: { prompt: "You are the square." }, firstMessage: "Bună!", language: "ro" },
      tts: { voiceId: "voice_1" },
    });
  });

  it("an unknown lang becomes en", async () => {
    const getPersona = vi.fn(async () => ({ prompt: "p", firstMessage: "f", voiceId: "v" }));
    const body = await (await (await start({ fetch: upstreamOk(), getPersona }))("?site=bastion&lang=fr")).json();
    expect(getPersona).toHaveBeenCalledWith("bastion", "en");
    expect(body.overrides.agent.language).toBe("en");
  });

  it("stats from getSiteStats fill site_glow, colours_today and lamps_lit_today", async () => {
    const getSiteStats = vi.fn(async () => ({ glow: 0.426, coloursToday: 17, lampsToday: 9 }));
    const body = await (await (await start({ fetch: upstreamOk(), getSiteStats }))("?site=mx")).json();
    expect(getSiteStats).toHaveBeenCalledWith("mx");
    expect(body.dynamicVariables).toMatchObject({ site_glow: 43, colours_today: 17, lamps_lit_today: 9 });
  });

  it("a rejecting getSiteStats still answers 200 with zeros", async () => {
    const getSiteStats = vi.fn(async () => { throw new Error("db down"); });
    const res = await (await start({ fetch: upstreamOk(), getSiteStats }))("?site=mx");
    expect(res.status).toBe(200);
    expect((await res.json()).dynamicVariables).toMatchObject({ site_glow: 0, colours_today: 0, lamps_lit_today: 0 });
  });

  it("local_time is HH:mm", async () => {
    const body = await (await (await start({ fetch: upstreamOk() }))("?site=mx")).json();
    expect(body.dynamicVariables.local_time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
  });
});

describe("GET /agent/session falls back with 503", () => {
  it("a missing API key answers 503 agent_unavailable", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", undefined);
    const upstream = upstreamOk();
    await expectUnavailable(await (await start({ fetch: upstream }))("?site=mx"));
    expect(upstream).not.toHaveBeenCalled();
  });

  it("a missing agent id answers 503 agent_unavailable", async () => {
    vi.stubEnv("ELEVENLABS_AGENT_ID", undefined);
    const upstream = upstreamOk();
    await expectUnavailable(await (await start({ fetch: upstream }))("?site=mx"));
    expect(upstream).not.toHaveBeenCalled();
  });

  it("an upstream 401 answers 503 agent_unavailable", async () => {
    const upstream = vi.fn<typeof fetch>(async () => Response.json({ detail: { status: "invalid_api_key" } }, { status: 401 }));
    await expectUnavailable(await (await start({ fetch: upstream }))("?site=mx"));
  });

  it("an upstream timeout answers 503 agent_unavailable", async () => {
    // What fetch rejects with when AbortSignal.timeout fires; the real 5 s wait is not run.
    const upstream = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    await expectUnavailable(await (await start({ fetch: upstream }))("?site=mx"));
  });
});

describe("GET /agent/session rate limit", () => {
  it("the 7th request in ten minutes gets 429 with Retry-After", async () => {
    const get = await start({ fetch: upstreamOk() });
    for (let i = 0; i < 6; i++) expect((await get("?site=mx")).status).toBe(200);
    const res = await get("?site=mx");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
  });
});

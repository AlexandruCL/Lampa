import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import type { Db } from "../seam.js";
import { INSERT_CONVERSATION, SIGNATURE_TOLERANCE_S, createElevenLabsWebhookRouter } from "./elevenlabs.js";

const SECRET = "whsec-test";
const NOW = Date.parse("2026-07-01T10:00:00Z");
process.env.SESSION_SECRET = "session-test";
process.env.ELEVENLABS_WEBHOOK_SECRET = SECRET;

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  process.env.ELEVENLABS_WEBHOOK_SECRET = SECRET;
  vi.restoreAllMocks();
});

const sign = (body: string, t = NOW / 1000) => `t=${t},v0=${createHmac("sha256", SECRET).update(`${t}.${body}`).digest("hex")}`;

const call = (extra: object = {}) =>
  JSON.stringify({
    type: "post_call_transcription",
    data: {
      conversation_id: "conv_1",
      transcript: [{ role: "user", message: "never stored" }],
      metadata: { start_time_unix_secs: 1782900000, call_duration_secs: 41.6 },
      analysis: { transcript_summary: "A short chat.", data_collection_results: { mood: { value: "calm" } } },
      conversation_initiation_client_data: {
        dynamic_variables: { site_id: "mx" },
        conversation_config_override: { agent: { language: "ro" } },
      },
      ...extra,
    },
  });

async function start(opts: { noDb?: boolean; viaApp?: boolean } = {}) {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const calls: { text: string; params?: unknown[] }[] = [];
  const db: Db = { query: async (text, params) => (calls.push({ text, params }), { rows: [], rowCount: 1 }) };
  const dbDep = opts.noDb ? undefined : db;
  let app: express.Express;
  if (opts.viaApp) app = createApp({ db: dbDep });
  else {
    app = express();
    app.use(createElevenLabsWebhookRouter({ db: dbDep, now: () => new Date(NOW) }));
  }
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const post = (body: string, signature: string | null = sign(body)) =>
    fetch(`${base}/webhooks/elevenlabs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(signature === null ? {} : { "ElevenLabs-Signature": signature }) },
      body,
    });
  return { post, calls };
}

describe("storing", () => {
  it("a signed post_call_transcription stores one row and answers 200", async () => {
    const { post, calls } = await start();
    const res = await post(call());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
  });
  it("the row has the start time, site, duration, language, summary and data", async () => {
    const { post, calls } = await start();
    await post(call());
    expect(calls[0].params).toEqual([1782900000, "conv_1", "mx", 42, "ro", "A short chat.", { mood: { value: "calm" } }]);
  });
  it("a missing language stores en", async () => {
    const { post, calls } = await start();
    await post(call({ conversation_initiation_client_data: {}, analysis: {} }));
    expect(calls[0].params).toEqual([1782900000, "conv_1", null, 42, "en", null, {}]);
  });
  it("a retried body is inserted with ON CONFLICT DO NOTHING", async () => {
    const { post, calls } = await start();
    await post(call());
    await post(call());
    expect(calls).toHaveLength(2);
    expect(calls[0].text).toBe(INSERT_CONVERSATION);
    expect(INSERT_CONVERSATION).toContain("ON CONFLICT (conversation_id, ts) DO NOTHING");
  });
  it("another type answers 200 and stores nothing", async () => {
    const { post, calls } = await start();
    const res = await post(JSON.stringify({ type: "post_call_audio", data: {} }));
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });
  it("a post_call_transcription that fails its schema answers 400", async () => {
    const { post } = await start();
    expect((await post(JSON.stringify({ type: "post_call_transcription", data: {} }))).status).toBe(400);
  });
  it("a failing insert answers 503", async () => {
    const { post } = await start();
    // second server whose db throws
    vi.spyOn(console, "error").mockImplementation(() => {});
    const app = express();
    app.use(createElevenLabsWebhookRouter({ db: { query: async () => { throw new Error("boom"); } }, now: () => new Date(NOW) }));
    const server = app.listen(0);
    servers.push(server);
    await new Promise((resolve) => server.once("listening", resolve));
    const body = call();
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/webhooks/elevenlabs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ElevenLabs-Signature": sign(body) },
      body,
    });
    expect(res.status).toBe(503);
    void post;
  });
  it("no db answers 503", async () => {
    const { post } = await start({ noDb: true });
    expect((await post(call())).status).toBe(503);
  });
  it("the route works while express.json is mounted after it", async () => {
    const { post, calls } = await start({ viaApp: true });
    // createApp's clock is real, so sign with the real time
    const body = call();
    expect((await post(body, sign(body, Math.floor(Date.now() / 1000)))).status).toBe(200);
    expect(calls).toHaveLength(1);
  });
});

describe("signature", () => {
  it("no secret answers 503", async () => {
    const { post } = await start();
    delete process.env.ELEVENLABS_WEBHOOK_SECRET;
    expect((await post(call())).status).toBe(503);
  });
  it("a missing signature answers 401", async () => {
    const { post } = await start();
    const res = await post(call(), null);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });
  it("a wrong signature answers 401", async () => {
    const { post, calls } = await start();
    expect((await post(call(), `t=${NOW / 1000},v0=${"0".repeat(64)}`)).status).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it("a body changed after signing answers 401", async () => {
    const { post } = await start();
    expect((await post(call(), sign(call({ conversation_id: "other" })))).status).toBe(401);
  });
  it("a signature older than 30 minutes answers 401", async () => {
    const { post } = await start();
    const body = call();
    expect((await post(body, sign(body, NOW / 1000 - SIGNATURE_TOLERANCE_S - 1))).status).toBe(401);
    expect((await post(body, sign(body, NOW / 1000 - SIGNATURE_TOLERANCE_S))).status).toBe(200);
  });
  it("a second v0 that matches is accepted", async () => {
    const { post } = await start();
    const body = call();
    expect((await post(body, `${sign(body)},v0=${"1".repeat(64)}`)).status).toBe(200);
    expect((await post(body, `t=${NOW / 1000},v0=${"1".repeat(64)},${sign(body).split(",")[1]}`)).status).toBe(200);
  });
  it("a body that is not JSON answers 400", async () => {
    const { post } = await start();
    const res = await post("not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
  });
});

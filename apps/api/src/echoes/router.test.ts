import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tx } from "../seam.js";
import { ECHO_LIMIT, ECHO_MAX_BYTES, INSERT_BLOB, INSERT_ECHO, createEchoesRouter } from "./router.js";

process.env.SESSION_SECRET = "test-secret";

const ECHO_ID = "6f1c2a3b-0000-4000-8000-000000000001";
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
function fakeTx(fail?: Error) {
  const calls: Call[] = [];
  const log = { calls, rolledBack: false };
  const db = {
    query: async (text: string, params?: unknown[]) => {
      calls.push({ text, params: params as any[] });
      if (fail) throw fail;
      return { rows: text === INSERT_ECHO ? [{ id: ECHO_ID }] : [], rowCount: 1 };
    },
  };
  const tx: Tx = async (fn) => {
    try {
      return await fn(db);
    } catch (err) {
      log.rolledBack = true;
      throw err;
    }
  };
  return { calls, log, tx, db };
}

async function start(deps: Parameters<typeof createEchoesRouter>[0]) {
  const app = express();
  app.use(express.json());
  app.use(createEchoesRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = await new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject("anon:test")
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
  return (body: FormData | string, auth = true) =>
    fetch(`${base}/echoes`, {
      method: "POST",
      headers: {
        ...(typeof body === "string" ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
}

const AUDIO = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3]);
function echo(fields: { siteId?: string; consent?: string | null; type?: string; bytes?: Uint8Array<ArrayBuffer> } = {}) {
  const form = new FormData();
  form.set("siteId", fields.siteId ?? "mx");
  if (fields.consent !== null) form.set("consent", fields.consent ?? "true");
  form.set("audio", new Blob([fields.bytes ?? AUDIO], { type: fields.type ?? "audio/webm" }), "echo.webm");
  return form;
}

async function expectError(res: Response, status: number, error: string) {
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ error });
}

describe("POST /echoes", () => {
  it("no token is 401", async () => {
    const f = fakeTx();
    const res = await (await start({ tx: f.tx }))(echo(), false);
    expect(res.status).toBe(401);
    expect(f.calls).toHaveLength(0);
  });

  it("a webm echo is stored and answers 201 pending", async () => {
    const f = fakeTx();
    const res = await (await start({ tx: f.tx }))(echo());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: ECHO_ID, status: "pending" });
    expect(f.calls.map((c) => c.text)).toEqual([INSERT_BLOB, INSERT_ECHO]);
    const [key, type, data] = f.calls[0]!.params;
    expect(key).toMatch(/^echo-[0-9a-f-]{36}$/);
    expect(type).toBe("audio/webm");
    expect(new Uint8Array(data)).toEqual(AUDIO);
    expect(f.calls[1]!.params[0]).toBe("mx");
    expect(f.calls[1]!.params[3]).toBe(`/blob/${key}`);
  });

  it("an mp4 echo with a codecs parameter is stored", async () => {
    const f = fakeTx();
    const res = await (await start({ tx: f.tx }))(echo({ type: "audio/mp4;codecs=mp4a.40.2" }));
    expect(res.status).toBe(201);
    expect(f.calls[0]!.params[1]).toBe("audio/mp4;codecs=mp4a.40.2");
  });

  it("an anonymous echo stores anon_id and no author_sub", async () => {
    const f = fakeTx();
    await (await start({ tx: f.tx }))(echo());
    const [, authorSub, anonId] = f.calls[1]!.params;
    expect(authorSub).toBeNull();
    expect(anonId).toBe("anon:test");
  });

  it("consent missing is 400", async () => {
    const f = fakeTx();
    await expectError(await (await start({ tx: f.tx }))(echo({ consent: null })), 400, "invalid_echo");
    expect(f.calls).toHaveLength(0);
  });

  it("consent false is 400", async () => {
    const f = fakeTx();
    await expectError(await (await start({ tx: f.tx }))(echo({ consent: "false" })), 400, "invalid_echo");
    expect(f.calls).toHaveLength(0);
  });

  it("an audio/wav file is 400", async () => {
    const f = fakeTx();
    await expectError(await (await start({ tx: f.tx }))(echo({ type: "audio/wav" })), 400, "invalid_echo");
    expect(f.calls).toHaveLength(0);
  });

  it("an empty file is 400", async () => {
    const f = fakeTx();
    await expectError(await (await start({ tx: f.tx }))(echo({ bytes: new Uint8Array() })), 400, "invalid_echo");
    expect(f.calls).toHaveLength(0);
  });

  it("a JSON body is 400", async () => {
    const f = fakeTx();
    const body = JSON.stringify({ siteId: "mx", consent: "true", audio: "AAAA" });
    await expectError(await (await start({ tx: f.tx }))(body), 400, "invalid_echo");
    expect(f.calls).toHaveLength(0);
  });

  it("an unknown site is 404 unknown_site", async () => {
    await expectError(await (await start({ tx: fakeTx().tx }))(echo({ siteId: "atlantis" })), 404, "unknown_site");
  });

  it("the cathedral is 404 no_echo", async () => {
    await expectError(await (await start({ tx: fakeTx().tx }))(echo({ siteId: "cathedral" })), 404, "no_echo");
  });

  it("a body over 2 MB is 413", async () => {
    const f = fakeTx();
    await expectError(await (await start({ tx: f.tx }))(echo({ bytes: new Uint8Array(ECHO_MAX_BYTES + 1) })), 413, "too_large");
    expect(f.calls).toHaveLength(0);
  });

  it("the sixth echo in ten minutes is 429", async () => {
    const post = await start({ tx: fakeTx().tx });
    for (let i = 0; i < ECHO_LIMIT; i++) expect((await post(echo())).status).toBe(201);
    const res = await post(echo());
    expect(res.headers.get("retry-after")).toBeTruthy();
    await expectError(res, 429, "rate_limited");
  });

  it("the upload answers before Scribe returns", async () => {
    process.env.ELEVENLABS_API_KEY = "test-key";
    try {
      const f = fakeTx();
      const never = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
      const res = await (await start({ tx: f.tx, db: f.db, fetch: never }))(echo());
      expect(res.status).toBe(201);
      await vi.waitFor(() => expect(never).toHaveBeenCalledTimes(1));
    } finally {
      delete process.env.ELEVENLABS_API_KEY;
    }
  });

  it("no database is 503", async () => {
    await expectError(await (await start({}))(echo()), 503, "unavailable");
  });

  it("a database error answers 503, rolls back and logs no audio", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const f = fakeTx(new Error("boom"));
    await expectError(await (await start({ tx: f.tx }))(echo()), 503, "unavailable");
    expect(f.log.rolledBack).toBe(true);
    expect(spy).toHaveBeenCalledWith("echo insert failed: boom");
  });
});

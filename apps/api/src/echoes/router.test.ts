import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PendingEchoes } from "@lampa/shared";
import type { Db, Tx } from "../seam.js";
import { INSERT_EVENTS } from "../events/router.js";
import {
  APPROVE_ECHO, DELETE_BLOB, ECHO_LIMIT, ECHO_MAX_BYTES, INSERT_BLOB, INSERT_ECHO, REJECT_ECHO, SELECT_BLOB, SELECT_PENDING,
  SELECT_STATUS, createEchoesRouter,
} from "./router.js";

const keys = vi.hoisted(() => import("jose").then((jose) => jose.generateKeyPair("RS256")));
// The production requireVisitor with a local key resolver in place of the Auth0 JWKS, as in auth/session.test.ts.
vi.mock("../auth/session.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../auth/session.js")>();
  const { publicKey } = await keys;
  return { ...actual, requireVisitor: actual.makeRequireVisitor(async () => publicKey) };
});

process.env.SESSION_SECRET = "test-secret";
process.env.AUTH0_DOMAIN = "lampa.test";
process.env.AUTH0_AUDIENCE = "https://api.lampa.test";

const anonToken = () => new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject("anon:test")
  .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
const auth0Token = async (permissions: string[]) => new SignJWT({ permissions }).setProtectedHeader({ alg: "RS256" })
  .setSubject("auth0|curator").setIssuer("https://lampa.test/").setAudience("https://api.lampa.test")
  .setIssuedAt().setExpirationTime("1h").sign((await keys).privateKey);

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
  const token = await anonToken();
  const post = (body: FormData | string, auth = true) =>
    fetch(`${base}/echoes`, {
      method: "POST",
      headers: {
        ...(typeof body === "string" ? { "Content-Type": "application/json" } : {}),
        ...(auth ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
  const get = (path: string, bearer?: string, method = "GET") =>
    fetch(base + path, { method, headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });
  return Object.assign(post, { get, moderate: (path: string, bearer?: string) => get(path, bearer, "POST") });
}

function readDb(rows: any[]) {
  const calls: Call[] = [];
  const query = async (text: string, params?: unknown[]) => {
    calls.push({ text, params: params as any[] });
    return { rows, rowCount: rows.length };
  };
  return { calls, db: { query } };
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

const blobRow = (status: string | null, type = "audio/webm") => ({ content_type: type, data: Buffer.from(AUDIO), status });

describe("GET /blob/:key", () => {
  it("approved audio is served without a token", async () => {
    const r = readDb([blobRow("approved", "audio/mp4;codecs=mp4a.40.2")]);
    const res = await (await start({ db: r.db })).get("/blob/echo-abc");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/mp4;codecs=mp4a.40.2");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(AUDIO);
    expect(r.calls).toEqual([{ text: SELECT_BLOB, params: ["echo-abc"] }]);
  });

  it("pending audio without a token is 401", async () => {
    await expectError(await (await start({ db: readDb([blobRow("pending")]).db })).get("/blob/echo-abc"), 401, "unauthorized");
  });

  it("pending audio with an anonymous token is 403", async () => {
    const get = (await start({ db: readDb([blobRow("pending")]).db })).get;
    await expectError(await get("/blob/echo-abc", await anonToken()), 403, "forbidden");
  });

  it("pending audio with moderate:echo is served with no-store", async () => {
    const get = (await start({ db: readDb([blobRow("pending")]).db })).get;
    await expectError(await get("/blob/echo-abc", await auth0Token(["moderate"])), 403, "forbidden");
    const res = await get("/blob/echo-abc", await auth0Token(["moderate:echo"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(AUDIO);
  });

  it("an unknown blob key is 404", async () => {
    await expectError(await (await start({ db: readDb([]).db })).get("/blob/echo-none"), 404, "unknown_blob");
    await expectError(await (await start({ db: readDb([blobRow(null)]).db })).get("/blob/place-x"), 404, "unknown_blob");
  });
  it("a site blob is public", async () => {
    const r = readDb([blobRow(null, "audio/mpeg")]);
    const res = await (await start({ db: r.db })).get("/blob/site-theresia-bastion_greeting-en-0123456789ab.mp3");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/mpeg");
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(AUDIO);
  });

  it("a blob with no echo and no site prefix is 404", async () => {
    await expectError(await (await start({ db: readDb([blobRow(null, "audio/mpeg")]).db })).get("/blob/sites_x.mp3"), 404, "unknown_blob");
  });
});

describe("GET /echoes?status=pending", () => {
  const rows = [
    { id: "e1", site_id: "mx", created_at: new Date("2026-11-13T20:00:00Z"), lang: null, transcript: null, audio_url: "/blob/echo-1" },
    { id: "e2", site_id: "unirii", created_at: new Date("2026-11-13T21:00:00Z"), lang: "ron", transcript: "Aici.", audio_url: "/blob/echo-2" },
  ];

  it("the pending list needs moderate:echo", async () => {
    const r = readDb(rows);
    const get = (await start({ db: r.db })).get;
    expect((await get("/echoes?status=pending")).status).toBe(401);
    await expectError(await get("/echoes?status=pending", await anonToken()), 403, "forbidden");
    await expectError(await get("/echoes?status=pending", await auth0Token([])), 403, "forbidden");
    expect(r.calls).toHaveLength(0);
  });

  it("the pending list is oldest first and passes PendingEchoes", async () => {
    const r = readDb(rows);
    const res = await (await start({ db: r.db })).get("/echoes?status=pending", await auth0Token(["moderate:echo"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(PendingEchoes.parse(body)).toEqual(body);
    expect(body.echoes).toEqual([
      { id: "e1", siteId: "mx", createdAt: "2026-11-13T20:00:00.000Z", lang: null, transcript: null, audioUrl: "/blob/echo-1" },
      { id: "e2", siteId: "unirii", createdAt: "2026-11-13T21:00:00.000Z", lang: "ron", transcript: "Aici.", audioUrl: "/blob/echo-2" },
    ]);
    expect(r.calls[0]!.text).toBe(SELECT_PENDING);
    expect(SELECT_PENDING).toMatch(/WHERE status = 'pending' ORDER BY created_at ASC/);
  });

  it("status=approved is 400", async () => {
    const r = readDb(rows);
    const get = (await start({ db: r.db })).get;
    await expectError(await get("/echoes?status=approved", await auth0Token(["moderate:echo"])), 400, "invalid_status");
    expect(r.calls).toHaveLength(0);
  });
});

/** A fake Db that answers each query by its text, and a fake Tx over it. */
function scriptDb(answers: Map<string, any[]>) {
  const calls: Call[] = [];
  const db: Db = {
    query: async (text, params) => {
      calls.push({ text, params: params as any[] });
      const rows = answers.get(text) ?? [];
      return { rows, rowCount: rows.length };
    },
  };
  const tx: Tx = (fn) => fn(db);
  return { calls, db, tx };
}

describe("POST /echoes/:id/approve and /reject", () => {
  const approved = { site_id: "mx", audio_url: "/blob/echo-1", transcript: "Aici.", lang: "ron", anon_id: "anon:author", author_sub: null };
  const curator = () => auth0Token(["moderate:echo"]);
  const approving = () => scriptDb(new Map([[APPROVE_ECHO, [approved]]]));
  const rejecting = () => scriptDb(new Map([[REJECT_ECHO, [{ audio_url: "/blob/echo-1" }]]]));

  it("approve without moderate:echo is 403", async () => {
    const s = approving();
    const post = await start({ db: s.db, tx: s.tx });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/approve`, await auth0Token([])), 403, "forbidden");
    expect(s.calls).toHaveLength(0);
  });

  it("approve with an anonymous token is 403", async () => {
    const s = approving();
    const post = await start({ db: s.db, tx: s.tx });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/approve`, await anonToken()), 403, "forbidden");
    expect(s.calls).toHaveLength(0);
  });

  it("reject without moderate:echo is 403", async () => {
    const s = rejecting();
    const post = await start({ db: s.db, tx: s.tx });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/reject`, await auth0Token(["moderate"])), 403, "forbidden");
    expect(s.calls).toHaveLength(0);
  });

  it("approve without a token is 401", async () => {
    const s = approving();
    const post = await start({ db: s.db, tx: s.tx });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/approve`), 401, "unauthorized");
    expect(s.calls).toHaveLength(0);
  });

  it("approve sets approved and answers 204", async () => {
    const s = approving();
    const res = await (await start({ db: s.db, tx: s.tx })).moderate(`/echoes/${ECHO_ID}/approve`, await curator());
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(s.calls[0]).toEqual({ text: APPROVE_ECHO, params: [ECHO_ID] });
    expect(APPROVE_ECHO).toMatch(/SET status = 'approved', public_audio_url = audio_url\nWHERE id = \$1 AND status = 'pending'/);
  });

  it("approve stores one echo_approved event with weight 5", async () => {
    const s = approving();
    const onStored = vi.fn();
    await (await start({ db: s.db, tx: s.tx, onStored })).moderate(`/echoes/${ECHO_ID}/approve`, await curator());
    const events = s.calls.filter((c) => c.text === INSERT_EVENTS);
    expect(events).toHaveLength(1);
    const [sessionId, userSub, ts, siteIds, kinds, weights] = events[0]!.params;
    expect([sessionId, userSub, siteIds, kinds, weights]).toEqual(["anon:author", null, ["mx"], ["echo_approved"], [5]]);
    expect(Math.abs(Date.parse(ts[0]) - Date.now())).toBeLessThan(10_000);
    expect(onStored).toHaveBeenCalledTimes(1);
  });

  it("approve emits echo_approved to screen and the site room", async () => {
    const s = approving();
    const emit = vi.fn();
    await (await start({ db: s.db, tx: s.tx, emit })).moderate(`/echoes/${ECHO_ID}/approve`, await curator());
    const message = { echoId: ECHO_ID, siteId: "mx", audioUrl: "/blob/echo-1", transcript: "Aici.", lang: "ron" };
    expect(emit.mock.calls).toEqual([
      ["screen", "echo_approved", message],
      ["site:mx", "echo_approved", message],
    ]);
  });

  it("approve of an approved echo is 409", async () => {
    const s = scriptDb(new Map([[SELECT_STATUS, [{ status: "approved" }]]]));
    const emit = vi.fn();
    const post = await start({ db: s.db, tx: s.tx, emit });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/approve`, await curator()), 409, "not_pending");
    expect(s.calls.map((c) => c.text)).toEqual([APPROVE_ECHO, SELECT_STATUS]);
    expect(emit).not.toHaveBeenCalled();
  });

  it("approve of an unknown id is 404", async () => {
    const s = scriptDb(new Map());
    const post = await start({ db: s.db, tx: s.tx });
    await expectError(await post.moderate(`/echoes/${ECHO_ID}/approve`, await curator()), 404, "unknown_echo");
    await expectError(await post.moderate("/echoes/not-a-uuid/approve", await curator()), 404, "unknown_echo");
    expect(s.calls.map((c) => c.text)).toEqual([APPROVE_ECHO, SELECT_STATUS]);
  });

  it("reject sets rejected and deletes the blob", async () => {
    const s = rejecting();
    const res = await (await start({ db: s.db, tx: s.tx })).moderate(`/echoes/${ECHO_ID}/reject`, await curator());
    expect(res.status).toBe(204);
    expect(s.calls).toEqual([
      { text: REJECT_ECHO, params: [ECHO_ID] },
      { text: DELETE_BLOB, params: ["echo-1"] },
    ]);
  });

  it("reject emits nothing", async () => {
    const s = rejecting();
    const emit = vi.fn();
    const onStored = vi.fn();
    await (await start({ db: s.db, tx: s.tx, emit, onStored })).moderate(`/echoes/${ECHO_ID}/reject`, await curator());
    expect(emit).not.toHaveBeenCalled();
    expect(onStored).not.toHaveBeenCalled();
    expect(s.calls.some((c) => c.text === INSERT_EVENTS)).toBe(false);
  });
});

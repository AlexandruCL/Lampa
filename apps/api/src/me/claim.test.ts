import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db, Tx } from "../seam.js";
import { CLAIM_ECHOES, CLAIM_EVENTS, CLAIM_PANES, createClaimRouter } from "./claim.js";

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

const ANON = "anon:11111111-1111-4111-8111-111111111111";
const AUTH0 = "auth0|keeper";
const anonToken = (sub = ANON, exp: number | string = "1h") => new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject(sub)
  .setIssuedAt().setExpirationTime(exp).sign(new TextEncoder().encode("test-secret"));
const auth0Token = async () => new SignJWT({ permissions: [] }).setProtectedHeader({ alg: "RS256" }).setSubject(AUTH0)
  .setIssuer("https://lampa.test/").setAudience("https://api.lampa.test").setIssuedAt().setExpirationTime("1h")
  .sign((await keys).privateKey);

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
function fakeTx(counts: Record<string, number>, fail?: Error) {
  const calls: Call[] = [];
  const log = { calls, rolledBack: false };
  const db: Db = {
    query: async (text, params) => {
      calls.push({ text, params: params as any[] });
      if (fail && calls.length === 2) throw fail;
      return { rows: [], rowCount: counts[text] ?? 0 };
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
  return { log, tx };
}

async function start(deps: Parameters<typeof createClaimRouter>[0]) {
  const app = express();
  app.use(express.json());
  app.use(createClaimRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (bearer: string | undefined, body: unknown) =>
    fetch(`${base}/me/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
    });
}

async function expectError(res: Response, status: number, error: string) {
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ error });
}

describe("POST /me/claim", () => {
  it("no token is 401", async () => {
    const f = fakeTx({});
    await expectError(await (await start({ tx: f.tx }))(undefined, { anonToken: await anonToken() }), 401, "unauthorized");
    expect(f.log.calls).toHaveLength(0);
  });

  it("an anonymous caller is 403", async () => {
    const f = fakeTx({});
    const token = await anonToken();
    await expectError(await (await start({ tx: f.tx }))(token, { anonToken: token }), 403, "forbidden");
    expect(f.log.calls).toHaveLength(0);
  });

  it("a tampered anonToken is 400", async () => {
    const f = fakeTx({});
    const [header, , signature] = (await anonToken()).split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "anon:someone-else", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    const post = await start({ tx: f.tx });
    await expectError(await post(await auth0Token(), { anonToken: `${header}.${forged}.${signature}` }), 400, "invalid_anon_token");
    expect(f.log.calls).toHaveLength(0);
  });

  it("an expired anonToken is 400", async () => {
    const f = fakeTx({});
    const expired = await anonToken(ANON, Math.floor(Date.now() / 1000) - 60);
    await expectError(await (await start({ tx: f.tx }))(await auth0Token(), { anonToken: expired }), 400, "invalid_anon_token");
    expect(f.log.calls).toHaveLength(0);
  });

  it("an Auth0 token passed as anonToken is 400", async () => {
    const f = fakeTx({});
    const token = await auth0Token();
    await expectError(await (await start({ tx: f.tx }))(token, { anonToken: token }), 400, "invalid_anon_token");
    expect(f.log.calls).toHaveLength(0);
  });

  it("a valid claim runs the three updates with the two subs and answers the counts", async () => {
    const f = fakeTx({ [CLAIM_PANES]: 2, [CLAIM_ECHOES]: 1, [CLAIM_EVENTS]: 14 });
    const res = await (await start({ tx: f.tx }))(await auth0Token(), { anonToken: await anonToken() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ panes: 2, echoes: 1, events: 14 });
    expect(f.log.calls).toEqual([CLAIM_PANES, CLAIM_ECHOES, CLAIM_EVENTS].map((text) => ({ text, params: [ANON, AUTH0] })));
    expect(CLAIM_EVENTS).not.toMatch(/SET[^W]*session_id/);
  });

  it("a database error rolls back and answers 503", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const f = fakeTx({}, new Error("boom"));
    await expectError(await (await start({ tx: f.tx }))(await auth0Token(), { anonToken: await anonToken() }), 503, "unavailable");
    expect(f.log.rolledBack).toBe(true);
    expect(f.log.calls).toHaveLength(2);
    expect(spy).toHaveBeenCalledWith("claim failed: boom");
  });
});

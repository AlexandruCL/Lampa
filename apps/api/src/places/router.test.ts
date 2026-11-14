import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlaceIn } from "@lampa/shared";
import { PLACE_LIMIT } from "./content.js";
import { UPSERT_DRAFT, createPlacesRouter } from "./router.js";

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
  .setSubject("auth0|admin").setIssuer("https://lampa.test/").setAudience("https://api.lampa.test")
  .setIssuedAt().setExpirationTime("1h").sign((await keys).privateKey);
const adminToken = () => auth0Token(["write:site"]);

const PLACE: PlaceIn = {
  name: { ro: "Bastionul Theresia", en: "Theresia Bastion" },
  lat: 45.7537,
  lng: 21.2317,
  facts: [
    { text: "The bastion is the largest remaining piece of the city walls.", source: "https://example.org/a" },
    { text: "It was built in the eighteenth century by the Habsburgs.", source: "https://example.org/b" },
  ],
  persona: "An old brick wall that remembers the soldiers and the markets.",
  interactions: ["talk", "colours"],
};
const ID = "theresia-bastion";

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  vi.restoreAllMocks();
});

type Call = { text: string; params: any[] };
/** published: the upsert's WHERE sites.status = 'draft' fails, so no row comes back. */
function fakeDb({ published = false } = {}) {
  const calls: Call[] = [];
  const db = {
    query: async (text: string, params?: unknown[]) => {
      calls.push({ text, params: params as any[] });
      const rows = published ? [] : [{ id: (params as any[])[0] }];
      return { rows, rowCount: rows.length };
    },
  };
  return { calls, db };
}

async function start(deps: Parameters<typeof createPlacesRouter>[0]) {
  const app = express();
  app.use(express.json());
  app.use(createPlacesRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (body: unknown, bearer?: string) =>
    fetch(`${base}/sites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
    });
}

async function expectError(res: Response, status: number, error: string) {
  expect(res.status).toBe(status);
  expect(await res.json()).toEqual({ error });
}

describe("POST /sites", () => {
  it("no token is 401", async () => {
    const f = fakeDb();
    const res = await (await start({ db: f.db }))(PLACE);
    expect(res.status).toBe(401);
    expect(f.calls).toHaveLength(0);
  });

  it("an anonymous token is 403", async () => {
    const f = fakeDb();
    await expectError(await (await start({ db: f.db }))(PLACE, await anonToken()), 403, "forbidden");
    expect(f.calls).toHaveLength(0);
  });

  it("an Auth0 token without write:site is 403", async () => {
    const f = fakeDb();
    await expectError(await (await start({ db: f.db }))(PLACE, await auth0Token(["moderate:echo"])), 403, "forbidden");
    expect(f.calls).toHaveLength(0);
  });

  it("a valid place answers 201 draft", async () => {
    const f = fakeDb();
    const res = await (await start({ db: f.db }))(PLACE, await adminToken());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: ID, status: "draft" });
  });

  it("the stored row is a draft with the derived id", async () => {
    const f = fakeDb();
    await (await start({ db: f.db }))(PLACE, await adminToken());
    expect(f.calls).toHaveLength(1);
    const { text, params } = f.calls[0]!;
    expect(text).toBe(UPSERT_DRAFT);
    expect(text).toContain("'draft')");
    expect(text).toContain("WHERE sites.status = 'draft' RETURNING id");
    expect(text).not.toContain("'published'");
    expect(params[0]).toBe(ID);
    expect(params[2]).toBe(ID);
    expect(params[12]).toBe(false);
    expect(JSON.parse(params[8]).voice).toBe("2V7k6GOisfFlHlBdz8ec");
  });

  it("the same draft again is 201", async () => {
    const f = fakeDb();
    const post = await start({ db: f.db });
    const token = await adminToken();
    expect((await post(PLACE, token)).status).toBe(201);
    const res = await post(PLACE, token);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: ID, status: "draft" });
    expect(f.calls).toHaveLength(2);
  });

  it("a published id is 409 site_exists", async () => {
    const f = fakeDb({ published: true });
    await expectError(await (await start({ db: f.db }))(PLACE, await adminToken()), 409, "site_exists");
  });

  it("one fact is 400 invalid_place", async () => {
    const f = fakeDb();
    const body = { ...PLACE, facts: PLACE.facts.slice(0, 1) };
    await expectError(await (await start({ db: f.db }))(body, await adminToken()), 400, "invalid_place");
    expect(f.calls).toHaveLength(0);
  });

  it("a source that is not https is 400", async () => {
    const f = fakeDb();
    const body = { ...PLACE, facts: [PLACE.facts[0], { ...PLACE.facts[1], source: "http://example.org/b" }] };
    await expectError(await (await start({ db: f.db }))(body, await adminToken()), 400, "invalid_place");
    expect(f.calls).toHaveLength(0);
  });

  it("a name of only symbols is 400 invalid_id", async () => {
    const f = fakeDb();
    const body = { ...PLACE, name: { ro: "Bastionul", en: "!?* ---" } };
    await expectError(await (await start({ db: f.db }))(body, await adminToken()), 400, "invalid_id");
    expect(f.calls).toHaveLength(0);
  });

  it("the eleventh place in an hour is 429", async () => {
    const f = fakeDb();
    const post = await start({ db: f.db });
    const token = await adminToken();
    for (let i = 0; i < PLACE_LIMIT; i++) expect((await post(PLACE, token)).status).toBe(201);
    const res = await post(PLACE, token);
    await expectError(res, 429, "rate_limited");
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(f.calls).toHaveLength(PLACE_LIMIT);
  });

  it("no database is 503", async () => {
    await expectError(await (await start({}))(PLACE, await adminToken()), 503, "unavailable");
  });
});

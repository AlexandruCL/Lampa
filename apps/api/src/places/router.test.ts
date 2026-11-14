import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaceIn } from "@lampa/shared";
import { PLACE_LIMIT, greeting, placeSiteFile } from "./content.js";
import { INSERT_SITE_BLOB, SELECT_SITE_KEYS } from "./publish.js";
import { PUBLISH_DRAFT, SELECT_PLACE, UPSERT_DRAFT, createPlacesRouter } from "./router.js";

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

/** One place row and a blobs table in memory. */
function placeDb({ status = "draft", row = true } = {}) {
  const site = placeSiteFile(ID, PLACE);
  const place = {
    id: ID, name: site.name, lat: PLACE.lat, lng: PLACE.lng, interactions: site.interactions,
    persona: site.persona, facts: site.facts, status,
  };
  const keys = new Set<string>();
  const calls: Call[] = [];
  const db = {
    query: async (text: string, params: any[] = []) => {
      calls.push({ text, params });
      if (text === SELECT_PLACE) return { rows: row ? [place] : [], rowCount: row ? 1 : 0 };
      if (text === SELECT_SITE_KEYS) {
        const rows = [...keys].filter((k) => k.startsWith(params[0])).map((key) => ({ key }));
        return { rows, rowCount: rows.length };
      }
      if (text === INSERT_SITE_BLOB) keys.add(params[0]);
      return { rows: [], rowCount: 1 };
    },
  };
  return { db, calls, keys };
}

const okFetch = () => vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

async function startPublish(deps: Parameters<typeof createPlacesRouter>[0]) {
  const app = express();
  app.use(express.json());
  app.use(createPlacesRouter(deps));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return async (body: unknown, { id = ID, bearer }: { id?: string; bearer?: string } = {}) =>
    fetch(`${base}/sites/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer ?? (await adminToken())}` },
      body: JSON.stringify(body),
    });
}

describe("POST /sites/:id/publish", () => {
  beforeEach(() => void (process.env.ELEVENLABS_API_KEY = "sk_test_key"));
  afterEach(() => void delete process.env.ELEVENLABS_API_KEY);

  it("publish without write:site is 403", async () => {
    const p = placeDb();
    const publish = await startPublish({ db: p.db, fetch: okFetch() });
    await expectError(await publish({ step: "live" }, { bearer: await auth0Token(["moderate:echo"]) }), 403, "forbidden");
    expect(p.calls).toHaveLength(0);
  });

  it("an unknown step is 400", async () => {
    const publish = await startPublish({ db: placeDb().db });
    await expectError(await publish({ step: "music" }), 400, "invalid_step");
  });

  it("an unknown site is 404", async () => {
    const publish = await startPublish({ db: placeDb({ row: false }).db });
    await expectError(await publish({ step: "greeting" }), 404, "unknown_site");
    await expectError(await publish({ step: "greeting" }, { id: "Bad_Id" }), 404, "unknown_site");
  });

  it("a published site is 409", async () => {
    const f = okFetch();
    const publish = await startPublish({ db: placeDb({ status: "published" }).db, fetch: f });
    for (const step of ["greeting", "bed", "live"]) await expectError(await publish({ step }), 409, "already_published");
    expect(f).not.toHaveBeenCalled();
  });

  it("greeting answers 200 with its credits", async () => {
    const p = placeDb();
    const f = okFetch();
    const res = await (await startPublish({ db: p.db, fetch: f }))({ step: "greeting" });
    expect(res.status).toBe(200);
    const { ro, en } = greeting(PLACE.name);
    expect(await res.json()).toEqual({ step: "greeting", credits: [...ro].length + [...en].length });
    expect(f).toHaveBeenCalledTimes(2);
    expect(p.keys.size).toBe(2);
  });

  it("a second greeting answers 200 with 0 credits", async () => {
    const p = placeDb();
    const f = okFetch();
    const publish = await startPublish({ db: p.db, fetch: f });
    expect((await publish({ step: "greeting" })).status).toBe(200);
    const res = await publish({ step: "greeting" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ step: "greeting", credits: 0 });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("a failed generation is 502", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const f = vi.fn(async () => new Response("nope", { status: 500 }));
    await expectError(await (await startPublish({ db: placeDb().db, fetch: f }))({ step: "bed" }), 502, "generation_failed");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]![0]).toMatch(/^place publish failed: theresia-bastion\/bed-1-[0-9a-f]{12}\.wav 500$/);
  });

  it("no key is 503", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const f = okFetch();
    await expectError(await (await startPublish({ db: placeDb().db, fetch: f }))({ step: "greeting" }), 503, "unavailable");
    expect(f).not.toHaveBeenCalled();
  });

  it("live publishes the draft and nudges glow", async () => {
    const p = placeDb();
    const onStored = vi.fn();
    const res = await (await startPublish({ db: p.db, onStored }))({ step: "live" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ step: "live", credits: 0 });
    expect(p.calls.map((c) => c.text)).toEqual([SELECT_PLACE, PUBLISH_DRAFT]);
    expect(p.calls[1]!.params).toEqual([ID]);
    expect(onStored).toHaveBeenCalledTimes(1);
  });
});

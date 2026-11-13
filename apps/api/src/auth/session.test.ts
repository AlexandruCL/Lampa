import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { SignJWT, generateKeyPair } from "jose";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { makeRequireVisitor, visitorLimiter } from "./session.js";

process.env.SESSION_SECRET = "test-secret";
delete process.env.AUTH0_DOMAIN;
delete process.env.AUTH0_AUDIENCE;

const { publicKey, privateKey } = await generateKeyPair("RS256");
let server: Server;
let base: string;

beforeAll(async () => {
  const app = createApp();
  // The production requireVisitor with a local key resolver in place of the Auth0 JWKS.
  app.get("/probe", makeRequireVisitor(async () => publicKey), visitorLimiter, (req, res) => {
    res.json(req.visitor);
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));
afterEach(() => vi.unstubAllEnvs());

const probe = (token?: string) =>
  fetch(`${base}/probe`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
const postAnon = (ip?: string) =>
  fetch(`${base}/session/anon`, { method: "POST", headers: ip ? { "X-Forwarded-For": ip } : {} });
const hs256 = (sub: string, secret = "test-secret", exp: number | string = "1h") =>
  new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret));
const rs256 = (audience: string) =>
  new SignJWT({ permissions: ["curate", "moderate"] }).setProtectedHeader({ alg: "RS256" }).setSubject("auth0|abc")
    .setIssuer("https://lampa.test/").setAudience(audience).setIssuedAt().setExpirationTime("1h").sign(privateKey);
const useAuth0 = () => {
  vi.stubEnv("AUTH0_DOMAIN", "lampa.test");
  vi.stubEnv("AUTH0_AUDIENCE", "https://api.lampa.test");
};
const expect401 = async (res: Response) => {
  expect(res.status).toBe(401);
  expect(await res.json()).toEqual({ error: "unauthorized" });
};

describe("session tokens", () => {
  it("anon token from POST /session/anon passes and sets sub anon:<uuid>, kind anon, no permissions", async () => {
    const res = await postAnon();
    expect(res.status).toBe(200);
    const { token, expiresAt } = await res.json();
    expect(Date.parse(expiresAt) - Date.now()).toBeGreaterThan(24 * 3600_000 - 60_000);
    const visitor = await (await probe(token)).json();
    expect(visitor).toEqual({ sub: expect.stringMatching(/^anon:[0-9a-f-]{36}$/), kind: "anon", permissions: [] });
  });

  it("expired anon token is rejected with 401", async () => {
    await expect401(await probe(await hs256("anon:old", "test-secret", Math.floor(Date.now() / 1000) - 60)));
  });

  it("tampered anon token is rejected with 401", async () => {
    const [header, payload, signature] = (await hs256("anon:11111111-1111-1111-1111-111111111111")).split(".");
    const claims = Buffer.from(payload, "base64url").toString().replace("1111\"", "1112\"");
    const tampered = [header, Buffer.from(claims).toString("base64url"), signature].join(".");
    await expect401(await probe(tampered));
  });

  it("token signed with another secret is rejected with 401", async () => {
    await expect401(await probe(await hs256("anon:x", "another-secret")));
  });

  it("alg none is rejected with 401", async () => {
    const part = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    await expect401(await probe(`${part({ alg: "none" })}.${part({ sub: "anon:x" })}.`));
  });

  it("missing Authorization header is rejected with 401", async () => {
    await expect401(await probe());
  });

  it("RS256 token is rejected with 401 while AUTH0_DOMAIN is unset", async () => {
    await expect401(await probe(await rs256("https://api.lampa.test")));
  });

  it("RS256 token with the right issuer and audience passes with kind auth0 and its permissions", async () => {
    useAuth0();
    const res = await probe(await rs256("https://api.lampa.test"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sub: "auth0|abc", kind: "auth0", permissions: ["curate", "moderate"] });
  });

  it("RS256 token with another audience is rejected with 401", async () => {
    useAuth0();
    await expect401(await probe(await rs256("https://other.example")));
  });
});

describe("rate limits", () => {
  it("11th POST /session/anon in a minute gets 429 with Retry-After", async () => {
    // A client IP of its own (trust proxy 1) so the other tests' POSTs do not count.
    for (let i = 0; i < 10; i++) expect((await postAnon("203.0.113.7")).status).toBe(200);
    const res = await postAnon("203.0.113.7");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
  });

  it("121st visitor request in a minute gets 429 with Retry-After", async () => {
    const token = await hs256("anon:rate-limit-test");
    for (let i = 0; i < 120; i++) expect((await probe(token)).status).toBe(200);
    const res = await probe(token);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
  });
});

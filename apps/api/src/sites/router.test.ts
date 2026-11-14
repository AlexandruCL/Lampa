import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db } from "../seam.js";
import { createSitesRouter, parseNear, SITE_SQL } from "./router.js";

let servers: Server[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
});

const nearRow = { id: "mx", name: { en: "Mix", ro: "Mixo" }, lat: 44.4, lng: 26.1, is_memorial: false, distance_m: 12.5 };
const siteRow = {
  id: "mx", name: { en: "Mix", ro: "Mixo" }, lat: 44.4, lng: 26.1, is_memorial: false,
  radius_m: 40, interactions: ["candle"], facts: [{ a: 1 }], directions_hint: { en: "Go left", ro: "Stanga" },
};

async function start(rows: any[] = [], opts: { glow?: any; noDb?: boolean; fail?: boolean } = {}) {
  const calls: { text: string; params?: unknown[] }[] = [];
  const db: Db = {
    query: async (text, params) => {
      calls.push({ text, params });
      if (opts.fail) throw new Error("boom");
      return { rows, rowCount: rows.length };
    },
  };
  const app = express();
  app.use(createSitesRouter({ db: opts.noDb ? undefined : db, latestGlow: () => opts.glow ?? null }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { get: (path: string) => fetch(base + path), calls };
}

describe("parseNear", () => {
  it("parseNear reads lat,lng", () => {
    expect(parseNear("44.4,26.1")).toEqual({ lat: 44.4, lng: 26.1 });
    expect(parseNear("-90,180")).toEqual({ lat: -90, lng: 180 });
  });
  it("parseNear rejects a missing value, one number, text, three numbers and a latitude of 91", () => {
    for (const v of [undefined, "44.4", "a,b", "1,2,3", "91,0", "0,181", ",", "1,"]) expect(parseNear(v)).toBeNull();
  });
});

describe("GET /sites", () => {
  it("near passes the longitude before the latitude to the query", async () => {
    const { get, calls } = await start([]);
    await get("/sites?near=44.4,26.1");
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual([26.1, 44.4]);
  });
  it("near answers NearbySites with the English name, distance_m and the glow of latestGlow", async () => {
    const { get } = await start([nearRow], { glow: { sites: [{ siteId: "mx", glow: 0.4 }] } });
    const res = await get("/sites?near=44.4,26.1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sites: [{ ...nearRow, name: "Mix", glow: 0.4 }] });
  });
  it("glow is 0 while latestGlow is null", async () => {
    const { get } = await start([nearRow]);
    expect((await (await get("/sites?near=44.4,26.1")).json()).sites[0].glow).toBe(0);
  });
  it("a missing or malformed near answers 400 invalid_near and runs no query", async () => {
    const { get, calls } = await start([nearRow]);
    for (const q of ["", "?near=x", "?near=91,0"]) {
      const res = await get("/sites" + q);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_near" });
    }
    expect(calls).toHaveLength(0);
  });
});

describe("GET /sites/:id", () => {
  it("sites/:id answers SiteDetail in Romanian for lang=ro and in English for any other lang", async () => {
    const { get, calls } = await start([siteRow], { glow: { sites: [{ siteId: "mx", glow: 0.2 }] } });
    const ro = await (await get("/sites/mx?lang=ro")).json();
    expect(ro).toEqual({
      id: "mx", name: "Mixo", lat: 44.4, lng: 26.1, is_memorial: false, radius_m: 40,
      interactions: ["candle"], facts: [{ a: 1 }], directions_hint: "Stanga", glow: 0.2,
    });
    expect((await (await get("/sites/mx?lang=fr")).json()).name).toBe("Mix");
    expect((await (await get("/sites/mx")).json()).directions_hint).toBe("Go left");
    expect(calls[0].params).toEqual(["mx"]);
  });
  it("directions_hint falls back to en and then to an empty string", async () => {
    const a = await start([{ ...siteRow, directions_hint: { en: "Go left" } }]);
    expect((await (await a.get("/sites/mx?lang=ro")).json()).directions_hint).toBe("Go left");
    const b = await start([{ ...siteRow, directions_hint: {} }]);
    expect((await (await b.get("/sites/mx?lang=ro")).json()).directions_hint).toBe("");
  });
  it("a place with a bed in blobs answers its path; SITE_SQL looks only at take 1 of this site", async () => {
    const { get } = await start([{ ...siteRow, id: "new-place", bed_key: "site-new-place_bed-1-abc123abc123.wav" }]);
    expect((await (await get("/sites/new-place")).json()).bed).toBe("/blob/site-new-place_bed-1-abc123abc123.wav");
    expect(SITE_SQL).toContain("'site-' || sites.id || '_bed-1-'");
  });
  it("an unknown id answers 404 unknown_site", async () => {
    const res = await (await start([])).get("/sites/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_site" });
  });
  it("SITE_SQL does not select persona and the answer holds no persona key", async () => {
    expect(SITE_SQL).not.toMatch(/persona/i);
    const body = await (await (await start([{ ...siteRow, persona: { prompt: "x" } }])).get("/sites/mx")).json();
    expect(body).not.toHaveProperty("persona");
  });
});

describe("both routes", () => {
  it("without a database both routes answer 503 unavailable", async () => {
    const { get } = await start([], { noDb: true });
    for (const p of ["/sites?near=44.4,26.1", "/sites/mx"]) {
      const res = await get(p);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "unavailable" });
    }
  });
  it("a failing query answers 503 unavailable", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { get } = await start([], { fail: true });
    for (const p of ["/sites?near=44.4,26.1", "/sites/mx"]) {
      const res = await get(p);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "unavailable" });
    }
    expect(err).toHaveBeenCalledWith("sites query failed: boom");
  });
  it("both routes answer without a token", async () => {
    const { get } = await start([nearRow]);
    expect((await get("/sites?near=44.4,26.1")).status).toBe(200);
    const d = await start([siteRow]);
    expect((await d.get("/sites/mx")).status).toBe(200);
  });
});

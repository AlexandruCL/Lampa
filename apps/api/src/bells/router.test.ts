import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it } from "vitest";
import { createBellsRouter } from "./router.js";

process.env.SESSION_SECRET = "test-secret";

const NOW = 1_800_000_000_000;
let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
});

async function start() {
  const emitted: unknown[][] = [];
  const clock = { now: NOW };
  const app = express();
  app.use(express.json());
  app.use(createBellsRouter({ emit: (...a) => void emitted.push(a), now: () => clock.now }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = (sub: string) =>
    new SignJWT().setProtectedHeader({ alg: "HS256" }).setSubject(sub).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode("test-secret"));
  const post = async (body: unknown, sub: string | null = "anon:a") =>
    fetch(`${base}/bells/ring`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(sub ? { Authorization: `Bearer ${await token(sub)}` } : {}) },
      body: JSON.stringify(body),
    });
  return { post, emitted, clock };
}

const ring = (tower: string, at = NOW, siteId = "unirii") => ({ siteId, tower, at });

describe("POST /bells/ring", () => {
  it("answers 204 and emits the bell to the site room", async () => {
    const { post, emitted } = await start();
    expect((await post(ring("catholic", NOW - 500))).status).toBe(204);
    expect(emitted).toEqual([["site:unirii", "bell", ring("catholic", NOW - 500)]]);
  });

  it("replaces a time more than 2 seconds from the server clock", async () => {
    const { post, emitted } = await start();
    await post(ring("serbian", NOW + 2001));
    expect(emitted[0][2]).toEqual(ring("serbian", NOW));
  });

  it("a bad body is 400, an unknown site 404, no token 401", async () => {
    const { post, emitted } = await start();
    expect((await post(ring("orthodox"))).status).toBe(400);
    expect((await post(ring("catholic", NOW, "nowhere"))).status).toBe(404);
    expect((await post(ring("catholic"), null)).status).toBe(401);
    expect(emitted).toEqual([]);
  });

  it("the sixth ring of one visitor in a second is 429", async () => {
    const { post } = await start();
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await post(ring("catholic"))).status);
    expect(statuses).toEqual([204, 204, 204, 204, 204, 429]);
  });

  it("three rings together emit one harmony to the site and the screen, then none for 10 seconds", async () => {
    const { post, emitted, clock } = await start();
    // a new pair of visitors each round, so the rate limit stays out of it
    const round = async (n: number) => {
      for (let i = 0; i < 3; i++) {
        clock.now += 1000;
        await post(ring("catholic", clock.now), `anon:a${n}`);
        await post(ring("serbian", clock.now + 100), `anon:b${n}`);
      }
    };
    await round(1);
    const harmonies = () => emitted.filter((e) => e[1] === "harmony");
    expect(harmonies()).toEqual([
      ["site:unirii", "harmony", { siteId: "unirii", at: clock.now }],
      ["screen", "harmony", { siteId: "unirii", at: clock.now }],
    ]);
    await round(2); // 3 seconds later: inside the cooldown
    expect(harmonies()).toHaveLength(2);
  });
});

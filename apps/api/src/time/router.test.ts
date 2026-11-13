import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { TimeNow } from "@lampa/shared";
import { createTimeRouter } from "./router.js";

let servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
});

async function get() {
  const app = express();
  app.use(createTimeRouter({ now: () => 1_700_000_000_123 }));
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  return fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/time`);
}

describe("GET /time", () => {
  it("GET /time answers 200 with now from the clock", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ now: 1_700_000_000_123 });
  });

  it("the body parses as TimeNow", async () => {
    expect(TimeNow.parse(await (await get()).json()).now).toBe(1_700_000_000_123);
  });

  it("Cache-Control is no-store", async () => {
    expect((await get()).headers.get("cache-control")).toBe("no-store");
  });

  it("no token is needed", async () => {
    expect((await get()).status).toBe(200);
  });
});

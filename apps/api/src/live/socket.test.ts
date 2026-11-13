import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { GlowMessage, SocketMessage, sites } from "@lampa/shared";
import { Server, type Namespace } from "socket.io";
import { io, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Live } from "../seam.js";
import { attachLive, roomsFor } from "./socket.js";

const ids = sites.map((s) => s.id);
const glowA: GlowMessage = { sites: [{ siteId: "mx", glow: 0.4 }, { siteId: "cathedral", glow: 0 }] };
const glowB: GlowMessage = { sites: [{ siteId: "mx", glow: 0.7 }] };

let http: HttpServer;
let live: Live;
let nsp: Namespace;
let latest: GlowMessage | null;
let base: string;
let clients: Socket[];

beforeEach(async () => {
  latest = null;
  clients = [];
  // The /live namespace attachLive makes, so a test can look at the server sockets.
  const of = vi.spyOn(Server.prototype, "of");
  http = createServer();
  live = attachLive(http, { origin: undefined, latestGlow: () => latest });
  // The Server constructor calls of("/") itself, so pick the call by its name.
  nsp = of.mock.results[of.mock.calls.findIndex(([name]) => name === "/live")].value as Namespace;
  of.mockRestore();
  http.listen(0, "127.0.0.1");
  await new Promise((resolve) => http.once("listening", resolve));
  base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
});
afterEach(async () => {
  clients.forEach((c) => c.close());
  await live.close();
});

/** A connected client of /live; every glow it receives lands in `glows`. */
async function connect(room?: string) {
  const socket = io(`${base}/live`, { transports: ["websocket"], query: room === undefined ? {} : { room } });
  clients.push(socket);
  const glows: unknown[] = [];
  socket.on(SocketMessage.enum.glow, (m: unknown) => glows.push(m));
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return { socket, glows };
}
const nextGlow = (glows: unknown[], n = 1) => vi.waitFor(() => {
  expect(glows.length).toBeGreaterThanOrEqual(n);
  return glows[n - 1];
});

describe("roomsFor", () => {
  it("roomsFor gives city alone for no room, an unknown room, an unknown site and an array", () => {
    for (const room of [undefined, "lobby", "site:nowhere", ["screen"], ["site:mx"]]) expect(roomsFor(room, ids)).toEqual(["city"]);
  });

  it("roomsFor adds screen, and site:mx for a seeded site", () => {
    expect(ids).toContain("mx");
    expect(roomsFor("screen", ids)).toEqual(["city", "screen"]);
    expect(roomsFor("site:mx", ids)).toEqual(["city", "site:mx"]);
  });
});

describe("/live", () => {
  it("a client with room screen receives a glow message that parses as GlowMessage", async () => {
    const { glows } = await connect("screen");
    live.emitGlow(glowA);
    expect(GlowMessage.parse(await nextGlow(glows))).toEqual(glowA);
  });

  it("a client with room site:mx receives the same glow message", async () => {
    const screen = await connect("screen");
    const site = await connect("site:mx");
    live.emitGlow(glowA);
    expect(await nextGlow(site.glows)).toEqual(await nextGlow(screen.glows));
    expect(site.glows[0]).toEqual(glowA);
  });

  it("a new client gets the latest glow on connect", async () => {
    latest = glowA;
    const { glows } = await connect("screen");
    expect(await nextGlow(glows)).toEqual(glowA);
  });

  it("a new client gets nothing on connect while the latest glow is null", async () => {
    const { glows } = await connect("screen");
    // Messages arrive in order: if a glow had come on connect, it would be first.
    live.emitGlow(glowB);
    expect(await nextGlow(glows)).toEqual(glowB);
    expect(glows).toHaveLength(1);
  });

  it("emitGlow throws on a glow above 1 and sends nothing", async () => {
    const { glows } = await connect("screen");
    expect(() => live.emitGlow({ sites: [{ siteId: "mx", glow: 1.5 }] })).toThrow();
    live.emitGlow(glowB);
    expect(await nextGlow(glows)).toEqual(glowB);
    expect(glows).toHaveLength(1);
  });

  it("a server socket is in the rooms roomsFor gives", async () => {
    const { socket } = await connect("site:mx");
    const [server] = await nsp.fetchSockets();
    expect(server.id).toBe(socket.id);
    expect(new Set(server.rooms)).toEqual(new Set([server.id, ...roomsFor("site:mx", ids)]));
  });
});

import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { GlowMessage, type PaneMessage, SocketMessage, sites, type WindowCompleteMessage } from "@lampa/shared";
import { Server, type Namespace } from "socket.io";
import { io, type Socket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Live } from "../seam.js";
import { attachLive, paneRooms, roomsFor } from "./socket.js";

const ids = sites.map((s) => s.id);
const glowA: GlowMessage = { sites: [{ siteId: "mx", glow: 0.4 }, { siteId: "cathedral", glow: 0 }] };
const glowB: GlowMessage = { sites: [{ siteId: "mx", glow: 0.7 }] };
const other = ids.find((id) => id !== "mx")!;
const paneMx: PaneMessage = { siteId: "mx", windowId: "w-mx", slot: 3, hex: "#a1b2c3" };
const paneGallery: PaneMessage = { siteId: "gallery", windowId: "w-gallery", slot: 0, hex: "#102030" };
const completeMx: WindowCompleteMessage = { siteId: "mx", windowId: "w-mx" };

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

/** A connected client of /live; every glow it receives lands in `glows`, and every message, as [kind, body], in `all`. */
async function connect(room?: string) {
  const socket = io(`${base}/live`, { transports: ["websocket"], query: room === undefined ? {} : { room } });
  clients.push(socket);
  const glows: unknown[] = [];
  const all: [string, unknown][] = [];
  socket.on(SocketMessage.enum.glow, (m: unknown) => glows.push(m));
  socket.onAny((kind: string, m: unknown) => all.push([kind, m]));
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return { socket, glows, all };
}
/** Sends a glow to every socket and waits until each client has it: anything sent before it has arrived by then. */
async function barrier(...clients: { glows: unknown[] }[]) {
  live.emitGlow(glowB);
  await Promise.all(clients.map((c) => vi.waitFor(() => expect(c.glows).toContainEqual(glowB))));
}
const kinds = (all: [string, unknown][], kind: string) => all.filter(([k]) => k === kind).map(([, m]) => m);
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

describe("pane and window_complete", () => {
  it("paneRooms gives the site room and screen, and screen alone for the Gallery", () => {
    expect(paneRooms("mx")).toEqual(["site:mx", "screen"]);
    expect(paneRooms("gallery")).toEqual(["screen"]);
  });

  it("a pane reaches the screen room and its site room", async () => {
    const screen = await connect("screen");
    const site = await connect("site:mx");
    // A socket in both rooms still gets the pane once.
    const both = await connect("screen");
    const server = (await nsp.fetchSockets()).find((s) => s.id === both.socket.id)!;
    server.join("site:mx");
    live.emitPane(paneMx);
    await barrier(screen, site, both);
    expect(kinds(screen.all, SocketMessage.enum.pane)).toEqual([paneMx]);
    expect(kinds(site.all, SocketMessage.enum.pane)).toEqual([paneMx]);
    expect(kinds(both.all, SocketMessage.enum.pane)).toEqual([paneMx]);
  });

  it("a pane does not reach another site's room or a city-only socket", async () => {
    const elsewhere = await connect(`site:${other}`);
    const city = await connect();
    live.emitPane(paneMx);
    await barrier(elsewhere, city);
    expect(kinds(elsewhere.all, SocketMessage.enum.pane)).toEqual([]);
    expect(kinds(city.all, SocketMessage.enum.pane)).toEqual([]);
  });

  it("a Gallery pane reaches only the screen room", async () => {
    const screen = await connect("screen");
    const site = await connect("site:mx");
    const city = await connect();
    live.emitPane(paneGallery);
    await barrier(screen, site, city);
    expect(kinds(screen.all, SocketMessage.enum.pane)).toEqual([paneGallery]);
    expect(kinds(site.all, SocketMessage.enum.pane)).toEqual([]);
    expect(kinds(city.all, SocketMessage.enum.pane)).toEqual([]);
  });

  it("window_complete reaches the screen room and its site room", async () => {
    const screen = await connect("screen");
    const site = await connect("site:mx");
    const elsewhere = await connect(`site:${other}`);
    const city = await connect();
    live.emitWindowComplete(completeMx);
    await barrier(screen, site, elsewhere, city);
    expect(kinds(screen.all, SocketMessage.enum.window_complete)).toEqual([completeMx]);
    expect(kinds(site.all, SocketMessage.enum.window_complete)).toEqual([completeMx]);
    expect(kinds(elsewhere.all, SocketMessage.enum.window_complete)).toEqual([]);
    expect(kinds(city.all, SocketMessage.enum.window_complete)).toEqual([]);
  });

  it("an invalid pane throws and nothing is sent", async () => {
    const screen = await connect("screen");
    expect(() => live.emitPane({ ...paneMx, slot: 48 })).toThrow();
    live.emitPane(paneMx);
    // Messages arrive in order: had the invalid pane gone out, it would be first.
    await vi.waitFor(() => expect(kinds(screen.all, SocketMessage.enum.pane)).toHaveLength(1));
    expect(kinds(screen.all, SocketMessage.enum.pane)).toEqual([paneMx]);
  });

  it("pane then window_complete arrive in that order", async () => {
    const screen = await connect("screen");
    live.emitPane(paneMx);
    live.emitWindowComplete(completeMx);
    await vi.waitFor(() => expect(screen.all).toHaveLength(2));
    expect(screen.all).toEqual([
      [SocketMessage.enum.pane, paneMx],
      [SocketMessage.enum.window_complete, completeMx],
    ]);
  });
});

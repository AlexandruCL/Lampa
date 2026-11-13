import type { Server as HttpServer } from "node:http";
import { GlowMessage, SocketMessage, sites } from "@lampa/shared";
import { Server } from "socket.io";
import type { LatestGlow, Live } from "../seam.js";

/** Always "city"; plus "screen" or "site:<id>" for a known id. Anything else, an array included, adds nothing. */
export function roomsFor(room: unknown, siteIds: string[]): string[] {
  if (room === "screen") return ["city", "screen"];
  if (typeof room === "string" && room.startsWith("site:") && siteIds.includes(room.slice(5))) return ["city", room];
  return ["city"];
}

export function attachLive(server: HttpServer, { origin, latestGlow }: { origin: string | undefined; latestGlow: LatestGlow }): Live {
  const io = new Server(server, { cors: { origin } });
  const live = io.of("/live");
  const ids = sites.map((s) => s.id);
  live.on("connection", (socket) => {
    socket.join(roomsFor(socket.handshake.query.room, ids));
    const latest = latestGlow();
    if (latest !== null) socket.emit(SocketMessage.enum.glow, latest);
  });
  return {
    // Both clients drop a bad message silently, so parse throws before anything is sent.
    emitGlow: (message) => void live.emit(SocketMessage.enum.glow, GlowMessage.parse(message)),
    close: () => io.close(),
  };
}

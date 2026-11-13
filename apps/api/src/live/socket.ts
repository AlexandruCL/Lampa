import type { Server as HttpServer } from "node:http";
import { CandleMessage, GlowMessage, LampsMessage, PaneMessage, SocketMessage, sites, WindowCompleteMessage } from "@lampa/shared";
import { Server } from "socket.io";
import { GALLERY_SITE_ID } from "../panes/slots.js";
import type { LatestGlow, LatestLamps, Live } from "../seam.js";

/** Always "city"; plus "screen" or "site:<id>" for a known id. Anything else, an array included, adds nothing. */
export function roomsFor(room: unknown, siteIds: string[]): string[] {
  if (room === "screen") return ["city", "screen"];
  if (typeof room === "string" && room.startsWith("site:") && siteIds.includes(room.slice(5))) return ["city", room];
  return ["city"];
}

/** The rooms a pane or window_complete of this site goes to: the Gallery has no site room (Fabi's decision, hour 7). */
export function paneRooms(siteId: string): string[] {
  return siteId === GALLERY_SITE_ID ? ["screen"] : ["site:" + siteId, "screen"];
}

// latestLamps is optional so the existing socket tests compile unchanged.
export function attachLive(server: HttpServer, { origin, latestGlow, latestLamps }: { origin: string | undefined; latestGlow: LatestGlow; latestLamps?: LatestLamps }): Live {
  const io = new Server(server, { cors: { origin } });
  const live = io.of("/live");
  const ids = sites.map((s) => s.id);
  live.on("connection", (socket) => {
    socket.join(roomsFor(socket.handshake.query.room, ids));
    const latest = latestGlow();
    if (latest !== null) socket.emit(SocketMessage.enum.glow, latest);
    const lamps = latestLamps?.() ?? null;
    if (lamps !== null) socket.emit(SocketMessage.enum.lamps, lamps);
  });
  return {
    // Both clients drop a bad message silently, so parse throws before anything is sent.
    emitGlow: (message) => void live.emit(SocketMessage.enum.glow, GlowMessage.parse(message)),
    // to() with several rooms sends once per socket, even to a socket in two of them.
    emitPane: (message) => {
      const parsed = PaneMessage.parse(message);
      live.to(paneRooms(parsed.siteId)).emit(SocketMessage.enum.pane, parsed);
    },
    emitWindowComplete: (message) => {
      const parsed = WindowCompleteMessage.parse(message);
      live.to(paneRooms(parsed.siteId)).emit(SocketMessage.enum.window_complete, parsed);
    },
    emit: (room, message, payload) => void live.to(room).emit(message, payload),
    emitLamps: (message) => void live.emit(SocketMessage.enum.lamps, LampsMessage.parse(message)),
    emitCandle: (message) => {
      const parsed = CandleMessage.parse(message);
      live.to(["site:" + parsed.siteId, "screen"]).emit(SocketMessage.enum.candle, parsed);
    },
    close: () => io.close(),
  };
}

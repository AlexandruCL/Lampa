import type { Server as HttpServer } from "node:http";
import { CandleMessage, FinaleMessage, GlowMessage, LampsMessage, PaneMessage, SocketMessage, sites, WindowCompleteMessage } from "@lampa/shared";
import { Server } from "socket.io";
import { GALLERY_SITE_ID } from "../panes/slots.js";
import type { Db, LatestGlow, LatestLamps, Live } from "../seam.js";

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

/** The same rule as `GET /sites/:id`, so a place published from the console gets its room without a redeploy. */
export const PUBLISHED_IDS_SQL = `SELECT id FROM sites WHERE status = 'published'`;

// latestLamps and db are optional so the existing socket tests compile unchanged.
export function attachLive(server: HttpServer, { origin, latestGlow, latestLamps, db }: { origin: string | undefined; latestGlow: LatestGlow; latestLamps?: LatestLamps; db?: Db }): Live {
  const io = new Server(server, { cors: { origin } });
  const live = io.of("/live");
  const seeded = sites.map((s) => s.id);
  const publishedIds = (d: Db) =>
    d.query(PUBLISHED_IDS_SQL).then(
      (r) => r.rows.map((row: { id: string }) => row.id),
      (err: Error) => {
        console.error(`live rooms query failed: ${err.message}`);
        return seeded; // the five seeded sites, as before the table was read
      },
    );
  live.on("connection", async (socket) => {
    // Only a site room needs the table; no db keeps the join synchronous.
    const room = socket.handshake.query.room;
    const ids = db && typeof room === "string" && room.startsWith("site:") ? await publishedIds(db) : seeded;
    if (socket.disconnected) return; // left during the query: joining now would leave a stale room entry
    socket.join(roomsFor(room, ids));
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
    // Not replayed on connect: a late joiner does not get the finale (Fabi's decision, hour 27).
    emitFinale: (message) => void live.emit(SocketMessage.enum.finale, FinaleMessage.parse(message)),
    close: () => io.close(),
  };
}

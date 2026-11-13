import { createServer } from "node:http";
import { createApp } from "./app.js";
import { asDb, asTx, createPool } from "./db/pool.js";
import { startGlowLoop } from "./glow/loop.js";
import { attachLive } from "./live/socket.js";
import type { GlowLoop, OnEventsStored, OnPane } from "./seam.js";

const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? createPool() : undefined;
if (pool) pool.on("error", (err) => console.error(`db pool error: ${err.message}`));
else console.log("DATABASE_URL is not set: events, sites and glow are off");
const db = pool && asDb(pool);
const tx = pool && asTx(pool);

let loop: GlowLoop | undefined;
const latestGlow = () => loop?.latest() ?? null;
const latestLamps = () => loop?.latestLamps() ?? null;
const onPane: OnPane = (pane, completed) => {
  live.emitPane(pane);
  if (completed) live.emitWindowComplete({ siteId: pane.siteId, windowId: pane.windowId });
  loop?.nudge();
};
// Candles go out, then the glow and lamps nudge; the loop sends lamps.
const onEventsStored: OnEventsStored = (candles = []) => {
  for (const candle of candles) live.emitCandle(candle);
  loop?.nudge();
};
const server = createServer(createApp({ db, tx, onEventsStored, onPane, latestGlow }));
const live = attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow, latestLamps });
if (db) loop = startGlowLoop({ db, emit: live.emitGlow, emitLamps: live.emitLamps });
server.listen(port, () => console.log(`api listening on ${port}`));

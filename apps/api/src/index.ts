import { createServer } from "node:http";
import { createApp } from "./app.js";
import { asDb, createPool } from "./db/pool.js";
import { startGlowLoop } from "./glow/loop.js";
import { attachLive } from "./live/socket.js";
import type { GlowLoop } from "./seam.js";

const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? createPool() : undefined;
if (pool) pool.on("error", (err) => console.error(`db pool error: ${err.message}`));
else console.log("DATABASE_URL is not set: events, sites and glow are off");
const db = pool && asDb(pool);

let loop: GlowLoop | undefined;
const latestGlow = () => loop?.latest() ?? null;
const server = createServer(createApp({ db, onEventsStored: () => loop?.nudge(), latestGlow }));
const live = attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow });
if (db) loop = startGlowLoop({ db, emit: live.emitGlow });
server.listen(port, () => console.log(`api listening on ${port}`));

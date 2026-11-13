import { createServer } from "node:http";
import { createApp } from "./app.js";
import { asDb, createPool } from "./db/pool.js";
import { attachLive } from "./live/socket.js";

const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? createPool() : undefined;
if (pool) pool.on("error", (err) => console.error(`db pool error: ${err.message}`));
else console.log("DATABASE_URL is not set: events, sites and glow are off");
const db = pool && asDb(pool);

const server = createServer(createApp({ db }));
attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow: () => null });
server.listen(port, () => console.log(`api listening on ${port}`));

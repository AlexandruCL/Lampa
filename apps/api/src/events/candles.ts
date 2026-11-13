import { createHash } from "node:crypto";

/** A public id for a candle: a hash of its time and session, so the session never leaves the server. */
export const candleId = (ts: Date, sessionId: string): string =>
  createHash("sha256").update(`${ts.toISOString()}|${sessionId}`).digest("hex").slice(0, 16);

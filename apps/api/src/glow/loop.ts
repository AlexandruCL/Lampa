import type { GlowMessage } from "@lampa/shared";
import type { Db, GlowLoop } from "../seam.js";

// Stub: B1-3.d.1 replaces this file.
export function startGlowLoop(_deps: { db: Db; emit: (message: GlowMessage) => void; intervalMs?: number; now?: () => Date }): GlowLoop {
  return { tick: async () => {}, nudge: () => {}, latest: () => null, stop: () => {} };
}

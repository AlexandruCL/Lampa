import type { Server as HttpServer } from "node:http";
import type { LatestGlow, Live } from "../seam.js";

// Stub: B1-2.a.1 replaces this file.
export function roomsFor(_room: unknown, _siteIds: string[]): string[] {
  return ["city"];
}

export function attachLive(_server: HttpServer, _opts: { origin: string | undefined; latestGlow: LatestGlow }): Live {
  return { emitGlow: () => {}, close: async () => {} };
}

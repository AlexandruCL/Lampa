import type { GlowMessage } from "@lampa/shared";

/** The one database call the routers and the loop use. `asDb(pool)` in `db/pool.ts` makes one. */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
};

/** The last glow message sent, or null before the first one. */
export type LatestGlow = () => GlowMessage | null;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = { emitGlow: (message: GlowMessage) => void; close: () => Promise<void> };

/** `startGlowLoop` in `glow/loop.ts` returns this. */
export type GlowLoop = { tick: () => Promise<void>; nudge: () => void; latest: LatestGlow; stop: () => void };

export type AppDeps = { db?: Db; onEventsStored?: () => void; latestGlow?: LatestGlow };

import type { GlowMessage, PaneMessage, WindowCompleteMessage } from "@lampa/shared";

/** The one database call the routers and the loop use. `asDb(pool)` in `db/pool.ts` makes one. */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
};

/** Runs fn on one client between BEGIN and COMMIT; ROLLBACK and rethrow on error. `asTx(pool)` in `db/pool.ts` makes one. */
export type Tx = <T>(fn: (db: Db) => Promise<T>) => Promise<T>;

/** The last glow message sent, or null before the first one. */
export type LatestGlow = () => GlowMessage | null;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = {
  emitGlow: (message: GlowMessage) => void;
  emitPane: (message: PaneMessage) => void;
  emitWindowComplete: (message: WindowCompleteMessage) => void;
  close: () => Promise<void>;
};

/** `startGlowLoop` in `glow/loop.ts` returns this. */
export type GlowLoop = { tick: () => Promise<void>; nudge: () => void; latest: LatestGlow; stop: () => void };

/** Called after a pane is committed: its message, and whether it completed its window. */
export type OnPane = (pane: PaneMessage, completed: boolean) => void;

export type AppDeps = { db?: Db; tx?: Tx; onEventsStored?: () => void; onPane?: OnPane; latestGlow?: LatestGlow };

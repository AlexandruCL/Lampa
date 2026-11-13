import type { CandleMessage, GlowMessage, LampsMessage, PaneMessage, WindowCompleteMessage } from "@lampa/shared";

/** The one database call the routers and the loop use. `asDb(pool)` in `db/pool.ts` makes one. */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
};

/** Runs fn on one client between BEGIN and COMMIT; ROLLBACK and rethrow on error. `asTx(pool)` in `db/pool.ts` makes one. */
export type Tx = <T>(fn: (db: Db) => Promise<T>) => Promise<T>;

/** The last glow message sent, or null before the first one. */
export type LatestGlow = () => GlowMessage | null;

/** The last lamps message sent, or null before the first one. */
export type LatestLamps = () => LampsMessage | null;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = {
  emitGlow: (message: GlowMessage) => void;
  emitPane: (message: PaneMessage) => void;
  emitWindowComplete: (message: WindowCompleteMessage) => void;
  emitLamps: (message: LampsMessage) => void;
  emitCandle: (message: CandleMessage) => void;
  close: () => Promise<void>;
};

/** `startGlowLoop` in `glow/loop.ts` returns this. */
export type GlowLoop = { tick: () => Promise<void>; nudge: () => void; latest: LatestGlow; latestLamps: LatestLamps; stop: () => void };

/** Called after a pane is committed: its message, and whether it completed its window. */
export type OnPane = (pane: PaneMessage, completed: boolean) => void;

/** Called after rows are stored: the candles among them, as messages (often none). Optional so a caller with no candles (Cristea's echoes router) can pass it as `() => void`. */
export type OnEventsStored = (candles?: CandleMessage[]) => void;

export type AppDeps = { db?: Db; tx?: Tx; onEventsStored?: OnEventsStored; onPane?: OnPane; latestGlow?: LatestGlow };

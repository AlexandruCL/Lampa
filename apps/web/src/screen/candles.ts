import { CandleMessage, sites } from "@lampa/shared";

export const CANDLE_TAU_MS = 6 * 3600_000;
export const CANDLE_MIN_DECAY = 0.05;
export const CANDLE_MAX = 200;
export const CANDLE_RADIUS_U = 3;
export const CANDLE_HALO = 3;
export const CANDLE_SPREAD = 0.85;

export type Candle = { id: string; litAt: number };

export const candleDecay = (litAt: number, now: number) => Math.exp(-(now - litAt) / CANDLE_TAU_MS);

export const candleAlpha = (decay: number) => 0.25 + 0.65 * decay;

const memorialIds = new Set(sites.filter((s) => s.is_memorial).map((s) => s.id));

export function applyCandle(list: Candle[], message: unknown, now: number): Candle[] {
  const parsed = CandleMessage.safeParse(message);
  if (!parsed.success || !memorialIds.has(parsed.data.siteId)) return list;
  const litAt = Date.parse(parsed.data.litAt);
  if (Number.isNaN(litAt) || list.some((c) => c.id === parsed.data.id)) return list;
  return [...list, { id: parsed.data.id, litAt }]
    .filter((c) => candleDecay(c.litAt, now) >= CANDLE_MIN_DECAY)
    .sort((a, b) => a.litAt - b.litAt)
    .slice(-CANDLE_MAX);
}

export const applyCandleState = (list: Candle[], candles: CandleMessage[], now: number) =>
  candles.reduce((acc, c) => applyCandle(acc, c, now), list);

export function candlePosition(id: string): { dx: number; dy: number } {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(id)) hash = Math.imul(hash ^ byte, 0x01000193);
  hash >>>= 0;
  const angle = ((hash & 0xffff) / 65536) * 2 * Math.PI;
  const distance = Math.sqrt((hash >>> 16) / 65536) * CANDLE_SPREAD;
  return { dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance };
}

import type { BellTower } from "@lampa/shared";

export type Ring = { tower: BellTower; at: number };

export const HARMONY_RINGS = 3;
export const PAIR_MS = 300;
export const HARMONY_WINDOW_MS = 6000;
export const COOLDOWN_MS = 10_000;
export const KEEP_MS = 10_000;

/** The rings of the last 10 seconds. */
export function pruneRings(rings: Ring[], nowMs: number): Ring[] {
  return rings.filter((r) => r.at > nowMs - KEEP_MS);
}

/**
 * True when the last three rings of each tower pair up in order, each pair at most 300 ms apart,
 * all within the last 6 seconds, and no harmony was declared in the last 10 seconds.
 */
export function judgeHarmony(rings: Ring[], nowMs: number, lastHarmonyMs = -Infinity): boolean {
  if (nowMs - lastHarmonyMs < COOLDOWN_MS) return false;
  const last = (tower: BellTower) =>
    rings
      .filter((r) => r.tower === tower && r.at >= nowMs - HARMONY_WINDOW_MS)
      .map((r) => r.at)
      .sort((a, b) => a - b)
      .slice(-HARMONY_RINGS);
  const [a, b] = [last("catholic"), last("serbian")];
  return a.length === HARMONY_RINGS && b.length === HARMONY_RINGS && a.every((at, i) => Math.abs(at - b[i]) <= PAIR_MS);
}

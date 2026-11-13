export const WINDOW_SLOTS = 48;
export const PANES_PER_HOUR = 5; // per visitor subject per site (the Gallery is one site), Fabi's decision, hour 7
export const RATE_WINDOW_MS = 3_600_000;
export const GALLERY_SITE_ID = "gallery";

import type { Visitor } from "../auth/session.js";
import { MAX_EVENT_AGE_MS } from "../events/router.js";

export const paneAuthor = (v: Visitor): { author_sub: string | null; anon_id: string | null } =>
  v.kind === "auth0" ? { author_sub: v.sub, anon_id: null } : { author_sub: null, anon_id: v.sub };

export function lowestEmptySlot(filled: number[]): number | null {
  const taken = new Set(filled);
  for (let i = 0; i < WINDOW_SLOTS; i++) if (!taken.has(i)) return i;
  return null;
}

export const retryAfterS = (oldest: Date, now: Date): number =>
  Math.max(1, Math.ceil((oldest.getTime() + RATE_WINDOW_MS - now.getTime()) / 1000));

export function paneTs(at: string, now: Date): string {
  const t = Date.parse(at);
  return t >= now.getTime() - MAX_EVENT_AGE_MS && t <= now.getTime() ? at : now.toISOString();
}

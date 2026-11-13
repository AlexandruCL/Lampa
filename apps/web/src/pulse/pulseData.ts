import { useEffect, useState } from "react";
import type { z } from "zod";
import { API_URL } from "../api/client";

export const PULSE_POLL_MS = 5000;
export const STALE_MS = 30_000;

export type Card<T> = { data: T | null; error: boolean; updatedAt: number | null };
export type CardResult<T> = { ok: true; data: T } | { ok: false };
export type CardStatus = "loading" | "error" | "stale" | "live";

export const EMPTY_CARD: Card<never> = { data: null, error: false, updatedAt: null };

/** Public read: no token, no session. Never rejects, so the poll cannot leak unhandled rejections. */
export async function fetchCard<T>(
  path: string,
  schema: z.ZodType<T>,
  deps: { fetch: (url: string) => Promise<Response> },
): Promise<CardResult<T>> {
  try {
    const res = await deps.fetch(API_URL + path);
    if (!res.ok) return { ok: false };
    return { ok: true, data: schema.parse(await res.json()) };
  } catch {
    return { ok: false };
  }
}

export function nextCard<T>(prev: Card<T>, result: CardResult<T>, now: number): Card<T> {
  return result.ok ? { data: result.data, error: false, updatedAt: now } : { ...prev, error: true };
}

export function cardStatus(card: Card<unknown>, now: number): CardStatus {
  if (card.error) return "error";
  if (card.data === null || card.updatedAt === null) return "loading";
  return now - card.updatedAt > STALE_MS ? "stale" : "live";
}

export function usePulse<T>(path: string, schema: z.ZodType<T>): Card<T> {
  const [card, setCard] = useState<Card<T>>(EMPTY_CARD);
  useEffect(() => {
    let alive = true;
    const tick = () =>
      // Wrapped: a bare window.fetch called as deps.fetch throws "Illegal invocation".
      fetchCard(path, schema, { fetch: (url) => fetch(url) }).then((r) => {
        if (alive) setCard((prev) => nextCard(prev, r, Date.now()));
      });
    tick();
    const timer = setInterval(tick, PULSE_POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [path, schema]);
  return card;
}

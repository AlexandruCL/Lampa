import { EchoApprovedMessage } from "@lampa/shared";
import type { ScreenEvent } from "./useScreenSocket";

const MINUTE_MS = 60_000;
const MAX_EVENTS = 6;

/** DESIGN.md 7.13 ticker copy. `name` is the pane's English colour name (2.4); a completion and a candle ignore it. */
export function tickerText(event: ScreenEvent, siteName: string, name: string): string {
  if (event.kind === "candle") return "A candle was lit at the Cathedral.";
  if (event.kind === "echo") return `New echo at ${siteName}`;
  return event.kind === "pane" ? `New colour at ${siteName}: ${name}` : `The ${siteName} window is complete.`;
}

/** Newest first, at most six lines, the one memorial line pinned last: a newer candle replaces it (DESIGN.md 6.18). */
export function addTickerEvent(list: ScreenEvent[], event: ScreenEvent): ScreenEvent[] {
  const memorial = event.kind === "candle" ? event : list.find((e) => e.kind === "candle");
  const others = (event.kind === "candle" ? list : [event, ...list]).filter((e) => e.kind !== "candle");
  return memorial ? [...others.slice(0, MAX_EVENTS - 1), memorial] : others.slice(0, MAX_EVENTS);
}

/** An approved echo for one of `siteIds`, or null: the memorial never takes echoes (DESIGN.md 7.11). */
export function parseEcho(message: unknown, siteIds: string[]): EchoApprovedMessage | null {
  const parsed = EchoApprovedMessage.safeParse(message);
  return parsed.success && siteIds.includes(parsed.data.siteId) ? parsed.data : null;
}

export function timeAgo(at: number, now: number): string {
  const minutes = Math.floor((now - at) / MINUTE_MS);
  return minutes < 1 ? "now" : `${minutes} min`;
}

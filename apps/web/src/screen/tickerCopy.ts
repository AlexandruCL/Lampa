import type { ScreenEvent } from "./useScreenSocket";

const MINUTE_MS = 60_000;
const MAX_EVENTS = 6;

/** DESIGN.md 7.13 ticker copy. `name` is the pane's English colour name (2.4); a completion and a candle ignore it. */
export function tickerText(event: ScreenEvent, siteName: string, name: string): string {
  if (event.kind === "candle") return "A candle was lit at the Cathedral.";
  return event.kind === "pane" ? `New colour at ${siteName}: ${name}` : `The ${siteName} window is complete.`;
}

/** Newest first, at most six lines. DESIGN.md 6.18: a newer candle replaces the one memorial line in place. */
export function addTickerEvent(list: ScreenEvent[], event: ScreenEvent): ScreenEvent[] {
  if (event.kind === "candle" && list.some((e) => e.kind === "candle")) return list.map((e) => (e.kind === "candle" ? event : e));
  return [event, ...list].slice(0, MAX_EVENTS);
}

export function timeAgo(at: number, now: number): string {
  const minutes = Math.floor((now - at) / MINUTE_MS);
  return minutes < 1 ? "now" : `${minutes} min`;
}

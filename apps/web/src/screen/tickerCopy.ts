import type { ScreenEvent } from "./useScreenSocket";

const MINUTE_MS = 60_000;

/** DESIGN.md 7.13 ticker copy. `name` is the pane's English colour name (2.4); a completion ignores it. */
export function tickerText(event: ScreenEvent, siteName: string, name: string): string {
  return event.kind === "pane" ? `New colour at ${siteName}: ${name}` : `The ${siteName} window is complete.`;
}

export function timeAgo(at: number, now: number): string {
  const minutes = Math.floor((now - at) / MINUTE_MS);
  return minutes < 1 ? "now" : `${minutes} min`;
}

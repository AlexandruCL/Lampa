import { sites, type PendingEcho } from "@lampa/shared";
import { timeAgo } from "../screen/tickerCopy";

export const QUEUE_REFRESH_MS = 30_000;

// shortcut: only the shared site list is known here, so a site added later shows its id until the queue carries names.
export function siteName(siteId: string): string {
  return sites.find((s) => s.id === siteId)?.name ?? siteId;
}

/** Keeps the selection while it is still pending; otherwise (and on load) the first echo. */
export function keepSelection(echoes: PendingEcho[], selected: string | null): string | null {
  return echoes.some((e) => e.id === selected) ? selected : (echoes[0]?.id ?? null);
}

/** Drops an echo; when it was selected, the next one takes its place, or the one before when it was last. */
export function removeEcho(
  echoes: PendingEcho[],
  id: string,
  selected: string | null,
): { echoes: PendingEcho[]; selected: string | null } {
  const index = echoes.findIndex((e) => e.id === id);
  const rest = echoes.filter((e) => e.id !== id);
  if (selected !== id) return { echoes: rest, selected: keepSelection(rest, selected) };
  return { echoes: rest, selected: rest[Math.min(index, rest.length - 1)]?.id ?? null };
}

/** getAccessTokenSilently error codes that mean the curator has to sign in again. */
export const SESSION_ENDED_CODES: readonly unknown[] = [
  "login_required",
  "consent_required",
  "missing_refresh_token",
  "invalid_grant",
];

export function sessionEnded(err: unknown): boolean {
  return SESSION_ENDED_CODES.includes((err as { error?: unknown } | null)?.error);
}

export function languageName(lang: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(lang) ?? lang;
  } catch {
    return lang;
  }
}

export function ago(createdAt: string, now: number): string {
  const text = timeAgo(Date.parse(createdAt), now);
  return text === "now" ? text : `${text} ago`;
}

/** "Romanian, 4 min ago"; the language is left out when it is null. */
export function metaLine(echo: PendingEcho, now: number): string {
  return [echo.lang && languageName(echo.lang), ago(echo.createdAt, now)].filter(Boolean).join(", ");
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

import {
  LAMP_TARGET,
  sites,
  type PulseColourClock,
  type PulseInteractions,
  type PulseLanguages,
  type PulseSummary,
} from "@lampa/shared";
import { STALE_MS } from "./pulseData";

/** The four colour sites, in the shared order. Charts are built from this list, so the Cathedral and unknown ids never appear. */
export const colourSites = sites.filter((s) => !s.is_memorial);

const LANGUAGE_NAMES: Record<string, string> = { ro: "Română", en: "English", hu: "Magyar", de: "Deutsch", sr: "Srpski" };
export const languageName = (code: string) => LANGUAGE_NAMES[code] ?? code;

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Bucharest",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
/** HH:mm in Timișoara. */
export const hhmm = (ms: number) => timeFormat.format(ms);

/** `openedAt` is when the page opened, for the case where no response has arrived yet. */
export function headerLine(lastResponseAt: number | null, now: number, openedAt: number = now): string {
  if (lastResponseAt === null) return now - openedAt > STALE_MS ? "Not updating." : "Live. Updated every 5 seconds.";
  return now - lastResponseAt > STALE_MS ? `Not updating. Last update ${hhmm(lastResponseAt)}.` : "Live. Updated every 5 seconds.";
}

/** "1 pane", "2 panes". */
export const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const percent = (glow: number) => Math.round(glow * 100);

/** "{n} / 731" split into the value and the rest; "..." while loading (DESIGN 6.13). */
export const lampsValue = (n: number | null) => ({ value: n === null ? "..." : String(n), rest: ` / ${LAMP_TARGET}` });

// Colour clock: angles in degrees, 0 at 12 o'clock, clockwise.
export const segmentAngles = (hour: number) => ({ start: hour * 15, end: (hour + 1) * 15 });

export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** One ring segment, its edges pulled in by half a gap on each side so the --bg underneath shows a gap of `gap` units. */
export function segmentPath(hour: number, cx: number, outer: number, inner: number, gap: number): string {
  const { start, end } = segmentAngles(hour);
  const inset = (r: number) => (Math.asin(gap / 2 / r) * 180) / Math.PI;
  const p = (r: number, deg: number) => {
    const { x, y } = polar(cx, cx, r, deg);
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  };
  return [
    `M ${p(outer, start + inset(outer))}`,
    `A ${outer} ${outer} 0 0 1 ${p(outer, end - inset(outer))}`,
    `L ${p(inner, end - inset(inner))}`,
    `A ${inner} ${inner} 0 0 0 ${p(inner, start + inset(inner))}`,
    "Z",
  ].join(" ");
}

export const clockIsEmpty = (d: PulseColourClock) => d.hours.every((h) => h.panes === 0);

export function colourClockSummary(d: PulseColourClock): string {
  if (clockIsEmpty(d)) return "No colours yet today.";
  const top = d.hours.reduce((a, b) => (b.panes > a.panes ? b : a));
  return `The most colourful hour is ${top.hour}:00, with ${count(top.panes, "pane")}.`;
}

/** The colour sites with data, in the shared order, with their names. */
export const interactionSeries = (d: PulseInteractions) =>
  colourSites.flatMap((s) => {
    const found = d.sites.find((x) => x.siteId === s.id);
    return found ? [{ siteId: s.id, name: s.name, points: found.points }] : [];
  });

export const interactionsAreEmpty = (d: PulseInteractions) =>
  interactionSeries(d).every((s) => s.points.every((p) => p.n === 0));

export function interactionsSummary(d: PulseInteractions): string | null {
  const series = interactionSeries(d);
  if (interactionsAreEmpty(d)) return "No interactions yet today.";
  const last = series.map((s) => ({ name: s.name, n: s.points.at(-1)?.n ?? 0 }));
  const top = last.reduce((a, b) => (b.n > a.n ? b : a));
  if (top.n === 0) return null; // nobody in the last 5 minutes: no "Busiest now"
  return `Busiest now: ${top.name}, ${count(top.n, "interaction")} in the last 5 minutes.`;
}

export const glowRows = (d: PulseSummary) =>
  colourSites.flatMap((s) => {
    const found = d.glow.find((g) => g.siteId === s.id);
    return found ? [{ name: s.name, p: percent(found.glow) }] : [];
  });

export function glowSummary(d: PulseSummary): string {
  const rows = glowRows(d);
  if (rows.length === 0) return "No glow yet today.";
  const top = rows.reduce((a, b) => (b.p > a.p ? b : a));
  return `Brightest now: ${top.name}, ${top.p}%.`;
}

export const languageRows = (d: PulseLanguages) =>
  [...d.languages].sort((a, b) => b.conversations - a.conversations).map((l) => ({ ...l, name: languageName(l.lang) }));

export function languagesSummary(d: PulseLanguages): string {
  const top = languageRows(d)[0];
  return top ? `Most spoken: ${top.name}, ${count(top.conversations, "conversation")} today.` : "No conversations yet today.";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** 0 is 24 h ago, 1 is now. */
export const candleX = (at: number, now: number) => Math.min(1, Math.max(0, (at - (now - DAY_MS)) / DAY_MS));

/** A whole number of px in -8..8, the same for the same id (FNV-1a). */
export function candleJitter(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return ((h >>> 0) % 17) - 8;
}

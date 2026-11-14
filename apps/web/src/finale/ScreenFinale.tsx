import { LAMP_TARGET, sites, type FinaleMessage } from "@lampa/shared";
import { useEffect, useState } from "react";
import { BURST_AT_MS, CRACKLE_MS, FINALE_END_MS, finaleClock, finalePhase, preloadFinale, startFinale } from "../audio/finale";
import { startClockOffset, useClockOffset } from "../lamp/pulse";
import { DESIGN_HEIGHT, labelWidth, MAP_WIDTH, SITE_RADIUS, type layout } from "../screen/projection";
import styles from "./ScreenFinale.module.css";
import { receivedAt, useFinale } from "./useFinale";

/** DESIGN 7.13 "settles back over 4 s": the side-panel lines fade out over this from `at + FINALE_END_MS`. */
export const PANEL_SETTLE_MS = 4000;
// canvas.ts draws the memorial's label as its name line only (NAME.line 36), LABEL_GAP 10 off the circle.
const LABEL_LINE = 36;
const LABEL_GAP = 10;
const MEMORIAL = sites.find((s) => s.is_memorial);

type Placed = ReturnType<typeof layout>;
export type ScreenShown = {
  phase: "crackle" | "silence" | "burst" | "settle";
  /** `prefers-reduced-motion: reduce`: a fade to dark instead of the dips (DESIGN 5.6). */
  reduced: boolean;
  /** Negative when the message came in mid-crackle, so the dips stay on the shared clock. */
  delayMs: number;
};

type Run = { clock: (deviceNow: number) => number; reduced: boolean; delayMs: number };
// One clock per message for the sound, the map layer and the panel, as startFinale plays once per `at`.
const runs = new WeakMap<FinaleMessage, Run>();

/** The latest finale on /live, played on the room's speakers. Mounts with LivingMap, after the start click. */
export function useScreenFinale(): FinaleMessage | null {
  const message = useFinale();
  const offset = useClockOffset();
  const [, setTick] = useState(0);
  // In render, so the layer and panel (rendered after this hook) read the same run.
  if (message && !runs.has(message)) {
    const at = message.startAt;
    const got = receivedAt.get(message) ?? Date.now();
    const clock = (deviceNow: number) => finaleClock(offset, at, deviceNow, got);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runs.set(message, { clock, reduced, delayMs: Math.min(0, at - clock(Date.now())) });
  }

  useEffect(() => {
    void startClockOffset();
    void preloadFinale();
  }, []);

  useEffect(() => {
    if (!message) return;
    const at = message.startAt;
    const serverNow = runs.get(message)!.clock(Date.now());
    startFinale(at, serverNow, { surface: "screen" });
    const timers = [0, CRACKLE_MS, BURST_AT_MS, FINALE_END_MS, FINALE_END_MS + PANEL_SETTLE_MS]
      .map((ms) => at + ms - serverNow)
      .filter((d) => d > 0)
      .map((d) => setTimeout(() => setTick((n) => n + 1), d + 1)); // +1: a timer can fire a hair before its boundary
    return () => timers.forEach(clearTimeout);
  }, [message]);

  return message;
}

/** What the finale shows now, or null before it and once the panel has settled. */
export function screenShown(finale: FinaleMessage | null): ScreenShown | null {
  const run = finale && runs.get(finale);
  if (!finale || !run) return null;
  const now = run.clock(Date.now());
  const { phase } = finalePhase(now, finale.startAt);
  if (phase === "wait") return null;
  if (phase === "done") return now < finale.startAt + FINALE_END_MS + PANEL_SETTLE_MS ? { ...run, phase: "settle" } : null;
  return { ...run, phase };
}

/** The --bg sheet in map units, with holes over the candle field circle and its label, placed as canvas.ts places them. */
export function finalePath(placed: Placed): string {
  // Taller than any screen: the map is 100vh high, the sheet 1080 units.
  const sheet = `M0,${-DESIGN_HEIGHT}H${MAP_WIDTH}V${10 * DESIGN_HEIGHT}H0Z`;
  const p = MEMORIAL && placed.find((q) => q.id === MEMORIAL.id);
  if (!MEMORIAL || !p) return sheet;
  const R = SITE_RADIUS;
  const circle = `M${p.x - R},${p.y}a${R},${R} 0 1 0 ${2 * R},0a${R},${R} 0 1 0 ${-2 * R},0Z`;
  // shortcut: the canvas measures the name; labelWidth is the layout's estimate, a little wider. Measure with a 2D context if the hole shows.
  const half = labelWidth(MEMORIAL.name) / 2;
  const x = Math.min(Math.max(p.x, half), MAP_WIDTH - half);
  const y0 = p.label === "below" ? p.y + R + LABEL_GAP : p.y - R - LABEL_GAP - LABEL_LINE;
  const label = `M${x - half},${y0}H${x + half}V${y0 + LABEL_LINE}H${x - half}Z`;
  return sheet + circle + label;
}

/** Over the map, under the OSM credit: dips, dark, then lifts off at the burst. The canvas and the candles stay as they are (DESIGN 5.5, 7.13). */
export function FinaleMapLayer({
  finale,
  placed,
  shown = screenShown(finale),
}: {
  finale: FinaleMessage | null;
  placed: Placed;
  shown?: ScreenShown | null;
}) {
  if (!shown || shown.phase === "settle") return null;
  const { phase, reduced, delayMs } = shown;
  const veil = phase === "crackle" ? (reduced ? styles.fade : styles.dips) : phase === "silence" ? styles.dark : styles.unveil;
  return (
    <svg
      className={`${styles.layer} ${veil}`}
      viewBox={`0 0 ${MAP_WIDTH} ${DESIGN_HEIGHT}`}
      style={phase === "crackle" && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
      aria-hidden="true"
    >
      <path d={finalePath(placed)} fillRule="evenodd" />
    </svg>
  );
}

/** Side panel, above the Ticker: "731 / 731" and the date during the burst, then they settle back over 4 s. English, as /screen. */
export function FinalePanel({ finale, shown = screenShown(finale) }: { finale: FinaleMessage | null; shown?: ScreenShown | null }) {
  if (!shown || (shown.phase !== "burst" && shown.phase !== "settle")) return null;
  return (
    <div className={`${styles.panel} ${shown.phase === "settle" ? styles.settle : ""}`}>
      <p className={styles.count}>
        <span className={styles.lit}>{LAMP_TARGET}</span>
        {` / ${LAMP_TARGET}`}
      </p>
      <p className={styles.date}>12 November 1884</p>
    </div>
  );
}

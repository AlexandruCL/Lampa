import { LAMP_TARGET, type LampsMessage } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { unlockAudio } from "../audio/context";
import {
  BURST_AT_MS,
  CRACKLE_MS,
  FINALE_END_MS,
  finaleClock,
  finalePhase,
  preloadFinale,
  startFinale,
  type FinaleHandle,
} from "../audio/finale";
import { Button, Notice } from "../components";
import { siteName, t } from "../i18n/t";
import { LampCounter } from "../lamp/LampCounter";
import { LIGHT_LEAVE_MS, LightSurface } from "../lamp/LightSurface";
import { startClockOffset, useClockOffset } from "../lamp/pulse";
import type { PhoneSite } from "../sites/sites";
import styles from "./PhoneFinale.module.css";
import { receivedAt, useFinale } from "./useFinale";

const FULL: LampsMessage = { litToday: LAMP_TARGET, target: LAMP_TARGET, sites: [] };

export type FinaleShown = {
  phase: "crackle" | "silence" | "burst" | "leaving";
  /** `prefers-reduced-motion: reduce`: a fade to dark instead of the dips (DESIGN 5.6). */
  reduced: boolean;
  /** The audio context is not running at the burst: offer "Tap to hear the waltz". */
  suspended: boolean;
  /** Negative when the message came in mid-crackle, so the dips stay on the shared clock. */
  delayMs?: number;
  onBack(): void;
  onTap(): void;
};

/** DESIGN 7.12: the 1884 finale over the phone view. Nothing on a memorial site (7.11). `shown`: tests render a fixed state. */
export function PhoneFinale({ site, shown }: { site?: PhoneSite; shown?: FinaleShown }) {
  if (site?.is_memorial) return null; // no overlay, no sound, no socket
  return shown ? <FinaleOverlay site={site} {...shown} /> : <LiveFinale site={site} />;
}

type Run = { at: number; clock: (deviceNow: number) => number; reduced: boolean; delayMs: number; handle: FinaleHandle };

function LiveFinale({ site }: { site?: PhoneSite }) {
  const message = useFinale();
  const offset = useClockOffset();
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const [run, setRun] = useState<Run | null>(null);
  const [closed, setClosed] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const rerender = () => setTick((n) => n + 1);

  useEffect(() => {
    void startClockOffset();
    void preloadFinale();
  }, []);

  useEffect(() => {
    if (!message) return;
    const at = message.startAt;
    const got = receivedAt.get(message) ?? Date.now();
    const off = offsetRef.current;
    // One clock for the whole run, as startFinale plays once per `at`: an offset arriving later must not re-time the visuals.
    const clock = (deviceNow: number) => finaleClock(off, at, deviceNow, got);
    const serverNow = clock(Date.now());
    const handle = startFinale(at, serverNow, { surface: "phone" });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRun({ at, clock, reduced, delayMs: Math.min(0, at - serverNow), handle });
    const timers = [0, CRACKLE_MS, BURST_AT_MS, FINALE_END_MS, FINALE_END_MS + LIGHT_LEAVE_MS]
      .map((ms) => at + ms - serverNow)
      .filter((d) => d > 0)
      .map((d) => setTimeout(rerender, d + 1)); // +1: a timer can fire a hair before its boundary
    return () => timers.forEach(clearTimeout);
  }, [message]);

  if (!run || closed === run.at) return null;
  const now = run.clock(Date.now());
  const { phase } = finalePhase(now, run.at);
  const leaving = phase === "done" && now < run.at + FINALE_END_MS + LIGHT_LEAVE_MS;
  if (phase === "wait" || (phase === "done" && !leaving)) return null;
  return (
    <FinaleOverlay
      site={site}
      phase={leaving ? "leaving" : (phase as FinaleShown["phase"])}
      reduced={run.reduced}
      delayMs={run.delayMs}
      suspended={phase === "burst" && run.handle.suspended}
      onBack={() => setClosed(run.at)} // the waltz plays on to its end (7.12)
      onTap={async () => {
        await unlockAudio();
        run.handle.resumeWaltz(run.clock(Date.now()));
        rerender();
      }}
    />
  );
}

/** The overlay for one phase; rendered after the view, so it covers a lit Lamp too (7.7). */
export function FinaleOverlay({ site, phase, reduced, suspended, delayMs = 0, onBack, onTap }: FinaleShown & { site?: PhoneSite }) {
  const lit = phase === "burst" || phase === "leaving";
  const veil =
    phase === "crackle" ? (reduced ? styles.fade : styles.dips) : phase === "silence" ? styles.dark : styles.unveil;
  return (
    <div role="dialog" aria-label={t("finale_label")}>
      {lit && (
        <LightSurface
          pulse={false}
          leaving={phase === "leaving"}
          exit={
            <Button variant="quiet" onClick={onBack}>
              {site ? t("back_to", { name: siteName(site) }) : t("back")}
            </Button>
          }
        >
          {suspended && (
            <Notice variant="info" icon="headphones">
              <Button variant="quiet" onClick={onTap}>
                {t("finale_tap_waltz")}
              </Button>
            </Notice>
          )}
          <p className={styles.line}>{t("finale_line")}</p>
          <LampCounter lamps={FULL} connected size="l" light />
        </LightSurface>
      )}
      {/* --bg over everything: dips, then dark, then lifted off the LightSurface over 800ms */}
      <div
        className={`${styles.veil} ${veil}`}
        style={phase === "crackle" && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
        aria-hidden="true"
      />
    </div>
  );
}

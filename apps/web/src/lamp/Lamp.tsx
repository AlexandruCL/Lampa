import { useEffect, useRef, useState } from "react";
import type { LampsMessage } from "@lampa/shared";
import { playClip } from "../audio/clip";
import { clips } from "../audio/clips";
import { Button, Ring } from "../components";
import { TopBar } from "../phone/TopBar";
import type { PhoneSite } from "../sites/sites";
import { visitorLang } from "../talk/lang";
import { LampCounter } from "./LampCounter";
import { LIGHT_LEAVE_MS, LightSurface } from "./LightSurface";
import { LOWER_DEG, RAISE_START, type RaiseState, stepRaise } from "./lampMaths";
import { presenceLine } from "./presence";
import { startClockOffset } from "./pulse";
import styles from "./Lamp.module.css";
import { useLampEvents } from "./useLampEvents";
import { usePitch } from "./usePitch";

/** How often the raise gesture is stepped; also the Ring's linear fill between steps. */
const TICK_MS = 100;

export type Surface = "off" | "on" | "leaving";

/** After "Lower the lamp", the raise path waits for the phone to come down first, so a phone still held up does not relight. */
export const rearms = (pitch: number | null) => pitch !== null && pitch < LOWER_DEG;

type Props = {
  site: PhoneSite;
  demo: boolean;
  lamps: LampsMessage | null;
  connected: boolean;
  motion: "granted" | "denied" | "unavailable";
  onBack: () => void;
};

/** Raise a lamp (DESIGN 7.7). */
export function Lamp({ site, demo, lamps, connected, motion, onBack }: Props) {
  const { pitch, available } = usePitch();
  const canRaise = motion === "granted" && available;
  const [surface, setSurface] = useState<Surface>("off");
  // raise: pitch drives the lamp; tap: lit by a tap, pitch cannot lower it; wait: lowered by the button, see `rearms`
  const [mode, setMode] = useState<"raise" | "tap" | "wait">("raise");
  const [litByTap, setLitByTap] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lowered, setLowered] = useState(false);
  const pitchRef = useRef(pitch);
  const raise = useRef<RaiseState>(RAISE_START);

  useLampEvents(site.id, surface === "on");
  useEffect(() => void startClockOffset(), []); // first Lamp open measures the offset for the page

  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);

  const light = (inTap: boolean) => {
    setSurface("on");
    setLowered(false);
    setLitByTap(inTap);
    // inTap only from a tap: playClip then resumes the context, which must stay inside a tap.
    if (clips.project.crackle) void playClip(clips.project.crackle, inTap);
    navigator.vibrate?.([20]);
  };
  const lower = () => {
    raise.current = RAISE_START;
    setSurface("leaving");
    setLowered(true);
  };

  // Stepped on a timer, not on pitch changes: a steady reading must still complete the hold.
  useEffect(() => {
    if (!canRaise || mode === "tap") return;
    const id = setInterval(() => {
      if (mode === "wait") {
        if (rearms(pitchRef.current)) setMode("raise");
        return;
      }
      const was = raise.current.phase;
      const next = stepRaise(raise.current, pitchRef.current, Date.now());
      raise.current = next.state;
      setProgress(next.state.phase === "down" ? next.progress : 0);
      if (next.state.phase !== was) {
        if (next.state.phase === "lit") light(false);
        else lower();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [canRaise, mode]);

  useEffect(() => {
    if (surface !== "leaving") return;
    const timer = setTimeout(() => setSurface("off"), LIGHT_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [surface]);

  const lang = visitorLang(globalThis.navigator?.language) === "ro" ? "ro" : "en";
  const here = connected ? (lamps?.sites.find((s) => s.siteId === site.id)?.lightingNow ?? null) : null;

  return (
    <LampView
      site={site}
      demo={demo}
      lamps={lamps}
      connected={connected}
      canRaise={canRaise}
      progress={progress}
      surface={surface}
      lowered={lowered}
      hint={!litByTap}
      presence={presenceLine(here, surface !== "off", site.name, lang)}
      onLight={() => {
        setMode("tap");
        light(true);
      }}
      onLower={() => {
        setMode("wait");
        lower();
      }}
      onBack={onBack}
    />
  );
}

type ViewProps = {
  site: PhoneSite;
  demo: boolean;
  lamps: LampsMessage | null;
  connected: boolean;
  canRaise: boolean;
  progress: number;
  surface: Surface;
  lowered: boolean;
  /** "Lower your phone to stop." on the lit surface: raise-lit only, a tap-lit lamp ignores the phone's angle. */
  hint: boolean;
  presence: string | null;
  onLight: () => void;
  onLower: () => void;
  onBack: () => void;
};

/** The Lamp screen for given state, without sensors or timers. */
export function LampView({ site, demo, lamps, connected, canRaise, progress, surface, lowered, hint, presence, onLight, onLower, onBack }: ViewProps) {
  const counter = (light: boolean) => <LampCounter lamps={lamps} connected={connected} size="l" light={light} presence={presence} />;
  return (
    <>
      <main className={styles.view} inert={surface !== "off"}>
        <TopBar siteName={site.name} onBack={onBack} demo={demo} />
        <div className={styles.body}>
          {canRaise ? (
            <>
              <h1 className={styles.title}>Raise your phone above your head.</h1>
              {/* Only on the raise path: "Raise it again" means nothing to a phone that cannot tell. */}
              {lowered && (
                <p className={styles.line} role="status">
                  Lamp lowered. Raise it again to keep it lit.
                </p>
              )}
              <Ring size={160} progress={progress} filling={progress > 0} holdMs={TICK_MS} label="Raise to light the lamp" />
            </>
          ) : (
            <h1 className={styles.title}>This phone cannot tell when it is raised. Tap to light the lamp.</h1>
          )}
          {counter(false)}
        </div>
        <div className={styles.bottom}>
          {canRaise ? (
            <Button variant="quiet" onClick={onLight}>
              Light without raising
            </Button>
          ) : (
            <Button variant="primary" size="l" block onClick={onLight}>
              Light the lamp
            </Button>
          )}
          <Button variant="secondary" size="l" block onClick={onBack}>
            Back to {site.name}
          </Button>
        </div>
      </main>
      {surface !== "off" && (
        <LightSurface
          leaving={surface === "leaving"}
          exit={
            <Button variant="quiet" onClick={onLower}>
              Lower the lamp
            </Button>
          }
        >
          <p className={styles.litTitle}>Your lamp is lit.</p>
          {counter(true)}
          {hint && <p className={styles.hint}>Lower your phone to stop.</p>}
        </LightSurface>
      )}
    </>
  );
}

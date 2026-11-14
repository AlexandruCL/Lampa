import { useEffect, useState, type ReactNode } from "react";
import { caughtClink, readingTone, windowChord } from "../audio/note";
import { useBed } from "../audio/useBed";
import { Button, Notice } from "../components";
import { openRearCamera, type CameraResult } from "../sensors/camera";
import { Between } from "./Between";
import { ColourLens } from "./ColourLens";
import { track } from "../events";
import { markVisited } from "../nav/visited";
import { requestCompass, type CompassStatus, type PrimerResult } from "../sensors/primer";
import type { PhoneSite } from "../sites/sites";
import { DemoBadge } from "./DemoBadge";
import { EchoRecorder } from "./EchoRecorder";
import { GlowMark } from "./GlowMark";
import { Lamp } from "../lamp/Lamp";
import { LampCounter } from "../lamp/LampCounter";
import { applyPane, emptyWindow } from "./panes";
import { RoseWindow } from "./RoseWindow";
import styles from "./SiteView.module.css";
import { useSiteGlow } from "./useSiteGlow";
import { Talk } from "../talk/Talk";

const CONNECT_WAIT_MS = 8000;
export const ARRIVED_LINE_MS = 4000;

/** Site view (DESIGN.md 7.2). Action buttons have no action yet. */
export function SiteView({ site, demo, remote, notice, compass, primer, arrived }: { site: PhoneSite; demo: boolean; remote: boolean; notice?: ReactNode; compass: CompassStatus; primer: PrimerResult; arrived: boolean }) {
  const [compassDenied, setCompassDenied] = useState(compass === "denied");
  const live = useSiteGlow(site.id);
  const { glow, connected } = live;
  // Remote: the phone joins no gallery room, so the mini window holds only the visitor's own pane.
  const [local, setLocal] = useState(emptyWindow);
  const [waited, setWaited] = useState(false);
  const [camera, setCamera] = useState<Promise<CameraResult> | null>(null);
  const [mic, setMic] = useState<Promise<"granted" | "denied"> | null>(null);
  const [view, setView] = useState<"site" | "lens" | "echo" | "between" | "talk" | "lamp">("site");
  useBed(site.id, glow, view !== "between");
  const [motion, setMotion] = useState<CompassStatus | null>(null);
  const [echoPrompt, setEchoPrompt] = useState<string | undefined>();
  const [nextTarget, setNextTarget] = useState<string | undefined>();

  useEffect(() => {
    track("wake", site.id);
    markVisited(site.id);
  }, [site.id]);

  const [arrivedLine, setArrivedLine] = useState(arrived);
  useEffect(() => {
    if (!arrived) return;
    const t = setTimeout(() => setArrivedLine(false), ARRIVED_LINE_MS);
    return () => clearTimeout(t);
  }, [arrived]);

  useEffect(() => {
    if (glow !== null) return;
    const t = setTimeout(() => setWaited(true), CONNECT_WAIT_MS);
    return () => clearTimeout(t);
  }, [glow]);

  if (view === "lens" && camera) {
    return (
      <ColourLens
        site={site}
        remote={remote}
        demo={demo}
        camera={camera}
        onBack={() => setView("site")}
        onReading={readingTone}
        onCaught={(reading) => caughtClink(reading)}
        onComplete={() => windowChord((remote ? local : live.panes).filled)}
        onSayWhy={() => {
          setEchoPrompt("Why this colour?");
          setView("echo");
        }}
        panes={remote ? local : live.panes}
        addPane={remote ? (p) => setLocal((s) => applyPane(s, p)) : live.addPane}
      />
    );
  }

  if (view === "echo") {
    return <EchoRecorder site={site} demo={demo} prompt={echoPrompt} onBack={() => setView("site")} />;
  }

  if (view === "between") {
    return <Between from={site} primer={primer} demo={demo} remote={remote} initialTarget={nextTarget} onBack={() => setView("site")} />;
  }

  if (view === "lamp" && motion) {
    return <Lamp site={site} demo={demo} lamps={live.lamps} connected={connected} motion={motion} onBack={() => setView("site")} />;
  }

  if (view === "talk" && mic) {
    return (
      <Talk
        site={site}
        demo={demo}
        remote={remote}
        mic={mic}
        onBack={() => setView("site")}
        panes={remote ? local : live.panes}
        addPane={remote ? (p) => setLocal((s) => applyPane(s, p)) : live.addPane}
        onEcho={(p) => { setEchoPrompt(p); setView("echo"); }}
        onNextSite={(id) => { setNextTarget(id); setView("between"); }}
      />
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>{demo && <DemoBadge />}</div>
      {notice ??
        (glow === null && waited && (
          <Notice variant="connection">Still connecting to the city. You can already listen.</Notice>
        ))}
      <h1 className={styles.name}>{site.name}</h1>
      {arrivedLine && <p className={styles.arrived}>{site.name} is waking.</p>}
      <GlowMark siteName={site.name} glow={glow} connected={connected} />
      {site.lamp && !remote && <LampCounter lamps={live.lamps} connected={connected} size="s" />}
      <div className={styles.visual}>
        <RoseWindow name={site.name} size="l" filled={live.panes.filled} glow={glow !== null && glow >= 0.15 ? glow : undefined} />
      </div>
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="l"
          block
          onClick={() => {
            // inside the tap, before any await (iOS); the SDK opens its own stream, so ours stops at once
            const md = navigator.mediaDevices;
            setMic(
              md?.getUserMedia
                ? md.getUserMedia({ audio: true }).then(
                    (s) => {
                      s.getTracks().forEach((t) => t.stop());
                      return "granted" as const;
                    },
                    () => "denied" as const,
                  )
                : Promise.resolve("denied" as const),
            );
            setView("talk");
          }}
        >
          Talk
        </Button>
        <div className={styles.grid}>
          <Button
            variant="secondary"
            size="l"
            block
            onClick={() => {
              setCamera(openRearCamera()); // inside the tap: iOS needs it before any await
              setView("lens");
            }}
          >
            Catch a colour
          </Button>
          {site.lamp && !remote && (
            <Button
              variant="secondary"
              size="l"
              block
              onClick={() => {
                // inside the tap: iOS asks for motion here, which the demo primer skips; the site view stays until it answers
                setMotion(null);
                void requestCompass().then(setMotion);
                setView("lamp");
              }}
            >
              Raise a lamp
            </Button>
          )}
          <Button
            variant="secondary"
            size="l"
            block
            onClick={() => {
              setEchoPrompt(undefined);
              setView("echo");
            }}
          >
            Leave an echo
          </Button>
        </div>
        <Button
          variant="quiet"
          onClick={() => {
            // The demo primer asks for no motion permission; on an iPhone the prompt must come from this tap.
            if (demo && !new URLSearchParams(window.location.search).has("heading")) void requestCompass();
            setNextTarget(undefined);
            setView("between");
          }}
        >
          Next site
        </Button>
        {compassDenied && (
          <Button variant="quiet" onClick={() => requestCompass().then((s) => setCompassDenied(s !== "granted"))}>
            Use the compass
          </Button>
        )}
      </div>
    </main>
  );
}

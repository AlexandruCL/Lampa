import { useEffect, useState, type ReactNode } from "react";
import { Button, Notice } from "../components";
import { openRearCamera, type CameraResult } from "../sensors/camera";
import { ColourLens } from "./ColourLens";
import { track } from "../events";
import { requestCompass, type CompassStatus } from "../sensors/primer";
import type { PhoneSite } from "../sites/sites";
import { DemoBadge } from "./DemoBadge";
import { GlowMark } from "./GlowMark";
import { RoseWindow } from "./RoseWindow";
import styles from "./SiteView.module.css";
import { useSiteGlow } from "./useSiteGlow";

const EMPTY_PANES: null[] = Array(48).fill(null);
const CONNECT_WAIT_MS = 8000;

/** Site view (DESIGN.md 7.2). Action buttons have no action yet. */
export function SiteView({ site, demo, remote, notice, compass }: { site: PhoneSite; demo: boolean; remote: boolean; notice?: ReactNode; compass: CompassStatus }) {
  const [compassDenied, setCompassDenied] = useState(compass === "denied");
  const { glow, connected } = useSiteGlow(site.id);
  const [waited, setWaited] = useState(false);
  const [camera, setCamera] = useState<Promise<CameraResult> | null>(null);
  const [view, setView] = useState<"site" | "lens">("site");

  useEffect(() => {
    track("wake", site.id);
  }, [site.id]);

  useEffect(() => {
    if (glow !== null) return;
    const t = setTimeout(() => setWaited(true), CONNECT_WAIT_MS);
    return () => clearTimeout(t);
  }, [glow]);

  if (view === "lens" && camera) {
    return <ColourLens site={site} remote={remote} demo={demo} camera={camera} onBack={() => setView("site")} />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>{demo && <DemoBadge />}</div>
      {notice ??
        (glow === null && waited && (
          <Notice variant="connection">Still connecting to the city. You can already listen.</Notice>
        ))}
      <h1 className={styles.name}>{site.name}</h1>
      <GlowMark siteName={site.name} glow={glow} connected={connected} />
      <div className={styles.visual}>
        <RoseWindow name={site.name} size="l" filled={EMPTY_PANES} glow={glow !== null && glow >= 0.15 ? glow : undefined} />
      </div>
      <div className={styles.actions}>
        <Button variant="primary" size="l" block>Talk</Button>
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
          {site.lamp && !remote && <Button variant="secondary" size="l" block>Raise a lamp</Button>}
          <Button variant="secondary" size="l" block>Leave an echo</Button>
        </div>
        <Button variant="quiet">Next site</Button>
        {compassDenied && (
          <Button variant="quiet" onClick={() => requestCompass().then((s) => setCompassDenied(s !== "granted"))}>
            Use the compass
          </Button>
        )}
      </div>
    </main>
  );
}

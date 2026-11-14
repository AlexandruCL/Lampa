import { MAP_LINES, sites, type SiteDetail } from "@lampa/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoomSound } from "../audio/room";
import { Button } from "../components";
import { DemoBadge } from "../phone/DemoBadge";
import { isDemo } from "../sensors/demo";
import { startCanvas } from "./canvas";
import { toSite } from "./newSites";
import { layout, MAP_WIDTH } from "./projection";
import { QRBlock } from "./QRBlock";
import styles from "./ScreenPage.module.css";
import { Subtitle } from "./Subtitle";
import { Ticker } from "./Ticker";
import { useScreenSocket } from "./useScreenSocket";

const RECONNECT_NOTICE_MS = 3000;
const BUNDLED_COLOUR_IDS = sites.filter((s) => !s.is_memorial).map((s) => s.id);

function LivingMap({ demo }: { demo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The bundled sites plus the places published since the build, learned from the glow list.
  const [added, setAdded] = useState<SiteDetail[]>([]);
  const allSites = useMemo(() => [...sites, ...added.map(toSite)], [added]);
  const colourSiteIds = useMemo(
    () => [...BUNDLED_COLOUR_IDS, ...added.filter((d) => d.interactions.includes("colours")).map((d) => d.id)],
    [added],
  );
  const knownIds = useMemo(() => allSites.map((s) => s.id), [allSites]);
  const siteNames = useMemo(() => Object.fromEntries(allSites.map((s) => [s.id, s.name])), [allSites]);
  const placed = useMemo(() => layout(allSites, MAP_LINES), [allSites]);
  const onSite = useCallback((d: SiteDetail) => setAdded((list) => (list.some((s) => s.id === d.id) ? list : [...list, d])), []);
  const sitesRef = useRef(allSites);
  const { glowRef, windowsRef, effectsRef, candlesRef, connected, coloursToday, events, subtitles } = useScreenSocket(
    colourSiteIds,
    demo,
    knownIds,
    onSite,
  );
  const [reconnecting, setReconnecting] = useState(false);
  useRoomSound(glowRef, placed, MAP_WIDTH);

  useEffect(() => {
    sitesRef.current = allSites;
  }, [allSites]);

  useEffect(
    () =>
      canvasRef.current ? startCanvas(canvasRef.current, MAP_LINES, { sitesRef, glowRef, windowsRef, effectsRef, candlesRef }) : undefined,
    [glowRef, windowsRef, effectsRef, candlesRef],
  );

  useEffect(() => {
    if (connected) {
      setReconnecting(false);
      return;
    }
    const timer = setTimeout(() => setReconnecting(true), RECONNECT_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [connected]);

  return (
    <>
      <div className={styles.map}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        {subtitles.map((s) => {
          const p = placed.find((q) => q.id === s.siteId);
          return p && <Subtitle key={`${s.siteId}-${s.at}`} point={p} others={placed} text={s.text} lang={s.lang} />;
        })}
        <p className={styles.credit}>© OpenStreetMap contributors</p>
        {demo && (
          <div className={styles.demo}>
            <DemoBadge />
          </div>
        )}
      </div>
      <aside className={styles.panel}>
        <p className={styles.mark}>LAMPA</p>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Lamps lit today</p>
          {/* The lamps message is Fabi's Build 3 row. */}
          <p className={`${styles.number} ${styles.numberLamps}`}>...</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Colours caught today</p>
          <p className={styles.number}>{coloursToday ?? "..."}</p>
        </div>
        <Ticker events={events} siteNames={siteNames} />
        <p className={styles.status} role="status">
          {reconnecting ? "Reconnecting to the city…" : ""}
        </p>
        <div className={styles.qr}>
          <QRBlock />
        </div>
      </aside>
    </>
  );
}

export default function ScreenPage() {
  const [started, setStarted] = useState(false);
  const demo = isDemo(location.search);

  return (
    <main className={styles.livingMap}>
      {started ? (
        <LivingMap demo={demo} />
      ) : (
        <div className={styles.start}>
          <p className={styles.mark}>LAMPA</p>
          <Button variant="primary" size="l" onClick={() => setStarted(true)}>
            Start the Living Map
          </Button>
          <p className={styles.startLine}>Turns on the room sound.</p>
        </div>
      )}
      <p className={styles.narrow}>The Living Map needs a screen at least 1024 px wide.</p>
    </main>
  );
}

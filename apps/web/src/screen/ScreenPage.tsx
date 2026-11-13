import { MAP_LINES, sites } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components";
import { DemoBadge } from "../phone/DemoBadge";
import { isDemo } from "../sensors/demo";
import { startCanvas } from "./canvas";
import { QRBlock } from "./QRBlock";
import styles from "./ScreenPage.module.css";
import { Ticker } from "./Ticker";
import { useScreenSocket } from "./useScreenSocket";

const RECONNECT_NOTICE_MS = 3000;
// Module scope keeps one array identity, so renders never reconnect the socket.
const COLOUR_SITE_IDS = sites.filter((s) => !s.is_memorial).map((s) => s.id);
const SITE_NAMES = Object.fromEntries(sites.map((s) => [s.id, s.name]));

function LivingMap({ demo }: { demo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { glowRef, windowsRef, effectsRef, candlesRef, connected, coloursToday, events } = useScreenSocket(COLOUR_SITE_IDS, demo);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(
    () =>
      canvasRef.current ? startCanvas(canvasRef.current, sites, MAP_LINES, { glowRef, windowsRef, effectsRef, candlesRef }) : undefined,
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
        <Ticker events={events} siteNames={SITE_NAMES} />
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

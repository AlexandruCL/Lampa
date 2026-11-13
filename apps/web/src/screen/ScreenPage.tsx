import { MAP_LINES } from "@lampa/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components";
import { DemoBadge } from "../phone/DemoBadge";
import { isDemo } from "../sensors/demo";
import { startCanvas } from "./canvas";
import styles from "./ScreenPage.module.css";
import { sites } from "./sites.fixture";
import { useScreenSocket } from "./useScreenSocket";

const RECONNECT_NOTICE_MS = 3000;
// Module scope keeps one array identity, so renders never reconnect the socket.
const COLOUR_SITE_IDS = sites.filter((s) => !s.is_memorial).map((s) => s.id);

function LivingMap({ demo }: { demo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { glowRef, connected } = useScreenSocket(COLOUR_SITE_IDS, demo);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => (canvasRef.current ? startCanvas(canvasRef.current, sites, MAP_LINES, glowRef) : undefined), [glowRef]);

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
          <div style={{ position: "absolute", left: "calc(16 * var(--u))", top: "calc(16 * var(--u))", zIndex: "var(--z-demo)" }}>
            <DemoBadge />
          </div>
        )}
      </div>
      <aside className={styles.panel}>
        <p className={styles.mark}>LAMPA</p>
        <p className={styles.status} role="status">
          {reconnecting ? "Reconnecting to the city…" : ""}
        </p>
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

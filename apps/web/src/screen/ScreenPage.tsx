import { useEffect, useRef, useState } from "react";
import { Button } from "../components";
import { startCanvas } from "./canvas";
import styles from "./ScreenPage.module.css";
import { sites } from "./sites.fixture";
import { useGlowSocket } from "./useGlowSocket";

const RECONNECT_NOTICE_MS = 3000;

function LivingMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { glowRef, connected } = useGlowSocket();
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => (canvasRef.current ? startCanvas(canvasRef.current, sites, glowRef) : undefined), [glowRef]);

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

  return (
    <main className={styles.livingMap}>
      {started ? (
        <LivingMap />
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

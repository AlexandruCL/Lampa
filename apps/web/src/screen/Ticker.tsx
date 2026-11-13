import { colourName } from "@lampa/shared";
import { useEffect, useState } from "react";
import { tickerText, timeAgo } from "./tickerCopy";
import styles from "./Ticker.module.css";
import type { ScreenEvent } from "./useScreenSocket";

const REFRESH_MS = 30_000;

/** DESIGN.md 6.18. The screen is a display, so the list is not announced. */
export function Ticker({ events, siteNames }: { events: ScreenEvent[]; siteNames: Record<string, string> }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  if (events.length === 0) return <p className={styles.empty}>Waiting for the first visitor tonight.</p>;

  return (
    <ul className={styles.ticker} aria-live="off">
      {events.map((e) => (
        // Stable keys keep older lines from replaying the fade when they move down.
        <li key={`${e.at}-${e.kind}-${e.siteId}-${e.kind === "pane" ? e.hex : ""}`} className={styles.line}>
          {e.kind === "pane" && <span className={styles.swatch} style={{ background: e.hex }} />}
          <span className={styles.body}>
            <span className={styles.text}>
              {tickerText(e, siteNames[e.siteId] ?? e.siteId, e.kind === "pane" ? colourName(e.hex).en : "")}
            </span>
            <span className={styles.ago}>{timeAgo(e.at, Math.max(now, e.at))}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

import { useEffect, useRef, useState } from "react";
import { LAMP_TARGET, type LampsMessage } from "@lampa/shared";
import styles from "./LampCounter.module.css";

export const ANNOUNCE_MS = 60000;

type Props = {
  lamps: LampsMessage | null;
  connected: boolean;
  size: "s" | "l";
  /** L only: the light variant on LightSurface. */
  light?: boolean;
  /** L only: the presence line; null hides it. */
  presence?: string | null;
};

/** DESIGN 6.13. The visible value changes in place; a hidden status says it to screen readers at most once a minute. */
export function LampCounter({ lamps, connected, size, light, presence }: Props) {
  const value = lamps ? String(lamps.litToday) : "...";
  const lastKnown = lamps !== null && !connected;
  const spoken = lamps ? `${lamps.litToday} of ${LAMP_TARGET} lamps lit today${lastKnown ? ", last known" : ""}` : "";
  const announced = useThrottled(spoken, ANNOUNCE_MS);
  const status = (
    <span className={styles.hidden} role="status" aria-atomic="true">
      {announced}
    </span>
  );
  const muted = lastKnown && <span className={styles.muted}> (last known)</span>;

  if (size === "s") {
    return (
      <p className={styles.s}>
        <span aria-hidden="true">
          <span className={styles.sValue}>
            {value} / {LAMP_TARGET}
          </span>{" "}
          lamps lit today{muted}
        </span>
        {status}
      </p>
    );
  }
  return (
    <div className={`${styles.l} ${light ? styles.light : ""}`}>
      <div aria-hidden="true">
        <p className={styles.value}>
          <span className={lamps ? styles.lit : styles.muted}>{value}</span> / {LAMP_TARGET}
        </p>
        <p className={styles.label}>lamps lit today{muted}</p>
      </div>
      {status}
      {presence && <p className={styles.presence}>{presence}</p>}
    </div>
  );
}

/** `text` as it was at most once per `ms`; the latest value lands when the window ends. */
function useThrottled(text: string, ms: number): string {
  const [shown, setShown] = useState(text);
  const at = useRef(0);
  useEffect(() => {
    if (text === shown) return;
    const wait = at.current + ms - Date.now();
    const show = () => {
      at.current = Date.now();
      setShown(text);
    };
    if (wait <= 0) return show();
    const timer = setTimeout(show, wait);
    return () => clearTimeout(timer);
  }, [text, shown, ms]);
  return shown;
}

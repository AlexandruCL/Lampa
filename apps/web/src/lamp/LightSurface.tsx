import { useMemo, type ReactNode } from "react";
import styles from "./LightSurface.module.css";
import { pulseDelayMs, useClockOffset } from "./pulse";
import { useWakeLock } from "./useWakeLock";

/** Fade-out time; the parent keeps the surface mounted this long after `leaving` turns true. */
export const LIGHT_LEAVE_MS = 450;

type Props = {
  leaving?: boolean;
  /** The Lamp pulses; the finale burst passes false. */
  pulse?: boolean;
  children: ReactNode;
  exit: ReactNode;
};

/** DESIGN 6.14: the phone as a light source, full screen at z 40. Holds the Wake Lock while open. */
export function LightSurface({ leaving = false, pulse = true, children, exit }: Props) {
  useWakeLock(!leaving);
  const offset = useClockOffset();
  // Phase set when the surface opens and when the offset arrives; no offset, no pulse.
  const delay = useMemo(() => (offset === null ? null : pulseDelayMs(Date.now(), offset)), [offset]);
  const pulsing = pulse && delay !== null;
  return (
    <div className={`${styles.surface} ${leaving ? styles.leaving : ""}`}>
      {children}
      <div className={styles.exit}>{exit}</div>
      <div
        className={`${styles.pulse} ${pulsing ? styles.pulsing : ""}`}
        style={pulsing ? { animationDelay: `${delay}ms` } : undefined}
        aria-hidden="true"
      />
    </div>
  );
}

import type { ReactNode } from "react";
import styles from "./LightSurface.module.css";
import { useWakeLock } from "./useWakeLock";

/** Fade-out time; the parent keeps the surface mounted this long after `leaving` turns true. */
export const LIGHT_LEAVE_MS = 450;

/** DESIGN 6.14: the phone as a light source, full screen at z 40. Holds the Wake Lock while open. */
export function LightSurface({ leaving = false, children, exit }: { leaving?: boolean; children: ReactNode; exit: ReactNode }) {
  useWakeLock(!leaving);
  return (
    <div className={`${styles.surface} ${leaving ? styles.leaving : ""}`}>
      {children}
      <div className={styles.exit}>{exit}</div>
    </div>
  );
}

import { glowLine, glowWord } from "./glow";
import styles from "./GlowMark.module.css";

type Props = { siteName: string; glow: number | null; connected: boolean; size?: "s" | "m" };

/** DESIGN.md 6.5, sizes S and M. Never used for the memorial. */
export function GlowMark({ siteName, glow, connected, size = "m" }: Props) {
  const g = glow ?? 0;
  const core = glow === null || g < 0.15 ? 0.25 : 0.25 + 0.75 * g;
  const text = glow === null ? "Listening for the city…" : glowLine(g) + (connected ? "" : " (last known)");
  return (
    <div
      className={`${styles.mark} ${size === "s" ? styles.s : ""}`}
      role="img"
      aria-label={glow === null ? text : `${siteName} is ${glowWord(g).toLowerCase()}, glow ${Math.round(g * 100)} percent`}
    >
      <span className={styles.lamp} aria-hidden="true">
        {glow !== null && g >= 0.15 && <span className={styles.halo} style={{ opacity: 0.35 * g }} />}
        <span className={styles.core} style={{ opacity: core }} />
      </span>
      <span className={glow === null ? styles.loading : styles.word}>{text}</span>
    </div>
  );
}

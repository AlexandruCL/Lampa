import { useEffect, useState } from "react";
import styles from "./Subtitle.module.css";

export const SUBTITLE_MS = 8000;
export const SUBTITLE_FADE_MS = 600;
// Design units below the window's bottom edge: under its name and glow line (livingmap.css), or just under the window when the label sits above.
const UNDER_LABEL = 84;
const UNDER_WINDOW = 10;

/** DESIGN.md 7.13 echo subtitle. `x`, `y` and `r` are the window's centre and radius in design units. */
export function Subtitle({ x, y, r, labelBelow, text, lang }: { x: number; y: number; r: number; labelBelow: boolean; text: string; lang: string | null }) {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fading"), SUBTITLE_MS);
    const gone = setTimeout(() => setPhase("gone"), SUBTITLE_MS + SUBTITLE_FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;
  const top = y + r + (labelBelow ? UNDER_LABEL : UNDER_WINDOW);
  return (
    <p
      className={`${styles.subtitle} ${phase === "fading" ? styles.fading : ""}`}
      style={{ left: `calc(${x} * var(--u))`, top: `calc(${top} * var(--u))` }}
    >
      {text}
      {lang && <span className={styles.lang}>{lang}</span>}
    </p>
  );
}

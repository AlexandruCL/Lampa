import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MAP_WIDTH, type LabelSide, type Point } from "./projection";
import styles from "./Subtitle.module.css";
import { subtitleEdge, subtitlePlace, type SubtitleSide } from "./subtitlePlace";

export const SUBTITLE_MS = 8000;
export const SUBTITLE_FADE_MS = 600;
/** DESIGN.md 7.13 echo subtitle under the laid-out `point`, or above it when below would cover one of `others`. */
export function Subtitle({
  point,
  others,
  text,
  lang,
}: {
  point: Point & { label: LabelSide };
  others: Point[];
  text: string;
  lang: string | null;
}) {
  const [phase, setPhase] = useState<"shown" | "fading" | "gone">("shown");
  const [side, setSide] = useState<SubtitleSide>("below");
  const ref = useRef<HTMLParagraphElement>(null);

  // Measured before paint, in design units: the map area is MAP_WIDTH units wide.
  useLayoutEffect(() => {
    const el = ref.current;
    const u = (el?.offsetParent?.clientWidth ?? 0) / MAP_WIDTH;
    if (!el || !u) return;
    setSide(subtitlePlace(point, { width: el.offsetWidth / u, height: el.offsetHeight / u }, others));
  }, [point, others]);

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fading"), SUBTITLE_MS);
    const gone = setTimeout(() => setPhase("gone"), SUBTITLE_MS + SUBTITLE_FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <p
      ref={ref}
      className={`${styles.subtitle} ${side === "above" ? styles.above : ""} ${phase === "fading" ? styles.fading : ""}`}
      style={{ left: `calc(${point.x} * var(--u))`, top: `calc(${subtitleEdge(point, side)} * var(--u))` }}
    >
      {text}
      {lang && <span className={styles.lang}>{lang}</span>}
    </p>
  );
}

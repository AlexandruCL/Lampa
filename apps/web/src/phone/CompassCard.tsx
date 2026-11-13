import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compassWord, formatDistance, formatWeakDistance, relativeAngle, spokenDirection, spokenLine, unwrapAngle } from "../nav/format";
import type { PhoneSite } from "../sites/sites";
import styles from "./CompassCard.module.css";
import { GlowMark } from "./GlowMark";

export const SPOKEN_INTERVAL_MS = 10000;

type Props = {
  site: PhoneSite;
  distanceM: number | null;
  bearing: number | null;
  heading: number | null;
  weak: boolean;
  locationOff: boolean;
  glow: number | null;
  connected: boolean;
  allVisited: boolean;
};

/** DESIGN.md 6.12. The arrow is turned through a ref on every update, with no CSS transition (5.2). */
export function CompassCard({ site, distanceM, bearing, heading, weak, locationOff, glow, connected, allVisited }: Props) {
  const known = !locationOff && distanceM !== null && bearing !== null;
  const showArrow = known && heading !== null;
  const rel = showArrow ? relativeAngle(bearing, heading) : null;

  const arrow = useRef<SVGSVGElement>(null);
  const angle = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (rel === null || !arrow.current) return;
    angle.current = angle.current === null ? rel : unwrapAngle(angle.current, rel);
    arrow.current.style.transform = `rotate(${angle.current}deg)`;
  });

  let distance = "Distance unknown";
  let extra: string | null = "Finding your position";
  if (locationOff) extra = "Location is off. Use Open in Maps or pick from the list.";
  else if (known) {
    distance = weak ? formatWeakDistance(distanceM) : formatDistance(distanceM);
    if (weak) extra = "Finding your position";
    else if (site.is_memorial) extra = "A place of remembrance. Listening and candles only.";
    else if (allVisited) extra = "You have woken every site today. This one is fading.";
    else extra = heading === null ? compassWord(bearing) : null;
  }

  const line = !known
    ? `${site.name}, distance unknown`
    : spokenLine(site.name, distanceM, rel === null ? compassWord(bearing).toLowerCase() : spokenDirection(rel));
  const [spoken, setSpoken] = useState(line);
  const lastAt = useRef(0);
  useEffect(() => {
    const t = setTimeout(() => {
      lastAt.current = Date.now();
      setSpoken(line);
    }, Math.max(0, lastAt.current + SPOKEN_INTERVAL_MS - Date.now()));
    return () => clearTimeout(t);
  }, [line]);

  return (
    <section className={styles.card} aria-label={`Direction to ${site.name}`}>
      {showArrow && (
        <svg ref={arrow} className={`${styles.arrow} ${weak ? styles.weak : ""}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <path d="M60 8L96 62H72V112H48V62H24Z" />
        </svg>
      )}
      <p className={styles.distance} aria-hidden="true">{distance}</p>
      <h2 className={styles.name}>{site.name}</h2>
      {site.is_memorial ? <span className={styles.memorial}>Memorial</span> : <GlowMark siteName={site.name} glow={glow} connected={connected} />}
      {extra && <p className={styles.extra}>{extra}</p>}
      <p className={styles.sr}>{spoken}</p>
    </section>
  );
}

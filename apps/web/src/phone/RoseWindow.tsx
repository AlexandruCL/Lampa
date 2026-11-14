import type { CSSProperties } from "react";
import { t } from "../i18n/t";
import styles from "./RoseWindow.module.css";

type Props = {
  name: string;
  size: "l" | "s";
  /** 48 caught colours or null for an empty pane, slot 0 first. */
  filled: (string | null)[];
  /** 0 to 1. Given: backlight (2.3) and halo (4.3). Absent: no halo, asleep brightness. */
  glow?: number;
  /** Window complete (5.5): halo flare and every pane at full brightness while true. */
  flare?: boolean;
};

// DESIGN.md 6.6: slots per ring and the radius band of each, as fractions of R.
const RINGS = [
  { count: 8, from: 0, to: 0.3 },
  { count: 16, from: 0.34, to: 0.62 },
  { count: 24, from: 0.66, to: 1 },
];
const R = 100;
const pt = (r: number, a: number) => `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;

const SLOTS = RINGS.flatMap(({ count, from, to }) =>
  Array.from({ length: count }, (_, i) => {
    const a0 = (i / count) * 2 * Math.PI;
    const a1 = ((i + 1) / count) * 2 * Math.PI;
    const [r0, r1] = [from * R, to * R];
    return `M${pt(r0, a0)}L${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`;
  }),
);

/** Centre of slot `i` in the SVG's own units (origin at the window centre, window is 2R + 8 wide). */
export function slotCentre(i: number): { x: number; y: number; unit: number } {
  let k = i;
  for (const { count, from, to } of RINGS) {
    if (k < count) {
      const a = ((k + 0.5) / count) * 2 * Math.PI;
      const r = ((from + to) / 2) * R;
      return { x: r * Math.sin(a), y: -r * Math.cos(a), unit: 2 * R + 8 };
    }
    k -= count;
  }
  return { x: 0, y: 0, unit: 2 * R + 8 };
}

export function RoseWindow({ name, size, filled, glow, flare }: Props) {
  const g = Math.min(1, Math.max(0, glow ?? 0));
  const count = filled.filter(Boolean).length;
  const light = flare ? 100 : Math.round((0.45 + 0.55 * g) * 100);
  return (
    <svg
      className={`${styles.window} ${size === "l" ? styles.l : styles.s}`}
      viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${2 * R + 8}`}
      role="img"
      aria-label={t("rose.label", { name, count })}
    >
      {(flare || (glow !== undefined && g > 0)) && (
        <>
          <defs>
            <radialGradient id={`halo-${size}`}>
              <stop offset="0" className={styles.halo} stopOpacity={0.35} />
              <stop offset="1" className={styles.halo} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            r={1.6 * R}
            fill={`url(#halo-${size})`}
            className={flare ? styles.flare : undefined}
            style={{ opacity: g, "--rest": g } as CSSProperties}
          />
        </>
      )}
      <circle r={R + 2} className={styles.frame} />
      {SLOTS.map((d, i) => (
        <path
          key={i}
          d={d}
          className={styles.pane}
          style={filled[i] ? { fill: `color-mix(in srgb, ${filled[i]} ${light}%, var(--bg))` } : undefined}
        />
      ))}
    </svg>
  );
}

import type { CSSProperties } from "react";
import styles from "./Ring.module.css";

type Props = {
  progress: number;
  size?: number;
  filling?: boolean;
  holdMs?: number;
  label: string;
};

const TRACK = 1.5;
const BAR = 6;

export function Ring({ progress, size = 112, filling, holdMs, label }: Props) {
  const p = Math.min(1, Math.max(0, progress));
  const r = (size - BAR) / 2;
  const c = 2 * Math.PI * r;
  const style = holdMs === undefined ? undefined : ({ "--hold": `${holdMs}ms` } as CSSProperties);
  return (
    <svg
      className={`${styles.ring} ${filling ? styles.filling : ""}`}
      style={style}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} strokeWidth={TRACK} />
        <circle
          className={styles.progress}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={BAR}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </g>
    </svg>
  );
}

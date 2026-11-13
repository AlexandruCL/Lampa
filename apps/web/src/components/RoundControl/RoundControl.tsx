import type { CSSProperties, KeyboardEvent } from "react";
import { useRef } from "react";
import { Icon } from "../Icon/Icon";
import { Ring } from "../Ring/Ring";
import styles from "./RoundControl.module.css";

export type RoundControlState = "idle" | "listening" | "recording" | "speaking" | "connecting" | "disabled";

type Props = {
  state: RoundControlState;
  label: string;
  status?: string;
  progress?: number;
  level?: number;
  onPress?: () => void;
  onRelease?: () => void;
};

export function RoundControl({ state, label, status, progress = 0, level = 0, onPress, onRelease }: Props) {
  const held = useRef(false);
  const press = () => {
    if (held.current) return;
    held.current = true;
    onPress?.();
  };
  const release = () => {
    if (!held.current) return;
    held.current = false;
    onRelease?.();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      press();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") release();
  };

  const levelStyle: CSSProperties | undefined =
    state === "listening" ? { transform: `scale(${1 + 0.08 * Math.min(1, Math.max(0, level))})` } : undefined;

  return (
    <div className={`${styles.root} ${styles[state]}`}>
      <div className={styles.status} aria-live="polite">
        {state === "recording" && status && <span className={styles.dot} aria-hidden="true" />}
        {status}
      </div>
      <div className={styles.dial}>
        {state === "recording" && <Ring progress={progress} label={label} />}
        <span className={styles.level} style={levelStyle} aria-hidden="true" />
        <button
          type="button"
          className={styles.button}
          disabled={state === "disabled"}
          aria-busy={state === "connecting" ? "true" : undefined}
          onPointerDown={press}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={release}
        >
          {state === "connecting" ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <Icon name={state === "recording" ? "stop" : "mic"} size={32} />
          )}
        </button>
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

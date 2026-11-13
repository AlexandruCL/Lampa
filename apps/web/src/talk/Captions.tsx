import { memo, useLayoutEffect, useRef } from "react";
import styles from "./Captions.module.css";

export type Line = { key: string; role: "agent" | "user"; text: string };

/** DESIGN 6.10. Not a live region: the voice is already audible. */
export const Captions = memo(function Captions({ name, lines, timeUp }: { name: string; lines: Line[]; timeUp: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  useLayoutEffect(() => {
    if (atBottom.current) box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines, timeUp]);

  return (
    <div
      ref={box}
      className={styles.captions}
      aria-label="Captions"
      role="region"
      onScroll={(e) => {
        const el = e.currentTarget;
        atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 2;
      }}
    >
      <p className={styles.head}>
        <span className={styles.name}>{name}</span> <span className={styles.ai}>AI voice</span>
      </p>
      {lines.length === 0 && !timeUp && <p className={styles.empty}>{name} is listening. Hold the button and ask anything.</p>}
      {lines.map((l) =>
        l.role === "agent" ? (
          <p key={l.key} className={styles.agent}>{l.text}</p>
        ) : (
          <div key={l.key} className={styles.visitor}>
            <span className={styles.you}>You</span>
            <p>{l.text}</p>
          </div>
        ),
      )}
      {timeUp && <p className={styles.empty}>Time is up for this conversation.</p>}
    </div>
  );
});

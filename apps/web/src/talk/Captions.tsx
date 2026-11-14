import { memo, useLayoutEffect, useRef, useState } from "react";
import { ArchiveSheet, type ShownImage } from "./Archive";
import styles from "./Captions.module.css";

export type Line = { key: string; role: "agent" | "user"; text: string } | { key: string; role: "image"; image: ShownImage };

/** DESIGN 6.10. Not a live region: the voice is already audible. */
export const Captions = memo(function Captions({
  name,
  lines,
  timeUp,
  tapToAsk,
}: {
  name: string;
  lines: Line[];
  timeUp: boolean;
  tapToAsk: boolean; // fallback or timeup: the visitor taps questions, nobody is listening
}) {
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [open, setOpen] = useState<ShownImage | null>(null);

  useLayoutEffect(() => {
    if (atBottom.current) box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lines, timeUp]);

  return (
    <>
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
        {lines.length === 0 && (
          <p className={styles.empty}>{tapToAsk ? "Tap a question to hear the answer." : `${name} is listening. Hold the button and ask anything.`}</p>
        )}
        {lines.map((l) =>
          l.role === "image" ? (
            <button key={l.key} type="button" className={styles.card} onClick={() => setOpen(l.image)}>
              {/* the card grows when the image arrives: keep the newest line in view */}
              <img src={l.image.src} alt={l.image.alt} onLoad={() => atBottom.current && box.current?.scrollTo({ top: box.current.scrollHeight })} />
              <span className={styles.credit}>{l.image.credit}</span>
            </button>
          ) : l.role === "agent" ? (
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
      {open && <ArchiveSheet image={open} onClose={() => setOpen(null)} />}
    </>
  );
});

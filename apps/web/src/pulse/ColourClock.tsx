import type { PulseColourClock } from "@lampa/shared";
import styles from "./Charts.module.css";
import { count, segmentPath } from "./pulseCopy";

const SIZE = 420;
const C = SIZE / 2;
// The four hour labels sit in this margin, inside the box, so they never reach the card title, its edges or the "Now" line.
const MARGIN = 40;
const OUTER = C - MARGIN;
const INNER = OUTER * 0.82; // ring thickness 18% of the radius
const DISK = OUTER * 0.3;
const GAP = 2;

/** Label centres, in % of the box: the middle of the margin. */
const EDGE = (MARGIN / 2 / SIZE) * 100;

const LABELS = [
  { hour: 0, left: "50%", top: `${EDGE}%` },
  { hour: 6, left: `${100 - EDGE}%`, top: "50%" },
  { hour: 12, left: "50%", top: `${100 - EDGE}%` },
  { hour: 18, left: `${EDGE}%`, top: "50%" },
];

/** DESIGN 6.19. The hidden table in the card carries the same data. */
export function ColourClock({ data }: { data: PulseColourClock }) {
  const current = data.hours.find((h) => h.hour === data.currentHour);
  return (
    <>
      <div className={styles.clock} aria-hidden="true">
        <svg className={styles.clockSeg} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* The gaps are --bg, painted under the segments, because the card is --surface. */}
          <circle cx={C} cy={C} r={(OUTER + INNER) / 2} fill="none" stroke="var(--bg)" strokeWidth={OUTER - INNER} />
          {data.hours.map((h) =>
            h.hex === null ? (
              <path
                key={h.hour}
                d={segmentPath(h.hour, C, OUTER, INNER, GAP)}
                fill="var(--surface)"
                stroke="var(--line-strong)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <path key={h.hour} d={segmentPath(h.hour, C, OUTER, INNER, GAP)} fill={h.hex} />
            ),
          )}
          <path
            d={segmentPath(data.currentHour, C, OUTER, INNER, GAP)}
            fill="none"
            stroke="var(--text)"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
          {current?.hex ? (
            <circle cx={C} cy={C} r={DISK} fill={current.hex} />
          ) : (
            <circle cx={C} cy={C} r={DISK} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {LABELS.map((l) => (
          <span key={l.hour} className={styles.clockLabel} style={{ left: l.left, top: l.top }}>
            {l.hour}
          </span>
        ))}
      </div>
      <p className={styles.clockNow}>Now, {data.currentHour}:00</p>
      <p className={styles.clockNow}>{count(current?.panes ?? 0, "pane")}</p>
    </>
  );
}

import type { PulseCandles } from "@lampa/shared";
import { ChartCard } from "./ChartCard";
import styles from "./Charts.module.css";
import type { Card } from "./pulseData";
import { candleJitter, candleX } from "./pulseCopy";

/** DESIGN 6.19: the memorial on /pulse. No number, no axis value, no tooltip, no count, no hidden table. */
export function CandleMarks({ data, now }: { data: PulseCandles; now: number }) {
  return (
    <div className={styles.candles} aria-hidden="true">
      <div className={styles.candleLine} />
      {data.candles.map((c) => (
        <span
          key={c.id}
          className={styles.candleDot}
          style={{ left: `${candleX(Date.parse(c.at), now) * 100}%`, top: `calc(24px + ${candleJitter(c.id)}px)` }}
        />
      ))}
      <div className={styles.candleEnds}>
        <span>Earlier today</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export const candlesSummary = (data: PulseCandles) =>
  data.candles.length > 0 ? "Candles have been lit here today." : "No candles yet today.";

/** "No candles yet today." is the summary of an empty line, not an empty state: the line and its ends still show. */
export function CandlesCard({ card, now, className }: { card: Card<PulseCandles>; now: number; className?: string }) {
  return (
    <ChartCard
      title="Candles at the Metropolitan Cathedral"
      className={className}
      card={card}
      now={now}
      reserveClass={styles.candles}
      summary={candlesSummary}
      noNumbers
    >
      {(d) => <CandleMarks data={d} now={now} />}
    </ChartCard>
  );
}

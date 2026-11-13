import type { PulseInteractions } from "@lampa/shared";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import styles from "./Charts.module.css";
import { hhmm, interactionSeries } from "./pulseCopy";

const TICK = { fontSize: 15, fill: "var(--text-3)" };

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "none",
  borderRadius: "var(--radius-s)",
  font: "var(--type-meta)",
  color: "var(--text)",
};

/** DESIGN 6.19 and 7.14: four small multiples, 2 × 2, shared y domain, no legend. */
export function InteractionsCard({ data }: { data: PulseInteractions }) {
  const series = interactionSeries(data);
  const max = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.n)));
  return (
    <div className={styles.multiples}>
      {series.map((s) => (
        <div key={s.siteId} className={styles.multiple}>
          <h3 className={styles.multipleName}>{s.name}</h3>
          <div className={styles.multipleChart}>
            <LineChart
              responsive
              style={{ width: "100%", height: "100%" }}
              data={s.points.map((p) => ({ t: Date.parse(p.t), n: p.n }))}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--line)" strokeWidth={1} />
              <XAxis dataKey="t" tick={TICK} tickFormatter={hhmm} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={TICK} domain={[0, max]} allowDecimals={false} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "var(--text)" }}
                itemStyle={{ color: "var(--text)" }}
                cursor={{ stroke: "var(--line)" }}
                labelFormatter={(t) => hhmm(Number(t))}
              />
              <Line dataKey="n" name="Interactions" stroke="var(--lamp)" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
            </LineChart>
          </div>
        </div>
      ))}
    </div>
  );
}

export const interactionsTable = (data: PulseInteractions) => ({
  head: ["Site", "Time", "Interactions"],
  rows: interactionSeries(data).flatMap((s) => s.points.map((p) => [s.name, hhmm(Date.parse(p.t)), p.n])),
});

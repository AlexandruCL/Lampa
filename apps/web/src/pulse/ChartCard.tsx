import type { ReactNode } from "react";
import { Icon } from "../components";
import styles from "./Charts.module.css";
import { cardStatus, type Card } from "./pulseData";

export type HiddenTable = { head: string[]; rows: (string | number)[][] };

type Props<T> = {
  title: string;
  card: Card<T>;
  now: number;
  className?: string;
  /** Sizing only: holds the body's final size while loading. */
  reserveClass?: string;
  /** Shown instead of the body while loading (for the lamps "... / 731"). */
  loading?: ReactNode;
  /** The empty text when the data has nothing yet, otherwise null. */
  empty?: (data: T) => string | null;
  summary?: (data: T) => string | null;
  table?: (data: T) => HiddenTable;
  /** CandleMarks: no number in any state. */
  noNumbers?: boolean;
  children: (data: T) => ReactNode;
};

/** DESIGN 6.19. */
export function ChartCard<T>({ title, card, now, className, reserveClass, loading, empty, summary, table, noNumbers, children }: Props<T>) {
  const status = cardStatus(card, now);
  const data = card.data;
  const emptyText = data === null ? null : (empty?.(data) ?? null);
  const summaryText = data === null || emptyText !== null ? null : (summary?.(data) ?? null);
  const hidden = data === null || emptyText !== null ? null : table?.(data);

  return (
    <section className={className ? `${styles.card} ${className}` : styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {data === null && status === "loading" &&
        (loading ?? (
          <>
            <div className={`${styles.reserve} ${reserveClass ?? ""}`}>
              <div className={styles.baseline} />
            </div>
            <p className={styles.status}>Loading</p>
          </>
        ))}
      {emptyText !== null && <p className={styles.summary}>{emptyText}</p>}
      {data !== null && emptyText === null && children(data)}
      {summaryText !== null && <p className={styles.summary}>{summaryText}</p>}
      {hidden && (
        // Wrapped: a table grows past width/height, so only a block wrapper hides it fully.
        <div className={styles.hidden}>
        <table>
          <thead>
            <tr>
              {hidden.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hidden.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      {status === "error" && (
        <p className={styles.error}>
          <Icon name="alert" />
          {noNumbers ? "Could not load. Trying again." : "Could not load. Trying again in 5 s."}
        </p>
      )}
      {status === "stale" && !noNumbers && card.updatedAt !== null && (
        <p className={styles.status}>Updated {Math.floor((now - card.updatedAt) / 1000)} s ago</p>
      )}
    </section>
  );
}

import type { PulseLanguages, PulseSummary } from "@lampa/shared";
import styles from "./Charts.module.css";
import { glowRows, languageRows } from "./pulseCopy";

/** Ported from .bars (DESIGN 6.19): the four colour sites, --lamp fill, value in %. */
export function GlowBars({ data }: { data: PulseSummary }) {
  return (
    <ul className={styles.bars} aria-hidden="true">
      {glowRows(data).map((r) => (
        <li key={r.name} className={styles.bar}>
          <span className={styles.barName}>{r.name}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${r.p}%` }} />
            <span className={styles.barValue}>{r.p}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export const glowTable = (data: PulseSummary) => ({ head: ["Site", "Glow"], rows: glowRows(data).map((r) => [r.name, `${r.p}%`]) });

/** --text-2 fill, counts, each language in its own name. */
export function LanguageBars({ data }: { data: PulseLanguages }) {
  const rows = languageRows(data);
  const max = Math.max(1, ...rows.map((r) => r.conversations));
  return (
    <ul className={styles.bars} aria-hidden="true">
      {rows.map((r) => (
        <li key={r.lang} className={styles.bar}>
          <span className={styles.barName} lang={r.lang}>
            {r.name}
          </span>
          <span className={styles.barTrack}>
            <span className={`${styles.barFill} ${styles.barFillQuiet}`} style={{ width: `${(r.conversations / max) * 100}%` }} />
            <span className={styles.barValue}>{r.conversations}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export const languagesTable = (data: PulseLanguages) => ({
  head: ["Language", "Conversations"],
  rows: languageRows(data).map((r) => [r.name, r.conversations]),
});

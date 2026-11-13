import { LAMP_TARGET, PulseCandles, PulseColourClock, PulseInteractions, PulseLanguages, PulseSummary } from "@lampa/shared";
import { useEffect, useState } from "react";
import { GlowMark } from "../phone/GlowMark";
import { GlowBars, glowTable, LanguageBars, languagesTable } from "./Bars";
import { CandlesCard } from "./CandleMarks";
import { ChartCard } from "./ChartCard";
import charts from "./Charts.module.css";
import { ColourClock } from "./ColourClock";
import { InteractionsCard, interactionsTable } from "./InteractionsCard";
import styles from "./PulsePage.module.css";
import {
  clockIsEmpty,
  colourClockSummary,
  glowRows,
  glowSummary,
  headerLine,
  interactionsAreEmpty,
  interactionsSummary,
  lampsValue,
  languagesSummary,
  percent,
} from "./pulseCopy";
import { PULSE_POLL_MS, STALE_MS, usePulse, type Card } from "./pulseData";

/** DESIGN 6.13 LampCounter L, dark variant, plus the 7.14 track. Not a live region on /pulse. */
export function LampsLitToday({ n }: { n: number | null }) {
  const { value, rest } = lampsValue(n);
  return (
    <>
      <p className={charts.numeral}>
        <span className={charts.lampValue}>{value}</span>
        <span className={charts.lampRest}>{rest}</span>
      </p>
      <p className={charts.lampLabel}>lamps lit today</p>
      <div className={charts.lampTrack} aria-hidden="true">
        <div className={charts.lampFill} style={{ width: `${Math.min(1, (n ?? 0) / LAMP_TARGET) * 100}%` }} />
      </div>
    </>
  );
}

type Cards = {
  summary: Card<PulseSummary>;
  clock: Card<PulseColourClock>;
  interactions: Card<PulseInteractions>;
  languages: Card<PulseLanguages>;
  candles: Card<PulseCandles>;
};

/** DESIGN 7.14. Pure in its props, so it renders without a DOM. */
export function PulseView({ cards, now, openedAt }: { cards: Cards; now: number; openedAt: number }) {
  const { summary, clock, interactions, languages, candles } = cards;
  const updates = Object.values(cards).flatMap((c) => (c.updatedAt === null ? [] : [c.updatedAt]));
  const lastResponseAt = updates.length > 0 ? Math.max(...updates) : null;
  const glowConnected = summary.updatedAt !== null && now - summary.updatedAt <= STALE_MS;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pulse of Timișoara</h1>
        <p className={styles.line}>{headerLine(lastResponseAt, now, openedAt)}</p>
      </header>
      <div className={styles.columns}>
        <div className={styles.column}>
          <ChartCard
            title="Colours of the city, by hour"
            className={styles.clockCard}
            card={clock}
            now={now}
            reserveClass={charts.clock}
            empty={(d) => (clockIsEmpty(d) ? colourClockSummary(d) : null)}
            summary={colourClockSummary}
            table={(d) => ({ head: ["Hour", "Hex", "Panes"], rows: d.hours.map((h) => [`${h.hour}:00`, h.hex ?? "none", h.panes]) })}
          >
            {(d) => <ColourClock data={d} />}
          </ChartCard>
          <ChartCard
            title="Interactions per 5 minutes, last 3 hours"
            className={styles.interactionsCard}
            card={interactions}
            now={now}
            reserveClass={charts.multiplesBody}
            empty={(d) => (interactionsAreEmpty(d) ? interactionsSummary(d) : null)}
            summary={interactionsSummary}
            table={interactionsTable}
          >
            {(d) => <InteractionsCard data={d} />}
          </ChartCard>
          <CandlesCard card={candles} now={now} className={styles.candlesCard} />
        </div>
        <div className={styles.column}>
          <ChartCard title="City glow now" className={styles.glowCard} card={summary} now={now} reserveClass={charts.numeralBody}>
            {(d) => (
              <div className={charts.glowNow}>
                <p className={charts.numeral}>{percent(d.cityGlow)}%</p>
                <GlowMark siteName="Timișoara" glow={d.cityGlow} connected={glowConnected} />
              </div>
            )}
          </ChartCard>
          <ChartCard
            title="Glow by site"
            className={styles.glowBarsCard}
            card={summary}
            now={now}
            reserveClass={charts.barsBody}
            empty={(d) => (glowRows(d).length === 0 ? glowSummary(d) : null)}
            summary={glowSummary}
            table={glowTable}
          >
            {(d) => <GlowBars data={d} />}
          </ChartCard>
          <ChartCard title="Lamps lit today" className={styles.lampsCard} card={summary} now={now} loading={<LampsLitToday n={null} />}>
            {(d) => <LampsLitToday n={d.lampsToday} />}
          </ChartCard>
          <ChartCard title="Colours caught today" className={styles.coloursCard} card={summary} now={now} reserveClass={charts.numeralBody}>
            {(d) => <p className={charts.numeral}>{d.coloursToday}</p>}
          </ChartCard>
          <ChartCard title="Unique visitors today" className={styles.visitorsCard} card={summary} now={now} reserveClass={charts.numeralBody}>
            {(d) => <p className={charts.numeral}>{d.visitorsToday}</p>}
          </ChartCard>
          <ChartCard
            title="Languages spoken to the monuments"
            className={styles.languagesCard}
            card={languages}
            now={now}
            reserveClass={charts.barsBody}
            empty={(d) => (d.languages.length === 0 ? languagesSummary(d) : null)}
            summary={languagesSummary}
            table={languagesTable}
          >
            {(d) => <LanguageBars data={d} />}
          </ChartCard>
        </div>
      </div>
    </main>
  );
}

export default function PulsePage() {
  const cards = {
    summary: usePulse("/pulse/summary", PulseSummary),
    clock: usePulse("/pulse/colour-clock", PulseColourClock),
    interactions: usePulse("/pulse/interactions", PulseInteractions),
    languages: usePulse("/pulse/languages", PulseLanguages),
    candles: usePulse("/pulse/candles", PulseCandles),
  };
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(openedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), PULSE_POLL_MS);
    return () => clearInterval(timer);
  }, []);
  return <PulseView cards={cards} now={now} openedAt={openedAt} />;
}

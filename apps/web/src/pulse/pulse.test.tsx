import { PulseSummary, type PulseColourClock, type PulseInteractions } from "@lampa/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { GlowBars, glowTable } from "./Bars";
import { ChartCard } from "./ChartCard";
import { CandlesCard } from "./CandleMarks";
import { ColourClock } from "./ColourClock";
import { LampsLitToday, PulseView } from "./PulsePage";
import {
  candleJitter,
  candleX,
  colourClockSummary,
  glowSummary,
  headerLine,
  languagesSummary,
  interactionsSummary,
  languageName,
  polar,
  segmentAngles,
} from "./pulseCopy";
import { cardStatus, EMPTY_CARD, fetchCard, nextCard, STALE_MS, type Card } from "./pulseData";

const html = renderToStaticMarkup;
const text = (markup: string) => markup.replace(/<[^>]*>/g, " ");
const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 14, 12, 0);

const clock = (panes: Record<number, number>, currentHour = 14): PulseColourClock => ({
  hours: Array.from({ length: 24 }, (_, hour) => ({ hour, hex: panes[hour] ? "#FF8800" : null, panes: panes[hour] ?? 0 })),
  currentHour,
});

const summary: PulseSummary = {
  cityGlow: 0.5,
  glow: [
    { siteId: "unirii", glow: 0.72 },
    { siteId: "cathedral", glow: 0.9 },
    { siteId: "mx", glow: 0.3 },
  ],
  lampsToday: 412,
  coloursToday: 9,
  visitorsToday: 30,
};

it("nextCard keeps the last data on a failed request", () => {
  const ok = nextCard<number>(EMPTY_CARD, { ok: true, data: 7 }, 1000);
  expect(ok).toEqual({ data: 7, error: false, updatedAt: 1000 });
  expect(nextCard(ok, { ok: false }, 6000)).toEqual({ data: 7, error: true, updatedAt: 1000 });
});

it("a body that fails the schema is not ok", async () => {
  const fetch = async () => new Response(JSON.stringify({ cityGlow: 2 }), { status: 200 });
  expect(await fetchCard("/pulse/summary", PulseSummary, { fetch })).toEqual({ ok: false });
  const good = async () => new Response(JSON.stringify(summary), { status: 200 });
  expect(await fetchCard("/pulse/summary", PulseSummary, { fetch: good })).toEqual({ ok: true, data: summary });
  const down = async (): Promise<Response> => {
    throw new TypeError("offline");
  };
  expect(await fetchCard("/pulse/summary", PulseSummary, { fetch: down })).toEqual({ ok: false });
});

it("cardStatus is stale after 30 s", () => {
  const card: Card<number> = { data: 1, error: false, updatedAt: 0 };
  expect(cardStatus(card, STALE_MS)).toBe("live");
  expect(cardStatus(card, STALE_MS + 1)).toBe("stale");
  expect(cardStatus({ ...card, error: true }, 1)).toBe("error");
});

it("cardStatus is loading before the first answer", () => {
  expect(cardStatus(EMPTY_CARD, NOW)).toBe("loading");
  expect(cardStatus({ ...EMPTY_CARD, error: true }, NOW)).toBe("error");
});

it("segment angles start at 12 o'clock and run clockwise", () => {
  expect(segmentAngles(0)).toEqual({ start: 0, end: 15 });
  expect(segmentAngles(6).start).toBe(90);
  const top = polar(100, 100, 50, segmentAngles(0).start);
  const right = polar(100, 100, 50, segmentAngles(6).start);
  expect(top.x).toBeCloseTo(100);
  expect(top.y).toBeCloseTo(50);
  expect(right.x).toBeCloseTo(150);
  expect(right.y).toBeCloseTo(100);
});

it("an hour with no panes is drawn as an outline", () => {
  const out = html(<ColourClock data={clock({ 3: 5, 14: 2 })} />);
  expect(out.match(/stroke="var\(--line-strong\)"/g)).toHaveLength(22);
  expect(out.match(/fill="#FF8800"/g)).toHaveLength(3); // two segments and the centre disk
});

it("the colour clock summary names the hour with most panes", () => {
  expect(colourClockSummary(clock({ 3: 5, 14: 2, 20: 9 }))).toBe("The most colourful hour is 20:00, with 9 panes.");
  expect(colourClockSummary(clock({}))).toBe("No colours yet today.");
});

it("the interactions summary names the busiest site in the last 5 minutes", () => {
  const pts = (...ns: number[]) => ns.map((n, i) => ({ t: new Date(NOW + i * 300_000).toISOString(), n }));
  const data: PulseInteractions = {
    sites: [
      { siteId: "mx", points: pts(40, 2) },
      { siteId: "unirii", points: pts(1, 38) },
      { siteId: "cathedral", points: pts(0, 99) },
    ],
  };
  expect(interactionsSummary(data)).toBe("Busiest now: Piața Unirii, 38 interactions in the last 5 minutes.");
  expect(interactionsSummary({ sites: [{ siteId: "mx", points: pts(0, 0) }] })).toBe("No interactions yet today.");
});

it("a candle's x is its time between 24 h ago and now", () => {
  expect(candleX(NOW - 24 * HOUR, NOW)).toBe(0);
  expect(candleX(NOW - 12 * HOUR, NOW)).toBe(0.5);
  expect(candleX(NOW, NOW)).toBe(1);
  expect(candleX(NOW - 30 * HOUR, NOW)).toBe(0);
});

it("a candle's jitter is the same for the same id and within 8 px", () => {
  const ids = Array.from({ length: 200 }, (_, i) => `candle-${i}`);
  for (const id of ids) {
    expect(candleJitter(id)).toBe(candleJitter(id));
    expect(Math.abs(candleJitter(id))).toBeLessThanOrEqual(8);
  }
  expect(new Set(ids.map(candleJitter)).size).toBeGreaterThan(8);
});

it("no candle text contains a digit", () => {
  const data = { candles: [{ id: "a1", at: new Date(NOW - HOUR).toISOString() }] };
  const card = (c: Card<typeof data>, now: number) => html(<CandlesCard card={c} now={now} />);
  const states = [
    card(EMPTY_CARD, NOW),
    card({ data: { candles: [] }, error: false, updatedAt: NOW }, NOW),
    card({ data, error: false, updatedAt: NOW }, NOW),
    card({ data, error: false, updatedAt: NOW - 60_000 }, NOW),
    card({ data, error: true, updatedAt: NOW }, NOW),
    card({ ...EMPTY_CARD, error: true }, NOW),
  ];
  for (const out of states) {
    expect(text(out)).not.toMatch(/\d/);
    expect(out).not.toMatch(/aria-label="[^"]*\d|title="[^"]*\d|<table/);
  }
});

it("the glow bars leave the Cathedral out", () => {
  const out = html(<GlowBars data={summary} />) + JSON.stringify(glowTable(summary));
  expect(out).toContain("Piața Unirii");
  expect(out).toContain("72%");
  expect(out).not.toMatch(/Cathedral|cathedral|90%/);
});

it("a language code becomes its own name", () => {
  expect(["ro", "en", "hu", "de", "sr"].map(languageName)).toEqual(["Română", "English", "Magyar", "Deutsch", "Srpski"]);
  expect(languageName("fr")).toBe("fr");
});

it("the page renders every card title", () => {
  const out = html(
    <PulseView
      cards={{ summary: EMPTY_CARD, clock: EMPTY_CARD, interactions: EMPTY_CARD, languages: EMPTY_CARD, candles: EMPTY_CARD }}
      now={NOW}
      openedAt={NOW}
    />,
  );
  expect(out.match(/<h1/g)).toHaveLength(1);
  for (const title of [
    "Colours of the city, by hour",
    "Interactions per 5 minutes, last 3 hours",
    "Candles at the Metropolitan Cathedral",
    "City glow now",
    "Glow by site",
    "Lamps lit today",
    "Colours caught today",
    "Unique visitors today",
    "Languages spoken to the monuments",
  ])
    expect(out).toContain(`>${title}</h2>`);
  expect(out).not.toMatch(/aria-live|role="status"/);
});

it("headerLine shows Not updating after 30 s without a response, with HH:mm in Timișoara", () => {
  const last = Date.UTC(2026, 10, 14, 10, 5); // 12:05 in Timișoara (UTC+2 in November)
  expect(headerLine(last, last + STALE_MS)).toBe("Live. Updated every 5 seconds.");
  expect(headerLine(last, last + STALE_MS + 1)).toBe("Not updating. Last update 12:05.");
});

it("the lamps value shows n / 731", () => {
  expect(text(html(<LampsLitToday n={412} />)).replace(/\s+/g, " ")).toContain("412 / 731");
  expect(text(html(<LampsLitToday n={null} />)).replace(/\s+/g, " ")).toContain("... / 731");
});

const pts = (...ns: number[]) => ns.map((n, i) => ({ t: new Date(NOW + i * 300_000).toISOString(), n }));

it("there is no Busiest now sentence when the last 5 minutes are all zero", () => {
  const data: PulseInteractions = { sites: [{ siteId: "mx", points: pts(4, 0) }, { siteId: "unirii", points: pts(2, 0) }] };
  expect(interactionsSummary(data)).toBeNull();
});

it("a count of one is singular", () => {
  expect(colourClockSummary(clock({ 5: 1 }))).toBe("The most colourful hour is 5:00, with 1 pane.");
  expect(interactionsSummary({ sites: [{ siteId: "mx", points: pts(0, 1) }] })).toBe(
    "Busiest now: Muzeul MX Corneliu Miklosi, 1 interaction in the last 5 minutes.",
  );
  expect(languagesSummary({ languages: [{ lang: "hu", conversations: 1 }] })).toBe("Most spoken: Magyar, 1 conversation today.");
  expect(text(html(<ColourClock data={clock({ 14: 1 })} />))).toContain("1 pane");
});

it("glow by site with no colour site says No glow yet today", () => {
  const onlyCathedral = { ...summary, glow: [{ siteId: "cathedral", glow: 0.9 }] };
  expect(glowSummary(onlyCathedral)).toBe("No glow yet today.");
  const out = html(
    <ChartCard
      title="Glow by site"
      card={{ data: onlyCathedral, error: false, updatedAt: NOW }}
      now={NOW}
      empty={(d) => (glowSummary(d) === "No glow yet today." ? glowSummary(d) : null)}
      summary={glowSummary}
      table={glowTable}
    >
      {(d) => <GlowBars data={d} />}
    </ChartCard>,
  );
  expect(out).toContain("No glow yet today.");
  expect(out).not.toMatch(/Cathedral|90%|<table/);
});

it("headerLine shows Not updating 30 s after the page opens with no response", () => {
  expect(headerLine(null, NOW + STALE_MS, NOW)).toBe("Live. Updated every 5 seconds.");
  expect(headerLine(null, NOW + STALE_MS + 1, NOW)).toBe("Not updating.");
});

it("the centre disk is an outline when the current hour has no colour", () => {
  const out = html(<ColourClock data={clock({ 3: 5 }, 14)} />);
  expect(out).toMatch(/<circle[^>]*fill="none"[^>]*stroke="var\(--line-strong\)"/);
  expect(out).not.toMatch(/<circle[^>]*fill="#/);
});

import { MAP_LINES, sites, type FinaleMessage } from "@lampa/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRadioPlaying, playRadio, stopRadio } from "../audio/radio";
import { layout, SITE_RADIUS } from "../screen/projection";
import { FinaleMapLayer, FinalePanel, radioKey, radioOnFinale, type ScreenShown } from "./ScreenFinale";
import styles from "./ScreenFinale.module.css";

vi.mock("../audio/radio", () => ({ isRadioPlaying: vi.fn(() => false), playRadio: vi.fn(() => Promise.resolve("ended")), stopRadio: vi.fn() }));

const message: FinaleMessage = { startAt: 50_000 };
const shown = (phase: ScreenShown["phase"], reduced = false): ScreenShown => ({ phase, reduced, delayMs: 0 });
const text = (html: string) => html.replace(/<[^>]+>/g, "");
const placed = layout(sites, MAP_LINES);
const cathedral = sites.find((s) => s.is_memorial)!;
const R = SITE_RADIUS;
const circleAt = (x: number, y: number) => `M${x - R},${y}a${R},${R} 0 1 0 ${2 * R},0a${R},${R} 0 1 0 ${-2 * R},0Z`;
const pathOf = (html: string) => html.match(/ d="([^"]+)"/)![1];

describe("FinalePanel", () => {
  it("shows 731 / 731 and the date only from the burst", () => {
    for (const phase of ["crackle", "silence"] as const) expect(renderToStaticMarkup(<FinalePanel finale={message} shown={shown(phase)} />)).toBe("");
    expect(renderToStaticMarkup(<FinalePanel finale={null} />)).toBe("");
    const burst = renderToStaticMarkup(<FinalePanel finale={message} shown={shown("burst")} />);
    expect(text(burst)).toContain("731 / 731");
    expect(burst).toContain(`<span class="${styles.lit}">731</span>`);
    expect(text(burst)).toContain("12 November 1884");
    expect(burst).not.toContain(styles.settle);
    expect(renderToStaticMarkup(<FinalePanel finale={message} shown={shown("settle")} />)).toContain(styles.settle);
  });
});

describe("FinaleMapLayer", () => {
  it("leaves a hole over the Cathedral's candle field and label, where it is placed", () => {
    const p = placed.find((q) => q.id === cathedral.id)!;
    const d = pathOf(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={placed} shown={shown("silence")} />));
    expect(d).toContain(circleAt(p.x, p.y));
    expect(d.match(/M/g)).toHaveLength(3); // sheet, circle, label box

    // Moved: the hole follows the placed position, and the label box flips with its side.
    const moved = placed.map((q) => (q.id === cathedral.id ? { ...q, x: 400, y: 300, label: "below" as const } : q));
    const d2 = pathOf(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={moved} shown={shown("silence")} />));
    expect(d2).toContain(circleAt(400, 300));
    expect(d2).toMatch(new RegExp(`V${300 + R + 10 + 36}H`)); // canvas.ts: gap 10, one 36-unit name line
    const up = moved.map((q) => (q.id === cathedral.id ? { ...q, label: "above" as const } : q));
    const d3 = pathOf(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={up} shown={shown("silence")} />));
    expect(d3).toMatch(new RegExp(`,${300 - R - 10 - 36}H`));
  });

  it("fills the sheet with evenodd, so the holes stay open", () => {
    expect(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={placed} shown={shown("silence")} />)).toContain('fill-rule="evenodd"');
  });

  it("dips in the crackle, but fades with no dip class under reduced motion", () => {
    expect(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={placed} shown={shown("crackle")} />)).toContain(styles.dips);
    const reduced = renderToStaticMarkup(<FinaleMapLayer finale={message} placed={placed} shown={shown("crackle", true)} />);
    expect(reduced).not.toContain(styles.dips);
    expect(reduced).toContain(styles.fade);
  });

  it("is gone once the burst is over, and absent with no finale", () => {
    expect(renderToStaticMarkup(<FinaleMapLayer finale={message} placed={placed} shown={shown("settle")} />)).toBe("");
    expect(renderToStaticMarkup(<FinaleMapLayer finale={null} placed={placed} />)).toBe("");
  });
});

describe("Radio Lampa on the panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRadioPlaying).mockReturnValue(false);
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it("R or r starts the episode and re-renders when it starts and ends; other keys do nothing", async () => {
    const update = vi.fn();
    radioKey("x", null, update);
    expect(playRadio).not.toHaveBeenCalled();
    radioKey("r", null, update);
    radioKey("R", null, update);
    expect(playRadio).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(2);
    await flush();
    expect(update).toHaveBeenCalledTimes(4);
  });

  it("a second R while the episode plays starts nothing", () => {
    vi.mocked(isRadioPlaying).mockReturnValue(true);
    const update = vi.fn();
    radioKey("r", null, update);
    expect(playRadio).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    vi.mocked(isRadioPlaying).mockReturnValue(false);
  });

  it("R while the finale shows, from the crackle to the end of the settle, starts nothing", () => {
    const update = vi.fn();
    for (const phase of ["crackle", "silence", "burst", "settle"] as const) radioKey("r", shown(phase), update);
    expect(playRadio).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("a finale message stops the episode; no message does not", () => {
    radioOnFinale(null);
    expect(stopRadio).not.toHaveBeenCalled();
    radioOnFinale(message);
    expect(stopRadio).toHaveBeenCalledOnce();
  });

  it('shows "Radio Lampa" only while the episode plays, with no captions', () => {
    expect(renderToStaticMarkup(<FinalePanel finale={null} />)).toBe("");
    vi.mocked(isRadioPlaying).mockReturnValue(true);
    expect(renderToStaticMarkup(<FinalePanel finale={null} />)).toBe(`<p class="${styles.date}">Radio Lampa</p>`);
    vi.mocked(isRadioPlaying).mockReturnValue(false);
    expect(renderToStaticMarkup(<FinalePanel finale={null} radio={false} />)).toBe("");
  });
});

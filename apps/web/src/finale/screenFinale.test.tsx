import { MAP_LINES, sites, type FinaleMessage } from "@lampa/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { layout, SITE_RADIUS } from "../screen/projection";
import { FinaleMapLayer, FinalePanel, type ScreenShown } from "./ScreenFinale";
import styles from "./ScreenFinale.module.css";

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

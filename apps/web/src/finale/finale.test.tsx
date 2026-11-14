import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PhoneSite } from "../sites/sites";
import { PhoneFinale, type FinaleShown } from "./PhoneFinale";
import styles from "./PhoneFinale.module.css";

const site = { id: "victoriei", name: "Piața Victoriei", lamp: true } as PhoneSite;
const memorial = { id: "catedrala", name: "Metropolitan Cathedral", is_memorial: true, lamp: false } as PhoneSite;
const noop = () => {};
const shown = (over: Partial<FinaleShown> = {}): FinaleShown => ({
  phase: "burst",
  reduced: false,
  suspended: false,
  onBack: noop,
  onTap: noop,
  ...over,
});
const render = (s: PhoneSite | undefined, over: Partial<FinaleShown> = {}) =>
  renderToStaticMarkup(<PhoneFinale site={s} shown={shown(over)} />);
const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("PhoneFinale", () => {
  it("renders nothing on the memorial, even mid-finale", () => {
    for (const phase of ["crackle", "silence", "burst"] as const) expect(render(memorial, { phase })).toBe("");
    expect(render(site)).not.toBe(""); // control: the same state shows on a site
  });

  it("shows the line, 731 / 731 and the way back at the burst", () => {
    const out = render(site);
    expect(out).toContain('aria-label="The 1884 moment"');
    expect(out).toContain("12 November 1884. 731 lamps. Tonight, again.");
    expect(text(out)).toContain("731 / 731");
    expect(out).toContain("Back to Piața Victoriei");
    expect(out).not.toContain("Tap to hear the waltz");
    expect(render(undefined)).toMatch(/<button[^>]*>Back<\/button>/);
  });

  it("shows nothing but the dark overlay in the silence", () => {
    const out = render(site, { phase: "silence" });
    expect(out).toContain(styles.dark);
    expect(out).not.toContain("<button");
    expect(out).not.toContain("1884.");
    expect(text(out)).toBe("");
  });

  it("dips in the crackle, and fades instead under reduced motion", () => {
    expect(styles.dips).toMatch(/\w/); // CSS modules give real class names here, so the checks below mean something
    const out = render(site, { phase: "crackle", delayMs: -400 });
    expect(out).toContain(styles.dips);
    expect(out).toContain("animation-delay:-400ms");
    const reduced = render(site, { phase: "crackle", reduced: true });
    expect(reduced).not.toContain(styles.dips);
    expect(reduced).toContain(styles.fade);
  });

  it("offers the waltz when audio is suspended at the burst", () => {
    expect(render(site, { suspended: true })).toContain("Tap to hear the waltz");
  });
});

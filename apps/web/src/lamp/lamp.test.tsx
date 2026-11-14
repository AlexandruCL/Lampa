import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LampsMessage } from "@lampa/shared";
import type { PhoneSite } from "../sites/sites";
import { Lamp, LampView, rearms } from "./Lamp";
import { counterSpoken, LampCounter } from "./LampCounter";

const site = { id: "victoriei", name: "Piața Victoriei", lamp: true } as PhoneSite;
const lamps: LampsMessage = { litToday: 412, target: 731, sites: [{ siteId: "victoriei", lightingNow: 5 }] };
const noop = () => {};
const view = (over: Partial<Parameters<typeof LampView>[0]> = {}) =>
  renderToStaticMarkup(
    <LampView
      site={site}
      demo={false}
      lamps={lamps}
      connected
      canRaise
      progress={0}
      surface="off"
      lowered={false}
      hint
      presence="5 people are lighting Piața Victoriei now."
      onLight={noop}
      onLower={noop}
      onBack={noop}
      {...over}
    />,
  );

describe("Lamp", () => {
  it("renders the instruction with the Ring, the counter and both ways out", () => {
    const out = renderToStaticMarkup(<Lamp site={site} demo={false} lamps={lamps} connected motion="granted" onBack={noop} />);
    expect(out).toContain("Raise your phone above your head.");
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('width="160"');
    expect(out).toContain("412");
    expect(out).toContain("lamps lit today");
    expect(out).toContain("Light without raising");
    expect(out).toContain("Back to Piața Victoriei");
    expect(out).not.toContain("Your lamp is lit.");
  });

  it("renders the lit state on the LightSurface", () => {
    const out = view({ surface: "on", presence: "You and 4 others are lighting Piața Victoriei now." });
    expect(out).toContain("Your lamp is lit.");
    expect(out).toContain("You and 4 others are lighting Piața Victoriei now.");
    expect(out).toContain("Lower your phone to stop.");
    expect(out).toContain("Lower the lamp");
    expect(out).toMatch(/<main[^>]*inert/);
  });

  it("renders the no-motion state without the Ring", () => {
    const out = renderToStaticMarkup(<Lamp site={site} demo={false} lamps={lamps} connected motion="denied" onBack={noop} />);
    expect(out).toContain("This phone cannot tell when it is raised. Tap to light the lamp.");
    expect(out).toContain("Light the lamp");
    expect(out).not.toContain("progressbar");
    expect(out).not.toContain("Raise your phone above your head.");
    expect(out).not.toContain("Light without raising");
  });

  it("hides the lower-your-phone hint on a lamp lit by tap", () => {
    const out = view({ surface: "on", hint: false });
    expect(out).toContain("Your lamp is lit.");
    expect(out).not.toContain("Lower your phone to stop.");
    expect(out).toContain("Lower the lamp");
  });

  it("re-arms the raise after the button only once the phone is under 40", () => {
    expect(rearms(39)).toBe(true);
    expect(rearms(40)).toBe(false);
    expect(rearms(70)).toBe(false);
    expect(rearms(null)).toBe(false);
  });

  it("renders the instruction and the lit state in Romanian", () => {
    const off = view({ lang: "ro" });
    expect(off).toContain("Ridică telefonul deasupra capului.");
    expect(off).toContain("Aprinde fără să ridici");
    expect(off).toContain("Înapoi la Piața Victoriei");
    expect(off).toContain("lămpi aprinse azi");
    expect(off).not.toContain("Raise your phone above your head.");
    const lit = view({ lang: "ro", surface: "on", presence: "Tu și încă 4 persoane aprindeți Piața Victoriei acum." });
    expect(lit).toContain("Lampa ta e aprinsă.");
    expect(lit).toContain("Coboară lampa");
    expect(lit).not.toContain("Your lamp is lit.");
  });

  it("says the lamp was lowered", () => {
    expect(view({ lowered: true })).toContain("Lamp lowered. Raise it again to keep it lit.");
  });
});

describe("LampCounter", () => {
  it("loading, live and offline", () => {
    expect(renderToStaticMarkup(<LampCounter lamps={null} connected size="s" />)).toMatch(/\.\.\. \/ 731.*lamps lit today/);
    const live = renderToStaticMarkup(<LampCounter lamps={lamps} connected size="l" />);
    expect(live).toContain('role="status" aria-atomic="true"');
    expect(live).toContain("412 of 731 lamps lit today");
    expect(live).not.toContain("last known");
    expect(renderToStaticMarkup(<LampCounter lamps={lamps} connected={false} size="s" />)).toContain("(last known)");
    expect(renderToStaticMarkup(<LampCounter lamps={null} connected={false} size="l" />)).not.toContain("last known");
    const ro = renderToStaticMarkup(<LampCounter lamps={lamps} connected={false} size="l" lang="ro" />);
    expect(ro).toContain("412 din 731 de lămpi aprinse azi, ultima valoare cunoscută");
    expect(ro).toContain("(ultima valoare cunoscută)");
  });

  it("the spoken counter's Romanian 'de' follows the target's plural category", () => {
    expect(counterSpoken(412, 731, false, "ro")).toBe("412 din 731 de lămpi aprinse azi");
    expect(counterSpoken(412, 731, true, "ro")).toBe("412 din 731 de lămpi aprinse azi, ultima valoare cunoscută");
    expect(counterSpoken(40, 101, false, "ro")).toBe("40 din 101 lămpi aprinse azi");
    expect(counterSpoken(40, 101, true, "ro")).toBe("40 din 101 lămpi aprinse azi, ultima valoare cunoscută");
    expect(counterSpoken(40, 101, false, "en")).toBe("40 of 101 lamps lit today");
  });
});

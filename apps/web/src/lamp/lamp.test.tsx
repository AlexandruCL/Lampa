import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LampsMessage } from "@lampa/shared";
import type { PhoneSite } from "../sites/sites";
import { Lamp, LampView } from "./Lamp";
import { LampCounter } from "./LampCounter";

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
  });
});

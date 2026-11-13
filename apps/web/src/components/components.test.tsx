import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, Icon, Notice, Ring, RoundControl, type IconName } from "./index";

const html = renderToStaticMarkup;

describe("components", () => {
  it("icon button carries its aria-label", () => {
    expect(html(<Button variant="icon" aria-label="Close" icon="close" />)).toContain('aria-label="Close"');
  });

  it("notice error is an alert and notice info is a status", () => {
    expect(html(<Notice variant="error">Failed</Notice>)).toContain('role="alert"');
    expect(html(<Notice variant="info">Tap to listen</Notice>)).toContain('role="status"');
  });

  it("ring exposes progressbar with a whole percent", () => {
    const out = html(<Ring progress={0.724} label="Hold" />);
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="72"');
  });

  it("round control disabled renders a disabled button and no ring", () => {
    const out = html(<RoundControl state="disabled" label="Microphone is off" />);
    expect(out).toMatch(/<button[^>]*disabled/);
    expect(out).not.toContain("progressbar");
  });

  it("round control recording shows the stop icon and the status text", () => {
    const out = html(<RoundControl state="recording" label="Stop" status="Recording, 14 s left" progress={0.3} />);
    expect(out).toContain("M7 7h10v10H7z");
    expect(out).toContain("Recording, 14 s left");
  });

  it("every icon name renders a path", () => {
    const names: IconName[] = ["back", "close", "play", "pause", "stop", "mic", "check", "alert", "headphones"];
    for (const name of names) expect(html(<Icon name={name} />)).toMatch(/<path d="M[^"]+"/);
  });
});

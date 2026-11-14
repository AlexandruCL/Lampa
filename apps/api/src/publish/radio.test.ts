import type { PulseLanguages, PulseSummary } from "@lampa/shared";
import { describe, expect, it } from "vitest";
import { makeRadio, radioScript, type RadioOpts } from "./radio.js";

// Made-up numbers and voice ids only.
const voices = { mx: "voiceMx01", unirii: "voiceUn01", victoriei: "voiceVi01", bastion: "voiceBa01" };
const summary = (o: Partial<PulseSummary> = {}): PulseSummary => ({
  cityGlow: 0.4,
  glow: [
    { siteId: "mx", glow: 0.2 },
    { siteId: "unirii", glow: 0.3 },
    { siteId: "victoriei", glow: 0.1 },
    { siteId: "bastion", glow: 0.6 },
  ],
  lampsToday: 412,
  coloursToday: 37,
  visitorsToday: 25,
  ...o,
});
const langs = (...codes: string[]): PulseLanguages => ({ languages: codes.map((lang, i) => ({ lang, conversations: 9 - i })) });
const lines = (s: PulseSummary, l = langs("hu", "en")) =>
  radioScript(s, l, voices).inputs.map((i) => `${Object.entries(voices).find(([, v]) => v === i.voice_id)![0]}: ${i.text}`);

describe("radioScript", () => {
  it("speaks the five lines in order", () => {
    expect(lines(summary())).toEqual([
      "mx: Good evening, this is Radio Lampa, from the museum. Today 25 people came by and caught 37 colours.",
      "unirii: Theresia Bastion was the brightest of us tonight. Show-off.",
      "victoriei: 412 lamps lit today. 319 short of 1884. Tomorrow.",
      "bastion: Most of you spoke Hungarian to us.",
      "mx: Good night, Timișoara. Keep us lit.",
    ]);
  });

  it("gives line 2 to victoriei when unirii is the busiest", () => {
    expect(lines(summary({ glow: [{ siteId: "unirii", glow: 0.9 }] }))[1]).toBe(
      "victoriei: Piața Unirii was the brightest of us tonight. Show-off.",
    );
  });

  it("takes the first site in file order on a tie", () => {
    const glow = [
      { siteId: "bastion", glow: 0.5 },
      { siteId: "victoriei", glow: 0.5 },
    ];
    expect(lines(summary({ glow }))[1]).toBe("unirii: Piața Victoriei was the brightest of us tonight. Show-off.");
  });

  it("skips line 2 when every glow is 0", () => {
    const out = lines(summary({ glow: summary().glow.map((g) => ({ ...g, glow: 0 })) }));
    expect(out).toHaveLength(4);
    expect(out.some((l) => l.includes("brightest"))).toBe(false);
  });

  it("says the 1884 line at 731 and the short line at 721", () => {
    expect(lines(summary({ lampsToday: 731 }))[2]).toBe("victoriei: 731 lamps lit today. In 1884 it took 731. Tonight, again.");
    expect(lines(summary({ lampsToday: 721 }))[2]).toBe("victoriei: 721 lamps lit today. 10 short of 1884. Tomorrow.");
  });

  it("skips line 4 when no language was spoken", () => {
    expect(lines(summary(), langs()).some((l) => l.startsWith("bastion:"))).toBe(false);
  });

  it("skips line 4 when the top language code is unknown", () => {
    expect(lines(summary(), langs("xx", "en")).some((l) => l.startsWith("bastion:"))).toBe(false);
    expect(lines(summary(), langs("toString")).some((l) => l.startsWith("bastion:"))).toBe(false);
  });

  it("uses the singular for 1 visitor and 1 colour", () => {
    expect(lines(summary({ visitorsToday: 1, coloursToday: 1 }))[0]).toBe(
      "mx: Good evening, this is Radio Lampa, from the museum. Today 1 person came by and caught 1 colour.",
    );
  });

  it("never names the Cathedral, even when its glow is the highest", () => {
    const glow = [...summary().glow, { siteId: "cathedral", glow: 1 }];
    const out = lines(summary({ glow }));
    expect(out[1]).toBe("unirii: Theresia Bastion was the brightest of us tonight. Show-off.");
    expect(out.some((l) => /cathedral/i.test(l))).toBe(false);
  });

  it("throws on a missing voice", () => {
    const { bastion: _, ...rest } = voices;
    expect(() => radioScript(summary(), langs("hu"), rest)).toThrow("missing voice bastion");
    expect(() => radioScript(summary(), langs("hu"), { ...voices, mx: "" })).toThrow("missing voice mx");
  });

  it("counts chars as the summed text length", () => {
    const s = radioScript(summary(), langs("hu"), voices);
    expect(s.chars).toBe(s.inputs.reduce((n, i) => n + i.text.length, 0));
  });
});

describe("makeRadio", () => {
  const script = radioScript(summary(), langs("hu"), voices);
  const opts = (status: number, calls: string[], put: string[] = []): RadioOpts => ({
    fetch: (async (url: string) => {
      calls.push(url);
      return new Response(new Uint8Array([1, 2, 3]), { status });
    }) as typeof fetch,
    apiKey: "test-key",
    put: (file) => put.push(file),
    maxCredits: 2000,
  });

  it("writes the episode on a 200", async () => {
    const calls: string[] = [];
    const put: string[] = [];
    const r = await makeRadio(script, opts(200, calls, put));
    expect(r.outcome).toBe("done");
    expect(r.file).toMatch(/^project\/radio-1-[0-9a-f]{12}\.mp3$/);
    expect(put).toEqual([r.file]);
    expect(calls).toEqual(["https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128"]);
  });

  it("returns the status on a non-200 and writes nothing", async () => {
    const put: string[] = [];
    const r = await makeRadio(script, opts(401, [], put));
    expect(r).toMatchObject({ outcome: "failed", status: 401 });
    expect(put).toEqual([]);
  });

  it("never calls when over the cap or over 2,000 characters", async () => {
    const calls: string[] = [];
    expect((await makeRadio(script, { ...opts(200, calls), maxCredits: script.chars - 1 })).outcome).toBe("over_cap");
    const long = { ...script, chars: 2001 };
    expect((await makeRadio(long, { ...opts(200, calls), maxCredits: 1e6 })).outcome).toBe("too_long");
    expect(calls).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import type { ArchiveImage } from "../audio/clips";
import { SITES } from "../sites/sites";
import {
  caughtLine,
  ECHO_OPENED,
  findImage,
  IMAGE_SHOWN,
  NO_NEXT_SITE,
  NO_SUCH_IMAGE,
  nextSiteFrom,
  nextSiteLine,
  parseLight,
  parsePrompt,
  shouldEnd,
} from "./tools";

describe("parseLight", () => {
  it("a valid call gives the colour at a quarter of its intensity", () =>
    expect(parseLight({ color: "#C8102e", intensity: 0.5 })).toEqual({ hex: "#C8102e", alpha: 0.125 }));
  it("intensity 2 clamps to alpha 0.25", () => expect(parseLight({ color: "#c8102e", intensity: 2 })?.alpha).toBe(0.25));
  it("intensity -1 clamps to alpha 0", () => expect(parseLight({ color: "#c8102e", intensity: -1 })?.alpha).toBe(0));
  it.each([
    ["a colour name", { color: "red", intensity: 0.5 }],
    ["five hex digits", { color: "#12345", intensity: 0.5 }],
    ["no intensity", { color: "#c8102e" }],
    ["a NaN intensity", { color: "#c8102e", intensity: NaN }],
    ["null", null],
  ])("%s gives null", (_, params) => expect(parseLight(params)).toBeNull());
});

it("caughtLine names the colour in English", () => expect(caughtLine("#c8102e")).toBe("caught Red (#c8102e)"));

const archive: ArchiveImage[] = [
  { id: "tram-1910", file: "unirii/tram.jpg", alt: { en: "A tram", ro: "Un tramvai" }, credit: "City archive", year: "1910" },
  { id: "fountain", file: "unirii/fountain.jpg", alt: { en: "The fountain" }, credit: "Museum", year: "1935" },
];

describe("findImage", () => {
  it("finds the image by id", () => expect(findImage(archive, { image_id: "fountain" })).toBe(archive[1]));
  it.each([
    ["an unknown id", { image_id: "nope" }],
    ["a number id", { image_id: 1 }],
    ["no id", {}],
    ["null", null],
  ])("%s gives null", (_, params) => expect(findImage(archive, params)).toBeNull());
});

describe("parsePrompt", () => {
  it("takes the persona's prompt, trimmed", () => expect(parsePrompt({ prompt: "  Tell me about the bells. " })).toBe("Tell me about the bells."));
  it.each([
    ["a missing prompt", {}],
    ["an empty prompt", { prompt: "  " }],
    ["a number", { prompt: 3 }],
    ["null", null],
  ])("%s gives undefined, so the recorder shows its own line", (_, params) => expect(parsePrompt(params)).toBeUndefined());
});

it("the tools' return strings", () => {
  expect(IMAGE_SHOWN).toBe("shown");
  expect(NO_SUCH_IMAGE).toBe("no such image");
  expect(ECHO_OPENED).toBe("opened");
  expect(NO_NEXT_SITE).toBe("no other site");
});

describe("suggest_next_site", () => {
  it("never suggests the site the visitor stands at", () => {
    for (const site of SITES) {
      const next = nextSiteFrom(site);
      expect(next).not.toBeNull();
      expect(next!.id).not.toBe(site.id);
    }
  });

  it("names the site with its hint, or alone without one", () => {
    expect(nextSiteLine("Piața Unirii", "Walk north along the tram line.")).toBe("Piața Unirii: Walk north along the tram line.");
    expect(nextSiteLine("Piața Unirii", null)).toBe("Piața Unirii");
    expect(nextSiteLine("Piața Unirii", "")).toBe("Piața Unirii");
  });
});

describe("shouldEnd", () => {
  const calledAt = 1000;
  it("not before a turn", () => expect(shouldEnd({ calledAt, sawSpeaking: false, speaking: false, now: calledAt + 100 })).toBe(false));
  it("not during the turn", () => expect(shouldEnd({ calledAt, sawSpeaking: true, speaking: true, now: calledAt + 9000 })).toBe(false));
  it("at the end of a turn", () => expect(shouldEnd({ calledAt, sawSpeaking: true, speaking: false, now: calledAt + 2000 })).toBe(true));
  it("at 8000 ms with no turn", () => expect(shouldEnd({ calledAt, sawSpeaking: false, speaking: false, now: calledAt + 8000 })).toBe(true));
  it("not at 7999 ms", () => expect(shouldEnd({ calledAt, sawSpeaking: false, speaking: false, now: calledAt + 7999 })).toBe(false));
});

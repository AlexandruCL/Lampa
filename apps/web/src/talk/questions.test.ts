import { describe, expect, it } from "vitest";
import { API_URL } from "../api/client";
import type { Clips } from "../audio/clips";
import { registerSiteSound } from "../audio/siteSound";
import { greetingFor, questionsFor } from "./questions";

const c: Clips = {
  sites: {
    s: {
      beds: [],
      greeting: { ro: "s/greeting-ro.mp3" },
      answers: { both: { ro: "s/both-ro.mp3", en: "s/both-en.mp3" }, enOnly: { en: "s/enOnly-en.mp3" } },
      narrations: {},
      tapToAsk: [
        { id: "both", q: { ro: "Î?", en: "Q?" }, a: { ro: "R", en: "A" } },
        { id: "enOnly", q: { en: "Q2?" }, a: { en: "A2" } },
        { id: "noClip", q: { ro: "Î3?" }, a: { ro: "R3" } },
        { id: "huOnly", q: { hu: "K?" }, a: { hu: "V" } },
      ],
      archive: [],
    },
  },
  project: { waltz: [] },
};

describe("questionsFor", () => {
  it("ro text with the ro clip", () => expect(questionsFor("s", "ro", c)[0]).toEqual({ id: "both", q: "Î?", a: "R", file: "s/both-ro.mp3" }));
  it("ro missing gives the en text and the en clip", () =>
    expect(questionsFor("s", "ro", c)[1]).toEqual({ id: "enOnly", q: "Q2?", a: "A2", file: "s/enOnly-en.mp3" }));
  it("text but no clip gives file null", () => expect(questionsFor("s", "ro", c)[2]).toEqual({ id: "noClip", q: "Î3?", a: "R3", file: null }));
  it("an entry with no text in lang or en is left out, file order kept", () => {
    expect(questionsFor("s", "ro", c).map((x) => x.id)).toEqual(["both", "enOnly", "noClip"]);
    expect(questionsFor("s", "en", c).map((x) => x.id)).toEqual(["both", "enOnly"]);
  });
  it("an unknown site gives []", () => expect(questionsFor("nowhere", "ro", c)).toEqual([]));
});

describe("greetingFor", () => {
  it("the greeting in the session's language", () => expect(greetingFor("s", "ro", c)).toBe("s/greeting-ro.mp3"));
  it("no greeting in that language gives null, not en", () => expect(greetingFor("s", "en", c)).toBeNull());
  it("an unknown site gives null", () => expect(greetingFor("nowhere", "ro", c)).toBeNull());

  it("an added place plays its registered greeting in the visitor's language, from the API", () => {
    registerSiteSound("added", { bed: null, greeting: { ro: "/blob/added/greeting-ro.mp3", en: "/blob/added/greeting-en.mp3" } });
    expect(greetingFor("added", "ro", c)).toBe(`${API_URL}/blob/added/greeting-ro.mp3`);
    expect(greetingFor("added", "en", c)).toBe(`${API_URL}/blob/added/greeting-en.mp3`);
  });
  it("an added place without the visitor's language falls back to en", () => {
    registerSiteSound("added-en", { bed: null, greeting: { en: "/blob/added-en/greeting-en.mp3" } });
    expect(greetingFor("added-en", "ro", c)).toBe(`${API_URL}/blob/added-en/greeting-en.mp3`);
  });
  it("an added place with no greeting gives null", () => {
    registerSiteSound("added-quiet", { bed: null, greeting: {} });
    expect(greetingFor("added-quiet", "ro", c)).toBeNull();
  });
  it("a bundled site ignores a registration: clips.json wins", () => {
    registerSiteSound("s", { bed: null, greeting: { ro: "/blob/s/greeting-ro.mp3" } });
    expect(greetingFor("s", "ro", c)).toBe("s/greeting-ro.mp3");
  });
});

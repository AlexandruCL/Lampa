import { describe, expect, it } from "vitest";
import type { Clips, SiteClips } from "../audio/clips";
import { formatClock, testimoniesFor } from "./testimonies";

type Item = NonNullable<SiteClips["testimonies"]>[number];
const item = (id: string, title: Record<string, string>, text: Record<string, string>): Item => ({
  id,
  title,
  text,
  source: "Fixture source",
});
const site = (testimonies: Item[] | undefined, narrations: SiteClips["narrations"] = {}): SiteClips => ({
  beds: [],
  greeting: {},
  answers: {},
  narrations,
  tapToAsk: [],
  testimonies,
});
const both = (id: string) =>
  item(id, { en: `Fixture title ${id}`, ro: `Titlu ${id}` }, { en: `Fixture text ${id}`, ro: `Text ${id}` });

const c: Clips = {
  sites: {
    m: site([both("one"), both("two"), both("three")], {
      one: { en: "m/one-en.mp3", ro: "m/one-ro.mp3" },
      two: { en: "m/two-en.mp3" },
    }),
    plain: site(undefined),
  },
  project: { waltz: [] },
};

describe("testimoniesFor", () => {
  it("testimonies keep file order", () => {
    expect(testimoniesFor("m", "en", c).map((t) => t.id)).toEqual(["one", "two", "three"]);
  });

  it("ro text when the phone is ro, en otherwise", () => {
    const [ro] = testimoniesFor("m", "ro", c);
    expect(ro).toMatchObject({ title: "Titlu one", text: "Text one", source: "Fixture source" });
    const [en] = testimoniesFor("m", "en", c);
    expect(en).toMatchObject({ title: "Fixture title one", text: "Fixture text one", source: "Fixture source" });
    // An item with English only shows English on a ro phone.
    const enOnly: Clips = { ...c, sites: { s: site([item("x", { en: "Fixture title" }, { en: "Fixture text" })]) } };
    expect(testimoniesFor("s", "ro", enOnly)[0]).toMatchObject({ title: "Fixture title", text: "Fixture text" });
  });

  it("an item with no English title is left out", () => {
    const x: Clips = {
      ...c,
      sites: {
        s: site([
          item("a", { ro: "Titlu" }, { en: "Fixture text", ro: "Text" }),
          item("b", { en: "Fixture title" }, { ro: "Text" }),
          item("c", { en: "Fixture title" }, {}),
        ]),
      },
    };
    expect(testimoniesFor("s", "en", x)).toEqual([]);
    expect(testimoniesFor("s", "ro", x).map((t) => t.id)).toEqual(["b"]);
  });

  it("audio falls back to the English file, then null", () => {
    expect(testimoniesFor("m", "ro", c).map((t) => t.audio)).toEqual(["/audio/m/one-ro.mp3", "/audio/m/two-en.mp3", null]);
    expect(testimoniesFor("m", "en", c).map((t) => t.audio)).toEqual(["/audio/m/one-en.mp3", "/audio/m/two-en.mp3", null]);
  });

  it("no testimonies field gives an empty list", () => {
    expect(testimoniesFor("plain", "en", c)).toEqual([]);
    expect(testimoniesFor("unknown", "ro", c)).toEqual([]);
  });
});

describe("formatClock", () => {
  it("formatClock", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(42)).toBe("0:42");
    expect(formatClock(42.9)).toBe("0:42");
    expect(formatClock(160)).toBe("2:40");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(NaN)).toBe("0:00");
    expect(formatClock(Infinity)).toBe("0:00");
  });
});

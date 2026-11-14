import { afterEach, describe, expect, it, vi } from "vitest";
import en from "./en.json";
import ro from "./ro.json";
import { pickLang, siteName, t, type Key, type Lang } from "./t";

const LANGS: Lang[] = ["en", "ro"];
const DICTS: Record<Lang, Record<string, string>> = { en, ro };

describe("pickLang", () => {
  it("ro-RO, ro and RO pick ro", () => {
    for (const l of ["ro-RO", "ro", "RO"]) expect(pickLang(l)).toBe("ro");
  });

  it("en-GB, hu-HU, de, sr and undefined pick en", () => {
    for (const l of ["en-GB", "hu-HU", "de", "sr", undefined]) expect(pickLang(l)).toBe("en");
  });
});

describe("t", () => {
  afterEach(() => {
    vi.doUnmock("./ro.json");
    vi.resetModules();
  });

  it("t fills every slot", () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTS[lang])) {
        const vars = Object.fromEntries([...value.matchAll(/\{(\w+)\}/g)].map(([, name]) => [name, `<${name}>`]));
        const out = t(key as Key, vars, lang);
        expect(out, `${lang} ${key}`).not.toMatch(/\{\w+\}/);
        for (const name of Object.keys(vars)) expect(out, `${lang} ${key}`).toContain(`<${name}>`);
      }
    }
    expect(t("testimony.source", { source: "Fixture source" }, "en")).toBe("Source: Fixture source");
    expect(t("testimony.meta", { duration: 3 }, "ro")).toBe("Narațiune, 3");
  });

  it("an unknown slot stays as written", () => {
    expect(t("testimony.source", {}, "en")).toBe("Source: {source}");
    expect(t("testimony.play", { other: "Fixture title" }, "ro")).toBe("Ascultă mărturia: {title}");
  });

  it("a key missing in ro falls back to en", async () => {
    const roWithoutBack = Object.fromEntries(Object.entries(ro).filter(([key]) => key !== "back"));
    vi.doMock("./ro.json", () => ({ default: roWithoutBack }));
    vi.resetModules();
    const fresh = await import("./t");
    expect(fresh.t("back", {}, "ro")).toBe(en.back);
    expect(fresh.t("next_site", {}, "ro")).toBe(ro.next_site);
  });
});

describe("dictionaries", () => {
  it("en.json and ro.json have the same keys", () => {
    expect(Object.keys(ro).sort()).toEqual(Object.keys(en).sort());
  });

  it("no value is empty", () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTS[lang])) expect(value.trim(), `${lang} ${key}`).not.toBe("");
    }
  });
});

describe("siteName", () => {
  it("siteName gives Catedrala Mitropolitană in ro and Metropolitan Cathedral in en", () => {
    const site = { id: "cathedral", name: "Fixture name" };
    expect(siteName(site, "ro")).toBe("Catedrala Mitropolitană");
    expect(siteName(site, "en")).toBe("Metropolitan Cathedral");
  });

  it("siteName of a site with no key is its own name", () => {
    const site = { id: "fixture", name: "Fixture name" };
    expect(siteName(site, "ro")).toBe("Fixture name");
    expect(siteName(site, "en")).toBe("Fixture name");
  });
});

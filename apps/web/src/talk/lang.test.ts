import { describe, expect, it } from "vitest";
import { visitorLang } from "./lang";

describe("visitorLang", () => {
  it.each([
    ["ro-RO", "ro"],
    ["DE", "de"],
    ["sr-Latn-RS", "sr"],
    ["fr-FR", "en"],
    ["", "en"],
    [undefined, "en"],
  ])("%s -> %s", (input, lang) => {
    expect(visitorLang(input)).toBe(lang);
  });
});

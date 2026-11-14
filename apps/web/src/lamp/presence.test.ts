import { describe, expect, it } from "vitest";
import { presenceLine } from "./presence";

const S = "Piața Victoriei";

describe("presenceLine", () => {
  it.each([
    [null, false, "en", null],
    [0, false, "en", "Nobody is lighting Piața Victoriei right now."],
    [1, false, "en", "1 person is lighting Piața Victoriei now."],
    [2, false, "en", "2 people are lighting Piața Victoriei now."],
    [3, false, "en", "3 people are lighting Piața Victoriei now."],
    [19, false, "en", "19 people are lighting Piața Victoriei now."],
    [20, false, "en", "20 people are lighting Piața Victoriei now."],
    [21, false, "en", "21 people are lighting Piața Victoriei now."],
    [null, true, "en", null],
    [0, true, "en", "You are lighting Piața Victoriei."],
    [1, true, "en", "You are lighting Piața Victoriei."],
    [2, true, "en", "You and 1 other person are lighting Piața Victoriei now."],
    [3, true, "en", "You and 2 others are lighting Piața Victoriei now."],
    [19, true, "en", "You and 18 others are lighting Piața Victoriei now."],
    [20, true, "en", "You and 19 others are lighting Piața Victoriei now."],
    [21, true, "en", "You and 20 others are lighting Piața Victoriei now."],
    [null, false, "ro", null],
    [0, false, "ro", "Nimeni nu aprinde Piața Victoriei acum."],
    [1, false, "ro", "O persoană aprinde Piața Victoriei acum."],
    [2, false, "ro", "2 persoane aprind Piața Victoriei acum."],
    [3, false, "ro", "3 persoane aprind Piața Victoriei acum."],
    [19, false, "ro", "19 persoane aprind Piața Victoriei acum."],
    [20, false, "ro", "20 de persoane aprind Piața Victoriei acum."],
    [21, false, "ro", "21 de persoane aprind Piața Victoriei acum."],
    [null, true, "ro", null],
    [0, true, "ro", "Tu aprinzi Piața Victoriei."],
    [1, true, "ro", "Tu aprinzi Piața Victoriei."],
    [2, true, "ro", "Tu și încă o persoană aprindeți Piața Victoriei acum."],
    [3, true, "ro", "Tu și încă 2 persoane aprindeți Piața Victoriei acum."],
    [19, true, "ro", "Tu și încă 18 persoane aprindeți Piața Victoriei acum."],
    [20, true, "ro", "Tu și încă 19 de persoane aprindeți Piața Victoriei acum."],
    [21, true, "ro", "Tu și încă 20 de persoane aprindeți Piața Victoriei acum."],
  ] as const)("%s, lit %s, %s", (count, lit, lang, line) => {
    expect(presenceLine(count, lit, S, lang)).toBe(line);
  });
});

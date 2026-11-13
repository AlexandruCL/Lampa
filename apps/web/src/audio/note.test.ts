import { describe, expect, it } from "vitest";
import { chordRates, noteRate, shouldPlay } from "./note";

const semis = (n: number) => 2 ** (n / 12);

describe("note", () => {
  it("hue arcs map to the five pentatonic steps", () => {
    const cases: [number, number][] = [[0, 0], [71.9, 0], [72, 2], [144, 4], [216, 7], [288, 9], [359.9, 9]];
    for (const [hue, step] of cases) expect(noteRate(hue, 0.5)).toBeCloseTo(semis(step));
  });

  it("lightness picks the octave", () => {
    expect(noteRate(0, 0.34)).toBeCloseTo(0.5);
    expect(noteRate(0, 0.35)).toBeCloseTo(1);
    expect(noteRate(0, 0.65)).toBeCloseTo(1);
    expect(noteRate(0, 0.66)).toBeCloseTo(2);
  });

  it("night glass is step 0 an octave down", () => {
    for (const l of [0.1, 0.5, 0.9]) expect(noteRate(null, l)).toBe(0.5);
  });

  it("chord notes are distinct and at most five", () => {
    const hexes = [
      "#ff0000", // hue 0, L 0.5 -> 1
      "#ff0000", // duplicate
      null,
      "#808080", // grey: night glass -> 0.5
      "#330000", // hue 0, L 0.1 -> 0.5, same as night glass
      "#ffff00", // hue 60 -> step 0 -> 1, same as red
      "#00ff00", // hue 120 -> 2 semitones
      "#00ffff", // hue 180 -> 4
      "#0000ff", // hue 240 -> 7
      "#ff00ff", // hue 300 -> 9
      "#ffcccc", // hue 0, L 0.9 -> 2
    ];
    const rates = chordRates(hexes);
    expect(rates).toHaveLength(5);
    expect(new Set(rates).size).toBe(5);
    [0.5, 1, semis(2), semis(4), semis(7)].forEach((r, i) => expect(rates[i]).toBeCloseTo(r));
  });

  it("tone throttle", () => {
    const last = { rate: 1, at: 1000 };
    expect(shouldPlay(1, 1000, null)).toBe(true);
    expect(shouldPlay(1, 5000, last)).toBe(false);
    expect(shouldPlay(2, 1249, last)).toBe(false);
    expect(shouldPlay(2, 1250, last)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  compassWord,
  formatDistance,
  formatWeakDistance,
  metaLine,
  relativeAngle,
  spokenDirection,
  spokenLine,
  unwrapAngle,
  walkMinutes,
} from "./format";

describe("format", () => {
  it("223 m reads 220 m", () => {
    expect(formatDistance(223)).toBe("220 m");
  });

  it("994 m reads 990 m and 995 m reads 1.0 km", () => {
    expect(formatDistance(994)).toBe("990 m");
    expect(formatDistance(995)).toBe("1.0 km");
  });

  it("1234 m reads 1.2 km", () => {
    expect(formatDistance(1234)).toBe("1.2 km");
  });

  it("a weak 340 m reads about 300 m and a weak 20 m reads about 100 m", () => {
    expect(formatWeakDistance(340)).toBe("about 300 m");
    expect(formatWeakDistance(20)).toBe("about 100 m");
  });

  it("220 m is about 3 min walk and 10 m is about 1 min walk", () => {
    expect(walkMinutes(220)).toBe(3);
    expect(metaLine(220)).toBe("220 m, about 3 min walk");
    expect(walkMinutes(10)).toBe(1);
    expect(metaLine(10)).toBe("10 m, about 1 min walk");
  });

  it("bearing 45 reads To the north-east and bearing 350 reads To the north", () => {
    expect(compassWord(45)).toBe("To the north-east");
    expect(compassWord(350)).toBe("To the north");
  });

  it("bearing 10 at heading 350 is 20 degrees to the right", () => {
    expect(relativeAngle(10, 350)).toBe(20);
  });

  it("the relative angle wraps across north", () => {
    expect(relativeAngle(350, 10)).toBe(-20);
    expect(relativeAngle(180, 0)).toBe(-180);
    expect(relativeAngle(0, 0)).toBe(0);
  });

  it("15 degrees is ahead and 16 is ahead and slightly right", () => {
    expect(spokenDirection(15)).toBe("ahead");
    expect(spokenDirection(16)).toBe("ahead and slightly right");
  });

  it("minus 90 is to your left and 121 is behind you", () => {
    expect(spokenDirection(-90)).toBe("to your left");
    expect(spokenDirection(121)).toBe("behind you");
  });

  it("the spoken line joins name, metres and direction", () => {
    expect(spokenLine("Muzeul MX Corneliu Miklosi", 223, "ahead and slightly left")).toBe(
      "Muzeul MX Corneliu Miklosi, 220 metres, ahead and slightly left",
    );
    expect(spokenLine("Bastionul", 1234, "to the north-east")).toBe("Bastionul, 1.2 kilometres, to the north-east");
  });

  it("unwrapping 359 to 1 gives 361", () => {
    expect(unwrapAngle(359, 1)).toBe(361);
  });
});

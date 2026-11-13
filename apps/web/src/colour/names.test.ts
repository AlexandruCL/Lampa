import { describe, expect, it } from "vitest";
import { COLOUR_NAMES, colourName } from "./names";

describe("colour names", () => {
  it("there are 12 names and each has en and ro", () => {
    expect(COLOUR_NAMES).toHaveLength(12);
    for (const n of COLOUR_NAMES) {
      expect(n.en).not.toBe("");
      expect(n.ro).not.toBe("");
    }
  });

  it("bin 0 is Red and Roșu", () => {
    expect(colourName(0, "en")).toBe("Red");
    expect(colourName(0, "ro")).toBe("Roșu");
  });

  it("bin 7 is Sky blue and Albastru deschis", () => {
    expect(colourName(7, "en")).toBe("Sky blue");
    expect(colourName(7, "ro")).toBe("Albastru deschis");
  });

  it("a null bin is Night glass and Sticlă de noapte", () => {
    expect(colourName(null, "en")).toBe("Night glass");
    expect(colourName(null, "ro")).toBe("Sticlă de noapte");
  });

  it("the default language is en", () => {
    expect(colourName(4)).toBe("Green");
    expect(colourName(null)).toBe("Night glass");
  });
});

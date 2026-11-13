import { describe, expect, it } from "vitest";
import { SITES, findSite } from "./sites";

describe("sites", () => {
  it("there are five sites with the ids mx, unirii, victoriei, bastion, cathedral", () => {
    expect(SITES.map((s) => s.id).sort()).toEqual(["bastion", "cathedral", "mx", "unirii", "victoriei"]);
  });

  it("the Cathedral is the only memorial and the only site without a lamp", () => {
    expect(SITES.filter((s) => s.is_memorial).map((s) => s.id)).toEqual(["cathedral"]);
    expect(SITES.filter((s) => !s.lamp).map((s) => s.id)).toEqual(["cathedral"]);
  });

  it("findSite of an unknown id is undefined", () => {
    expect(findSite("nowhere")).toBeUndefined();
  });
});

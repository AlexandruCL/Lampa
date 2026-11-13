import { describe, expect, it } from "vitest";
import { haversineM } from "../geo/geo";
import type { PhoneSite } from "../sites/sites";
import { GLOW_WEIGHT_MIN, WALK_M_PER_MIN, suggestNext } from "./score";

const here = { lat: 45.75, lng: 21.23 };
const M_PER_DEG_LAT = (6371008.8 * Math.PI) / 180;
/** A site `m` metres due north of `here`. */
const site = (id: string, m: number, is_memorial = false): PhoneSite => ({
  id,
  name: id,
  lat: here.lat + m / M_PER_DEG_LAT,
  lng: here.lng,
  is_memorial,
  lamp: !is_memorial,
});
const none = new Set<string>();

describe("suggestNext", () => {
  it("the nearer of two dark sites is suggested as nearest", () => {
    const sites = [site("far", 300), site("near", 100)];
    const r = suggestNext({ sites, position: here, glow: { far: 0, near: 0 }, visited: none });
    expect(r.suggestion?.site.id).toBe("near");
    expect(r.suggestion?.tag).toBe("nearest");
    expect(r.allVisited).toBe(false);
  });

  it("a fully lit site counts as six minutes further", () => {
    const lit = site("lit", 160);
    const r = suggestNext({ sites: [lit], position: here, glow: { lit: 1 }, visited: none });
    expect(r.ranked[0]!.score).toBeCloseTo(haversineM(here, lit) / WALK_M_PER_MIN + GLOW_WEIGHT_MIN, 9);
    expect(r.ranked[0]!.score).toBeCloseTo(8, 3);
  });

  it("a dark site 400 m away beats a lit site 100 m away and is tagged going dark", () => {
    const sites = [site("lit", 100), site("dark", 400)];
    const r = suggestNext({ sites, position: here, glow: { lit: 1, dark: 0 }, visited: none });
    expect(r.suggestion?.site.id).toBe("dark");
    expect(r.suggestion?.tag).toBe("going dark");
    expect(r.ranked.map((x) => x.site.id)).toEqual(["dark", "lit"]);
  });

  it("a visited site is never the suggestion while another is not visited", () => {
    const sites = [site("seen", 50), site("other", 900)];
    const r = suggestNext({ sites, position: here, glow: { seen: 0, other: 1 }, visited: new Set(["seen"]) });
    expect(r.suggestion?.site.id).toBe("other");
    expect(r.suggestion?.visited).toBe(false);
    expect(r.allVisited).toBe(false);
  });

  it("visited sites are listed after the others", () => {
    const sites = [site("a", 50), site("b", 100), site("c", 800), site("d", 900)];
    const r = suggestNext({ sites, position: here, glow: null, visited: new Set(["a", "b"]) });
    expect(r.ranked.map((x) => [x.site.id, x.visited])).toEqual([
      ["c", false],
      ["d", false],
      ["a", true],
      ["b", true],
    ]);
  });

  it("unknown glow counts as 0", () => {
    const s = site("s", 240);
    const expected = haversineM(here, s) / WALK_M_PER_MIN;
    const empty = suggestNext({ sites: [s], position: here, glow: {}, visited: none });
    const absent = suggestNext({ sites: [s], position: here, glow: null, visited: none });
    expect(empty.ranked[0]!.score).toBeCloseTo(expected, 9);
    expect(absent.ranked[0]!.score).toBeCloseTo(expected, 9);
  });

  it("the memorial's glow counts as 0 and its tag is nearest", () => {
    const memorial = site("memorial", 400, true);
    const sites = [site("lit", 100), memorial];
    const r = suggestNext({ sites, position: here, glow: { lit: 1, memorial: 1 }, visited: none });
    expect(r.suggestion?.site.id).toBe("memorial");
    expect(r.suggestion?.score).toBeCloseTo(haversineM(here, memorial) / WALK_M_PER_MIN, 9);
    expect(r.suggestion?.tag).toBe("nearest");
  });

  it("with no position the score is six times the glow and the tag is going dark", () => {
    const sites = [site("a", 100), site("b", 200)];
    const r = suggestNext({ sites, position: null, glow: { a: 0.5, b: 0.25 }, visited: none });
    expect(r.ranked.map((x) => [x.site.id, x.distanceM, x.score])).toEqual([
      ["b", null, 1.5],
      ["a", null, 3],
    ]);
    expect(r.suggestion?.site.id).toBe("b");
    expect(r.suggestion?.tag).toBe("going dark");
  });

  it("all visited suggests the darkest site with allVisited true", () => {
    const sites = [site("near", 80), site("far", 800), site("mid", 400)];
    const r = suggestNext({
      sites,
      position: here,
      glow: { near: 0.5, far: 0.4, mid: 0.9 },
      visited: new Set(["near", "far", "mid"]),
    });
    expect(r.allVisited).toBe(true);
    expect(r.ranked[0]!.site.id).toBe("near");
    expect(r.suggestion?.site.id).toBe("far");
    expect(r.suggestion?.tag).toBe("going dark");
  });

  it("a tie keeps the order of the sites", () => {
    const sites = [site("x", 100), site("y", 300), site("z", 200)];
    const r = suggestNext({ sites, position: null, glow: { x: 0.5, y: 0.5, z: 0.5 }, visited: none });
    expect(r.ranked.map((x) => x.site.id)).toEqual(["x", "y", "z"]);
    expect(r.suggestion?.site.id).toBe("x");
  });

  it("only the suggestion has a tag", () => {
    const sites = [site("a", 100), site("b", 200), site("c", 300), site("d", 400)];
    const r = suggestNext({ sites, position: here, glow: { a: 0.2, b: 0.1 }, visited: new Set(["c"]) });
    const tagged = r.ranked.filter((x) => x.tag !== null);
    expect(tagged).toHaveLength(1);
    expect(tagged[0]).toBe(r.suggestion);
  });
});

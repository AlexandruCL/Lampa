import { describe, expect, it } from "vitest";
import { TAU_S, WINDOW_MS, glowAt, glowSql } from "./glow.js";
import { KNOWN_ACTIVITY, KNOWN_AT, KNOWN_GLOW, KNOWN_SITES } from "./known.js";

const at = new Date("2026-11-13T20:00:00.000Z");
const ago = (ms: number) => new Date(at.getTime() - ms);

describe("glowAt", () => {
  it("one wake now at glow_k 5 gives 0.2", () => {
    expect(glowAt([{ bucket: at, w: 1 }], 5, at)).toBeCloseTo(0.2, 9);
  });

  it("a weight of 3 from one tau ago gives 3 / e / glow_k", () => {
    expect(glowAt([{ bucket: ago(TAU_S * 1000), w: 3 }], 5, at)).toBeCloseTo(3 / Math.E / 5, 9);
  });

  it("after tau times ln 2, about 4 h 9 min, half the light is left", () => {
    const halfLifeMs = TAU_S * Math.LN2 * 1000;
    expect(halfLifeMs / 60_000).toBeCloseTo(249.5, 0);
    expect(glowAt([{ bucket: ago(halfLifeMs), w: 1 }], 1, at)).toBeCloseTo(0.5, 6);
  });

  it("the sum is capped at 1", () => {
    expect(glowAt([{ bucket: at, w: 100 }], 5, at)).toBe(1);
  });

  it("a bucket older than 24 hours adds nothing", () => {
    expect(glowAt([{ bucket: ago(WINDOW_MS + 60_000), w: 1000 }], 5, at)).toBe(0);
    // The window is strict, as in the SQL: a bucket exactly 24 hours old is out.
    expect(glowAt([{ bucket: ago(WINDOW_MS), w: 1000 }], 5, at)).toBe(0);
  });

  it("no buckets give 0", () => {
    expect(glowAt([], 5, at)).toBe(0);
  });

  it("the known events give a 0.2, b 0.279660177, c 0 and d 1", () => {
    const glow = Object.fromEntries(KNOWN_SITES.map((s) => [
      s.id,
      glowAt(KNOWN_ACTIVITY.filter((a) => a.site_id === s.id), s.glow_k, KNOWN_AT),
    ]));
    expect(Object.keys(glow)).toEqual(["a", "b", "c", "d"]);
    for (const id of Object.keys(KNOWN_GLOW)) expect(glow[id]).toBeCloseTo(KNOWN_GLOW[id], 6);
  });
});

describe("glowSql", () => {
  it("glowSql names tau 21600, the 24 hour window, published sites and float8", () => {
    const sql = glowSql();
    expect(sql).toContain("/ 21600.0");
    expect(sql).toContain("a.bucket > $1::timestamptz - INTERVAL '24 hours'");
    expect(sql).toContain("WHERE s.status = 'published'");
    expect(sql).toContain(")::float8 AS glow");
    expect(sql).toContain("FROM sites s\nLEFT JOIN site_activity_1m a ON");
    expect(glowSql("x s", "y a")).toContain("FROM x s\nLEFT JOIN y a ON");
  });
});

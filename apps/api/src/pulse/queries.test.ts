import { describe, expect, it } from "vitest";
import { TODAY_START_SQL } from "../db/today.js";
import { COLOUR_CLOCK_SQL, INTERACTIONS_SQL, SUMMARY_SQL, toColourClock, toInteractions } from "./queries.js";

const t0 = new Date("2026-07-01T10:00:00Z");
const t1 = new Date("2026-07-01T10:05:00Z");

describe("interactions", () => {
  it("toInteractions gives every site with its points in order", () => {
    const rows = [
      { t: t0, site_id: "mx", n: 1 },
      { t: t1, site_id: "mx", n: 2 },
      { t: t0, site_id: "bastion", n: 3 },
      { t: t1, site_id: "bastion", n: 0 },
    ];
    const r = toInteractions(rows, ["mx", "bastion"]);
    expect(r.sites.map((s) => s.siteId)).toEqual(["mx", "bastion"]);
    expect(r.sites[0].points).toEqual([{ t: t0.toISOString(), n: 1 }, { t: t1.toISOString(), n: 2 }]);
  });

  it("a site with no rows gets its gap-filled zeros", () => {
    const r = toInteractions([{ t: t0, site_id: "mx", n: 4 }, { t: t1, site_id: "mx", n: 5 }], ["mx", "unirii"]);
    expect(r.sites[1]).toEqual({ siteId: "unirii", points: [{ t: t0.toISOString(), n: 0 }, { t: t1.toISOString(), n: 0 }] });
  });

  it("INTERACTIONS_SQL gap-fills 5 minutes over 3 hours", () => {
    expect(INTERACTIONS_SQL).toContain("time_bucket_gapfill('5 minutes', bucket)");
    expect(INTERACTIONS_SQL).toContain("INTERVAL '3 hours'");
    expect(INTERACTIONS_SQL).toContain("site_id = ANY($1)");
  });
});

describe("summary", () => {
  it("SUMMARY_SQL counts visitors with distinct_count since local midnight", () => {
    expect(SUMMARY_SQL).toContain("distinct_count(rollup(visitors_hll))");
    expect(SUMMARY_SQL).toContain(`bucket >= ${TODAY_START_SQL}`);
  });
});

describe("colour clock", () => {
  const rows = [{ hour: 5, mean_hue: 0, lightness: 0.25, panes: 7 }];
  const now = new Date("2026-07-01T10:30:00Z");

  it("toColourClock gives 24 hours", () => {
    expect(toColourClock(rows, now).hours.map((h) => h.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });
  it("an hour with no panes has hex null and 0 panes", () => {
    expect(toColourClock(rows, now).hours[6]).toEqual({ hour: 6, hex: null, panes: 0 });
  });
  it("the hex uses saturation 0.8 and the hour's lightness", () => {
    // hsl(0, 0.8, 0.25): max 0.45, min 0.05 of 255
    expect(toColourClock(rows, now).hours[5]).toEqual({ hour: 5, hex: "#730d0d", panes: 7 });
  });
  it("currentHour is the local hour in Timișoara", () => {
    expect(toColourClock(rows, now).currentHour).toBe(13); // EEST, UTC+3
    expect(toColourClock(rows, new Date("2026-01-01T22:30:00Z")).currentHour).toBe(0); // EET, UTC+2
  });
  it("COLOUR_CLOCK_SQL averages hue as a vector", () => {
    expect(COLOUR_CLOCK_SQL).toContain("atan2(sum(hue_sin), sum(hue_cos))");
  });
  it("COLOUR_CLOCK_SQL leaves the Gallery out", () => {
    expect(COLOUR_CLOCK_SQL).toContain("site_id <> 'gallery'");
  });
});

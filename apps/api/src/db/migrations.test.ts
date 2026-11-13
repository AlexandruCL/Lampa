import { describe, expect, it } from "vitest";
import { baseline, pending } from "./migrations.js";

describe("migrations", () => {
  it("pending lists unapplied files in name order", () => {
    expect(pending(["003_c.sql", "001_a.sql", "002_b.sql"], ["001_a.sql"])).toEqual(["002_b.sql", "003_c.sql"]);
  });

  it("pending is empty when all are applied", () => {
    expect(pending(["001_a.sql", "002_b.sql"], ["002_b.sql", "001_a.sql"])).toEqual([]);
  });

  it("baseline stops at 003_colour.sql", () => {
    expect(baseline(["002_site_activity.sql", "003_colour.sql", "003_d.sql", "004_x.sql"])).toEqual([
      "002_site_activity.sql",
      "003_colour.sql",
    ]);
  });

  it("baseline of 001 to 004 gives 001 to 003", () => {
    expect(
      baseline(["001_init.sql", "002_site_activity.sql", "003_colour.sql", "004_conversations.sql"]),
    ).toEqual(["001_init.sql", "002_site_activity.sql", "003_colour.sql"]);
  });
});

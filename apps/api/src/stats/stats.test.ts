import { describe, expect, it } from "vitest";
import { STATS_SQL, createGetSiteStats } from "./stats.js";

function fakeDb(row = { colours_today: 5, lamps_today: 9 }, fail = false) {
  const calls: { text: string; params: unknown[] | undefined }[] = [];
  return {
    calls,
    db: {
      query: async (text: string, params?: unknown[]) => {
        calls.push({ text, params });
        if (fail) throw new Error("boom");
        return { rows: [row], rowCount: 1 };
      },
    },
  };
}
const msg = { sites: [{ siteId: "mx", glow: 0.4 }] };

describe("createGetSiteStats", () => {
  it("glow is the site's value in the latest message", async () => {
    const stats = await createGetSiteStats({ db: fakeDb().db, latestGlow: () => msg })("mx");
    expect(stats.glow).toBe(0.4);
  });

  it("glow is 0 with no message", async () => {
    const stats = await createGetSiteStats({ db: fakeDb().db, latestGlow: () => null })("mx");
    expect(stats.glow).toBe(0);
  });

  it("glow is 0 for a site missing from the message", async () => {
    const stats = await createGetSiteStats({ db: fakeDb().db, latestGlow: () => msg })("unirii");
    expect(stats.glow).toBe(0);
  });

  it("coloursToday and lampsToday come from the query", async () => {
    const stats = await createGetSiteStats({ db: fakeDb().db, latestGlow: () => null })("mx");
    expect(stats).toEqual({ glow: 0, coloursToday: 5, lampsToday: 9 });
  });

  it("the query passes the site id", async () => {
    const { db, calls } = fakeDb();
    await createGetSiteStats({ db, latestGlow: () => null })("unirii");
    expect(calls).toEqual([{ text: STATS_SQL, params: ["unirii"] }]);
  });

  it("a failing query throws", async () => {
    const get = createGetSiteStats({ db: fakeDb(undefined, true).db, latestGlow: () => null });
    await expect(get("mx")).rejects.toThrow("boom");
  });
});

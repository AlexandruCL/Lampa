import { describe, expect, it } from "vitest";
import type { Db, Tx } from "../seam.js";
import * as dr from "./demo-reset.js";

describe("demoPanes", () => {
  const p = dr.demoPanes();
  it("has 47 slots with the clock hues", () => {
    expect(p).toHaveLength(47);
    expect(p[0]).toEqual({ slot: 0, hue: 0, hex: "#e61919" });
    expect(p[1]).toEqual({ slot: 1, hue: 30, hex: "#e68019" });
    expect(p[12]!.hue).toBe(0);
    expect(p.every((x) => /^#[0-9a-f]{6}$/.test(x.hex))).toBe(true);
  });
});

describe("lampSiteFor", () => {
  it("cycles through the sites", () => {
    expect([0, 1, 2, 3].map((i) => dr.lampSiteFor(i, ["a", "b", "c"]))).toEqual(["a", "b", "c", "a"]);
  });
});

function fake(oneHour: boolean, ok = true) {
  const log: string[] = [];
  const mk = (tag: string): Db => ({
    query: async (text) => {
      log.push(`${tag}:${text}`);
      if (text === dr.LAMP_WINDOW_OK_SQL) return { rows: [{ ok }], rowCount: 1 };
      if (text === dr.INSERT_WINDOW_SQL) return { rows: [{ id: "w1" }], rowCount: 1 };
      if (text === dr.LAMP_SITES_SQL) return { rows: [{ id: "mx" }, { id: "ro" }], rowCount: 2 };
      if (text === dr.HAS_1H_SQL) return { rows: oneHour ? [{ x: 1 }] : [], rowCount: oneHour ? 1 : 0 };
      return { rows: [], rowCount: 3 };
    },
  });
  const tx: Tx = async (fn) => {
    log.push("BEGIN");
    const r = await fn(mk("tx"));
    log.push("COMMIT");
    return r;
  };
  return { log, db: mk("db"), tx };
}

describe("demoReset", () => {
  it("orders statements and refreshes after the commit", async () => {
    const f = fake(false);
    const line = await dr.demoReset(f.db, f.tx);
    const i = (s: string) => f.log.findIndex((l) => l.endsWith(s));
    expect(i(dr.DELETE_PANES_SQL)).toBeLessThan(i(dr.DELETE_ECHOES_SQL));
    expect(i(dr.DELETE_EVENTS_SQL)).toBeLessThan(i(dr.INSERT_LAMPS_SQL));
    expect(f.log.indexOf(`db:${dr.REFRESH_1M_SQL}`)).toBeGreaterThan(f.log.indexOf("COMMIT"));
    expect(f.log.some((l) => l.startsWith("tx:CALL"))).toBe(false);
    expect(f.log).not.toContain(`db:${dr.REFRESH_1H_SQL}`);
    expect(f.log.join("\n")).not.toMatch(/colour_readings|conversations|schema_migrations/);
    expect(line).toBe("demo:reset done: 3 events, 3 panes, 3 windows, 3 echoes, 3 echo blobs deleted; 3 places to draft; mx window 47 of 48; 721 lamps today");
  });

  it("refreshes the hourly aggregate only when it exists", async () => {
    const f = fake(true);
    await dr.demoReset(f.db, f.tx);
    expect(f.log).toContain(`db:${dr.REFRESH_1H_SQL}`);
  });

  it("stops before the transaction too close to midnight", async () => {
    const f = fake(true, false);
    expect(await dr.demoReset(f.db, f.tx)).toBeNull();
    expect(f.log).toHaveLength(1);
  });
});

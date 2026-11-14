import { describe, expect, it } from "vitest";
import { sites } from "@lampa/shared";
import { RESET_PLACE, resetPlace } from "./reset.js";

function fakeDb(rowCount: number) {
  const calls: { text: string; params: unknown[] }[] = [];
  const db = {
    query: async (text: string, params: unknown[] = []) => {
      calls.push({ text, params });
      return { rows: [], rowCount };
    },
  };
  return { db, calls };
}

describe("resetPlace", () => {
  it("a published place goes back to draft", async () => {
    const f = fakeDb(1);
    expect(await resetPlace(f.db, "theresia-bastion")).toBe("reset");
    expect(f.calls).toEqual([{ text: RESET_PLACE, params: ["theresia-bastion"] }]);
  });

  it("a seeded id is refused and no query runs", async () => {
    const f = fakeDb(1);
    for (const s of sites) expect(await resetPlace(f.db, s.id)).toBe("seeded");
    expect(sites.length).toBeGreaterThan(0);
    expect(f.calls).toHaveLength(0);
  });

  it("an invalid id is refused", async () => {
    const f = fakeDb(1);
    for (const id of ["", "x", "Bad_Id", "a".repeat(41), "../etc"]) expect(await resetPlace(f.db, id)).toBe("invalid");
    expect(f.calls).toHaveLength(0);
  });

  it("an unknown id reports none", async () => {
    const f = fakeDb(0);
    expect(await resetPlace(f.db, "no-such-place")).toBe("none");
    expect(f.calls).toHaveLength(1);
  });
});

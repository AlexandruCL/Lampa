import { describe, expect, it } from "vitest";
import { lowestEmptySlot, paneAuthor, paneTs, retryAfterS } from "./slots.js";

const NOW = new Date("2026-06-01T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

describe("slots", () => {
  it("an empty window gives slot 0", () => expect(lowestEmptySlot([])).toBe(0));
  it("the lowest gap wins: 0, 1, 3 gives 2", () => expect(lowestEmptySlot([0, 1, 3])).toBe(2));
  it("47 taken in any order gives the missing one", () => {
    const filled = Array.from({ length: 48 }, (_, i) => i).filter((i) => i !== 17).reverse();
    expect(lowestEmptySlot(filled)).toBe(17);
  });
  it("48 taken gives null", () => expect(lowestEmptySlot(Array.from({ length: 48 }, (_, i) => i))).toBeNull());
  it("Retry-After is the seconds until the oldest pane is an hour old", () =>
    expect(retryAfterS(new Date(NOW.getTime() - 3_000_000), NOW)).toBe(600));
  it("Retry-After is at least 1", () => expect(retryAfterS(new Date(NOW.getTime() - 7_200_000), NOW)).toBe(1));
  it("paneTs keeps an at from 9 minutes ago", () => expect(paneTs(ago(540_000), NOW)).toBe(ago(540_000)));
  it("paneTs replaces an at older than 10 minutes with now", () => expect(paneTs(ago(601_000), NOW)).toBe(NOW.toISOString()));
  it("paneTs replaces a future at with now", () => expect(paneTs(ago(-1000), NOW)).toBe(NOW.toISOString()));
  it("an anonymous visitor's sub goes to anon_id", () =>
    expect(paneAuthor({ sub: "anon:x", kind: "anon", permissions: [] })).toEqual({ author_sub: null, anon_id: "anon:x" }));
  it("an Auth0 visitor's sub goes to author_sub", () =>
    expect(paneAuthor({ sub: "auth0|x", kind: "auth0", permissions: [] })).toEqual({ author_sub: "auth0|x", anon_id: null }));
});

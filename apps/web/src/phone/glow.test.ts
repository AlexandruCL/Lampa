import { describe, expect, it } from "vitest";
import { siteGlow } from "./glow";

const msg = { sites: [{ siteId: "mx", glow: 0.4 }, { siteId: "unirii", glow: 0.9 }] };

describe("siteGlow", () => {
  it("siteGlow reads the value for its site", () => expect(siteGlow(msg, "unirii")).toBe(0.9));
  it("siteGlow ignores other sites", () => expect(siteGlow(msg, "bastion")).toBeUndefined());
  it("siteGlow ignores an invalid message", () => {
    expect(siteGlow({ sites: [{ siteId: "mx", glow: 2 }] }, "mx")).toBeUndefined();
    expect(siteGlow("glow", "mx")).toBeUndefined();
  });
});

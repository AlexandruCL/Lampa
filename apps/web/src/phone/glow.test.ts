import { describe, expect, it } from "vitest";
import { glowLine, siteGlow } from "./glow";

const msg = { sites: [{ siteId: "mx", glow: 0.4 }, { siteId: "unirii", glow: 0.9 }] };

describe("glowLine", () => {
  it("glowLine prints Awake, 72% and Trezit, 72% in ro", () => {
    expect(glowLine(0.72, "en")).toBe("Awake, 72%");
    expect(glowLine(0.72, "ro")).toBe("Trezit, 72%");
  });
});

describe("siteGlow", () => {
  it("siteGlow reads the value for its site", () => expect(siteGlow(msg, "unirii")).toBe(0.9));
  it("siteGlow ignores other sites", () => expect(siteGlow(msg, "bastion")).toBeUndefined());
  it("siteGlow ignores an invalid message", () => {
    expect(siteGlow({ sites: [{ siteId: "mx", glow: 2 }] }, "mx")).toBeUndefined();
    expect(siteGlow("glow", "mx")).toBeUndefined();
  });
});

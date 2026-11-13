import { describe, expect, it } from "vitest";
import { findSite } from "../sites/sites";
import { readDemo } from "./demo";

const at = (id: string) => {
  const s = findSite(id)!;
  return { lat: s.lat, lng: s.lng, accuracy: 5 };
};

describe("demo", () => {
  it("no demo param gives null", () => {
    expect(readDemo("", "unirii")).toBeNull();
    expect(readDemo("?at=unirii&heading=90")).toBeNull();
  });

  it("demo on a site route sits on that site", () => {
    expect(readDemo("?demo=1&at=bastion", "unirii")).toMatchObject(at("unirii"));
  });

  it("demo with at sits on that site", () => {
    expect(readDemo("?demo=1&at=victoriei")).toMatchObject(at("victoriei"));
  });

  it("demo with an unknown site sits on mx", () => {
    expect(readDemo("?demo=1&at=nowhere")).toMatchObject(at("mx"));
    expect(readDemo("?demo=1", "nowhere")).toMatchObject(at("mx"));
    expect(readDemo("?demo=1")).toMatchObject(at("mx"));
  });

  it("heading 450 gives 90", () => {
    expect(readDemo("?demo=1&heading=450")?.heading).toBe(90);
    expect(readDemo("?demo=1&heading=-90")?.heading).toBe(270);
  });

  it("a heading that is not a number gives 0", () => {
    expect(readDemo("?demo=1&heading=north")?.heading).toBe(0);
    expect(readDemo("?demo=1")?.heading).toBe(0);
  });
});

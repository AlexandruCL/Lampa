import { MAP_LINES, sites, type Site, type SiteDetail } from "@lampa/shared";
import { expect, it } from "vitest";
import { toSite, unknownIds } from "./newSites";
import { crossesCircle, labelBox, labelWidth, layout, MIN_SPACING, SITE_RADIUS } from "./projection";

const EPS = 1e-9;
const [MIN_X, MAX_X, MIN_Y, MAX_Y] = [0.12 * 1380, 0.88 * 1380, 0.12 * 1080, 0.88 * 1080];
const glow = (...ids: string[]) => ({ sites: ids.map((siteId) => ({ siteId, glow: 0 })) });
const known = new Set(sites.map((s) => s.id));

const detail: SiteDetail = {
  id: "opera",
  name: "Opera",
  lat: 45.7553,
  lng: 21.2289,
  is_memorial: false,
  radius_m: 60,
  interactions: ["colours"],
  facts: [],
  directions_hint: "",
  glow: 0,
};

function expectRefit(sixth: Site) {
  const ps = layout([...sites, sixth], MAP_LINES);
  expect(ps).toHaveLength(6);
  for (const p of ps) {
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    expect(p.x).toBeGreaterThanOrEqual(MIN_X - EPS);
    expect(p.x).toBeLessThanOrEqual(MAX_X + EPS);
    expect(p.y).toBeGreaterThanOrEqual(MIN_Y - EPS);
    expect(p.y).toBeLessThanOrEqual(MAX_Y + EPS);
  }
  for (const [i, a] of ps.entries()) {
    for (const b of ps.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(MIN_SPACING * SITE_RADIUS - EPS);
  }
}

it("a known id is not unknown", () => {
  expect(unknownIds(glow("mx", "cathedral"), known)).toEqual([]);
});

it("gallery is never unknown", () => {
  expect(unknownIds(glow("gallery"), known)).toEqual([]);
});

it("an unknown id is listed once", () => {
  expect(unknownIds(glow("mx", "opera", "opera"), known)).toEqual(["opera"]);
});

it("toSite keeps name, lat, lng and is_memorial", () => {
  expect(toSite(detail)).toEqual({ id: "opera", name: "Opera", lat: 45.7553, lng: 21.2289, is_memorial: false });
});

it("six sites still land inside the map area and no two closer than 2.95R", () => {
  const victoriei = sites.find((s) => s.id === "victoriei")!;
  // 400 m east: one degree of longitude is 111,320 m times cos(latitude).
  const lng = victoriei.lng + 400 / (111_320 * Math.cos((victoriei.lat * Math.PI) / 180));
  expectRefit({ id: "east", name: "East", lat: victoriei.lat, lng, is_memorial: false });
});

it("with a sixth site, MX's full name label crosses no other site's circle", () => {
  const victoriei = sites.find((s) => s.id === "victoriei")!;
  const lng = victoriei.lng + 400 / (111_320 * Math.cos((victoriei.lat * Math.PI) / 180));
  const ps = layout([...sites, { id: "east", name: "Opera Națională", lat: victoriei.lat, lng, is_memorial: false }], MAP_LINES);
  const mx = ps.find((p) => p.id === "mx")!;
  // Chromium drew "Muzeul MX Corneliu Miklosi" about 405 units wide.
  const width = labelWidth(sites.find((s) => s.id === "mx")!.name);
  expect(width).toBeGreaterThanOrEqual(405);
  for (const c of ps) if (c !== mx) expect(crossesCircle(labelBox(mx, mx.label, width), c)).toBe(false);
});

it("a sixth site on MX's coordinates stays finite, inside the map and 2.95R apart", () => {
  const mx = sites.find((s) => s.id === "mx")!;
  expectRefit({ id: "here", name: "Here", lat: mx.lat, lng: mx.lng, is_memorial: false });
});

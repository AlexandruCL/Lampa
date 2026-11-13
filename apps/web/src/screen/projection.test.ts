import type { Site } from "@lampa/shared";
import { expect, it } from "vitest";
import { labelSides, layout, project, spread, type Point } from "./projection";
import { sites } from "./sites.fixture";

const MIN_DIST = 2.4 * 96;
const EPS = 1e-9;
const [MIN_X, MAX_X, MIN_Y, MAX_Y] = [0.12 * 1380, 0.88 * 1380, 0.12 * 1080, 0.88 * 1080];

const byId = (ps: Point[]) => Object.fromEntries(ps.map((p) => [p.id, p]));
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const site = (id: string, lat: number, lng: number): Site => ({ id, name: id, lat, lng, is_memorial: false });
const inside = (p: Point) => {
  expect(p.x).toBeGreaterThanOrEqual(MIN_X - EPS);
  expect(p.x).toBeLessThanOrEqual(MAX_X + EPS);
  expect(p.y).toBeGreaterThanOrEqual(MIN_Y - EPS);
  expect(p.y).toBeLessThanOrEqual(MAX_Y + EPS);
};

it("the five fixture sites land inside the padded map area", () => {
  const ps = layout(sites);
  expect(ps).toHaveLength(5);
  ps.forEach(inside);
});

it("north is up and east is right", () => {
  const p = byId(layout(sites));
  expect(p.unirii.y).toBeLessThan(p.cathedral.y);
  expect(p.mx.x).toBeGreaterThan(p.victoriei.x);
});

it("the scale is the same on both axes", () => {
  const k = Math.cos((45.75 * Math.PI) / 180);
  const geo = Object.fromEntries(sites.map((s) => [s.id, { id: s.id, x: s.lng * k, y: -s.lat }]));
  const p = byId(project(sites));
  const projected = dist(p.unirii, p.bastion) / dist(p.victoriei, p.cathedral);
  const expected = dist(geo.unirii, geo.bastion) / dist(geo.victoriei, geo.cathedral);
  expect(Math.abs(projected / expected - 1)).toBeLessThan(0.01);
});

it("no two fixture sites are closer than 2.4R after spread", () => {
  const ps = layout(sites);
  for (const [i, a] of ps.entries()) for (const b of ps.slice(i + 1)) expect(dist(a, b)).toBeGreaterThanOrEqual(MIN_DIST - EPS);
});

it("two sites at the same point end 2.4R apart", () => {
  const [a, b] = layout([site("a", 45.75, 21.23), site("b", 45.75, 21.23)]);
  expect(dist(a, b)).toBeCloseTo(MIN_DIST, 9);
  expect(a.y).toBe(b.y);
});

it("a point pushed past the padding is clamped inside it", () => {
  const ps = spread([
    { id: "a", x: MIN_X + 10, y: 540 },
    { id: "b", x: MIN_X + 10, y: 540 },
  ]);
  ps.forEach(inside);
  expect(ps[0].x).toBe(MIN_X);
});

it("spread leaves well-spaced points untouched", () => {
  const points = [
    { id: "a", x: 300, y: 300 },
    { id: "b", x: 700, y: 500 },
    { id: "c", x: 1100, y: 800 },
  ];
  expect(spread(points)).toEqual(points);
});

it("a single site lands at the centre", () => {
  expect(layout([site("only", 45.75, 21.23)])).toEqual([{ id: "only", x: 690, y: 540, label: "below" }]);
});

it("when two labels overlap the lower site's label goes above", () => {
  expect(
    labelSides([
      { id: "upper", x: 600, y: 500 },
      { id: "lower", x: 700, y: 540 },
      { id: "far", x: 1100, y: 540 },
    ]),
  ).toEqual({ upper: "below", lower: "above", far: "below" });
});

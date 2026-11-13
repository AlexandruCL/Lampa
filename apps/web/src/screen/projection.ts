import type { Site } from "@lampa/shared";

export const DESIGN_WIDTH = 1920;
export const MAP_WIDTH = 1380;
export const DESIGN_HEIGHT = 1080;
export const PADDING = 0.12;
export const SITE_RADIUS = 96;
export const MIN_SPACING = 2.4;
export const SPACING_PASSES = 20;
export const REF_LAT_DEG = 45.75;

const LABEL_WIDTH = 320;
const LABEL_HEIGHT = 74;
const LABEL_GAP = 10;

export type Point = { id: string; x: number; y: number };
export type LabelSide = "below" | "above";

const minX = MAP_WIDTH * PADDING;
const maxX = MAP_WIDTH * (1 - PADDING);
const minY = DESIGN_HEIGHT * PADDING;
const maxY = DESIGN_HEIGHT * (1 - PADDING);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function project(sites: Site[]): Point[] {
  const k = Math.cos((REF_LAT_DEG * Math.PI) / 180);
  const raw = sites.map((s) => ({ id: s.id, x: s.lng * k, y: -s.lat }));
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((maxX - minX) / (x1 - x0), (maxY - minY) / (y1 - y0));
  const s = Number.isFinite(scale) ? scale : 0;
  return raw.map((p) => ({
    id: p.id,
    x: MAP_WIDTH / 2 + (p.x - (x0 + x1) / 2) * s,
    y: DESIGN_HEIGHT / 2 + (p.y - (y0 + y1) / 2) * s,
  }));
}

export function spread(points: Point[]): Point[] {
  const ps = points.map((p) => ({ ...p }));
  const target = MIN_SPACING * SITE_RADIUS;
  for (let pass = 0; pass < SPACING_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i];
        const b = ps[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= target) continue;
        const [ux, uy] = d === 0 ? [1, 0] : [dx / d, dy / d];
        const half = (target - d) / 2;
        a.x -= ux * half;
        a.y -= uy * half;
        b.x += ux * half;
        b.y += uy * half;
        moved = true;
      }
    }
    for (const p of ps) {
      const [x, y] = [clamp(p.x, minX, maxX), clamp(p.y, minY, maxY)];
      if (x !== p.x || y !== p.y) moved = true;
      p.x = x;
      p.y = y;
    }
    if (!moved) break;
  }
  return ps;
}

type Box = { x0: number; x1: number; y0: number; y1: number };

function labelBox(p: Point, side: LabelSide): Box {
  const y0 = side === "below" ? p.y + SITE_RADIUS + LABEL_GAP : p.y - SITE_RADIUS - LABEL_GAP - LABEL_HEIGHT;
  return { x0: p.x - LABEL_WIDTH / 2, x1: p.x + LABEL_WIDTH / 2, y0, y1: y0 + LABEL_HEIGHT };
}

const boxesOverlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const crossesCircle = (b: Box, c: Point) =>
  Math.hypot(clamp(c.x, b.x0, b.x1) - c.x, clamp(c.y, b.y0, b.y1) - c.y) < SITE_RADIUS;

export function labelSides(points: Point[]): Record<string, LabelSide> {
  const clear = (p: Point, side: LabelSide) => points.every((c) => c === p || !crossesCircle(labelBox(p, side), c));
  const sides: Record<string, LabelSide> = Object.fromEntries(
    points.map((p) => [p.id, clear(p, "below") || !clear(p, "above") ? "below" : "above"]),
  );
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i];
      const b = points[j];
      if (!boxesOverlap(labelBox(a, sides[a.id]), labelBox(b, sides[b.id]))) continue;
      const lower = b.y >= a.y ? b : a;
      if (clear(lower, "above")) sides[lower.id] = "above";
    }
  }
  return sides;
}

export function layout(sites: Site[]): (Point & { label: LabelSide })[] {
  const points = spread(project(sites));
  const sides = labelSides(points);
  return points.map((p) => ({ ...p, label: sides[p.id] }));
}

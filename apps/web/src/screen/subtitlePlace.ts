import { SITE_RADIUS, type LabelSide, type Point } from "./projection";

// Design units between the window's edge and the subtitle: past its name and glow line (livingmap.css), or just off the window.
export const PAST_LABEL = 84;
export const PAST_WINDOW = 10;

export type SubtitleSide = "below" | "above";
type Box = { width: number; height: number };

/** The subtitle's top or bottom edge in design units, on `side` of the window at `point`. */
export function subtitleEdge(point: Point & { label: LabelSide }, side: SubtitleSide): number {
  const gap = point.label === side ? PAST_LABEL : PAST_WINDOW;
  return side === "below" ? point.y + SITE_RADIUS + gap : point.y - SITE_RADIUS - gap;
}

/** Below unless that box covers another site's circle and the box above does not (Cristea's decision, hour 37). */
export function subtitlePlace(point: Point & { label: LabelSide }, box: Box, others: Point[]): SubtitleSide {
  const covers = (side: SubtitleSide) => {
    const edge = subtitleEdge(point, side);
    const [y0, y1] = side === "below" ? [edge, edge + box.height] : [edge - box.height, edge];
    const [x0, x1] = [point.x - box.width / 2, point.x + box.width / 2];
    return others.some(
      (c) =>
        c.id !== point.id &&
        Math.hypot(Math.min(Math.max(c.x, x0), x1) - c.x, Math.min(Math.max(c.y, y0), y1) - c.y) < SITE_RADIUS,
    );
  };
  return covers("below") && !covers("above") ? "above" : "below";
}

import { MAP_LINES, sites } from "@lampa/shared";
import { expect, it } from "vitest";
import { layout, SITE_RADIUS } from "./projection";
import { subtitlePlace } from "./subtitlePlace";

// The largest subtitle: 520 wide, three lines of 90 characters, the language line and the padding (livingmap.css).
const BOX = { width: 520, height: 3 * 40 + 28 + 2 * 12 };
const placed = layout(sites, MAP_LINES);
const at = (id: string) => placed.find((p) => p.id === id)!;

it("Piața Unirii's subtitle goes above", () => {
  expect(subtitlePlace(at("unirii"), BOX, placed)).toBe("above");
});

it("a site with free space below keeps it below", () => {
  const lone = { id: "lone", x: 690, y: 300, label: "below" as const };
  expect(subtitlePlace(lone, BOX, [lone, { id: "far", x: 1100, y: 900 }])).toBe("below");
});

it("both sides covered stays below", () => {
  const mid = { id: "mid", x: 690, y: 540, label: "below" as const };
  const others = [mid, { id: "up", x: 690, y: 540 - 3 * SITE_RADIUS }, { id: "down", x: 690, y: 540 + 3 * SITE_RADIUS }];
  expect(subtitlePlace(mid, BOX, others)).toBe("below");
});

import { haversineM, type LatLng } from "../geo/geo";
import type { PhoneSite } from "../sites/sites";

export const WALK_M_PER_MIN = 80;
export const GLOW_WEIGHT_MIN = 6;

export type Ranked = {
  site: PhoneSite;
  distanceM: number | null;
  score: number;
  visited: boolean;
  tag: "nearest" | "going dark" | null;
};
export type Suggestion = { ranked: Ranked[]; suggestion: Ranked | null; allVisited: boolean };

// Concept 7.7 and Ionut's decisions, hour 7: minutes of walking plus six minutes per unit of glow.
export function suggestNext(input: {
  sites: readonly PhoneSite[];
  position: LatLng | null;
  glow: Readonly<Record<string, number>> | null;
  visited: ReadonlySet<string>;
}): Suggestion {
  const { position } = input;
  const glowOf = (site: PhoneSite) => (site.is_memorial ? 0 : (input.glow?.[site.id] ?? 0));

  const entries = input.sites.map((site, order) => {
    const distanceM = position ? haversineM(position, site) : null;
    const walk = distanceM === null ? 0 : distanceM / WALK_M_PER_MIN;
    const ranked: Ranked = {
      site,
      distanceM,
      score: walk + GLOW_WEIGHT_MIN * glowOf(site),
      visited: input.visited.has(site.id),
      tag: null,
    };
    return { ranked, glow: glowOf(site), order };
  });

  // Array.prototype.sort is stable, so a tie keeps the order of `sites`.
  const ranked = entries
    .map((e) => e.ranked)
    .sort((a, b) => Number(a.visited) - Number(b.visited) || a.score - b.score);

  const allVisited = ranked.length > 0 && ranked.every((r) => r.visited);
  let suggestion: Ranked | null;
  if (allVisited) {
    const darkest = [...entries].sort(
      (a, b) => a.glow - b.glow || (a.ranked.distanceM ?? 0) - (b.ranked.distanceM ?? 0) || a.order - b.order,
    )[0]!;
    suggestion = darkest.ranked;
    suggestion.tag = suggestion.site.is_memorial ? "nearest" : "going dark";
  } else {
    suggestion = ranked.find((r) => !r.visited) ?? null;
    if (suggestion) {
      const s = suggestion;
      const nearest =
        s.distanceM !== null &&
        !ranked.some((r) => r !== s && !r.visited && r.distanceM !== null && r.distanceM < s.distanceM!);
      s.tag = s.site.is_memorial || nearest ? "nearest" : "going dark";
    }
  }

  return { ranked, suggestion, allVisited };
}

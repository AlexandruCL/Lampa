import { MAP_LINES } from "./mapLines.js";

type LatLng = { lat: number; lng: number };
type Line = readonly (readonly [lat: number, lng: number])[];

/** The Bega, west to east. It flows west, so downstream is a smaller distance along the line. */
export const BEGA: Line = MAP_LINES.find((l) => l.id === "bega")!.points;
export const BOTTLE_WINDOW_M = 150;
export const BOTTLE_SPEED_MPS = 0.05; // 180 m per hour

const M_PER_DEG = 111_195; // metres per degree of latitude on a sphere of radius 6371008.8 m

/** `line` in metres east and north of `origin`. Flat-earth, which is exact enough over a city. */
function flat(line: Line, origin: LatLng): [x: number, y: number][] {
  const kx = M_PER_DEG * Math.cos((origin.lat * Math.PI) / 180);
  return line.map(([lat, lng]) => [(lng - origin.lng) * kx, (lat - origin.lat) * M_PER_DEG]);
}

/** Metres from the line's start to the point on it nearest to `point`. */
export function alongM(point: LatLng, line: Line = BEGA): number {
  const pts = flat(line, point); // `point` is the origin
  let best = { d2: Infinity, along: 0 };
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]!;
    const [bx, by] = pts[i]!;
    const [dx, dy] = [bx - ax, by - ay];
    const len2 = dx * dx + dy * dy;
    const len = Math.sqrt(len2);
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2));
    const d2 = (ax + t * dx) ** 2 + (ay + t * dy) ** 2;
    if (d2 < best.d2) best = { d2, along: walked + t * len };
    walked += len;
  }
  return best.along;
}

/** Where a bottle is now. It drifts downstream from the moment it is recorded, and past the line's start goes negative. */
export function bottleAlongM(launchAlongM: number, launchedAtMs: number, nowMs: number, speedMps: number): number {
  return launchAlongM - (speedMps * (nowMs - launchedAtMs)) / 1000;
}

/** A bridge catches a bottle while the bottle is within `windowM` of it. */
export function catchable(bottleAlongM: number, bridgeAlongM: number, windowM = BOTTLE_WINDOW_M): boolean {
  return Math.abs(bottleAlongM - bridgeAlongM) <= windowM;
}

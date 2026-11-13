import { WALK_M_PER_MIN } from "./score";

const mod360 = (x: number) => ((x % 360) + 360) % 360;

/** "220 m" under 995 m, "1.2 km" from 995 m. */
export function formatDistance(m: number): string {
  return m < 995 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/** For a weak position: "about 300 m", never under 100. */
export function formatWeakDistance(m: number): string {
  return `about ${Math.max(100, Math.round(m / 100) * 100)} m`;
}

export function walkMinutes(m: number): number {
  return Math.max(1, Math.ceil(m / WALK_M_PER_MIN));
}

/** "220 m, about 3 min walk". */
export function metaLine(m: number): string {
  return `${formatDistance(m)}, about ${walkMinutes(m)} min walk`;
}

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];

/** "To the north-east": eight 45-degree sectors centred on the compass points. */
export function compassWord(bearing: number): string {
  return `To the ${COMPASS[Math.round(mod360(bearing) / 45) % 8]}`;
}

/** -180 to under 180; 0 straight ahead, negative to the left. */
export function relativeAngle(bearing: number, heading: number): number {
  return mod360(bearing - heading + 540) - 180;
}

/** Ionut's decision, hour 7. */
export function spokenDirection(rel: number): string {
  const a = Math.abs(rel);
  const side = rel < 0 ? "left" : "right";
  if (a <= 15) return "ahead";
  if (a <= 60) return `ahead and slightly ${side}`;
  if (a <= 120) return `to your ${side}`;
  return "behind you";
}

/** "Muzeul MX Corneliu Miklosi, 220 metres, ahead and slightly left". */
export function spokenLine(name: string, m: number, direction: string): string {
  const distance = formatDistance(m).replace(/ km$/, " kilometres").replace(/ m$/, " metres");
  return `${name}, ${distance}, ${direction}`;
}

/** The angle equal to `next` mod 360 nearest to `previous`, so the arrow turns the short way (5.2). */
export function unwrapAngle(previous: number, next: number): number {
  return previous + relativeAngle(next, previous);
}

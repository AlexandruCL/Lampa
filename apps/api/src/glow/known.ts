// The known events that glow.test.ts and the glow:check script both use.
export const KNOWN_AT = new Date("2026-11-13T20:00:00.000Z");

const before = (ms: number) => new Date(KNOWN_AT.getTime() - ms);
const HOUR = 3_600_000;

export const KNOWN_SITES: { id: string; glow_k: number }[] = [
  { id: "a", glow_k: 5 },
  { id: "b", glow_k: 10 },
  { id: "c", glow_k: 5 },
  { id: "d", glow_k: 5 },
];

export const KNOWN_ACTIVITY: { site_id: string; bucket: Date; w: number }[] = [
  { site_id: "a", bucket: KNOWN_AT, w: 1 },
  { site_id: "a", bucket: before(25 * HOUR), w: 50 },
  { site_id: "b", bucket: before(6 * HOUR), w: 3 },
  { site_id: "b", bucket: before(1 * HOUR), w: 2 },
  { site_id: "d", bucket: before(60_000), w: 100 },
];

export const KNOWN_GLOW: Record<string, number> = { a: 0.2, b: 0.279660177, c: 0, d: 1 };

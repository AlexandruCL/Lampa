export const TAU_S = 21600;
export const WINDOW_MS = 86_400_000;
// Cristea's tuning: up to KNEE a site lights at the concept's rate (points / glow_k); past it each point counts 1 / SLOW,
// so a site is fully lit at KNEE + (1 - KNEE) * SLOW = 2.65 times glow_k (79.5 points at glow_k 30).
export const KNEE = 0.45;
export const SLOW = 4;

/** Concept PDF 11.2 C plus the knee, with the time as `$1`, every published site in the result, and glow as float8. */
export function glowSql(sites = "sites s", activity = "site_activity_1m a"): string {
  const raw = "COALESCE(sum(a.w * exp(-extract(epoch FROM ($1::timestamptz - a.bucket)) / 21600.0)), 0) / s.glow_k";
  return `SELECT s.id AS site_id,
       LEAST(1.0, CASE WHEN ${raw} <= ${KNEE} THEN ${raw} ELSE ${KNEE} + (${raw} - ${KNEE}) / ${SLOW}.0 END)::float8 AS glow
FROM ${sites}
LEFT JOIN ${activity} ON a.site_id = s.id AND a.bucket > $1::timestamptz - INTERVAL '24 hours'
WHERE s.status = 'published'
GROUP BY s.id, s.glow_k
ORDER BY s.id`;
}

/** The same formula as `glowSql`, in TypeScript. */
export function glowAt(buckets: { bucket: Date; w: number }[], glowK: number, at: Date): number {
  const t = at.getTime();
  let sum = 0;
  for (const { bucket, w } of buckets) {
    if (bucket.getTime() > t - WINDOW_MS) sum += w * Math.exp(-(t - bucket.getTime()) / 1000 / TAU_S);
  }
  const raw = sum / glowK;
  return Math.min(1, raw <= KNEE ? raw : KNEE + (raw - KNEE) / SLOW);
}

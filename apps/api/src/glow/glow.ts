export const TAU_S = 21600;
export const WINDOW_MS = 86_400_000;

/** Concept PDF 11.2 C, with the time as `$1`, every published site in the result, and glow as float8. */
export function glowSql(sites = "sites s", activity = "site_activity_1m a"): string {
  return `SELECT s.id AS site_id,
       LEAST(1.0, COALESCE(sum(a.w * exp(-extract(epoch FROM ($1::timestamptz - a.bucket)) / 21600.0)), 0) / s.glow_k)::float8 AS glow
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
  return Math.min(1, sum / glowK);
}

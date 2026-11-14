-- glow, aggregate: the shipped glowSql() text over site_activity_1m, with now() in place of $1.
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.id AS site_id,
       LEAST(1.0, COALESCE(sum(a.w * exp(-extract(epoch FROM (now()::timestamptz - a.bucket)) / 21600.0)), 0) / s.glow_k)::float8 AS glow
FROM sites s
LEFT JOIN site_activity_1m a ON a.site_id = s.id AND a.bucket > now()::timestamptz - INTERVAL '24 hours'
WHERE s.status = 'published'
GROUP BY s.id, s.glow_k
ORDER BY s.id;

-- glow, raw: the same formula over interaction_events for the last 24 h, ts as the bucket and weight as w.
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.id AS site_id,
       LEAST(1.0, COALESCE(sum(a.weight * exp(-extract(epoch FROM (now()::timestamptz - a.ts)) / 21600.0)), 0) / s.glow_k)::float8 AS glow
FROM sites s
LEFT JOIN interaction_events a ON a.site_id = s.id AND a.ts > now()::timestamptz - INTERVAL '24 hours'
WHERE s.status = 'published'
GROUP BY s.id, s.glow_k
ORDER BY s.id;

-- 30 days, per minute: interactions per hour per site over 30 days from site_activity_1m.
EXPLAIN (ANALYZE, BUFFERS)
SELECT time_bucket('1 hour', bucket) AS hour, site_id, sum(n) AS n
FROM site_activity_1m
WHERE bucket > now() - INTERVAL '30 days'
GROUP BY 1, site_id;

-- 30 days, per hour: the same from site_activity_1h.
EXPLAIN (ANALYZE, BUFFERS)
SELECT time_bucket('1 hour', bucket) AS hour, site_id, sum(n) AS n
FROM site_activity_1h
WHERE bucket > now() - INTERVAL '30 days'
GROUP BY 1, site_id;

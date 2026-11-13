-- site_activity_1m: per minute, site and kind, the event count, the summed weight and the distinct sessions of interaction_events.
CREATE MATERIALIZED VIEW site_activity_1m WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts)   AS bucket,
       site_id, kind,
       count(*)                      AS n,
       sum(weight)                   AS w,
       hyperloglog(4096, session_id) AS visitors_hll -- Approximate count of distinct session_id, read by Pulse in Build 3.
FROM interaction_events
GROUP BY bucket, site_id, kind
-- WITH NO DATA stays, because db:reset sends this file as one multi-statement query.
WITH NO DATA;

-- Real-time: the view includes events newer than the last refresh, which the glow loop needs (plan section 9).
ALTER MATERIALIZED VIEW site_activity_1m SET (timescaledb.materialized_only = false);

SELECT add_continuous_aggregate_policy('site_activity_1m',
  start_offset      => INTERVAL '2 hours',
  end_offset        => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');

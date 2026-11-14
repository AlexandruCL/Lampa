-- Columnstore on interaction_events: older chunks become columnar per site, newest first, which the per-site time reads scan (concept 11.2 A).
ALTER TABLE interaction_events SET (
  timescaledb.enable_columnstore = true,
  timescaledb.segmentby = 'site_id',
  timescaledb.orderby = 'ts DESC');

-- Chunks move to the columnstore after 7 days, when they no longer take new events (Fabi's decision, hour 27).
CALL add_columnstore_policy('interaction_events', after => INTERVAL '7 days');

-- Columnstore on colour_readings with the same settings: it is the other per-site time-series log (Fabi's decision, hour 27).
ALTER TABLE colour_readings SET (
  timescaledb.enable_columnstore = true,
  timescaledb.segmentby = 'site_id',
  timescaledb.orderby = 'ts DESC');

-- The same 7 days as interaction_events (Fabi's decision, hour 27).
CALL add_columnstore_policy('colour_readings', after => INTERVAL '7 days');

-- Raw events are dropped after 90 days; site_activity_1m and site_activity_1h keep their rows, outside their refresh windows.
SELECT add_retention_policy('interaction_events', INTERVAL '90 days');

-- Call records are dropped after 90 days, as the events are (Fabi's decision, hour 27).
SELECT add_retention_policy('conversations', INTERVAL '90 days');

-- site_activity_1h: per hour, site and kind, rolled up from site_activity_1m, so long ranges read 60 times fewer rows (concept 11.2 B).
CREATE MATERIALIZED VIEW site_activity_1h WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', bucket) AS bucket,
       site_id, kind,
       sum(n)                        AS n,
       sum(w)                        AS w,
       rollup(visitors_hll)          AS visitors_hll -- Hourly distinct sessions from the per-minute sketches.
FROM site_activity_1m
GROUP BY 1, site_id, kind -- 1, not bucket: bucket here would name the per-minute column of site_activity_1m.
-- WITH NO DATA stays, because db:reset sends this file as one multi-statement query.
WITH NO DATA;

-- Real-time: the view includes hours newer than the last refresh, as the other aggregates do.
ALTER MATERIALIZED VIEW site_activity_1h SET (timescaledb.materialized_only = false);

-- The policy values of colour_1h, the repo's other hourly aggregate.
SELECT add_continuous_aggregate_policy('site_activity_1h',
  start_offset      => INTERVAL '3 hours',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

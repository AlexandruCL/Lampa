-- colour_readings: the time-series log of colours caught, one row per pane, chunked by day (concept 11.2 E).
CREATE TABLE colour_readings (
  ts         timestamptz NOT NULL,
  site_id    text        NOT NULL, -- A site id, or 'gallery' for a pane caught in remote mode.
  session_id text,                 -- The token subject, as in interaction_events.
  hue        real,
  saturation real,
  lightness  real
);
SELECT create_hypertable('colour_readings', by_range('ts', INTERVAL '1 day'));

-- colour_1h: per hour and site, the pane count, the hue as summed sin and cos, and the mean lightness of colour_readings.
CREATE MATERIALIZED VIEW colour_1h WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts)  AS bucket,
       site_id,
       count(*)                   AS panes,
       -- Hue is an angle, so it is averaged as a vector: atan2(hue_sin, hue_cos) gives the mean hue (concept 11.2 E).
       sum(sin(radians(hue)))     AS hue_sin,
       sum(cos(radians(hue)))     AS hue_cos,
       avg(lightness)             AS lightness
FROM colour_readings
GROUP BY bucket, site_id
-- WITH NO DATA stays, because db:reset sends this file as one multi-statement query.
WITH NO DATA;

-- Real-time: the view includes readings newer than the last refresh.
ALTER MATERIALIZED VIEW colour_1h SET (timescaledb.materialized_only = false);

SELECT add_continuous_aggregate_policy('colour_1h',
  start_offset      => INTERVAL '3 hours',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

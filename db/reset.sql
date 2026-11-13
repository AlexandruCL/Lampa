-- A continuous aggregate is dropped before its hypertable; every later aggregate is added here in the same commit.
DROP MATERIALIZED VIEW IF EXISTS site_activity_1m CASCADE;
DROP MATERIALIZED VIEW IF EXISTS colour_1h CASCADE;
-- Every table a later migration adds is appended to this list in the same commit.
DROP TABLE IF EXISTS panes, windows, echoes, blobs, interaction_events, sites, colour_readings CASCADE;

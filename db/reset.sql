-- Every table a later migration adds is appended to this list in the same commit.
DROP TABLE IF EXISTS panes, windows, echoes, blobs, interaction_events, sites CASCADE;

-- conversations: the time-series log of finished agent calls from the post-call webhook, one row per call, chunked by day (concept 9.4).
CREATE TABLE conversations (
  ts              timestamptz NOT NULL,            -- The call's start.
  conversation_id text        NOT NULL,
  site_id         text,
  session_id      text,                            -- Stays NULL: the webhook carries no visitor.
  user_sub        text,                            -- Stays NULL: the webhook carries no visitor.
  duration_s      integer,
  lang            text,
  summary         text,
  data            jsonb       NOT NULL DEFAULT '{}' -- The analysis's data collection results.
);
SELECT create_hypertable('conversations', by_range('ts', INTERVAL '1 day'));

-- A retried webhook is stored once; a unique index on a hypertable must include ts.
CREATE UNIQUE INDEX conversations_id_ts_idx ON conversations (conversation_id, ts);

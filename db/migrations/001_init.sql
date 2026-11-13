CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;
CREATE EXTENSION IF NOT EXISTS postgis;

-- sites: one row per site, with its location, geofence radius, interactions, content and publication status.
CREATE TABLE sites (
  id              text PRIMARY KEY,
  city            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  name            jsonb NOT NULL,
  geom            geography(Point, 4326) NOT NULL,
  radius_m        real NOT NULL,
  interactions    text[] NOT NULL,
  persona         jsonb NOT NULL DEFAULT '{}',
  facts           jsonb NOT NULL DEFAULT '[]',
  directions_hint jsonb NOT NULL DEFAULT '{}',
  glow_k          real NOT NULL,
  is_memorial     boolean NOT NULL DEFAULT false,
  active_from     timestamptz,
  active_until    timestamptz,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
);
CREATE INDEX sites_geom_idx ON sites USING gist (geom);

-- windows: one window of pane slots, with its site, slot count and when it started and completed.
CREATE TABLE windows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      text REFERENCES sites (id), -- NULL is the Gallery window for remote mode.
  slots        integer NOT NULL DEFAULT 48,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- echoes: one recorded echo left at a site, with its audio, transcript, language, moderation status and voice mode.
CREATE TABLE echoes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          text NOT NULL REFERENCES sites (id),
  author_sub       text,
  anon_id          text,
  audio_url        text NOT NULL,
  public_audio_url text,
  transcript       text,
  lang             text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  voice_mode       text NOT NULL DEFAULT 'own' CHECK (voice_mode IN ('own', 'city')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- panes: one colour caught into one slot of a window, with its HSL values, hex, author and optional echo.
CREATE TABLE panes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  window_id  uuid NOT NULL REFERENCES windows (id),
  slot       integer NOT NULL,
  hue        real NOT NULL,
  saturation real NOT NULL,
  lightness  real NOT NULL,
  hex        text NOT NULL,
  author_sub text,
  anon_id    text,
  echo_id    uuid REFERENCES echoes (id),
  caught_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (window_id, slot)
);

-- blobs: binary data stored by key, with its content type.
CREATE TABLE blobs (
  key          text PRIMARY KEY,
  content_type text NOT NULL,
  data         bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- interaction_events: the time-series log of interaction events at sites, one row per event, chunked by day.
CREATE TABLE interaction_events (
  ts         timestamptz NOT NULL DEFAULT now(),
  session_id text        NOT NULL, -- The token subject: anon:<uuid> or the Auth0 sub.
  user_sub   text,
  site_id    text        NOT NULL,
  kind       text        NOT NULL, -- No CHECK: the Zod contract in packages/shared validates kind.
  weight     real        NOT NULL DEFAULT 1, -- The server sets weight; the client never sends one.
  lang       text,
  mode       text,
  props      jsonb       NOT NULL DEFAULT '{}'
);
SELECT create_hypertable('interaction_events', by_range('ts', INTERVAL '1 day'));
CREATE INDEX interaction_events_site_ts_idx ON interaction_events (site_id, ts DESC);

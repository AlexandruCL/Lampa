# LAMPA

A night walk through Timișoara's old town, played on your phone. Each place answers when you talk to it, takes the colours you catch from its façades, and glows brighter as more people visit. A shared live map shows the whole city's light.

LAMPA was built in 48 hours by a team of four at UniHack in Timișoara, where it won **Best Use of TigerData**. This repository is the full system: the phone app, the live map, the analytics dashboard, the curator console and the API behind them.

## What it does

Visitors join by link or QR code at one of five sites. Their phone then becomes the instrument.

| Interaction | What happens |
|---|---|
| **Talk** | Each site has a voice persona running on an ElevenLabs conversational agent. It answers in the visitor's language from sourced facts. A tap-to-ask fallback covers a bad connection. |
| **Colours of the City** | The phone camera catches a colour from a façade. The colour is added to the site's palette and shown on the live map. |
| **Echoes** | A visitor records a short message. It is transcribed with ElevenLabs Scribe and held for approval by a curator before anyone hears it. |
| **Lamp** | Raise the phone as a lamp. The site's glow rises with every lamp held at that moment. |
| **Dialogue of the Bells** | In Piața Unirii two towers ring against each other. Each phone is one bell. When the towers ring in time, every phone in the square plays a chord. |
| **Memorial** | The Metropolitan Cathedral is the 1989 memorial and works differently. It has narrated testimonies and one candle, lit by stillness. It has no persona, no game and no counter. |

Sound navigation, an arrow and Maps links guide visitors between sites.

## Surfaces

| Route | For | Purpose |
|---|---|---|
| `/`, `/s/:siteId` | Visitors, on phones | The experience above. |
| `/screen` | A public display | The Living Map: glow, caught colours, echo ripples and subtitles, drawn on Canvas 2D from a live socket. |
| `/pulse` | Organisers | Activity per site, the colour clock and languages spoken. |
| `/curate` | Curators | Echo moderation and add-a-place. Sign-in uses Auth0 roles and MFA. |

## Architecture

```
 phones ──HTTPS──▶  apps/api (Express) ──SQL──▶ Tiger Cloud (TimescaleDB)
   ▲  ▲                 │   │                      hypertable: interaction_events
   │  └── Socket.IO ◀───┘   └── ElevenLabs: agent, Scribe, TTS, sound effects
   │                    │
 /screen, /pulse ◀──────┘     Auth0: curator roles and MFA
```

- **Events, not counters.** Every interaction is a row in a TimescaleDB hypertable. Glow is computed from a continuous aggregate (`site_activity_1m`) and decays exponentially, so a site fades when people leave.
- **Real-time over Socket.IO.** Rooms per site and per window keep each phone's traffic small. The server pushes glow, lamp counts and bell events. Phones send over plain HTTP.
- **Shared clock.** A clock-offset endpoint lets phones ring bells and pulse lamps in time with each other.
- **Plain SQL.** Numbered migrations in `db/migrations`, run by one script, with `pg` and no ORM. The queries are written to be read.
- **Typed contract.** `packages/shared` holds the Zod schemas for every message and the map geometry. The API and the web app import the same types.
- **Content as data.** Each site is a YAML file in `content/sites` holding coordinates, persona, sourced facts and tap-to-ask questions in Romanian and English.

## Tech stack

| Layer | Choice |
|---|---|
| Web | React 19, TypeScript, Vite, React Router, CSS Modules, Canvas 2D, Recharts |
| API | Node 26, Express 5, Socket.IO, Zod, `jose` for token verification |
| Data | Tiger Cloud (TimescaleDB), `pg` |
| Voice and audio | ElevenLabs Agents, Scribe, text-to-speech, sound effects; Web Audio API |
| Auth | Auth0 for curators; signed anonymous sessions for visitors |
| Tests | Vitest |
| Deploy | Vercel (web), Render (API) |

The design has no UI kit, icon library, animation library or Tailwind. Every style reads from one set of tokens in `tokens.css`.

## Repository layout

```
apps/
  api/            Express API, Socket.IO, glow loop, migrations runner
  web/            Phone app, /screen, /pulse, /curate
packages/
  shared/         Zod contract, map lines, generated sites.json
content/sites/    One YAML file per site
db/migrations/    Numbered SQL migrations
scripts/          Publish a site, simulate a crowd, check the agent
DESIGN.md         Visual and UX specification
IMPLEMENTATION_PLAN.md   Scope, lanes, schedule and cut order
```

## Getting started

Requirements: Node 26, npm, a Postgres with the TimescaleDB and `timescaledb_toolkit` extensions (a Tiger Cloud service works), and an ElevenLabs account for voice.

```bash
npm ci
cp .env.example .env     # fill in the values below
npm run db:reset         # run migrations and seed the sites from YAML
npm run dev              # API and web together
```

Environment variables (see `.env.example`):

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Tiger Cloud or local Postgres |
| `SESSION_SECRET` | Signing anonymous visitor sessions |
| `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` | Verifying curator tokens |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_WEBHOOK_SECRET` | Voice agent and post-call webhook |
| `AGENT_TOOL_SECRET` | Authenticating the agent's tool calls to the API |
| `WEB_ORIGIN`, `PORT` | CORS origin and API port |
| `VITE_API_URL`, `VITE_AUTH0_*` | Browser-side config (only `VITE_` names reach the bundle) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the API and the web app |
| `npm run build` | Build every workspace |
| `npm run typecheck` | Type-check every workspace |
| `npm test` | Run every Vitest suite |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:reset` | Rebuild the schema and reseed the sites |
| `npm run demo:reset` | Put the database back to a clean demo state |
| `npm run glow:check` | Print the glow each site would show now |
| `npm run simulate:crowd` | Replay synthetic visitors to exercise `/screen` and `/pulse` |
| `npm run publish:site` | Generate voice and sound for a site from its YAML |
| `npm run agent:check` | Check the ElevenLabs agent configuration |

Testing on a phone needs HTTPS for the camera, motion sensors and microphone. Use the Vercel preview or a tunnel, and a hotspot rather than venue Wi-Fi.

## Design decisions worth reading

- **Earned light.** The interface stays dark. The one warm amber accent is spent only on light and on the action that makes light. See `DESIGN.md`.
- **Respect at the memorial.** No counter, no points and no microphone prompt at the Cathedral. The candle responds to stillness measured from motion alone.
- **Honest limits.** Echo audio is stored in Postgres to remove a service from a 48-hour build. That is fine for tens of megabytes and should move to object storage for a longer run.
- **Moderation before sound.** Nothing a visitor records reaches another visitor until a curator approves it.

## Team

| Person | Lane |
|---|---|
| Ionut | Phone experience: sensors, geofence, colour lens, echo recorder, memorial candle |
| Patrick | Sound and voice: ElevenLabs agent, Web Audio engine, Talk and Lamp stations |
| Fabi | Data and real-time: schema, events API, glow loop, Pulse, crowd simulator |
| Cristea | Identity and infrastructure: design tokens, Auth0, sessions, curator console, the Living Map |

Per-person working notes and glossaries live in the `cristea`, `fabi`, `ionut` and `patrick` folders.

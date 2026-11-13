# Prompt: Fabi's Build 3: Echo, navigation, Lamp, Pulse, sign-in (Fabi, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 10 (2026-11-14 00:15 +0200). Implementation not started. Hour 11: `CandleMessage` aligned with Cristea's team-agreed shape and B3-4.d added (Fabi's decisions, hour 11).**

You are implementing Fabi's part of Build 3: Echo, navigation, Lamp, Pulse, sign-in (hours 25 to 32 in the plan; Fabi runs it from hour 11 to hour 18) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *the plan gives Build 3 no goal line; its title is "Echo, navigation, Lamp, Pulse, sign-in".*

Checkpoint this block must pass (Checkpoint 3, word for word): *Run the demo script from section 10.4, steps 0:00 to 1:40 plus the Pulse step and the memorial step from the v5 addendum, twice from a cold start, with the crowd simulator running. Write down every break. Fix it, or cut the feature and adjust the script. Then decide which Build 4 rows to attempt, using the cut order in section 7.*

The lines of the demo this lane affects (concept 10.4 and the v5 addendum): *1:55 New. In demo mode the judge opens the Cathedral, hears a narration and holds still for 5 seconds (60 in real use). The candle lights and appears quietly on the Living Map.* *2:10 The simulated crowd and the 1884 moment.* *2:30 Pulse dashboard: colour clock, languages, glow, all continuous aggregates on Tiger.*

## 0. Ground rules

- **Fabi takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Fabi, with your recommendation. Nothing uses the recommendation until Fabi answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 18 (2026-11-14 07:21 +0200).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Fabi: carrying on, cutting (plan section 7) or moving it is their decision. The block holds 9 h of tasks in 7 h (Fabi accepted this, hour 10). Already decided for a late block (Fabi, hour 10): first the post-call webhook (B3-7) and the languages card are cut; then the clock offset falls back to no offset (phones pulse steady, DESIGN item 9). Never cut: lamps lit today, people lighting now, candles, `GET /pulse/*` and the `/pulse` page.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Fabi, who takes it to the team. This block adds, as written in the seams of section 3 and nothing else: `LAMP_TARGET`, `LampsMessage`, `TimeNow`, and Cristea's team-agreed `CandleMessage` `{ id, siteId, litAt }` with `ScreenState.candles` (seam 1; Fabi's decision, hour 11) and `PulseSummary`, `PulseColourClock`, `PulseInteractions`, `PulseLanguages`, `PulseCandles` (seam 2) (Fabi's decision, hour 10). Nothing already in the contract changes.
- The server sets event weights. The client never sends one. Weights stay as in `apps/api/src/events/weights.ts` (`lamp` 2, `candle` 0).
- No library beyond plan section 3 without Fabi's approval. Approved: `recharts` 3.10.1 (MIT, released 2026-07-25, peer React 19) in `apps/web`, for the four interaction line charts only (B3-6, Fabi's decision, hour 10); plan section 3 names Recharts. Nothing else is installed. Already installed and used: `pg` 8.23.1, `zod` 4.6.7, `express` 5.3.0, `express-rate-limit` 8.7.4, `socket.io` 4.8.4, `socket.io-client` 4.8.4, `yaml` 2.9.1, `tsx` 4.23.15, `react` 19.3.1, `vitest` 5.1.0. `node:crypto`, `node:util` and `node:assert` are Node built-ins. The webhook signature is checked with `node:crypto`, not the ElevenLabs SDK.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `DATABASE_URL`, `SESSION_SECRET`, `AGENT_TOOL_SECRET` and `ELEVENLABS_WEBHOOK_SECRET` are never printed, logged, pasted into the chat or written into any tracked file. A session token fetched for a check is kept in a shell variable and not printed.
- `main` deploys by itself. The docs commit (`fabi/`, the plan update) goes straight to `main` (Fabi's decision, hour 10). After it, three branches: `fabi/b3-live` from `origin/main` holds B3-1, B3-2, B3-3, B3-4, B3-8, B3-9 (PR 1, first: Patrick and Cristea wait on it); `fabi/b3-data`, from `origin/main` or from `fabi/b3-live` if PR 1 is not merged yet, holds B3-10, B3-5, B3-7 (PR 2); `fabi/b3-pulse-page`, from `fabi/b3-data` right after seam 2 and in its own git worktree `../Lampa-b3-pulse`, holds B3-6 (PR 3, rebased on PR 2 before it opens) (Fabi's decision, hour 10). One small PR per branch. Open it only after the verify commands pass. Cristea merges, with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. This block makes no ElevenLabs call: the webhook is tested with bodies signed locally.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. In this block: a `lamp` event at a memorial site is skipped; a `candle` event at a site that is not a memorial is skipped; the `lamps` message lists only the four lamp sites; every number on `/pulse` leaves the Cathedral out, except unique visitors, which is city-wide and not split by site (`DESIGN.md` 7.14); candles appear only as marks with no number, no count, no axis value, no tooltip and no hidden table.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. `/pulse` ports the 6.19 rules of `design/css/components.css` (`.chart-card`, `.bars`, `.colour-clock`, `.candle-marks`) into CSS Modules, as `apps/web/src/screen/Ticker.module.css` ports `.ticker`.
- Write in `fabi/` only. Other members' folders are read-only.
- **Keep `fabi/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Fabi a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work. A Done line's Commit cell is filled in the next commit, as in Build 1 and 2.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm run db:reset` is not run in this block. Migration 004 reaches Tiger with `npm run db:migrate` (B3-10), which wipes nothing. Only this session runs `db:migrate`, `db:seed`, `glow:check` and `simulate:crowd` against Tiger.

## 1. Current state (checked at hour 10, 2026-11-13 23:45 to 2026-11-14 00:15 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Build 2 is closed for this lane: every B2 ID is under Done; PR #25 (`40db233`) and PR #26 (`a3eefa9`) are merged and deployed; `AGENT_TOOL_SECRET` is on Render; Checkpoint 2 line 2 passed on the deployed API (glossary, hour 10). Open in the glossary: Checkpoint 2 line 1 with Ionut and Cristea, and four "tell the team" rows (hours 5, 7, 9, 9).
- `origin/main` and the local `main` are at `6aeee0b`, working tree clean. No open PR. The only remote branch not merged into `main` is `origin/fabi/setup-db` (a glossary diff only).
- Carried over into this block: the talk-turn cap (from Build 1, moved at hour 7; B3-8); Patrick's Blocked row of hour 9 asking for a reseed that keeps events (B3-10, Fabi's decision, hour 10); the hourly aggregate `site_activity_1h`, which moves to Build 4 with the `EXPLAIN ANALYZE` row (Fabi's decision, hour 10).
- Exists and this block builds on it:
  - `packages/shared/src/contract.ts`: `EventKind` (with `lamp`, `candle`), `SocketMessage` (with `lamps`, `candle`, but no payload schema for either), `GlowMessage`, `EventBatch`, `AgentLang`, a private `Hex` regex.
  - `apps/api/src/seam.ts`: `Db`, `Tx`, `LatestGlow`, `Live` (`emitGlow`, `emitPane`, `emitWindowComplete`, `close`), `GlowLoop` (`tick`, `nudge`, `latest`, `stop`), `OnPane`, `AppDeps` (`db`, `tx`, `onEventsStored: () => void`, `onPane`, `latestGlow`).
  - `apps/api/src/glow/loop.ts`: `startGlowLoop({ db, emit, intervalMs?, now? })`, a 5 s tick plus `nudge` (at most once a second); a failed tick logs one line.
  - `apps/api/src/live/socket.ts`: `roomsFor`, `paneRooms`, `attachLive(server, { origin, latestGlow })`; a new socket gets the latest glow at once.
  - `apps/api/src/events/router.ts`: `INSERT_EVENTS` (an `unnest` insert joined to `sites`, no `RETURNING`), `toRows`, `userSub`, `MAX_EVENT_AGE_MS`; `onStored()` called inside the `try` after a non-zero insert. `weights.ts`: `CLIENT_KINDS` includes `lamp` and `candle`.
  - `apps/api/src/stats/stats.ts`: `STATS_SQL` counts `lamp` events city-wide since `TODAY_START_SQL` (the same rule as "lamps lit today").
  - `apps/api/src/panes/state.ts`: `COLOURS_TODAY_SQL` (site panes since local midnight, the Gallery not counted) and the `screenLimiter` with its `shortcut:` comment.
  - `apps/api/src/db/`: `pool.ts` (`createPool`, `asDb`, `asTx`), `today.ts` (`TODAY_START_SQL`), `seed.ts` (`SiteFile`, `parseSiteFile`, `toSiteRow`, `toSitesJson`, `INSERT_SITE`, `siteParams`), `reset.ts` (runs `db/reset.sql`, every migration, the seed in one transaction, writes `sites.json`, prints `db:reset done: 7 tables, 2 hypertables, 5 sites`).
  - `db/migrations/001_init.sql` (`sites.is_memorial`, `interaction_events` with `ts`, `session_id`, `site_id`, `kind`, `weight`, `lang`, no id column; index `(site_id, ts DESC)`), `002_site_activity.sql` (`site_activity_1m` with `n`, `w`, `visitors_hll`), `003_colour.sql` (`colour_readings`, `colour_1h` with `panes`, `hue_sin`, `hue_cos`, `lightness`; no saturation). `db/reset.sql` drops both aggregates and seven tables.
  - `scripts/simulate-crowd.ts`: `parseArgs` (strict) with `--api`, `--sessions`, `--seconds`, `--site`; `hslToHex` with two asserts; one `wake` and one pane per session every 2 s.
  - Web: `apps/web/src/routes/Pulse.tsx` is a placeholder rendering "Pulse" (Ionut's hand-off of hour 0 gives it to Fabi). `apps/web/src/api/client.ts` exports `API_URL`. `apps/web/src/phone/GlowMark.tsx` (`{ siteName, glow, connected }`, DESIGN 6.5 size M). `apps/web/src/main.tsx` imports only `styles/tokens.css`; `design/css/components.css` is not imported by the app. `apps/web/src/screen/ScreenPage.tsx` shows "Lamps lit today" as `...` with the comment "The lamps message is Fabi's Build 3 row".
  - `.env.example` names `ELEVENLABS_WEBHOOK_SECRET`.
- Does not exist yet, and the subtask that adds it: payloads for `lamps` and `candle`, `TimeNow`, the Pulse schemas (B3-1.a, B3-10.a); `GET /time` (B3-3.a.1); `apps/web/src/time/clockOffset.ts` (B3-3.b.1); `apps/api/src/glow/lamps.ts` (B3-1.b.1); `apps/api/src/events/candles.ts` (B3-1.a); `db/migrations/004_conversations.sql` (B3-10.b.1); `npm run db:migrate`, `npm run db:seed` (B3-10.a, B3-10.c.1); `apps/api/src/webhooks/` (B3-7.a.1); `apps/api/src/pulse/` (B3-5.a.1, B3-5.b.1); `apps/web/src/pulse/` (B3-6); `recharts` (B3-6.a).
- "Needs from others" (plan section 11, Fabi): only `requireVisitor`, landed in Build 1. Nothing this block needs from others is outstanding. Who waits on this block: Patrick's Lamp (Build 3: `lamp` events, the `lamps` message, the clock offset); Cristea's `/screen` ("Lamps lit today", memorial candle points, Build 3 item 11); Ionut's memorial candle (Build 4, sends `candle`). None of the three has a Build 3 prompt yet (checked: `ionut/`, `cristea/` have up to `build_2`, `patrick/` up to `build_1`).
- ElevenLabs post-call webhook (checked at hour 10): https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks gives the header `ElevenLabs-Signature`, the body `{ type: "post_call_transcription", event_timestamp, data: { agent_id, conversation_id, status, transcript, metadata: { start_time_unix_secs, call_duration_secs }, analysis: { data_collection_results, transcript_summary }, conversation_initiation_client_data: { dynamic_variables, conversation_config_override: { agent: { language } } } } }`, a 200 to acknowledge, and retries (deduplicate by `conversation_id`). The official SDK source (https://raw.githubusercontent.com/elevenlabs/elevenlabs-js/main/src/wrapper/webhooks.ts) gives the format: the header is split on commas; `t=<unix seconds>`; `v0=<hex>` = HMAC-SHA256 of `<t>.<raw body>` keyed with the secret; a timestamp older than 30 minutes is rejected.
- Scripts the verify commands use (root `package.json`): `typecheck`, `build`, `test`, `db:reset`, `glow:check`, `simulate:crowd`; `apps/api`: `test`, `typecheck`, `dev`, `start`, `db:reset`, `glow:check`; `apps/web`: `test`, `typecheck`, `build`, `dev`. `db:migrate` and `db:seed` are added in B3-10.a.
- Baseline at hour 10: `npm run typecheck` exit 0; `npm test` → API `Tests 170 passed (170)`, web `Tests 177 passed (177)`.
- Deployed at 23:52: web `https://lampa-timisoara.vercel.app` → 200; API `/health` → `{"ok":true}` 200; `/pulse/glow` and `/time` → 404.
- Devices: Fabi has a laptop only (Decisions, hour 6). Checks with other people (Fabi's decision, hour 10): the Lamp with Patrick, `/pulse` on Ionut's iPhone, the post-call webhook at Checkpoint 2's live Talk, the candle on `/screen` with Cristea.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 3, Fabi's rows, and Checkpoint 3 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Fabi's table and "Needs from others" | All |
| `IMPLEMENTATION_PLAN.md` | Section 7, cut order and "The memorial site" | B3-4, B3-5, B3-6, B3-last |
| `fabi/GLOSSARY.md` | Whole file | All |
| `fabi/build_3/build_3_prompt.md` | Sections 0, 1 and the seams in section 3 | All |
| `DESIGN.md` | 6.13 LampCounter (value, label, presence line counts), 6.19 ChartCard, ColourClock and CandleMarks, 7.14 Pulse of Timișoara, 6.5 GlowMark, 2.1 tokens, 3.2 type scale, 5.6 reduced motion, 8 accessibility | B3-1, B3-2, B3-5, B3-6 |
| `design/css/components.css` | The 6.19 block (`.chart-card` to `.candle-marks__ends`) | B3-6 |
| `apps/web/src/styles/tokens.css`, `apps/web/src/screen/Ticker.module.css` | Tokens; how a `design/css` block is ported to a CSS Module | B3-6 |
| `packages/shared/src/contract.ts`, `sites.ts`, `colours.ts` | `EventKind`, `SocketMessage`, `GlowMessage`, `EventBatch`, `AgentLang`, `Hex`, the seam additions; `sites`; `hueBin` | All |
| `apps/api/src/seam.ts`, `app.ts`, `index.ts`, `db/pool.ts`, `db/today.ts` | Whole files | All |
| `apps/api/src/events/router.ts`, `weights.ts`, `router.test.ts` | Whole files | B3-4, B3-8 |
| `apps/api/src/glow/loop.ts`, `loop.test.ts`, `apps/api/src/live/socket.ts`, `socket.test.ts` | Whole files | B3-1, B3-2, B3-4 |
| `apps/api/src/stats/stats.ts`, `apps/api/src/panes/state.ts`, `apps/api/src/sites/router.ts`, `apps/api/src/tools/router.ts` | `STATS_SQL`, `COLOURS_TODAY_SQL`, the limiter and its `shortcut:` comment, the secret check style | B3-3, B3-5, B3-7 |
| `apps/api/src/auth/session.ts` | `requireVisitor`, `Visitor` | B3-4, B3-8 |
| `apps/api/src/db/seed.ts`, `seed.test.ts`, `reset.ts`, `db/reset.sql`, `db/migrations/001_init.sql` to `003_colour.sql` | Whole files | B3-10, B3-7, B3-5 |
| `scripts/simulate-crowd.ts` | Whole file | B3-9 |
| `apps/web/src/api/client.ts`, `apps/web/src/phone/GlowMark.tsx`, `apps/web/src/routes/Pulse.tsx`, `apps/web/src/App.tsx` | `API_URL`; the GlowMark props; the placeholder; the route table | B3-3, B3-6 |
| The two ElevenLabs pages of section 1 | The webhook body and the signature format | B3-7 |
| Concept PDF (`LAMPA_Hackathon_Concept_Timisoara_v6.pdf`), section 11.2 D and E | The gap-filled interactions query, unique visitors, the colour-clock query | B3-5 |
| Tiger docs | `time_bucket_gapfill`, `distinct_count(rollup(...))`, `create_hypertable(... by_range ...)` | B3-5, B3-10 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Lamps lit today: query and broadcast | 1 | B3-1.a, B3-1.b, B3-1.c |
| People lighting now: distinct sessions with a `lamp` event at each site in the last 90 s, sent per site in the `lamps` message | 0.5 | B3-2.a, B3-1.c |
| Clock offset endpoint (5 pings, lowest RTT), moved here from Build 4 for the lamp pulse | 0.5 | B3-3.a, B3-3.b |
| `candle` events and broadcast; Pulse shows the memorial's candles as marks with no numbers | 0.5 | B3-4.a, B3-4.b, B3-4.d, B3-5.b, B3-6.b |
| `GET /pulse/*`, cached 5 s: glow, gap-filled interactions, unique visitors with hyperloglog, colour clock, languages | 2.5 | B3-10.a, B3-5.a, B3-5.b, B3-5.c |
| `/pulse` page: charts and the colour clock ring | 2 | B3-6.a, B3-6.b, B3-6.c, B3-6.d |
| Post-call webhook with HMAC check into `conversations` (first to cut) | 0.5 | B3-7.a, B3-10.b, B3-7.b |
| Carried from Build 1: the talk-turn cap of 5 (Fabi's decision, hour 10: 5 per visitor per site per 10 minutes) | from slack | B3-8.a |
| Added, no plan row (Fabi's decision, hour 10; plan updated): `simulate:crowd --lamps --candles` | 0.25 | B3-9.a, B3-1.c |
| Added, no plan row (Fabi's decision, hour 10; plan updated): `npm run db:migrate` and `npm run db:seed` (Patrick's Blocked row of hour 9) | 0.5 | B3-10.a, B3-10.c, B3-10.d |
| Section 8: no Fabi test falls in Build 3 | 0 | none |
| `DESIGN.md` section 9, item 12: Pulse, with CandleMarks: ChartCard styling, ColourClock, glow bars, lamps, CandleMarks; languages chart only if it ships | 0.75 | B3-6.b, B3-6.c |
| Checkpoint 3: the Pulse step and the memorial step of the v5 addendum, with the crowd simulator running | team | B3-1.c, B3-4.c, B3-5.c, B3-last |

Total: 9 h of tasks (7.5 h of plan rows, 0.75 h of styling, 0.75 h added) in a 7 h block (hours 11 to 18). Fabi accepted the overrun with the cut order of section 0 (hour 10).

Order: B3-0 and the docs commit. Then `fabi/b3-live`: B3-1.a (seam 1, this session). Then three agents in parallel: `fabi-realtime` runs B3-1.b.1, B3-2.a.1, B3-4.b.1, B3-9.a.1 one after the other; `fabi-api` runs B3-4.a.1, B3-8.a.1, B3-3.a.1, B3-4.d.1 one after the other; `fabi-web` runs B3-3.b.1. Their file lists do not overlap at any moment (the table below). Then B3-1.c and B3-4.c (this session, on Tiger) and PR 1. Then `fabi/b3-data`: B3-10.a (seam 2, this session), then at once B3-6.a (seam 3, this session, in the worktree). Then in parallel: `fabi-sql` runs B3-10.b.1; `fabi-api` runs B3-10.c.1, then (after B3-10.d, this session on Tiger) B3-5.a.1, B3-5.b.1 and last B3-7.a.1, the first item to cut (Fabi's decision, hour 10); `fabi-web` runs B3-6.b.1 then B3-6.c.1 in `../Lampa-b3-pulse`. Then B3-5.c, B3-7.b and PR 2 (this session); then B3-6.d and PR 3. B3-last ends the block.

The seams. This session writes them as exact code and commits them before starting the agents.

Seam 1, on `fabi/b3-live` (B3-1.a):

```ts
// packages/shared/src/contract.ts: append. Owner: this session (Fabi's decision, hour 10; Fabi takes it to the team).

/** The lamps goal of the night of 12 November 1884. */
export const LAMP_TARGET = 731;

/** `lamps` on /live, to every socket: `lamp` events since local midnight city-wide, and for each lamp site the distinct sessions with a `lamp` there in the last 90 s. */
export const LampsMessage = z.object({
  litToday: z.number().int().min(0),
  target: z.literal(LAMP_TARGET),
  sites: z.array(z.object({ siteId: z.string(), lightingNow: z.number().int().min(0) })),
});
export type LampsMessage = z.infer<typeof LampsMessage>;

/** GET /time, public: the server clock in epoch milliseconds. */
export const TimeNow = z.object({ now: z.number().int() });
export type TimeNow = z.infer<typeof TimeNow>;
```

```ts
// packages/shared/src/contract.ts: Cristea's lines, word for word from cristea/build_3/build_3_prompt.md section 3 (team-agreed, Cristea's Decisions hour 25; Fabi's decision, hour 11). Identical in both seams so either can land first.
// Insert directly above ScreenState:
// candle on /live (Fabi's Build 3 row), and the candles in GET /screen/state
export const CandleMessage = z.object({ id: z.string(), siteId: z.string(), litAt: z.string() });
export type CandleMessage = z.infer<typeof CandleMessage>;

// inside ScreenState's z.object, after coloursToday:
  candles: z.array(CandleMessage).default([]),
```

`CandleMessage.id` is a hash of the event, never the session (`candleId` below); `litAt` is the event's `ts` as an ISO string.

```ts
// apps/api/src/seam.ts: replace the import, Live, GlowLoop and AppDeps; add LatestLamps and OnEventsStored. Owner: this session.
import type { CandleMessage, GlowMessage, LampsMessage, PaneMessage, WindowCompleteMessage } from "@lampa/shared";

/** The last lamps message sent, or null before the first one. */
export type LatestLamps = () => LampsMessage | null;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = {
  emitGlow: (message: GlowMessage) => void;
  emitPane: (message: PaneMessage) => void;
  emitWindowComplete: (message: WindowCompleteMessage) => void;
  emitLamps: (message: LampsMessage) => void;
  emitCandle: (message: CandleMessage) => void;
  close: () => Promise<void>;
};

/** `startGlowLoop` in `glow/loop.ts` returns this. */
export type GlowLoop = { tick: () => Promise<void>; nudge: () => void; latest: LatestGlow; latestLamps: LatestLamps; stop: () => void };

/** Called after POST /events stores rows: the candles among them, as messages (often none). */
export type OnEventsStored = (candles: CandleMessage[]) => void;

export type AppDeps = { db?: Db; tx?: Tx; onEventsStored?: OnEventsStored; onPane?: OnPane; latestGlow?: LatestGlow };
```

```ts
// apps/api/src/events/candles.ts: new. Owner: this session.
import { createHash } from "node:crypto";

/** A public id for a candle: a hash of its time and session, so the session never leaves the server. */
export const candleId = (ts: Date, sessionId: string): string =>
  createHash("sha256").update(`${ts.toISOString()}|${sessionId}`).digest("hex").slice(0, 16);
```

```ts
// apps/api/src/events/router.ts: the seam import gains OnEventsStored, and two lines change until B3-4.a.1. Owner after the seam: fabi-api.
import type { Db, OnEventsStored } from "../seam.js";
export function createEventsRouter(deps: { db?: Db; onStored?: OnEventsStored; now?: () => Date }): Router {
      if (accepted > 0) deps.onStored?.([]);

// apps/api/src/glow/loop.ts: until B3-1.b.1. Owner after the seam: fabi-realtime.
export function startGlowLoop(deps: { db: Db; emit: (message: GlowMessage) => void; emitLamps?: (message: LampsMessage) => void; intervalMs?: number; now?: () => Date }): GlowLoop {
    latestLamps: () => null, // in the returned object

// apps/api/src/live/socket.ts: until B3-1.b.1 and B3-4.b.1. Owner after the seam: fabi-realtime.
// latestLamps is optional so the existing socket tests compile unchanged.
export function attachLive(server: HttpServer, { origin, latestGlow, latestLamps }: { origin: string | undefined; latestGlow: LatestGlow; latestLamps?: LatestLamps }): Live {
    emitLamps: () => {
      throw new Error("emitLamps is not implemented");
    },
    emitCandle: () => {
      throw new Error("emitCandle is not implemented");
    },

// apps/api/src/time/router.ts: stub. Owner after the seam: fabi-api (B3-3.a.1).
import { Router } from "express";
export function createTimeRouter(_deps: { now?: () => number } = {}): Router {
  return Router();
}
```

```ts
// apps/api/src/app.ts (Cristea's file, approved by Fabi, hour 10): after the tools router.
  app.use(createTimeRouter());

// apps/api/src/index.ts: candles go out, then the glow and lamps nudge; the loop sends lamps.
const latestLamps = () => loop?.latestLamps() ?? null;
const onEventsStored: OnEventsStored = (candles) => {
  for (const candle of candles) live.emitCandle(candle);
  loop?.nudge();
};
const server = createServer(createApp({ db, tx, onEventsStored, onPane, latestGlow }));
const live = attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow, latestLamps });
if (db) loop = startGlowLoop({ db, emit: live.emitGlow, emitLamps: live.emitLamps });
```

```ts
// apps/web/src/time/clockOffset.ts: stub. Owner after the seam: fabi-web (B3-3.b.1).
/** Server clock minus this device's clock, in ms, from 5 pings to GET /time; null when every ping failed. */
export async function getClockOffset(_deps: { fetch?: typeof fetch; now?: () => number } = {}): Promise<number | null> {
  return null;
}
```

Seam 2, on `fabi/b3-data` (B3-10.a):

```ts
// packages/shared/src/contract.ts: append. Owner: this session (Fabi's decision, hour 10; Fabi takes it to the team).
const SiteGlow = z.object({ siteId: z.string(), glow: z.number().min(0).max(1) });

/** GET /pulse/summary. Glow and colours leave the Cathedral out; visitors are city-wide. */
export const PulseSummary = z.object({
  cityGlow: z.number().min(0).max(1),
  glow: z.array(SiteGlow),
  lampsToday: z.number().int().min(0),
  coloursToday: z.number().int().min(0),
  visitorsToday: z.number().int().min(0),
});
export type PulseSummary = z.infer<typeof PulseSummary>;

/** GET /pulse/colour-clock: the 24 hours of the day (local time) over the last 30 days. */
export const PulseColourClock = z.object({
  hours: z
    .array(z.object({ hour: z.number().int().min(0).max(23), hex: Hex.nullable(), panes: z.number().int().min(0) }))
    .length(24),
  currentHour: z.number().int().min(0).max(23),
});
export type PulseColourClock = z.infer<typeof PulseColourClock>;

/** GET /pulse/interactions: per colour site, interactions per 5 minutes over the last 3 hours, gap-filled. */
export const PulseInteractions = z.object({
  sites: z.array(
    z.object({ siteId: z.string(), points: z.array(z.object({ t: z.string().datetime(), n: z.number().int().min(0) })) }),
  ),
});
export type PulseInteractions = z.infer<typeof PulseInteractions>;

/** GET /pulse/languages: conversations since local midnight, by language. */
export const PulseLanguages = z.object({
  languages: z.array(z.object({ lang: z.string(), conversations: z.number().int().min(1) })),
});
export type PulseLanguages = z.infer<typeof PulseLanguages>;

/** GET /pulse/candles: candles at the memorial in the last 24 hours. No count is ever shown. */
export const PulseCandles = z.object({ candles: z.array(z.object({ id: z.string().min(1), at: z.string().datetime() })) });
export type PulseCandles = z.infer<typeof PulseCandles>;
```

```ts
// apps/api/src/pulse/router.ts: stub. Owner after the seam: fabi-api (B3-5.a.1, B3-5.b.1).
import { Router } from "express";
import type { Db, LatestGlow } from "../seam.js";
export function createPulseRouter(_deps: { db?: Db; latestGlow: LatestGlow; now?: () => Date }): Router {
  return Router();
}

// apps/api/src/webhooks/elevenlabs.ts: stub. Owner after the seam: fabi-api (B3-7.a.1).
import { Router } from "express";
import type { Db } from "../seam.js";
export function createElevenLabsWebhookRouter(_deps: { db?: Db; now?: () => Date }): Router {
  return Router();
}
```

```ts
// apps/api/src/app.ts (approved by Fabi, hour 10): the webhook reads its raw body, so it goes before express.json().
  app.use(sessionRouter);
  app.use(createElevenLabsWebhookRouter({ db: deps.db }));
  app.use(express.json());
  // ... and after the time router:
  app.use(createPulseRouter({ db: deps.db, latestGlow: deps.latestGlow ?? (() => null) }));
```

`apps/api/package.json` gains `"db:migrate": "tsx --env-file-if-exists=../../.env src/db/migrate.ts"` and `"db:seed": "tsx --env-file-if-exists=../../.env src/db/seed-sites.ts"`, each with a one-line stub file that prints `not implemented` and exits 1; the root `package.json` gains `"db:migrate": "npm run db:migrate -w @lampa/api"` and `"db:seed": "npm run db:seed -w @lampa/api"`.

Seam 3, on `fabi/b3-pulse-page` (B3-6.a), in the worktree: `git worktree add ../Lampa-b3-pulse -b fabi/b3-pulse-page fabi/b3-data`, then in `../Lampa-b3-pulse`: `npm ci`, `npm install recharts@3.10.1 --save-exact -w @lampa/web`; `apps/web/src/routes/Pulse.tsx` renders `<PulsePage />` from `apps/web/src/pulse/PulsePage.tsx`, a stub returning `<main><h1>Pulse of Timișoara</h1></main>`.

### 3.1 Subagents

Fabi asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Fabi, re-runs the checks, writes the glossary and does the first and last tasks, the seams, the installs and the checks on Tiger. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `fabi-sql` | Migration 004 and `db/reset.sql` | opus | reused from Build 2, scope updated for Build 3 |
| `fabi-api` | Express routers with pg and Zod: candle and lamp rules and the talk cap in `POST /events`, `GET /time`, `db:migrate` and `db:seed`, the post-call webhook, `GET /pulse/*`, with tests | sonnet | reused from Build 2, scope updated for Build 3 |
| `fabi-realtime` | The lamps query in the glow loop, `lamps` and `candle` on `/live`, the simulator's `--lamps` and `--candles`, with tests | opus | reused from Build 2, scope updated for Build 3 |
| `fabi-web` | The `/pulse` page (React, CSS Modules ported from `design/css`, Recharts) and `clockOffset.ts`, with Vitest tests | opus | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B3-1.b.1 | `fabi-realtime` | Lamps query in the loop, `emitLamps`, lamps on connect | `apps/api/src/glow/lamps.ts`, `lamps.test.ts`, `loop.ts`, `loop.test.ts`, `apps/api/src/live/socket.ts`, `socket.test.ts` | after B3-1.a, parallel with B3-4.a.1 and B3-3.b.1 |
| B3-4.a.1 | `fabi-api` | Memorial rules and candles in `POST /events` | `apps/api/src/events/router.ts`, `router.test.ts` | after B3-1.a, parallel with B3-1.b.1 and B3-3.b.1 |
| B3-3.b.1 | `fabi-web` | `getClockOffset` | `apps/web/src/time/clockOffset.ts`, `clockOffset.test.ts` | after B3-1.a, parallel with B3-1.b.1 and B3-4.a.1 |
| B3-2.a.1 | `fabi-realtime` | `lightingNow` per site | `apps/api/src/glow/lamps.ts`, `lamps.test.ts` | after B3-1.b.1, parallel with B3-8.a.1 |
| B3-4.b.1 | `fabi-realtime` | `emitCandle` | `apps/api/src/live/socket.ts`, `socket.test.ts` | after B3-2.a.1, parallel with B3-3.a.1 |
| B3-8.a.1 | `fabi-api` | Talk-turn cap | `apps/api/src/events/router.ts`, `router.test.ts`, `apps/api/src/events/talk.ts`, `talk.test.ts` | after B3-4.a.1, parallel with B3-2.a.1 |
| B3-3.a.1 | `fabi-api` | `GET /time` | `apps/api/src/time/router.ts`, `router.test.ts` | after B3-8.a.1, parallel with B3-4.b.1 |
| B3-9.a.1 | `fabi-realtime` | Simulator `--lamps`, `--candles` | `scripts/simulate-crowd.ts` | after B3-4.b.1 |
| B3-4.d.1 | `fabi-api` | Candles in `GET /screen/state` | `apps/api/src/panes/state.ts`, `state.test.ts` | after B3-3.a.1, parallel with B3-9.a.1 |
| B3-10.b.1 | `fabi-sql` | Migration 004 and the reset lines | `db/migrations/004_conversations.sql`, `db/reset.sql` | after B3-10.a, parallel with B3-10.c.1 |
| B3-10.c.1 | `fabi-api` | `db:migrate`, `db:seed`, `reset.ts` records migrations | `apps/api/src/db/migrate.ts`, `migrations.ts`, `migrations.test.ts`, `seed-sites.ts`, `seed.ts`, `seed.test.ts`, `reset.ts` | after B3-10.a, parallel with B3-10.b.1 |
| B3-5.a.1 | `fabi-api` | `/pulse/summary`, `/pulse/interactions`, the cache, the limiters | `apps/api/src/pulse/router.ts`, `router.test.ts`, `queries.ts`, `queries.test.ts` | after B3-10.d, parallel with B3-6.b.1 |
| B3-5.b.1 | `fabi-api` | `/pulse/colour-clock`, `/pulse/languages`, `/pulse/candles` | `apps/api/src/pulse/router.ts`, `router.test.ts`, `queries.ts`, `queries.test.ts`, `colour.ts`, `colour.test.ts` | after B3-5.a.1, parallel with B3-6.b.1 or B3-6.c.1 |
| B3-7.a.1 | `fabi-api` | Post-call webhook | `apps/api/src/webhooks/elevenlabs.ts`, `elevenlabs.test.ts` | after B3-5.b.1, last (first to cut) |
| B3-6.b.1 | `fabi-web` | Data functions and the cards | `apps/web/src/pulse/**` in `../Lampa-b3-pulse` | after B3-6.a, parallel with `fabi-api` and `fabi-sql` (other worktree) |
| B3-6.c.1 | `fabi-web` | Page layout, states, styling | `apps/web/src/pulse/**` in `../Lampa-b3-pulse` | after B3-6.b.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Fabi to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Fabi. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Fabi, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B3-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`, `npm run glow:check`. Expected: exit 0, API `Tests 170 passed (170)`, web `Tests 177 passed (177)`, `glow:check ok: 4 sites`.
- [ ] Re-check section 1: open PRs, `origin/main`, the Blocked and Hand-offs sections of `ionut/`, `cristea/` and `patrick/GLOSSARY.md`, and whether `packages/shared/src/contract.ts` or `apps/api/src/events/router.ts` changed since `6aeee0b`. Record the answers.
- [ ] `git check-ignore -q .env` → exit 0 (B3-7.b gives the local API a throwaway webhook secret in its process environment only; nothing is written to `.env`).
- [ ] The docs commit (this prompt, the glossary lines, the plan update) is on `main`. Then `git switch -c fabi/b3-live`.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently.

### B3-1 Lamps lit today: query and broadcast (1 h)

#### B3-1.a Seam 1 is committed (this session)

- [ ] Seam 1 of section 3, exactly as written, on `fabi/b3-live`.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines (API 170, web 177).
- Done when: the stubs compile, the existing tests pass, and the seam is one commit.

#### B3-1.b Every socket gets the city's lamps lit today

**B3-1.b.1** Lamps in the glow loop. Subagent: `fabi-realtime`. Files: `apps/api/src/glow/lamps.ts`, `lamps.test.ts`, `loop.ts`, `loop.test.ts`, `apps/api/src/live/socket.ts`, `socket.test.ts`.

- [ ] `lamps.ts`: `export const LAMP_PRESENCE_S = 90;` and `export const LAMPS_SQL`, one query giving `lit_today` (`count(*)::int` of `interaction_events` with `kind = 'lamp'` and `ts >= ${TODAY_START_SQL}`, every site, the same rule as `STATS_SQL`) and one row per lamp site: every `sites` row with `status = 'published'`, `NOT is_memorial` and `'lamp' = ANY(interactions)`, with `lighting_now` = 0 in this task. `export function toLampsMessage(rows): LampsMessage` passes through `LampsMessage.parse` with `target: LAMP_TARGET`.
- [ ] `loop.ts`: each tick, after the glow message, runs `LAMPS_SQL` when `deps.emitLamps` is set, then `emitLamps(message)` and keeps it as `latestLamps()` only after `emitLamps` returns (the rule the glow message follows). A failed lamps query logs `lamps tick failed: <message>` and leaves the glow message unaffected; a failed glow query does not stop the lamps query. `nudge` and the 5 s interval are unchanged.
- [ ] `socket.ts`: `emitLamps(message)`: `LampsMessage.parse` first, then `live.emit(SocketMessage.enum.lamps, parsed)` to every socket. A new socket gets `latestLamps()` at once when it is not null, after the glow message. The `emitCandle` stub stays until B3-4.b.1.
- [ ] Tests, cases by name. `lamps.test.ts`: "toLampsMessage carries lit_today and target 731"; "a site row becomes siteId and lightingNow"; "an invalid row throws". `loop.test.ts`: "a tick emits glow, then lamps"; "a failed lamps query still emits glow"; "a failed glow query still emits lamps"; "latestLamps is null before the first tick and the last message after"; "no emitLamps runs no lamps query". `socket.test.ts`: "lamps reaches a city-only socket and a screen socket"; "a new socket gets the latest lamps after the latest glow"; "an invalid lamps message throws and nothing is sent".
- Verify: `npm run test -w @lampa/api -- src/glow src/live && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with `LampsMessage.parse` removed from `emitLamps` the invalid-message case fails (this session checks, then restores).

#### B3-1.c On Tiger: lamps, presence and candles reach the sockets (this session)

Runs after B3-9.a.1.

- [ ] Local API with `npm run dev -w @lampa/api` on the root `.env`. Socket.IO listeners in `city` only, `screen` and `site:cathedral`, printing every `lamps` and `candle` with the time.
- [ ] `npm run simulate:crowd -- --site unirii --sessions 3 --seconds 70 --lamps --candles 2`: within 5 s of the first `lamp`, `lamps` shows `litToday` up by 3 and `unirii` `lightingNow` 3; the other three sites 0; no `cathedral` entry. About 90 s after the last `lamp`, `unirii` `lightingNow` is back to 0.
- [ ] `litToday` equals `SELECT count(*) FROM interaction_events WHERE kind = 'lamp' AND ts >= <local midnight>`, and equals `lamps_lit_today` of `POST /tools/get_site_stats` (secret from `.env`, never printed).
- [ ] The two candles: `screen` and `site:cathedral` print each `candle` once, with `siteId` `cathedral`, an `id` of 16 hex characters and `litAt`; the `city`-only listener prints none. `GET /screen/state` lists both in `candles` (B3-4.d).
- [ ] One `lamp` at `cathedral` and one `candle` at `unirii` with `curl` → `{"accepted":0} 202`, no row.
- Verify: the listener lines, the counts and the two `curl` answers, pasted.
- Done when: every line above holds on Tiger.

### B3-2 People lighting now, per site (0.5 h)

#### B3-2.a Each lamp site carries its people lighting now

**B3-2.a.1** `lightingNow`. Subagent: `fabi-realtime`. Files: `apps/api/src/glow/lamps.ts`, `lamps.test.ts`.

- [ ] `LAMPS_SQL`: `lighting_now` per lamp site = `count(DISTINCT session_id)::int` of `interaction_events` at that site with `kind = 'lamp'` and `ts > now() - make_interval(secs => ${LAMP_PRESENCE_S})`; 0 for a site with none. It reads the hypertable through its `(site_id, ts DESC)` index, not the aggregate (the aggregate is per minute).
- [ ] Tests, cases by name: "LAMPS_SQL counts distinct sessions"; "LAMPS_SQL uses the 90 s window"; "LAMPS_SQL leaves memorial sites out" (each asserts on the SQL text, as `stats.test.ts` does).
- Verify: `npm run test -w @lampa/api -- src/glow && npm run typecheck`. Paste the summary line.
- Done when: every case passes; the live count is checked in B3-1.c.

### B3-3 Clock offset endpoint (0.5 h)

#### B3-3.a The server tells its time

**B3-3.a.1** `GET /time`. Subagent: `fabi-api`. Files: `apps/api/src/time/router.ts`, `router.test.ts`.

- [ ] `createTimeRouter({ now })` mounts `GET /time`: public, no token, its own `rateLimit({ windowMs: 60_000, limit: 120 })` per IP with the same `shortcut:` comment as `screenLimiter`, `Cache-Control: no-store`, 200 `TimeNow.parse({ now: (deps.now ?? Date.now)() })`. It needs no database.
- [ ] Tests, cases by name: "GET /time answers 200 with now from the clock"; "the body parses as TimeNow"; "Cache-Control is no-store"; "no token is needed".
- Verify: `npm run test -w @lampa/api -- src/time && npm run typecheck`. Paste the summary line.
- Done when: every case passes.

#### B3-3.b A phone learns its offset from 5 pings

**B3-3.b.1** `getClockOffset`. Subagent: `fabi-web`. Files: `apps/web/src/time/clockOffset.ts`, `clockOffset.test.ts`.

- [ ] `export const CLOCK_PINGS = 5;` `getClockOffset({ fetch, now })` (defaults: the global `fetch`, `Date.now`) sends 5 pings one after the other to `${API_URL}/time` (from `../api/client`), with `cache: "no-store"` and no token. Each ping: `t0 = now()`, the request, `t1 = now()`, `TimeNow.parse` of the body; `rtt = t1 - t0`; `offset = server.now + rtt / 2 - t1`. It resolves the offset of the ping with the lowest `rtt` (the first one on a tie), rounded to an integer. A ping that throws, answers non-2xx or fails the schema is skipped; when all 5 fail it resolves `null`. Patrick's lamp pulse uses `Date.now() + offset` as server time; with `null` the pulse is steady (DESIGN item 9).
- [ ] Tests with a fake `fetch` and a fake `now`, cases by name: "five pings are sent one after the other"; "the lowest round trip wins"; "a tie keeps the first"; "offset is server time plus half the round trip minus the local end"; "a failed ping is skipped"; "a non-2xx ping is skipped"; "a body that fails TimeNow is skipped"; "all pings failing gives null".
- Verify: `npm run test -w @lampa/web -- src/time && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, and with the lowest-RTT choice replaced by the last ping at least one case fails (this session checks, then restores).

### B3-4 `candle` events and broadcast; candle marks on Pulse (0.5 h)

#### B3-4.a `POST /events` keeps the memorial rules and hands over its candles

**B3-4.a.1** Memorial rules and candles. Subagent: `fabi-api`. Files: `apps/api/src/events/router.ts`, `router.test.ts`.

- [ ] `INSERT_EVENTS` keeps its `unnest` and its join to `sites`, adds `WHERE NOT (e.kind = 'lamp' AND s.is_memorial) AND NOT (e.kind = 'candle' AND NOT s.is_memorial)`, and ends with `RETURNING ts, site_id, kind` (Fabi's decision, hour 10).
- [ ] After a non-zero insert: `candles` = the returned rows with `kind = 'candle'`, each as `CandleMessage.parse({ id: candleId(ts, visitor.sub), siteId, litAt: ts.toISOString() })` with `candleId` from `./candles.js`. The answer is 202 `{ accepted }` first; then `deps.onStored?.(candles)` in its own `try`, logging only `events onStored failed: <message>` if it throws, so a socket failure never changes the answer (the rule `POST /panes` follows).
- [ ] Tests, cases by name: "a lamp at a memorial site is not stored" and "a candle at a site that is not a memorial is not stored" (both assert on the SQL text and parameters); "a stored candle reaches onStored as a CandleMessage"; "the candle id does not contain the session"; "onStored gets an empty list when no candle was stored"; "onStored throwing still answers 202"; the existing cases keep passing.
- Verify: `npm run test -w @lampa/api -- src/events && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with the `WHERE` line removed the two memorial-rule cases fail (this session checks, then restores).

#### B3-4.b `/screen` and the Cathedral's room hear each candle

**B3-4.b.1** `emitCandle`. Subagent: `fabi-realtime`. Files: `apps/api/src/live/socket.ts`, `socket.test.ts`.

- [ ] `emitCandle(message)`: `CandleMessage.parse` first, then `live.to(["site:" + siteId, "screen"]).emit(SocketMessage.enum.candle, parsed)`, once per socket. The stub of the seam is replaced; `roomsFor`, `paneRooms`, `emitGlow`, `emitPane`, `emitWindowComplete`, `emitLamps` do not change.
- [ ] Tests, cases by name: "a candle reaches the screen room and its site room"; "a candle does not reach a city-only socket or another site's room"; "an invalid candle throws and nothing is sent".
- Verify: `npm run test -w @lampa/api -- src/live && npm run typecheck`. Paste the summary line.
- Done when: every case passes.

#### B3-4.c On Tiger: candles (this session)

Checked in B3-1.c (the two candles and the memorial rules). The candle marks on Pulse are B3-5.b.1 and B3-6.b.1.

#### B3-4.d `GET /screen/state` carries the memorial's candles (added, Fabi's decision, hour 11; answers Cristea's hour-25 Blocked row)

**B3-4.d.1** Candles in the screen state. Subagent: `fabi-api`. Files: `apps/api/src/panes/state.ts`, `state.test.ts`.

- [ ] `export const SCREEN_CANDLES_SQL`: `interaction_events` joined to `sites`, `kind = 'candle'`, `s.is_memorial`, `ts > now() - INTERVAL '24 hours'`, giving `ts, session_id, site_id`, oldest first.
- [ ] `GET /screen/state` runs it with `WINDOWS_SQL` and `COLOURS_TODAY_SQL` (one `Promise.all`); `toScreenState` gains the candle rows and sets `candles`, each `{ id: candleId(ts, session_id), siteId: site_id, litAt: ts.toISOString() }` with `candleId` from `../events/candles.js`, through `ScreenState.parse`. A failing query answers 503 as now. The session never leaves the server.
- [ ] Tests, cases by name: "screen state lists memorial candles as CandleMessage"; "a screen candle id does not contain the session"; "SCREEN_CANDLES_SQL reads only memorial sites in the last 24 hours"; "no candle gives candles []"; the existing cases keep passing.
- Verify: `npm run test -w @lampa/api -- src/panes && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with `s.is_memorial` removed from the SQL the memorial case fails (this session checks, then restores).

### B3-8 Talk-turn cap (carried from Build 1)

#### B3-8.a A visitor's talk turns count at most 5 per site in 10 minutes

**B3-8.a.1** The cap. Subagent: `fabi-api`. Files: `apps/api/src/events/router.ts`, `router.test.ts`, `apps/api/src/events/talk.ts`, `talk.test.ts`.

- [ ] `talk.ts`: `export const TALK_TURNS_MAX = 5;` `export const TALK_WINDOW_MS = 600_000;` `export const TALK_COUNT_SQL`: per site, the visitor's `talk_turn` rows with `session_id = $1` and `ts > $2` (now minus the window), as `site_id, count(*)::int`. `export function capTalkTurns(rows, counts: Map<string, number>)`: rows kept in batch order; a `talk_turn` row at a site is kept while that site's count plus the turns already kept from this batch is under `TALK_TURNS_MAX`; every other kind passes untouched (Fabi's decision, hour 10).
- [ ] `router.ts`: when the batch has a `talk_turn`, `TALK_COUNT_SQL` runs before the insert and `capTalkTurns` filters the rows; a dropped turn is not stored and not counted in `accepted`. A batch with no `talk_turn` runs no extra query. A failing count query answers 503 `unavailable` like a failing insert.
- [ ] Tests, cases by name. `talk.test.ts`: "five turns in a batch are kept, the sixth dropped"; "turns already stored in the window count"; "the cap is per site"; "other kinds pass untouched"; "order is kept". `router.test.ts`: "a sixth talk_turn in 10 minutes is not stored"; "a batch with no talk_turn runs one query"; "a failing count query answers 503".
- Verify: `npm run test -w @lampa/api -- src/events && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with `TALK_TURNS_MAX` set to 6 at least one case fails (this session checks, then restores).

### B3-9 Simulator `--lamps` and `--candles` (no plan row, Fabi's decision, hour 10)

#### B3-9.a The simulator raises lamps and lights candles

**B3-9.a.1** Two flags. Subagent: `fabi-realtime`. Files: `scripts/simulate-crowd.ts`.

- [ ] `--lamps` (boolean, default off): each session also sends one `lamp` event at its site at its start and every 60 000 ms after, in its own `POST /events` batch, until `--seconds` have passed. The 2 s `wake` and pane loop does not change.
- [ ] `--candles <n>` (non-negative integer, default 0): the first session that is created also sends `n` `candle` events at the memorial site of `sites` (`is_memorial`), one every 2000 ms from its start, each in its own batch, stopping at `--seconds`. A non-integer or negative value prints one line and exits 1, as the other flags do.
- [ ] The summary line gains two counts: `simulate:crowd done: <n> sessions, <n> panes, <n> windows completed, <n> events, <n> lamps, <n> candles, <n> rate limited, <n> errors`, where lamps and candles count accepted events (`accepted` 1). Everything else in the script stays as it is.
- Verify: `npx tsx scripts/simulate-crowd.ts --candles -1; echo "exit $?"` → one line and `exit 1`; `npx tsx scripts/simulate-crowd.ts --api http://localhost:1 --sessions 1 --seconds 3 --lamps --candles 1; echo "exit $?"` → the network failure line, the summary line with `0 lamps, 0 candles` and `exit 1`. Paste the lines.
- Done when: both behave as written; the live run is B3-1.c.

#### B3-live PR 1 (this session)

- [ ] After B3-1.c: `npm run typecheck && npm run build && npm test && npm run glow:check`, rebase on `origin/main`, push `fabi/b3-live`, open PR 1 listing what was verified and what waits for Patrick's Lamp and Cristea's candle points.

### B3-10 `db:migrate`, `db:seed`, migration 004 (no plan row for the scripts, Fabi's decision, hour 10)

#### B3-10.a Seam 2 is committed (this session)

- [ ] After PR 1 is open: `git switch -c fabi/b3-data` from `origin/main` (or from `fabi/b3-live` if PR 1 is not merged yet). Seam 2 of section 3, exactly as written.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines.
- Done when: the stubs compile and the existing tests pass, in one commit.

#### B3-10.b Migration 004 holds the conversations

**B3-10.b.1** Migration 004. Subagent: `fabi-sql`. Files: `db/migrations/004_conversations.sql`, `db/reset.sql`.

- [ ] `004_conversations.sql`, each statement with a one-line comment in the style of 001 to 003 (concept 9.4 columns, Fabi's decision, hour 10):
  - `CREATE TABLE conversations (ts timestamptz NOT NULL, conversation_id text NOT NULL, site_id text, session_id text, user_sub text, duration_s integer, lang text, summary text, data jsonb NOT NULL DEFAULT '{}');` with comments that `ts` is the call's start, `session_id` and `user_sub` stay null (the webhook carries no visitor), `data` holds the analysis's data collection results.
  - `SELECT create_hypertable('conversations', by_range('ts', INTERVAL '1 day'));`
  - `CREATE UNIQUE INDEX conversations_id_ts_idx ON conversations (conversation_id, ts);` with the comment that a retried webhook is stored once.
- [ ] `db/reset.sql`: `conversations` and `schema_migrations` appended to the `DROP TABLE IF EXISTS` list. Nothing else changes.
- [ ] Check the Tiger docs page for `create_hypertable` with `by_range` before writing it.
- Verify: `grep -c "create_hypertable" db/migrations/004_conversations.sql` → `1`; `grep -c "UNIQUE INDEX" db/migrations/004_conversations.sql` → `1`; `grep -c "conversations, schema_migrations" db/reset.sql` → `1`. Paste the three counts.
- Done when: the three counts match and the file is plain SQL that runs as one multi-statement query (no `BEGIN`, no psql meta-commands).

#### B3-10.c New migrations and site content reach Tiger without a wipe

**B3-10.c.1** `db:migrate` and `db:seed`. Subagent: `fabi-api`. Files: `apps/api/src/db/migrate.ts`, `migrations.ts`, `migrations.test.ts`, `seed-sites.ts`, `seed.ts`, `seed.test.ts`, `reset.ts`.

- [ ] `migrations.ts`: `export const MIGRATIONS_TABLE_SQL = "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())";` `export const BASELINE_LAST = "003_colour.sql";` `export function pending(files: string[], applied: string[]): string[]` (files not in `applied`, in name order); `export function baseline(files: string[]): string[]` (files whose name sorts at or before `BASELINE_LAST`).
- [ ] `migrate.ts` (`npm run db:migrate`): refuses to start without `DATABASE_URL` as `reset.ts` does; prints `db:migrate on <host>/<database>`; runs `MIGRATIONS_TABLE_SQL`; when `schema_migrations` is empty and `to_regclass('public.interaction_events')` is not null, records `baseline(files)` without running them and prints `baseline <name>` for each (Fabi's decision, hour 10); then each `pending` file in name order, in its own transaction with its `INSERT INTO schema_migrations`, printing `applied <name>`; ends with `db:migrate done: <n> applied`. A failing file rolls back, prints its message and exits 1. It touches no data.
- [ ] `reset.ts` (`npm run db:reset`): after running every migration, runs `MIGRATIONS_TABLE_SQL` and records every file it applied; its table list gains `conversations`, its hypertable query gains `'conversations'`; the done line reads `db:reset done: 8 tables, 3 hypertables, 5 sites` after 004.
- [ ] `seed.ts` gains `export const UPSERT_SITE`: `INSERT_SITE` with `ON CONFLICT (id) DO UPDATE SET` every column it inserts except `id`, from `EXCLUDED`. `INSERT_SITE` stays for `reset.ts`.
- [ ] `seed-sites.ts` (`npm run db:seed`): refuses to start without `DATABASE_URL`; prints `db:seed on <host>/<database>`; reads `content/sites/*.yaml` in name order with `parseSiteFile`; runs `UPSERT_SITE` for each in one transaction; writes `packages/shared/sites.json` as `reset.ts` does; prints `db:seed done: <n> sites`. It touches no other table and deletes no site (Fabi's decision, hour 10: an upsert).
- [ ] Tests, cases by name. `migrations.test.ts`: "pending lists unapplied files in name order"; "pending is empty when all are applied"; "baseline stops at 003_colour.sql"; "baseline of 001 to 004 gives 001 to 003". `seed.test.ts` adds: "UPSERT_SITE updates every inserted column but id"; "UPSERT_SITE takes the same parameters as INSERT_SITE".
- Verify: `npm run test -w @lampa/api -- src/db && npm run typecheck`. Paste the summary line.
- Done when: every case passes; the scripts run against Tiger in B3-10.d.

#### B3-10.d On Tiger: migrate and seed without a wipe (this session)

- [ ] Before: `SELECT count(*) FROM interaction_events`, `panes`, `colour_readings` → record the three counts.
- [ ] `npm run db:migrate` → `baseline 001_init.sql` to `baseline 003_colour.sql`, `applied 004_conversations.sql`, `db:migrate done: 1 applied`. Again → `db:migrate done: 0 applied`.
- [ ] `npm run db:seed && git diff --exit-code packages/shared/sites.json` → `db:seed done: 5 sites`, diff empty.
- [ ] After: the three counts are unchanged; `conversations` is in `timescaledb_information.hypertables`; `schema_migrations` lists four files.
- Verify: the lines and counts above, pasted.
- Done when: 004 is on Tiger and no row was lost. Tell Fabi: the team and Patrick can now use `npm run db:seed` (it answers Patrick's hour-9 row).

### B3-5 `GET /pulse/*`, cached 5 s (2.5 h)

#### B3-5.a Summary and interactions

**B3-5.a.1** The router, cache, summary and interactions. Subagent: `fabi-api`. Files: `apps/api/src/pulse/router.ts`, `router.test.ts`, `queries.ts`, `queries.test.ts`.

- [ ] `router.ts`: each of the five endpoints has its own `rateLimit({ windowMs: 60_000, limit: 120 })` per IP (Fabi's decision, hour 10: one `/pulse` tab polls five endpoints, 60 requests a minute), with the `shortcut:` comment; `export const PULSE_CACHE_MS = 5000;` each endpoint keeps its last good body and its time in memory and answers it while it is younger than `PULSE_CACHE_MS`, with `Cache-Control: public, max-age=5`; a failed query is not cached and answers 503 `{ "error": "unavailable" }`, logged as `pulse <name> failed: <message>`; no `db` → 503. Two requests in the same 5 s run one query.
- [ ] `GET /pulse/summary` → `PulseSummary`: `glow` = the four colour sites (`sites` from `@lampa/shared`, not memorial) with their value in `latestGlow()`, 0 when missing; `cityGlow` = their mean; `lampsToday`, `coloursToday`, `visitorsToday` from one `SUMMARY_SQL` in `queries.ts`: lamps as `STATS_SQL`; colours as `COLOURS_TODAY_SQL`; visitors = `distinct_count(rollup(visitors_hll))` of `site_activity_1m` with `bucket >= ${TODAY_START_SQL}`, every site (concept 11.2 D), 0 when there is no row.
- [ ] `GET /pulse/interactions` → `PulseInteractions`: `INTERACTIONS_SQL`, concept 11.2 D: `time_bucket_gapfill('5 minutes', bucket)`, `coalesce(sum(n), 0)` from `site_activity_1m`, `bucket > now() - INTERVAL '3 hours' AND bucket <= now()`, for the four colour sites only (`site_id = ANY($1)`), every site present even with no row, points in time order. `toInteractions(rows, siteIds)` builds the body.
- [ ] Tests, cases by name. `queries.test.ts`: "toInteractions gives every site with its points in order"; "a site with no rows gets its gap-filled zeros"; "INTERACTIONS_SQL gap-fills 5 minutes over 3 hours"; "SUMMARY_SQL counts visitors with distinct_count since local midnight". `router.test.ts`: "summary leaves the Cathedral out of glow"; "cityGlow is the mean of the four sites"; "a missing glow counts as 0"; "a second request within 5 s runs no query"; "a request after 5 s runs the query again"; "a failing query answers 503 and is not cached"; "no db answers 503"; "Cache-Control is public, max-age=5"; "no token is needed"; "the 121st summary request in a minute answers 429 and interactions still answers 200".
- Verify: `npm run test -w @lampa/api -- src/pulse && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with the cache age check removed the "second request" case fails (this session checks, then restores).

#### B3-5.b Colour clock, languages, candles

**B3-5.b.1** Three more endpoints. Subagent: `fabi-api`. Files: `apps/api/src/pulse/router.ts`, `router.test.ts`, `queries.ts`, `queries.test.ts`, `colour.ts`, `colour.test.ts`.

- [ ] `colour.ts`: `export const CLOCK_SATURATION = 0.8;` (Fabi's decision, hour 10) and `hslToHex(h, s, l)` (degrees, 0 to 1, 0 to 1 → lowercase `#rrggbb`, the standard HSL to RGB conversion with each channel rounded).
- [ ] `GET /pulse/colour-clock` → `PulseColourClock`: `COLOUR_CLOCK_SQL`, concept 11.2 E: per local hour of day (`Europe/Bucharest`) over the last 30 days of `colour_1h`, `mean_hue` from `atan2(sum(hue_sin), sum(hue_cos))`, `avg(lightness)` weighted by `panes`, `sum(panes)`, every site but the Gallery (`site_id <> 'gallery'`). `toColourClock(rows, now)`: 24 entries, hours 0 to 23; an hour with panes gets `hslToHex(mean_hue, CLOCK_SATURATION, lightness)`, one without gets `hex` null and `panes` 0; `currentHour` is the local hour of `now`.
- [ ] `GET /pulse/languages` → `PulseLanguages`: `LANGUAGES_SQL`: `conversations` since `${TODAY_START_SQL}`, grouped by `lang`, most first, then by `lang`. (The Cathedral has no persona, so no conversation is ever at it.)
- [ ] `GET /pulse/candles` → `PulseCandles`: `CANDLES_SQL`: `interaction_events` with `kind = 'candle'`, `ts > now() - INTERVAL '24 hours'`, at a site with `is_memorial`, giving `ts, session_id`, oldest first; each becomes `{ id: candleId(ts, session_id), at }` (`../events/candles.js`). The session never leaves the server. If `SCREEN_CANDLES_SQL` (B3-4.d.1, `../panes/state.js`) is on the branch, `CANDLES_SQL` is that constant imported, not a copy.
- [ ] Tests, cases by name. `colour.test.ts`: "hslToHex of 0, 1, 0.5 is #ff0000"; "hslToHex of 240, 1, 0.5 is #0000ff". `queries.test.ts`: "toColourClock gives 24 hours"; "an hour with no panes has hex null and 0 panes"; "the hex uses saturation 0.8 and the hour's lightness"; "currentHour is the local hour in Timișoara"; "COLOUR_CLOCK_SQL averages hue as a vector"; "COLOUR_CLOCK_SQL leaves the Gallery out". `router.test.ts`: "languages answers most first"; "candles answer ids and times, never a session"; "candles reads only memorial sites"; "each endpoint keeps its own cache".
- Verify: `npm run test -w @lampa/api -- src/pulse && npm run typecheck`. Paste the summary line.
- Done when: every case passes.

#### B3-5.c On Tiger: the five endpoints (this session)

- [ ] Local API on Tiger after B3-1.c, with `npm run simulate:crowd -- --sessions 8 --seconds 60 --lamps --candles 2` running. Each of the five endpoints → 200 and its body parses with its schema; `summary.glow` has the four colour sites and no `cathedral`; `lampsToday` equals `litToday` of the last `lamps` message; `coloursToday` equals `GET /screen/state`'s; `visitorsToday` ≥ 8; `interactions` has four sites with 36 or 37 points each; the colour clock's current hour has a hex and its panes ≥ the panes of this run; `candles` lists at least the 2 new ids with no session; `languages` → 200 with an empty list (no conversation is stored before B3-7).
- [ ] Two requests to `/pulse/summary` within a second → the same body; `Cache-Control: public, max-age=5`.
- Verify: the status lines, the checks above and the summary body, pasted.
- Done when: every line holds on Tiger.

### B3-7 Post-call webhook with HMAC check into `conversations` (0.5 h, first to cut)

#### B3-7.a A signed post-call body becomes one `conversations` row

**B3-7.a.1** `POST /webhooks/elevenlabs`. Subagent: `fabi-api`. Files: `apps/api/src/webhooks/elevenlabs.ts`, `elevenlabs.test.ts`.

- [ ] `createElevenLabsWebhookRouter({ db, now })` mounts `POST /webhooks/elevenlabs` with `express.raw({ type: "application/json", limit: "1mb" })` (Fabi's decision, hour 10), no rate limiter (Fabi's decision, hour 10), no token.
- [ ] `export const SIGNATURE_TOLERANCE_S = 1800;` `export function verifySignature(header: string | undefined, rawBody: Buffer, secret: string, nowMs: number): boolean`: split the header on `,`; `t` from the part starting `t=`, every part starting `v0=` is a candidate; expected = `"v0=" + hmac_sha256_hex(secret, t + "." + rawBody)`; true when `t` is a number, `nowMs / 1000 - t <= SIGNATURE_TOLERANCE_S`, and one candidate equals expected under `crypto.timingSafeEqual` on equal-length buffers. As the official SDK, a future `t` is not rejected.
- [ ] Order: `process.env.ELEVENLABS_WEBHOOK_SECRET` read per request, unset or empty → 503 `{ "error": "unavailable" }`; the signature fails → 401 `{ "error": "unauthorized" }`; the body is not JSON → 400 `{ "error": "invalid_body" }`; `type` other than `post_call_transcription` → 200 `{ "ok": true }` and nothing stored; a `post_call_transcription` that fails its Zod schema → 400 `invalid_body`; no `db` → 503.
- [ ] Zod schema in the file (only the fields used): `data.conversation_id` string; `data.metadata.start_time_unix_secs` number; `data.metadata.call_duration_secs` number, optional; `data.analysis.transcript_summary` string, optional; `data.analysis.data_collection_results` record, optional; `data.conversation_initiation_client_data.dynamic_variables.site_id` string, optional; `data.conversation_initiation_client_data.conversation_config_override.agent.language` string, optional. Unknown keys are allowed.
- [ ] `export const INSERT_CONVERSATION`: `INSERT INTO conversations (ts, conversation_id, site_id, duration_s, lang, summary, data) VALUES (to_timestamp($1), $2, $3, $4, $5, $6, $7) ON CONFLICT (conversation_id, ts) DO NOTHING`, with `site_id` null when missing, `duration_s` rounded, `lang` the override language or `en`, `summary` or null, `data` the data collection results or `{}` (Fabi's decision, hour 10). The transcript is not stored. 200 `{ "ok": true }` after the insert; a failing insert → 503 logged as `webhook failed: <message>`. The secret, the headers and the body are never logged.
- [ ] Tests, with bodies signed in the test, cases by name: "a signed post_call_transcription stores one row and answers 200"; "the row has the start time, site, duration, language, summary and data"; "a missing language stores en"; "a retried body is inserted with ON CONFLICT DO NOTHING"; "no secret answers 503"; "a missing signature answers 401"; "a wrong signature answers 401"; "a signature older than 30 minutes answers 401"; "a second v0 that matches is accepted"; "another type answers 200 and stores nothing"; "a body that is not JSON answers 400"; "no db answers 503"; "the route works while express.json is mounted after it" (through `createApp`).
- Verify: `npm run test -w @lampa/api -- src/webhooks && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with the compare replaced by `return true` the two wrong-signature cases fail (this session checks, then restores).

#### B3-7.b On Tiger: a signed body lands (this session)

- [ ] A random secret made in the shell (`openssl rand -hex 32` into a variable, never printed) and passed only to this run of the local API on Tiger as `ELEVENLABS_WEBHOOK_SECRET`. A test body (`type` `post_call_transcription`, `conversation_id` `b3-check-1`, `site_id` `unirii`, language `ro`, start now) signed with the local secret read into a shell variable, never printed: `curl` → `{"ok":true}` 200; again → 200 and still one row; with a wrong signature → 401. The row: `site_id` `unirii`, `lang` `ro`. Then `DELETE FROM conversations WHERE conversation_id = 'b3-check-1'`.
- Verify: the three status lines and the row, pasted.
- Done when: the three answers match. The real check is at a live Talk (Fabi's check, B3-last).

#### B3-data PR 2 (this session)

- [ ] After B3-7.b (or after B3-5.c if B3-7 is cut): `npm run typecheck && npm run build && npm test && npm run glow:check`, rebase on `origin/main`, push `fabi/b3-data`, open PR 2 listing what was verified, that `npm run db:migrate` has already run 004 on Tiger, and what waits for a live Talk.

### B3-6 `/pulse` page: charts and the colour clock ring (2 h, plus 0.75 h of styling, `DESIGN.md` item 12)

#### B3-6.a Seam 3 is committed (this session)

Runs right after B3-10.a, so `fabi-web` works while `fabi-api` and `fabi-sql` work in the main tree.

- [ ] Seam 3 of section 3, in `../Lampa-b3-pulse` (a git worktree of this repository on `fabi/b3-pulse-page`, with its own `node_modules`).
- Verify, in `../Lampa-b3-pulse`: `npm run typecheck && npm run build && npm test`. Paste the summary lines.
- Done when: `recharts` 3.10.1 is in `apps/web/package.json` (exact) and the lock file, the stub renders, the tests pass, in one commit.

#### B3-6.b Each card fetches, keeps and shows its data

**B3-6.b.1** Data hooks and cards. Subagent: `fabi-web`. Files: `apps/web/src/pulse/**`.

- [ ] `export const PULSE_POLL_MS = 5000;` `export const STALE_MS = 30_000;` A pure `fetchCard<T>(path, schema, deps: { fetch })`: plain `fetch(API_URL + path)` (no token, no session), `schema.parse` of the body, resolves `{ ok: true, data }` or `{ ok: false }`. A pure `nextCard(prev, result, now)`: on success `{ data, error: false, updatedAt: now }`; on failure the last `data` and `updatedAt` kept with `error: true`. A pure `cardStatus(card, now)`: `loading` (no data, no error), `error` (error and no data, or error now), `stale` (data with `now - updatedAt > STALE_MS`), `live`. `usePulse<T>(path, schema)` only wires these to a 5000 ms interval and stops on unmount. The tests run without a DOM: pure functions directly, markup through `renderToStaticMarkup`, as `apps/web/src/components/components.test.tsx` does.
- [ ] `ChartCard` (6.19): title, body, one-sentence summary, a visually hidden `<table>` with the same data (except CandleMarks); states loading (final height, title, 1px `--line` baseline, "Loading" in `--text-3`), empty ("No {thing} yet today."), error ("Could not load. Trying again in 5 s."), stale (`updatedAt` over 30 s: "Updated {n} s ago" in `--text-3`).
- [ ] `ColourClock` (6.19), SVG: 24 segments, 0 at 12 o'clock clockwise, ring thickness 18% of the radius, 2px `--bg` gaps; filled with each hour's `hex`; `hex` null → 1.5px `--line-strong` outline; labels 0, 6, 12, 18 outside in `--type-meta` `--text-3`; centre disk of 30% radius in the current hour's colour with "Now, {hour}:00"; the current hour's segment with a 3px `--text` outline; the pane count of the current hour under the ring in `--type-meta`; the hidden table lists hour, hex and panes. Summary: "The most colourful hour is {h}:00, with {n} panes." (the hour with most panes); empty "No colours yet today." (Fabi's decision, hour 10).
- [ ] `InteractionsCard`: four small multiples, 2 × 2, one per colour site, site name above each, shared y domain from 0 to the highest point, Recharts `LineChart` with a 2px `--lamp` line, no dots, no area, horizontal 1px `--line` gridlines only, ticks 15px `--text-3`, tooltip `--surface-2` radius `--radius-s` `--type-meta`, no legend. Summary (DESIGN 6.19): "Busiest now: {Site}, {n} interactions in the last 5 minutes."; empty "No interactions yet today."
- [ ] `GlowBars` (glow by site) and `LanguageBars`: HTML bars ported from `.bars` (`--lamp` fill for glow with value labels in %, `--text-2` fill for languages with counts). Glow summary: "Brightest now: {Site}, {p}%." Languages summary: "Most spoken: {Language}, {n} conversations today."; empty "No conversations yet today."; labels Română, English, Magyar, Deutsch, Srpski for `ro`, `en`, `hu`, `de`, `sr`, any other code shown as it is (Fabi's decision, hour 10).
- [ ] `CandleMarks` (6.19): a 1px `--line` across the card, "Earlier today" left and "Now" right in `--type-meta` `--text-3`; each candle a 6px `--lamp-white` circle at 60% opacity at its time (left 24 h ago, right now), jittered within ±8px vertically by a hash of its `id`; no number, no axis value, no tooltip, no count, no hidden table. Summary "Candles have been lit here today." or "No candles yet today."; loading and error as ChartCard without numbers.
- [ ] Site names from `sites` in `@lampa/shared`; the Cathedral never appears in a bar, line, number or table.
- [ ] Tests (Vitest, the style of `apps/web/src/screen/*.test.ts`), cases by name: "nextCard keeps the last data on a failed request"; "a body that fails the schema is not ok"; "cardStatus is stale after 30 s"; "cardStatus is loading before the first answer"; "segment angles start at 12 o'clock and run clockwise"; "an hour with no panes is drawn as an outline"; "the colour clock summary names the hour with most panes"; "the interactions summary names the busiest site in the last 5 minutes"; "a candle's x is its time between 24 h ago and now"; "a candle's jitter is the same for the same id and within 8 px"; "no candle text contains a digit"; "the glow bars leave the Cathedral out"; "a language code becomes its own name".
- Verify: `npm run test -w @lampa/web -- src/pulse && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes.

#### B3-6.c The page reads as `DESIGN.md` 7.14

**B3-6.c.1** Layout, header, numbers, styling. Subagent: `fabi-web`. Files: `apps/web/src/pulse/**`.

- [ ] `PulsePage`: header "Pulse of Timișoara" (`--type-title`) and "Live. Updated every 5 seconds." (`--type-meta` `--text-2`); when no `/pulse/*` response has arrived for 30 s, the line reads "Not updating. Last update {HH:mm}." in `--text-2`, the time in Europe/Bucharest (Fabi's decision, hour 10), from a pure `headerLine(lastResponseAt, now)`.
- [ ] Desk (1024px and up): page padding `--space-xl`, two columns 7fr / 5fr, gap `--space-l`. Left: ColourClock card "Colours of the city, by hour"; "Interactions per 5 minutes, last 3 hours"; "Candles at the Metropolitan Cathedral". Right: "City glow now" (`--type-numeral` value in % and `GlowMark` from `../phone/GlowMark` with `siteName` "Timișoara", the city of the page header, and `connected` true while the summary is not stale); "Glow by site"; "Lamps lit today" (6.13 L dark: "{n} / 731" with the value in `--lamp` and "/ 731" in `--text-2`, label "lamps lit today", a 4px `--surface-2` track with a `--lamp` fill of n / 731, "... / 731" while loading); "Colours caught today" and "Unique visitors today" (`--type-numeral` with their labels); "Languages spoken to the monuments".
- [ ] Phone (under 1024px): one column in the order ColourClock, City glow, Lamps, Glow by site, Colours, Visitors, Interactions, Candles, Languages; ColourClock `min(84vw, 360px)`; 16px side gutter, no horizontal scroll.
- [ ] Styles in CSS Modules under `apps/web/src/pulse/`, ported from the 6.19 block of `design/css/components.css` with a comment naming the source, as `Ticker.module.css` does; tokens only; `prefers-reduced-motion` as `DESIGN.md` 5.6.
- [ ] Accessibility (`DESIGN.md` 8): one `h1`, card titles as `h2`, each chart with its hidden table, numbers not announced as live regions.
- [ ] Test cases by name: "the page renders every card title" (`renderToStaticMarkup`); "headerLine shows Not updating after 30 s without a response, with HH:mm in Timișoara"; "the lamps value shows n / 731".
- Verify: `npm run test -w @lampa/web -- src/pulse && npm run typecheck -w @lampa/web && npm run build -w @lampa/web`. Paste the summary lines.
- Done when: every case passes and the build succeeds.

#### B3-6.d In the laptop's browser (this session)

- [ ] The local API on Tiger from the main tree (on `fabi/b3-data`, after B3-5.c), `npm run dev -w @lampa/web` from `../Lampa-b3-pulse`, and `npm run simulate:crowd -- --sessions 8 --seconds 120 --lamps --candles 3` running. `/pulse` at 1280px and at 390px wide: every card leaves "Loading" within 5 s; the numbers move between polls; the colour clock's current hour is filled; candles appear as dots with no number anywhere in the card; no `cathedral` in any bar, line or table; no horizontal scroll at 390px. Stop the API → each card shows "Could not load. Trying again in 5 s." and, after 30 s, the header shows "Not updating. Last update {time}."; start it again → the cards recover.
- [ ] Then, in `../Lampa-b3-pulse`: rebase on `origin/main` (or on `fabi/b3-data` if PR 2 is not merged), `npm run typecheck && npm run build && npm test`, push `fabi/b3-pulse-page`, open PR 3 listing what was verified and that the phone check is Ionut's.
- Verify: the observations above, written down, and the summary lines.
- Done when: every line holds and PR 3 is open.

### B3-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch from `origin/main`, `npm ci && npm run typecheck && npm run build && npm test && npm run glow:check` green on it; then delete it, and remove the worktree with `git worktree remove ../Lampa-b3-pulse` once PR 3 is pushed.
- [ ] Secrets: `git log --all --name-only` shows no `.env`; `git grep -nE "postgres://|AGENT_TOOL_SECRET=.|ELEVENLABS_WEBHOOK_SECRET=."` outside `*.md` and `.env.example` → nothing; `npm run build -w @lampa/web` then `grep -rl "WEBHOOK_SECRET\|AGENT_TOOL" apps/web/dist` → nothing.
- [ ] Push each branch and open its PR, in this order: `fabi/b3-live` (PR 1), `fabi/b3-data` (PR 2), `fabi/b3-pulse-page` (PR 3). Each PR lists what was verified and what waits for a phone or a teammate.
- [ ] After Cristea merges and Render and Vercel deploy: `GET /time` → 200 `TimeNow`; the five `GET /pulse/*` → 200 with their schemas; `POST /webhooks/elevenlabs` unsigned → 401 (or 503 if `ELEVENLABS_WEBHOOK_SECRET` is not on Render yet); a `/live` listener gets `lamps` within 5 s; deployed `/pulse` loads.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists `LampsMessage` and `lamps` on `/live`, `CandleMessage` and `candle` on `/live`, the memorial rules of `POST /events`, the talk cap, `GET /time` and `getClockOffset`, `simulate:crowd --lamps --candles`, `npm run db:migrate`, `npm run db:seed`, `conversations`, `POST /webhooks/elevenlabs`, the five `GET /pulse/*`, the `/pulse` page.
- [ ] Fabi's checks, listed and not claimed:
  - Fabi takes the contract additions to the team (`LampsMessage`, `CandleMessage`, `TimeNow`, the five Pulse schemas) and tells Patrick (`lamps`, `getClockOffset`, `npm run db:seed`), Cristea (`lamps.litToday` for "Lamps lit today", `candle` and `GET /pulse/candles` for the memorial points on connect) and Ionut (`candle` only at the Cathedral; `/pulse` is Fabi's).
  - Fabi sets `ELEVENLABS_WEBHOOK_SECRET` on Render `lampa-api` with the secret ElevenLabs shows; Patrick sets the post-call webhook URL `https://lampa-api-b45i.onrender.com/webhooks/elevenlabs` on the agent `LAMPA monument`.
  - Lamp with Patrick: once his Lamp is on `main`, a raised phone at a site moves "Lamps lit today" on `/screen` and `/pulse`, and his presence line counts it.
  - `/pulse` on Ionut's iPhone: one column in the 7.14 order, ColourClock fits at `min(84vw, 360px)`, no horizontal scroll.
  - Live Talk at Checkpoint 2 or a rehearsal: one `conversations` row lands and "Languages spoken to the monuments" shows its language.
  - Candle with Cristea: once her memorial item is on `main`, `simulate:crowd -- --api https://lampa-api-b45i.onrender.com --sessions 1 --seconds 10 --candles 1` shows one candle point on the deployed `/screen`.
- Done when: every box is ticked or listed as Fabi's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the team accepting the contract additions (Fabi); `ELEVENLABS_WEBHOOK_SECRET` on Render and the webhook URL in ElevenLabs (Fabi, Patrick); the four open "tell the team" rows of hours 5, 7, 9 and 9; Checkpoint 2 line 1 with Ionut and Cristea.
- **Not finished at hour 18:** each ID, what is left, and its place in the cut order.
- **Phone checks for Fabi:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 3: Echo, navigation, Lamp, Pulse, sign-in

- Every socket gets `lamps` (lamp events today city-wide, target 731, and per lamp site the distinct sessions lighting in the last 90 s) every 5 s, after a stored event, and at once on connect.
- `POST /events` skips a `lamp` at a memorial and a `candle` elsewhere, caps talk turns at 5 per visitor per site in 10 minutes, and sends each stored candle as `candle` to `screen` and `site:<id>` with an id that hides the session.
- `GET /time` answers the server clock, and `getClockOffset()` gives a phone its offset from 5 pings.
- `npm run db:migrate` applied 004 on Tiger without a wipe; `npm run db:seed` refreshes the sites without touching events.
- `POST /webhooks/elevenlabs` stores a signed post-call body once in `conversations` and refuses an unsigned one (or is cut, first in the cut order).
- The five `GET /pulse/*` endpoints answer from a 5 s cache, the Cathedral out of every number, candles as times with no count.
- `/pulse` shows the colour clock, glow, lamps, colours, visitors, interactions, candles and languages as `DESIGN.md` 7.14 and 6.19 lay them out, on desk and phone.
- `simulate:crowd --lamps --candles` drives lamps and candles without phones.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `fabi/GLOSSARY.md` matches the state of the branch.

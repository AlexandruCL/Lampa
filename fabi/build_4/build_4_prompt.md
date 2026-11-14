# Prompt: Fabi's Build 4: demo extras (Fabi, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 27 (2026-11-14 16:50 +0200). Implementation not started.**

You are implementing Fabi's part of Build 4: demo extras (hours 37 to 40 in the plan; Fabi runs it from hour 27 to hour 30, 2026-11-14 16:21 to 19:21 +0200) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *Three hours, so each person gets one main item. Anything not working at hour 40 is cut and the demo uses the fallback in the last column.*

Checkpoint this block must pass (the Freeze lines this lane affects, word for word): *Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived.* *`/screen` runs 30 minutes with sound and no reload, while `simulate-crowd` sends about 2,000 visitors.*

And from plan section 10 (Done), word for word: *No secrets in the repo or the bundle. `npm run db:reset` rebuilds schema and seed.*

The demo lines this lane affects (concept 10.4): *0:00 Hook: "On 12 November 1884, 731 lamps..." The Living Map is dark; the rose windows are dim.* *0:50 ... their pane completes the window (pre-filled to 47/48), which rings through the room and flares on the screen.* *2:00 A teammate starts the simulated crowd: lamps fill, the counter reaches 731, every phone and the screen play the 1884 moment.* *2:20 Pulse dashboard: colour clock, languages, glow, all continuous aggregates on Tiger.*

## 0. Ground rules

- **Fabi takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Fabi, with your recommendation. Nothing uses the recommendation until Fabi answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 30 (2026-11-14 19:21 +0200).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Fabi: carrying on, cutting (plan section 7) or moving it is their decision. Already decided for a late block (Fabi, hour 27): first the `EXPLAIN ANALYZE` numbers go (B4-3.c; the plan's fallback "policies only"), then the finale falls back to the plan's "broadcast 'start now' without sync". `demo:reset` is never cut ("not optional, do this first").
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Fabi, who takes it to the team. This block adds `FinaleMessage` as written in the seam of section 3 and nothing else (Fabi's decision, hour 27). Nothing already in the contract changes.
- The server sets event weights. The client never sends one. Weights stay as in `apps/api/src/events/weights.ts`. The only rows written with another weight are the 721 `lamp` rows of `demo:reset`, at weight 0, written by the server script (Fabi's decision, hour 27).
- No library beyond plan section 3 without Fabi's approval. Approved: none new in this block. Already installed and used: `pg` 8.23.1, `zod` 4.6.7, `express` 5.3.0, `express-rate-limit` 8.7.4, `socket.io` 4.8.4, `socket.io-client` 4.8.4, `yaml` 2.9.1, `tsx` 4.23.15, `vitest` 5.1.0; `node:assert` is a Node built-in.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `DATABASE_URL`, `SESSION_SECRET`, `AGENT_TOOL_SECRET` and `ELEVENLABS_WEBHOOK_SECRET` are never printed, logged, pasted into the chat or written into any tracked file. A session token fetched for a check is kept in a shell variable and not printed.
- `main` deploys by itself. Branches (Fabi's decision, hour 27): `fabi/live-published-sites` (already checked out, holds B4-4; its PR first); the docs commit (this prompt, the glossary, the plan update) goes straight to `main` first, in B4-0; `fabi/b4-demo` holds B4-1 and B4-2, from `origin/main` if the B4-4 PR is merged, otherwise from `fabi/live-published-sites`; `fabi/b4-tiger` holds B4-3, from `origin/main`, in its own git worktree `../Lampa-b4-tiger`. PRs in that order, called by their GitHub number. One small PR per branch. Open it only after the verify commands pass. Fabi or Cristea merges. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. This block makes no ElevenLabs call.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. In this block: `demo:reset` writes no `lamp` row at the Cathedral and keeps its candles' history only as far as events are kept (it deletes every event, candles included); the `finale` message goes to every socket and memorial views ignore it on the client (`DESIGN.md` 7.11, Patrick's and Ionut's code, not this lane); `get_site_stats` and `get_recent_echo` keep answering 404 for a memorial.
- Screens follow `DESIGN.md` and the tokens in `design/css/`. This block has no screen.
- Write in `fabi/` only. Other members' folders are read-only.
- **Keep `fabi/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Fabi a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work. A Done line's Commit cell is filled in the next commit, as in earlier blocks.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm run db:reset` is not run in this block. Migration 005 reaches Tiger with `npm run db:migrate` (B4-3.b). `npm run demo:reset` wipes the shared database's live state: it runs on Tiger only in B4-last, after the team heads-up, and only from this session (Fabi's decision, hour 27). Only this session runs `db:migrate`, `demo:reset`, `glow:check`, `simulate:crowd` and the `EXPLAIN` statements against Tiger.

## 1. Current state (checked at hour 27, 2026-11-14 16:20 to 16:50 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Build 3 is closed for this lane: #36, #39 and #40 merged on 2026-11-13 and deployed. Still open in the glossary from Build 3: the Blocked rows of hour 12 (deployed checks after #39 and #40, `ELEVENLABS_WEBHOOK_SECRET` and the agent's webhook URL, the "tell the team" row, the team checks). They are not this block's work; B4-last re-checks the deployed ones.
- Other lanes run Build 4 already: Cristea's #46, #47, #48 (add a place, `place:reset`, new places on `/screen` and `/curate`) and Ionut's #45 (memorial view) are merged; Ionut's #50 (ro/en dictionary) and #52 (new-place pages) are open and touch only `apps/web/` and `ionut/`. Other glossaries label hours on the plan's clock (Cristea's "hour 37" is real hour 25 to 27); this glossary keeps real hours.
- Local: branch `fabi/live-published-sites` at `dfb7c20`, `origin/main` one commit ahead (`c839978`, Patrick's glossary only). Uncommitted docs written at hour 27 with this prompt: `fabi/build_4/build_4_prompt.md`, `fabi/GLOSSARY.md` (Decisions and Changes of hour 27), `IMPLEMENTATION_PLAN.md` (the hour-27 row in sections 6 and 11). Uncommitted code, not touched by this prompt: `apps/api/src/live/socket.ts` (`PUBLISHED_IDS_SQL`; a socket asking for `site:<id>` is checked against `SELECT id FROM sites WHERE status = 'published'`; a failed query falls back to the five seeded ids and logs `live rooms query failed: <message>`; a socket that left during the query joins nothing), `socket.test.ts` (three cases under "site rooms from the sites table"), `index.ts` (passes `db` to `attachLive`). This answers Cristea's hour-37 Blocked row (`/live` admits only bundled ids). It is B4-4.a.
- Carried over into this block: `site_activity_1h` (moved from Build 3 with the `EXPLAIN ANALYZE` row, Decisions hour 10; B4-3.a); "`glow_k` looked at again at `demo:reset`" (Decisions hour 6): it stays 5 (Fabi's decision, hour 27).
- Requests from other lanes (no plan row before this block; B4-4, Fabi's decision, hour 27): Cristea, hour 37 (her clock): `/live` rooms for published places, and `POST /tools/*` checks bundled ids (`apps/api/src/tools/router.ts:46`); "say what `demo:reset` does with `sites`" (answered here: added places go back to draft). Ionut, hour 37 (his clock): `GET /sites/:id` sends `r.name[lang]` with no English fallback (`apps/api/src/sites/router.ts:65`), so a new place with no Romanian name answers 500 to a Romanian phone.
- Exists and this block builds on it:
  - `packages/shared/src/contract.ts`: `SocketMessage` includes `finale` with no payload schema; `LAMP_TARGET = 731`; `LampsMessage { litToday, target, sites }`; `TimeNow { now }`; `PLACE_ID`.
  - `apps/api/src/seam.ts`: `Live` (`emitGlow`, `emitPane`, `emitWindowComplete`, `emit`, `emitLamps`, `emitCandle`, `close`), `GlowLoop` (`tick`, `nudge`, `latest`, `latestLamps`, `stop`).
  - `apps/api/src/glow/loop.ts`: `startGlowLoop({ db, emit, emitLamps?, intervalMs?, now? })`; each tick runs the glow query, then `LAMPS_SQL` and `toLampsMessage`; a failed lamps query logs `lamps tick failed: ...` and keeps the last message. `glow/lamps.ts`: `LAMPS_SQL` (lit today = `lamp` rows since `TODAY_START_SQL`, counted, not weighted; lamp sites = published, not memorial, `'lamp' = ANY(interactions)`). `glow/glow.ts`: `glowSql(sites, activity)` (tau 21600 s, 24 h window, `$1` = now).
  - `apps/api/src/live/socket.ts`: `emitLamps` sends to every socket with `live.emit`, after `LampsMessage.parse`.
  - `apps/api/src/index.ts`: builds the pool, `createApp`, `attachLive`, `startGlowLoop({ db, emit: live.emitGlow, emitLamps: live.emitLamps })`.
  - `apps/api/src/db/`: `pool.ts` (`createPool`, `asDb`, `asTx`), `today.ts` (`TODAY_START_SQL`), `migrate.ts` and `migrations.ts` (each pending file in its own transaction, recorded in `schema_migrations`), `reset.ts`, `seed-sites.ts`. `apps/api/src/pulse/colour.ts`: `hslToHex(h, s, l)` (hue in degrees). `apps/api/src/places/reset.ts` (Cristea's): `RESET_PLACE` sets one added place to draft.
  - Tables (`db/migrations/001` to `004`): `sites`, `windows` (`site_id` null = Gallery, `slots`, `started_at`, `completed_at`), `panes` (`window_id`, `slot`, `hue`, `saturation`, `lightness`, `hex`, `author_sub`, `anon_id`, `echo_id` → `echoes`, `caught_at`, unique `(window_id, slot)`), `echoes`, `blobs` (echo audio `echo-<uuid>`, place audio `site-...`), `interaction_events` (`ts`, `session_id`, `user_sub`, `site_id`, `kind`, `weight`, `lang`, `mode`, `props`), `colour_readings`, `conversations`, `schema_migrations`. Aggregates: `site_activity_1m` (real-time, policy 2 h / 1 min / 1 min), `colour_1h` (real-time, policy 3 h / 1 h / 30 min). `db/reset.sql` drops both aggregates and nine tables.
  - `scripts/simulate-crowd.ts`: `--lamps` sends one `lamp` per session every 60 s (`LAMP_EVERY_MS`), the first at session start; at most 10 sessions per 61 s.
- Tiger at 16:30: TimescaleDB 2.32.0, Toolkit 1.26.0. Rows: 2,040 events (first at 2026-11-13 20:01 UTC), 300 panes, 9 windows, 300 colour readings, 0 conversations, 3 echoes, 1 blob; the five seeded sites published, no added place; 38 lamps today; no hypertable has compression enabled.
- Does not exist yet, and the subtask that adds it: `FinaleMessage` (B4-2.a); `emitFinale` and the trigger (B4-2.b.1); `npm run demo:reset` and `apps/api/src/db/demo-reset.ts` (B4-1.a.1); `db/migrations/005_policies.sql` and `site_activity_1h` (B4-3.a.1); `db/explain.sql` (B4-3.a.1); `fabi/build_4/tiger_numbers.md` (B4-3.c). No README exists at the root; the team writes it at hour 44 and copies the numbers file.
- "Needs from others" (plan section 11, Fabi): only `requireVisitor`, landed in Build 1. Who waits on this block: Patrick's 1884 finale cue (Build 4; no `patrick/build_4/` yet; `apps/web/src/lamp/LightSurface.tsx` only mentions the finale) needs `finale` with `startAt`; Cristea's `/screen` finale (DESIGN 7.13) the same; everyone's rehearsals need `demo:reset`.
- Scripts the verify commands use (root `package.json`): `typecheck`, `build`, `test`, `db:migrate`, `glow:check`, `simulate:crowd`; `apps/api`: `test`, `typecheck`, `dev`, `start`, `db:migrate`, `place:reset`. `demo:reset` is added in B4-1.a.1. There is no `psql` on this machine: SQL is run on Tiger with a throwaway `tsx` script in the scratchpad that uses `pg`, as at hour 27.
- Deployed at 16:25: API `https://lampa-api-b45i.onrender.com/health` → `{"ok":true}`, `/pulse/summary` → 200. Web `https://lampa-timisoara.vercel.app` (Cristea turned off Vercel git deploys, `0fee884`).
- Devices: Fabi has a laptop only (Decisions, hour 6). The finale on phones and `/screen` is checked with Patrick and Cristea at a rehearsal (Fabi's decision, hour 27).

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 4, Fabi rows, and the Freeze after it | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Fabi table and "Needs from others" | All |
| `IMPLEMENTATION_PLAN.md` | Section 7, cut order | B4-2, B4-3 |
| `fabi/GLOSSARY.md` | Whole file | All |
| `DESIGN.md` | 7.12 (phone finale) and the finale row of 7.13 | B4-2 |
| `packages/shared/src/contract.ts` | `SocketMessage`, `LAMP_TARGET`, `LampsMessage`, `TimeNow`, `SiteDetail`, `PLACE_ID` | B4-1, B4-2, B4-4 |
| `packages/shared/src/sites.ts`, `sites.json` | the five seeded ids | B4-1, B4-4 |
| `apps/api/src/seam.ts`, `index.ts` | whole files | B4-2, B4-4 |
| `apps/api/src/glow/loop.ts`, `loop.test.ts`, `lamps.ts`, `glow.ts` | whole files | B4-2, B4-3 |
| `apps/api/src/live/socket.ts`, `socket.test.ts` | whole files | B4-2, B4-4 |
| `apps/api/src/sites/router.ts` and its test | `GET /sites/:id` | B4-4 |
| `apps/api/src/tools/router.ts` and its test | `siteIdOf` | B4-4 |
| `apps/api/src/db/pool.ts`, `today.ts`, `reset.ts`, `migrate.ts`, `migrations.ts` | whole files | B4-1, B4-3 |
| `apps/api/src/pulse/colour.ts` | `hslToHex` | B4-1 |
| `apps/api/src/places/reset.ts` | `RESET_PLACE` (read only) | B4-1 |
| `db/migrations/001_init.sql` to `004_conversations.sql`, `db/reset.sql` | columns, aggregates, policies | B4-1, B4-3 |
| `scripts/simulate-crowd.ts` | `--lamps` rate | B4-1, B4-last |
| Tiger docs: hypercore / columnstore (`ALTER TABLE ... SET (timescaledb.enable_columnstore ...)`, `add_columnstore_policy`), `add_retention_policy`, hierarchical continuous aggregates, `refresh_continuous_aggregate` | the reference pages | B4-1, B4-3 |
| Concept PDF 11.2 A and B (on this machine as `LAMPA_Hackathon_Concept_Timisoara_v6.pdf`) | compression and `site_activity_1h` | B4-3 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: "`npm run demo:reset`: clean state, one window at 47 of 48, lamps just under 731" (fallback: "not optional, do this first"); section 11: "`npm run demo:reset` (do this first)" | 0.5 | B4-1.a, B4-1.b |
| Section 6: "Finale trigger at 731 lamps, using the clock offset from Build 3" (fallback: "broadcast "start now" without sync"); section 11: "Finale trigger" | 0.5 | B4-2.a, B4-2.b, B4-2.c |
| Section 6: "Compression and retention policies. `EXPLAIN ANALYZE` of raw table against aggregate, numbers into the README" (fallback: "policies only"); section 11: "Compression, retention, `EXPLAIN ANALYZE` numbers"; with `site_activity_1h` (Decisions, hour 10) | 1 | B4-3.a, B4-3.b, B4-3.c |
| Added at hour 27 (plan update, Fabi's decision): `/live` rooms for published places, English-name fallback in `GET /sites/:id`, agent tools for published places (Cristea's and Ionut's requests) | 0.25 | B4-4.a, B4-4.b, B4-4.c |
| Section 8 tests owned by Fabi | none fall in Build 4 | none |
| `DESIGN.md` section 9 items owned by Fabi | none in Build 4 (item 12 was Build 3) | none |
| Freeze: "Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived." | in B4-1, B4-2 | B4-last (rehearsal state from `demo:reset`; the run itself is the team's at the freeze) |
| Freeze: "`/screen` runs 30 minutes with sound and no reload, while `simulate-crowd` sends about 2,000 visitors." | in B4-3 | B4-3.b (policies do not block inserts); the run is the team's at the freeze |
| Section 10: "`npm run db:reset` rebuilds schema and seed." | in B4-3 | B4-3.a.1 (`db/reset.sql` drops `site_activity_1h`; `db:reset` runs migration 005) |

Total: 2.25 h of tasks in a 3 h block.

Order: B4-0 (with the docs commit), then B4-4 (the work is on disk; Cristea and Ionut wait on it), then B4-1 with B4-3.a in parallel (different branches; B4-3 in the worktree), then B4-2 (it edits `socket.ts`, `index.ts` and `seam.ts`, which B4-4.a edits, so it starts only after B4-4 is committed), then B4-3.b and B4-3.c, then B4-last.

Seam for B4-2 (this session writes it on `fabi/b4-demo` and commits it before B4-2.b.1 starts), appended to `packages/shared/src/contract.ts` after `TimeNow`:

```ts
/** `finale` on /live, to every socket: the 1884 moment starts at server time `startAt` (epoch ms; clients add their clock offset). */
export const FinaleMessage = z.object({ startAt: z.number().int() });
export type FinaleMessage = z.infer<typeof FinaleMessage>;
```

### 3.1 Subagents

Fabi asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Fabi, re-runs the checks, writes the glossary and does the first and last tasks and the steps marked "this session". It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `fabi-api` | TypeScript data layer in `apps/api`: routers, `db/` scripts, their Vitest tests | sonnet | reused from Build 3, documents and rules updated for Build 4 |
| `fabi-realtime` | Socket.IO `/live` and the glow loop, their Vitest tests | opus | reused from Build 3, documents and rules updated for Build 4 |
| `fabi-sql` | Plain SQL in `db/`: migration 005, `db/reset.sql`, `db/explain.sql` | opus | reused from Build 3, documents and rules updated for Build 4 |

`fabi-web` has no task in this block; its file is kept and not used.

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B4-4.a.1 | `fabi-realtime` | Review and finish the published-place rooms already on disk | `apps/api/src/live/socket.ts`, `socket.test.ts`, `apps/api/src/index.ts` | first, parallel with B4-4.b.1 |
| B4-4.b.1 | `fabi-api` | English-name fallback; agent tools read the sites table | `apps/api/src/sites/router.ts` and its test, `apps/api/src/tools/router.ts` and its test | parallel with B4-4.a.1 |
| B4-1.a.1 | `fabi-api` | `npm run demo:reset` | `apps/api/src/db/demo-reset.ts`, `apps/api/src/db/demo-reset.test.ts`, `apps/api/package.json`, root `package.json` | after B4-4 is committed; parallel with B4-3.a.1 |
| B4-3.a.1 | `fabi-sql` | Migration 005, `db/reset.sql`, `db/explain.sql` | `db/migrations/005_policies.sql`, `db/reset.sql`, `db/explain.sql` (in `../Lampa-b4-tiger`) | parallel with B4-1.a.1 |
| B4-2.b.1 | `fabi-realtime` | Finale trigger in the loop, `emitFinale` on `/live` | `apps/api/src/glow/loop.ts`, `loop.test.ts`, `apps/api/src/live/socket.ts`, `socket.test.ts`, `apps/api/src/seam.ts`, `apps/api/src/index.ts` | after B4-1.a.1 and the seam B4-2.a |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Fabi to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Fabi. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Fabi, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B4-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git fetch`. List local changes (the three B4-4.a code files and the three docs files of section 1); do not edit them. Do not pull onto the dirty tree.
- [ ] Docs commit first, straight to `main`: `git stash push -- apps/api/src/index.ts apps/api/src/live/socket.ts apps/api/src/live/socket.test.ts`; `git switch main`; `git pull --ff-only`; `git add fabi/build_4/build_4_prompt.md fabi/GLOSSARY.md IMPLEMENTATION_PLAN.md`; commit `docs(fabi) Build 4 prompt, decisions and the hour-27 plan row`; push; `git switch fabi/live-published-sites`; `git merge origin/main`; `git stash pop`. Every later commit names its paths in `git add`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`, `npm run glow:check`. The uncommitted B4-4.a work is part of the tree: record its result too, and list any failure, not fixed silently.
- [ ] Re-check section 1: open PRs, other glossaries' Hand-offs and Blocked rows naming Fabi, deployed `/health`.
- Done when: the baseline is recorded and failures that were already there are listed.

### B4-4 Requests from other lanes (0.25 h, added at hour 27)

#### B4-4.a `/live` gives a published place its site room

**B4-4.a.1** Review and finish the published-place rooms. Subagent: `fabi-realtime`. Files: `apps/api/src/live/socket.ts`, `apps/api/src/live/socket.test.ts`, `apps/api/src/index.ts`.

- [ ] The uncommitted change described in section 1 is the settled behaviour (Fabi's decision, hour 27): a socket asking for `site:<id>` is checked against `PUBLISHED_IDS_SQL` (`SELECT id FROM sites WHERE status = 'published'`); no `db`, or a room that is not `site:...`, joins synchronously with the five seeded ids as before; a failed query logs `live rooms query failed: <message>` and falls back to the seeded ids; a socket that disconnected during the query joins nothing; the latest glow and lamps are still sent on connect.
- [ ] Read it against `roomsFor`, the existing socket tests and `index.ts`; fix only what breaks one of these rules or the existing tests. Do not change behaviour beyond them.
- [ ] Tests (the three on disk, kept): "a place published after the seed gets its site room"; "a seeded site that is not published in the table gets city alone"; "a failed query falls back to the seeded sites".
- Verify: `npm run test -w @lampa/api -- src/live && npm run typecheck -w @lampa/api`. Paste the summary line.
- Done when: the API socket tests pass and a published added place's id is a valid `site:` room.

#### B4-4.b `GET /sites/:id` name fallback and the agent tools for published places

**B4-4.b.1** English-name fallback; tools read the sites table. Subagent: `fabi-api`. Files: `apps/api/src/sites/router.ts` and its test file, `apps/api/src/tools/router.ts` and its test file.

- [ ] `GET /sites/:id`: `name: r.name[lang] ?? r.name.en` (Ionut's request; Fabi's decision, hour 27). Nothing else in the route changes.
- [ ] `POST /tools/get_site_stats` and `POST /tools/get_recent_echo`: `siteIdOf` checks the table instead of the bundled `sites`: `export const TOOL_SITE_SQL = "SELECT 1 FROM sites WHERE id = $1 AND status = 'published' AND NOT is_memorial"`. No row → 404 `unknown_site` (as now); a query that throws → 503 `unavailable` through the existing `unavailable` helper; no `deps.db` → 503 `unavailable` as the routes answer today. Body validation (400 `invalid_body`) and the secret check (401, 503) keep their order and answers.
- [ ] Tests: "a Romanian request for a place with only an English name answers 200 with the English name"; "an added published place gets stats"; "a draft place is 404 unknown_site"; "the Cathedral is still 404"; "a failed site query is 503". Existing cases stay green.
- Verify: `npm run test -w @lampa/api -- src/sites src/tools && npm run typecheck -w @lampa/api`. Paste the summary line.
- Done when: the five new cases and the existing ones pass.

#### B4-4.c Commit and PR (this session)

- [ ] Re-run `npm run typecheck && npm test`; break one rule to see a test fail (`r.name[lang]` without the fallback; the table check replaced by the bundled one), restore.
- [ ] Commit on `fabi/live-published-sites` (`feat(api) live rooms, name fallback and agent tools for published places`), naming the B4-4 files and `fabi/GLOSSARY.md` in `git add`, with its glossary Done, Changes (Cristea's `index.ts`) and Hand-offs lines. Merge `origin/main` if it moved; push; open the PR; record its number.
- Done when: the PR is open with green checks.

### B4-1 `npm run demo:reset` (0.5 h, do this first)

#### B4-1.a The script

**B4-1.a.1** `npm run demo:reset`. Subagent: `fabi-api`. Files: `apps/api/src/db/demo-reset.ts`, `apps/api/src/db/demo-reset.test.ts`, `apps/api/package.json`, root `package.json`.

- [ ] Scripts: `apps/api/package.json` `"demo:reset": "tsx --env-file-if-exists=../../.env src/db/demo-reset.ts"`; root `"demo:reset": "npm run demo:reset -w @lampa/api"`. No prompt, as `db:reset` (Fabi's decision, hour 27).
- [ ] Named constants: `DEMO_SESSION = "demo:reset"`, `DEMO_WINDOW_SITE = "mx"`, `DEMO_PANES = 47`, `DEMO_LAMPS = 721`, `DEMO_LAMP_MIN_AGE_S = 120`, `DEMO_SATURATION = 0.8`, `DEMO_LIGHTNESS = 0.5` (Fabi's decisions, hour 27). 721 = `LAMP_TARGET` − 10: the simulator's first batch of 10 sessions each sends one `lamp` at start, so the counter fills to 731 in the first seconds of the 2:00 step.
- [ ] One transaction (`asTx`), in this order (Fabi's decision, hour 27: live state goes, history stays):
  1. `DELETE FROM panes`; `DELETE FROM windows`; `DELETE FROM echoes`; `DELETE FROM blobs WHERE key LIKE 'echo-%'` (place audio `site-...` stays).
  2. `DELETE FROM interaction_events`.
  3. Added places back to draft: `UPDATE sites SET status = 'draft' WHERE status = 'published' AND NOT (id = ANY($1))`, `$1` = the five seeded ids from `@lampa/shared` `sites`.
  4. Kept untouched: `colour_readings`, `conversations`, `sites` rows (seeded rows and `glow_k` 5 as they are), `schema_migrations`, place blobs.
  5. Window: `INSERT INTO windows (site_id, started_at) VALUES ('mx', now() - interval '47 minutes') RETURNING id`; 47 panes, slot `i` = 0 to 46: `hue = (i * 30) % 360`, saturation 0.8, lightness 0.5, `hex = hslToHex(hue, 0.8, 0.5)` from `apps/api/src/pulse/colour.ts`, `anon_id = 'demo:reset'`, `author_sub` null, `echo_id` null, `caught_at = now() - (47 - i) minutes` (slot 46 one minute ago). No `colour` event and no `colour_readings` row, so glow stays 0 (Fabi's decision, hour 27).
  6. Lamps: 721 rows into `interaction_events`: `kind 'lamp'`, `weight 0`, `session_id 'demo:reset'`, `user_sub`, `lang`, `mode` null, `props '{}'`; sites = the lamp sites as `LAMPS_SQL` filters them (published, not memorial, `'lamp' = ANY(interactions)`, ordered by id), row `i` at site `i mod count`; `ts` of row `i` = `start + i * (end - start) / 721`, `start` = `TODAY_START_SQL`, `end` = `now() - 120 s`. If `end <= start` (run in the first two minutes after local midnight) the script prints `demo:reset: too close to midnight, run again after 00:03` and exits 1 before the transaction starts.
- [ ] After the commit, outside any transaction: `CALL refresh_continuous_aggregate('site_activity_1m', NULL, NULL)`, then the same for `site_activity_1h` only if `SELECT 1 FROM timescaledb_information.continuous_aggregates WHERE view_name = 'site_activity_1h'` returns a row (it exists after B4-3). Without the refresh the materialized buckets older than the 2 h policy window keep the deleted events, and glow would not be 0.
- [ ] Output, one line: `demo:reset done: <e> events, <p> panes, <w> windows, <c> echoes, <b> echo blobs deleted; <d> places to draft; mx window 47 of 48; 721 lamps today`. `pool.end()` in `finally`; an error prints its message and exits 1 (the pattern of `places/reset.ts`).
- [ ] Pure, exported and tested without a database: `demoPanes()` (47 entries: slot, hue, hex; slot 0 is hue 0 and `#e61919`, slot 1 is hue 30 and `#e68019`, slot 12 is hue 0 again, every hex lowercase `#rrggbb`), `lampSiteFor(i, sites)`, the SQL constants. A fake `Db`/`Tx` test records the statements: panes are deleted before echoes, events before the lamp insert, the refresh runs after the commit and never inside the transaction, `site_activity_1h` is refreshed only when the lookup returns a row, and nothing touches `colour_readings`, `conversations` or `schema_migrations`.
- Verify: `npm run test -w @lampa/api -- src/db && npm run typecheck -w @lampa/api`. Paste the summary line. Do not run the script: it wipes the shared database.
- Done when: the tests pass and `npm run demo:reset` exists at the root.

#### B4-1.b Run on Tiger (this session, in B4-last)

- Run only in B4-last, after the team heads-up (Fabi's decision, hour 27). Its checks are listed there.

### B4-2 Finale trigger (0.5 h)

#### B4-2.a Seam (this session)

- [ ] On `fabi/b4-demo`, append `FinaleMessage` from section 3 to `packages/shared/src/contract.ts`; `npm run typecheck`; commit `feat(shared) added FinaleMessage for the 1884 finale` with a Changes line (team contract, Fabi takes it to the team).
- Done when: the seam commit is on `fabi/b4-demo`.

#### B4-2.b Trigger and broadcast

**B4-2.b.1** Finale trigger in the loop, `emitFinale` on `/live`. Subagent: `fabi-realtime`. Files: `apps/api/src/glow/loop.ts`, `apps/api/src/glow/loop.test.ts`, `apps/api/src/live/socket.ts`, `apps/api/src/live/socket.test.ts`, `apps/api/src/seam.ts`, `apps/api/src/index.ts`.

- [ ] `seam.ts`: `Live` gets `emitFinale: (message: FinaleMessage) => void`.
- [ ] `socket.ts`: `emitFinale` sends `finale` to every socket with `live.emit`, after `FinaleMessage.parse`, as `emitLamps` does. A new socket is not sent a finale on connect (Fabi's decision, hour 27: late joiners do not get it).
- [ ] `loop.ts`: `export const FINALE_LEAD_MS = 3000`; `startGlowLoop` takes `emitFinale?: (message: FinaleMessage) => void`. After a lamps message is built and sent, with `prev` = the `litToday` of the last lamps message this loop built (`null` at start): if `prev !== null && prev < LAMP_TARGET && litToday >= LAMP_TARGET`, call `emitFinale({ startAt: now().getTime() + FINALE_LEAD_MS })`. Then `prev = litToday`. A failed lamps query changes nothing. So the first tick after a start only records (a Render restart above 731 does not replay it), and `demo:reset` bringing the count under 731 re-arms it (Fabi's decision, hour 27). A throw in `emitFinale` is caught and logged as `finale emit failed: <message>`, and `prev` is still updated.
- [ ] `index.ts`: `startGlowLoop({ db, emit: live.emitGlow, emitLamps: live.emitLamps, emitFinale: live.emitFinale })`.
- [ ] Tests (loop, with a fake db whose lamps rows return a sequence of `lit_today` values and a fixed `now`): "38, 721, 731 sends one finale with startAt = now + 3000"; "731 on the first tick sends none"; "731, 721, 731 sends one, on the third tick"; "731, 740 sends none"; "a failed lamps tick between 721 and 731 still sends one when 731 arrives"; "no emitFinale given: no throw". Socket: "emitFinale reaches a socket in city, one in screen and one in a site room"; "a bad payload throws before anything is sent"; "a socket connecting after a finale gets glow and lamps but no finale".
- Verify: `npm run test -w @lampa/api -- src/glow src/live && npm run typecheck`. Paste the summary line.
- Done when: the cases pass and the existing loop and socket tests stay green.

#### B4-2.c Local check (this session, in B4-last)

- In B4-last, with the local API from `fabi/b4-demo` on Tiger right after `demo:reset`. Listed there.

### B4-3 Compression, retention and `EXPLAIN ANALYZE` (1 h)

#### B4-3.a Migration 005 and the explain file

**B4-3.a.1** Migration 005, `db/reset.sql`, `db/explain.sql`. Subagent: `fabi-sql`. Files: `db/migrations/005_policies.sql`, `db/reset.sql`, `db/explain.sql`, all in the worktree `../Lampa-b4-tiger` on `fabi/b4-tiger` (this session creates the worktree from `origin/main` and runs `npm ci` there before the agent starts).

- [ ] Columnstore (TimescaleDB 2.32, the API on the Tiger docs page; the concept's `timescaledb.compress` names are the older spelling): `interaction_events` with `timescaledb.enable_columnstore = true`, segment by `site_id`, order by `ts DESC`, policy after `INTERVAL '7 days'`; `colour_readings` the same (Fabi's decision, hour 27).
- [ ] Retention: `add_retention_policy('interaction_events', INTERVAL '90 days')` and `add_retention_policy('conversations', INTERVAL '90 days')`; the aggregates keep their rows (Fabi's decision, hour 27).
- [ ] `site_activity_1h`: hierarchical on `site_activity_1m`, as concept 11.2 B: `time_bucket('1 hour', bucket) AS bucket, site_id, kind, sum(n) AS n, sum(w) AS w, rollup(visitors_hll) AS visitors_hll`, `GROUP BY 1, site_id, kind`, `WITH NO DATA`; real-time (`materialized_only = false`) and the policy values of `colour_1h` in 003 (start 3 hours, end 1 hour, every 30 minutes), as the repo's other hourly aggregate.
- [ ] One comment line per statement on why. No `BEGIN`/`COMMIT` (each file runs in its own transaction), no `psql` meta-commands, no data.
- [ ] `db/reset.sql`: `DROP MATERIALIZED VIEW IF EXISTS site_activity_1h CASCADE;` above the `site_activity_1m` line. The table list does not change.
- [ ] `db/explain.sql`: four statements, each `EXPLAIN (ANALYZE, BUFFERS)` with a comment naming it: (1) "glow, aggregate": the shipped `glowSql()` text from `apps/api/src/glow/glow.ts` with `now()` in place of `$1`; (2) "glow, raw": the same formula over `interaction_events` (`ts` as the bucket, `weight` as `w`) for the last 24 h; (3) "30 days, per minute": interactions per hour per site over 30 days from `site_activity_1m`; (4) "30 days, per hour": the same from `site_activity_1h`.
- Verify: `grep -c "enable_columnstore" db/migrations/005_policies.sql` → `2`; `grep -c "add_retention_policy" db/migrations/005_policies.sql` → `2`; `grep -c "site_activity_1h" db/reset.sql` → `1`; `grep -c "EXPLAIN (ANALYZE, BUFFERS)" db/explain.sql` → `4`; and `npm run test -w @lampa/api -- src/db` in the worktree. Paste the outputs.
- Done when: the four counts match and the db tests pass.

#### B4-3.b Apply on Tiger (this session)

- [ ] From the worktree: `npm run db:migrate` → `applied 005_policies.sql`, `db:migrate done: 1 applied`; again → `0 applied`.
- [ ] Backfill once, outside a transaction: `CALL refresh_continuous_aggregate('site_activity_1h', NULL, NULL)`; then `sum(n)` over all rows of `site_activity_1m` equals `sum(n)` of `site_activity_1h`, so `EXPLAIN` statements (3) and (4) read the same data.
- [ ] Throwaway script: `timescaledb_information.jobs` lists two columnstore and two retention jobs and the `site_activity_1h` refresh; `timescaledb_information.hypertables` shows columnstore enabled on the two tables; row counts of events, panes, colour readings unchanged; `npm run glow:check` → `glow:check ok`.
- Done when: the jobs exist on Tiger and `glow:check` passes.

#### B4-3.c `EXPLAIN ANALYZE` numbers (this session; first to cut)

- [ ] Run the four statements of `db/explain.sql` on Tiger with a throwaway script; record each "Planning Time", "Execution Time", rows and buffers, and the row counts of `interaction_events`, `site_activity_1m`, `site_activity_1h` at that moment.
- [ ] Write `fabi/build_4/tiger_numbers.md`: the four numbers, the row counts, the hour, and that no chunk is compressed yet because all data is under 7 days old (Fabi's decision, hour 27: no manual `compress_chunk`). The README copies it at hour 44.
- Done when: the file holds measured numbers and is committed on `fabi/b4-tiger`.

### B4-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch, `npm run typecheck && npm run build && npm test && npm run glow:check` green on it.
- [ ] Team heads-up posted before the first `demo:reset` (Fabi posts it): it deletes every event, pane, window and echo, puts added places back to draft, and leaves 721 lamps and the `mx` window at 47 of 48.
- [ ] B4-1.b on Tiger: `npm run demo:reset` → the done line. Then, with the throwaway script and the deployed API: the shipped glow query gives 0 for every site; `GET /pulse/summary` `lampsToday` 721; `GET /screen/state` the `mx` window with 47 filled slots; `echoes` 0; `colour_readings` and `conversations` counts unchanged.
- [ ] B4-2.c: local API from `fabi/b4-demo` on Tiger; a `socket.io-client` listener on `/live` (`room: "screen"`) and one with `room: "site:cathedral"`; `npm run simulate:crowd -- --sessions 10 --seconds 70 --lamps`. Expect `lamps` climbing from 721 and exactly one `finale` per listener, its `startAt` about 3 s after receipt by the local clock; a second run of the simulator sends no second finale.
- [ ] `npm run demo:reset` again, so the shared database is left in the demo state; record the done line.
- [ ] Push each branch and open its PR, in this order: `fabi/live-published-sites` (already open), `fabi/b4-demo`, `fabi/b4-tiger`. Each PR lists what was verified and what waits for phones.
- [ ] Glossary complete: every ID of this prompt under Done or Blocked; Hand-offs: `npm run demo:reset` (what it wipes and leaves), `finale` with `FinaleMessage`, published-place rooms, the tools and name fallback, migration 005 and `site_activity_1h`, `tiger_numbers.md`.
- [ ] Tell the team (Fabi): `FinaleMessage { startAt }` in the contract (Patrick, Cristea: start the cue at `startAt` minus the clock offset; memorial views ignore it); `demo:reset` before each rehearsal (all); Cristea: added places go back to draft; Ionut: the name fallback.
- [ ] Fabi's checks with others, listed and not claimed: at a rehearsal, after `demo:reset`, Patrick's phones and Cristea's `/screen` start the finale together when the simulator crosses 731; the map opens dark at 0:00; the `mx` window shows 47 of 48 at 0:50.
- Done when: every box is ticked or listed as Fabi's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: none; the team's answer on `FinaleMessage`.
- **Not finished at hour 30:** each ID, what is left, and its place in the cut order.
- **Phone checks for Fabi:** the finale on phones and `/screen` at a rehearsal.
- **For the checkpoint:** run `npm run demo:reset` before each rehearsal; the simulator's first batch crosses 731; the Render API must be on `fabi/b4-demo`'s code for the finale.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 4: demo extras

- `npm run demo:reset` leaves Tiger with glow 0 at every site, 721 lamps today, the `mx` window at 47 of 48, no echoes, no published added place, and colour and conversation history kept.
- Crossing 731 lamps sends exactly one `finale` with `startAt` 3 s ahead to every socket; a restart above 731 sends none.
- Migration 005 is on Tiger: columnstore and retention policies, `site_activity_1h`. `db:reset` is not run in this block, so "`db:reset` rebuilds schema and seed" is shown only by `db:migrate` applying 005 in a transaction and by the `site_activity_1h` line in `db/reset.sql`; the full rebuild is listed for the freeze.
- `fabi/build_4/tiger_numbers.md` holds the measured `EXPLAIN ANALYZE` numbers, or B4-3.c is listed as cut.
- A published added place gets its `/live` site room and tool stats; `GET /sites/:id?lang=ro` falls back to English.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `fabi/GLOSSARY.md` matches the state of the branch.

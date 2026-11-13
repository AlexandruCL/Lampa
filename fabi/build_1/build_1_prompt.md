# Prompt: Fabi's Build 1: the spine (Fabi, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 6 (2026-11-13 19:35 +0200). Implementation not started.**

You are implementing Fabi's part of Build 1: the spine (hours 2 to 10 in the plan, started at hour 6) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *a tap on a phone changes what `/screen` shows.*

Checkpoint this block must pass (Checkpoint 1, the lines this lane affects):

- *2. The `wake` event is a row in `interaction_events`.*
- *3. `/screen` brightens that site within 5 seconds.*
- *4. `npm test` is green.*

## 0. Ground rules

- **Fabi takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Fabi, with your recommendation. Nothing uses the recommendation until Fabi answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 10 (23:21).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Fabi: carrying on, cutting (plan section 7) or moving it is their decision. Already decided for hour 10 (Fabi, hour 6): `GET /sites/:id` moves to Build 2 first, then `GET /sites?near=`. Never cut: `POST /events`, `/live`, migration 002, the glow loop, the decay test.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Fabi, who takes it to the team. When another lane's endpoint has not landed, code against its schema. This block appends `NearbySites` and `SiteDetail` (Fabi's decision, hour 6) and changes nothing that is there.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Fabi's approval. Approved: `socket.io` 4.8.4 in `apps/api` and `socket.io-client` 4.8.4 as a dev dependency of `apps/api` (B1-1.a, hour 6). From Setup and already installed: `pg` 8.23.1, `yaml` 2.9.1, `zod` 4.6.7, `@types/pg` 8.23.1.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `DATABASE_URL` and `SESSION_SECRET` are never printed, logged, pasted into the chat or written into any tracked file. A session token fetched for a check is kept in a shell variable and not printed.
- `main` deploys by itself. The docs commit (`fabi/`) goes straight to `main` (Fabi's decision, hour 6). After it, work on two branches: `fabi/b1-events` holds B1-1, B1-2, B1-3.a and B1-3.b; `fabi/b1-glow`, started from `fabi/b1-events`, holds B1-3.c, B1-3.d, B1-3.e and B1-4. One small PR per branch. Open it only after the verify commands pass. Cristea merges, with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. This block makes no ElevenLabs call.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. In this block: `candle` and `arrived` carry weight 0, so the Cathedral's glow stays 0, and `persona` is never sent by an endpoint.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. This block builds no screen.
- Write in `fabi/` only. Other members' folders are read-only.
- **Keep `fabi/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Fabi a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work. A Done line's Commit cell is filled in the next commit, as in Setup.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm run db:reset` wipes the one database that local work and the deployed API share. Only this session runs it, in B1-3.b.

## 1. Current state (checked at hour 6, 2026-11-13 19:27 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Setup is closed for this lane: every S ID is under Done, nothing was cut. PR #16 (`fabi/setup-db`) is merged into `main` (`a404304`).
- `origin/main` is at `387c717` (Patrick's docs commit). The local `main` holds one more commit, `74c2c98`, a cherry-pick of `8db3993` (the hour-5 glossary lines, which were pushed to `fabi/setup-db` after the merge and are not on `origin/main`). The working tree also holds this prompt and the hour-6 glossary lines, uncommitted. B1-0 pushes all of it.
- Open PR: #18 (`ionut/b2-lens`). Ionut and Cristea are in Build 2; Patrick is in Setup. `ionut/GLOSSARY.md` (Blocked, hour 1) and `cristea/GLOSSARY.md` (Blocked, hour 9) wait on `POST /events` and `/live` from this block.
- Still open from Setup, under Blocked in the glossary: Fabi has not yet told the team that `Site`, `GlowMessage` and the five ids are accepted and that `sites.json` is on `main`, nor shown the changed line of plan section 9 (Fabi's answer, hour 6). It is carried to B1-last.
- Exists and is built on:
  - `apps/api/src/app.ts`: `createApp()` with no argument; throws without `SESSION_SECRET`; mounts `sessionRouter`, `express.json()`, `createAgentRouter()`, `GET /health`. Tests call `createApp()` with no argument.
  - `apps/api/src/index.ts`: `createApp().listen(port)`. No http server object, no socket.
  - `apps/api/src/auth/session.ts`: `requireVisitor`, `visitorLimiter` (120 a minute per subject), `Visitor = { sub, kind: "anon" | "auth0", permissions }` on `req.visitor`, 401 `{"error":"unauthorized"}`.
  - `apps/api/src/db/pool.ts`: `createPool()`, throws `DATABASE_URL is not set`. `apps/api/src/db/reset.ts` sends each file of `db/migrations/` as one multi-statement `query` call.
  - `db/migrations/001_init.sql`: `sites` (with `glow_k`, `status`, `active_from`, `active_until`, `geom`), `interaction_events` hypertable (`ts`, `session_id` text, `user_sub`, `site_id`, `kind`, `weight` real, `lang`, `mode`, `props`). `db/reset.sql` holds one `DROP TABLE` statement.
  - `content/sites/*.yaml`: five files, each with `glow_k: 10`.
  - `packages/shared/src/contract.ts`: `EventKind`, `SocketMessage`, `GlowMessage` (`{ sites: [{ siteId, glow 0 to 1 }] }`), `Site`, `EventIn` (`{ kind, siteId, at }`), `EventBatch` (1 to 50 events), `EventsAccepted` (`{ accepted }`), and the Build 2 schemas `PaneMessage`, `WindowCompleteMessage`, `ScreenState`, `AgentLang`, `AgentSession`, `PaneIn`, `PaneAccepted`. `sites` (five `Site` entries) is exported from `@lampa/shared`.
  - The two socket clients on `main`: `apps/web/src/screen/useGlowSocket.ts` (`io(VITE_API_URL + "/live", { query: { room: "screen" } })`) and `apps/web/src/phone/useSiteGlow.ts` (`io(API_URL + "/live", { query: { room: "site:<id>" } })`). Neither sends a token. Both listen for `glow`, parse it with `GlowMessage` and ignore a message that fails the parse without any sign. `applyGlow` merges by site id and `siteGlow` skips a site that is absent, so a site left out of a message keeps its old glow.
  - `apps/web/src/screen/glow.ts`: the `/screen` disc changes only from glow 0.15 (`glowAlpha`).
  - `apps/web/src/events/queue.ts`: the phone posts `EventBatch` to `POST /events` every 2 s and expects 202 `EventsAccepted`; it retries on a network error, 5xx, 401 and 429 and drops the batch on any other 4xx. `SiteView.tsx` sends `wake`.
- Does not exist yet, added by this block: `socket.io` in `apps/api` (B1-1.a); `apps/api/src/seam.ts`, `apps/api/src/events/` (B1-1); `apps/api/src/live/` (B1-2); `db/migrations/002_site_activity.sql` (B1-3.a); `apps/api/src/glow/` and the `glow:check` scripts (B1-3); `apps/api/src/sites/` (B1-4); `NearbySites` and `SiteDetail` in the contract (B1-1.a). No code on `main` calls `GET /sites`.
- "Needs from others": `requireVisitor` from Cristea by hour 6: landed (`cristea/GLOSSARY.md`, Hand-offs, hour 4).
- Scripts that exist: root `dev`, `build`, `typecheck`, `test`, `db:reset`; `apps/api` `dev`, `start`, `typecheck`, `test`, `db:reset`. No `glow:check` yet (B1-3.c adds it). Tests on `main` after PR #17 as a trial merge: API `Tests 37 passed (37)`, web `Tests 119 passed (119)` (`fabi/GLOSSARY.md`, Changes, hour 5); B1-0 records the real baseline.
- Deployed at 19:03: web `https://lampa-timisoara.vercel.app/pulse` → 200; API `https://lampa-api-b45i.onrender.com/health` → `{"ok":true}`; `POST /events` → 404; `/socket.io/?EIO=4&transport=polling` → 404; `GET /sites/mx` → 404. Render runs `npm ci` and `npm run start -w @lampa/api` on every push to `main`, with `WEB_ORIGIN` set to the Vercel production URL and `DATABASE_URL` set by Fabi (hour 5). CORS allows only `WEB_ORIGIN`. The free plan sleeps after about 15 minutes idle; the first call can take about 50 s.
- This machine: Windows 11, Node v26.13.1, npm 11.20.0, `gh` (account Skips26), `curl`. Not installed: `psql`, `docker`. The local `.env` holds `DATABASE_URL` only. The Tiger service `lampa` is the one database; `interaction_events` holds nothing of value.
- Fabi's devices: a laptop only (Fabi's answer, hour 6). Fabi's checks use `curl` and the laptop's browser. The wake from a real phone is checked together with Ionut and Cristea.
- No graph exists in `graphify-out/`. `.claude/agents/` holds `fabi-sql.md` and `fabi-api.md`, updated for this block, and `fabi-realtime.md`, new with this prompt.
- `DESIGN.md` section 9 has no Build 1 item for Fabi; the only one is item 12, in Build 3.
- Facts from the concept PDF (`LAMPA_Hackathon_Concept_Timisoara_v6.pdf`, in the repo root, gitignored): section 7.4 gives the weights wake 1, talk turn 0.5, colour 3, lamp 2 per minute held, approved echo 5, echo heard 0.2 and tau 6 hours; section 9.9 marks `POST /events` "anon or Auth0" and both `GET /sites` routes "public"; section 11.2 B, C and F hold the SQL this prompt copies.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 1: the spine, Fabi's rows, and Checkpoint 1 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Fabi's table and "Needs from others" | All |
| `fabi/GLOSSARY.md` | Whole file | All |
| `cristea/GLOSSARY.md`, `ionut/GLOSSARY.md`, `patrick/GLOSSARY.md` | Hand-offs, Changes and Blocked | B1-0, B1-last |
| `IMPLEMENTATION_PLAN.md` | Section 3; section 8, Fabi's rows; section 9, the rows on Render sockets and aggregate lag | B1-1.a, B1-3 |
| `package.json`, `apps/api/package.json`, `tsconfig.base.json`, `apps/api/tsconfig.json` | Whole files | B1-1.a, B1-3.c |
| `packages/shared/src/contract.ts`, `packages/shared/src/index.ts`, `packages/shared/src/sites.ts` | `EventKind`, `SocketMessage`, `GlowMessage`, `Site`, `EventIn`, `EventBatch`, `EventsAccepted`, `sites` | All |
| `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/db/pool.ts` | Whole files | B1-1.a, B1-3.c |
| `apps/api/src/auth/session.ts` | `requireVisitor`, `visitorLimiter`, `Visitor` | B1-1.b, B1-4 |
| `apps/api/src/auth/session.test.ts`, `apps/api/src/agent/session.test.ts` | Test style: an Express app on port 0, called with `fetch`, tokens signed with `SESSION_SECRET` | B1-1.b, B1-2.a, B1-4.a |
| `apps/web/src/screen/useGlowSocket.ts`, `apps/web/src/phone/useSiteGlow.ts`, `apps/web/src/screen/glow.ts` | How the two clients join and read `glow` | B1-2.a, B1-3.d |
| `apps/web/src/events/queue.ts`, `apps/web/src/events/index.ts` | What the phone sends and which answers it retries | B1-1.b |
| `db/migrations/001_init.sql`, `db/reset.sql`, `apps/api/src/db/reset.ts` | Columns; how migrations and the reset file are run | B1-3.a, B1-3.b, B1-4.a |
| `content/sites/*.yaml` | The `glow_k` line | B1-1.a |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Sections 7.4, 9.5, 9.9 and 11.2 B, C, F, only to check a value against this prompt | B1-1.b, B1-3, B1-4 |
| Tiger docs | The pages for `CREATE MATERIALIZED VIEW` with `timescaledb.continuous`, real-time aggregates (`materialized_only`) and `add_continuous_aggregate_policy` | B1-3.a |
| `node_modules/socket.io`, `node_modules/socket.io-client`, `node_modules/pg`, `node_modules/express-rate-limit` type declarations | `Server`, `Namespace`, `io`, `Pool`, `rateLimit` | B1-1.a, B1-2.a, B1-4.a |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: `POST /events`: Zod validation, server-side weights, batch insert. Section 11: `POST /events` with validation and server-side weights | 1.5 | B1-1.a, B1-1.b |
| Section 6: Socket.IO `/live` with rooms `city`, `site:<id>`, `screen`. Broadcast on insert. Section 11: Socket.IO `/live` with rooms | 1.5 | B1-2.a, B1-2.b; the broadcast itself is wired in B1-3.e |
| Section 6: `site_activity_1m` continuous aggregate, the glow query, the 5 s loop that pushes glow to all clients. Test for the decay maths. Section 11: Continuous aggregate, glow query, 5 s loop, decay test | 2.5 | B1-3.a, B1-3.b, B1-3.c, B1-3.d, B1-3.e |
| Section 6: `GET /sites?near=` with PostGIS, `GET /sites/:id`. Section 11: `GET /sites?near=`, `GET /sites/:id` | 1 | B1-4.a |
| Section 8: Glow decay: known events at known times give the expected value | in the 2.5 | B1-3.c, B1-3.e |
| Checkpoint 1, line 2: The `wake` event is a row in `interaction_events`. | none given | B1-2.b, B1-last |
| Checkpoint 1, line 3: `/screen` brightens that site within 5 seconds. | none given | B1-1.a (`glow_k`), B1-3.e, B1-last |
| Checkpoint 1, line 4: `npm test` is green. | none given | every agent task, B1-last |
| Section 9: Continuous aggregate lags behind new events: `materialized_only = false` in migration 002, which creates the aggregate in Build 1; verified at checkpoint 1 | none given | B1-3.a, B1-3.b, B1-last |

`DESIGN.md` section 9 has no Build 1 item for Fabi. Section 8's second test for Fabi (pane slots) belongs to Build 2. The `glow:check` script and the change of `glow_k` have no plan row of their own and were approved by Fabi at hour 6.

Total: 6.5 h of tasks in an 8 h block, of which 4 h are left at hour 6. Parallel agents carry the difference; the cut order of section 0 applies at hour 10.

Order: B1-0, then B1-1.a by this session on `fabi/b1-events`, committed before any agent starts. Then B1-1.b.1, B1-2.a.1 and B1-3.a.1 in parallel. Then B1-3.b and B1-2.b by this session, and PR 1 is opened at once, because Ionut and Cristea wait on `POST /events` and `/live`. Then `fabi/b1-glow` from `fabi/b1-events`: the seam of B1-3.c by this session, committed before the agents start; B1-3.c.1, B1-3.d.1 and B1-4.a.1 in parallel, the first two as two runs of `fabi-realtime`; B1-3.e by this session; PR 2. Then B1-last.

The seam. This session writes it as the first commit of `fabi/b1-events` (B1-1.a) and extends it as the first commit of `fabi/b1-glow` (B1-3.c). `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/seam.ts`, `apps/api/src/db/pool.ts`, `packages/shared/src/contract.ts`, the `package.json` files and `package-lock.json` belong to this session. No agent edits them.

`apps/api/src/seam.ts`, whole file:

```ts
import type { GlowMessage } from "@lampa/shared";

/** The one database call the routers and the loop use. `asDb(pool)` in `db/pool.ts` makes one. */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
};

/** The last glow message sent, or null before the first one. */
export type LatestGlow = () => GlowMessage | null;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = { emitGlow: (message: GlowMessage) => void; close: () => Promise<void> };

/** `startGlowLoop` in `glow/loop.ts` returns this. */
export type GlowLoop = { tick: () => Promise<void>; nudge: () => void; latest: LatestGlow; stop: () => void };

export type AppDeps = { db?: Db; onEventsStored?: () => void; latestGlow?: LatestGlow };
```

Appended to `apps/api/src/db/pool.ts`, with `import type { Db } from "../seam.js";` at the top:

```ts
export const asDb = (pool: pg.Pool): Db => ({ query: (text, params) => pool.query(text, params) });
```

Signatures, one per agent file (the owner of each is its agent task):

```ts
// apps/api/src/events/router.ts (B1-1.b.1)
export function createEventsRouter(deps: { db?: Db; onStored?: () => void; now?: () => Date }): Router;

// apps/api/src/live/socket.ts (B1-2.a.1)
export function roomsFor(room: unknown, siteIds: string[]): string[];
export function attachLive(server: import("node:http").Server, opts: { origin: string | undefined; latestGlow: LatestGlow }): Live;

// apps/api/src/glow/glow.ts (B1-3.c.1)
export const TAU_S = 21600;
export function glowSql(sites?: string, activity?: string): string;
export function glowAt(buckets: { bucket: Date; w: number }[], glowK: number, at: Date): number;

// apps/api/src/glow/loop.ts (B1-3.d.1)
export function startGlowLoop(deps: { db: Db; emit: (message: GlowMessage) => void; intervalMs?: number; now?: () => Date }): GlowLoop;

// apps/api/src/sites/router.ts (B1-4.a.1)
export function parseNear(text: unknown): { lat: number; lng: number } | null;
export function createSitesRouter(deps: { db?: Db; latestGlow: LatestGlow }): Router;
```

Appended to `packages/shared/src/contract.ts` (owner of the file: the team; proposed by Fabi, hour 6):

```ts
/** GET /sites?near=<lat>,<lng>, public. Published, active sites within 2000 m, nearest first, at most 5. name is the English name. */
export const NearbySites = z.object({
  sites: z.array(Site.extend({ distance_m: z.number().min(0), glow: z.number().min(0).max(1) })),
});
export type NearbySites = z.infer<typeof NearbySites>;

/** GET /sites/:id?lang=ro|en, public. Any other lang is en. persona is never sent. */
export const SiteDetail = Site.extend({
  radius_m: z.number(),
  interactions: z.array(z.string()),
  facts: z.array(z.unknown()),
  directions_hint: z.string(),
  glow: z.number().min(0).max(1),
});
export type SiteDetail = z.infer<typeof SiteDetail>;
```

### 3.1 Subagents

Fabi asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Fabi, re-runs the checks, writes the glossary and does B1-0, B1-1.a, B1-2.b, B1-3.b, the seam of B1-3.c, B1-3.e and B1-last. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `fabi-sql` | Plain SQL in `db/`: migrations, continuous aggregates, the reset file | `opus` | reused from Setup |
| `fabi-api` | Express routers with `pg` and Zod in `apps/api/src/events` and `apps/api/src/sites`, with their Vitest tests | `sonnet` | reused from Setup, scope updated |
| `fabi-realtime` | Socket.IO `/live` and the glow loop in `apps/api/src/live` and `apps/api/src/glow`, with their Vitest tests | `opus` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B1-1.b.1 | `fabi-api` | `POST /events` router with weights and tests | `apps/api/src/events/**` | after B1-1.a, parallel with B1-2.a.1 and B1-3.a.1 |
| B1-2.a.1 | `fabi-realtime` | Socket.IO `/live`, rooms, glow to a new socket, tests | `apps/api/src/live/**` | after B1-1.a, parallel with B1-1.b.1 and B1-3.a.1 |
| B1-3.a.1 | `fabi-sql` | Migration 002 and the reset file | `db/migrations/002_site_activity.sql`, `db/reset.sql` | after B1-1.a, parallel with B1-1.b.1 and B1-2.a.1 |
| B1-3.c.1 | `fabi-realtime` | The glow SQL, its TypeScript twin with the decay test, the known events and the `glow:check` script | `apps/api/src/glow/glow.ts`, `apps/api/src/glow/glow.test.ts`, `apps/api/src/glow/known.ts`, `apps/api/src/glow/check.ts` | after the seam of B1-3.c, parallel with B1-3.d.1 and B1-4.a.1 |
| B1-3.d.1 | `fabi-realtime` | The glow loop and its tests | `apps/api/src/glow/loop.ts`, `apps/api/src/glow/loop.test.ts` | after the seam of B1-3.c, parallel with B1-3.c.1 and B1-4.a.1 |
| B1-4.a.1 | `fabi-api` | `GET /sites?near=` and `GET /sites/:id` with tests | `apps/api/src/sites/**` | after the seam of B1-3.c, parallel with B1-3.c.1 and B1-3.d.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Fabi to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Fabi. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- The agents share one working tree. They do not run `git add`, `git commit`, `git switch`, `npm install`, `npm run db:reset` or `npm run glow:check`, and they do not connect to the database. This session commits each agent's files after re-running its verify command.
- While agents run in parallel, `npm run typecheck` can fail on a file another agent is still writing. An agent reports such an error and does not touch the file; this session runs the typecheck again when all of them have reported.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Fabi, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B1-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git fetch`, `git log --oneline origin/main..main`. Expected: branch `main`, one local commit `74c2c98` ahead of `origin/main`, and local changes in `fabi/` only (this prompt and the glossary). List anything more; do not touch it.
- [ ] Commit `fabi/` as `docs(fabi) added the Build 1 prompt and the hour 6 decisions`, then `git pull --rebase origin main`, then push `main`. If the push is refused, stop and tell Fabi.
- [ ] `gh pr list --state open`. List what is open.
- [ ] `npm ci`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-check each "Needs from others" item of section 1: `requireVisitor` and `visitorLimiter` are exported from `apps/api/src/auth/session.ts`. Re-read the Hand-offs, Changes and Blocked of the three other glossaries on `origin/main` and list what moved since section 1. If `packages/shared/src/contract.ts` has gained an event, glow or site schema that differs from the seam above, stop and ask Fabi before B1-1.a.
- [ ] Local `.env` (Fabi's approval, hour 6): if it has no `SESSION_SECRET` line, append one with 32 random bytes as hex, generated and written in one command that prints nothing; if it has no `WEB_ORIGIN` line, append `WEB_ORIGIN=http://localhost:5173`. Check with `grep -c "^SESSION_SECRET=" .env && grep -c "^WEB_ORIGIN=" .env`, which prints `1` and `1`.
- [ ] `fabi/GLOSSARY.md` exists. Do not recreate it.
- [ ] `git switch -c fabi/b1-events`.
- Done when: the docs commit is on `origin/main`, the baseline is recorded and failures that were already there are listed, not fixed silently.

### B1-1 `POST /events` with validation and server-side weights (1.5 h)

#### B1-1.a The seam, the libraries and `glow_k` 5 are on `fabi/b1-events` (this session)

- [ ] `npm install -w @lampa/api --save-exact socket.io@4.8.4` and `npm install -w @lampa/api --save-dev --save-exact socket.io-client@4.8.4`.
- [ ] `apps/api/src/seam.ts` as written above. `asDb` appended to `apps/api/src/db/pool.ts` as written above.
- [ ] `NearbySites` and `SiteDetail` appended to `packages/shared/src/contract.ts` as written above. Nothing else in the file changes.
- [ ] Stub `apps/api/src/events/router.ts`: `createEventsRouter` with the signature above, returning an empty `Router()`. Stub `apps/api/src/live/socket.ts`: `roomsFor` returning `["city"]` and `attachLive` returning `{ emitGlow: () => {}, close: async () => {} }`. The agents replace both files.
- [ ] `apps/api/src/app.ts`: the signature becomes `createApp(deps: AppDeps = {})`, and one line is added after `app.use(createAgentRouter());`:

```ts
  app.use(createEventsRouter({ db: deps.db, onStored: deps.onEventsStored }));
```

- [ ] `apps/api/src/index.ts`, whole file:

```ts
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { asDb, createPool } from "./db/pool.js";
import { attachLive } from "./live/socket.js";

const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? createPool() : undefined;
if (pool) pool.on("error", (err) => console.error(`db pool error: ${err.message}`));
else console.log("DATABASE_URL is not set: events, sites and glow are off");
const db = pool && asDb(pool);

const server = createServer(createApp({ db }));
attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow: () => null });
server.listen(port, () => console.log(`api listening on ${port}`));
```

- [ ] The five files in `content/sites/`: `glow_k: 10` becomes `glow_k: 5` (Fabi's decision, hour 6). Nothing else in them changes.
- [ ] Commit as `feat(api) added the Build 1 seam, socket.io and glow_k 5`, with the glossary's Done line for B1-1.a and Changes lines for: `socket.io` and `socket.io-client`; `apps/api/src/app.ts` and `index.ts` (Cristea's files); `packages/shared/src/contract.ts` (`NearbySites`, `SiteDetail`); `glow_k` 5 replacing the hour-3 value.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines.
- Done when: the verify command exits 0 with the baseline's test counts, and `git show --stat HEAD` lists only `package-lock.json`, `apps/api/package.json`, `apps/api/src/seam.ts`, `apps/api/src/db/pool.ts`, `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/events/router.ts`, `apps/api/src/live/socket.ts`, `packages/shared/src/contract.ts`, the five site files and `fabi/GLOSSARY.md`.

#### B1-1.b `POST /events` stores a batch with the server's weights and answers 202

**B1-1.b.1** `POST /events` router with weights and tests. Subagent: `fabi-api`. Files: `apps/api/src/events/**`.

- [ ] `apps/api/src/events/weights.ts` exports `WEIGHTS: Record<EventKind, number>` with exactly `wake: 1`, `talk_turn: 0.5`, `colour: 3`, `lamp: 2`, `candle: 0`, `echo_approved: 5`, `echo_heard: 0.2`, `arrived: 0` (concept section 7.4; `candle` and `arrived` are Fabi's decision, hour 6), and `CLIENT_KINDS: EventKind[]` = `wake`, `talk_turn`, `lamp`, `candle`, `echo_heard`, `arrived`. `colour` is stored by `POST /panes` and `echo_approved` by the curator endpoint, both in later blocks, so a phone may not send them.
- [ ] `apps/api/src/events/router.ts` replaces the stub and keeps the signature `createEventsRouter(deps: { db?: Db; onStored?: () => void; now?: () => Date }): Router`. It also exports two pure functions:
  - `toRows(batch: EventBatch, now: Date): { ts: string; siteId: string; kind: EventKind; weight: number }[]`: drops every event whose kind is not in `CLIENT_KINDS`; `weight` is `WEIGHTS[kind]`; `ts` is the event's `at` when `now - 600000 ms <= at <= now`, otherwise `now.toISOString()` (Fabi's decision, hour 6). The constant is named `MAX_EVENT_AGE_MS = 600_000`.
  - `userSub(visitor: Visitor): string | null`: the `sub` when `kind` is `"auth0"`, otherwise `null`.
- [ ] The route is `router.post("/events", requireVisitor, visitorLimiter, handler)`, with both middlewares imported from `../auth/session.js`. `express.json()` is already mounted by `createApp`. Steps of the handler, in order:
  1. `EventBatch.safeParse(req.body)`. On failure: 400 `{ "error": "invalid_body" }`.
  2. Without `deps.db`: 503 `{ "error": "unavailable" }`.
  3. `rows = toRows(batch, (deps.now ?? (() => new Date()))())`. When `rows` is empty: 202 `{ "accepted": 0 }` and no query.
  4. One query with `INSERT_EVENTS` and the six parameters below. `accepted` is the result's `rowCount`, or 0 when it is `null`.
  5. When `accepted > 0`, call `deps.onStored?.()`.
  6. Answer 202 with `EventsAccepted.parse({ accepted })`.
  A query that rejects: `console.error` with the text `events insert failed: ` followed by the error's message and nothing from the body, then 503 `{ "error": "unavailable" }` (Ionut's queue retries on 5xx).
- [ ] `INSERT_EVENTS`, exported, is this text. The join skips an event whose site id is not in `sites`, so the whole batch is never refused for one bad id (Fabi's decision, hour 6):

```sql
INSERT INTO interaction_events (ts, session_id, user_sub, site_id, kind, weight)
SELECT e.ts, $1::text, $2::text, e.site_id, e.kind, e.weight
FROM unnest($3::timestamptz[], $4::text[], $5::text[], $6::real[]) AS e(ts, site_id, kind, weight)
JOIN sites s ON s.id = e.site_id
```

  Parameters in order: `req.visitor.sub`; `userSub(req.visitor)`; the array of `ts`; the array of `siteId`; the array of `kind`; the array of `weight`. `lang`, `mode` and `props` are not set in this block. The talk-turn cap of 5 per conversation is not enforced here: `EventIn` has no conversation id, and the cap goes to Build 2 with Patrick's Talk (Fabi's decision, hour 6).
- [ ] Test file `apps/api/src/events/router.test.ts`, in the style of `apps/api/src/agent/session.test.ts`: an `express()` app with `express.json()` and `createEventsRouter(deps)` on port 0, called with `fetch`; `SESSION_SECRET` is `"test-secret"` and tokens are HS256 with subject `anon:test`; the database is a fake `Db` that records each call and returns a `rowCount` the test sets. No test connects to a database. Cases by name: `no token is rejected with 401`; `a body that fails EventBatch answers 400 invalid_body`; `a wake is stored with weight 1 and the visitor's subject as session_id`; `the weights are wake 1, talk_turn 0.5, lamp 2, echo_heard 0.2, candle 0 and arrived 0`; `a weight sent by the client is ignored`; `colour and echo_approved are skipped, and a batch of only those runs no query and answers 202 with accepted 0`; `accepted is the insert's row count, so an unknown site id is not counted`; `at within the last 10 minutes is kept, and an older or a future at becomes the server's time`; `userSub is null for an anonymous visitor and the sub for an Auth0 visitor`; `a failing insert answers 503 unavailable`; `without a database it answers 503 unavailable`; `onStored runs when rows were stored and not when accepted is 0`; `INSERT_EVENTS joins sites and sets no lang, mode or props`.
- [ ] Do not run `git add`, `git commit`, `npm install` or `npm run db:reset`. Do not edit `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/seam.ts`, `apps/api/src/auth/**` or `packages/shared/**`.
- Verify: `npm run test -w @lampa/api -- src/events && npm run typecheck`. Paste the summary line.
- Done when: the verify command shows 13 tests passed in `src/events`, and the typecheck reports no error in `apps/api/src/events`. The run against Tiger is this session's check in B1-2.b, not yours.

### B1-2 Socket.IO `/live` with rooms (1.5 h)

#### B1-2.a `/live` accepts both clients on `main`, puts them in their rooms and sends them glow

**B1-2.a.1** Socket.IO `/live`, rooms, glow to a new socket, tests. Subagent: `fabi-realtime`. Files: `apps/api/src/live/**`.

- [ ] `apps/api/src/live/socket.ts` replaces the stub and keeps both signatures.
- [ ] `roomsFor(room: unknown, siteIds: string[]): string[]`: always `"city"`; plus `"screen"` when `room` is the string `"screen"`; plus `"site:<id>"` when `room` is the string `"site:<id>"` and `<id>` is in `siteIds`. Anything else, an array included, adds nothing (Fabi's decision, hour 6).
- [ ] `attachLive(server, { origin, latestGlow })`: `new Server(server, { cors: { origin } })` on the default path `/socket.io/`, and the namespace `io.of("/live")`. No token is asked for or read: both clients on `main` send none (Fabi's decision, hour 6). On each connection to `/live`: join `roomsFor(socket.handshake.query.room, ids)`, where `ids` are the ids of `sites` imported from `@lampa/shared`; then, when `latestGlow()` is not `null`, send it to that socket alone as a `glow` message.
- [ ] `emitGlow(message)`: `GlowMessage.parse(message)`, then emit the parsed value to the whole `/live` namespace under the name `SocketMessage.enum.glow`. A message that fails the parse throws and nothing is sent: both clients drop a bad message without any sign, so the server must not send one.
- [ ] `close()`: closes the Socket.IO server and resolves when it has closed.
- [ ] Nothing listens on the default namespace `/`. No other message is sent in this block: `pane`, `window_complete`, `lamps`, `candle`, `echo_approved` and `finale` come in later blocks and will use the rooms.
- [ ] Test file `apps/api/src/live/socket.test.ts`: a `node:http` server on port 0 with `attachLive`, and real clients from `socket.io-client` connecting to `http://127.0.0.1:<port>/live` with `transports: ["websocket"]`. Every client and the server are closed after each test. Cases by name: `roomsFor gives city alone for no room, an unknown room, an unknown site and an array`; `roomsFor adds screen, and site:mx for a seeded site`; `a client with room screen receives a glow message that parses as GlowMessage`; `a client with room site:mx receives the same glow message`; `a new client gets the latest glow on connect`; `a new client gets nothing on connect while the latest glow is null`; `emitGlow throws on a glow above 1 and sends nothing`; `a server socket is in the rooms roomsFor gives`.
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not edit `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/seam.ts`, `apps/web/**` or `packages/shared/**`.
- Verify: `npm run test -w @lampa/api -- src/live && npm run typecheck`. Paste the summary line.
- Done when: the verify command shows 8 tests passed in `src/live`, and the typecheck reports no error in `apps/api/src/live`. The run against the deployed web origin is this session's check, not yours.

#### B1-2.b A wake sent to the local API is a row in Tiger, a client connects to `/live`, and PR 1 is open (this session)

This runs after B1-1.b.1, B1-2.a.1 and B1-3.b.

- [ ] Re-run the verify commands of B1-1.b.1 and B1-2.a.1, then `npm run typecheck && npm run build && npm test`. Commit B1-1.b.1 as `feat(api) added POST /events with server-side weights` and B1-2.a.1 as `feat(api) added Socket.IO /live with rooms`, each with its glossary Done line.
- [ ] Break one rule and watch its test fail, then restore it: `WEIGHTS.wake` set to 2; `colour` added to `CLIENT_KINDS`; `emitGlow` sending without the parse.
- [ ] Start the API in the background with `npm run start -w @lampa/api` and wait for `api listening on 3000`. Fetch a token into a shell variable without printing it: `TOKEN=$(curl -s -X POST http://localhost:3000/session/anon | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")`.
- [ ] Send one batch of three events, each with the current time in `at`: a `wake` at `mx`, a `wake` at site `nowhere`, a `colour` at `mx`. `curl -s -w " %{http_code}" -X POST http://localhost:3000/events -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d <the batch>` prints `{"accepted":1} 202`.
- [ ] The row is in Tiger: `npx tsx --env-file=.env -e "import('./apps/api/src/db/pool.ts').then(async (m) => { const p = m.createPool(); const r = await p.query(\"SELECT site_id, kind, weight, session_id LIKE 'anon:%' AS anon, user_sub FROM interaction_events WHERE ts > now() - INTERVAL '2 minutes' ORDER BY ts DESC LIMIT 3\"); console.log(JSON.stringify(r.rows)); await p.end(); })"` prints one new row `{"site_id":"mx","kind":"wake","weight":1,"anon":true,"user_sub":null}`.
- [ ] A client connects: `npx tsx -e "import('socket.io-client').then(({ io }) => { const s = io('http://localhost:3000/live', { query: { room: 'screen' } }); s.on('connect', () => { console.log('connected'); process.exit(0); }); setTimeout(() => { console.log('no connection in 8 s'); process.exit(1); }, 8000); })"` prints `connected`. No glow arrives yet: the loop is B1-3.
- [ ] CORS as the browser sees it: `curl -s -D - -o /dev/null -H "Origin: http://localhost:5173" "http://localhost:3000/socket.io/?EIO=4&transport=polling"` shows status 200 and `Access-Control-Allow-Origin: http://localhost:5173`.
- [ ] Stop the background API.
- [ ] `git fetch`, rebase `fabi/b1-events` on `origin/main`, re-run `npm run typecheck && npm run build && npm test`, push, and open PR 1 with `gh pr create`: title `feat(api) POST /events, Socket.IO /live and migration 002`. The PR lists what was verified, the files touched outside `fabi/`, that the Vercel preview check fails by design, and that no glow is sent until PR 2. Tell Fabi to ask Cristea for the merge.
- [ ] Glossary Hand-offs, in the PR's last commit: `POST /events` (202 `EventsAccepted`; stored kinds; skipped kinds and unknown sites; 400 `invalid_body`; 401; 429; 503 `unavailable`); `/live` (no token, `query.room`, the three rooms); `asDb` and `Db`; `NearbySites` and `SiteDetail` as proposed; `site_activity_1m`; the API starting without `DATABASE_URL`.
- Verify: the three commands above, with their outputs `{"accepted":1} 202`, the `mx` wake row and `connected`. Paste them.
- Done when: the three outputs are pasted, PR 1 is open, and the glossary's Done line for B1-2.b is on the branch.

### B1-3 Continuous aggregate, glow query, 5 s loop, decay test (2.5 h)

#### B1-3.a Migration 002 creates `site_activity_1m` with real-time aggregation on

**B1-3.a.1** Migration 002 and the reset file. Subagent: `fabi-sql`. Files: `db/migrations/002_site_activity.sql`, `db/reset.sql`.

- [ ] `db/migrations/002_site_activity.sql` holds exactly these statements, in this order, with one comment line above the view saying what it stores. The text is concept PDF section 11.2 B, the 1-minute aggregate only; the hourly one waits for Build 3 (Fabi's decision, hour 6).

```sql
CREATE MATERIALIZED VIEW site_activity_1m WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts)   AS bucket,
       site_id, kind,
       count(*)                      AS n,
       sum(weight)                   AS w,
       hyperloglog(4096, session_id) AS visitors_hll
FROM interaction_events
GROUP BY bucket, site_id, kind
WITH NO DATA;

ALTER MATERIALIZED VIEW site_activity_1m SET (timescaledb.materialized_only = false);

SELECT add_continuous_aggregate_policy('site_activity_1m',
  start_offset      => INTERVAL '2 hours',
  end_offset        => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');
```

- [ ] Comments in the file state these three facts, each next to its line: `WITH NO DATA` stays, because `db:reset` sends the file as one multi-statement query; `materialized_only = false` makes the view include events newer than the last refresh, which the glow loop needs (plan section 9); `visitors_hll` is an approximate count of distinct `session_id`, read by Pulse in Build 3.
- [ ] `db/reset.sql` gets one new statement above the existing `DROP TABLE` line: `DROP MATERIALIZED VIEW IF EXISTS site_activity_1m CASCADE;`, with one comment line: a continuous aggregate is dropped before its hypertable, and every later aggregate is added here in the same commit. The `DROP TABLE` line and its comment stay as they are.
- [ ] The file holds no hourly aggregate, no compression policy, no retention policy and no change to a table of migration 001.
- [ ] If a Tiger docs page shows that one of the three statements is not accepted in this form, or that `hyperloglog(4096, session_id)` does not take a `text` column, stop that line and report it as Blocked with the form the page gives.
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not connect to the database.
- Verify: `grep -c "^CREATE MATERIALIZED VIEW" db/migrations/002_site_activity.sql && grep -c "materialized_only = false" db/migrations/002_site_activity.sql && grep -c "add_continuous_aggregate_policy" db/migrations/002_site_activity.sql && grep -c "^DROP" db/reset.sql`. Paste the output, which is `1`, `1`, `1`, `2` on four lines.
- Done when: the verify command prints `1`, `1`, `1`, `2`. The run against Tiger is this session's check in B1-3.b, not yours.

#### B1-3.b `npm run db:reset` builds the aggregate on Tiger, twice (this session)

- [ ] Re-run the verify command of B1-3.a.1. Commit as `feat(db) added migration 002 with the site_activity_1m aggregate`, with its glossary Done line.
- [ ] `npm run db:reset`, then again on the full database. Each run prints `applied 002_site_activity.sql` and ends with `db:reset done: 6 tables, 1 hypertable, 5 sites`. `git diff --exit-code packages/shared/sites.json` exits 0.
- [ ] The aggregate is there and real-time, and the seed carries the new `glow_k`: `npx tsx --env-file=.env -e "import('./apps/api/src/db/pool.ts').then(async (m) => { const p = m.createPool(); const a = await p.query(\"SELECT view_name, materialized_only FROM timescaledb_information.continuous_aggregates\"); const k = await p.query(\"SELECT DISTINCT glow_k FROM sites\"); console.log(JSON.stringify(a.rows), JSON.stringify(k.rows)); await p.end(); })"` prints `[{"view_name":"site_activity_1m","materialized_only":false}] [{"glow_k":5}]`.
- [ ] If a run fails on the SQL of migration 002 or of `db/reset.sql`, send the error text to `fabi-sql`. If Tiger refuses the migration because it arrives as one multi-statement query, stop and report it to Fabi as Blocked with the error text: the fix would be in `apps/api/src/db/reset.ts`, which runs the statements.
- Verify: `npm run db:reset && npm run db:reset && git diff --exit-code packages/shared/sites.json`. Paste the last line of each run and the output of the query above.
- Done when: both runs end with `db:reset done: 6 tables, 1 hypertable, 5 sites`, the query prints the line above, and the commit with the glossary's Done line for B1-3.b is on `fabi/b1-events`.

#### B1-3.c The glow maths exists twice, as the shipped SQL and as a tested TypeScript twin, and `glow:check` compares them on Tiger

The seam of `fabi/b1-glow` (this session). This is the first work on the branch: `git switch -c fabi/b1-glow` from `fabi/b1-events` after PR 1 is open. If PR 1 has been merged by then, rebase on `origin/main` first.

- [ ] Scripts: `apps/api/package.json` gets `"glow:check": "tsx --env-file-if-exists=../../.env src/glow/check.ts"`, and the root `package.json` gets `"glow:check": "npm run glow:check -w @lampa/api"`.
- [ ] Stub `apps/api/src/glow/glow.ts`: `TAU_S = 21600`, `glowSql` returning `""` and `glowAt` returning `0`, with the signatures above. Stub `apps/api/src/glow/loop.ts`: `startGlowLoop` with the signature above, returning `{ tick: async () => {}, nudge: () => {}, latest: () => null, stop: () => {} }`. Stub `apps/api/src/sites/router.ts`: `parseNear` returning `null` and `createSitesRouter` returning an empty `Router()`. The agents replace the three files.
- [ ] `apps/api/src/app.ts`: one line is added after the events router:

```ts
  app.use(createSitesRouter({ db: deps.db, latestGlow: deps.latestGlow ?? (() => null) }));
```

- [ ] `apps/api/src/index.ts`, whole file:

```ts
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { asDb, createPool } from "./db/pool.js";
import { startGlowLoop } from "./glow/loop.js";
import { attachLive } from "./live/socket.js";
import type { GlowLoop } from "./seam.js";

const port = Number(process.env.PORT) || 3000;
const pool = process.env.DATABASE_URL ? createPool() : undefined;
if (pool) pool.on("error", (err) => console.error(`db pool error: ${err.message}`));
else console.log("DATABASE_URL is not set: events, sites and glow are off");
const db = pool && asDb(pool);

let loop: GlowLoop | undefined;
const latestGlow = () => loop?.latest() ?? null;
const server = createServer(createApp({ db, onEventsStored: () => loop?.nudge(), latestGlow }));
const live = attachLive(server, { origin: process.env.WEB_ORIGIN, latestGlow });
if (db) loop = startGlowLoop({ db, emit: live.emitGlow });
server.listen(port, () => console.log(`api listening on ${port}`));
```
- [ ] Commit as `feat(api) added the glow seam and the glow:check script entries`, with the glossary's Done line for the seam of B1-3.c and a Changes line for the root `package.json` and the second edit of `app.ts` and `index.ts`.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines.
- Done when: the verify command exits 0 with the test counts of `fabi/b1-events`, and the commit is on `fabi/b1-glow`.

**B1-3.c.1** The glow SQL, its TypeScript twin with the decay test, the known events and the `glow:check` script. Subagent: `fabi-realtime`. Files: `apps/api/src/glow/glow.ts`, `apps/api/src/glow/glow.test.ts`, `apps/api/src/glow/known.ts`, `apps/api/src/glow/check.ts`.

- [ ] `apps/api/src/glow/glow.ts` replaces the stub, keeps the three signatures and exports `TAU_S = 21600`, `WINDOW_MS = 86_400_000`, `glowSql` and `glowAt`.
- [ ] `glowSql(sites = "sites s", activity = "site_activity_1m a"): string` returns this text with the two relations put in. It is concept PDF section 11.2 C with three changes: the time is the parameter `$1` in place of `now()`, so the same text can be checked at a fixed time; the query starts from `sites`, so every published site is in the result, and the `COALESCE` sits inside `LEAST` (which skips a NULL and would answer 1.0), so a site with no activity is at glow 0; the result is cast to `float8`, so `pg` returns a JavaScript number.

```sql
SELECT s.id AS site_id,
       LEAST(1.0, COALESCE(sum(a.w * exp(-extract(epoch FROM ($1::timestamptz - a.bucket)) / 21600.0)), 0) / s.glow_k)::float8 AS glow
FROM ${sites}
LEFT JOIN ${activity} ON a.site_id = s.id AND a.bucket > $1::timestamptz - INTERVAL '24 hours'
WHERE s.status = 'published'
GROUP BY s.id, s.glow_k
ORDER BY s.id
```

- [ ] `glowAt(buckets: { bucket: Date; w: number }[], glowK: number, at: Date): number` is the same formula in TypeScript: the sum of `w * Math.exp(-(at - bucket) / 1000 / TAU_S)` over the buckets with `bucket > at - WINDOW_MS`, divided by `glowK`, capped at 1.
- [ ] `apps/api/src/glow/known.ts` exports the known events both checks use: `KNOWN_AT = new Date("2026-11-13T20:00:00.000Z")`; `KNOWN_SITES` = `a` with `glow_k` 5, `b` with 10, `c` with 5, `d` with 5; `KNOWN_ACTIVITY` = site `a`: `w` 1 at `KNOWN_AT`, and `w` 50 at 25 hours before; site `b`: `w` 3 at 6 hours before and `w` 2 at 1 hour before; site `d`: `w` 100 at 1 minute before; site `c`: nothing. `KNOWN_GLOW` = `a` 0.2, `b` 0.279660177, `c` 0, `d` 1.
- [ ] Test file `apps/api/src/glow/glow.test.ts`, the plan's section 8 test. Cases by name: `one wake now at glow_k 5 gives 0.2`; `a weight of 3 from one tau ago gives 3 / e / glow_k`; `after tau times ln 2, about 4 h 9 min, half the light is left`; `the sum is capped at 1`; `a bucket older than 24 hours adds nothing`; `no buckets give 0`; `the known events give a 0.2, b 0.279660177, c 0 and d 1`; `glowSql names tau 21600, the 24 hour window, published sites and float8`.
- [ ] `apps/api/src/glow/check.ts`, the script behind `npm run glow:check`. It reads no table and writes nothing: it runs `glowSql(<sites>, <activity>)` on a client from `createPool()` with `[KNOWN_AT]`, where `<sites>` is a `(VALUES ...) AS s(id, glow_k, status)` list built from `KNOWN_SITES` with `glow_k` cast to `real` and status `'published'`, and `<activity>` is a `(VALUES ...) AS a(site_id, bucket, w)` list built from `KNOWN_ACTIVITY` with `bucket` cast to `timestamptz` and `w` to `real`. It compares each row's `glow` with `glowAt` for that site. All four within 0.000001: it prints `glow:check ok: 4 sites` and exits 0. Otherwise it prints `glow:check failed: <site> sql <value> ts <value>` for each site that differs and exits 1. Without `DATABASE_URL` it prints `DATABASE_URL is not set` and exits 1. It never prints the connection string.
- [ ] Do not run `git add`, `git commit`, `npm install`, `npm run db:reset` or `npm run glow:check`, and do not connect to the database: this session runs `glow:check` on Tiger in B1-3.e. Do not edit `apps/api/src/glow/loop.ts`, `apps/api/src/glow/loop.test.ts`, `apps/api/package.json`, `apps/api/src/index.ts` or `apps/api/src/seam.ts`.
- Verify: `npm run test -w @lampa/api -- src/glow/glow && npm run typecheck`. Paste the summary line.
- Done when: the verify command shows 8 tests passed in `src/glow/glow`, and the typecheck reports no error in `apps/api/src/glow/glow.ts`, `known.ts` or `check.ts`. The run of `glow:check` against Tiger is this session's check in B1-3.e, not yours.

#### B1-3.d The loop runs the glow query every 5 s and at once after an insert, and sends every site

**B1-3.d.1** The glow loop and its tests. Subagent: `fabi-realtime`. Files: `apps/api/src/glow/loop.ts`, `apps/api/src/glow/loop.test.ts`.

- [ ] `apps/api/src/glow/loop.ts` replaces the stub and keeps the signature `startGlowLoop(deps: { db: Db; emit: (message: GlowMessage) => void; intervalMs?: number; now?: () => Date }): GlowLoop`. Named constants: `GLOW_INTERVAL_MS = 5000`, the value of `intervalMs` when it is not given; `NUDGE_MIN_GAP_MS = 1000`.
- [ ] `tick()`: runs `glowSql()` from `./glow.js` with the one parameter `(deps.now ?? (() => new Date()))()`; turns the rows into `{ sites: rows.map((r) => ({ siteId: r.site_id, glow: r.glow })) }`; passes it through `GlowMessage.parse`; keeps it as the latest message; calls `deps.emit` with it. The message holds every row of the query, zeros included: a client keeps the old glow of a site that is left out.
- [ ] `tick()` never rejects. A query that fails, a result that fails the parse, or an `emit` that throws is written with `console.error` as `glow tick failed: ` followed by the error's message; nothing is sent, the latest message stays as it was, and the next tick runs as planned. `npm run db:reset` drops the view under a running API, so a failed tick is normal.
- [ ] One tick at a time: while a tick is running, another call to `tick()` returns the running tick's promise and starts no second query.
- [ ] Starting: `startGlowLoop` calls `tick()` at once, then every `intervalMs` with `setInterval`.
- [ ] `nudge()`: asks for one extra tick soon, at most one per `NUDGE_MIN_GAP_MS`. When a nudge is already waiting, it does nothing. Otherwise it starts a tick after `max(0, NUDGE_MIN_GAP_MS - time since the last tick started)` milliseconds. This is the plan's "Broadcast on insert": `POST /events` calls it after rows are stored, so `/screen` brightens in about a second without a new socket message (Fabi's decision, hour 6).
- [ ] `latest()`: the latest message, or `null` before the first successful tick. `stop()`: clears the interval and a waiting nudge; no tick starts after it.
- [ ] Test file `apps/api/src/glow/loop.test.ts`, with Vitest's fake timers and a fake `Db` whose rows the test sets. No test connects to a database. Cases by name: `a tick sends every row of the query as one GlowMessage, zeros included`; `the query gets the loop's time as its one parameter`; `a glow that arrives as a string is not sent and the latest message stays`; `a failing query is logged, sends nothing, and the next tick still runs`; `an emit that throws does not reject the tick`; `the loop ticks at once and then every 5000 ms`; `a tick that is still running is not started twice`; `nudge runs one extra tick, and a second nudge within 1000 ms adds none`; `latest is null before the first tick and the last message after it`; `stop ends the ticks and a waiting nudge`.
- [ ] Do not run `git add`, `git commit`, `npm install`, `npm run db:reset` or `npm run glow:check`. Do not edit `apps/api/src/glow/glow.ts`, `apps/api/src/glow/known.ts`, `apps/api/src/glow/check.ts`, `apps/api/src/index.ts` or `apps/api/src/seam.ts`.
- Verify: `npm run test -w @lampa/api -- src/glow/loop && npm run typecheck`. Paste the summary line.
- Done when: the verify command shows 10 tests passed in `src/glow/loop`, and the typecheck reports no error in `apps/api/src/glow`. The run against Tiger is this session's check in B1-3.e, not yours.

#### B1-3.e A wake brightens its site over the local socket in under 5 seconds, and PR 2 is open (this session)

This runs after B1-3.c.1, B1-3.d.1 and B1-4.a.1.

- [ ] Re-run the verify commands of B1-3.c.1, B1-3.d.1 and B1-4.a.1, then `npm run typecheck && npm run build && npm test`. Commit B1-3.c.1 as `feat(api) added the glow query, its TypeScript twin and glow:check`, B1-3.d.1 as `feat(api) added the 5 s glow loop with the nudge on insert` and B1-4.a.1 as `feat(api) added GET /sites?near= and GET /sites/:id`, each with its glossary Done line.
- [ ] `npm run glow:check` prints `glow:check ok: 4 sites`. Then break the shipped formula and watch the check fail, restoring it each time: in `glowSql`, `21600.0` becomes `14400.0`, and `npm run glow:check` prints `glow:check failed: b` with both values and exits 1; `24 hours` becomes `48 hours`, and it prints `glow:check failed: a`; the `COALESCE` is moved back outside `LEAST`, and it prints `glow:check failed: c`. Then in `glowAt`, `TAU_S` becomes 14400, and `npm run test -w @lampa/api -- src/glow/glow` fails.
- [ ] Break one rule and watch its test fail, then restore it: the loop's message filtered to `glow > 0`; `parseNear` returning `lng` and `lat` swapped.
- [ ] Start the API in the background with `npm run start -w @lampa/api`. Start a listener in the background that prints each glow message with the seconds since it started, for 20 s: `npx tsx -e "import('socket.io-client').then(({ io }) => { const t = Date.now(); const s = io('http://localhost:3000/live', { query: { room: 'screen' } }); s.on('glow', (m) => console.log(((Date.now() - t) / 1000).toFixed(1), JSON.stringify(m))); setTimeout(() => process.exit(0), 20000); })"`.
- [ ] The first line arrives within a second of the connection and lists the five sites `bastion`, `cathedral`, `mx`, `unirii`, `victoriei`.
- [ ] Note the listener's clock, then send one `wake` at `unirii` with the token and `curl` command of B1-2.b. Within 5 seconds the listener prints a message in which `unirii` is 0.2 higher than before and is at least 0.15, the value from which `/screen` brightens. Record the two times.
- [ ] `curl -s "http://localhost:3000/sites?near=45.7579,21.229"` lists `unirii` first with `distance_m` under 50 and the same glow as the listener's last line; `curl -s "http://localhost:3000/sites/cathedral?lang=ro"` shows `"name":"Catedrala Mitropolitană"`, `"is_memorial":true` and no `persona`.
- [ ] Aggregate lag (plan section 9): wait 3 minutes with the API running, start the listener again, and check that `unirii` is still at its value, less the decay of a few minutes: the refresh policy has moved the event into the materialised part without losing or doubling it.
- [ ] Stop the background API and the listener.
- [ ] `git fetch`, rebase `fabi/b1-glow` on `origin/main`, re-run `npm ci && npm run typecheck && npm run build && npm test`, push, and open PR 2 with `gh pr create`: title `feat(api) glow loop, glow:check and GET /sites`. The PR lists what was verified, the files touched outside `fabi/`, and that migration 002 is already applied to Tiger. Tell Fabi to ask Cristea for the merge.
- Verify: the line `glow:check ok: 4 sites`, the listener's lines around the wake, with the times, and the two `curl` outputs. Paste them.
- Done when: `glow:check` passed and its three breaks were seen to fail, the wake raised `unirii` in the listener within 5 seconds, PR 2 is open, and the glossary's Done lines for B1-3.c, B1-3.d, B1-3.e and B1-4.a are on the branch.

### B1-4 `GET /sites?near=`, `GET /sites/:id` (1 h)

#### B1-4.a Both routes answer from PostGIS, public, with the latest glow

**B1-4.a.1** `GET /sites?near=` and `GET /sites/:id` with tests. Subagent: `fabi-api`. Files: `apps/api/src/sites/**`.

- [ ] `apps/api/src/sites/router.ts` replaces the stub and keeps both signatures.
- [ ] Both routes are public: no `requireVisitor` (concept section 9.9; Fabi's decision, hour 6). One limiter for both, `rateLimit({ windowMs: 60_000, limit: 120 })` from `express-rate-limit`, keyed by IP, with the same shortcut comment as the limiters in `apps/api/src/auth/session.ts`. It is passed to the two routes as a middleware, never with `router.use`: the router is mounted before `GET /health`, and `router.use` would count every request that passes through it.
- [ ] `parseNear(text: unknown): { lat: number; lng: number } | null`: a string of two numbers `<lat>,<lng>`, each finite, `lat` from -90 to 90 and `lng` from -180 to 180. Anything else is `null`.
- [ ] `GET /sites`: `parseNear(req.query.near)`; `null` answers 400 `{ "error": "invalid_near" }`, a missing `near` included. Without `deps.db`: 503 `{ "error": "unavailable" }`. Then one query with `NEAR_SQL` and the parameters `[lng, lat]`, in that order: `ST_MakePoint` takes the longitude first. Each row becomes `{ id, name: row.name.en, lat, lng, is_memorial, distance_m, glow }`, where `glow` is the site's value in `deps.latestGlow()` and 0 when the message is `null` or does not hold the site. Answer 200 with `NearbySites.parse({ sites })`.
- [ ] `NEAR_SQL`, exported, is concept PDF section 11.2 F with the columns of `Site` added; 2000 m and 5 are the PDF's values:

```sql
SELECT id, name, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, is_memorial,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::float8 AS distance_m
FROM sites
WHERE status = 'published'
  AND (active_from IS NULL OR active_from <= now()) AND (active_until IS NULL OR active_until > now())
  AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 2000)
ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
LIMIT 5
```

- [ ] `GET /sites/:id`: without `deps.db`: 503 `{ "error": "unavailable" }`. One query with `SITE_SQL` and `[req.params.id]`. No row: 404 `{ "error": "unknown_site" }`. `lang` is `"ro"` when `req.query.lang` is the string `"ro"`, otherwise `"en"`. The answer is 200 with `SiteDetail.parse` of `{ id, name: row.name[lang], lat, lng, is_memorial, radius_m, interactions, facts, directions_hint, glow }`, where `directions_hint` is `row.directions_hint[lang]`, else `row.directions_hint.en`, else `""`, and `glow` is read as in `GET /sites`. `facts` is the stored array as it is.
- [ ] `SITE_SQL`, exported. It does not select `persona`, so the column cannot leak:

```sql
SELECT id, name, ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng, is_memorial,
       radius_m, interactions, facts, directions_hint
FROM sites
WHERE id = $1 AND status = 'published'
```

- [ ] A query that rejects, on either route: `console.error` with `sites query failed: ` followed by the error's message, then 503 `{ "error": "unavailable" }`.
- [ ] Test file `apps/api/src/sites/router.test.ts`, in the style of `apps/api/src/agent/session.test.ts`: an `express()` app with `createSitesRouter(deps)` on port 0, called with `fetch` and no token; the database is a fake `Db` that records each call and returns the rows the test sets. No test connects to a database. Cases by name: `parseNear reads lat,lng`; `parseNear rejects a missing value, one number, text, three numbers and a latitude of 91`; `near passes the longitude before the latitude to the query`; `near answers NearbySites with the English name, distance_m and the glow of latestGlow`; `glow is 0 while latestGlow is null`; `a missing or malformed near answers 400 invalid_near and runs no query`; `sites/:id answers SiteDetail in Romanian for lang=ro and in English for any other lang`; `directions_hint falls back to en and then to an empty string`; `an unknown id answers 404 unknown_site`; `SITE_SQL does not select persona and the answer holds no persona key`; `without a database both routes answer 503 unavailable`; `a failing query answers 503 unavailable`; `both routes answer without a token`.
- [ ] Do not run `git add`, `git commit`, `npm install` or `npm run db:reset`. Do not edit `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/seam.ts` or `packages/shared/**`.
- Verify: `npm run test -w @lampa/api -- src/sites && npm run typecheck`. Paste the summary line.
- Done when: the verify command shows 13 tests passed in `src/sites`, and the typecheck reports no error in `apps/api/src/sites`. The run against Tiger is this session's check in B1-3.e, not yours.

### B1-last Integrate and hand over (last, this session)

- [ ] Both branches of this block merged into a local throwaway branch from `origin/main`; `npm ci && npm run typecheck && npm run build && npm test && npm run glow:check` green on it. Delete the throwaway branch.
- [ ] `git log --all --name-only` shows no `.env` file in any commit, and `git grep -n -E "postgres://|SESSION_SECRET=." -- . ":!fabi" ":!*.md" ":!.env.example"` prints nothing.
- [ ] PRs pushed and opened in this order: `fabi/b1-events` (in B1-2.b), `fabi/b1-glow` (in B1-3.e). Each PR lists what was verified and what is waiting for a phone.
- [ ] After each merge, once Render shows the deploy live, on the deployed API `https://lampa-api-b45i.onrender.com`:
  - After PR 1: `/health` answers `{"ok":true}`; `curl -s -D - -o /dev/null -H "Origin: https://lampa-timisoara.vercel.app" "https://lampa-api-b45i.onrender.com/socket.io/?EIO=4&transport=polling"` shows status 200 and `access-control-allow-origin: https://lampa-timisoara.vercel.app`; the token, batch and row commands of B1-2.b against the deployed URL print `{"accepted":1} 202` and the `mx` wake row. This is Checkpoint 1, line 2, from `curl`.
  - After PR 2: the listener of B1-3.e against the deployed URL prints the five sites within a second of connecting, and a `wake` at `mx` raises `mx` by 0.2 within 5 seconds.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: `POST /events`; `/live` with its join rule, the `glow` message every 5 s and at once after an insert, every published site in each message; `GET /sites?near=` and `GET /sites/:id` with `NearbySites` and `SiteDetail`; `npm run glow:check`; `site_activity_1m` and the line a later aggregate adds to `db/reset.sql`; `asDb`, `Db`, `LatestGlow` and `createApp(deps)` for routers of other lanes; the weights table, with `candle` and `arrived` at 0; `glow_k` 5; the API starting without `DATABASE_URL`; the fact that `colour` is stored by `POST /panes` in Build 2, and that the talk-turn cap is open for Build 2.
- [ ] Fabi's check on the laptop. Do not mark it done: open the deployed `https://lampa-timisoara.vercel.app/screen` in the browser, press its start button, send one `wake` at `victoriei`, a site no earlier check of this block touched, with `curl` against the deployed API, and see Piața Victoriei brighten within 5 seconds and its line read "Waking, 20%". Then stop the network for 10 seconds and see "Reconnecting to the city…" show and clear.
- [ ] Fabi's check with Ionut and Cristea. Do not mark it done: a tap on Ionut's iPhone at the deployed `/s/mx` sends the `wake`; the row is in `interaction_events` (Checkpoint 1, line 2); `/screen` on Cristea's laptop brightens that site within 5 seconds (line 3); the phone's Site view leaves "Listening for the city…" and shows the glow. This closes Ionut's Blocked row of hour 1 and Cristea's of hour 9.
- [ ] Fabi's check with the team, carried from Setup. Do not mark it done: tell Cristea and Ionut that `Site`, `GlowMessage` and the five ids are accepted and that `sites.json` is on `main`, so both fixtures can be swapped; tell Patrick where the site files are; ask the team for the real coordinates and content of the five sites; show the changed line of plan section 9.
- [ ] Fabi's check with the team, new in this block. Do not mark it done: show `NearbySites` and `SiteDetail` (proposed, in the contract); tell Ionut that `colour` and `echo_approved` sent to `POST /events` are skipped and that `EventIn`, `EventBatch` and `EventsAccepted` are accepted as they are; tell Cristea the join rule of `/live` and that every glow message lists all five sites; tell Patrick that the talk-turn cap of 5 needs a conversation id in Build 2; tell everyone that `glow_k` is 5 and that `npm run db:reset` was run.
- Done when: every box is ticked or listed as Fabi's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: Tiger refusing migration 002 as one multi-statement query; `hyperloglog` refusing a `text` column; a TLS or CORS refusal on the deployed socket; Render dropping the WebSocket upgrade, so clients stay on polling; a refused push to `main`; a schema in `contract.ts` that moved under the seam.
- **Not finished at hour 10:** each ID, what is left, and its place in the cut order. Fabi's order for this block: `GET /sites/:id` first, then `GET /sites?near=`; the rest is never cut and runs on into Checkpoint 1 with Fabi's word.
- **Phone checks for Fabi:** none on a phone of Fabi's. The two checks with Ionut's iPhone and Cristea's laptop are listed in B1-last.
- **For the checkpoint:** what the other lanes should know before integrating. Include: `db:reset` wipes the one database and was run in this block; an event whose `at` is older than a minute can take up to about a minute to show in the glow, because it waits for the aggregate's next refresh; a site's glow is 0.2 per wake at `glow_k` 5; the Cathedral's glow is always 0; the Vercel preview check on Fabi's PRs fails by design.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 1: the spine

- A `wake` posted to the deployed `POST /events` with a visitor token is a row in `interaction_events` with weight 1 and the token's subject (Checkpoint 1, line 2).
- A client on the deployed `/live`, with room `screen` or `site:<id>` and no token, gets a `glow` message on connect, every 5 seconds and within 5 seconds of a stored event; every message lists the five sites, and one `wake` raises its site by 0.2 (Checkpoint 1, line 3).
- `npm test` is green on `main` with `DATABASE_URL` unset (Checkpoint 1, line 4), and `npm run glow:check` prints `glow:check ok: 4 sites` on Tiger.
- `npm run db:reset` builds `site_activity_1m` with `materialized_only` false, on a clean database and on a full one.
- `GET /sites?near=<lat>,<lng>` and `GET /sites/:id` answer `NearbySites` and `SiteDetail` without a token and never send `persona`, or they are listed as moved to Build 2 with Fabi's word.
- No `.env` file, no connection string and no session secret is in any commit.
- Both PRs are open or merged, each with its verify output.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `fabi/GLOSSARY.md` matches the state of the branch.

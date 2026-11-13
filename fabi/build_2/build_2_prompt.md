# Prompt: Fabi's Build 2: Colours and Talk (Fabi, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 7 (2026-11-13 21:15 +0200). Implementation not started.**

You are implementing Fabi's part of Build 2: Colours and Talk (hours 12 to 18 in the plan, started at hour 8) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *the two stations the demo is built around.*

Checkpoint this block must pass (Checkpoint 2, the lines this lane affects):

- *1. A colour caught on a phone appears as a pane on `/screen` within one second.*
- *2. The crowd simulator fills a window to 48, it completes, and a new one starts.*

## 0. Ground rules

- **Fabi takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Fabi, with your recommendation. Nothing uses the recommendation until Fabi answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 14 (2026-11-14 03:21 +0200).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Fabi: carrying on, cutting (plan section 7) or moving it is their decision. Already decided for a late block (Fabi, hour 7): first `get_recent_echo` moves to Build 3 with Cristea's `POST /echoes`; then the simulator sends panes only, no events. Never cut: `POST /panes`, the `pane` and `window_complete` messages, `GET /screen/state`, the slot test, the simulator filling a window.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Fabi, who takes it to the team. This block reads `PaneIn`, `PaneAccepted`, `PaneMessage`, `WindowCompleteMessage` and `ScreenState` as they are on `main` and changes nothing in `packages/shared`. Fabi supports adding a nullable `bin` to `PaneMessage` (Ionut's request); until the team adds it, the message is sent as on `main`.
- The server sets event weights. The client never sends one. `POST /panes` stores the `colour` event with `WEIGHTS.colour` (3) from `apps/api/src/events/weights.ts`.
- No library beyond plan section 3 without Fabi's approval. Approved: none in this block. Already installed and used: `pg` 8.23.1, `zod` 4.6.7, `express-rate-limit` 8.7.4, `socket.io` 4.8.4, `socket.io-client` 4.8.4 (dev), `tsx` 4.23.15. `node:crypto`, `node:util` and `node:assert` are Node built-ins.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `DATABASE_URL`, `SESSION_SECRET` and `AGENT_TOOL_SECRET` are never printed, logged, pasted into the chat or written into any tracked file. A session token fetched for a check is kept in a shell variable and not printed.
- `main` deploys by itself. The docs commit (`fabi/`, the plan update) goes straight to `main` (Fabi's decision, hour 7). After it, work on two branches: `fabi/b2-panes` holds B2-1 and B2-2; `fabi/b2-tools`, started from `fabi/b2-panes`, holds B2-3 and B2-4. One small PR per branch. Open it only after the verify commands pass. Cristea merges, with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. This block makes no ElevenLabs call: the server tools are tested with `curl` against the local API.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. In this block: `POST /panes` at the Cathedral answers 404 `unknown_site`; `get_site_stats` and `get_recent_echo` answer 404 for it; the simulator never sends to it.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. This block builds no screen.
- Write in `fabi/` only. Other members' folders are read-only.
- **Keep `fabi/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Fabi a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work. A Done line's Commit cell is filled in the next commit, as in Build 1.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm run db:reset` wipes the one database that local work and the deployed API share. Only this session runs it, once in B2-2.b, and only after Fabi says the team heads-up is posted.

## 1. Current state (checked at hour 7, 2026-11-13 21:02 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Build 1 is closed for this lane: every B1 ID is under Done, nothing was cut. PR #22 (`fabi/b1-events`, `076b6fb`) and PR #23 (`fabi/b1-glow`, `632187b`) are merged into `main`. Checkpoint 1 passed with Ionut's iPhone and Cristea's `/screen` (glossary, hour 7).
- `origin/main` and the local `main` are at `1063e29`, working tree clean. No open PR. The only remote branch not merged into `main` is `origin/fabi/setup-db` (a glossary diff only).
- Carried over from Build 1: the talk-turn cap of 5 per conversation moves to Build 3 (Fabi's decision, hour 7). The two Blocked rows "tell the team" (hours 5 and 7) are still open and are Fabi's.
- Exists and this block builds on it:
  - `apps/api/src/seam.ts`: `Db`, `LatestGlow`, `Live` (`emitGlow`, `close`), `GlowLoop`, `AppDeps` (`db`, `onEventsStored`, `latestGlow`).
  - `apps/api/src/db/pool.ts`: `createPool()`, `asDb(pool)`. `Db` has only `query`; there is no transaction helper yet (B2-1.a adds `asTx`).
  - `apps/api/src/app.ts`: `createApp(deps)` mounts `sessionRouter`, `express.json()`, `createAgentRouter()` (no deps passed), the events router, the sites router, `/health`.
  - `apps/api/src/index.ts`: http server, `attachLive`, `startGlowLoop` when `DATABASE_URL` is set; `onEventsStored` nudges the loop.
  - `apps/api/src/events/router.ts`: `MAX_EVENT_AGE_MS` (600 000), `toRows`, `userSub`; `weights.ts`: `WEIGHTS.colour` 3.
  - `apps/api/src/live/socket.ts`: `roomsFor`, `attachLive`; rooms `city`, `screen`, `site:<id>`.
  - `apps/api/src/sites/router.ts`: published-and-active condition in `NEAR_SQL`; `sitesLimiter` 120 a minute per IP.
  - `apps/api/src/agent/session.ts` (Cristea's): `SiteStats` `{ glow, coloursToday, lampsToday }`, `AgentDeps.getSiteStats?`, `createAgentRouter(deps = {})`; without `getSiteStats` the stats are 0.
  - `apps/api/src/auth/session.ts` (Cristea's): `requireVisitor`, `visitorLimiter` (120 a minute per subject), `POST /session/anon` limited to 10 a minute per IP.
  - `db/migrations/001_init.sql`: `windows` (`site_id` NULL is the Gallery, `slots` 48, `completed_at`), `panes` (`UNIQUE (window_id, slot)`, `author_sub`, `anon_id`, `caught_at`), `echoes` (`status`, `transcript`, `lang`, `created_at`). `002_site_activity.sql`: `site_activity_1m`. `db/reset.sql` drops the view, then six tables.
  - `apps/api/src/db/reset.ts` prints `db:reset done: 6 tables, 1 hypertable, 5 sites` from a fixed list of six tables and one hypertable (B2-1.a extends it).
  - `content/sites/*.yaml`: `interactions: [talk, colours, lamp, echo]` for the four persona sites, `[listen, candle]` for the Cathedral.
  - `packages/shared/src/contract.ts`: `PaneIn` (`siteId` "gallery" in remote mode, `hue`, `saturation`, `lightness`, `hex` lowercase, `bin` nullable, `at`), `PaneAccepted` (201 `{ windowId, slot, count, completed }`, 429 with `Retry-After`), `PaneMessage` `{ siteId, windowId, slot, hex }`, `WindowCompleteMessage` `{ siteId, windowId }`, `ScreenState` `{ windows: [{ siteId, windowId, panes: (hex | null) × 48 }], coloursToday }`. `packages/shared/src/colours.ts`: `hueBin(hue)`.
  - `.env.example` names `AGENT_TOOL_SECRET`.
- Does not exist yet, and the subtask that adds it: `apps/api/src/panes/` (B2-1.a, B2-1.b.1, B2-1.d.1); `emitPane`, `emitWindowComplete` (B2-1.c.1); `asTx`, `apps/api/src/db/today.ts` (B2-1.a); `db/migrations/003_colour.sql` (B2-2.a.1); `apps/api/src/stats/`, `apps/api/src/tools/` (B2-3.a, B2-3.b.1); `scripts/simulate-crowd.ts` and the root script `simulate:crowd` (B2-3.a, B2-4.a.1).
- Waiting on this lane: Ionut's Blocked rows of hour 5 (`POST /panes`; `pane` on the site room) and Cristea's of hour 12 (live panes with `GET /screen/state`; `getSiteStats` in `app.ts`). This lane's own "Needs from others" line in plan section 11 names only `requireVisitor` (landed in Build 1). Nothing this block needs from others is outstanding.
- How the clients read this block's output: Ionut's phone (`apps/web/src/colour/panes.ts`) drops a pane on 429 and on any other 4xx, retries on 5xx, 401 and network errors every 2 s, and predicts the lowest empty slot (`nextEmptySlot`); `useSiteGlow` joins `site:<id>` and folds `pane`. Cristea's `/screen` (`apps/web/src/screen/useScreenSocket.ts`, `windows.ts`) joins `screen`, fetches `GET /screen/state` with no header on every connect, ignores site ids it does not draw (the Cathedral, "gallery"), adds 1 to `coloursToday` per `pane`, and on `window_complete` empties the window only when its `windowId` matches, so `pane` must arrive before `window_complete`.
- Scripts the verify commands use (root `package.json`): `typecheck`, `build`, `test`, `db:reset`, `glow:check`; `apps/api`: `test` (Vitest), `typecheck`, `dev`, `start`. `simulate:crowd` is added in B2-3.a.
- Baseline at hour 7: `npm run typecheck` exit 0; `npm test` → API `Tests 89 passed (89)`, web `Tests 169 passed (169)`.
- Deployed at 21:02: web `https://lampa-timisoara.vercel.app` → 200; API `https://lampa-api-b45i.onrender.com/health` → 200; `POST /panes` → 404; `GET /screen/state` → 404.
- ElevenLabs server tools (docs read at hour 7, https://elevenlabs.io/docs/eleven-agents/customization/tools/server-tools): a webhook tool has a method, a URL, path, query or JSON body parameters, and headers, where a header can be a stored secret. The page does not say how a parameter is filled from a dynamic variable; how the agent fills `site_id` is Patrick's tool configuration.
- Devices: Fabi has a laptop only (Decisions, hour 6). The phone check of Checkpoint 2 line 1 runs with Ionut's iPhone and Cristea's `/screen`.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 2: Colours and Talk, Fabi's rows, and Checkpoint 2 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Fabi's table and "Needs from others" | All |
| `IMPLEMENTATION_PLAN.md` | Section 7, cut order; section 8, the pane test row | B2-1, B2-last |
| `fabi/GLOSSARY.md` | Whole file | All |
| `packages/shared/src/contract.ts` | `PaneIn`, `PaneAccepted`, `PaneMessage`, `WindowCompleteMessage`, `ScreenState`, `EventBatch`, `SocketMessage` | B2-1, B2-4 |
| `packages/shared/src/colours.ts`, `sites.ts` | `hueBin`; `sites` | B2-3, B2-4 |
| `apps/api/src/seam.ts`, `app.ts`, `index.ts`, `db/pool.ts` | Whole files | All |
| `apps/api/src/events/router.ts`, `weights.ts`, `router.test.ts` | Whole files: the 10-minute rule, the weights, the test style | B2-1.b.1 |
| `apps/api/src/sites/router.ts` | `NEAR_SQL` (published and active), `sitesLimiter` | B2-1.b.1, B2-1.d.1 |
| `apps/api/src/live/socket.ts`, `socket.test.ts` | Whole files | B2-1.c.1 |
| `apps/api/src/agent/session.ts` | `SiteStats`, `AgentDeps`, `createAgentRouter` signature | B2-3 |
| `apps/api/src/auth/session.ts` | `requireVisitor`, `visitorLimiter`, `Visitor`, `POST /session/anon` and its limiter | B2-1.b.1, B2-4 |
| `db/migrations/001_init.sql`, `002_site_activity.sql`, `db/reset.sql`, `apps/api/src/db/reset.ts` | Whole files | B2-1.a, B2-2 |
| `apps/web/src/colour/panes.ts`, `apps/web/src/screen/useScreenSocket.ts`, `apps/web/src/screen/windows.ts`, `apps/web/src/phone/useSiteGlow.ts` | Whole files, read only: what the two clients send, retry and parse | B2-1 |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Section 11.2 E (`colour_readings`, `colour_1h`) | B2-2.a.1 |
| `scripts/agent-check.ts` | Whole file: the import style of a root script | B2-4.a.1 |
| Tiger docs | `CREATE MATERIALIZED VIEW` with `timescaledb.continuous`, `materialized_only`, `add_continuous_aggregate_policy` | B2-2.a.1 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| `POST /panes`: rate limit, slot assignment, window completes at 48, archive and open a new one, broadcast. Test for slot and completion logic | 2.5 | B2-1.a, B2-1.b, B2-1.c, B2-1.e |
| `GET /screen/state` (added to the `POST /panes` row, Fabi's decision, hour 7) | in the 2.5 | B2-1.d |
| `colour_readings` hypertable and the `colour_1h` aggregate | 0.5 | B2-2.a, B2-2.b |
| Agent server tools `get_site_stats` and `get_recent_echo`, behind a shared-secret header | 1 | B2-3.a, B2-3.b, B2-3.c |
| `getSiteStats` passed to `GET /agent/session` (added to the server tools row, Fabi's decision, hour 7) | in the 1 | B2-3.a, B2-3.b |
| `scripts/simulate-crowd.ts`, minimal: fake sessions sending events and panes. Everyone uses it from here on to develop without phones | 1 | B2-3.a, B2-4.a, B2-4.b |
| Section 8: Pane slot assignment and window completion at 48 | in B2-1 | B2-1.b |
| `DESIGN.md` section 9: no Fabi item in Build 2 (item 12, Pulse, is Build 3) | 0 | none |
| Checkpoint 2, line 1: A colour caught on a phone appears as a pane on `/screen` within one second. | team | B2-1.e, B2-last |
| Checkpoint 2, line 2: The crowd simulator fills a window to 48, it completes, and a new one starts. | team | B2-4.b, B2-last |

Total: 5 h of tasks in a 6 h block (hours 8 to 14).

Order: B2-0, then B2-1.a (the seam, this session). Then B2-1.b.1 (`fabi-api`), B2-1.c.1 (`fabi-realtime`) and B2-2.a.1 (`fabi-sql`) in parallel. Then B2-1.d.1 (`fabi-api`). Then B2-2.b and B2-1.e (this session, on Tiger) and PR 1, because Ionut and Cristea wait on it. Then B2-3.a (the second seam, this session), then B2-3.b.1 (`fabi-api`) and B2-4.a.1 (`fabi-realtime`) in parallel, then B2-3.c and B2-4.b (this session) and PR 2. B2-last ends the block.

The seams. This session writes them as exact code and commits them before starting the agents.

Seam 1, on `fabi/b2-panes` (B2-1.a):

```ts
// apps/api/src/seam.ts: replace the Live and AppDeps types, add Tx and OnPane. Owner: this session.
import type { GlowMessage, PaneMessage, WindowCompleteMessage } from "@lampa/shared";

/** Runs fn on one client between BEGIN and COMMIT; ROLLBACK and rethrow on error. `asTx(pool)` in `db/pool.ts` makes one. */
export type Tx = <T>(fn: (db: Db) => Promise<T>) => Promise<T>;

/** `attachLive` in `live/socket.ts` returns this. */
export type Live = {
  emitGlow: (message: GlowMessage) => void;
  emitPane: (message: PaneMessage) => void;
  emitWindowComplete: (message: WindowCompleteMessage) => void;
  close: () => Promise<void>;
};

/** Called after a pane is committed: its message, and whether it completed its window. */
export type OnPane = (pane: PaneMessage, completed: boolean) => void;

export type AppDeps = { db?: Db; tx?: Tx; onEventsStored?: () => void; onPane?: OnPane; latestGlow?: LatestGlow };
```

```ts
// apps/api/src/db/pool.ts: append. Owner: this session.
export const asTx = (pool: pg.Pool): Tx => async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({ query: (text, params) => client.query(text, params) });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};
```

```ts
// apps/api/src/db/today.ts: new. Owner: this session.
/** SQL for local midnight today in Timișoara, as a timestamptz. */
export const TODAY_START_SQL = "(date_trunc('day', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest')";
```

```ts
// apps/api/src/panes/slots.ts: new, constants only. Owner after the seam: fabi-api (B2-1.b.1 adds the functions).
export const WINDOW_SLOTS = 48;
export const PANES_PER_HOUR = 5; // per visitor subject per site (the Gallery is one site), Fabi's decision, hour 7
export const RATE_WINDOW_MS = 3_600_000;
export const GALLERY_SITE_ID = "gallery";
```

```ts
// apps/api/src/panes/router.ts: stub. Owner after the seam: fabi-api (B2-1.b.1).
import { Router } from "express";
import type { OnPane, Tx } from "../seam.js";
export type PanesDeps = { tx?: Tx; onPane?: OnPane; now?: () => Date };
export function createPanesRouter(_deps: PanesDeps): Router {
  return Router();
}

// apps/api/src/panes/state.ts: stub. Owner after the seam: fabi-api (B2-1.d.1).
import { Router } from "express";
import type { Db } from "../seam.js";
export function createScreenStateRouter(_deps: { db?: Db }): Router {
  return Router();
}
```

```ts
// apps/api/src/live/socket.ts: the returned object gains two stubs until B2-1.c.1. Owner after the seam: fabi-realtime.
    emitPane: () => {
      throw new Error("emitPane is not implemented");
    },
    emitWindowComplete: () => {
      throw new Error("emitWindowComplete is not implemented");
    },
```

```ts
// apps/api/src/app.ts: after the sites router. Owner: this session (Cristea's file, approved by Fabi, hour 7).
  app.use(createPanesRouter({ tx: deps.tx, onPane: deps.onPane }));
  app.use(createScreenStateRouter({ db: deps.db }));

// apps/api/src/index.ts: the pool also gives a Tx; onPane emits pane, then window_complete, then nudges glow.
const tx = pool && asTx(pool);
const onPane: OnPane = (pane, completed) => {
  live.emitPane(pane);
  if (completed) live.emitWindowComplete({ siteId: pane.siteId, windowId: pane.windowId });
  loop?.nudge();
};
const server = createServer(createApp({ db, tx, onEventsStored: () => loop?.nudge(), onPane, latestGlow }));
```

`apps/api/src/db/reset.ts`: the table list gains `colour_readings` and the hypertable query counts `hypertable_name IN ('interaction_events', 'colour_readings')`; the last line prints `db:reset done: ${t} tables, ${h} hypertables, ${s} sites`. Expected after B2-2.a.1: `db:reset done: 7 tables, 2 hypertables, 5 sites`.

Seam 2, on `fabi/b2-tools` (B2-3.a):

```ts
// apps/api/src/stats/stats.ts: stub. Owner after the seam: fabi-api (B2-3.b.1).
import type { SiteStats } from "../agent/session.js";
import type { Db, LatestGlow } from "../seam.js";
export function createGetSiteStats(_deps: { db: Db; latestGlow: LatestGlow }): (siteId: string) => Promise<SiteStats> {
  return async () => ({ glow: 0, coloursToday: 0, lampsToday: 0 });
}

// apps/api/src/tools/router.ts: stub. Owner after the seam: fabi-api (B2-3.b.1).
import { Router } from "express";
import type { SiteStats } from "../agent/session.js";
import type { Db } from "../seam.js";
export function createToolsRouter(_deps: { db?: Db; getSiteStats?: (siteId: string) => Promise<SiteStats> }): Router {
  return Router();
}
```

```ts
// apps/api/src/app.ts: getSiteStats for both routers. Owner: this session (approved by Fabi, hour 7).
  const getSiteStats = deps.db ? createGetSiteStats({ db: deps.db, latestGlow: deps.latestGlow ?? (() => null) }) : undefined;
  app.use(createAgentRouter({ getSiteStats })); // replaces createAgentRouter()
  app.use(createToolsRouter({ db: deps.db, getSiteStats })); // after the screen state router
```

Root `package.json` gains `"simulate:crowd": "tsx scripts/simulate-crowd.ts"`.

### 3.1 Subagents

Fabi asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Fabi, re-runs the checks, writes the glossary and does the first and last tasks, the seams and the checks on Tiger. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `fabi-sql` | Migration 003 and `db/reset.sql` | opus | reused from Setup, scope updated for Build 2 |
| `fabi-api` | Express routers with pg and Zod: `POST /panes`, `GET /screen/state`, site stats, server tools, with tests | sonnet | reused from Setup, scope updated for Build 2 |
| `fabi-realtime` | Socket.IO pane and window messages with tests; the crowd simulator script | opus | reused from Build 1, scope updated for Build 2 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B2-1.b.1 | `fabi-api` | `POST /panes`, slot and completion functions, tests | `apps/api/src/panes/router.ts`, `router.test.ts`, `slots.ts`, `slots.test.ts` | after B2-1.a, parallel with B2-1.c.1 and B2-2.a.1 |
| B2-1.c.1 | `fabi-realtime` | `emitPane`, `emitWindowComplete`, `paneRooms`, tests | `apps/api/src/live/socket.ts`, `socket.test.ts` | after B2-1.a, parallel with B2-1.b.1 and B2-2.a.1 |
| B2-2.a.1 | `fabi-sql` | Migration 003 and the reset lines | `db/migrations/003_colour.sql`, `db/reset.sql` | after B2-1.a, parallel with B2-1.b.1 and B2-1.c.1 |
| B2-1.d.1 | `fabi-api` | `GET /screen/state`, tests | `apps/api/src/panes/state.ts`, `state.test.ts` | after B2-1.b.1 |
| B2-3.b.1 | `fabi-api` | `getSiteStats`, `POST /tools/*`, tests | `apps/api/src/stats/stats.ts`, `stats.test.ts`, `apps/api/src/tools/router.ts`, `router.test.ts` | after B2-3.a, parallel with B2-4.a.1 |
| B2-4.a.1 | `fabi-realtime` | `scripts/simulate-crowd.ts` | `scripts/simulate-crowd.ts` | after B2-3.a, parallel with B2-3.b.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Fabi to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Fabi. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Fabi, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B2-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`, `npm run glow:check`. Expected: exit 0, API `Tests 89 passed (89)`, web `Tests 169 passed (169)`, `glow:check ok: 4 sites`.
- [ ] Re-check section 1: open PRs, `origin/main`, the Blocked and Hand-offs sections of `ionut/`, `cristea/` and `patrick/GLOSSARY.md`, and whether `packages/shared/src/contract.ts` changed since `1063e29` (a `bin` on `PaneMessage` would change B2-1.b.1: the message then copies `bin` from `PaneIn`). Record the answers.
- [ ] `git check-ignore -q .env && grep -c "^AGENT_TOOL_SECRET=." .env` → record whether Fabi has put the secret in the local `.env` (needed in B2-3.c; the value is never printed).
- [ ] The docs commit (this prompt, the glossary lines, the plan update) is on `main`. Then `git switch -c fabi/b2-panes`.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently.

### B2-1 `POST /panes`, windows, completion at 48, test (2.5 h, with `GET /screen/state`)

#### B2-1.a The seam is committed (this session)

- [ ] Seam 1 of section 3, exactly as written, on `fabi/b2-panes`.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines (API 89, web 169).
- Done when: the stubs compile, the existing tests pass, and the seam is one commit.

#### B2-1.b A caught colour gets its slot, closes its window at 48 and is stored

**B2-1.b.1** `POST /panes`. Subagent: `fabi-api`. Files: `apps/api/src/panes/router.ts`, `router.test.ts`, `slots.ts`, `slots.test.ts`.

- [ ] `slots.ts` keeps the four constants of the seam and adds four pure functions:
  - `paneAuthor(visitor: Visitor): { author_sub: string | null; anon_id: string | null }`: `author_sub` is `visitor.sub` for an Auth0 visitor, `anon_id` is `visitor.sub` for an anonymous one, the other is `null`.
  - `lowestEmptySlot(filled: number[]): number | null`: the lowest integer from 0 to `WINDOW_SLOTS - 1` not in `filled`, in any order of `filled`; `null` when all 48 are taken.
  - `retryAfterS(oldest: Date, now: Date): number`: `Math.max(1, Math.ceil((oldest.getTime() + RATE_WINDOW_MS - now.getTime()) / 1000))`.
  - `paneTs(at: string, now: Date): string`: `at` when it lies between `now - MAX_EVENT_AGE_MS` (imported from `../events/router.js`) and `now`, both ends included; otherwise `now.toISOString()` (Fabi's decision, hour 7: the same rule as `POST /events`).
- [ ] `createPanesRouter(deps: PanesDeps)` mounts `POST /panes` with `requireVisitor`, then `visitorLimiter`, then the handler. The handler, in this order:
  1. `PaneIn.safeParse(req.body)`; failure → 400 `{ "error": "invalid_body" }`.
  2. No `deps.tx` → 503 `{ "error": "unavailable" }`.
  3. `now = (deps.now ?? (() => new Date()))()`, `ts = paneTs(pane.at, now)`, `site = pane.siteId === GALLERY_SITE_ID ? null : pane.siteId`. Everything below runs in one `deps.tx(async (db) => …)`.
  4. A site that is not the Gallery must exist with `status = 'published'`, the active condition of `NEAR_SQL` (`(active_from IS NULL OR active_from <= now()) AND (active_until IS NULL OR active_until > now())`) and `'colours' = ANY(interactions)`; otherwise the answer is 404 `{ "error": "unknown_site" }` and nothing is written. The Cathedral fails this check (Fabi's decision, hour 7).
  5. `SELECT pg_advisory_xact_lock(hashtext($1))` with `'panes:' + pane.siteId`, so two panes at one site are placed one after the other and never open two windows (Fabi's decision, hour 7).
  6. Rate limit: count the visitor's panes at this site (Gallery: windows with `site_id IS NULL`) whose `caught_at` is after `now` minus one hour, matching `coalesce(author_sub, anon_id) = visitor.sub`, and the oldest `caught_at` of them. At `PANES_PER_HOUR` (5) or more → 429 `{ "error": "rate_limited" }` with the header `Retry-After: retryAfterS(oldest, now)`, and nothing is written.
  7. The open window: `site_id IS NOT DISTINCT FROM $1 AND completed_at IS NULL`, newest `started_at` first, one row; none → `INSERT INTO windows (site_id) VALUES ($1) RETURNING id` (Fabi's decision, hour 7: a window opens when its first pane arrives, so after a completion the next pane opens the new one).
  8. `slot = lowestEmptySlot(slots of that window)`.
  9. `INSERT INTO panes (window_id, slot, hue, saturation, lightness, hex, author_sub, anon_id, caught_at)`: `author_sub` and `anon_id` from `paneAuthor(visitor)`; `caught_at` is `ts`.
  10. `INSERT INTO colour_readings (ts, site_id, session_id, hue, saturation, lightness)` with `ts`, `pane.siteId` (`gallery` for the Gallery), `visitor.sub`.
  11. Not the Gallery: `INSERT INTO interaction_events (ts, session_id, user_sub, site_id, kind, weight)` with `ts`, `visitor.sub`, `userSub(visitor)`, the site, `colour`, `WEIGHTS.colour`. The Gallery stores no interaction event (Fabi's decision, hour 7).
  12. `count` = slots taken before plus 1; `completed = count === WINDOW_SLOTS`; when completed, `UPDATE windows SET completed_at = now() WHERE id = $1`.
  13. After the commit: 201 with `PaneAccepted.parse({ windowId, slot, count, completed })`, then `deps.onPane?.({ siteId: pane.siteId, windowId, slot, hex: pane.hex }, completed)` inside a `try`, logging only the error message if it throws, so a socket failure never changes the answer.
  14. Any thrown error from the transaction → 503 `{ "error": "unavailable" }`, logged as `panes insert failed: <message>`, and `onPane` is not called.
- [ ] Ids are sent as text (`id::text` or `String(id)`), so `windowId` is the uuid string.
- [ ] `slots.test.ts`, cases by name: "an empty window gives slot 0"; "the lowest gap wins: 0, 1, 3 gives 2"; "47 taken in any order gives the missing one"; "48 taken gives null"; "Retry-After is the seconds until the oldest pane is an hour old"; "Retry-After is at least 1"; "paneTs keeps an at from 9 minutes ago"; "paneTs replaces an at older than 10 minutes with now"; "paneTs replaces a future at with now"; "an anonymous visitor's sub goes to anon_id"; "an Auth0 visitor's sub goes to author_sub" (a pure test: a router test cannot sign an Auth0 token without the JWKS).
- [ ] `router.test.ts`, with a fake `tx` that records each query and its parameters and answers from a script, a real visitor token signed as in `apps/api/src/events/router.test.ts`, and `createApp` or the router mounted on an Express app the same way that test does. Cases by name: "a valid pane answers 201 with windowId, slot, count and completed false"; "the pane, the reading and the colour event share one ts"; "the colour event carries weight 3"; "the 48th pane answers completed true, closes the window and calls onPane with completed true"; "no open window inserts one with the site id"; "the sixth pane in an hour answers 429 with Retry-After and writes nothing"; "a Gallery pane opens a window with a null site, stores a reading with site_id gallery and no interaction event"; "the Cathedral answers 404 unknown_site and writes nothing"; "an unknown site answers 404 unknown_site"; "a body that fails PaneIn answers 400 invalid_body"; "no token answers 401"; "no tx answers 503"; "a failing query answers 503 and onPane is not called"; "onPane throwing still answers 201"; "an anonymous visitor's sub goes to anon_id in the pane insert".
- Verify: `npm run test -w @lampa/api -- src/panes && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with `lowestEmptySlot` changed to return the highest empty slot, or `completed` changed to `count === WINDOW_SLOTS - 1`, at least one case fails (this session checks both, then restores).

#### B2-1.c `pane` and `window_complete` reach `/screen` and the site's phones

**B2-1.c.1** Pane messages on `/live`. Subagent: `fabi-realtime`. Files: `apps/api/src/live/socket.ts`, `socket.test.ts`.

- [ ] `export function paneRooms(siteId: string): string[]`: `["screen"]` for `GALLERY_SITE_ID` (imported from `../panes/slots.js`), otherwise `["site:" + siteId, "screen"]` (Fabi's decision, hour 7).
- [ ] `emitPane(message)`: `PaneMessage.parse(message)` first, so an invalid message throws and nothing is sent; then `live.to(paneRooms(siteId)).emit(SocketMessage.enum.pane, parsed)`. `emitWindowComplete(message)`: the same with `WindowCompleteMessage` and `SocketMessage.enum.window_complete`. Each socket gets each message once even when it is in two of the rooms.
- [ ] The two stubs of the seam are replaced. `roomsFor`, `emitGlow` and `close` do not change.
- [ ] `socket.test.ts` adds, with real `socket.io-client` clients, cases by name: "a pane reaches the screen room and its site room"; "a pane does not reach another site's room or a city-only socket"; "a Gallery pane reaches only the screen room"; "window_complete reaches the screen room and its site room"; "an invalid pane throws and nothing is sent"; "pane then window_complete arrive in that order".
- Verify: `npm run test -w @lampa/api -- src/live && npm run typecheck`. Paste the summary line.
- Done when: the eight existing cases and the new ones pass, and with the `PaneMessage.parse` removed the invalid-pane case fails (this session checks, then restores).

#### B2-1.d `/screen` gets the open windows and today's count on every connect

**B2-1.d.1** `GET /screen/state`. Subagent: `fabi-api`. Files: `apps/api/src/panes/state.ts`, `state.test.ts`.

- [ ] `createScreenStateRouter({ db })` mounts `GET /screen/state`: public, no token, its own `rateLimit({ windowMs: 60_000, limit: 120 })` per IP (the same values as `sitesLimiter`, with the same `shortcut:` comment), no `Cache-Control` header.
- [ ] `export const WINDOWS_SQL`: every window with `completed_at IS NULL AND site_id IS NOT NULL`, with its `site_id`, `id::text` and its panes as `(slot, hex)` pairs (an open window with no pane yet gives an empty list).
- [ ] `export const COLOURS_TODAY_SQL`: `count(*)::int` of panes in windows with `site_id IS NOT NULL` and `caught_at >= ${TODAY_START_SQL}` (from `../db/today.js`). The Gallery is not counted (Fabi's decision, hour 7).
- [ ] `export function toScreenState(rows, coloursToday): ScreenState`: one entry per row, `panes` an array of 48 with the hex at each slot and `null` elsewhere, passed through `ScreenState.parse`.
- [ ] Answers: 200 with the `ScreenState`; no `db` → 503 `{ "error": "unavailable" }`; a failing query → 503, logged as `screen state failed: <message>`.
- [ ] `state.test.ts`, cases by name: "an open window lists 48 entries with each hex at its slot and null elsewhere"; "a window with no panes lists 48 nulls"; "no open windows gives an empty list"; "coloursToday passes through"; "GET /screen/state answers 200 with a body that parses as ScreenState"; "no db answers 503"; "a failing query answers 503"; "no token is needed".
- Verify: `npm run test -w @lampa/api -- src/panes && npm run typecheck`. Paste the summary line.
- Done when: every case passes.

#### B2-1.e On Tiger: panes, slots, the 429, the Gallery, the Cathedral, the messages (this session)

Runs after B2-2.b.

- [ ] Local API with `npm run dev -w @lampa/api` on the root `.env`. Four anonymous tokens from `POST /session/anon`, kept in shell variables, never printed. A Socket.IO listener in room `screen` and one in `site:unirii`, printing every `pane` and `window_complete` with the time.
- [ ] One pane at `unirii` → 201 `{ windowId, slot: 0, count: 1, completed: false }`; both listeners print the `pane` within one second; rows in `panes`, `colour_readings` and `interaction_events` (`kind` colour, `weight` 3) with the same `ts`.
- [ ] Two panes at `unirii` sent at the same moment with two tokens → two different slots, one window.
- [ ] Five more panes with one token → the sixth answer of that token in the hour is 429 with a `Retry-After` header.
- [ ] A Gallery pane → 201, a window with `site_id` NULL, a reading with `site_id` `gallery`, no new `interaction_events` row; only the `screen` listener prints it.
- [ ] A pane at `cathedral` → 404 `unknown_site`.
- [ ] `GET /screen/state` → a body that parses as `ScreenState` listing the `unirii` window with its panes, and `coloursToday` equal to the panes at sites today.
- [ ] Completion at 48 is checked in B2-4.b with the simulator.
- [ ] `npm run typecheck && npm run build && npm test && npm run glow:check`, then rebase on `origin/main`, push `fabi/b2-panes`, open PR 1 listing what was verified and what waits for a phone.
- Verify: the answers, rows and listener lines above, pasted.
- Done when: every line above holds on Tiger and PR 1 is open.

### B2-2 `colour_readings` and `colour_1h` (0.5 h)

#### B2-2.a Migration 003 holds the readings and the hourly aggregate

**B2-2.a.1** Migration 003. Subagent: `fabi-sql`. Files: `db/migrations/003_colour.sql`, `db/reset.sql`.

- [ ] `003_colour.sql`, in this order, each statement with a one-line comment in the style of 001 and 002 (Fabi's decision, hour 7: concept 11.2 E with `session_id` as text):
  - `CREATE TABLE colour_readings (ts timestamptz NOT NULL, site_id text NOT NULL, session_id text, hue real, saturation real, lightness real);` with comments that `site_id` is a site id or `gallery`, and `session_id` the token subject as in `interaction_events`.
  - `SELECT create_hypertable('colour_readings', by_range('ts', INTERVAL '1 day'));`
  - `CREATE MATERIALIZED VIEW colour_1h WITH (timescaledb.continuous) AS SELECT time_bucket('1 hour', ts) AS bucket, site_id, count(*) AS panes, sum(sin(radians(hue))) AS hue_sin, sum(cos(radians(hue))) AS hue_cos, avg(lightness) AS lightness FROM colour_readings GROUP BY bucket, site_id WITH NO DATA;` with the 11.2 E comment that hue is averaged as a vector.
  - `ALTER MATERIALIZED VIEW colour_1h SET (timescaledb.materialized_only = false);`
  - `SELECT add_continuous_aggregate_policy('colour_1h', start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '30 minutes');`
- [ ] `db/reset.sql`: `DROP MATERIALIZED VIEW IF EXISTS colour_1h CASCADE;` next to the `site_activity_1m` line, and `colour_readings` appended to the `DROP TABLE IF EXISTS` list. Nothing else changes.
- [ ] Check the three Tiger docs pages of section 2 for the statements before writing them.
- Verify: `grep -c "create_hypertable" db/migrations/003_colour.sql` → `1`; `grep -c "materialized_only = false" db/migrations/003_colour.sql` → `1`; `grep -c "add_continuous_aggregate_policy" db/migrations/003_colour.sql` → `1`; `grep -c "colour_1h\|colour_readings" db/reset.sql` → `2`. Paste the four counts.
- Done when: the four counts match and the file is plain SQL that runs as one multi-statement query (no `BEGIN`, no psql meta-commands).

#### B2-2.b The migration runs on Tiger (this session)

- [ ] Fabi confirms the team heads-up is posted (the database is wiped). Then `npm run db:reset && npm run db:reset && git diff --exit-code packages/shared/sites.json`.
- [ ] Query: `colour_1h` in `timescaledb_information.continuous_aggregates` with `materialized_only` false; `colour_readings` in `timescaledb_information.hypertables`; one job for `colour_1h` in `timescaledb_information.jobs`.
- Verify: `applied 003_colour.sql` and `db:reset done: 7 tables, 2 hypertables, 5 sites` twice, diff empty, the three query results. Paste them.
- Done when: the migration builds on a clean and on a full database.

### B2-3 Agent server tools behind a secret header, and `getSiteStats` (1 h)

#### B2-3.a The second seam is committed (this session)

- [ ] After PR 1 is open: `git switch -c fabi/b2-tools` from `fabi/b2-panes`. Seam 2 of section 3, exactly as written.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary lines.
- Done when: the stubs compile and the existing tests pass, in one commit.

#### B2-3.b The persona can ask for live numbers and a recent echo

**B2-3.b.1** Site stats and `POST /tools/*`. Subagent: `fabi-api`. Files: `apps/api/src/stats/stats.ts`, `stats.test.ts`, `apps/api/src/tools/router.ts`, `router.test.ts`.

- [ ] `stats.ts`: `export const STATS_SQL`, one query giving `colours_today` (`count(*)::int` of panes in windows with `site_id = $1` and `caught_at >= ${TODAY_START_SQL}`) and `lamps_today` (`count(*)::int` of `interaction_events` with `kind = 'lamp'` and `ts >= ${TODAY_START_SQL}`, every site). `createGetSiteStats({ db, latestGlow })` returns `async (siteId) => SiteStats` with `glow` = the site's value in `latestGlow()`, 0 when there is no message or no entry; `coloursToday` per site; `lampsToday` city-wide (Fabi's decision, hour 7). A failing query throws.
- [ ] `tools/router.ts`: `createToolsRouter({ db, getSiteStats })` mounts, for every path under `/tools`, a secret check first: `process.env.AGENT_TOOL_SECRET` read per request; unset or empty → 503 `{ "error": "unavailable" }`; the header `X-Agent-Secret` missing or different → 401 `{ "error": "unauthorized" }`, compared with `crypto.timingSafeEqual` on equal-length buffers (a length difference is a mismatch). No rate limiter (Fabi's decision, hour 7: the secret guards it).
- [ ] Body for both tools: `z.object({ site_id: z.string() })`; failure → 400 `{ "error": "invalid_body" }`. `site_id` must be a non-memorial id of `sites` from `@lampa/shared`, otherwise 404 `{ "error": "unknown_site" }` (the Cathedral included).
- [ ] `POST /tools/get_site_stats` → 200 `{ "glow": number, "colours_today": number, "lamps_lit_today": number }` from `getSiteStats`; no `getSiteStats` or a throw → 503 `{ "error": "unavailable" }`.
- [ ] `POST /tools/get_recent_echo` → `export const RECENT_ECHO_SQL`: the newest echo at the site with `status = 'approved'` and `transcript IS NOT NULL`, any age, giving `transcript`, `lang`, `created_at`. 200 `{ "echo": { "transcript", "lang", "created_at" } }` or 200 `{ "echo": null }`. Never the audio, never the author. No `db` or a failing query → 503 `{ "error": "unavailable" }`.
- [ ] Errors are logged as `tools failed: <message>`; the secret and the request headers are never logged.
- [ ] `stats.test.ts`, cases by name: "glow is the site's value in the latest message"; "glow is 0 with no message"; "glow is 0 for a site missing from the message"; "coloursToday and lampsToday come from the query"; "the query passes the site id"; "a failing query throws".
- [ ] `router.test.ts`, cases by name: "no AGENT_TOOL_SECRET answers 503"; "a missing X-Agent-Secret answers 401"; "a wrong X-Agent-Secret answers 401"; "a secret of another length answers 401"; "a body without site_id answers 400"; "the Cathedral answers 404 unknown_site"; "an unknown site answers 404"; "get_site_stats answers glow, colours_today and lamps_lit_today"; "get_site_stats answers 503 when getSiteStats throws"; "get_recent_echo answers the newest approved echo"; "get_recent_echo answers echo null when there is none"; "get_recent_echo answers 503 without a db"; "the secret check runs before the body check".
- Verify: `npm run test -w @lampa/api -- src/stats src/tools && npm run typecheck`. Paste the summary line.
- Done when: every case passes, and with the header compare removed the two wrong-secret cases fail (this session checks, then restores).

#### B2-3.c On Tiger: the tools and the agent's stats (this session)

- [ ] Fabi has put `AGENT_TOOL_SECRET` in the root `.env` (B2-0). Local API on Tiger. With `curl`, the secret read from `.env` into a shell variable and never printed: `get_site_stats` for `unirii` with the right header → 200 with `colours_today` equal to the panes at `unirii` today; without the header → 401; `get_recent_echo` for `unirii` → 200 `{ "echo": null }`; for `cathedral` → 404.
- [ ] `GET /agent/session` is not called (it fetches an ElevenLabs signed URL); `getSiteStats` reaching it is covered by the typecheck of `app.ts` and B2-3.b.1.
- Verify: the four status lines and the stats body, pasted.
- Done when: the four answers match.

### B2-4 `scripts/simulate-crowd.ts`, minimal (1 h)

#### B2-4.a A script fakes visitors sending events and panes

**B2-4.a.1** The crowd simulator. Subagent: `fabi-realtime`. Files: `scripts/simulate-crowd.ts`.

- [ ] Run as `npm run simulate:crowd -- [--api <url>] [--sessions <n>] [--seconds <s>] [--site <id>]`, parsed with `parseArgs` from `node:util`. Defaults: `--api http://localhost:3000`, `--sessions 12`, `--seconds 120`, no `--site` (Fabi's decision, hour 7). `--site` must be a non-memorial id of `sites` from `@lampa/shared`; anything else, a non-positive number or an unknown flag prints one line and exits 1.
- [ ] Sites: with `--site`, every session uses it; without, sessions are spread round-robin over the non-memorial sites in `sites` order. The Cathedral is never used.
- [ ] Sessions: tokens from `POST <api>/session/anon`, at most 10 in any 61 s (the API allows 10 a minute per IP): the first 10 at once, the next 10 after 61 s, and so on. A 429 waits for its `Retry-After` seconds and tries again, unless that wait runs past `--seconds`; then, or on any other status or a network error, that session is not created and counts as an error (Fabi's decision, hour 7). Tokens are never printed.
- [ ] Each session, every 2000 ms until `--seconds` have passed since the start: one `POST /events` with an `EventBatch` of one `wake` at its site; and, until that session gets a 429 from `/panes`, one `POST /panes` with a `PaneIn` (passed through `PaneIn.parse`) of a random vivid colour: `hue` random in [0, 360), `saturation` 0.8, `lightness` 0.5 (Fabi's decision, hour 7), `hex` from those HSL values, lowercase, `bin` `hueBin(hue)`, `at` now.
- [ ] `hslToHex(h, s, l)` in the script, with two `assert.strictEqual` self-checks at start: `hslToHex(0, 1, 0.5)` is `#ff0000` and `hslToHex(240, 1, 0.5)` is `#0000ff`.
- [ ] Output: one line per completed window, `window complete at <site> (<windowId>)`; a 429 from `/panes` is counted, not printed; any other failure prints `<method> <path> <status or network>` once per status. At the end: `simulate:crowd done: <n> sessions, <n> panes, <n> windows completed, <n> events, <n> rate limited, <n> errors`. Exit 0 when at least one pane was accepted, otherwise 1.
- [ ] The script starts no server and reads no `.env`. It follows the import style of `scripts/agent-check.ts`.
- [ ] No tsconfig covers `scripts/` (checked at hour 7: only `tsconfig.base.json` at the root, and `npm run typecheck` runs the workspaces only), and `tsx` strips types without checking them. The script is checked by running it.
- Verify: `npx tsx scripts/simulate-crowd.ts --site cathedral; echo "exit $?"` → one line and `exit 1`; `npx tsx scripts/simulate-crowd.ts --api http://localhost:1 --sessions 1 --seconds 3; echo "exit $?"` → the network failure line, the summary line with `0 sessions` and `1 errors`, and `exit 1`. Paste the lines.
- Done when: both refusals behave as written and the self-checks pass at start.

#### B2-4.b On Tiger: a window fills to 48, completes and a new one starts (this session)

- [ ] Local API on Tiger with the `screen` listener of B2-1.e. `npm run simulate:crowd -- --site unirii --sessions 10 --seconds 40`.
- [ ] The run prints `window complete at unirii`; the listener prints the 48th `pane`, then `window_complete` with the same `windowId`; the next accepted pane at `unirii` carries a new `windowId` and slot 0; `GET /screen/state` lists the new window. Glow for `unirii` rose (colour weight 3).
- [ ] Then `npm run typecheck && npm run build && npm test && npm run glow:check`, rebase `fabi/b2-tools` on `fabi/b2-panes` (or on `origin/main` if PR 1 is merged), push, open PR 2.
- Verify: the run's last line, the listener lines and the `GET /screen/state` body, pasted.
- Done when: Checkpoint 2 line 2 holds against the local API and PR 2 is open.

### B2-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch from `origin/main`, `npm run typecheck && npm run build && npm test && npm run glow:check` green on it; then delete it.
- [ ] Secrets: `git log --all --name-only` shows no `.env`; `git grep -nE "postgres://|AGENT_TOOL_SECRET=."` outside `*.md` and `.env.example` → nothing.
- [ ] Push each branch and open its PR, in this order: `fabi/b2-panes` (PR 1), `fabi/b2-tools` (PR 2). Each PR lists what was verified and what is waiting for a phone.
- [ ] After Cristea merges and Render deploys: `POST /panes` without a token → 401; `GET /screen/state` → 200 parsing as `ScreenState`; `POST /tools/get_site_stats` without the header → 401 (or 503 if `AGENT_TOOL_SECRET` is not on Render yet).
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists `POST /panes`, the `pane` and `window_complete` rooms, `GET /screen/state`, `npm run simulate:crowd`, `POST /tools/*` with `X-Agent-Secret`, `getSiteStats` in `GET /agent/session`, `colour_readings` and `colour_1h`, `asTx` and `TODAY_START_SQL`.
- [ ] Fabi's checks, listed and not claimed:
  - Fabi sets `AGENT_TOOL_SECRET` on Render `lampa-api` and gives the value to Patrick by the team's own means, with the tool URLs `https://lampa-api-b45i.onrender.com/tools/get_site_stats` and `/tools/get_recent_echo`, method POST, JSON body `{ "site_id": "<id>" }`, header `X-Agent-Secret` as an ElevenLabs secret. How the agent fills `site_id` is Patrick's.
  - Checkpoint 2 line 1, with Ionut's iPhone and Cristea's laptop: deployed `/screen` open; Ionut catches a colour at `/s/unirii?demo=1` (with a fresh session or at another site if that phone already caught 5 there in the last hour); the pane shows on `/screen` within one second.
  - Checkpoint 2 line 2, from Fabi's laptop: deployed `/screen` open; `npm run simulate:crowd -- --api https://lampa-api-b45i.onrender.com --site unirii --sessions 10 --seconds 60`; the Piața Unirii window fills to 48, flares and a new one starts; a reload of `/screen` keeps the panes.
- Done when: every box is ticked or listed as Fabi's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the team heads-up before `db:reset` (Fabi); `bin` on `PaneMessage` (team, through Cristea); `AGENT_TOOL_SECRET` on Render and the tool setup in ElevenLabs (Fabi, Patrick); the two "tell the team" rows of hours 5 and 7.
- **Not finished at hour 14:** each ID, what is left, and its place in the cut order.
- **Phone checks for Fabi:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 2: Colours and Talk

- `POST /panes` stores a pane in the lowest empty slot of its site's open window, records its reading and its `colour` event (weight 3), answers `PaneAccepted`, sends `pane` to `site:<id>` and `screen` at once, closes the window at 48 with `window_complete`, and the next pane opens a new window.
- A sixth pane by one visitor at one site within an hour is 429 with `Retry-After`; the Cathedral is 404; the Gallery stores panes with no glow.
- `GET /screen/state` gives `/screen` the open windows and today's colours.
- `colour_readings` and `colour_1h` exist on Tiger, real-time, with a refresh policy.
- `POST /tools/get_site_stats` and `POST /tools/get_recent_echo` answer only with the right `X-Agent-Secret`; `GET /agent/session` carries real stats.
- `npm run simulate:crowd` fills a window to 48 against the local API and the deployed one.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `fabi/GLOSSARY.md` matches the state of the branch.

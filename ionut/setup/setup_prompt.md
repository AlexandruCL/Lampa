# Prompt: Ionut's Setup (Ionut, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 0 (2026-11-13 13:55 +0200). Implementation not started.**

You are implementing Ionut's part of Setup (hours 0 to 2) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Setup no goal line. Its time budget row reads: *repo, deploys, accounts wired, contracts agreed*

Checkpoint this block must pass: *Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database.*

## 0. Ground rules

- **Ionut takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Ionut, with your recommendation. Nothing uses the recommendation until Ionut answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 2.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Ionut: carrying on, cutting (plan section 7) or moving it is their decision.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Ionut, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Ionut's approval. Approved: `react-router` 8.5.1 (S-1.a, hour 0), `vitest` 5.1.0 (S-1.a, hour 0). `zod` 4.6.7 is already in the repo and named in plan section 3; S-1.a adds it to `apps/web` as a direct dependency at the same version.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. The `ionut/` docs commit goes straight to `main` (Ionut's decision, hour 0). After it, work on branches: `ionut/setup-routes-client` holds S-1.a, S-1.b and S-1.c. One small PR per branch. Open it as soon as the verify commands pass. Ionut merges. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. Setup builds no styled screen: each route renders its name as plain text and nothing else.
- Write in `ionut/` only. Other members' folders are read-only.
- **Keep `ionut/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Ionut a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 0, 2026-11-13 13:55 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200), read from `cristea/GLOSSARY.md`. There is no previous block for Ionut.
- `main` is at `7e97de0`, clean, with no open PRs. It holds Cristea's scaffold (workspaces `@lampa/web`, `@lampa/api`, `@lampa/shared`), `.env.example` and the contract names.
- `apps/web/src/App.tsx` renders the text `LAMPA` and nothing else. `apps/web/src/main.tsx` mounts it. `apps/web/vite.config.ts` holds only the React plugin. `apps/web/vercel.json` rewrites every path to `/index.html`.
- `apps/web/package.json` has scripts `dev`, `build`, `typecheck` and no `test`. Its dependencies are `@lampa/shared`, `react` 19.3.1, `react-dom` 19.3.1. S-1.a adds `react-router`, `zod`, `vitest` and the `test` script.
- `apps/api/src/index.ts` answers `GET /health` with `{"ok":true}` on local port 3000 and allows the origin in `WEB_ORIGIN`.
- `packages/shared/src/index.ts` re-exports `./contract.js`. `packages/shared/src/contract.ts` holds `EventKind` (8 values) and `SocketMessage` (7 values) as Zod enums. No payload schema exists.
- Root scripts that exist: `dev`, `build`, `typecheck`, `test`. The last three run the same script in every workspace that has one. No workspace has a `test` script yet, so `npm test` runs nothing.
- Not there yet, added by this block: `apps/web/src/vite-env.d.ts` (S-1.a), `apps/web/src/routes/` (S-1.b), `apps/web/src/api/` (S-1.c).
- PR #1 (`cristea/setup-contract-env`) is merged. `.env.example` lists `VITE_API_URL` among twelve names. This block imports nothing from `contract.ts` (Ionut's decision, hour 0).
- The team's 30-minute contract session has not happened (Ionut's answer, hour 0).
- "Needs from others" for Setup: the plan lists none for Ionut. `POST /events` and `GET /sites` are due from Fabi by hour 6, in Build 1.
- Deployed, from the Hand-offs of `cristea/GLOSSARY.md`: web `https://lampa-timisoara.vercel.app` (answered 200 at 13:51) and API `https://lampa-api-b45i.onrender.com` with `GET /health`. The API sleeps after about 15 minutes idle, so a first call can take about 50 s. Its CORS allows only the production web URL, so Vercel preview URLs and `localhost` are refused unless `WEB_ORIGIN` is set locally.
- This machine: Windows 11, Node v26.13.1 (upgraded from 24.11.0 with winget at hour 0, Ionut's decision), npm 11.6.2, `gh` logged in. The repo's `engines.node` is `26.x`. `node_modules` is not installed.
- Ionut has an iPhone. Ionut has no Android phone.
- No graph exists in `graphify-out/`. No file exists in `.claude/agents/` before this prompt.
- `DESIGN.md` section 9 has no Setup item for Ionut; the first is item 2, in Build 1. Plan section 8 has no test for Ionut in Setup.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Setup, Ionut's row, the All row and the "Done when" line | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Ionut's table and "Needs from others" | All |
| `ionut/GLOSSARY.md` | Whole file | All |
| `cristea/GLOSSARY.md` | Hand-offs and Changes | S-0, S-last |
| `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts` | Whole files | S-1.a |
| `apps/web/src/App.tsx`, `apps/web/src/main.tsx` | Whole files | S-1.b |
| `apps/api/src/index.ts` | The health route | S-1.c |
| `node_modules/react-router/package.json` and its type declarations | The exports `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useParams` | S-1.b |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Routes: `/`, `/s/:siteId`, `/screen`, `/pulse`, `/curate`. Typed API client. Vitest running | 2 | S-1.a, S-1.b, S-1.c |
| Section 11: Routes, typed API client, Vitest | same 2 | S-1.a, S-1.b, S-1.c |
| Section 6, All: 30 minutes on the contract, written into `packages/shared`: event kinds (`wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`) and socket messages (`glow`, `pane`, `window_complete`, `echo_approved`, `lamps` with a per-site count of people lighting now, `candle`, `finale`). Remote mode is `/?mode=remote` | none given | the team session in S-last; `/?mode=remote` opens `Landing` in S-1.b |
| Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database. | none given | Ionut's checks in S-last |

Total: 2 h of tasks in a 2 h block. The plan gives the contract's 30 minutes no separate hours, so they come out of the same 2 h.

Order: S-0, then S-1.a by this session, committed before any agent starts. Then S-1.b.1 and S-1.c.1 in parallel. Then S-last. If the block runs late, cut the client tests of S-1.c.1 first, then `getHealth()`. The routes and a running Vitest are never cut (Ionut's decision, hour 0).

The two agent tasks share no code. Their only common ground is `apps/web/package.json`, `package-lock.json` and `apps/web/src/vite-env.d.ts`, which this session writes and commits in S-1.a. Neither agent edits them.

### 3.1 Subagents

Ionut asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Ionut, re-runs the checks, writes the glossary and does S-0, S-1.a and S-last. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `ionut-routes` | Route table and pages in `apps/web` | `sonnet` | new |
| `ionut-api` | Typed API client in `apps/web` and its tests | `opus` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| S-1.b.1 | `ionut-routes` | Five routes with placeholder pages and a route table test | `apps/web/src/App.tsx`, `apps/web/src/routes/**` | after S-1.a, parallel with S-1.c.1 |
| S-1.c.1 | `ionut-api` | `api()`, `ApiError`, `getHealth()` and the client tests | `apps/web/src/api/**` | after S-1.a, parallel with S-1.b.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Ionut to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Ionut. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- The two agents share one working tree. They do not run `git add`, `git commit` or `npm install`. This session commits each agent's files after re-running its verify command.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Ionut, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### S-0 Preflight (first, this session)

- [ ] `node -v` prints `v26.` followed by the minor and patch. If it does not, stop and tell Ionut. Nothing below starts before this.
- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Commit `ionut/` to `main` as `docs(ionut) added Ionut's glossary and setup prompt` and push.
- [ ] `git switch -c ionut/setup-routes-client`.
- [ ] `npm ci`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-read the Hand-offs and Changes of `cristea/GLOSSARY.md` and of any other member's glossary on `origin/main`. List what moved since section 1.
- [ ] `ionut/GLOSSARY.md` exists. Do not recreate it.
- Done when: `node -v` shows major 26, the baseline is recorded and failures that were already there are listed, not fixed silently.

### S-1 Routes, typed API client, Vitest (2 h)

#### S-1.a Vitest runs in `apps/web` and the dependencies are in place (this session)

- [ ] `npm install -w @lampa/web --save-exact react-router@8.5.1 zod@4.6.7`.
- [ ] `npm install -w @lampa/web --save-dev --save-exact vitest@5.1.0`.
- [ ] `apps/web/package.json`: add the script `"test": "vitest run --passWithNoTests"`. Vitest reads `apps/web/vite.config.ts` and runs in its `node` environment. Add no Vitest config file, no jsdom and no Testing Library (Ionut's decision, hour 0).
- [ ] Create `apps/web/src/vite-env.d.ts` with the single line `/// <reference types="vite/client" />`, so `import.meta.env.VITE_API_URL` typechecks.
- [ ] Commit on `ionut/setup-routes-client` as `chore(web) added react-router, zod and vitest to the web app`, with the glossary's Done line for S-1.a and a Changes line naming `react-router` as a library outside plan section 3.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the verify command exits 0, Vitest prints that it found no test files and exits 0, and the commit holds `apps/web/package.json`, `package-lock.json`, `apps/web/src/vite-env.d.ts` and `ionut/GLOSSARY.md` only.

#### S-1.b The five routes open, and an unknown path lands on `/`

**S-1.b.1** Five routes with placeholder pages and a route table test. Subagent: `ionut-routes`. Files: `apps/web/src/App.tsx`, `apps/web/src/routes/**`.

- [ ] `apps/web/src/routes/paths.ts` exports `PATHS`, declared `as const`, with exactly these five entries: `landing: "/"`, `site: "/s/:siteId"`, `screen: "/screen"`, `pulse: "/pulse"`, `curate: "/curate"`. This file imports nothing.
- [ ] Five page files in `apps/web/src/routes/`, each a default-exported React component that renders plain text and nothing else, with no styling: `Landing.tsx` renders `Landing`; `Site.tsx` renders `Site ` followed by the `siteId` route param read with `useParams`; `Screen.tsx` renders `Screen`; `Pulse.tsx` renders `Pulse`; `Curate.tsx` renders `Curate`. (Ionut's decision, hour 0.)
- [ ] `apps/web/src/App.tsx`: a `BrowserRouter` with one `Routes` table that maps each `PATHS` value to its page, plus a last route with path `*` whose element is `<Navigate to={PATHS.landing} replace />`. Import `BrowserRouter`, `Routes`, `Route`, `Navigate` and `useParams` from `react-router` 8.5.1. If the installed package does not export one of these five names, stop and report it as Blocked with the package's export list.
- [ ] `/?mode=remote` renders `Landing`. Read no query parameter and add no remote behaviour (Ionut's decision, hour 0).
- [ ] Add no link, no layout, no CSS file and no data loading.
- [ ] Test file `apps/web/src/routes/paths.test.ts`, case `holds exactly the five plan paths`: `Object.values(PATHS)` equals `["/", "/s/:siteId", "/screen", "/pulse", "/curate"]` in this order.
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not edit `apps/web/src/main.tsx`.
- Verify: `npm run test -w @lampa/web -- src/routes && npm run typecheck -w @lampa/web && npm run build -w @lampa/web`. Paste the summary line. A typecheck error in `apps/web/src/api/` belongs to the other agent, which runs at the same time: report it and do not fix it.
- Done when: the verify command exits 0 with 1 test passed, and with `npm run dev -w @lampa/web` running, `/`, `/s/abc`, `/screen`, `/pulse` and `/curate` each show their text (`Site abc` for the second) and `/nope` ends on `/`.

#### S-1.c One typed function calls the API and rejects a body that does not match its schema

**S-1.c.1** `api()`, `ApiError`, `getHealth()` and the client tests. Subagent: `ionut-api`. Files: `apps/web/src/api/**`.

- [ ] `apps/web/src/api/client.ts` exports the constant `API_URL`: `import.meta.env.VITE_API_URL || "http://localhost:3000"` (Ionut's decision, hour 0).
- [ ] It exports the constant `SESSION_KEY` with the value `"lampa.session"` (Cristea's recorded Build 1 decision, accepted by Ionut at hour 0).
- [ ] It exports `class ApiError extends Error` with a readonly `status: number` set from the response.
- [ ] It exports `api<T>(path: string, options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; schema: z.ZodType<T> }): Promise<T>`. `method` falls back to `"GET"`. It calls `fetch(API_URL + path)`. When `body` is given, it sends `JSON.stringify(body)` with the header `Content-Type: application/json`.
- [ ] When `localStorage` exists as a global and holds a value under `SESSION_KEY`, the request carries `Authorization: Bearer <value>`. Otherwise the request has no `Authorization` header. Add no 401 handling: the refresh is Cristea's lane.
- [ ] A response whose `ok` is false throws `ApiError` with the response status. A response whose `ok` is true is read as JSON and returned through `schema.parse`, so a body that does not match throws Zod's `ZodError`.
- [ ] No timeout, no retry, no cache (Ionut's decision, hour 0).
- [ ] It exports `Health`, `z.object({ ok: z.literal(true) })`, and `getHealth()`, which returns `api("/health", { schema: Health })`. Add no other typed call: no payload schema exists yet (Ionut's decision, hour 0).
- [ ] The client never sends an event weight and holds no secret.
- [ ] Test file `apps/web/src/api/client.test.ts`, with `fetch` and `localStorage` replaced through `vi.stubGlobal` and restored after each case. Cases by name: `returns the parsed body on a 200`; `throws ApiError with the status on a 500`; `rejects a 200 body that fails the schema`; `sends the Bearer header when lampa.session is set`; `sends no Authorization header when lampa.session is missing`; `sends a JSON body with its content type on a POST`.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/api && npm run typecheck -w @lampa/web`. Paste the summary line. A typecheck error in `apps/web/src/routes/` or `apps/web/src/App.tsx` belongs to the other agent, which runs at the same time: report it and do not fix it.
- Done when: the verify command exits 0 with 6 tests passed. The live health call is this session's check in S-last, not yours.

### S-last Integrate and hand over (last, this session)

- [ ] Re-run both agents' verify commands, then commit S-1.b.1 as `feat(web) added the five routes with placeholder pages` and S-1.c.1 as `feat(web) added the typed API client with getHealth`, each with its glossary Done line.
- [ ] Break one rule and watch its test fail, then restore it: remove one entry of `PATHS`; make `api()` return the JSON without `schema.parse`.
- [ ] `git fetch` and rebase `ionut/setup-routes-client` on the current `origin/main`. Then `npm ci && npm run typecheck && npm run build && npm test` green on it.
- [ ] With `npm run dev` running, open `http://localhost:5173/screen` and reload: it shows `Screen`. Call `getHealth()` once from the browser console of the dev page through a temporary import, and remove the import. Paste the answer, which is `{ ok: true }`. If CORS refuses the call because `WEB_ORIGIN` is unset locally, record that as a fact for Cristea in the report and do not change `apps/api`.
- [ ] Push the branch and open its PR. The PR lists what was verified and what is waiting for a phone.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: `PATHS` and the route table in `apps/web/src/App.tsx`; `apps/web/src/routes/Screen.tsx` and `Curate.tsx` for Cristea and `Pulse.tsx` for Fabi to fill; `api()`, `ApiError`, `API_URL`, `SESSION_KEY` and `getHealth()` in `apps/web/src/api/client.ts`; `npm test` now runs Vitest in `apps/web`, and any `*.test.ts` under `apps/web/src` is picked up.
- [ ] Ionut's check with the team. Do not mark it done: the 30-minute contract session. The four members agree the payload of each of the eight event kinds and seven socket messages and write them into `packages/shared` as Zod schemas.
- [ ] Ionut's check on the iPhone, once this PR is merged and Vercel has deployed it. Do not mark it done: `https://lampa-timisoara.vercel.app` opens over HTTPS and shows `Landing`; `/s/abc` shows `Site abc`; `/screen`, `/pulse` and `/curate` each show their name after a reload; `/nope` ends on `/`.
- [ ] Ionut's check through a teammate. Do not mark it done: the same steps on the team's Android phone. Ionut has no Android.
- [ ] Not this lane, listed so the "Done when" line is whole: `npm run db:reset` works from a clean database. That is Fabi's Setup row.
- Done when: every box is ticked or listed as Ionut's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: a `react-router` 8.5.1 export that differs from the five names in S-1.b.1; a local CORS refusal on the health call.
- **Not finished at hour 2:** each ID, what is left, and its place in the cut order. Setup rows are not in the plan's cut order. Ionut's order for this block is: client tests first, then `getHealth()`; the rest carries into Build 1.
- **Phone checks for Ionut:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Setup

- A fresh clone of the branch passes `npm ci && npm run typecheck && npm run build && npm test`, and `npm test` reports 7 passed tests in `apps/web`.
- `/`, `/s/:siteId`, `/screen`, `/pulse` and `/curate` each render their placeholder, and an unknown path redirects to `/`.
- `getHealth()` returns `{ ok: true }` from the local API, and a body that fails its schema is rejected.
- The PR for `ionut/setup-routes-client` is open with its verify output.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `ionut/GLOSSARY.md` matches the state of the branch.

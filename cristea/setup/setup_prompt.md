# Prompt: Cristea's Setup (Cristea, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` before hour 0 (2026-11-13 13:14 +0200). Implemented from hour 0 (13:21). Setup closed at hour 0 for Cristea's lane: PR #1 merged as `7e97de0`, both hosts auto-deployed it, Cristea's checks reported done. Open outside this lane: Fabi's `npm run db:reset`.**

You are implementing Cristea's part of Setup (hours 0 to 2) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Setup no goal line. Its time budget row reads: *repo, deploys, accounts wired, contracts agreed*

Checkpoint this block must pass: *Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database.*

## 0. Ground rules

- **Cristea takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Cristea, with your recommendation. Nothing uses the recommendation until Cristea answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 2.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Cristea: carrying on, cutting (plan section 7) or moving it is their decision.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Cristea, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Cristea's approval. Approved: `tsx` 4.23.15 and `cors` 2.8.6 (S-1.a, pre-0), `concurrently` 10.0.7 (S-0, hour 0).
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. The first scaffold commit (S-1.a.1) goes straight to `main` (Cristea's decision, pre-0). After it, work on branches: `cristea/setup-contract-env` holds S-1.b and S-2.a. One small PR per branch. Open it as soon as the verify commands pass. Cristea merges. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. Setup builds no screen: `apps/web` shows the text `LAMPA` and nothing else.
- Write in `cristea/` only. Other members' folders are read-only.
- **Keep `cristea/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Cristea a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked before hour 0, 2026-11-13 13:14 +0200)

- The hackathon has not started. Hour 0 is not recorded in any glossary.
- There is no previous block.
- `main` is at `001923e`, clean, with no open PRs. Tracked files: `.gitignore`, `DESIGN.md`, `IMPLEMENTATION_PLAN.md` and six files in `design/css/`.
- Not there yet, added by S-1.a: root `package.json`, `tsconfig.base.json`, `apps/web`, `apps/api`, `packages/shared`.
- Not there yet, added by S-1.b: `.env.example`.
- Not there yet, added by S-2.a: `packages/shared/src/contract.ts`.
- `.gitignore` holds three lines: `.claude/`, `graphify-out/`, `LAMPA_Hackathon_Concept_Timisoara_*.pdf`. It does not ignore `node_modules`, `dist`, `.env` or `.vercel`.
- No `package.json` exists, so no script exists. S-1.a adds `dev`, `build`, `typecheck` and `test`.
- No other member has a folder or a glossary. Nothing has been handed off.
- "Needs from others" for Setup: the plan lists none for Cristea. Ionut, Patrick and Fabi all build on the scaffold, so it ships first.
- No deploy exists. The Vercel project `lampa-timisoara` and the Render service `lampa-api` have not been created.
- This machine: Windows 11, Node v26.7.0, npm 12.0.2, `gh` logged in. The `vercel` and `render` CLIs are not installed.
- Current releases on npm at this hour: `vite` 8.3.8, `react` 19.3.1, `express` 5.3.0, `zod` 4.6.7, `typescript` 7.0.2 (released 2026-11-13), `vitest` 5.1.0.
- Cristea has an iPhone and a laptop with HDMI. Cristea has no Android phone.
- No graph exists in `graphify-out/`.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Setup, Cristea's row, the All row and the "Done when" line | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Cristea's table and "Needs from others" | All |
| `cristea/GLOSSARY.md` | Whole file | All |
| `IMPLEMENTATION_PLAN.md` | Section 3 | S-1.a |
| `IMPLEMENTATION_PLAN.md` | Section 2 | S-last |
| `.gitignore` | Whole file | S-1.a |
| Vercel docs | The CLI pages for `link`, `git connect`, `env` and monorepo root directory, and the supported Node versions | S-0, S-1.c |
| Render docs | The CLI page, the free web service page and the supported Node versions | S-0, S-1.c |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: npm workspaces: `apps/web` (Vite, React, TypeScript), `apps/api` (Express, TypeScript), `packages/shared`. Web on Vercel, API on Render, both deploying from `main`. `.env.example`, no `.env` in git | 2 | S-1.a, S-1.b, S-1.c |
| Section 11: Workspaces, Vercel and Render deploys, `.env.example` | same 2 | S-1.a, S-1.b, S-1.c |
| Section 6, All: 30 minutes on the contract, written into `packages/shared`: event kinds (`wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`) and socket messages (`glow`, `pane`, `window_complete`, `echo_approved`, `lamps` with a per-site count of people lighting now, `candle`, `finale`). Remote mode is `/?mode=remote` | none given | S-2.a, and the team session in S-last |
| Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database. | none given | S-1.c, and Cristea's checks in S-last |

Section 8 has no test for Cristea in Setup. `DESIGN.md` section 9 has no Setup item.

Total: 2 h of tasks in a 2 h block. The plan gives the contract's 30 minutes no separate hours, so they come out of the same 2 h.

Order: S-0, then S-1.a.1 alone and pushed to `main` at once, because three lanes wait on it. Then S-1.b.1 and S-2.a.1 in parallel on `cristea/setup-contract-env`. S-1.c.1 starts as soon as S-1.a.1 is on `main` and Cristea has logged in to both CLIs, and runs in parallel with the other two.

### 3.1 Subagents

Cristea asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Cristea, re-runs the checks, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `cristea-infra` | Workspace scaffold, contract names, env template, Vercel and Render deploys | `sonnet` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| S-1.a.1 | `cristea-infra` | Workspace scaffold with a health endpoint | `package.json`, `package-lock.json`, `tsconfig.base.json`, `.gitignore`, `apps/web/**`, `apps/api/**`, `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts` | first, alone |
| S-1.b.1 | `cristea-infra` | `.env.example` | `.env.example` | after S-1.a.1, parallel with S-2.a.1 and S-1.c.1 |
| S-2.a.1 | `cristea-infra` | Event kinds and socket message names as Zod enums | `packages/shared/src/contract.ts`, `packages/shared/src/index.ts` | after S-1.a.1, parallel with S-1.b.1 and S-1.c.1 |
| S-1.c.1 | `cristea-infra` | Vercel and Render projects deploying from `main` | none in the repo | after S-1.a.1 is on `main`, parallel with S-1.b.1 and S-2.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Cristea to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Cristea. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Cristea, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### S-0 Preflight (first, this session)

- [x] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [x] Baseline before any change: no script exists yet, so record `git log -1 --oneline` and the file list from `git ls-files`.
- [x] Ask Cristea for hour 0 (date and time) and write it into the first line of `cristea/GLOSSARY.md`.
- [x] Look up in the Vercel and Render docs which Node majors each host supports, and record both lists.
- [x] Put the Blocked row S-0 of the glossary to Cristea, with the two Node lists. Five values wait on the answer: the workspace package names, the Node major, the API port for local work, the health path, and how `npm run dev` starts web and API together on Windows. Write the answers into this prompt's S-1.a.1 block and into the glossary's Decisions, then remove the Blocked row. S-1.a.1 does not start before this.
- [x] Install the Vercel CLI and the Render CLI as their docs describe for Windows. Ask Cristea to log in to each one with `! vercel login` and `! render login`.
- [x] `cristea/GLOSSARY.md` exists. Do not recreate it.
- Done when: hour 0 and the five values are recorded, `vercel whoami` and `render whoami` both print Cristea's account, and the baseline is written down.

### S-1 Workspaces, Vercel and Render deploys, `.env.example` (2 h)

#### S-1.a The three workspaces install, typecheck, build and answer a health call

**S-1.a.1** Workspace scaffold with a health endpoint. Subagent: `cristea-infra`. Files: `package.json`, `package-lock.json`, `tsconfig.base.json`, `.gitignore`, `apps/web/**`, `apps/api/**`, `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`.

Values from S-0 (Cristea's decision, recorded at preflight): package names: `@lampa/web`, `@lampa/api`, `@lampa/shared`. Node major: 26, written as `"engines": { "node": "26.x" }`. API port for local work: 3000. Health path: `GET /health`. `dev` script: `concurrently "npm run dev -w @lampa/api" "npm run dev -w @lampa/web"`, with `concurrently` 10.0.7 as a root dev dependency. If any of these five is still blank, stop and report it as Blocked.

- [x] Root `package.json`: `"private": true`, `"workspaces": ["apps/*", "packages/*"]`, `engines.node` set to the Node major above, and four scripts: `dev` (as recorded above), `build`, `typecheck` and `test`. The last three run the script of the same name in every workspace that has one, with npm's `--workspaces --if-present` flags.
- [x] `tsconfig.base.json` with `"strict": true`. Each workspace's `tsconfig.json` extends it.
- [x] `.gitignore`: keep the three existing lines and add `node_modules`, `dist`, `.env`, `.env.*`, `!.env.example`, `.vercel`.
- [x] `apps/web`: Vite, React and TypeScript, installed at their current npm releases. `App.tsx` renders the text `LAMPA` and nothing else. Scripts `dev`, `build`, `typecheck`. `apps/web/vercel.json` rewrites every path to `/index.html`, so `/screen`, `/pulse`, `/curate` and `/s/:siteId` open on a reload. Routes, the API client and Vitest are Ionut's Setup row: do not add them.
- [x] `apps/api`: Express and TypeScript with `tsx` and `cors` as runtime dependencies. `src/index.ts` allows the origin in `WEB_ORIGIN` through `cors`, answers the health path with status 200 and the JSON body `{"ok":true}`, and listens on `PORT`, falling back to the local port above. Scripts: `dev` is `tsx watch src/index.ts`, `start` is `tsx src/index.ts`, `typecheck` is `tsc --noEmit`.
- [x] `packages/shared`: `zod` as a dependency. `package.json` points `exports` at `./src/index.ts`, so web and API import the TypeScript source with no build step. `src/index.ts` holds `export {};` until S-2.a.1. Both apps list this package as a workspace dependency.
- [x] Commit `package-lock.json`.
- [x] Start the API locally and call the health path. Paste the status line and the body.
- [x] Commit to `main` as `chore(setup) added the npm workspaces for web, api and shared` and push. Tell Cristea the scaffold is on `main`, so the team can pull.
- Verify: `npm ci && npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the verify command exits 0 from a fresh clone, the health call returns 200 with `{"ok":true}`, and the commit is on `origin/main`.

#### S-1.b `.env.example` lists every name and no `.env` can be committed

**S-1.b.1** `.env.example`. Subagent: `cristea-infra`. Files: `.env.example`.

- [x] Create `.env.example` at the repo root with these twelve names, each with an empty value, in two groups. API: `PORT`, `DATABASE_URL`, `WEB_ORIGIN`, `SESSION_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `AGENT_TOOL_SECRET`. Web: `VITE_API_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`. (Cristea's decision, pre-0.)
- [x] One comment line above the web group: only names that start with `VITE_` reach the browser bundle, so no secret takes that prefix.
- [x] Commit on `cristea/setup-contract-env`.
- Verify: `git check-ignore -q .env && git check-ignore -q .env.local && ! git check-ignore -q .env.example && grep -c "=" .env.example`. Paste the output, which is `12`.
- Done when: the verify command exits 0 and prints `12`, and `git log --all --name-only` shows no `.env` file in any commit.

#### S-1.c Web and API are live over HTTPS and redeploy on a push to `main`

**S-1.c.1** Vercel and Render projects deploying from `main`. Subagent: `cristea-infra`. Files: none in the repo.

- [x] Vercel: create the project `lampa-timisoara` with root directory `apps/web`, connect it to this GitHub repository with production branch `main`, and set `VITE_API_URL` to the Render service's HTTPS URL for the production environment. (Names are Cristea's decision, pre-0.)
- [x] Render: create the web service `lampa-api` on the free plan in the Frankfurt region, from this repository's `main` branch with auto-deploy on. Build command `npm ci`. Start command: `npm run start` in the API workspace. Health check path: the health path from S-0. Env: `WEB_ORIGIN` set to the Vercel production URL, and the Node major from S-0.
- [x] If the Render CLI has no command that creates a service, stop this box and report it as Blocked with the CLI's help output. Recommendation to put to Cristea: a `render.yaml` blueprint in the repo, which Cristea applies once in the Render dashboard. (Not needed: `render services create` exists.)
- [x] If either name is taken, stop that box and report it as Blocked. Cristea gives the new name. (Not needed: both names were free.)
- [x] Confirm auto-deploy: after the next push to `main`, both hosts list a deployment for that commit's SHA. (Render `dep-dbrffhu1egvs73fota1g` and Vercel production both on `7e97de0`, triggered by Git.)
- [x] Record the two URLs in the glossary's Hand-offs.
- Verify: `curl -sS -o /dev/null -w "%{http_code} " https://<web URL>/screen && curl -sS https://<api URL><health path>`. Paste the output, which is `200 {"ok":true}`.
- Done when: the verify command prints `200 {"ok":true}`, both hosts show a deployment for the current `main` SHA, and the response to an `OPTIONS` call from the web origin carries that origin in `Access-Control-Allow-Origin`.

### S-2 The contract, written into `packages/shared` (30 minutes, shared by all four)

#### S-2.a The event kinds and socket message names from the plan exist as Zod enums

**S-2.a.1** Event kinds and socket message names as Zod enums. Subagent: `cristea-infra`. Files: `packages/shared/src/contract.ts`, `packages/shared/src/index.ts`.

- [x] `contract.ts` exports `EventKind`, a `z.enum` of exactly these eight strings in this order: `wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`.
- [x] `contract.ts` exports `SocketMessage`, a `z.enum` of exactly these seven strings in this order: `glow`, `pane`, `window_complete`, `echo_approved`, `lamps`, `candle`, `finale`.
- [x] `contract.ts` exports the inferred TypeScript type of each enum under the same name.
- [x] `index.ts` re-exports everything from `contract.ts`.
- [x] Write no payload schema. Field names and shapes are the team's decision in the 30-minute session (Cristea's decision, pre-0).
- [x] Commit on `cristea/setup-contract-env`.
- Verify: `npm run typecheck && npx tsx -e "import('./packages/shared/src/index.ts').then(m => console.log(m.EventKind.options.length, m.SocketMessage.options.length))"`. Paste the output, which ends in `8 7`.
- Done when: the verify command prints `8 7`, and both `apps/web` and `apps/api` typecheck with an import of `EventKind` from the shared package.

### S-last Integrate and hand over (last, this session)

- [x] `cristea/setup-contract-env` rebased on the current `main`, and `npm ci && npm run typecheck && npm run build && npm test` green on it.
- [x] Push the branch and open its PR. The PR lists what was verified and what is waiting for a phone.
- [x] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists the web URL, the API URL, the health path, the four root scripts, the twelve env names, and `EventKind` and `SocketMessage` in `packages/shared`.
- [x] Cristea's check with the team. Do not mark it done: the 30-minute contract session. The four members agree the payload of each of the eight event kinds and seven socket messages and write them into `packages/shared` as Zod schemas. Cristea records in the glossary who writes the file and the commit. (Cristea, hour 0: the team agrees the contract as it stands in `packages/shared`; it may change later.)
- [x] Cristea's check on the iPhone. Do not mark it done: the web URL opens over HTTPS and shows `LAMPA`; `/screen` opens after a reload. (Cristea reported it works.)
- [x] Cristea's check through a teammate. Do not mark it done: the same two steps on the team's Android phone. Cristea has no Android. (Cristea reported it works.)
- [ ] Not this lane, listed so the "Done when" line is whole: `npm run db:reset` works from a clean database. That is Fabi's Setup row.
- Done when: every box is ticked or listed as Cristea's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the five S-0 values until Cristea answers; a Render service that the CLI cannot create; a project name that is taken.
- **Not finished at hour 2:** each ID, what is left, and its place in the cut order. Setup rows are not in the cut order, so each one carries into Build 1 until Cristea says otherwise.
- **Phone checks for Cristea:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Setup

- A fresh clone passes `npm ci && npm run typecheck && npm run build && npm test`.
- The web URL answers 200 over HTTPS on `/` and on `/screen`.
- The API URL answers its health path over HTTPS with `{"ok":true}`.
- A push to `main` produces a new deployment on Vercel and on Render.
- `.env.example` holds the twelve names, and no `.env` file is in any commit.
- `packages/shared` exports `EventKind` with eight values and `SocketMessage` with seven.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `cristea/GLOSSARY.md` matches the state of the branch.

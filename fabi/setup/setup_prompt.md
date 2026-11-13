# Prompt: Fabi's Setup (Fabi, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 3 (2026-11-13 16:55 +0200). Implementation not started.**

You are implementing Fabi's part of Setup (hours 0 to 2 in the plan, started at hour 3) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Setup no goal line. Its time budget row reads: *repo, deploys, accounts wired, contracts agreed*

Checkpoint this block must pass: *Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database.*

## 0. Ground rules

- **Fabi takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Fabi, with your recommendation. Nothing uses the recommendation until Fabi answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ended at hour 2 in the plan and starts at hour 3 (Fabi's decision, hour 3).** S-1 carries 2 plan hours. When S-1 has used its 2 hours and is not done, stop and tell Fabi: carrying on, cutting or moving it is their decision.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Fabi, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Fabi's approval. Approved: `pg` 8.23.1, `yaml` 2.9.1 and `@types/pg` 8.23.1 (S-1.a, hour 3). `zod` 4.6.7 is already in the repo and named in plan section 3.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `DATABASE_URL` is never printed, logged, pasted into the chat or written into any tracked file.
- `main` deploys by itself. The docs commit (`fabi/` and the plan line) goes straight to `main` (Fabi's decision, hour 3). After it, work on branch `fabi/setup-db`, which holds S-1.a, S-1.c, S-1.d and S-1.e. One small PR. Open it as soon as the verify commands pass. Cristea merges, with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. Setup builds no screen in this lane.
- Write in `fabi/` only. Other members' folders are read-only.
- **Keep `fabi/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Fabi a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 3, 2026-11-13 16:55 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200), read from `cristea/GLOSSARY.md`. There is no previous block for Fabi, and nothing of Fabi's Setup row has landed.
- `main` is at `9649104`, clean and level with `origin/main`. Open PRs could not be listed: `gh` is not installed on this machine. The two remote branches left, `ionut/b1-checkpoint` and `ionut/b1-iphone`, are merged (PRs #14 and #13).
- Cristea's and Ionut's Setup and Build 1 are on `main`: the three workspaces, `POST /session/anon`, `requireVisitor`, the phone screens, `/screen` v1. Both lanes are blocked on Fabi's Build 1 (`POST /events`, Socket.IO `/live`), which needs this block first.
- `apps/api/src/app.ts` builds the Express app (`createApp()`), `apps/api/src/index.ts` starts it. Nothing in `apps/api` reads `DATABASE_URL` or imports a database library.
- `apps/api/package.json` has scripts `dev`, `start`, `typecheck`, `test`. `dev` and `start` load `../../.env` with `--env-file-if-exists`. Dependencies: `@lampa/shared`, `cors` 2.8.6, `express` 5.3.0, `express-rate-limit` 8.7.4, `jose` 6.2.17, `tsx` 4.23.15. `zod` is not a direct dependency of `apps/api`.
- Root scripts that exist: `dev`, `build`, `typecheck`, `test`. No `db:reset` script exists. Tests on `main` at `2f1e250` (code unchanged since): API `Tests 11 passed (11)`, web `Tests 76 passed (76)`, from `cristea/GLOSSARY.md`.
- `tsconfig.base.json` has `"moduleResolution": "Bundler"` and no `resolveJsonModule`.
- `packages/shared/src/contract.ts` holds `EventKind`, `SocketMessage`, `GlowMessage`, `Site` (`id`, `name`, `lat`, `lng`, `is_memorial`), `EventIn`, `EventBatch`, `EventsAccepted`. `packages/shared/src/index.ts` re-exports `./contract.js`. `packages/shared/package.json` points `exports` at `./src/index.ts`.
- Not there yet, added by this block: `db/` (S-1.c), `content/sites/` (S-1.d), `apps/api/src/db/` (S-1.d), `packages/shared/sites.json` and `packages/shared/src/sites.ts` (S-1.d), the `db:reset` scripts (S-1.a), a local `.env` (S-1.b).
- The five sites exist twice as local stand-ins with the same ids, names and approximate coordinates: `apps/web/src/screen/sites.fixture.ts` (Cristea) and `apps/web/src/sites/sites.ts` (Ionut, with a local `lamp` flag). Each owner swaps their own import once `sites.json` is on `main`.
- No site content YAML exists anywhere (Fabi's answer, hour 3). No Tiger account and no Tiger service exist (Fabi's answer, hour 3).
- `.env.example` lists `DATABASE_URL` among twelve names.
- "Needs from others" for Setup: the plan lists none for Fabi. `requireVisitor` from Cristea, due by hour 6 for Build 1, has landed (`cristea/GLOSSARY.md`, Hand-offs, hour 4).
- Deployed: web `https://lampa-timisoara.vercel.app/pulse` answered 200 and API `https://lampa-api-b45i.onrender.com/health` answered `{"ok":true}` at 16:39. The half of the "Done when" line about both phones is recorded as passed in `cristea/GLOSSARY.md` and `ionut/GLOSSARY.md`.
- This machine: Windows 11, Node v24.11.1 (the repo's `engines.node` is `26.x`), npm 11.6.2, `winget` present. Not installed: `gh`, `psql`, `docker`. `node_modules` is not installed. `winget` offers `OpenJS.NodeJS.LTS` 26.13.1.
- `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` is in the repo root (gitignored). Its sections 8.3, 9.4 and 11.2 A are the source of the YAML format and the columns below.
- Ionut's PRs get no Vercel preview, because the author has no access to the team's Vercel (`ionut/GLOSSARY.md`, Decisions, hour 0). The same failing check is expected on Fabi's PR and does not block the merge.
- Fabi's phones are not recorded: this lane has no phone check in Setup.
- No graph exists in `graphify-out/`. `.claude/agents/` holds `fabi-sql.md` and `fabi-api.md`, created with this prompt.
- `DESIGN.md` section 9 has no Setup item for Fabi; the only one is item 12, in Build 3. Plan section 8 has no test for Fabi in Setup.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Setup, Fabi's row, the All row and the "Done when" line | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Fabi's table and "Needs from others" | All |
| `fabi/GLOSSARY.md` | Whole file | All |
| `cristea/GLOSSARY.md`, `ionut/GLOSSARY.md` | Hand-offs, Changes and Blocked | S-0, S-last |
| `IMPLEMENTATION_PLAN.md` | Section 3 | S-1.a, S-1.c |
| `package.json`, `apps/api/package.json`, `tsconfig.base.json`, `apps/api/tsconfig.json` | Whole files | S-1.a, S-1.d |
| Tiger docs | The page on creating a service and the page for `create_hypertable` with `by_range` | S-1.b, S-1.c |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Sections 9.4 and 11.2 A, only to check a column against S-1.c.1 | S-1.c |
| `packages/shared/src/contract.ts`, `packages/shared/src/index.ts` | `Site`, and the re-export line | S-1.d |
| `apps/web/src/screen/sites.fixture.ts` | The five entries | S-1.d |
| `apps/api/src/auth/session.test.ts` | Test style | S-1.d |
| `node_modules/pg` and `node_modules/yaml` type declarations | `Pool`, `PoolClient`, `parse` | S-1.d |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Tiger service. Migration 001: extensions, `sites`, `windows`, `panes`, `echoes`, `blobs`, `interaction_events` hypertable. `npm run db:reset` rebuilds schema, seeds the five sites from YAML and writes `packages/shared/sites.json` | 2 | S-1.a, S-1.b, S-1.c, S-1.d, S-1.e |
| Section 11: Tiger service, migration 001, `npm run db:reset` with seed | same 2 | S-1.a, S-1.b, S-1.c, S-1.d, S-1.e |
| Section 6, All: 30 minutes on the contract, written into `packages/shared`: event kinds (`wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`) and socket messages (`glow`, `pane`, `window_complete`, `echo_approved`, `lamps` with a per-site count of people lighting now, `candle`, `finale`). Remote mode is `/?mode=remote` | none given | held at hour 0 without a record from Fabi; Fabi's acceptance of `Site`, `GlowMessage` and the site ids is carried to the team in S-last |
| Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database. | none given | S-1.e; the phone half is recorded as passed by Cristea and Ionut |

Section 8 has no test for Fabi in Setup. `DESIGN.md` section 9 has no Setup item for Fabi. The unit tests of S-1.d have no plan row and were approved by Fabi at hour 3.

Total: 2 h of tasks in a 2 h block, run from hour 3.

Order: S-0, then S-1.a by this session, committed before any agent starts. Then S-1.c.1 and S-1.d.1 in parallel, while Fabi does S-1.b by hand. Then S-1.e by this session, which needs all three. Then S-last. If the block runs late, cut the unit tests of S-1.d.1 first, then move `echoes` and `blobs` to migration 002. `sites`, `interaction_events` and `sites.json` are never cut (Fabi's decision, hour 3).

The seam between the two agents is the `sites` table. `fabi-sql` creates it from the DDL in S-1.c.1 and `fabi-api` inserts into it with the statement in S-1.d.1; both texts are settled below, so neither agent reads the other's files. Their only common ground in the tree is `package.json`, `apps/api/package.json`, `package-lock.json` and `tsconfig.base.json`, which this session writes and commits in S-1.a. Neither agent edits them.

### 3.1 Subagents

Fabi asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Fabi, re-runs the checks, writes the glossary and does S-0, S-1.a, S-1.e and S-last. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `fabi-sql` | Plain SQL in `db/`: migrations, hypertables, PostGIS, the reset file | `opus` | new |
| `fabi-api` | TypeScript data layer in `apps/api/src/db`, site content files, `sites.json`, their tests | `sonnet` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| S-1.c.1 | `fabi-sql` | Migration 001 and the reset file | `db/migrations/001_init.sql`, `db/reset.sql` | after S-1.a, parallel with S-1.d.1 |
| S-1.d.1 | `fabi-api` | Pool, seed functions, `db:reset` script, five site files, `sites.json`, the `sites` export, six tests | `apps/api/src/db/**`, `content/sites/**`, `packages/shared/sites.json`, `packages/shared/src/sites.ts`, `packages/shared/src/index.ts` | after S-1.a, parallel with S-1.c.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Fabi to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Fabi. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- The two agents share one working tree. They do not run `git add`, `git commit`, `npm install` or `npm run db:reset`, and they do not connect to the database. This session commits each agent's files after re-running its verify command.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Fabi, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### S-0 Preflight (first, this session)

- [ ] Fabi's step: `winget install --id OpenJS.NodeJS.LTS --version 26.13.1` and `winget install --id GitHub.cli`, then restart VS Code, then `gh auth login`. Ask Fabi to run them with `!` in the prompt box.
- [ ] `node -v` prints `v26.` followed by the minor and patch, and `gh auth status` names Fabi's account. If either does not, stop and tell Fabi. Nothing below starts before this.
- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them. Expected local changes: `fabi/`, and one line of `IMPLEMENTATION_PLAN.md` section 9.
- [ ] `gh pr list --state open`. List what is open.
- [ ] Commit `fabi/` and `IMPLEMENTATION_PLAN.md` to `main` as `docs(fabi) added Fabi's glossary and setup prompt` and push. If the push is refused, stop and tell Fabi.
- [ ] Tell Fabi to show the team the changed plan line: section 9, the row "Continuous aggregate lags behind new events" now names migration 002.
- [ ] `git switch -c fabi/setup-db`.
- [ ] `npm ci`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-read the Hand-offs, Changes and Blocked of `cristea/GLOSSARY.md` and `ionut/GLOSSARY.md` on `origin/main`, and look for a `patrick/GLOSSARY.md`. List what moved since section 1.
- [ ] `fabi/GLOSSARY.md` exists. Do not recreate it.
- Done when: `node -v` shows major 26, the docs commit is on `origin/main`, the baseline is recorded and failures that were already there are listed, not fixed silently.

### S-1 Tiger service, migration 001, `npm run db:reset` with seed (2 h)

#### S-1.a The libraries and the `db:reset` script entries are in place (this session)

- [ ] `npm install -w @lampa/api --save-exact pg@8.23.1 yaml@2.9.1 zod@4.6.7`.
- [ ] `npm install -w @lampa/api --save-dev --save-exact @types/pg@8.23.1`.
- [ ] `apps/api/package.json`: add the script `"db:reset": "tsx --env-file-if-exists=../../.env src/db/reset.ts"`.
- [ ] Root `package.json`: add the script `"db:reset": "npm run db:reset -w @lampa/api"`.
- [ ] `tsconfig.base.json`: add `"resolveJsonModule": true` to `compilerOptions`.
- [ ] Commit on `fabi/setup-db` as `chore(api) added pg, yaml and the db:reset script entries`, with the glossary's Done line for S-1.a and three Changes lines: `yaml` and `@types/pg` as libraries outside plan section 3; root `package.json`; `tsconfig.base.json`.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the verify command exits 0 with the baseline's test counts, and the commit holds `package.json`, `apps/api/package.json`, `package-lock.json`, `tsconfig.base.json` and `fabi/GLOSSARY.md` only.

#### S-1.b The Tiger service runs and its connection string is in the local `.env`

Fabi's check. Do not mark it done. Fabi does it by hand while the agents run (Fabi's decision, hour 3).

- [ ] Fabi creates a Tiger Cloud account in the Tiger console, or signs in with the login from the team's vault if one is there.
- [ ] Fabi creates one service named `lampa`, in the AWS region the console lists for Frankfurt, on a plan that costs nothing. If the console offers no plan at no cost, or no Frankfurt region, Fabi stops and decides with the team.
- [ ] Fabi copies the service's connection string, the form that starts with `postgres://` and ends with `sslmode=require`, into `c:\Lampa\.env` as the single line `DATABASE_URL=<the string>`. The file is gitignored. The string does not go into the chat.
- [ ] Fabi puts the connection string into the team's vault.
- Verify: `git check-ignore -q .env && grep -c "^DATABASE_URL=postgres" .env`. Paste the output, which is `1`.
- Done when: the verify command prints `1` and Fabi reports the service's status as running in the console.

#### S-1.c Migration 001 creates the three extensions, the five tables and the hypertable

**S-1.c.1** Migration 001 and the reset file. Subagent: `fabi-sql`. Files: `db/migrations/001_init.sql`, `db/reset.sql`.

- [ ] `db/migrations/001_init.sql` holds exactly these statements, in this order, with one comment line above each table saying what it stores. The column lists come from concept PDF sections 9.4 and 11.2 A; the types are Fabi's decisions of hour 3.

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;
CREATE EXTENSION IF NOT EXISTS postgis;

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

CREATE TABLE windows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      text REFERENCES sites (id),
  slots        integer NOT NULL DEFAULT 48,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

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

CREATE TABLE blobs (
  key          text PRIMARY KEY,
  content_type text NOT NULL,
  data         bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interaction_events (
  ts         timestamptz NOT NULL DEFAULT now(),
  session_id text        NOT NULL,
  user_sub   text,
  site_id    text        NOT NULL,
  kind       text        NOT NULL,
  weight     real        NOT NULL DEFAULT 1,
  lang       text,
  mode       text,
  props      jsonb       NOT NULL DEFAULT '{}'
);
SELECT create_hypertable('interaction_events', by_range('ts', INTERVAL '1 day'));
CREATE INDEX interaction_events_site_ts_idx ON interaction_events (site_id, ts DESC);
```

- [ ] Comments in the file state these four facts, each next to its line: `windows.site_id` NULL is the Gallery window for remote mode; `interaction_events.session_id` holds the token subject, `anon:<uuid>` or the Auth0 sub; `kind` has no CHECK because the Zod contract in `packages/shared` validates it; the server sets `weight`.
- [ ] The file holds no continuous aggregate, no compression policy, no retention policy and no seed row. Those belong to migration 002 (Build 1) and to Build 4.
- [ ] `db/reset.sql` holds one statement: `DROP TABLE IF EXISTS panes, windows, echoes, blobs, interaction_events, sites CASCADE;` with one comment line above it: every table a later migration adds is appended to this list in the same commit. The file drops no extension.
- [ ] If the Tiger docs page for `create_hypertable` shows that the `by_range('ts', INTERVAL '1 day')` form is not accepted, stop that line and report it as Blocked with the form the page gives.
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not connect to the database.
- Verify: `grep -c "^CREATE TABLE" db/migrations/001_init.sql && grep -c "^CREATE EXTENSION" db/migrations/001_init.sql && grep -c "create_hypertable" db/migrations/001_init.sql && grep -c "DROP TABLE IF EXISTS" db/reset.sql`. Paste the output, which is `6`, `3`, `1`, `1` on four lines.
- Done when: the verify command prints `6`, `3`, `1`, `1`. The run against Tiger is this session's check in S-1.e, not yours.

#### S-1.d The seed reads five site files, and `sites.json` is exported from `@lampa/shared`

**S-1.d.1** Pool, seed functions, `db:reset` script, five site files, `sites.json`, the `sites` export, six tests. Subagent: `fabi-api`. Files: `apps/api/src/db/**`, `content/sites/**`, `packages/shared/sites.json`, `packages/shared/src/sites.ts`, `packages/shared/src/index.ts`.

- [ ] Five files in `content/sites/`, read in file-name order (Fabi's decision, hour 3): `01-mx.yaml`, `02-unirii.yaml`, `03-victoriei.yaml`, `04-bastion.yaml`, `05-cathedral.yaml`. Each follows the format of concept PDF section 8.3 with these keys in this order: `id`, `city`, `name` (`ro`, `en`), `location` (`lat`, `lng`), `radius_m`, `interactions`, `is_memorial`, `glow_k`, `persona` (`voice`, `traits`), `facts`, `sound_bed`, `directions_hint`, `active` (`from`, `until`). The first line of each file is the comment `# Approximate coordinates and empty content: the team replaces them on site.`
- [ ] Values shared by all five: `city: timisoara`, `radius_m: 40`, `glow_k: 10`, `persona: { voice: "", traits: "" }`, `facts: []`, `sound_bed: ""`, `directions_hint: {}`, `active: { from: null, until: null }`.
- [ ] Values per file:

| File | `id` | `name.ro` | `name.en` | `lat` | `lng` | `interactions` | `is_memorial` |
|---|---|---|---|---|---|---|---|
| `01-mx.yaml` | `mx` | Muzeul MX Corneliu Miklosi | Muzeul MX Corneliu Miklosi | 45.761 | 21.248 | `[talk, colours, lamp, echo]` | `false` |
| `02-unirii.yaml` | `unirii` | Piața Unirii | Piața Unirii | 45.7579 | 21.229 | `[talk, colours, lamp, echo]` | `false` |
| `03-victoriei.yaml` | `victoriei` | Piața Victoriei | Piața Victoriei | 45.7537 | 21.2253 | `[talk, colours, lamp, echo]` | `false` |
| `04-bastion.yaml` | `bastion` | Bastionul Theresia | Theresia Bastion | 45.7573 | 21.234 | `[talk, colours, lamp, echo]` | `false` |
| `05-cathedral.yaml` | `cathedral` | Catedrala Mitropolitană | Metropolitan Cathedral | 45.7507 | 21.2243 | `[listen, candle]` | `true` |

- [ ] `apps/api/src/db/pool.ts` exports `createPool(): pg.Pool`. It throws `new Error("DATABASE_URL is not set")` when `process.env.DATABASE_URL` is empty or missing, and otherwise returns `new pg.Pool({ connectionString: process.env.DATABASE_URL })` with no other option. Nothing runs at import time.
- [ ] `apps/api/src/db/seed.ts` holds pure functions only: no file access, no database, no `process.env`. It exports:
  - `SiteFile`, a Zod object for one site file: `id` (string, at least 1 character), `city` (string), `name` (`{ ro: string, en: string }`), `location` (`{ lat: number, lng: number }`), `radius_m` (positive number), `interactions` (array of strings), `is_memorial` (boolean, missing means `false`), `glow_k` (positive number), `persona` (record, missing means `{}`), `facts` (array, missing means `[]`), `sound_bed` (string, missing means `""`), `directions_hint` (record of strings, missing means `{}`), `active` (`{ from: string or null, until: string or null }`, missing means both `null`). Keys the schema does not name are kept and do not fail the parse, because Patrick's publish script adds its own.
  - `parseSiteFile(text: string): SiteFile`, which parses the YAML with `parse` from `yaml` and returns it through `SiteFile.parse`.
  - `SiteRow`, the type `{ id, city, slug, name, lng, lat, radius_m, interactions, persona, facts, directions_hint, glow_k, is_memorial, active_from, active_until }`, and `toSiteRow(file: SiteFile): SiteRow`, where `slug` equals `id`, `lng` and `lat` come from `location`, and `active_from` and `active_until` come from `active`.
  - `toSitesJson(files: SiteFile[]): Site[]`, with `Site` imported from `@lampa/shared`: one entry per file in the order given, holding exactly `id`, `name` (the value of `name.en`), `lat`, `lng`, `is_memorial`.
  - `INSERT_SITE`, this SQL text, and `siteParams(row: SiteRow): unknown[]`, which returns its fifteen parameters in order, with `name`, `persona`, `facts` and `directions_hint` passed through `JSON.stringify` and `interactions` passed as a JavaScript array:

```sql
INSERT INTO sites (id, city, slug, name, geom, radius_m, interactions, persona, facts,
                   directions_hint, glow_k, is_memorial, active_from, active_until, status)
VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, 'published')
```

  Parameter order: `id`, `city`, `slug`, `name`, `lng`, `lat`, `radius_m`, `interactions`, `persona`, `facts`, `directions_hint`, `glow_k`, `is_memorial`, `active_from`, `active_until`.
- [ ] `apps/api/src/db/reset.ts` is the script behind `npm run db:reset`. It resolves the repo root from its own location with `import.meta.dirname`, so it works from any working directory. Steps, in order, on one client taken from `createPool()`:
  1. Print `db:reset on <host>/<database>`, with host and database name read from `DATABASE_URL` through `new URL`. Never print the user, the password or the full string.
  2. Run the text of `db/reset.sql` in one `query` call.
  3. Run each file of `db/migrations/` whose name ends in `.sql`, in ascending file-name order, each file in one `query` call, printing `applied <file name>` after each.
  4. Read each file of `content/sites/` whose name ends in `.yaml`, in ascending file-name order, through `parseSiteFile`.
  5. Insert every site with `INSERT_SITE` between `BEGIN` and `COMMIT`; on an error run `ROLLBACK` and rethrow.
  6. Write `packages/shared/sites.json` as `JSON.stringify(toSitesJson(files), null, 2)` followed by one newline.
  7. Query the number of the six tables of migration 001 present in schema `public`, the number of rows in `timescaledb_information.hypertables` for `interaction_events`, and the number of rows in `sites`, and print `db:reset done: <t> tables, <h> hypertable, <s> sites`.
  8. Release the client and end the pool.
  On any error it prints the error's message, ends the pool and exits with code 1. It asks for no confirmation and reads no flag (Fabi's decision, hour 3).
- [ ] `packages/shared/sites.json`, written by hand in the exact form step 6 produces, so that a later `db:reset` leaves it unchanged: the five entries in file order, each with `id`, `name`, `lat`, `lng`, `is_memorial` in this key order and the values of the table above, `name` being the `name.en` column.
- [ ] `packages/shared/src/sites.ts` holds two import lines and one export: `import sitesJson from "../sites.json" with { type: "json" };`, `import type { Site } from "./contract.js";`, `export const sites: Site[] = sitesJson;`. `packages/shared/src/index.ts` gets one added line, `export * from "./sites.js";`, and no other change. If `tsc`, Vite or `tsx` rejects the import attribute, stop that box and report it as Blocked with the error text.
- [ ] Test file `apps/api/src/db/seed.test.ts`. Cases by name: `parses a minimal site file`; `rejects a file with no location`; `keeps keys the schema does not name`; `maps a site to its row with slug equal to id and lng before lat in the parameters`; `writes sites.json entries with the five Site fields only`; `the five files in content/sites give mx, unirii, victoriei, bastion, cathedral in order and match packages/shared/sites.json`. The last case reads the real files from disk; the others use inline text.
- [ ] No test connects to a database, and `npm test` passes with `DATABASE_URL` unset.
- [ ] Do not run `git add`, `git commit`, `npm install` or `npm run db:reset`. Do not edit `apps/api/src/app.ts`, `apps/api/src/index.ts` or `packages/shared/src/contract.ts`.
- Verify: `npm run test -w @lampa/api -- src/db && npm run typecheck && npm run build -w @lampa/web && npx tsx -e "import('@lampa/shared').then(m => console.log(m.sites.length, m.sites[4].id))"`. Paste the summary line and the last line, which is `5 cathedral`.
- Done when: the verify command exits 0 with 6 tests passed and prints `5 cathedral`. The run against Tiger is this session's check in S-1.e, not yours.

#### S-1.e `npm run db:reset` works from a clean database, and again on a full one (this session)

- [ ] Re-run the verify commands of S-1.c.1 and S-1.d.1. Commit S-1.c.1 as `feat(db) added migration 001 with the hypertable and the reset file` and S-1.d.1 as `feat(api) added the db:reset script, the five site files and sites.json`, each with its glossary Done line. The second commit also carries a Changes line for `packages/shared`.
- [ ] Wait for S-1.b. Then run `npm run db:reset` on the fresh service: this is the clean-database run of the "Done when" line. Paste its last line.
- [ ] Run `npm run db:reset` a second time, on the now full database. Paste its last line.
- [ ] `git diff --exit-code packages/shared/sites.json` exits 0 after both runs.
- [ ] With `DATABASE_URL` removed from the environment for one run (`DATABASE_URL= npm run db:reset` with `.env` renamed for the moment, then restored), the script prints `DATABASE_URL is not set` and exits 1.
- [ ] Break one rule and watch its test fail, then restore it: make `toSitesJson` return `name.ro`; swap `lng` and `lat` in `siteParams`.
- [ ] If a run fails on SQL, send the error text to `fabi-sql`; if it fails in the script, to `fabi-api`. If `CREATE EXTENSION` is refused by the service's plan, or the TLS connection is refused, stop and report it to Fabi as Blocked with the error text.
- Verify: `npm run db:reset && npm run db:reset && git diff --exit-code packages/shared/sites.json`. Paste the last line of each run, which is `db:reset done: 6 tables, 1 hypertable, 5 sites`.
- Done when: both runs print `db:reset done: 6 tables, 1 hypertable, 5 sites`, the diff is empty, and the commit with the glossary's Done line for S-1.e is on the branch.

### S-last Integrate and hand over (last, this session)

- [ ] `git fetch` and rebase `fabi/setup-db` on the current `origin/main`. Then `npm ci && npm run typecheck && npm run build && npm test` green on it, and `npm run db:reset` once more.
- [ ] `git log --all --name-only` shows no `.env` file in any commit, and `git grep -n "postgres://" -- . ":!fabi" ":!*.md"` prints nothing.
- [ ] Push the branch and open its PR with `gh pr create`. The PR lists what was verified, the four files touched outside `fabi/`, and what is waiting for Fabi. Tell Fabi to ask Cristea for the merge.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: `npm run db:reset` (root script; needs `DATABASE_URL` in the root `.env`; wipes and rebuilds every table); `DATABASE_URL` in the team's vault; the six tables and the hypertable of `db/migrations/001_init.sql`, with `session_id` as text; `db/reset.sql` as the list every later migration extends; `createPool()` in `apps/api/src/db/pool.ts`; `sites` from `@lampa/shared` and `packages/shared/sites.json` for Cristea's `ScreenPage.tsx` and Ionut's `apps/web/src/sites/sites.ts`; the site file format in `content/sites/` and `parseSiteFile` for Patrick's `publish-site.ts`; the note that coordinates are still approximate.
- [ ] Fabi's check. Do not mark it done: set `DATABASE_URL` on Render `lampa-api` in the dashboard, then confirm `https://lampa-api-b45i.onrender.com/health` still answers `{"ok":true}` after the redeploy.
- [ ] Fabi's check with the team. Do not mark it done: tell Cristea that `Site`, `GlowMessage` and the five ids are accepted as they are on `main` and that `sites.json` has landed, so the fixture import in `ScreenPage.tsx` can be swapped and the 2.95 spacing re-checked; tell Ionut the same for `apps/web/src/sites/sites.ts`; tell Patrick where the site files are; ask the team for the real coordinates and content of the five sites; show the changed line of plan section 9.
- [ ] Not this lane, listed so the "Done when" line is whole: the deployed URL opens over HTTPS on both phones. Recorded as passed in `cristea/GLOSSARY.md` and `ionut/GLOSSARY.md`.
- Done when: every box is ticked or listed as Fabi's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: a `CREATE EXTENSION` that the service's plan refuses; a TLS error from `pg` against the Tiger string; the import attribute on `sites.json` rejected by a tool; a refused push to `main`; the Tiger console offering no plan at no cost.
- **Not finished after the block's 2 hours:** each ID, what is left, and its place in the cut order. Setup rows are not in the plan's cut order. Fabi's order for this block is: unit tests first, then `echoes` and `blobs` to migration 002; the rest carries into Build 1.
- **Phone checks for Fabi:** none in this block.
- **For the checkpoint:** what the other lanes should know before integrating. Include: `db:reset` wipes the one database that local work and the deployed API share; the Vercel preview check on Fabi's PR fails by design.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Setup

- The Tiger service `lampa` runs, and `DATABASE_URL` is in the local `.env`, in the team's vault and on Render `lampa-api`.
- `npm run db:reset` prints `db:reset done: 6 tables, 1 hypertable, 5 sites` on a clean database and on a full one, and leaves `packages/shared/sites.json` unchanged.
- A fresh clone of the branch passes `npm ci && npm run typecheck && npm run build && npm test` with `DATABASE_URL` unset, and the API reports 17 passed tests.
- `import { sites } from "@lampa/shared"` gives the five sites in the order `mx`, `unirii`, `victoriei`, `bastion`, `cathedral`.
- No `.env` file and no connection string is in any commit.
- The PR for `fabi/setup-db` is open with its verify output.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `fabi/GLOSSARY.md` matches the state of the branch.

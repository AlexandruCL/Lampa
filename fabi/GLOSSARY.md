# Glossary: Fabi (Fabi, Data and real-time)

Hour 0: 2026-11-13 13:21 (+0200).

## Done
| ID | What | Verify summary | Commit | Hour |
|---|---|---|---|---|

## Changes
Anything that differs from the plan, `DESIGN.md` or the contract, and any file outside this lane that was touched.
| Hour | ID | What changed | Files | Why |
|---|---|---|---|---|
| 3 | Setup prompt | The risk row "Continuous aggregate lags behind new events" names migration 002, not 001 | `IMPLEMENTATION_PLAN.md` section 9 | Migration 001 holds only what the Setup row lists; the aggregate comes with its Build 1 row (Fabi's decision, hour 3). The team needs to see it |
| 3 | Setup prompt | Fabi's Setup starts at hour 3, one hour after the block's end in plan section 5 | none | Nothing of the Setup row had landed at hour 3; Fabi keeps the full row |

## Decisions
The owner's answers only.
| Hour | Decision | Reason |
|---|---|---|
| 3 | Setup: the full Setup row is built now, at hour 3: Tiger service, migration 001 with all six tables, `npm run db:reset` with seed and `sites.json`. The `build_1` prompt is written right after | Build 1 needs every part of it |
| 3 | Setup: Fabi creates the Tiger account and one service named `lampa` by hand in the console, in the AWS region for Frankfurt, on a plan that costs nothing. The connection string goes into the local `.env` as `DATABASE_URL` and never into git or the chat. Fabi sets `DATABASE_URL` on Render `lampa-api` in the dashboard | Fabi's answer; no account existed at hour 3 |
| 3 | Setup: migration 001 follows concept PDF sections 9.4 and 11.2 A column for column for `sites`, `windows`, `panes`, `echoes` and `interaction_events`, with the extensions `timescaledb`, `timescaledb_toolkit`, `postgis`. Fills where the PDF is silent: `blobs` = `key` text PK, `content_type`, `data` bytea, `created_at`; no continuous aggregate (migration 002, Build 1); no compression policy (Build 4); no CHECK on `kind`; no windows seeded | Fabi accepted the recommended fills |
| 3 | Setup: `interaction_events.session_id` is `text NOT NULL` and holds the token subject as it is (`anon:<uuid>` or the Auth0 sub). `user_sub` stays for `POST /me/claim` | Cristea's `requireVisitor` gives a text subject; the PDF's `uuid` would need a conversion |
| 3 | Setup: types where the PDF gives none: `sites.id` text; uuid ids from `gen_random_uuid()` for `windows`, `panes`, `echoes`; `interactions` text[]; `name`, `persona`, `facts`, `directions_hint` jsonb; `windows.site_id` nullable, NULL meaning the Gallery window; `UNIQUE (window_id, slot)` on `panes`; CHECK on `sites.status`, `echoes.status`, `echoes.voice_mode`; GIST index on `sites.geom` | Fabi approved the types as shown |
| 3 | Setup: SQL in `db/migrations/` and site content in `content/sites/` at the repo root; code in `apps/api/src/db/` (`pool.ts`, `seed.ts`, `reset.ts`). Root script `db:reset` runs the API workspace's script | The PDF's layout; typecheck and Vitest cover the code |
| 3 | Setup: approved `pg` 8.23.1 (MIT, released 2026-09-30), `yaml` 2.9.1 (ISC, released 2026-09-11), `@types/pg` 8.23.1 (MIT, released 2026-08-17) in `apps/api`. `zod` 4.6.7 becomes a direct dependency of `apps/api` at the version already in the repo | `yaml` and `@types/pg` are not in plan section 3 |
| 3 | Setup: five minimal site files in the PDF 8.3 format, named `01-mx.yaml`, `02-unirii.yaml`, `03-victoriei.yaml`, `04-bastion.yaml`, `05-cathedral.yaml` and read in file-name order. Ids, names and approximate coordinates are the ones Cristea and Ionut use; `radius_m` 40, `glow_k` 10; facts, persona, sound bed and hints stay empty for the team | No site content existed at hour 3; `/screen` depends on the order |
| 3 | Setup: `packages/shared/sites.json` holds the contract's `Site` (`id`, `name`, `lat`, `lng`, `is_memorial`) and is exported from `@lampa/shared` as `sites`. Fabi accepts Cristea's `Site`, `GlowMessage` and the ids `mx`, `unirii`, `victoriei`, `bastion`, `cathedral` as they are on `main` | Answers Cristea's Blocked row B1-0 |
| 3 | Setup: `npm run db:reset` runs at once with no prompt and no flag. It refuses to start when `DATABASE_URL` is unset, prints host and database name, drops the tables of migration 001 with `DROP TABLE IF EXISTS ... CASCADE` (extensions stay), runs `db/migrations/*.sql` in name order, seeds in one transaction, writes `sites.json` | The plan's command is exactly `npm run db:reset` |
| 3 | Setup: Vitest covers the pure YAML-to-row and row-to-`sites.json` functions; no database in `npm test`. The live check is `db:reset` run twice against Tiger. If late: the unit tests are cut first, then `echoes` and `blobs` move to migration 002. Never cut: `sites`, `interaction_events`, `sites.json` | Teammates' `npm test` stays green without a `DATABASE_URL` |
| 3 | Setup: Node goes to 26.13.1 and `gh` is installed with winget in preflight. `fabi/` and the plan line go to `main` as one docs commit. One branch `fabi/setup-db`, one PR, opened as soon as verify passes; Cristea merges with a merge commit. Subagents `fabi-sql` on `opus` and `fabi-api` on `sonnet`, in parallel after the session commits the dependencies | Fabi accepted the recommended set |
| 3 | Setup: approved touching four files outside `fabi/`: root `package.json` (`db:reset` script), `tsconfig.base.json` (`resolveJsonModule`), `packages/shared` (`sites.json`, `src/sites.ts`, one line in `src/index.ts`), `IMPLEMENTATION_PLAN.md` section 9 | Each is needed by the Setup row |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|

# Glossary: Ionut (Ionut, Phone experience)

Hour 0: 2026-11-13 13:21 (+0200).

## Done
| ID | What | Verify summary | Commit | Hour |
|---|---|---|---|---|
| S-0 | Preflight: Node v26.13.1; `ionut/` on `main`; branch `ionut/setup-routes-client` from `9603702`; `npm ci` | baseline `npm run typecheck` → exit 0; `npm run build` → `✓ built in 124ms`, exit 0; `npm test` → exit 0 (no workspace had a test script). No failures were already there | 9603702 | 0 |
| S-1.a | `react-router` 8.5.1, `zod` 4.6.7, `vitest` 5.1.0 (dev) in `apps/web`, exact versions; `test` script; `vite-env.d.ts` | `npm run typecheck && npm run build && npm test` → `✓ built in 106ms`; `No test files found, exiting with code 0`; exit 0 | 93a2659 | 0 |
| S-1.b.1 | `PATHS` and five placeholder pages in `apps/web/src/routes/`; one route table in `App.tsx` with `*` → `<Navigate to="/" replace />` (agent `ionut-routes`) | `npm run test -w @lampa/web -- src/routes && npm run typecheck -w @lampa/web && npm run build -w @lampa/web` → `Tests  1 passed (1)`; `✓ built in 146ms`; exit 0. Removing `pulse` from `PATHS` fails the test. Dev server: `/` → `Landing`, `/?mode=remote` → `Landing`, `/s/abc` → `Site abc`, `/screen`, `/pulse`, `/curate` → their names, `/nope` → `/` showing `Landing` | a643aae | 0 |
| S-1.c.1 | `apps/web/src/api/client.ts`: `API_URL`, `SESSION_KEY`, `ApiError`, `api()`, `Health`, `getHealth()`; 6 client tests with `fetch` and `localStorage` stubbed (agent `ionut-api`) | `npm run test -w @lampa/web -- src/api && npm run typecheck -w @lampa/web` → `Tests  6 passed (6)`; exit 0. Returning the JSON without `schema.parse` fails `rejects a 200 body that fails the schema` | 15801e4 | 0 |
| S-last | Integrated: branch already on `origin/main` (`9603702`, nothing to rebase); PR #3 open; both verify commands re-run; both rule-break checks fail as expected; dev `/screen` reload → `Screen`; `getHealth()` from the dev page console → `{ ok: true }` against the local API started with `WEB_ORIGIN=http://localhost:5173` | `npm run typecheck && npm run build && npm test` → `✓ built in 129ms`; `Test Files  2 passed (2)`, `Tests  7 passed (7)`; exit 0. `npm ci` not run (see Changes) | this commit | 0 |

## Changes
Anything that differs from the plan, `DESIGN.md` or the contract, and any file outside this lane that was touched.
| Hour | ID | What changed | Files | Why |
|---|---|---|---|---|
| 0 | S-1.a | Added `react-router` 8.5.1, which plan section 3 does not name | `apps/web/package.json`, `package-lock.json` | Approved by Ionut at hour 0 (Decisions) |
| 0 | S-1.b.1 | `useParams` is imported in `Site.tsx`, not in `App.tsx`, the only file that uses it | `apps/web/src/routes/Site.tsx` | An unused import in `App.tsx` would serve no purpose; all five names exist in `react-router` 8.5.1 |
| 0 | S-1.c.1 | An empty string under `lampa.session` sends no `Authorization` header; a failed response throws `ApiError(status)` without reading the body | `apps/web/src/api/client.ts` | An empty token is no session; error bodies come with the first endpoint that defines one |
| 0 | S-last | `npm ci` before the final checks was not run: the session's auto mode refused it because it deletes `node_modules`. The checks ran on the install from S-0 and S-1.a, whose lockfile is unchanged | none | Ionut can run `npm ci` once to close the fresh-install check |
| 0 | S-last | Fact for Cristea: with `WEB_ORIGIN` unset, the local API sends no `Access-Control-Allow-Origin`, so the dev page at `http://localhost:5173` is refused by CORS. Setting `WEB_ORIGIN=http://localhost:5173` for the local process fixes it. `apps/api` was not changed | none | Recorded per the setup prompt |

## Decisions
The owner's answers only.
| Hour | Decision | Reason |
|---|---|---|
| 0 | Setup: approved `react-router` 8.5.1 (MIT, released 2026-10-27) in `apps/web`. The five routes sit in one table in `App.tsx` | Cristea and Fabi add their pages to the same table; links and `:siteId` come built in |
| 0 | Setup: one placeholder file per route in `apps/web/src/routes/` (`Landing`, `Site`, `Screen`, `Pulse`, `Curate`), each rendering only its name as unstyled text; `Site` also shows the `siteId`. An unknown path redirects to `/`. `/?mode=remote` stays on `Landing` with no behaviour yet | Ionut accepted the recommended set |
| 0 | Setup: the typed API client is one file, `apps/web/src/api/client.ts`, with `api(path, { method, body, schema })`, `ApiError` carrying the status, and `getHealth()` as the only typed call | No payload schema exists yet; the other calls come in Build 1 |
| 0 | Setup: the client falls back to `http://localhost:3000` when `VITE_API_URL` is unset; no timeout and no retry in Setup; it attaches `Authorization: Bearer` from `localStorage` key `lampa.session` when the key exists. The 401 refresh stays in Cristea's lane | Ionut accepted all three; the key is Cristea's recorded Build 1 decision |
| 0 | Setup: approved `vitest` 5.1.0 (MIT, released 2026-11-02) as a dev dependency of `apps/web` only, `node` environment, no jsdom and no Testing Library. Tests: the route table holds exactly the five plan paths; the client covers a parsed 200, an `ApiError` on a 500 and a body that fails the schema, with `fetch` mocked | The section 8 tests are pure functions and need no DOM |
| 0 | Setup: Ionut installs Node 26 on this machine before implementation starts (it ran 24.11.0, the repo's `engines` says `26.x`) | Ionut's answer |
| 0 | Setup: branch `ionut/setup-routes-client`, one PR, opened as soon as the verify commands pass. `ionut/` goes to `main` first as a separate docs commit. The branch starts from `main` and does not wait for Cristea's PR #1 | Ionut's answer |
| 0 | Setup: two subagents in parallel, `ionut-routes` on `sonnet` and `ionut-api` on `opus`. The session commits the dependencies and the Vitest script itself before starting them | Ionut's answer |
| 0 | Setup: if the block runs late, the client tests are cut first, then `getHealth()`. The routes and a running Vitest are never cut | Other lanes build on them |
| 0 | No Vercel access for Ionut: Ionut's PRs get no Vercel preview (the check fails with "Git author … must have access"), and Cristea merges every team PR. PR #3 was merged by Ionut before this | The team's Vercel is on a free plan |
| 0 | Devices for Ionut's checks: an iPhone. No Android phone. The team's 30-minute contract session has not happened yet | Ionut's answer |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|
| 0 | S-last | The team's 30-minute contract session: payloads of the 8 event kinds and 7 socket messages as Zod schemas in `packages/shared` | Hold it before Build 1 starts; Fabi's `POST /events` is due by hour 6 | Ionut and the team |
| 0 | S-last | iPhone check after merge and Vercel deploy: `/` → `Landing`, `/s/abc` → `Site abc`, `/screen`, `/pulse`, `/curate` after a reload, `/nope` → `/` | Run it right after the merge | Ionut |
| 0 | S-last | The same check on the team's Android phone | Ask the teammate with the Android to run it | A teammate |

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|
| 0 | `PATHS` and the one route table | `apps/web/src/routes/paths.ts`, `apps/web/src/App.tsx` | All lanes adding pages |
| 0 | Placeholder pages to fill: `Screen.tsx`, `Curate.tsx` (Cristea); `Pulse.tsx` (Fabi) | `apps/web/src/routes/` | Cristea, Fabi |
| 0 | `api()`, `ApiError`, `API_URL`, `SESSION_KEY`, `getHealth()` | `apps/web/src/api/client.ts` | All web callers |
| 0 | `npm test` runs Vitest in `apps/web`; any `*.test.ts` under `apps/web/src` is picked up (`node` environment, no DOM) | `apps/web/package.json` | All lanes |
| 0 | Local dev against the local API needs `WEB_ORIGIN=http://localhost:5173` in the API's env | `apps/api` | All lanes |

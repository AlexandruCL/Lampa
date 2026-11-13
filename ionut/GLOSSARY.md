# Glossary: Ionut (Ionut, Phone experience)

Hour 0: 2026-11-13 13:21 (+0200).

## Done
| ID | What | Verify summary | Commit | Hour |
|---|---|---|---|---|

## Changes
Anything that differs from the plan, `DESIGN.md` or the contract, and any file outside this lane that was touched.
| Hour | ID | What changed | Files | Why |
|---|---|---|---|---|

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
| 0 | Devices for Ionut's checks: an iPhone. No Android phone. The team's 30-minute contract session has not happened yet | Ionut's answer |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|

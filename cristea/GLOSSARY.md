# Glossary: Cristea (Cristea, Identity, infra, Living Map)

Hour 0: 2026-11-13 13:21 (+0200).

Hours below marked "pre-0" were recorded on 2026-11-13, before the start.

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
| pre-0 | The `setup` prompt is written before the `build_1` prompt | Setup had not landed when Build 1 was requested |
| pre-0 | Setup: the Vercel and Render CLIs are installed on Cristea's machine and the session deploys through them. Cristea logs in to each one | Cristea's answer to the deploy question |
| pre-0 | Setup: the first scaffold commit goes straight to `main`. Everything after it uses branches and PRs | `main` has no code and no deploy yet, and three teammates wait on the scaffold |
| pre-0 | Setup: approved `tsx` 4.23.15 (MIT, released 2026-09-20) and `cors` 2.8.6 (MIT, released 2026-01-22). `packages/shared` is consumed as TypeScript source with no build of its own | A contract change needs no rebuild step |
| pre-0 | Setup: root scripts are `dev`, `build`, `typecheck` and `test`. No ESLint | The plan names no linter |
| pre-0 | Setup: the scaffold writes the eight event kinds and seven socket message names from plan section 6 as Zod enums. Payload shapes wait for the team's 30-minute session | Names are settled in the plan, payloads are a team decision |
| pre-0 | Setup: `.env.example` lists `PORT`, `DATABASE_URL`, `WEB_ORIGIN`, `SESSION_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `AGENT_TOOL_SECRET`, `VITE_API_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` | One list so no lane invents its own name |
| pre-0 | Setup: Vercel project `lampa-timisoara`, Render service `lampa-api` (free tier, Frankfurt) | Cristea's answer |
| pre-0 | Setup: one subagent, `cristea-infra`, on `sonnet` | Scaffolding is mechanical work |
| pre-0 | Build 1: tokens and components (web) run in parallel with the session token (API). `/screen` v1 starts once the tokens are merged. Cristea does Auth0 by hand meanwhile | Fabi needs `requireVisitor` by hour 6 |
| pre-0 | Build 1: Auth0 by hand from a checklist. Permissions `moderate:echo`, `write:site`. Roles `curator` (`moderate:echo`) and `admin` (both). Email code first, passkey only if it takes under 20 minutes. The API audience is the Render API URL | Plan section 9, Auth0 risk |
| pre-0 | Build 1: approved `jose` 6.2.17 (MIT, released 2026-11-09) and `express-rate-limit` 8.7.4 (MIT, released 2026-11-09) | Token signing, JWKS verification, rate limiting |
| pre-0 | Build 1: anonymous token is HS256 with `SESSION_SECRET`, `sub` = `anon:<uuid>`, 24 h, sent as `Authorization: Bearer`, stored in `localStorage` key `lampa.session`. On a 401 the client silently requests a new token. Limits: 10 per minute per IP on `POST /session/anon`, 120 per minute per subject on visitor routes, answered with 429 and `Retry-After` | Cristea's answer |
| pre-0 | Build 1: `tokens.css` is copied to `apps/web/src/styles/tokens.css`. Button, Notice, Ring and RoundControl go to `apps/web/src/components/<Name>/` with a CSS Module each. `design/css/` stays untouched | `design/css/` remains the design reference |
| pre-0 | Build 1: `/screen` v1 is coded against the `glow` schema in `packages/shared` until Fabi's socket lands. A Vitest covers the projection and the 2.4R spacing rule. The plan gets this test added when the Build 1 prompt is written | A silent projection bug puts sites off the map |
| pre-0 | Build 1: if late, cut in this order: passkey, component states beyond the smallest version in `DESIGN.md` section 9 item 1, `/screen` site labels. `requireVisitor` and the tokens are never cut | Other lanes wait on them |
| pre-0 | Build 1: subagents `cristea-ui` on `sonnet`, `cristea-api` on `opus`, `cristea-canvas` on `opus` | Cristea asked for models matched to difficulty and accepted this set |
| pre-0 | Build 1: branches `cristea/b1-foundation`, `cristea/b1-session`, `cristea/b1-screen`. Each branch is pushed and its PR opened as soon as its verify commands pass, without waiting for the end of the block. Auth0 env names go into `.env.example` on the session branch | Teammates are not blocked on Cristea's work |
| pre-0 | Devices for Cristea's checks: an iPhone and a laptop with HDMI. No Android phone | Cristea's answer |
| 0 | Setup: package names `@lampa/web`, `@lampa/api`, `@lampa/shared`; API port 3000 for local work; health path `GET /health` answering `{"ok":true}` | Cristea accepted the recommended set |
| 0 | Setup: Node major 26 (`engines.node` `26.x`; `NODE_VERSION=26` on Render). Vercel supports 26.x (default), 24.x, 22.x. Render lists no majors, resolves any version and defaults to 24.22.1 | Vercel's default and the local version (26.7.0) |
| 0 | Setup: approved `concurrently` 10.0.7 (MIT, released 2026-11-07) as a root dev dependency. Root `dev` = `concurrently "npm run dev -w @lampa/api" "npm run dev -w @lampa/web"` | npm runs scripts in cmd.exe on Windows, where `&` runs them one after the other |
| 0 | Setup: `cristea/` goes into git as a separate docs commit on `main` before the scaffold. Later glossary lines go on the lane's branches | Cristea's answer |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|

# Glossary: Cristea (Cristea, Identity, infra, Living Map)

Hour 0: 2026-11-13 13:21 (+0200).

Hours below marked "pre-0" were recorded on 2026-11-13, before the start.

## Done
| ID | What | Verify summary | Commit | Hour |
|---|---|---|---|---|
| S-0 | Preflight: baseline `001923e` with 9 tracked files; hour 0 and the five values recorded; Node majors looked up; Vercel CLI 65.15.0 and Render CLI 2.36.0 installed | `vercel whoami` → `alexandrucl`; `render whoami` → Alexandru Cristea; Render workspace set to Alexandru's workspace | 337752f | 0 |
| S-1.a.1 | Workspace scaffold with a health endpoint | fresh clone: `npm ci && npm run typecheck && npm run build && npm test` → exit 0, `✓ built in 131ms`; `GET /health` → `200 {"ok":true}` | 91d7046 | 0 |
| S-1.b.1 | `.env.example` with the twelve names | `git check-ignore -q .env && git check-ignore -q .env.local && ! git check-ignore -q .env.example && grep -c "=" .env.example` → `12`, exit 0; no `.env` path in `git log --all --name-only` | ffc18b2 | 0 |
| S-2.a.1 | `EventKind` (8) and `SocketMessage` (7) as Zod enums | `npm run typecheck && npx tsx -e ...` → `8 7`; both apps typecheck and build with an `EventKind` import; typecheck rejects an unknown kind | 018ae5e | 0 |
| S-1.c.1 | Vercel `lampa-timisoara` (root `apps/web`, Vite, Node 26.x, Git `AlexandruCL/Lampa` on `main`, `VITE_API_URL` in production) and Render `lampa-api` (free, Frankfurt, `main`, auto-deploy on, `npm ci`, `npm run start -w @lampa/api`, health `/health`, `NODE_VERSION=26`, `WEB_ORIGIN`) | `curl .../screen && curl .../health` → `200 {"ok":true}`; `OPTIONS` from the web origin → 204 with that origin in `Access-Control-Allow-Origin`; Render live deploy on `91d7046`; Vercel production came from a CLI upload of the branch at `018ae5e` (same page), and a Git push to the branch built a Ready preview at `6288882`. After PR #1 merged, both hosts deployed `7e97de0` from Git (Render `new_commit`, Vercel `source: git`, ref `main`) | no repo files | 0 |
| S-last | Branch on top of `main`; fresh-clone verify green; PR #1 open; glossary complete for this block | fresh clone of the branch: `npm ci && npm run typecheck && npm run build && npm test` → exit 0 | this commit | 0 |
| S-last checks | Phone checks on iPhone and Android; contract session | Reported by Cristea: phone checks work; the team agrees the contract | none | 0 |

## Changes
Anything that differs from the plan, `DESIGN.md` or the contract, and any file outside this lane that was touched.
| Hour | ID | What changed | Files | Why |
|---|---|---|---|---|
| 0 | S-1.a.1 | Added `@vitejs/plugin-react` and `@types/*` dev dependencies, which plan section 3 does not name | `apps/web/package.json`, `apps/api/package.json`, `package-lock.json` | Vite needs the plugin for JSX, and typecheck needs the types. Approved by Cristea |
| 0 | S-1.a.1 | npm blocks the `esbuild` postinstall script (`allowScripts`); build and API work without it. No `.gitattributes`, so git converts LF to CRLF on Windows | none | Noted for the team; nothing changed |
| 0 | S-2.a.1 | `index.ts` re-exports with `./contract.js`, not `./contract.ts` | `packages/shared/src/index.ts` | `tsconfig.base.json` has no `allowImportingTsExtensions`, so tsc rejects `.ts` (TS5097). tsc, tsx and Vite all resolve `.js` to the `.ts` source |
| 0 | S-1.c.1 | Render named the host `lampa-api-b45i.onrender.com`, not `lampa-api.onrender.com` | none | Render added the suffix |
| 0 | S-1.c.1 | The first Vercel deploy built at the repo root and failed, because `vercel git connect` triggered it before the root directory was set. A CLI redeploy replaced it | none | Order of CLI steps |
| 0 | S-1.c.1 | Git Bash rewrites leading-slash arguments such as `/health` into Windows paths. Prefix CLI calls with `MSYS_NO_PATHCONV=1` | none | Hit while creating the Render service |

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
| 0 | Setup: approved dev dependencies `@vitejs/plugin-react` 6.3.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/express` 5.0.6, `@types/cors` 2.8.19, `@types/node` 26.6.6 | Standard companions of Vite, React and Express in TypeScript; none ships in the bundle |
| 0 | Setup: the team agrees the contract as it stands in `packages/shared` (`EventKind` and `SocketMessage` names, no payload schemas yet). It may change later | Cristea's answer after the contract session |
| 0 | Setup: phone checks pass on iPhone and Android (`LAMPA` over HTTPS, `/screen` after a reload) | Cristea's report |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|
| 0 | Workspaces `@lampa/web`, `@lampa/api`, `@lampa/shared`; root scripts `dev`, `build`, `typecheck`, `test`; Node 26 | root `package.json` | all |
| 0 | `GET /health` → `{"ok":true}`, local API on port 3000 (`PORT` overrides), CORS from `WEB_ORIGIN` | `apps/api/src/index.ts` | all |
| 0 | Env names: `PORT`, `DATABASE_URL`, `WEB_ORIGIN`, `SESSION_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`, `AGENT_TOOL_SECRET`, `VITE_API_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` | `.env.example` (branch `cristea/setup-contract-env`) | all |
| 0 | `EventKind`, `SocketMessage` (Zod enums and types); import from `@lampa/shared` | `packages/shared/src/contract.ts` (branch `cristea/setup-contract-env`) | all |
| 0 | Web: https://lampa-timisoara.vercel.app (every path rewrites to `/index.html`) | Vercel `lampa-timisoara` | all, phone tests |
| 0 | API: https://lampa-api-b45i.onrender.com, `GET /health` → `{"ok":true}`. Free plan sleeps after about 15 min idle, so the first call can take about 50 s. CORS allows only `WEB_ORIGIN` (the production web URL), so Vercel preview URLs are blocked | Render `lampa-api` | all |

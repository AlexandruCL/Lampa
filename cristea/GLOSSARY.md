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
| B1-1.a.1 | Tokens copied to `apps/web/src/styles/tokens.css`, phone baseline meta tags, Atkinson 400/600/700 and Piazzolla 600 imported before the tokens in `main.tsx` | `cmp design/css/tokens.css apps/web/src/styles/tokens.css && npm run typecheck -w @lampa/web && npm run build -w @lampa/web && ls apps/web/dist/assets \| grep -c woff2` → cmp silent, `✓ built in 213ms`, `13` | this commit | 2 |
| B1-1.b.1 | `Icon` (nine names), `Button` (primary, secondary, quiet, icon; extras shipped: danger, loading), `Notice` (info, error; extra shipped: connection), reduced motion drops scale and translate | `npm run typecheck -w @lampa/web && npm run build -w @lampa/web` → exit 0, `✓ built in 253ms`; hex grep over the modules prints nothing | this commit | 3 |
| B1-1.c.1 | `Ring` (linear fill, hold), `RoundControl` (idle, listening, recording, disabled; extras shipped: speaking, connecting), `index.ts` with the six exports, six component tests | `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web` → exit 0, `Tests 13 passed (13)`; removing the rounding in `Ring` fails "ring exposes progressbar with a whole percent" | this commit | 3 |
| B1-4.a.1 | `sites.fixture.ts` (five sites), `projection.ts` (`project`, `spread`, `labelSides`, `layout` returning `{ id, x, y, label }`), nine projection tests | `npm run typecheck -w @lampa/web && npm test -w @lampa/web` → exit 0, `Tests 22 passed (22)`; `MIN_SPACING = 0` fails the three spacing cases (`3 failed | 19 passed`), restored | this commit | 7 |

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
| 0 | B1 prompt | Added a test to plan section 8: `/screen` projection and the 2.4R spacing rule, owner Cristea | `IMPLEMENTATION_PLAN.md` | Cristea's pre-0 decision; the team needs to see it |
| 1 | B1 prompt | After Ionut's PR #3: `/screen` mounts through `apps/web/src/routes/Screen.tsx` (no `App.tsx` line); the web session helper stores the raw token under `lampa.session` with no client expiry check, because Ionut's `api()` reads the key as a raw string; Vitest for `apps/web` comes from Ionut | `cristea/build_1/build_1_prompt.md` | The hour 0 decisions on the mount and on Vitest each named this case; the key format follows the code on `main` |
| 2 | B1-0 | Appended `GlowMessage` and `Site` to the team contract; installed `@fontsource/atkinson-hyperlegible-next` 5.3.0, `@fontsource/piazzolla` 5.3.0, `socket.io-client` 4.8.4 (web), `jose` 6.2.17, `express-rate-limit` 8.7.4, `vitest` 5.1.0 (api); added `test` script to `apps/api` | `packages/shared/src/contract.ts`, `apps/web/package.json`, `apps/api/package.json`, `package-lock.json` | Seam for B1-1, B1-3, B1-4 (Cristea's hour 0 decision); Fabi to agree the payloads |

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
| 0 | Build 1: `GlowMessage` = `{ sites: [{ siteId, glow 0 to 1 }] }` and `Site` = `{ id, name, lat, lng, is_memorial }` go into `packages/shared/src/contract.ts` as the first commit of `cristea/b1-foundation`, with no fourth branch. Cristea takes both to Fabi | `/screen` needs a payload to code against, and the contract had none |
| 0 | Build 1: until `packages/shared/sites.json` lands, `/screen` uses `apps/web/src/screen/sites.fixture.ts` with ids `mx`, `unirii`, `victoriei`, `bastion`, `cathedral` and approximate coordinates. The ids are proposed to Fabi | Fabi's `db:reset` has not landed |
| 0 | Build 1: `ScreenPage.tsx` is built in `apps/web/src/screen/`. If `main` has no router when `cristea/b1-screen` is ready, `App.tsx` gets one `location.pathname === "/screen"` line, replaced later by Ionut's route. No router library from Cristea | Ionut's routes have not landed |
| 0 | Build 1: approved `vitest` 5.1.0 (MIT, released 2026-11-02) in `apps/api` and `apps/web` with `"test": "vitest run --passWithNoTests"`, unless Ionut lands his first. No `supertest`: API tests use `fetch` against the app on port 0, so `apps/api/src` splits into `app.ts` and `index.ts` | The plan names Vitest and nobody had installed it |
| 0 | Build 1: approved `socket.io-client` 4.8.4 (MIT, released 2026-09-25). `/screen` connects to `VITE_API_URL` + `/live` with `query: { room: "screen" }` and no token, listens for `glow`, keeps the last state on reconnect. No stub server; the live check is Cristea's once Fabi's socket lands | Fabi's socket has not landed; the join rule goes to Fabi |
| 0 | Build 1: `requireVisitor` sets `req.visitor = { sub, kind: "anon" or "auth0", permissions }`; `visitorLimiter` is mounted after it. `POST /session/anon` answers `{ token, expiresAt }`. HS256 is checked with `SESSION_SECRET`, RS256 against the Auth0 JWKS; Auth0 tokens get 401 while `AUTH0_DOMAIN` is unset; every failure is 401 `{"error":"unauthorized"}`; `trust proxy` 1; the API refuses to start without `SESSION_SECRET`; the session sets a generated 32-byte `SESSION_SECRET` on Render through the CLI | Fabi builds on this seam by hour 6 |
| 0 | Build 1: `cristea-api` ships `apps/web/src/session.ts` with `getToken()` and `authFetch()` on the session branch | Ionut's typed API client has not landed and can wrap these |
| 0 | Build 1: `/screen` v1 draws colour sites as circles of R = 96 x u filled `--lamp` at alpha 0.25 + 0.75 x glow (0.25 under 0.15) with the 4.3 halo, easing over 1200 ms, with the name and the glow line under each. The Cathedral is a 1px `--line` outline with its name in `--text-2`. Glow is 0 before the first message. The start button, the under-1024px message and "Reconnecting to the city…" are in v1; counters, ticker, QR and map lines stay in Build 2 | `DESIGN.md` gives no fill for the plain circles |

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
| 3 | Tokens: `apps/web/src/styles/tokens.css` (copy of `design/css/tokens.css`), loaded once in `apps/web/src/main.tsx` after the fonts; style with its custom properties only | `apps/web/src/styles/tokens.css` (branch `cristea/b1-foundation`) | all |
| 3 | `import { Icon, type IconName, Button, Notice, Ring, RoundControl } from "../components"`. Button: primary, secondary, quiet, icon (needs `aria-label`), danger, loading; sizes m, l; `block`. Notice: info (optional `icon="headphones"`), error, connection; optional quiet `action`. Ring: `progress`, `size`, `filling`, `holdMs`, `label`. RoundControl: idle, listening, recording, speaking, connecting, disabled; `onPress`/`onRelease` with Space and Enter as hold | `apps/web/src/components/` (branch `cristea/b1-foundation`) | Ionut, Fabi |
| 3 | `GlowMessage` `{ sites: [{ siteId, glow 0..1 }] }` and `Site` `{ id, name, lat, lng, is_memorial }` (Zod and types); import from `@lampa/shared` | `packages/shared/src/contract.ts` (branch `cristea/b1-foundation`) | Fabi |

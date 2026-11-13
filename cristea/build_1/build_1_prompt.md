# Prompt: Cristea's Build 1, the spine (Identity, infra, Living Map, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 0 (2026-11-13 14:10 +0200). Implementation not started.**

You are implementing Cristea's part of Build 1 (hours 2 to 10) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *a tap on a phone changes what `/screen` shows.*

Checkpoint this block must pass (Checkpoint 1, the lines this lane affects):

*3. `/screen` brightens that site within 5 seconds.*

*4. `npm test` is green.*

*5. Ten minutes outdoors in daylight with both phones: the dark theme's text is readable on the join and site screens. If not, raise it with the team before Build 2.*

## 0. Ground rules

- **Cristea takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Cristea, with your recommendation. Nothing uses the recommendation until Cristea answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 10.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Cristea: carrying on, cutting (plan section 7) or moving it is their decision. Cristea's cut order for this block (pre-0): passkey first, then component states beyond the smallest version in `DESIGN.md` section 9 item 1, then `/screen` site labels. `requireVisitor` and the tokens are never cut.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Cristea, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Cristea's approval. Approved: `jose` 6.2.17 and `express-rate-limit` 8.7.4 (B1-3, pre-0); `vitest` 5.1.0 (B1-1, B1-3, B1-4, hour 0); `socket.io-client` 4.8.4 (B1-4, hour 0; the plan names Socket.IO); `@fontsource/atkinson-hyperlegible-next` 5.3.0 and `@fontsource/piazzolla` 5.3.0 (B1-1, named by the plan). No `supertest`, no router library, no jsdom.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. Work on branches: `cristea/b1-foundation` (the seam commit and B1-1), `cristea/b1-session` (B1-3), `cristea/b1-screen` (B1-4). One small PR per branch. Open it only after the verify commands pass, and as soon as they pass, without waiting for the end of the block. Cristea merges. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. `design/css/` stays untouched.
- Write in `cristea/` only. Other members' folders are read-only.
- **Keep `cristea/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Cristea a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- In Git Bash, prefix CLI calls that carry a leading-slash argument with `MSYS_NO_PATHCONV=1` (glossary, Changes, S-1.c.1).

## 1. Current state (checked at hour 0, 2026-11-13 13:49 +0200)

- Setup is closed: every S ID is under Done in the glossary, nothing carried over, nothing cut. `main` is clean at `747945b`. No open PRs. Remote branches: `main` and the two merged Setup branches.
- Web: `https://lampa-timisoara.vercel.app/screen` → 200. `apps/web/src/App.tsx` renders the text `LAMPA` on every path. There is no router.
- API: `https://lampa-api-b45i.onrender.com/health` → 200 `{"ok":true}`. `apps/api/src/index.ts` holds the whole app (CORS from `WEB_ORIGIN`, `/health`, `listen`).
- Contract: `packages/shared/src/contract.ts` exports `EventKind` (8) and `SocketMessage` (7) as Zod enums. No payload schema exists. `GlowMessage` and `Site` are added by B1-0.
- `packages/shared/sites.json` does not exist (Fabi's Setup row). B1-4 uses a fixture until it lands.
- Design reference: `design/css/tokens.css` (169 lines, holds 2.1, 3, 4, 5.1, the 4.5 baseline and the 6.1 focus rule), `design/css/components.css` (Button, Ring, RoundControl, Notice and the rest), `design/css/livingmap.css`. Nothing of it is in `apps/web` yet: B1-1 adds it.
- Scripts: root `dev`, `build`, `typecheck`, `test`. No workspace has a `test` script, so `npm test` runs zero tests and exits 0. Vitest is not installed. B1-0 adds it.
- `.env.example` already lists `SESSION_SECRET`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`. No name is added in this block.
- Needs from others: socket messages from Fabi by hour 6: not landed. No other member has a `GLOSSARY.md` yet. Ionut's routes, typed API client and Vitest: not landed. Fabi's `sites.json`: not landed.
- Other lanes wait on this lane for: the tokens and base components (everyone, from the start of Build 1) and `requireVisitor` (Fabi, by hour 6).
- Devices for Cristea's checks: an iPhone and a laptop with HDMI. No Android phone. Node 26.7.0, Vercel CLI and Render CLI installed and logged in.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 1, Cristea's rows and Checkpoint 1 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Cristea's table and "Needs from others" | All |
| `cristea/GLOSSARY.md` | Whole file | All |
| `DESIGN.md` | Section 9, items 1 and 3 | B1-1, B1-4 |
| `DESIGN.md` | Sections 3.1, 4.5, 4.6, 4.7, 5.6, 6.1, 6.2, 6.3, 6.4, 6.7 | B1-1 |
| `design/css/tokens.css`, `design/css/components.css` (shared rules, 6.2, 6.3, 6.4, 6.7) | Whole file; the named blocks | B1-1 |
| `DESIGN.md` | Sections 2.3, 3.3, 4.3, 4.5, 5.5, 5.6, 7.13 | B1-4 |
| `design/css/livingmap.css` | Whole file | B1-4 |
| `packages/shared/src/contract.ts` | `GlowMessage`, `Site` | B1-0, B1-4 |
| `apps/api/src/index.ts`, `apps/api/package.json` | Whole file | B1-3 |
| `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/index.html`, `apps/web/package.json` | Whole file | B1-1, B1-4 |
| `.env.example` | Whole file | B1-2, B1-3 |
| `IMPLEMENTATION_PLAN.md` | Section 8 (tests), section 9 (Auth0 and Cristea rows) | B1-2, B1-3, B1-4 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Design tokens first: `tokens.css`, the two self-hosted fonts (`@fontsource/atkinson-hyperlegible-next`, `@fontsource/piazzolla`), the nine icons, Button, Notice, Ring, RoundControl, as `DESIGN.md` specifies. Everyone styles against these | 2.5 | B1-1.a, B1-1.b, B1-1.c |
| `DESIGN.md` section 9 item 1: Foundation. Smallest version: Button primary, secondary, quiet, icon; Notice info and error; Ring with linear fill; RoundControl idle, listening, recording, disabled | in the 2.5 | B1-1.a, B1-1.b, B1-1.c |
| Auth0 tenant: SPA app, API with RBAC and permissions in the token, roles, passwordless and passkey | 1.5 | B1-2.a |
| `POST /session/anon` (signed JWT, 24 h), `requireVisitor` middleware that accepts the anon token or an Auth0 token, rate limiting | 2 | B1-3.a, B1-3.b, B1-3.c |
| Section 8: Anonymous token: expired or tampered tokens are rejected | in the 2 | B1-3.b |
| `/screen` v1: sites placed by projecting lat and lng onto the canvas, brightness follows glow, live over the socket | 3 | B1-4.a, B1-4.b, B1-4.c |
| `DESIGN.md` section 9 item 3: Living Map base: palette, projection, five-site spacing rule, start button. Smallest version: 7.13 site labels; projection fitted to the five sites until the polylines land; windows as plain circles until item 6 | in the 3 | B1-4.a, B1-4.c |
| Section 8 (added at hour 0 by Cristea's decision): `/screen` projection: the five sites land inside the map area, and no two are closer than 2.4R after the spacing rule | in the 3 | B1-4.a |
| Checkpoint 1, line 3: `/screen` brightens that site within 5 seconds | | B1-4.b, B1-4.c, B1-last |
| Checkpoint 1, line 4: `npm test` is green | | B1-0, B1-last |
| Checkpoint 1, line 5: daylight readability of the dark theme | | B1-1.a, B1-last (the tokens carry the contrast; the check itself is on Ionut's screens) |

Total: 9 h of tasks in an 8 h block. The plan accepts this (section 9, "Cristea is over budget").

Order: B1-0 first (this session). Then B1-1 (`cristea-ui`) and B1-3 (`cristea-api`) run in parallel, while Cristea does B1-2 by hand. Inside B1-1 and inside B1-3 the agent tasks run one after another. B1-4 (`cristea-canvas`) starts once `cristea/b1-foundation` is merged into `main`. Fabi needs `requireVisitor` by hour 6, so `cristea/b1-session` gets its PR the moment its verify passes.

The seam. This session writes it in B1-0 and commits it as the first commit of `cristea/b1-foundation` (Cristea's decision, hour 0). `cristea/b1-session` branches from that commit.

Appended to `packages/shared/src/contract.ts` (owner of the file: the team; proposed to Fabi by Cristea):

```ts
export const GlowMessage = z.object({
  sites: z.array(z.object({ siteId: z.string(), glow: z.number().min(0).max(1) })),
});
export type GlowMessage = z.infer<typeof GlowMessage>;

export const Site = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  is_memorial: z.boolean(),
});
export type Site = z.infer<typeof Site>;
```

The API seam, written by `cristea-api` in `apps/api/src/auth/session.ts` and used by Fabi:

```ts
export type Visitor = { sub: string; kind: "anon" | "auth0"; permissions: string[] };
declare global { namespace Express { interface Request { visitor?: Visitor } } }
export const requireVisitor: RequestHandler;   // sets req.visitor or answers 401 {"error":"unauthorized"}
export const visitorLimiter: RequestHandler;   // 120 per minute per req.visitor.sub; mount after requireVisitor
export const sessionRouter: Router;            // POST /session/anon → 200 {"token": string, "expiresAt": string (ISO 8601)}
```

### 3.1 Subagents

Cristea asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Cristea, re-runs the checks, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `cristea-ui` | Tokens, fonts, icons and base React components with CSS Modules in `apps/web` | sonnet | new |
| `cristea-api` | Session token, `requireVisitor`, rate limiting and their tests in `apps/api`, plus the web session helper | opus | new |
| `cristea-canvas` | The `/screen` projection, glow state, socket client and Canvas 2D drawing in `apps/web/src/screen` | opus | new |

`cristea-infra` from Setup stays in `.claude/agents/` and has no task in this block.

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B1-1.a.1 | `cristea-ui` | Tokens, phone baseline, fonts | `apps/web/src/styles/tokens.css`, `apps/web/index.html`, `apps/web/src/main.tsx` | parallel with B1-3 |
| B1-1.b.1 | `cristea-ui` | Icon, Button, Notice | `apps/web/src/components/Icon/`, `Button/`, `Notice/` | after B1-1.a.1 |
| B1-1.c.1 | `cristea-ui` | Ring, RoundControl, the component test, the index | `apps/web/src/components/Ring/`, `RoundControl/`, `apps/web/src/components/index.ts`, `apps/web/src/components/components.test.tsx` | after B1-1.b.1 |
| B1-3.a.1 | `cristea-api` | App split, `POST /session/anon`, `requireVisitor` | `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/auth/session.ts`, the `scripts` block of `apps/api/package.json` | parallel with B1-1 |
| B1-3.b.1 | `cristea-api` | Rate limiting and the API tests | `apps/api/src/auth/session.ts`, `apps/api/src/app.ts`, `apps/api/src/auth/session.test.ts` | after B1-3.a.1 |
| B1-3.c.1 | `cristea-api` | Web session helper | `apps/web/src/session.ts`, `apps/web/src/session.test.ts` | after B1-3.b.1 |
| B1-4.a.1 | `cristea-canvas` | Projection, spacing rule, fixture, tests | `apps/web/src/screen/projection.ts`, `projection.test.ts`, `sites.fixture.ts` | after `cristea/b1-foundation` is merged |
| B1-4.b.1 | `cristea-canvas` | Glow state and the socket hook | `apps/web/src/screen/glow.ts`, `glow.test.ts`, `useGlowSocket.ts` | after B1-4.a.1 |
| B1-4.c.1 | `cristea-canvas` | Canvas drawing and the page | `apps/web/src/screen/canvas.ts`, `ScreenPage.tsx`, `ScreenPage.module.css`, and one line of `apps/web/src/App.tsx` under the condition in the task | after B1-4.b.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- B1-1 and B1-3 run at the same time on different branches, so start each of those two agents with `isolation: "worktree"`. Each agent's first step is in its task: check out its branch and run `npm ci`.
- No agent edits `package.json` dependencies or `package-lock.json`. B1-0 installs every approved library. If a task turns out to need another one, the agent stops and reports.
- If the Agent tool does not list one of these subagents, stop and ask Cristea to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Cristea. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Cristea, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B1-0 Preflight and seam (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm ci && npm run typecheck && npm run build && npm test`.
- [ ] Re-check each "Needs from others" item of section 1: `git fetch`, `ls */GLOSSARY.md`, `ls packages/shared/sites.json`, and whether `apps/web` has a router or a `test` script on `main`. If Ionut's Vitest has landed, skip the Vitest install for `apps/web` below and record it.
- [ ] Create `cristea/b1-foundation` from `main`.
- [ ] Append `GlowMessage` and `Site` to `packages/shared/src/contract.ts` exactly as in the seam above. `index.ts` already re-exports the file.
- [ ] Install, with exact versions: in `@lampa/web` dependencies `@fontsource/atkinson-hyperlegible-next@5.3.0`, `@fontsource/piazzolla@5.3.0`, `socket.io-client@4.8.4`; in `@lampa/web` devDependencies `vitest@5.1.0`; in `@lampa/api` dependencies `jose@6.2.17`, `express-rate-limit@8.7.4`; in `@lampa/api` devDependencies `vitest@5.1.0`.
- [ ] Add `"test": "vitest run --passWithNoTests"` to the scripts of `apps/web/package.json` and `apps/api/package.json`.
- [ ] Commit as `feat(shared) added GlowMessage and Site to the contract and installed the Build 1 libraries`, push the branch, then create `cristea/b1-session` from that commit and push it.
- [ ] Generate a 32-byte secret (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`) and set it as `SESSION_SECRET` on the Render service `lampa-api` with the Render CLI, without printing it into the chat or a file in git. Put a second generated value in the local root `.env`. This is done before `cristea/b1-session` is merged, because the API refuses to start without it (Cristea's decision, hour 0). If the CLI cannot set an env var, stop and ask Cristea to paste it in the Render dashboard.
- [ ] Tell Cristea to take to the team: `GlowMessage` and `Site` (Fabi emits one and seeds the other), the site ids `mx`, `unirii`, `victoriei`, `bastion`, `cathedral`, the socket join `query: { room: "screen" }` on namespace `/live` with no token, and the new section 8 test in the plan.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently; both branches are on the remote with the seam commit; `SESSION_SECRET` is set on Render.

### B1-1 Design tokens, fonts, icons, Button, Notice, Ring, RoundControl (2.5 h)

Branch `cristea/b1-foundation`. Components go to `apps/web/src/components/<Name>/<Name>.tsx` with `<Name>.module.css` each (Cristea's decision, pre-0). Each CSS Module is ported from the matching block of `design/css/components.css`, with the same values and class names in camelCase, and reads only custom properties from `tokens.css`.

#### B1-1.a Tokens, baseline and fonts are loaded by the app

**B1-1.a.1** Tokens, phone baseline, fonts. Subagent: `cristea-ui`. Files: `apps/web/src/styles/tokens.css`, `apps/web/index.html`, `apps/web/src/main.tsx`.

- [ ] First: `git checkout cristea/b1-foundation && npm ci`.
- [ ] Copy `design/css/tokens.css` to `apps/web/src/styles/tokens.css` byte for byte. `design/css/` stays untouched.
- [ ] `apps/web/index.html`: the three meta tags from `DESIGN.md` 4.5 (`viewport` with `viewport-fit=cover, interactive-widget=resizes-content`, `theme-color` `#0E121A`, `color-scheme` `dark`), `lang="en"`, title `LAMPA`.
- [ ] `apps/web/src/main.tsx` imports, in this order: `@fontsource/atkinson-hyperlegible-next/400.css`, `/600.css`, `/700.css`, `@fontsource/piazzolla/600.css`, then `./styles/tokens.css`. No other weight.
- [ ] Commit: `feat(web) added the design tokens, the phone baseline and the two fonts`.
- Verify: `cmp design/css/tokens.css apps/web/src/styles/tokens.css && npm run typecheck -w @lampa/web && npm run build -w @lampa/web && ls apps/web/dist/assets | grep -c woff2`. Paste the summary line.
- Done when: `cmp` prints nothing, the build passes, and the woff2 count is above 0.

#### B1-1.b Icon, Button and Notice exist in their smallest version

**B1-1.b.1** Icon, Button, Notice. Subagent: `cristea-ui`. Files: `apps/web/src/components/Icon/`, `apps/web/src/components/Button/`, `apps/web/src/components/Notice/`.

- [ ] `Icon`: one component, prop `name` typed as the union `"back" | "close" | "play" | "pause" | "stop" | "mic" | "check" | "alert" | "headphones"`, prop `size` (number, 24 when absent). Paths, viewBox, stroke rules and the three filled icons exactly as `DESIGN.md` 4.7. `aria-hidden="true"` always; the accessible name belongs to the parent.
- [ ] `Button`: props `variant: "primary" | "secondary" | "quiet" | "icon"`, `size: "m" | "l"` (`m` when absent), `block?: boolean`, `icon?: IconName`, plus the native button attributes. The `icon` variant requires `aria-label` in its type. Pressed, disabled and hover rules as in 6.2 and `components.css`; hover only inside `@media (hover: hover) and (pointer: fine)`. `type="button"` when absent.
- [ ] `Notice`: props `variant: "info" | "error"`, `children`, `action?: { label: string; onClick: () => void }`. `info` has `role="status"` and no icon unless `icon="headphones"` is passed; `error` has `role="alert"` and the `alert` icon in `--danger`. The action is a quiet `Button`.
- [ ] Then, only inside this task's share of the hours (1 h), in this order: Button `danger`, Button loading (`aria-busy="true"`, spinner, taps ignored), Notice `connection` (`role="status"`, `alert` icon in `--text-2`). Stop where the hour ends and report which of the three shipped.
- [ ] Reduced motion as `DESIGN.md` 5.6: no `scale` and no `translate` under `prefers-reduced-motion: reduce`.
- [ ] Commit: `feat(web) added Icon, Button and Notice`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web`. Paste the summary line.
- Done when: the three components compile, and no CSS Module holds a colour, font or spacing literal that `tokens.css` has a property for (`grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/components/{Icon,Button,Notice}/*.css` prints nothing).

#### B1-1.c Ring and RoundControl exist in their smallest version, and the set is tested and exported

**B1-1.c.1** Ring, RoundControl, test, index. Subagent: `cristea-ui`. Files: `apps/web/src/components/Ring/`, `apps/web/src/components/RoundControl/`, `apps/web/src/components/index.ts`, `apps/web/src/components/components.test.tsx`.

- [ ] `Ring`: props `progress` (0 to 1), `size` (px, 112 when absent), `filling?: boolean`, `holdMs?: number` (sets `--hold`), `label: string` (the `aria-label`). SVG as the comment in `components.css` 6.3: track and progress share r, `stroke-dasharray` is the circumference, `stroke-dashoffset` is circumference × (1 − progress), group rotated −90 degrees. `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` in whole percent.
- [ ] `RoundControl`: props `state: "idle" | "listening" | "recording" | "disabled"`, `label: string` (always visible under the control), `status?: string` (the line above, shown with the `--danger` dot while `recording`), `progress?: number` (the Ring while `recording`), `level?: number` (0 to 1, written to the level ring's `style.transform` as `scale(1 + 0.08 × level)` while `listening`), `onPress`, `onRelease`. `idle`: mic icon. `listening`: `--lamp` fill. `recording`: stop icon and the Ring. `disabled`: native `disabled`, no ring. Space and Enter held act as hold. Icon size 32.
- [ ] Then, only inside this task's share of the hours (1 h), in this order: RoundControl `speaking`, RoundControl `connecting` (spinner inside). Stop where the hour ends and report which shipped.
- [ ] `apps/web/src/components/index.ts` exports `Icon`, `IconName`, `Button`, `Notice`, `Ring`, `RoundControl`.
- [ ] `components.test.tsx`, with `renderToStaticMarkup` from `react-dom/server` (no DOM library), cases by name: "icon button carries its aria-label"; "notice error is an alert and notice info is a status"; "ring exposes progressbar with a whole percent" (progress 0.724 → `aria-valuenow="72"`); "round control disabled renders a disabled button and no ring"; "round control recording shows the stop icon and the status text"; "every icon name renders a path".
- [ ] Commit: `feat(web) added Ring and RoundControl with the component tests`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the six cases pass and the index exports the six names.

### B1-2 Auth0 tenant: SPA app, API with RBAC and permissions in the token, roles, passwordless and passkey (1.5 h)

#### B1-2.a The tenant issues tokens the API can check

Cristea does this by hand in the Auth0 dashboard while the agents run (Cristea's decision, pre-0). Cristea's task. Do not mark it done. This session records the values and sets the env vars.

**B1-2.a.1** Auth0 checklist. By Cristea, with this session for the env vars. Files: none in the repo.

- [ ] Cristea: an API with identifier `https://lampa-api-b45i.onrender.com` (the audience is the Render API URL), signing RS256, "Enable RBAC" on, "Add Permissions in the Access Token" on.
- [ ] Cristea: permissions `moderate:echo` and `write:site` on that API.
- [ ] Cristea: roles `curator` (`moderate:echo`) and `admin` (`moderate:echo`, `write:site`). Cristea's own user gets `admin`.
- [ ] Cristea: a Single Page Application named `LAMPA`. Allowed callback URLs, logout URLs and web origins: `https://lampa-timisoara.vercel.app` and `http://localhost:5173`.
- [ ] Cristea: passwordless with the email code, enabled for the `LAMPA` application. This comes first.
- [ ] Cristea: passkey, only if it takes under 20 minutes. It is first in this block's cut order.
- [ ] Cristea gives this session the tenant domain and the SPA client id. This session sets `AUTH0_DOMAIN` and `AUTH0_AUDIENCE=https://lampa-api-b45i.onrender.com` on Render `lampa-api`, and `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` on Vercel `lampa-timisoara` (production), and writes the domain and the audience (not secrets) under Hand-offs.
- Verify: `curl -s -o /dev/null -w "%{http_code}" https://<AUTH0_DOMAIN>/.well-known/jwks.json` with the domain Cristea gave. Paste the summary line.
- Done when: the command prints 200, the four env vars are set, and Cristea reports that an email code sign-in reaches the callback URL. MFA for staff is Build 3.

### B1-3 `POST /session/anon` (signed JWT, 24 h), `requireVisitor`, rate limiting, token test (2 h)

Branch `cristea/b1-session`. All values below are Cristea's decisions (pre-0 and hour 0).

#### B1-3.a The API issues an anonymous token and checks tokens

**B1-3.a.1** App split, `POST /session/anon`, `requireVisitor`. Subagent: `cristea-api`. Files: `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/auth/session.ts`, the `scripts` block of `apps/api/package.json`.

- [ ] First: `git checkout cristea/b1-session && npm ci`.
- [ ] `apps/api/src/app.ts` exports `createApp(): Express` with what `index.ts` holds now (CORS from `WEB_ORIGIN`, `GET /health`), plus `app.set("trust proxy", 1)`, `express.json()` and `sessionRouter`. `index.ts` only reads `PORT` and listens.
- [ ] `createApp` throws `SESSION_SECRET is not set` when the variable is empty, so the API refuses to start without it.
- [ ] Scripts in `apps/api/package.json`: `dev` becomes `tsx watch --env-file-if-exists=../../.env src/index.ts`, `start` becomes `tsx --env-file-if-exists=../../.env src/index.ts`. Nothing else in that file changes.
- [ ] `apps/api/src/auth/session.ts` exports `Visitor`, `requireVisitor`, `visitorLimiter` and `sessionRouter` with the signatures of the seam in section 3, word for word.
- [ ] `POST /session/anon`: signs with `jose` `SignJWT`, HS256, key `SESSION_SECRET`, `sub` = `anon:<crypto.randomUUID()>`, `iat` now, `exp` now + 24 h. Answers 200 `{ "token", "expiresAt" }`, `expiresAt` in ISO 8601. No request body is read.
- [ ] `requireVisitor`: reads `Authorization: Bearer <token>`. It reads the token's `alg` header: `HS256` is verified with `SESSION_SECRET` and `algorithms: ["HS256"]`, and gives `{ sub, kind: "anon", permissions: [] }`; `RS256` is verified with `createRemoteJWKSet(https://${AUTH0_DOMAIN}/.well-known/jwks.json)`, `issuer` `https://${AUTH0_DOMAIN}/`, `audience` `AUTH0_AUDIENCE`, `algorithms: ["RS256"]`, and gives `{ sub, kind: "auth0", permissions }` from the token's `permissions` claim (an empty array when absent). Any other `alg`, a missing header, a failed check, or an RS256 token while `AUTH0_DOMAIN` is unset: 401 `{ "error": "unauthorized" }` and nothing else in the body.
- [ ] The key resolver for RS256 is a parameter with the remote JWKS as its value in production (`makeRequireVisitor(getKey)`; `requireVisitor` is that function called with the remote set), so the test in B1-3.b.1 passes a local key.
- [ ] Commit: `feat(api) added the anonymous session token and requireVisitor`.
- Verify: `npm run typecheck -w @lampa/api && SESSION_SECRET=x PORT=3999 npx tsx apps/api/src/index.ts & sleep 3; curl -s -X POST localhost:3999/session/anon; curl -s -o /dev/null -w " %{http_code}\n" localhost:3999/health; kill %1`. Paste the summary line.
- Done when: the POST prints a JSON object with `token` and `expiresAt`, `/health` prints 200, and starting without `SESSION_SECRET` exits with the error.

#### B1-3.b Limits hold and bad tokens are rejected

**B1-3.b.1** Rate limiting and the API tests. Subagent: `cristea-api`. Files: `apps/api/src/auth/session.ts`, `apps/api/src/app.ts`, `apps/api/src/auth/session.test.ts`.

- [ ] `POST /session/anon` is limited to 10 per minute per IP with `express-rate-limit` (`windowMs` 60000, `limit` 10). Over the limit: 429 with a `Retry-After` header.
- [ ] `visitorLimiter`: 120 per minute, `keyGenerator` returns `req.visitor.sub`. Over the limit: 429 with `Retry-After`. Both limiters use the built-in memory store, with the comment `// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance`.
- [ ] `session.test.ts` starts `createApp()` plus one test-only route `GET /probe` behind `requireVisitor, visitorLimiter` on port 0 and calls it with `fetch`. Cases by name: "anon token from POST /session/anon passes and sets sub anon:<uuid>, kind anon, no permissions"; "expired anon token is rejected with 401"; "tampered anon token is rejected with 401" (one character of the payload changed); "token signed with another secret is rejected with 401"; "alg none is rejected with 401"; "missing Authorization header is rejected with 401"; "RS256 token is rejected with 401 while AUTH0_DOMAIN is unset"; "RS256 token with the right issuer and audience passes with kind auth0 and its permissions" (generated key pair, local key resolver); "RS256 token with another audience is rejected with 401"; "11th POST /session/anon in a minute gets 429 with Retry-After"; "121st visitor request in a minute gets 429 with Retry-After".
- [ ] Check that the rule bites: change the HS256 verification to accept any signature, see "tampered" fail, and restore it. Say so in the report.
- [ ] Commit: `test(api) added rate limits and the session token tests`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the eleven cases pass.

#### B1-3.c The web app holds and renews the token

**B1-3.c.1** Web session helper. Subagent: `cristea-api`. Files: `apps/web/src/session.ts`, `apps/web/src/session.test.ts`.

- [ ] `getToken(): Promise<string>`: returns the token stored in `localStorage` under `lampa.session` (stored as `{ token, expiresAt }`) when `expiresAt` is in the future; otherwise calls `POST ${import.meta.env.VITE_API_URL}/session/anon`, stores the answer and returns the token. Concurrent callers share one request.
- [ ] `authFetch(path, init?)`: `fetch(VITE_API_URL + path)` with `Authorization: Bearer <token>`. On a 401 it drops the stored token, gets a new one silently and retries once. A second 401 is returned to the caller. A 429 is returned to the caller untouched.
- [ ] `localStorage` reads and writes sit in try/catch; when storage throws (private mode), the token lives in memory for the page's life.
- [ ] `session.test.ts` with `vi.stubGlobal` for `fetch` and `localStorage`, cases by name: "first call requests a token and stores it under lampa.session"; "a stored unexpired token is reused without a request"; "an expired stored token is replaced"; "two concurrent getToken calls make one request"; "authFetch retries once after a 401 with a new token"; "authFetch returns the second 401"; "storage that throws falls back to memory".
- [ ] Commit: `feat(web) added the anonymous session helper`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the seven cases pass.

### B1-4 `/screen` v1: sites on canvas, brightness from glow (3 h)

Branch `cristea/b1-screen`, created from `main` after `cristea/b1-foundation` is merged. Scope of v1 (Cristea's decision, hour 0): the map area with the five sites, the start screen, the narrow-window message, and a side panel holding only the wordmark and the reconnect line. Counters, Ticker, QR, RoseWindow panes, the Gallery window, map lines, the OpenStreetMap credit and candle points are Build 2 and Build 3.

#### B1-4.a Sites land on the canvas in the right place and never overlap

**B1-4.a.1** Projection, spacing rule, fixture, tests. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/projection.ts`, `apps/web/src/screen/projection.test.ts`, `apps/web/src/screen/sites.fixture.ts`.

- [ ] First: `git checkout cristea/b1-screen && npm ci`.
- [ ] `sites.fixture.ts` exports `sites: Site[]` (type from `@lampa/shared`) with exactly these rows, and the comment `// shortcut: approximate coordinates until packages/shared/sites.json lands; swap the import in ScreenPage.tsx then`: `mx`, "Muzeul MX Corneliu Miklosi", 45.7610, 21.2480; `unirii`, "Piața Unirii", 45.7579, 21.2290; `victoriei`, "Piața Victoriei", 45.7537, 21.2253; `bastion`, "Theresia Bastion", 45.7573, 21.2340; `cathedral`, "Metropolitan Cathedral", 45.7507, 21.2243, `is_memorial: true`. The other four have `is_memorial: false`.
- [ ] Named constants in `projection.ts`: `DESIGN_WIDTH = 1920`, `MAP_WIDTH = 1380`, `DESIGN_HEIGHT = 1080`, `PADDING = 0.12`, `SITE_RADIUS = 96`, `MIN_SPACING = 2.4`, `SPACING_PASSES = 20`, `REF_LAT_DEG = 45.75`. All geometry is computed in design units (1920 × 1080); the drawing code multiplies by `canvas.width / 1920`.
- [ ] `project(sites): { id, x, y }[]`: equirectangular, x = lng × cos(45.75 degrees), y = −lat; one uniform scale that fits the bounding box of the sites into the map area (0 to 1380 by 0 to 1080) inset by 12% on each side, centred in it. One site, or sites sharing one point, land at the centre of the map area.
- [ ] `spread(points)`: up to 20 passes; in each pass, for each pair closer than 2.4 × 96 centre to centre, push both apart equally along the line between them to exactly that distance (a pair at the same point is pushed along x); then clamp each point inside the 12% padding. Stops early when a pass moves nothing.
- [ ] `labelSides(points): Record<id, "below" | "above">`: every label is below its circle; when two labels (taken as boxes 320 wide and 74 high, starting 10 under the circle) overlap, the lower site's label goes above its circle.
- [ ] `layout(sites)` = `project`, then `spread`, then `labelSides`, returned as one array.
- [ ] `projection.test.ts`, cases by name: "the five fixture sites land inside the padded map area"; "north is up and east is right" (`unirii` above `cathedral`, `mx` right of `victoriei`); "the scale is the same on both axes" (two known distances keep their ratio within 1%); "no two fixture sites are closer than 2.4R after spread"; "two sites at the same point end 2.4R apart"; "a point pushed past the padding is clamped inside it"; "spread leaves well-spaced points untouched"; "a single site lands at the centre"; "when two labels overlap the lower site's label goes above".
- [ ] Check that the rule bites: set `MIN_SPACING` to 0, see the 2.4R cases fail, and restore it. Say so in the report.
- [ ] Commit: `feat(screen) added the site projection and the spacing rule with tests`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the nine cases pass.

#### B1-4.b Glow messages reach the page state

**B1-4.b.1** Glow state and the socket hook. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/glow.ts`, `apps/web/src/screen/glow.test.ts`, `apps/web/src/screen/useGlowSocket.ts`.

- [ ] `glow.ts`: `applyGlow(state: Record<string, number>, message: unknown): Record<string, number>` parses with `GlowMessage.safeParse`; an invalid message returns the same state object; a valid one returns the state with each listed `siteId` set, and sites it does not list keep their value. `glowWord(glow)`: under 0.15 "Asleep", 0.15 to under 0.60 "Waking", 0.60 to under 1 "Awake", 1 "Fully lit". `glowLine(glow)`: the word, a comma and the whole percent, as in "Awake, 72%". `glowAlpha(glow)`: 0.25 under 0.15, otherwise 0.25 + 0.75 × glow. `haloAlpha(glow)`: 0 under 0.15, otherwise 0.35 × glow.
- [ ] `useGlowSocket(): { glowRef: RefObject<Record<string, number>>, connected: boolean }`. It connects with `io(`${import.meta.env.VITE_API_URL}/live`, { query: { room: "screen" } })`, sends no token, and on the message named `SocketMessage.enum.glow` writes `applyGlow` into the ref (a ref, so no React state changes per message beyond `connected`). Socket.IO's built-in reconnect stays on. On disconnect the ref keeps its last state. It closes the socket on unmount.
- [ ] `glow.test.ts`, cases by name: "a valid message sets the listed sites"; "sites not listed keep their value"; "a glow above 1 is ignored and the state object is unchanged"; "a message that is not an object is ignored"; "glowWord at 0, 0.14, 0.15, 0.59, 0.60, 0.99 and 1"; "glowLine prints Awake, 72%"; "glowAlpha is 0.25 under 0.15 and 1 at 1"; "haloAlpha is 0 under 0.15 and 0.35 at 1".
- [ ] Commit: `feat(screen) added the glow state and the socket hook`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the eight cases pass. The live socket is not verified here: Fabi's `/live` has not landed (hour 0). It is Cristea's check in B1-last.

#### B1-4.c `/screen` draws the sites and their glow

**B1-4.c.1** Canvas drawing and the page. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/canvas.ts`, `apps/web/src/screen/ScreenPage.tsx`, `apps/web/src/screen/ScreenPage.module.css`, and one line of `apps/web/src/App.tsx` under the condition below.

- [ ] `ScreenPage.module.css` ports these blocks of `design/css/livingmap.css`: `.living-map`, `__map`, `__panel`, `__mark`, `__status`, `__start`, `__start-line`, `__narrow` and its media query. Same values, camelCase class names.
- [ ] `ScreenPage.tsx`, before the click: the start screen with the wordmark `LAMPA`, a primary L `Button` "Start the Living Map" and the line "Turns on the room sound.". After the click the start screen is gone until reload. v1 plays no sound.
- [ ] After the click: the map area with one `<canvas>` filling it, and the side panel with the wordmark and, only after the socket has been disconnected for 3 s, the line "Reconnecting to the city…". The line disappears on reconnect.
- [ ] Under 1024px wide: only the message "The Living Map needs a screen at least 1024 px wide.".
- [ ] `canvas.ts` exports `startCanvas(canvas, sites, glowRef): () => void` (returns the stop function). One `requestAnimationFrame` loop. `devicePixelRatio` capped at 2. The loop pauses while `document.hidden`. It waits for `document.fonts.ready` before the first text draw. It re-fits on window resize. No React state is updated per frame.
- [ ] Colours and fonts come from `getComputedStyle(document.documentElement)` custom properties (`--bg`, `--lamp`, `--line`, `--text`, `--text-2`, `--font-ui`, `--font-display`). No hex value and no font name in the file.
- [ ] Each colour site: a disk of radius 96 × scale filled `--lamp` at `glowAlpha(glow)`, over a halo that is a radial gradient of `--lamp` from `haloAlpha(glow)` at the centre to 0 at 1.6 × the radius. The displayed glow eases to each new value over 1200 ms. Before the first message every site is at glow 0.
- [ ] Each colour site's label, on the side `layout` gives: the name in `--screen-name` (600 30/36 display, `--text`) and under it `glowLine(glow)` in `--screen-meta` (400 22/28 ui, `--text-2`), sizes times `canvas.width / 1920`, centred, 10 units from the circle.
- [ ] The Cathedral (`is_memorial`): a 1px `--line` circle of the same radius, no fill, no halo, no glow line, no percentage; its name in `--screen-name` with colour `--text-2`. A glow value sent for it is not drawn.
- [ ] Reduced motion: glow brightness changes stay as they are (`DESIGN.md` 5.6 keeps them).
- [ ] The page takes `sites` from `./sites.fixture`. If `packages/shared/sites.json` exists on `main` when this task starts, import that through `@lampa/shared` and leave the fixture to the tests; say which one in the report.
- [ ] Mounting: if `apps/web/src/App.tsx` on `main` has a router with a `/screen` route, give `ScreenPage` to that route and report the file as touched outside the lane. If it has no router, add one line to `App.tsx`: `if (location.pathname === "/screen") return <ScreenPage />;` above the existing return (Cristea's decision, hour 0). Ionut's route replaces it later.
- [ ] Commit: `feat(screen) added the Living Map v1 with glow on canvas`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/canvas.ts apps/web/src/screen/ScreenPage.module.css | wc -l`. Paste the summary line.
- Done when: the build and the tests pass and the grep count is 0. This session then opens `http://localhost:5173/screen` with `npm run dev`, clicks the start button and confirms five circles and five names with no overlap and no console error.

### B1-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch, `npm ci && npm run typecheck && npm run build && npm test` green on it.
- [ ] Each branch was pushed and its PR opened as soon as its own verify passed, in this order: `cristea/b1-foundation`, `cristea/b1-session`, `cristea/b1-screen`. Each PR lists what was verified and what is waiting for a phone or for Fabi's socket.
- [ ] After `cristea/b1-session` is merged and deployed: `curl -s -X POST https://lampa-api-b45i.onrender.com/session/anon` prints a token, and `curl -s https://lampa-api-b45i.onrender.com/health` prints `{"ok":true}`.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: the tokens file and the import line; `Icon`, `Button`, `Notice`, `Ring`, `RoundControl` from `apps/web/src/components` with the states that shipped; `GlowMessage` and `Site`; `POST /session/anon`; `requireVisitor` then `visitorLimiter` and the `req.visitor` shape; `getToken` and `authFetch`; the root `.env` with `SESSION_SECRET` that local API runs need; `npm test` in both apps; the Auth0 domain and audience; the `/screen` socket join.
- [ ] Cristea's check on the laptop with HDMI. Do not mark it done: `https://lampa-timisoara.vercel.app/screen` shows the start button; after the click, five sites with names, none overlapping, readable from across the room.
- [ ] Cristea's check on the iPhone. Do not mark it done: the deployed page loads the two fonts (the wordmark is a serif) and the background is `--bg`.
- [ ] Cristea's check with Fabi, once `/live` is on `main`. Do not mark it done: a `wake` from a phone, or `simulate-crowd`, brightens that site on the deployed `/screen` within 5 seconds, and its line changes from "Asleep, 0%". Pulling the network for 5 s shows "Reconnecting to the city…", and it clears on reconnect.
- [ ] Checkpoint 1 line 5 is run by the team on Ionut's screens. If text fails in daylight, the fix is a larger size or `--text` instead of `--text-2`, never a second theme (`DESIGN.md` section 2).
- Done when: every box is ticked or listed as Cristea's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the live socket check until Fabi's `/live` lands; the site ids and `GlowMessage` until Fabi agrees them; the Auth0 env vars until Cristea gives the domain and client id.
- **Not finished at hour 10:** each ID, what is left, and its place in the cut order (passkey, then the component states beyond the smallest version, then `/screen` site labels).
- **Phone checks for Cristea:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 1

- `apps/web` loads `tokens.css` (identical to `design/css/tokens.css`) and the two fonts, and exports Icon, Button, Notice, Ring and RoundControl in at least the smallest version of `DESIGN.md` section 9 item 1.
- The Auth0 tenant has the API, the two permissions, the two roles, the SPA application and the email code sign-in, and its JWKS answers 200.
- `POST /session/anon` on the deployed API answers a 24 h token; `requireVisitor` accepts it and an Auth0 token, and rejects expired and tampered ones; the limits answer 429 with `Retry-After`.
- The deployed `/screen` shows the five sites projected from lat and lng with no two closer than 2.4R, and a `glow` message changes a site's brightness and its line.
- `npm test` is green and holds the token tests, the projection and spacing tests, the glow tests, the component tests and the session helper tests.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `cristea/GLOSSARY.md` matches the state of the branch.

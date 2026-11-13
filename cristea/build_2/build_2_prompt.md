# Prompt: Cristea's Build 2, Colours and Talk (Identity, infra, Living Map, LAMPA)

**Status: implemented at hour 18 (2026-11-13). Report in `build_2_report.md`; open checks under Blocked in the glossary.**

You are implementing Cristea's part of Build 2 (hours 12 to 18) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *the two stations the demo is built around.*

Checkpoint this block must pass (Checkpoint 2, the lines this lane affects):

*1. A colour caught on a phone appears as a pane on `/screen` within one second.*

*2. The crowd simulator fills a window to 48, it completes, and a new one starts.*

*3. Live Talk answers on a phone and at least one client tool fires.*

*4. With the ElevenLabs key removed, Talk falls back to tap-to-ask without a reload.*

## 0. Ground rules

- **Cristea takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Cristea, with your recommendation. Nothing uses the recommendation until Cristea answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask. The differences Cristea already decided are in `cristea/GLOSSARY.md`, Changes, hour 12.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 18.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Cristea: carrying on, cutting (plan section 7) or moving it is their decision. Cristea's cut order for this block (hour 12): the QR code first, then the window-complete flare (the window just empties), then the pane ring, then the map lines. `GET /agent/session`, windows with panes, the ticker and the colours counter are never cut.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Cristea, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Cristea's approval. Approved: `qrcode` 1.5.4 and `@types/qrcode` 1.5.6 (B2-2.d, hour 12; the plan names `qrcode`). No ElevenLabs SDK in `apps/api`: the signed URL is one `fetch`.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `ELEVENLABS_API_KEY` never appears in a response, a log line or a test fixture.
- `main` deploys by itself. Work on branches: `cristea/b2-screen` (the seam commit, B2-3 and B2-2), `cristea/b2-agent` (B2-1). One small PR per branch. Open it only after the verify commands pass, and as soon as they pass, without waiting for the end of the block. Cristea merges with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. No test and no verify command in this prompt calls `api.elevenlabs.io`.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. It gets no window, no pane, no ticker line and no agent session in this block.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. `design/css/` stays untouched.
- Write in `cristea/` only. Other members' folders are read-only.
- **Keep `cristea/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Cristea a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- In Git Bash, prefix CLI calls that carry a leading-slash argument with `MSYS_NO_PATHCONV=1` (glossary, Changes, S-1.c.1).

## 1. Current state (checked at hour 12, 2026-11-13 17:56 +0200)

- Build 1 is closed for this lane: every B1 ID is under Done, nothing was cut. `main` is at `7f8c736` (Fabi's docs commit of 18:08: `fabi/GLOSSARY.md`, `fabi/setup/setup_prompt.md` and one line of plan section 9 about migration 002; no code). No open PRs; the last merged is #14.
- Still open from Build 1, under Blocked in the glossary: the live socket check with Fabi, the 2.95 spacing re-check when `sites.json` lands, and the names read from across the room. Fabi accepted `GlowMessage`, `Site` and the five site ids as they are on `main` (`fabi/GLOSSARY.md`, Decisions, hour 3).
- Web: `https://lampa-timisoara.vercel.app/screen` → 200. API: `https://lampa-api-b45i.onrender.com/health` → 200 `{"ok":true}`.
- `/screen` v1 is on `main` in `apps/web/src/screen/`: `projection.ts` (`project`, `spread`, `labelSides`, `layout`, `MIN_SPACING` 2.95, `MAP_WIDTH` 1380), `glow.ts`, `useGlowSocket.ts` (one socket, `/live`, `room: "screen"`), `canvas.ts` (`startCanvas(canvas, sites, glowRef)`, plain `--lamp` disks, drawing scale `canvas.width / 1380`), `ScreenPage.tsx` (start screen, map, panel with the wordmark and the reconnect line), `sites.fixture.ts`.
- API on `main`: `apps/api/src/app.ts` (`createApp()`), `apps/api/src/auth/session.ts` (`requireVisitor`, `visitorLimiter`, `sessionRouter`, `makeRequireVisitor`), eleven tests in `session.test.ts` that start the app on port 0 and call it with `fetch`.
- Contract: `EventKind`, `SocketMessage` (holds the names `pane` and `window_complete`), `GlowMessage`, `Site`, `EventIn`, `EventBatch`, `EventsAccepted`. No payload for `pane` or `window_complete`, nothing for the agent session, no colour names, no map lines: B2-0 adds them.
- Ionut's lane has on `main`: `apps/web/src/phone/RoseWindow.tsx` (SVG, the 6.6 geometry), `DemoBadge`, `isDemo(search)` in `apps/web/src/sensors/demo.ts`, `api()` in `apps/web/src/api/client.ts` going through `authFetch`.
- Needs from others, none landed: Fabi's `/live` socket, `POST /panes`, `simulate-crowd` and `packages/shared/sites.json`; Patrick's signed-URL call, prompt renderer and site content. Fabi's Setup is written and not implemented: `fabi/GLOSSARY.md` has no Done line and no Hand-off, and no `fabi/` branch is on the remote. Patrick has no `GLOSSARY.md` and no branch. This block codes against the schemas of B2-0.
- Fabi's Setup will add `packages/shared/sites.json`, `packages/shared/src/sites.ts` (`export const sites: Site[]`) and the line `export * from "./sites.js";` in `packages/shared/src/index.ts`, the file the seam also edits. Fabi's schema fits the seam: `windows.id` and `panes.id` are uuids, `panes` holds `slot` and `hex` with `UNIQUE (window_id, slot)`, and a window with `site_id` NULL is the Gallery window.
- ElevenLabs docs, read at hour 12: `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=<id>` answers 200 `{"signed_url": string}`. The page shows no auth header; the concept's sketch sends `xi-api-key`. Overrides and dynamic variables are passed by the browser at `startSession`, and an override whose field is not enabled in the agent's Security tab throws. The docs do not say what a missing dynamic variable does in a live session.
- Design reference: `design/css/livingmap.css` (`__credit`, `__stat`, `__stat-label`, `__number`, `__number--lamps`, `__lit`, `__qr`), `design/css/components.css` blocks 6.17 (`.qr`, `.qr--screen`) and 6.18 (`.ticker`). Tokens `--river`, `--lamp-white`, `--surface-2`, `--line-strong`, `--text-3` and the six `--screen-*` fonts are in `apps/web/src/styles/tokens.css`.
- Scripts: root `typecheck`, `build`, `test`; `apps/web` and `apps/api` each have `test` (`vitest run --passWithNoTests`). `packages/shared` has no test script, so tests for shared code live in `apps/web`.
- `.env.example` lists `ELEVENLABS_API_KEY` and has no agent id name: B2-0 adds `ELEVENLABS_AGENT_ID`. The local root `.env` holds neither.
- The concept PDF is on this machine. Section 11.1, sketch 1, is the source of the `GET /agent/session` shape.
- Devices for Cristea's checks: an iPhone and a laptop with HDMI. No Android phone.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 2, Cristea's rows and Checkpoint 2 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Cristea's table and "Needs from others" | All |
| `cristea/GLOSSARY.md` | Whole file | All |
| `DESIGN.md` | Section 9, item 6 | B2-2, B2-3 |
| `DESIGN.md` | Sections 2.3, 2.4, 3.3, 4.3, 5.5, 5.6, 6.6, 6.17, 6.18, 6.21, 7.13 | B2-0, B2-2, B2-3 |
| `design/css/livingmap.css` | Whole file | B2-2, B2-3 |
| `design/css/components.css` | Blocks 6.17 and 6.18 | B2-2.d |
| `packages/shared/src/contract.ts`, `colours.ts`, `mapLines.ts`, `index.ts` | Whole file | B2-0, B2-1, B2-2, B2-3 |
| `apps/web/src/screen/` | Every file | B2-2, B2-3 |
| `apps/web/src/phone/RoseWindow.tsx`, `apps/web/src/phone/DemoBadge.tsx`, `apps/web/src/sensors/demo.ts` | Whole file | B2-2 |
| `apps/web/src/components/index.ts` | Whole file | B2-2.d |
| `apps/api/src/app.ts`, `apps/api/src/auth/session.ts`, `apps/api/src/auth/session.test.ts` | Whole file | B2-1 |
| `.env.example` | Whole file | B2-0, B2-1 |
| `IMPLEMENTATION_PLAN.md` | Section 7 (cut order, the memorial site), section 9 (the ElevenLabs, credits and Render rows) | B2-1, B2-2 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| `GET /agent/session`: signed URL, per-site overrides, dynamic variables, rate limit. The API key never reaches the browser | 1.5 | B2-1.a, B2-1.b |
| `/screen` v2: each site draws its window with 48 slots, panes appear on the socket message, ticker, counters | 3.5 | B2-2.a, B2-2.b, B2-2.c, B2-2.d |
| Map lines: trace the Bega and the Cetate ring from OpenStreetMap as about five polylines in `packages/shared`, draw them once to the static layer, add the OSM credit | 0.75 | B2-3.a, B2-3.b |
| `DESIGN.md` section 9 item 6: Living Map windows and map lines: RoseWindow on canvas, pane flash, Ticker, counters, QRBlock, OpenStreetMap polylines and credit. Smallest version: 7.13 map layer, credit, side panel and windows; refit the projection to the sites plus the polylines; skip ripples | in the 3.5 and the 0.75 | B2-2.a, B2-2.c, B2-2.d, B2-3.a, B2-3.b |
| Added by Cristea's decision, hour 12 (not a plan row): `/screen?demo=1` feeds fake panes through the same code path | in the 3.5 | B2-2.b |
| Checkpoint 2, line 1: a colour caught on a phone appears as a pane on `/screen` within one second | | B2-2.b, B2-2.c, B2-last |
| Checkpoint 2, line 2: the crowd simulator fills a window to 48, it completes, and a new one starts | | B2-2.a, B2-2.c, B2-last |
| Checkpoint 2, line 3: live Talk answers on a phone and at least one client tool fires | | B2-1.a, B2-last |
| Checkpoint 2, line 4: with the ElevenLabs key removed, Talk falls back to tap-to-ask without a reload | | B2-1.a, B2-last |

Section 8 holds no test of Cristea's that falls in this block. The tests below are the ones this prompt adds.

Total: 5.75 h of tasks in a 6 h block.

Order: B2-0 first (this session). Then `cristea-api` does B2-1 on `cristea/b2-agent` while `cristea-canvas` works on `cristea/b2-screen`, in this order: B2-3.a.1, B2-3.b.1, B2-2.a.1, B2-2.b.1, B2-2.c.1, B2-2.d.1. The map lines come first because they refit the projection that the windows are placed with. Inside each branch the agent tasks run one after another.

The seam. This session writes it in B2-0 and commits it as the first commit of `cristea/b2-screen` (Cristea's decision, hour 12). `cristea/b2-agent` branches from that commit.

Appended to `packages/shared/src/contract.ts` (owner of the file: the team; proposed to Fabi and Patrick by Cristea):

```ts
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PaneMessage = z.object({
  siteId: z.string(),
  windowId: z.string(),
  slot: z.number().int().min(0).max(47),
  hex: Hex,
});
export type PaneMessage = z.infer<typeof PaneMessage>;

export const WindowCompleteMessage = z.object({ siteId: z.string(), windowId: z.string() });
export type WindowCompleteMessage = z.infer<typeof WindowCompleteMessage>;

// GET /screen/state, public, fetched by /screen on every socket connect
export const ScreenState = z.object({
  windows: z.array(
    z.object({ siteId: z.string(), windowId: z.string(), panes: z.array(Hex.nullable()).length(48) }),
  ),
  coloursToday: z.number().int().min(0),
});
export type ScreenState = z.infer<typeof ScreenState>;

export const AgentLang = z.enum(["ro", "en", "hu", "de", "sr"]);
export type AgentLang = z.infer<typeof AgentLang>;

// GET /agent/session?site=<id>&lang=<AgentLang>
export const AgentSession = z.object({
  signedUrl: z.string().min(1),
  overrides: z
    .object({
      agent: z.object({
        prompt: z.object({ prompt: z.string() }),
        firstMessage: z.string(),
        language: AgentLang,
      }),
      tts: z.object({ voiceId: z.string() }),
    })
    .optional(),
  dynamicVariables: z.object({
    visitor_name: z.string(),
    local_time: z.string(),
    site_glow: z.number(),
    colours_today: z.number(),
    lamps_lit_today: z.number(),
    sites_visited: z.string(),
    returning_visitor: z.enum(["yes", "no"]),
  }),
});
export type AgentSession = z.infer<typeof AgentSession>;
```

New file `packages/shared/src/colours.ts` (`DESIGN.md` 2.4; used by `/screen` and by Ionut's lens):

```ts
export type ColourName = { en: string; ro: string };

export const COLOUR_NAMES: ColourName[] = [
  { en: "Red", ro: "Roșu" },
  { en: "Orange", ro: "Portocaliu" },
  { en: "Yellow", ro: "Galben" },
  { en: "Yellow-green", ro: "Verde-gălbui" },
  { en: "Green", ro: "Verde" },
  { en: "Mint", ro: "Verde-mentă" },
  { en: "Turquoise", ro: "Turcoaz" },
  { en: "Sky blue", ro: "Albastru deschis" },
  { en: "Blue", ro: "Albastru" },
  { en: "Violet", ro: "Violet" },
  { en: "Magenta", ro: "Magenta" },
  { en: "Pink", ro: "Roz" },
];
export const NIGHT_GLASS: ColourName = { en: "Night glass", ro: "Sticlă de noapte" };

/** Bin 0 to 11 for a hue in degrees (red at 0). */
export const hueBin = (hue: number): number => Math.floor(((((hue % 360) + 360) % 360) + 15) % 360 / 30);

/** HSL hue in degrees of "#rrggbb", or null for a grey (no hue). */
export function hexHue(hex: string): number | null {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function colourName(hex: string): ColourName {
  const hue = hexHue(hex);
  return hue === null ? NIGHT_GLASS : COLOUR_NAMES[hueBin(hue)];
}
```

New file `packages/shared/src/mapLines.ts`, written in B2-0 with an empty list and filled by B2-3.a.1:

```ts
export type MapLine = { id: "bega" | "ring"; kind: "river" | "ring"; points: [lat: number, lng: number][] };
export const MAP_LINES: MapLine[] = [];
```

`packages/shared/src/index.ts` gains `export * from "./colours.js";` and `export * from "./mapLines.js";`.

The API seam, written by `cristea-api` in `apps/api/src/agent/session.ts`. Patrick supplies `getPersona`, Fabi supplies `getSiteStats`, each by passing it in `apps/api/src/app.ts`:

```ts
export type Persona = { prompt: string; firstMessage: string; voiceId: string };
export type SiteStats = { glow: number; coloursToday: number; lampsToday: number };
export type AgentDeps = {
  getPersona?: (siteId: string, lang: AgentLang) => Promise<Persona | null>;
  getSiteStats?: (siteId: string) => Promise<SiteStats>;
  fetch?: typeof fetch; // the ElevenLabs call; tests pass a fake
};
export function createAgentRouter(deps?: AgentDeps): Router; // GET /agent/session
```

### 3.1 Subagents

Cristea asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Cristea, re-runs the checks, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `cristea-api` | Express routes, token checks, rate limiting and their tests in `apps/api` | opus | reused from Build 1, documents and rules updated |
| `cristea-canvas` | The `/screen` Living Map in `apps/web/src/screen`: projection, state, socket client, Canvas 2D, side panel; the map lines in `packages/shared` | opus | reused from Build 1, documents and rules updated |

`cristea-ui` and `cristea-infra` stay in `.claude/agents/` and have no task in this block.

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B2-1.a.1 | `cristea-api` | `GET /agent/session` route | `apps/api/src/agent/session.ts`, `apps/api/src/app.ts` | parallel with the screen branch |
| B2-1.b.1 | `cristea-api` | Rate limit and the route tests | `apps/api/src/agent/session.ts`, `apps/api/src/agent/session.test.ts` | after B2-1.a.1 |
| B2-3.a.1 | `cristea-canvas` | Trace the Bega and the ring | `packages/shared/src/mapLines.ts` | parallel with B2-1 |
| B2-3.b.1 | `cristea-canvas` | Refit the projection, draw the lines, add the credit | `apps/web/src/screen/projection.ts`, `projection.test.ts`, `canvas.ts`, `ScreenPage.tsx`, `ScreenPage.module.css` | after B2-3.a.1 |
| B2-2.a.1 | `cristea-canvas` | Window state and rose geometry, with tests | `apps/web/src/screen/windows.ts`, `windows.test.ts`, `rose.ts`, `rose.test.ts`, `colours.test.ts` | after B2-3.b.1 |
| B2-2.b.1 | `cristea-canvas` | Screen socket hook and the demo feed | `apps/web/src/screen/useScreenSocket.ts`, `demoFeed.ts`, `demoFeed.test.ts`, `useGlowSocket.ts` (deleted), `ScreenPage.tsx` | after B2-2.a.1 |
| B2-2.c.1 | `cristea-canvas` | Windows, pane flash and flare on canvas | `apps/web/src/screen/canvas.ts`, `ScreenPage.tsx` | after B2-2.b.1 |
| B2-2.d.1 | `cristea-canvas` | Side panel: counters, Ticker, QRBlock | `apps/web/src/screen/ticker.ts`, `ticker.test.ts`, `Ticker.tsx`, `Ticker.module.css`, `QRBlock.tsx`, `QRBlock.module.css`, `ScreenPage.tsx`, `ScreenPage.module.css` | after B2-2.c.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- The two branches run at the same time, so start each of the two agents with `isolation: "worktree"`. Each agent's first step is in its task: check out its branch and run `npm ci`.
- No agent edits `package.json` dependencies or `package-lock.json`. B2-0 installs every approved library. If a task turns out to need another one, the agent stops and reports.
- If the Agent tool does not list one of these subagents, stop and ask Cristea to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Cristea. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Cristea, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on. One is expected: the street list of the Cetate ring in B2-3.a.1.

### B2-0 Preflight and seam (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`, `gh pr list`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm ci && npm run typecheck && npm run build && npm test`.
- [ ] Re-check each "Needs from others" item of section 1: `git fetch`, `git ls-remote --heads origin`, `ls */GLOSSARY.md`, `ls packages/shared/sites.json`, and whether `apps/api/src` holds a `/live` namespace, `POST /panes` or a persona renderer on `main`. If Fabi's pane payload or Patrick's session shape is on `main` and differs from the seam, stop and ask Cristea before the seam commit.
- [ ] If `sites` is exported from `@lampa/shared` on `main`, tell Cristea: the swap of the fixture import in `ScreenPage.tsx` and the 2.95 spacing re-check are then part of B2-2.b.1 and B2-3.b.1, as the Build 1 decision of hour 0 says. If it is not, the fixture stays.
- [ ] Create `cristea/b2-screen` from `main`. If `packages/shared/src/index.ts` has gained Fabi's `sites.js` line, keep it and add the two seam lines under it.
- [ ] Append `PaneMessage`, `WindowCompleteMessage`, `ScreenState`, `AgentLang` and `AgentSession` to `packages/shared/src/contract.ts`, create `colours.ts` and `mapLines.ts`, and add the two export lines to `index.ts`, exactly as in the seam above.
- [ ] Install, with exact versions: in `@lampa/web` dependencies `qrcode@1.5.4`; in `@lampa/web` devDependencies `@types/qrcode@1.5.6`.
- [ ] Add the line `ELEVENLABS_AGENT_ID=` to `.env.example`, under `ELEVENLABS_API_KEY=`.
- [ ] Commit as `feat(shared) added the pane, screen state and agent session schemas, the colour names and the QR library`, push the branch, then create `cristea/b2-agent` from that commit and push it.
- [ ] Tell Cristea to take to the team: `PaneMessage`, `WindowCompleteMessage` and `GET /screen/state` with `ScreenState` (Fabi emits and serves them); `AgentSession` and `AgentLang` (Patrick's Talk reads them); `colourName` and `hueBin` in `@lampa/shared` (Ionut's lens and his colour names row); `ELEVENLABS_AGENT_ID`.
- [ ] Ask Cristea to paste `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` into the Render dashboard for `lampa-api`, and to confirm with Patrick that the agent's Security tab has overrides enabled for the system prompt, the first message, the language and the voice. Cristea's task. Do not mark it done. The values do not pass through the chat or a file in git.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently; both branches are on the remote with the seam commit.

### B2-1 `GET /agent/session` (1.5 h)

Branch `cristea/b2-agent`. All values below are Cristea's decisions (hour 12).

#### B2-1.a The API answers a signed URL with the session data, and the key stays on the server

**B2-1.a.1** `GET /agent/session` route. Subagent: `cristea-api`. Files: `apps/api/src/agent/session.ts`, `apps/api/src/app.ts`.

- [ ] First: `git checkout cristea/b2-agent && npm ci`.
- [ ] `apps/api/src/agent/session.ts` exports `Persona`, `SiteStats`, `AgentDeps` and `createAgentRouter` with the signatures of the seam in section 3, word for word. `apps/api/src/app.ts` mounts `createAgentRouter()` after `express.json()`. `createApp` does not throw when `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` is unset.
- [ ] Named constants in the file: `PERSONA_SITE_IDS = ["mx", "unirii", "victoriei", "bastion"]`, `MEMORIAL_SITE_IDS = ["cathedral"]`, `ELEVENLABS_TIMEOUT_MS = 5000`, `SIGNED_URL_ENDPOINT = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url"`. The two id lists carry the comment `// shortcut: site ids are fixed here until packages/shared/sites.json lands; read them from it then`.
- [ ] `GET /agent/session` runs `requireVisitor` first. Query `site`: a missing value or an id in neither list answers 404 `{"error":"unknown_site"}`; an id in `MEMORIAL_SITE_IDS` answers 404 `{"error":"no_persona"}`. Neither case calls ElevenLabs. Query `lang`: parsed with `AgentLang`; a missing or unknown value becomes `en`.
- [ ] The signed URL: `GET ${SIGNED_URL_ENDPOINT}?agent_id=${ELEVENLABS_AGENT_ID}` with the header `xi-api-key: ${ELEVENLABS_API_KEY}` and `signal: AbortSignal.timeout(ELEVENLABS_TIMEOUT_MS)`, through `deps.fetch` when given and the global `fetch` otherwise. Both env values are read per request. The answer's `signed_url` becomes `signedUrl`.
- [ ] A missing `ELEVENLABS_API_KEY`, a missing `ELEVENLABS_AGENT_ID`, a timeout, a network error, a status that is not 200 or a body without a string `signed_url` each answer 503 `{"error":"agent_unavailable"}` and nothing else in the body. The upstream body and the key are never logged or returned.
- [ ] `overrides`: when `deps.getPersona` is given and resolves to a persona, `{ agent: { prompt: { prompt }, firstMessage, language: lang }, tts: { voiceId } }`. When `getPersona` is absent or resolves to `null`, the answer has no `overrides` key.
- [ ] `dynamicVariables`, all seven in every answer: `visitor_name` `"traveller"`; `local_time` the current time in `Europe/Bucharest` as `HH:mm` (24 h, from `Intl.DateTimeFormat`); `site_glow` `Math.round(stats.glow * 100)`, `colours_today` `stats.coloursToday`, `lamps_lit_today` `stats.lampsToday` from `deps.getSiteStats(site)`, and `0`, `0`, `0` when `getSiteStats` is absent or rejects; `sites_visited` `"none yet"`; `returning_visitor` `"no"`.
- [ ] The answer is 200, passed through `AgentSession.parse` before it is sent, with the header `Cache-Control: no-store`.
- [ ] Commit: `feat(api) added GET /agent/session with the signed URL and the session variables`.
- Verify: `npm run typecheck -w @lampa/api && SESSION_SECRET=x PORT=3998 npx tsx apps/api/src/index.ts & sleep 3; T=$(curl -s -X POST localhost:3998/session/anon | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))"); curl -s -w " %{http_code}\n" -H "Authorization: Bearer $T" "localhost:3998/agent/session?site=mx"; curl -s -w " %{http_code}\n" -H "Authorization: Bearer $T" "localhost:3998/agent/session?site=cathedral"; curl -s -o /dev/null -w "%{http_code}\n" "localhost:3998/agent/session?site=mx"; kill %1`. Paste the summary line.
- Done when: with no ElevenLabs env set the three calls print `{"error":"agent_unavailable"} 503`, `{"error":"no_persona"} 404` and `401`, and the API started without the key.

#### B2-1.b The limit holds and every answer is tested

**B2-1.b.1** Rate limit and the route tests. Subagent: `cristea-api`. Files: `apps/api/src/agent/session.ts`, `apps/api/src/agent/session.test.ts`.

- [ ] `GET /agent/session` is limited to 6 per 10 minutes per `req.visitor.sub` with `express-rate-limit` (`windowMs` 600000, `limit` 6, `keyGenerator` returns `req.visitor.sub`), mounted after `requireVisitor` and before the query checks. Over the limit: 429 with a `Retry-After` header. Memory store, with the same `// shortcut:` comment as the limiters in `apps/api/src/auth/session.ts`.
- [ ] `session.test.ts` builds an Express app with `createAgentRouter(deps)` on port 0 and calls it with `fetch`, the way `apps/api/src/auth/session.test.ts` does. The ElevenLabs call is always the fake `deps.fetch`; no test reaches the network. Cases by name: "no token is rejected with 401"; "a missing site answers 404 unknown_site"; "an unknown site answers 404 unknown_site"; "the cathedral answers 404 no_persona and makes no upstream call"; "a persona site answers signedUrl and the seven dynamic variables"; "the upstream call carries the agent id and the xi-api-key header"; "the answer and its headers never contain the API key"; "without getPersona the answer has no overrides"; "with getPersona the overrides carry the prompt, first message, language and voice"; "an unknown lang becomes en"; "stats from getSiteStats fill site_glow, colours_today and lamps_lit_today"; "a rejecting getSiteStats still answers 200 with zeros"; "local_time is HH:mm"; "a missing API key answers 503 agent_unavailable"; "a missing agent id answers 503 agent_unavailable"; "an upstream 401 answers 503 agent_unavailable"; "an upstream timeout answers 503 agent_unavailable"; "the 7th request in ten minutes gets 429 with Retry-After".
- [ ] Check that the rule bites: return the upstream body on a failed call, see "the answer and its headers never contain the API key" or the 503 cases fail, and restore it. Say so in the report.
- [ ] Report for the Hand-offs: Patrick passes `getPersona` and Fabi passes `getSiteStats` to `createAgentRouter` in `apps/api/src/app.ts`; the browser calls `api("/agent/session?site=<id>&lang=<code>", { schema: AgentSession })` and gives `signedUrl`, `overrides` and `dynamicVariables` to `startSession`; a 503 or a 404 is the signal for the tap-to-ask fallback.
- [ ] Commit: `test(api) added the agent session rate limit and tests`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the eighteen cases pass next to the eleven from Build 1.

### B2-3 Map lines from OpenStreetMap (0.75 h)

Branch `cristea/b2-screen`. Cristea's decisions (hour 12): two lines, the Bega and the Cetate ring, not about five; no other street and no district name in this block.

#### B2-3.a The two lines exist as lat/lng points in `packages/shared`

**B2-3.a.1** Trace the Bega and the ring. Subagent: `cristea-canvas`. Files: `packages/shared/src/mapLines.ts`.

- [ ] First: `git checkout cristea/b2-screen && npm ci`.
- [ ] The clip box: the bounding box of the five sites in `apps/web/src/screen/sites.fixture.ts`, grown by 30% of its width on the west and east and 30% of its height on the north and south.
- [ ] The Bega: fetch from the Overpass API (`https://overpass-api.de/api/interpreter`) the ways with `waterway` equal to `river` or `canal` and a `name` containing `Bega` inside the clip box. Join them into one line ordered west to east, clip it to the box, and if the clip leaves several pieces keep the longest. Simplify with Douglas-Peucker until it holds at most 60 points.
- [ ] The Cetate ring: `DESIGN.md` 7.13 calls it "the line of the old fortress boulevards" and names no street. Query the named `highway` ways of class `primary`, `secondary` and `tertiary` inside the clip box, and report under Blocked the ordered list of street names you propose as the closed ring, with the reason for each. Stop this item there. Cristea approves the list (Cristea's decision, hour 12), and this session sends it back. Then trace those ways as one closed line, simplified to at most 60 points.
- [ ] Carry on with the Bega while the ring waits. If the Bega is committed first, the ring gets its own commit.
- [ ] `MAP_LINES` holds `{ id: "bega", kind: "river", points }` and `{ id: "ring", kind: "ring", points }`, each point `[lat, lng]` rounded to 5 decimals. The file starts with a comment that gives the date, the two Overpass queries and the line `Map data © OpenStreetMap contributors (ODbL)`.
- [ ] The fetch script stays out of the repo: write it in your scratch directory and do not commit it. The requests carry no name, email or project detail.
- [ ] If Overpass does not answer after three tries one minute apart, stop and report. Do not draw points by hand.
- [ ] Commit: `feat(shared) added the Bega and the Cetate ring as OpenStreetMap polylines`.
- Verify: `npm run typecheck && npx tsx -e "import('@lampa/shared').then(m=>console.log(m.MAP_LINES.map(l=>l.id+':'+l.points.length).join(' ')))"`. Paste the summary line.
- Done when: the command prints `bega:<n> ring:<m>` with both counts from 2 to 60, or the ring is listed as Blocked with its proposed street list.

#### B2-3.b The lines are drawn once under the sites, and the credit shows

**B2-3.b.1** Refit the projection, draw the lines, add the credit. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/projection.ts`, `projection.test.ts`, `canvas.ts`, `ScreenPage.tsx`, `ScreenPage.module.css`.

- [ ] `projection.ts`: `project(sites, lines = [])` fits the bounding box of the sites plus every point of `lines` into the padded map area, with the same equirectangular maths and the same uniform scale as now. New export `projectLines(sites, lines): { id, kind, points: { x, y }[] }[]`, which uses that same fit. `layout(sites, lines = [])` passes `lines` to `project`. `spread` and `labelSides` stay as they are; `MIN_SPACING` stays 2.95.
- [ ] `projection.test.ts` keeps its nine cases and adds, by name: "with the map lines the five sites still land inside the padded map area"; "with the map lines no two sites are closer than 2.4R after spread"; "every projected line point lands inside the padded map area"; "a line point at a site's lat and lng projects to that site's unspread position"; "without lines the layout is unchanged".
- [ ] `canvas.ts`: `startCanvas(canvas, sites, lines, glowRef)`. A static layer on an offscreen canvas, redrawn only in `fit()`, copied each frame before the sites (`DESIGN.md` 5.5). With `u = canvas.width / MAP_WIDTH`: the `river` line is a 14 × u stroke of `--river` at alpha 0.35 with round joins and round caps; the `ring` line is a 2 × u stroke of `--line-strong` at alpha 0.5 with dash 10 × u on, 8 × u off. Colours come from the custom properties, as the file already does.
- [ ] `ScreenPage.tsx` passes `MAP_LINES` from `@lampa/shared` to `startCanvas`, and renders `<p>© OpenStreetMap contributors</p>` inside the map area with the class ported from `.living-map__credit` in `design/css/livingmap.css` (same values, class name `credit`). It is DOM text, always visible after the start click.
- [ ] Commit: `feat(screen) drew the Bega and the Cetate ring under the sites with the OpenStreetMap credit`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/canvas.ts apps/web/src/screen/ScreenPage.module.css | wc -l`. Paste the summary line.
- Done when: the fourteen projection cases pass and the grep count is 0. This session then opens `http://localhost:5173/screen` at 1920 × 1080 and 1280 × 720 and confirms by screenshot: the river and the ring are visible, the five circles and labels do not overlap each other or the credit, and nothing is clipped. If a label overlaps, stop and ask Cristea about `MIN_SPACING`.

### B2-2 `/screen` v2: windows, panes, ticker, counters (3.5 h)

Branch `cristea/b2-screen`, after B2-3. Scope (Cristea's decisions, hour 12): a rose window with 48 slots at each of the four colour sites, panes from the socket and from `GET /screen/state`, the pane flash with its one ring, the window-complete flare, the Ticker with two line kinds, the two counters, the QRBlock, and `/screen?demo=1`. Out of this block: the Gallery window, echo ripples and subtitles, the lamp, echo, place and candle ticker lines, the candle field, the room sound, the finale.

#### B2-2.a Window state and rose geometry are pure functions with tests

**B2-2.a.1** Window state and rose geometry. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/windows.ts`, `windows.test.ts`, `rose.ts`, `rose.test.ts`, `colours.test.ts`.

- [ ] `rose.ts`, the geometry of `DESIGN.md` 6.6, the same as `apps/web/src/phone/RoseWindow.tsx`: `SLOTS = 48`; `slotShape(slot): { r0, r1, a0, a1 }` with radii as fractions of R and angles in radians, 0 at 12 o'clock, clockwise. Slots 0 to 7: 8 sectors, 0 to 0.30. Slots 8 to 23: 16 segments, 0.34 to 0.62. Slots 24 to 47: 24 segments, 0.66 to 1.00. `paneShare(glow) = 0.45 + 0.55 × glow`. `mixHex(pane, bg, share)`: per channel `bg + (pane − bg) × share`, rounded, returned as `#rrggbb`.
- [ ] `windows.ts`: `type WindowState = { windowId: string | null; panes: (string | null)[] }`, `type WindowsState = { windows: Record<string, WindowState>; coloursToday: number | null }`. `emptyWindows(siteIds)`: one empty 48-slot window per id, `coloursToday` `null`.
- [ ] `applyState(state, message: unknown)`: parses with `ScreenState.safeParse`; invalid returns the same object; valid replaces each listed window whose `siteId` is in the state and sets `coloursToday`. Windows it does not list keep their value.
- [ ] `applyPane(state, message: unknown)`: parses with `PaneMessage.safeParse`; invalid, or a `siteId` that is not in the state, returns the same object. When the message's `windowId` differs from the window's, the window first becomes empty with the new id. Then the slot takes the hex, and `coloursToday` grows by one (`null` becomes 1).
- [ ] `applyWindowComplete(state, message: unknown)`: parses with `WindowCompleteMessage.safeParse`; invalid, an unknown site, or a `windowId` that is not the window's current one returns the same object; otherwise the window becomes empty with `windowId` `null`.
- [ ] `rose.test.ts`, cases by name: "slot 0 starts at 12 o'clock and spans one eighth"; "slots 8 to 23 sit between 0.34R and 0.62R"; "slot 47 ends where slot 24 starts"; "every slot from 0 to 47 has r0 under r1 and a0 under a1"; "paneShare is 0.45 at glow 0 and 1 at glow 1"; "mixHex at share 1 is the pane colour and at share 0 is the background".
- [ ] `windows.test.ts`, cases by name: "a valid state fills the listed windows and sets coloursToday"; "an invalid state returns the same object"; "a state with 47 panes in a window is invalid"; "a pane sets its slot and adds one to coloursToday"; "the first pane with coloursToday null makes it 1"; "a pane for an unknown site returns the same object"; "a pane with slot 48 returns the same object"; "a pane with a new windowId empties the window first"; "window complete empties the matching window"; "window complete for another windowId returns the same object"; "the cathedral never gets a window" (`emptyWindows` is given the four colour ids and a pane for `cathedral` returns the same object).
- [ ] `colours.test.ts` covers the seam's `packages/shared/src/colours.ts`, cases by name: "hueBin puts 345, 0 and 14 in bin 0 and 15 in bin 1"; "hueBin puts 344 in bin 11"; "hexHue of pure red, green and blue is 0, 120 and 240"; "hexHue of a grey is null"; "colourName of a grey is Night glass"; "colourName of #FF8800 is Orange".
- [ ] Check that the rule bites: let `applyPane` accept an unknown site, see its case fail, and restore it. Say so in the report.
- [ ] Commit: `feat(screen) added the window state and the rose geometry with tests`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the twenty-three cases pass.

#### B2-2.b Panes, completions and state reach the page, from the socket or from the demo feed

**B2-2.b.1** Screen socket hook and the demo feed. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/useScreenSocket.ts`, `demoFeed.ts`, `demoFeed.test.ts`, `useGlowSocket.ts` (deleted), `ScreenPage.tsx`.

- [ ] `useScreenSocket(siteIds: string[], demo: boolean)` replaces `useGlowSocket`, which is deleted; `ScreenPage.tsx` is its only caller. It returns `{ glowRef, windowsRef, effectsRef, connected, coloursToday, events }`.
- [ ] `glowRef` is as before. `windowsRef: RefObject<WindowsState>` starts as `emptyWindows(siteIds)`. `effectsRef: RefObject<ScreenEffect[]>` with `type ScreenEffect = { kind: "pane"; siteId: string; slot: number; hex: string; at: number } | { kind: "complete"; siteId: string; panes: (string | null)[]; at: number }`, `at` from `performance.now()`; the canvas removes the ones it has finished. `coloursToday: number | null` and `events: ScreenEvent[]` are React state, changed once per message and never per frame, with `type ScreenEvent = { kind: "pane"; siteId: string; hex: string; at: number } | { kind: "complete"; siteId: string; at: number }`, `at` from `Date.now()`, newest first, at most 6 kept.
- [ ] One socket, as now: `io(`${import.meta.env.VITE_API_URL}/live`, { query: { room: "screen" } })`, no token. `SocketMessage.enum.glow` goes to `applyGlow`. `SocketMessage.enum.pane` goes to `applyPane`; when the state object changed, an effect and an event are added. `SocketMessage.enum.window_complete` goes to `applyWindowComplete`; when the state object changed, an effect holding the panes the window had and an event are added.
- [ ] On every `connect`, the first and each reconnect: `fetch(`${import.meta.env.VITE_API_URL}/screen/state`)` with no header, the body through `applyState`. A network error, a status that is not 200 or a body that fails the schema changes nothing and shows nothing: the endpoint is Fabi's and has not landed (hour 12).
- [ ] `demoFeed.ts`: named constants `DEMO_PANE_MS = 500`, `DEMO_GLOW = { mx: 0.2, unirii: 0.45, victoriei: 0.7, bastion: 1 }`. `nextDemoMessage(state, random): { pane: PaneMessage; complete?: WindowCompleteMessage }`: a colour site taken with `random`, the lowest free slot of its window, the hex of a hue taken with `random` at saturation 70% and lightness 55%, `windowId` `demo-<n>` per site; when the pane fills the 48th slot the result also carries the completion, and the next pane for that site uses `demo-<n+1>`.
- [ ] With `demo` true the hook opens no socket and fetches nothing. It sets `glowRef` to `DEMO_GLOW`, reports `connected` true, and every `DEMO_PANE_MS` passes `nextDemoMessage` through the same `applyPane` and `applyWindowComplete` paths as the socket.
- [ ] `ScreenPage.tsx`: `const demo = isDemo(location.search)` from `apps/web/src/sensors/demo.ts`; the colour site ids are the sites with `is_memorial` false; the page calls `useScreenSocket`. The page takes its sites from `./sites.fixture`; if `sites` is exported from `@lampa/shared` on this branch, import that and leave the fixture to the tests, and say which one in the report. In demo the map area shows Ionut's `DemoBadge` from `apps/web/src/phone/DemoBadge.tsx`.
- [ ] `demoFeed.test.ts` with a seeded `random`, cases by name: "a demo pane takes the lowest free slot"; "a demo pane never targets the cathedral"; "the 48th pane carries a completion for the same windowId"; "the pane after a completion uses a new windowId"; "every demo message passes PaneMessage".
- [ ] Commit: `feat(screen) added the screen socket hook with panes, state fetch and the demo feed`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the five cases pass and the build has no reference to `useGlowSocket`. The live socket and `GET /screen/state` are not verified here: they are Cristea's check with Fabi in B2-last.

#### B2-2.c Each colour site draws its window, and a new pane and a full window are seen

**B2-2.c.1** Windows, pane flash and flare on canvas. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/canvas.ts`, `ScreenPage.tsx`.

- [ ] `startCanvas(canvas, sites, lines, { glowRef, windowsRef, effectsRef })`. The loop rules of v1 stay: one `requestAnimationFrame` loop, `devicePixelRatio` capped at 2, paused while `document.hidden`, no React state per frame, colours and fonts from the custom properties, no hex value and no font name in the file. Added properties: `--surface-2`, `--line-strong`, `--lamp-white`.
- [ ] Each colour site: the v1 `--lamp` disk is replaced by a rose window of R = `SITE_RADIUS` × u at the same position, over the same halo as v1 (`haloAlpha(glow)`, reach 1.6R). The label under it is unchanged.
- [ ] Slots are drawn from `slotShape`. An empty slot is `--surface-2`. A filled slot is `mixHex(hex, --bg, paneShare(glow))` with the eased glow of v1. Leading: every slot is stroked in `--bg` at `max(1.5 px, 0.012 × R)` in device pixels. Frame: a 1.5 × `dpr` px `--line-strong` circle at R + 2 × u, drawn on the static layer with the map lines.
- [ ] Pane effect (`DESIGN.md` 5.5, "New pane"): for 1400 ms the slot's colour goes from `--lamp-white` to its pane colour with the file's existing ease-out function; one ring of 2 × u `--text` grows from R to 1.3R while its alpha goes from 0.5 to 0 over 1200 ms. Named constants `PANE_FLASH_MS = 1400`, `PANE_RING_MS = 1200`.
- [ ] Complete effect (5.5, "Window complete"): the halo goes to alpha 1.0 and reach 2.6R in 600 ms, holds 1200 ms, and settles back over 1600 ms; during the rise and the hold the effect's 48 panes are drawn at share 1; over the last 800 ms of the settle they fade to the window's current state. Named constants `FLARE_IN_MS = 600`, `FLARE_HOLD_MS = 1200`, `FLARE_OUT_MS = 1600`, `FLARE_EMPTY_MS = 800`.
- [ ] Reduced motion (5.6), read once from `matchMedia("(prefers-reduced-motion: reduce)")`: no ring and no halo growth. A new pane is one 600 ms opacity fade-in of its slot; a complete window is one 600 ms opacity flash of the whole window. Glow brightness changes stay.
- [ ] The Cathedral is drawn exactly as in v1: the 1 px `--line` circle and its name in `--text-2`. No slot, no halo, no effect.
- [ ] Effects older than their duration are removed from `effectsRef.current` inside the loop.
- [ ] Commit: `feat(screen) drew the rose windows with the pane flash and the complete flare`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/canvas.ts | wc -l`. Paste the summary line.
- Done when: the build and the tests pass and the grep count is 0. This session then opens `http://localhost:5173/screen?demo=1`, clicks the start button and confirms by screenshot and by watching for two minutes: four windows fill slot by slot at four brightness levels, a new pane flashes with one ring, a window that reaches 48 flares and empties, the Cathedral stays an empty outline, and the console shows no error.

#### B2-2.d The side panel shows the counters, the ticker and the QR code

**B2-2.d.1** Side panel: counters, Ticker, QRBlock. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/ticker.ts`, `ticker.test.ts`, `Ticker.tsx`, `Ticker.module.css`, `QRBlock.tsx`, `QRBlock.module.css`, `ScreenPage.tsx`, `ScreenPage.module.css`.

- [ ] The panel, top to bottom (`DESIGN.md` 7.13): the wordmark; "Lamps lit today" over its value; "Colours caught today" over its value; the Ticker; the reconnect line of v1 (unchanged, shown only after 3 s disconnected); the QRBlock pinned to the bottom. Classes are ported from `.living-map__stat`, `__stat-label`, `__number`, `__number--lamps` and `__qr` in `design/css/livingmap.css`, same values, camelCase names.
- [ ] "Lamps lit today" shows `...` in this block: the `lamps` message is Fabi's Build 3 row. "Colours caught today" shows `coloursToday`, and `...` while it is `null`. Both values use `--screen-numeral` with `font-variant-numeric: tabular-nums`.
- [ ] `ticker.ts`: `tickerText(event, siteName, name)`: a pane gives `New colour at ${siteName}: ${name}` with `name` the English name from `colourName(hex)` in `@lampa/shared`; a completion gives `The ${siteName} window is complete.`. `timeAgo(at, now)`: `now` under 60 s, then `${n} min` with whole minutes rounded down.
- [ ] `Ticker.tsx`, DOM (`DESIGN.md` 6.18), classes ported from the `.ticker` block of `design/css/components.css`: a list of the hook's `events` (at most 6, newest on top). Each line: for a pane a 20 × u square swatch in the pane's hex as an inline `background`, then the text in `--screen-body` `--text`, then the time ago in `--screen-meta` `--text-3`. Text wraps to two lines at most. A new line fades in over 400 ms; older lines move down at once. The time ago refreshes every 30 s from one interval. Empty: "Waiting for the first visitor tonight." in `--text-2`. The list has `aria-live="off"`: the screen is a display, not a reader's page.
- [ ] `QRBlock.tsx` (`DESIGN.md` 6.17), classes ported from `.qr` and `.qr--screen`: a `<canvas>` drawn with `QRCode.toCanvas` from `qrcode`, options `errorCorrectionLevel: "M"`, `margin: 4`, `width` 240 × u in device pixels, `color.dark` read from `--bg` and `color.light` read from `--lamp-white` with `getComputedStyle`. The value is `${location.origin}/?mode=remote`. Caption: "Scan to join from here" in `--screen-body`. Loading: an empty `--lamp-white` square. Error: no code, and the caption shows the URL as text. The canvas has `role="img"` and `aria-label="QR code to join LAMPA"`.
- [ ] `ticker.test.ts`, cases by name: "a pane line names the site and the colour"; "a grey pane is named Night glass"; "a complete line names the site"; "timeAgo is now at 59 s"; "timeAgo is 1 min at 60 s and 2 min at 179 s".
- [ ] Commit: `feat(screen) added the counters, the ticker and the QR code to the side panel`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/*.css apps/web/src/screen/QRBlock.tsx apps/web/src/screen/Ticker.tsx | wc -l`. Paste the summary line.
- Done when: the five cases pass and the grep count is 0. This session then opens `http://localhost:5173/screen?demo=1` at 1920 × 1080 and 1280 × 720 and confirms by screenshot: both counters, six ticker lines with swatches and no line over two rows, the QR code at the bottom with its caption, nothing overlapping or clipped in the panel; and that the QR decodes to the origin plus `/?mode=remote` (scan it with a phone, or decode the screenshot).

### B2-last Integrate and hand over (last, this session)

- [ ] Both branches merged into a local throwaway branch, `npm ci && npm run typecheck && npm run build && npm test` green on it.
- [ ] Each branch was pushed and its PR opened as soon as its own verify passed, in this order: `cristea/b2-agent`, `cristea/b2-screen`. Each PR lists what was verified and what is waiting for Fabi's socket, for Patrick's agent or for a screen check. Cristea merges with a merge commit, never a squash, so Vercel deploys it.
- [ ] After `cristea/b2-agent` is merged and deployed: with a token from `POST /session/anon`, `curl -s -H "Authorization: Bearer <token>" "https://lampa-api-b45i.onrender.com/agent/session?site=cathedral"` prints `{"error":"no_persona"}`, and the same call without the header prints `{"error":"unauthorized"}`. Neither reaches ElevenLabs.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: `PaneMessage`, `WindowCompleteMessage`, `ScreenState` and the `GET /screen/state` request to Fabi; `AgentSession`, `AgentLang`, `GET /agent/session` with its answers (200, 401, 404 `unknown_site`, 404 `no_persona`, 429, 503 `agent_unavailable`) and `createAgentRouter({ getPersona, getSiteStats })`; `ELEVENLABS_AGENT_ID`; `colourName`, `hueBin`, `hexHue`, `COLOUR_NAMES`, `NIGHT_GLASS` and `MAP_LINES` in `@lampa/shared`; `slotShape` in `apps/web/src/screen/rose.ts`; `/screen?demo=1`.
- [ ] Cristea's check on the laptop with HDMI. Do not mark it done: the deployed `/screen?demo=1` shows the river, the ring, the credit, four windows filling, the ticker, the counters and the QR code, readable from across the room; the deployed `/screen` without `demo` shows empty windows, "Waiting for the first visitor tonight." and `...` in both counters.
- [ ] Cristea's check with Fabi, once `/live`, `POST /panes` and `GET /screen/state` are on `main`. Do not mark it done: a colour caught on a phone appears as a pane on the deployed `/screen` within one second; `simulate-crowd` fills a window to 48, it flares and a new one starts; a reload of `/screen` shows the panes that were there.
- [ ] Cristea's check with Patrick, once the env vars are on Render. Do not mark it done: one live Talk session on a phone starts from the deployed `GET /agent/session` and a client tool fires; with `ELEVENLABS_API_KEY` removed on Render the route answers 503 and Talk falls back to tap-to-ask without a reload. This costs credits: one session.
- Done when: every box is ticked or listed as Cristea's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the Cetate ring's street list until Cristea approves it; the live pane and state checks until Fabi's `/live`, `POST /panes` and `GET /screen/state` land; the pane, state and agent session schemas until Fabi and Patrick agree them; live Talk until the two ElevenLabs env vars are on Render and overrides are enabled on the agent; per-site overrides until Patrick passes `getPersona`; real stats until Fabi passes `getSiteStats`; the auth header of the signed-URL call until Patrick confirms `xi-api-key` against the docs.
- **Not finished at hour 18:** each ID, what is left, and its place in the cut order (the QR code, then the flare, then the pane ring, then the map lines).
- **Screen and phone checks for Cristea:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 2

- The deployed `GET /agent/session` answers `AgentSession` to a visitor with a valid token, 404 for an unknown site and for the Cathedral, 429 past 6 calls in ten minutes and 503 when ElevenLabs or its key is missing; no answer holds the API key; the API starts without the key.
- The deployed `/screen` draws a 48-slot rose window at each of the four colour sites and none at the Cathedral; a `pane` message fills its slot and flashes; a `window_complete` message flares and empties the window; the state is fetched on every connect.
- The side panel shows the two counters, the Ticker with its two line kinds and its empty state, and a QR code that opens `/?mode=remote`.
- The Bega and the Cetate ring are drawn under the sites from points in `packages/shared`, and "© OpenStreetMap contributors" is on the map.
- `/screen?demo=1` shows all of the above with no API.
- `npm test` is green and holds the agent session tests, the window, rose, colour, demo feed and ticker tests, and the fourteen projection tests.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `cristea/GLOSSARY.md` matches the state of the branch.

# Prompt: Ionut's Build 1, the spine (Ionut, Phone experience, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` and `DESIGN.md` at hour 1 (2026-11-13), with Ionut's answers of hour 1 and section 9.7 pasted by Ionut. Implementation not started.**

You are implementing Ionut's part of Build 1 (hours 2 to 10) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *a tap on a phone changes what `/screen` shows.*

Checkpoint this block must pass (Checkpoint 1, the lines this lane affects):

*1. On the iPhone and on the Android, one tap grants location and compass and a sound bed plays.*

*2. The `wake` event is a row in `interaction_events`.*

*4. `npm test` is green.*

*5. Ten minutes outdoors in daylight with both phones: the dark theme's text is readable on the join and site screens. If not, raise it with the team before Build 2.*

## 0. Ground rules

- **Ionut takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Ionut, with your recommendation. Nothing uses the recommendation until Ionut answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 10.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Ionut: carrying on, cutting or moving it is their decision. Ionut's cut order for this block (hour 1): first the RoseWindow shrinks to 48 plain empty panes with no halo; then the GlowMark shows the word only; then demo mode drops `&heading`. Never cut: the primer tap, the sensor hooks, the geo tests, `wake` batching.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Ionut, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Ionut's approval. Approved: `react-router` 8.5.1 and `vitest` 5.1.0 (Setup); `zod` 4.6.7. `socket.io-client` 4.8.4 is approved by Cristea for `apps/web` and installed by her B1-0; Ionut uses it for the phone glow (hour 1). No jsdom, no Testing Library: tests are pure functions in the `node` environment.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. Cristea merges every PR, with a merge commit (Ionut has no Vercel access, so Ionut's PRs show a failing Vercel check that is expected). Branches: `ionut/b1-events` (the seam commit, B1-2), `ionut/b1-sensors` (B1-1), `ionut/b1-screens` (B1-3), `ionut/b1-auth` (B1-2.b, only if `cristea/b1-session` lands after `ionut/b1-events` is merged). One small PR per branch. Open it as soon as its verify commands pass. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, no game verbs (wake, catch, raise, glow), no number, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components Cristea ships in `apps/web/src/styles/tokens.css` and `apps/web/src/components`. Do not add a colour, font or spacing value that is not a token. Do not edit Cristea's files.
- UI copy is English only in this block, exactly as `DESIGN.md` 7.0, 7.1 and 7.2 write it. The dictionary is Build 4.
- Write in `ionut/` only. Other members' folders are read-only.
- **Keep `ionut/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Ionut a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm ci` is refused by this session's auto mode (it deletes `node_modules`). Where a step says `npm ci`, ask Ionut to run it with `! npm ci`.

## 1. Current state (checked at hour 1, 2026-11-13 14:29 +0200)

- Setup is closed for Ionut: every S ID is Done, the iPhone and Android route checks passed, and the team agreed the contract as it stands (enum names, no payloads). `main` is at `ab7ac93`, clean. Ionut's local branch `ionut/setup-vercel-decision` holds two glossary commits (`1ba7df2`, `511c8cf`) not on `main`; B1-0 carries them.
- Ionut's Setup on `main`: the route table in `apps/web/src/App.tsx`; placeholders `apps/web/src/routes/Landing.tsx` and `Site.tsx` (Ionut's to fill); `apps/web/src/api/client.ts` with `api()`, `ApiError`, `API_URL`, `SESSION_KEY`, `getHealth()`; Vitest in `apps/web` (`node` environment), `npm test` → 7 passed.
- Contract on `main`: `EventKind` (8) and `SocketMessage` (7) as Zod enums, no payload schema. Cristea's B1-0 appends `GlowMessage` (`{ sites: [{ siteId, glow 0..1 }] }`) and `Site` (`{ id, name, lat, lng, is_memorial }`) on `cristea/b1-foundation`. B1-0 here appends `EventIn` and `EventBatch` on `ionut/b1-events`.
- Not landed, from others: Cristea's tokens and components (`cristea/b1-foundation`), her session helper `getToken`/`authFetch` (`cristea/b1-session`), Fabi's `POST /events`, Socket.IO `/live` and `packages/shared/sites.json`, Patrick's audio engine v1. Fabi and Patrick have no glossary yet.
- Site ids proposed by Cristea to Fabi: `mx`, `unirii`, `victoriei`, `bastion`, `cathedral`.
- Local dev: the API needs `WEB_ORIGIN=http://localhost:5173` in the root `.env`, or the dev page is refused by CORS.
- `.claude/` is ignored by git. `ionut-api` and `ionut-routes` exist there; `ionut-sensors` and `ionut-screens` are new in this block (written at hour 1) and the Agent tool lists them; `ionut-api` was updated for this block at hour 1.
- Devices: Ionut has an iPhone; the team's Android is a teammate's.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 1, Ionut's rows and Checkpoint 1; section 8, Ionut's tests | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Ionut's table and "Needs from others" | All |
| `ionut/GLOSSARY.md` | Whole file | All |
| `cristea/GLOSSARY.md` | Hand-offs and Decisions | B1-0, B1-2.b, B1-3 |
| `packages/shared/src/contract.ts` | Whole file | B1-0, B1-2, B1-3 |
| `apps/web/src/api/client.ts`, `client.test.ts` | Whole files | B1-2 |
| `apps/web/src/session.ts` | Whole file, once on `main` | B1-2.b |
| `DESIGN.md` | Sections 2.3, 4.3, 4.5, 4.6, 5.6, 6.2, 6.5, 6.6, 6.7, 6.20, 6.21, 6.22 (the unlit drawing only), 7.0, 7.1, 7.2, 7.16, and section 9 item 2 | B1-3 |
| `apps/web/src/components/index.ts`, `apps/web/src/styles/tokens.css` | Exports; custom property names | B1-3 |
| `apps/web/src/App.tsx`, `apps/web/src/routes/` | Whole files | B1-3 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Landing at `/s/:siteId` and the primer: one tap requests location and compass (iOS `requestPermission`) and resumes the AudioContext | 2 | B1-1.b (primer), B1-3.a |
| `useGeolocation`, `useCompass` (iOS and Android paths), `useGeofence` with the hysteresis recipe from section 9.7, plus geo helpers with tests | 2.5 | B1-1.a, B1-1.b |
| Section 8: `bearing`, Haversine, geofence enter and exit with accuracy | in the 2.5 | B1-1.a |
| Demo mode: `?demo=1` injects position and heading | 1 | B1-1.c, B1-3.a (DemoBadge) |
| Site view from `sites.json`: asleep or awake from glow, entry points for the four interactions (memorial site: listen and candle only), `wake` event, client batching to `POST /events` every 2 s | 1 | B1-2.a, B1-3.b |
| `DESIGN.md` section 9 item 2: Join and Site view: GlowMark, RoseWindow (SVG), memorial landing variant. Smallest version: 7.1 success, location denied, audio blocked, memorial variant; 7.2 asleep and awake | 1.0 styling, from block slack | B1-3.a, B1-3.b |
| Checkpoint 1, line 1 | | B1-1.b, B1-3.a, B1-last (phone) |
| Checkpoint 1, line 2 | | B1-2.a, B1-2.b (not cuttable: without it `POST /events` answers 401), B1-3.b, B1-last (with Fabi) |
| Checkpoint 1, line 4 | | every ID, B1-last |
| Checkpoint 1, line 5 | | B1-last (team, on Ionut's screens) |

Total: 6.5 h of tasks plus 1.0 h of styling in an 8 h block.

Order: B1-0 by this session. Then B1-1 (`ionut-sensors`) and B1-2.a (`ionut-api`) run in parallel in the one working tree. B1-3 (`ionut-screens`) starts as soon as `ionut/b1-sensors`, `ionut/b1-events` and `cristea/b1-foundation` are pushed: `ionut/b1-screens` is a local merge of the three (Ionut's decision, hour 1), its PR waits until all three are on `main`, and the branch is then rebased onto `main`. B1-2.b runs once `cristea/b1-session` is on `main`. Then B1-last.

Before B1-3 and before B1-2.b, Ionut runs `! npm ci`, because Cristea's branches add `socket.io-client`, the fonts and other packages to the lockfile.

Conflicts: Cristea's B1-0 and this B1-0 both append to the end of `contract.ts`, and every Ionut branch adds glossary rows. After each merge into `main`, rebase the next open Ionut branch on `main`, re-run its verify, and push before Cristea merges it. Keep both seams when resolving `contract.ts`.

`apps/web/src/main.tsx` renders without `StrictMode` (checked at hour 1), so effects run once in dev.

The seam. This session writes it in B1-0 as the first commit of `ionut/b1-events` (Ionut's decision, hour 1). Appended to `packages/shared/src/contract.ts` (owner: the team; Ionut proposes it to Fabi, who validates it in `POST /events` and sets the weights):

```ts
export const EventIn = z.object({
  kind: EventKind,
  siteId: z.string(),
  at: z.string().datetime(),
});
export type EventIn = z.infer<typeof EventIn>;

export const EventBatch = z.object({
  events: z.array(EventIn).min(1).max(50),
});
export type EventBatch = z.infer<typeof EventBatch>;

export const EventsAccepted = z.object({ accepted: z.number().int().min(0) });
export type EventsAccepted = z.infer<typeof EventsAccepted>;
```

`POST /events` answers 202 with an `EventsAccepted` body (Ionut's decision, hour 1; proposed to Fabi with the seam).

The phone sites, until `packages/shared/sites.json` lands (Ionut's decision, hour 1), live in `apps/web/src/sites/sites.ts`, written by `ionut-sensors` in B1-1.a:

```ts
// The five fields of Cristea's proposed `Site`, declared here because `Site` is not on `main` yet.
export type PhoneSite = { id: string; name: string; lat: number; lng: number; is_memorial: boolean; lamp: boolean };
export const SITES: PhoneSite[];                    // the five rows below
export function findSite(id: string): PhoneSite | undefined;
```

Rows, the same ids and coordinates as Cristea's `/screen` fixture: `mx`, "Muzeul MX Corneliu Miklosi", 45.7610, 21.2480; `unirii`, "Piața Unirii", 45.7579, 21.2290; `victoriei`, "Piața Victoriei", 45.7537, 21.2253; `bastion`, "Theresia Bastion", 45.7573, 21.2340; all four `is_memorial: false`, `lamp: true`. `cathedral`, "Metropolitan Cathedral", 45.7507, 21.2243, `is_memorial: true`, `lamp: false`. Comment: `// shortcut: approximate coordinates, a local Site shape and a local lamp flag until packages/shared/sites.json and Site land; swap the source and type here then`.

### 3.1 Subagents

Ionut asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Ionut, re-runs the checks, commits, writes the glossary and does B1-0 and B1-last. It does not implement the agent tasks itself.

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `ionut-sensors` | Geo helpers, sensor hooks, primer, audio context, demo mode and their tests in `apps/web` | opus | new |
| `ionut-api` | Event queue, batching, `api()` changes and their tests in `apps/web` | opus | reused (its file is updated in B1-0) |
| `ionut-screens` | Join, Site view, GlowMark, RoseWindow, DemoBadge, phone glow hook, styled with CSS Modules in `apps/web` | sonnet | new |

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B1-1.a.1 | `ionut-sensors` | Sites, geo helpers, geofence, tests | `apps/web/src/sites/**`, `apps/web/src/geo/**` | parallel with B1-2.a.1 |
| B1-1.b.1 | `ionut-sensors` | Location and compass hooks, audio context, primer | `apps/web/src/sensors/**`, `apps/web/src/audio/**` | after B1-1.a.1 |
| B1-1.c.1 | `ionut-sensors` | Demo mode | `apps/web/src/sensors/demo.ts`, `demo.test.ts`, `useGeolocation.ts`, `useCompass.ts`, `primer.ts`, `sensors.test.ts` | after B1-1.b.1 |
| B1-2.a.1 | `ionut-api` | Event queue and `track()` | `apps/web/src/events/**` | parallel with B1-1 |
| B1-2.b.1 | `ionut-api` | `api()` through `authFetch` | `apps/web/src/api/client.ts`, `client.test.ts` | after `cristea/b1-session` is on `main` |
| B1-3.a.1 | `ionut-screens` | Join, primer UI, memorial landing, DemoBadge | `apps/web/src/phone/Join*`, `apps/web/src/phone/DemoBadge*`, `apps/web/src/phone/RoseWindow*`, `apps/web/src/routes/Landing.tsx`, `apps/web/src/routes/Site.tsx` | after the three branches are pushed |
| B1-3.b.1 | `ionut-screens` | Site view, GlowMark, phone glow, `wake`, memorial stub | `apps/web/src/phone/SiteView*`, `apps/web/src/phone/MemorialStub*`, `apps/web/src/phone/GlowMark*`, `apps/web/src/phone/useSiteGlow.ts`, `apps/web/src/phone/glow.ts`, `glow.test.ts`, `apps/web/src/routes/Site.tsx` | after B1-3.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. Pass no `model` and no `isolation`.
- If the Agent tool does not list one of these subagents, stop and ask Ionut to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Ionut.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Agents share one working tree. They do not run `git add`, `git commit`, `git switch` or `npm install`. This session commits each agent's files to its branch after re-running its verify command.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Ionut, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B1-0 Preflight and seam (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck && npm run build && npm test` (Ionut runs `! npm ci` first if `package-lock.json` changed on `main` since Setup).
- [ ] Re-check each item of section 1 "Not landed": `git fetch`, `ls */GLOSSARY.md`, `ls packages/shared/sites.json`, `git log origin/main --oneline -15`. List what moved.
- [ ] Create `ionut/b1-events` from `main`, cherry-pick `1ba7df2` and `511c8cf`, append the seam above to `packages/shared/src/contract.ts` exactly. `index.ts` already re-exports the file.
- [ ] Check that the Agent tool lists `ionut-sensors`, `ionut-screens` and `ionut-api` (the `ionut-api` file was updated for this block at hour 1).
- [ ] Glossary in the same commit: Done line for the Setup close-out (Android route check passed, reported by Ionut; contract agreed as it stands, per `cristea/GLOSSARY.md`), the Blocked rows of Setup removed, and a Decisions line for each "Ionut's decision, hour 1" in this prompt.
- [ ] Commit `ionut/build_1/build_1_prompt.md`, the seam and the glossary as `feat(shared) added EventIn, EventBatch and EventsAccepted to the contract`, and push.
- [ ] Tell Ionut to take to Fabi: `EventIn`, `EventBatch` and `EventsAccepted` (`POST /events` validates the batch, sets the weights, answers 202 `{ accepted }`); the phone glow join `query: { room: "site:<id>" }` on `/live`; the site ids.
- Verify: `npm run typecheck && npm run build && npm test`. Paste the summary line.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently; `ionut/b1-events` is on the remote with the seam commit.

### B1-1 Geo helpers, sensor hooks, primer, demo mode (2.5 h + 2 h primer share + 1 h)

#### B1-1.a Distances, bearings and the geofence are right

**B1-1.a.1** Sites, geo helpers, geofence, tests. Subagent: `ionut-sensors`. Files: `apps/web/src/sites/**`, `apps/web/src/geo/**`.

- [ ] `apps/web/src/sites/sites.ts` exactly as section 3 says (type, five rows, `findSite`, the shortcut comment).
- [ ] `apps/web/src/geo/geo.ts` exports `haversineM(a, b): number` (metres, Earth radius 6371008.8 m) and `bearingDeg(a, b): number` (initial great-circle bearing, 0 to under 360, 0 = north, clockwise), where `a` and `b` are `{ lat, lng }` in degrees.
- [ ] `apps/web/src/geo/geofence.ts`: the hysteresis recipe of the concept PDF section 9.7, word for word as Ionut pasted it at hour 1: *"Geofence: enter when distance < r + min(accuracy, 30 m); exit when distance > r + 25 m; ignore fixes with accuracy > 60 m; a QR scan overrides"*. Named constants: `SITE_RADIUS_M = 40` for every site (Ionut's decision, hour 1), `ENTER_ACCURACY_CAP_M = 30`, `EXIT_MARGIN_M = 25`, `MAX_ACCURACY_M = 60`.
  - `type FenceState = { insideId: string | null }`; `initialFence(qrSiteId?: string): FenceState` gives `{ insideId: qrSiteId ?? null }`.
  - `stepFence(state, fix: { lat, lng, accuracy }, sites): FenceState`. A fix with accuracy over 60 m returns the same state object. When inside a site, the state stays until a fix is farther than r + 25 m from it; that exit clears `insideId`, and the same fix may then enter another site. When outside, the fix enters the nearest site whose distance is under r + min(accuracy, 30 m).
  - QR override (Ionut's decision, hour 1): opening `/s/:siteId` from its URL starts the fence inside that site with `initialFence(siteId)`, whatever GPS says, and only a real exit fix (accuracy 60 m or better, distance over r + 25 m) ends it. A poor fix never ends it.
- [ ] `apps/web/src/geo/geo.test.ts`, cases by name: "haversine of a point to itself is 0"; "haversine Unirii to Victoriei is within 1% of 548.19 m" (reference computed at hour 1 with the spherical law of cosines on the same radius, an independent formula; the test says so in a comment); "bearing due north is 0 and due east is 90"; "bearing wraps to under 360". `apps/web/src/geo/geofence.test.ts`, cases by name: "enters when the distance is under r plus the accuracy"; "accuracy counts at most 30 m toward entering"; "a fix with accuracy over 60 m is ignored"; "stays inside in the band between the enter and exit distances"; "exits beyond r plus 25 m"; "an exit fix can enter another site at once"; "a QR start counts as inside until a GPS exit"; "a poor fix does not end a QR start".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/geo && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes.

#### B1-1.b One tap grants location and compass and starts audio

**B1-1.b.1** Location and compass hooks, audio context, primer. Subagent: `ionut-sensors`. Files: `apps/web/src/sensors/**`, `apps/web/src/audio/**`.

- [ ] `apps/web/src/audio/context.ts` exports `getAudioContext(): AudioContext` (one per page, created on first call) and `unlockAudio(): Promise<"running" | "blocked">` (calls `resume()`; `"blocked"` when the state is not `running` afterwards or `resume()` throws). Patrick's engine imports the same context (Ionut's decision, hour 1). It plays nothing.
- [ ] `apps/web/src/sensors/primer.ts` exports `primeDevice(): Promise<{ location: "granted" | "denied" | "unavailable"; compass: "granted" | "denied" | "unavailable"; audio: "running" | "blocked" }>`. It is called inside the tap handler. Before its first `await` it starts all three: `DeviceOrientationEvent.requestPermission()` when that function exists (iOS), `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, and `unlockAudio()`. It waits at most 8 s for the first position; a timeout counts as `location: "granted"`, because `useGeolocation` keeps watching (Ionut's decision, hour 1). Only a permission denial gives `"denied"`. Android and desktop without `requestPermission` count as `compass: "granted"` when a `deviceorientationabsolute` or `deviceorientation` event exists, otherwise `"unavailable"`. It never asks for camera or microphone.
- [ ] `useGeolocation(): { position: { lat, lng, accuracy } | null; status: "idle" | "watching" | "denied" | "unavailable" }` with `watchPosition`, `enableHighAccuracy: true`, cleared on unmount.
- [ ] `useCompass(): { heading: number | null; source: "ios" | "absolute" | "none" }`. iOS: `webkitCompassHeading` from `deviceorientation`. Android: `deviceorientationabsolute`, heading = (360 − alpha) mod 360. Each reading passes through an angular low-pass, `smoothHeading(prev, next, 0.2)`, that takes the short way across 359 → 0 (section 9.7; Ionut's decision, hour 1: the GPS course blend waits for Build 3). `null` until the first reading. Listener removed on unmount.
- [ ] `useGeofence(position, qrSiteId?): { insideId: string | null }` in `apps/web/src/sensors/useGeofence.ts`: starts from `initialFence(qrSiteId)`, feeds each position from `useGeolocation` (or demo) through `stepFence` over `SITES`, and keeps the state across renders. A new `qrSiteId` restarts the fence.
- [ ] The pure parts (the heading from an event, the permission result mapping, the 8 s timeout mapping) sit in functions with a test file `apps/web/src/sensors/sensors.test.ts`, cases by name: "ios heading is taken from webkitCompassHeading"; "android heading is 360 minus alpha"; "a null alpha gives no heading"; "a denied requestPermission maps to compass denied"; "no requestPermission and an absolute event maps to compass granted"; "a location timeout maps to granted and a denial to denied"; "smoothing from 350 toward 10 crosses north, not south".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/sensors && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the seven cases pass. iOS and Android behaviour is checked on the phones in B1-last, not here.

#### B1-1.c `?demo=1` injects position and heading

**B1-1.c.1** Demo mode. Subagent: `ionut-sensors`. Files: `apps/web/src/sensors/demo.ts`, `apps/web/src/sensors/demo.test.ts`, `apps/web/src/sensors/useGeolocation.ts`, `apps/web/src/sensors/useCompass.ts`, `apps/web/src/sensors/primer.ts`, `apps/web/src/sensors/sensors.test.ts`.

- [ ] `readDemo(search: string, routeSiteId?: string): { lat, lng, accuracy: 5, heading: number } | null` (Ionut's decision, hour 1): `null` unless `demo=1`. The position is the site of `routeSiteId`, else the site of `&at=<siteId>`, else `mx`. Heading is `&heading=<deg>` taken mod 360, 0 when absent or not a number. An unknown site id falls back to `mx`.
- [ ] `isDemo(search): boolean`.
- [ ] While demo is on, `useGeolocation` returns the injected position with status `"watching"`, and `useCompass` returns the injected heading with `source: "none"`. Neither reads a real sensor while demo is on.
- [ ] `primeDevice({ demo })` (Ionut's decision, hour 1): with `demo: true` it only calls `unlockAudio()`; it asks for no location or motion permission and reports `location: "granted"` and `compass: "granted"`. Demo mode never shows a permission prompt, real or fake (`DESIGN.md` 7.16).
- [ ] `demo.test.ts`, cases by name: "no demo param gives null"; "demo on a site route sits on that site"; "demo with at sits on that site"; "demo with an unknown site sits on mx"; "heading 450 gives 90"; "a heading that is not a number gives 0". In `sensors.test.ts`, one more case: "demo priming asks for no location or motion permission".
- Verify: `npm run test -w @lampa/web -- src/sensors && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the six demo cases and the eight sensor cases pass.

### B1-2 `wake` events batched to `POST /events` every 2 s

#### B1-2.a Events reach the API in batches and survive a failed send

**B1-2.a.1** Event queue and `track()`. Subagent: `ionut-api`. Files: `apps/web/src/events/**`.

- [ ] `apps/web/src/events/queue.ts` exports `createEventQueue({ send, intervalMs = 2000, cap = 200, now = () => new Date() })` with `push(kind: EventKind, siteId: string)`, `flush(): Promise<void>`, `start()`, `stop()`, `size()`. `push` stamps `at` with `now().toISOString()`. `flush` sends up to 50 events as one `EventBatch` (parsed with `EventBatch.parse` before sending).
- [ ] Failure (Ionut's decision, hour 1): a thrown network error, a 5xx, a 401 or a 429 puts the batch back at the front of the queue for the next tick; any other 4xx drops that batch. The queue never holds more than 200 events; on overflow the oldest are dropped. No storage persistence. One flush runs at a time.
- [ ] `apps/web/src/events/index.ts` exports `track(kind, siteId)`: one module-level queue whose `send` calls `api("/events", { method: "POST", body: batch, schema: EventsAccepted })`, started on the first `track`. A body that fails `EventsAccepted` counts as a dropped batch (it would never pass), not a retry.
- [ ] No event carries a weight or any field outside `EventIn`.
- [ ] `apps/web/src/events/queue.test.ts`, with fake timers and a stubbed `send`, cases by name: "push then a 2 s tick sends one batch"; "a batch holds at most 50 events"; "a 503 keeps the batch for the next tick"; "a network error keeps the batch for the next tick"; "a 400 drops the batch"; "the queue drops the oldest past 200"; "events carry kind, siteId and at and no weight"; "two ticks during a slow send make one request"; "a 202 with a body that fails the schema drops the batch".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/events && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the nine cases pass. The row in `interaction_events` is checked in B1-last with Fabi.

#### B1-2.b `api()` renews the anonymous token on a 401

**B1-2.b.1** `api()` through `authFetch`. Subagent: `ionut-api`. Files: `apps/web/src/api/client.ts`, `apps/web/src/api/client.test.ts`. Runs once `cristea/b1-session` is on `main` (Ionut's decision, hour 1).

- [ ] `api()` calls Cristea's `authFetch(path, init)` from `apps/web/src/session.ts` in place of `fetch(API_URL + path)` and no longer reads `localStorage` itself; `authFetch` adds the Bearer header and the 401 retry. Everything else in `api()` stays.
- [ ] The tests that checked the Bearer header from `localStorage` now stub `authFetch` (module mock) or `fetch` plus `localStorage` as `session.ts` needs; the six case names stay, and the two header cases are renamed only if their meaning changes (say so in the report).
- Verify: `npm run test -w @lampa/web -- src/api && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the client cases pass and `client.ts` holds no `localStorage` read.

### B1-3 Join, primer UI, Site view, memorial stub (2 h + 1 h + 1.0 h styling)

Branch `ionut/b1-screens`, a local merge of `ionut/b1-sensors`, `ionut/b1-events` and `cristea/b1-foundation` once all three are pushed, then rebased onto `main` once they are merged. Ionut runs `! npm ci` first. Files go to `apps/web/src/phone/<Name>.tsx` with `<Name>.module.css`. CSS Modules read only custom properties from `tokens.css`. Base components come from `apps/web/src/components` (Button, Notice, Icon, Ring).

Cristea's optional states may not ship (her B1-1 cut order). Fallbacks: if `Button` has no loading state, the button is `disabled` with `aria-busy="true"` and the label "Waking {Site}"; if `Notice` has no `connection` variant, use `info`.

#### B1-3.a One tap on the Join screen wakes the phone

**B1-3.a.1** Join, primer UI, memorial landing, DemoBadge, RoseWindow. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Join.tsx`, `Join.module.css`, `DemoBadge.tsx`, `DemoBadge.module.css`, `RoseWindow.tsx`, `RoseWindow.module.css`, `apps/web/src/routes/Landing.tsx`, `apps/web/src/routes/Site.tsx`.

- [ ] `Join` follows `DESIGN.md` 7.1: wordmark, site name, "{Site} is asleep.", RoseWindow L with 48 empty panes (no pane data exists yet), the headphones hint, primary L Button "Wake {Site}", the keep-open line. On `/` the name line is "Timișoara is asleep." and the button "Wake the city".
- [ ] The button's tap calls `primeDevice({ demo: isDemo(location.search) })`. While it runs the button is loading with "Waking {Site}". Then: on `/s/:siteId` the Site view replaces Join (state kept in React only; a reload shows Join again, because the AudioContext needs a new tap); on `/` the app navigates to `/s/mx` (Ionut's decision, hour 1), keeping the `mode` and `demo` params and passing the primer result as router `state`, so `/s/mx` opens straight on the Site view instead of a second Join.
- [ ] Results: `location: "denied"` → continue, and the Site view shows the Notice info "Location is off. This site still works. To walk to the next one, use the list."; `compass: "denied"` → continue silently; `audio: "blocked"` → Notice info "Tap to listen" action that calls `unlockAudio()`, on every view until audio runs.
- [ ] Memorial variant (`/s/cathedral`, `is_memorial`): no RoseWindow and no "asleep" line; the line "A place of remembrance for December 1989."; an unlit Candle drawing (flame 0.4, no Ring, `DESIGN.md` 6.22 anatomy); the same headphones hint; primary L Button "Listen". The tap does the same `primeDevice()` and then shows the memorial stub (B1-3.b).
- [ ] Unknown site id: "We could not find this place." and primary Button "Show all sites", which goes to `/` until the Build 3 list.
- [ ] `RoseWindow` as `DESIGN.md` 6.6 in SVG: 48 slots in the three rings, leading `--bg`, frame `--line-strong`, empty slots `--surface-2`, sizes L and S, prop `filled: (string | null)[]` (48 colours or null; all null in this block), halo by glow per 4.3 when `glow` is given; accessible name "{Site} window, {n} of 48 panes".
- [ ] `DemoBadge` as 6.21, shown on every phone view when `isDemo(location.search)`.
- [ ] `routes/Landing.tsx` and `routes/Site.tsx` render `Join` (Site passes the `siteId`); `App.tsx` is not touched.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/phone/*.css | wc -l`. Paste the summary line.
- Done when: build and tests pass and the grep count is 0. This session then opens `/`, `/s/unirii`, `/s/cathedral`, `/s/nope` and `/s/unirii?demo=1` with `npm run dev` and checks each state above with no console error.

#### B1-3.b The Site view shows glow and sends `wake`

**B1-3.b.1** Site view, GlowMark, phone glow, `wake`, memorial stub. Subagent: `ionut-screens`. Files: `apps/web/src/phone/SiteView.tsx`, `SiteView.module.css`, `MemorialStub.tsx`, `MemorialStub.module.css`, `GlowMark.tsx`, `GlowMark.module.css`, `useSiteGlow.ts`, `glow.ts`, `glow.test.ts`, `apps/web/src/routes/Site.tsx`.

- [ ] `glow.ts`: if Cristea's `apps/web/src/screen/glow.ts` is on `main`, re-export `glowWord` and `glowLine` from it; otherwise write them with the thresholds of `DESIGN.md` 2.3 and a shortcut comment pointing at hers. Plus `siteGlow(message: unknown, siteId): number | undefined` with `GlowMessage.safeParse`.
- [ ] `useSiteGlow(siteId): { glow: number | null; connected: boolean }` (Ionut's decision, hour 1): `io(`${API_URL}/live`, { query: { room: "site:<id>" } })`, listens for `SocketMessage.enum.glow`, keeps the last value on disconnect, closes on unmount. `null` until the first message.
- [ ] `GlowMark` as 6.5, size M: loading ("Listening for the city…") while `glow` is `null`; after 8 s still `null` the Site view shows Notice "Still connecting to the city. You can already listen."; offline adds "(last known)".
- [ ] `SiteView` as 7.2: DemoBadge in the top bar, the name, GlowMark M, RoseWindow L with the glow halo, primary L "Talk", the grid of secondary L "Catch a colour", "Raise a lamp" (only when `site.lamp` and not `mode=remote`), "Leave an echo", and a quiet "Next site". Every action button renders with no action (Ionut's decision, hour 1). "Keep my colours" is not shown (no colour can be caught yet). Asleep (glow under 0.15): window at 45% brightness, no halo.
- [ ] On mount for a non-memorial site, `track("wake", site.id)` once.
- [ ] `MemorialStub` (Ionut's decision, hour 1): the name, the word "Memorial" in place of a GlowMark, and two entry points with no action: "Listen" and "Light a candle". No glow, no number, no RoseWindow, no `wake`, no socket.
- [ ] `glow.test.ts`, cases by name: "siteGlow reads the value for its site"; "siteGlow ignores other sites"; "siteGlow ignores an invalid message".
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/phone/*.css | wc -l`. Paste the summary line.
- Done when: build and tests pass and the grep count is 0. This session checks with `npm run dev` that opening `/s/unirii` after the tap sends one `POST /events` with one `wake` within 2 s (network panel; a refused request is expected until Fabi lands), and that `/s/cathedral` sends none.

### B1-last Integrate and hand over (last, this session)

- [ ] Each branch's PR opened as soon as its verify passed: `ionut/b1-events`, `ionut/b1-sensors`, then `ionut/b1-screens` (and `ionut/b1-auth` if used). Each PR lists what was verified and what waits for a phone or for Fabi. Cristea merges with a merge commit.
- [ ] On `main` after the merges: `npm run typecheck && npm run build && npm test` green (Ionut runs `! npm ci` first).
- [ ] Glossary complete: every ID is under Done or Blocked. Hand-offs: `EventIn`, `EventBatch`; `track()`; `SITES`, `findSite`, `PhoneSite`; `haversineM`, `bearingDeg`, the geofence; `useGeolocation`, `useCompass`, `useGeofence`, `primeDevice`, `getAudioContext`/`unlockAudio` for Patrick; `EventsAccepted` and the 202 answer for Fabi; `readDemo`/`isDemo`; `RoseWindow`, `GlowMark`, `DemoBadge`; the phone socket join `site:<id>` for Fabi.
- [ ] Ionut's check on the iPhone, deployed. Do not mark it done: `/s/unirii` → one tap → the iOS location and motion prompts appear, both granted, the Site view shows; `/s/unirii?demo=1` shows "Demo position" and no prompt; `/s/cathedral` shows the memorial landing and stub.
- [ ] A teammate's check on the Android. Do not mark it done: the same steps.
- [ ] Ionut's check with Fabi, once `POST /events` is on `main`. Do not mark it done: a `wake` from the phone is a row in `interaction_events`.
- [ ] Ionut's check with Patrick, once the audio engine lands. Do not mark it done: after the tap a sound bed plays (Checkpoint 1 line 1).
- [ ] Checkpoint 1 line 5 by the team on the Join and Site views.
- Done when: every box is ticked or listed as Ionut's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: Fabi's `POST /events` and `/live`; Patrick's engine for the sound bed; Cristea's foundation for B1-3.
- **Not finished at hour 10:** each ID, what is left, and its place in Ionut's cut order.
- **Phone checks for Ionut:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 1

- One tap on `/s/:siteId` grants location and compass, resumes audio and shows the Site view; `/s/cathedral` shows the memorial landing and stub.
- `?demo=1` drives position and heading with no real sensor and no permission prompt, and shows "Demo position".
- `useGeofence` enters and exits sites by the section 9.7 recipe, and its tests pass.
- Opening a site view queues one `wake`, sent in an `EventBatch` within 2 s, kept on a failed send.
- `npm test` is green and holds the geo and geofence tests, the sensor mapping tests, the demo tests, the queue tests, the glow tests and the client tests.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `ionut/GLOSSARY.md` matches the state of the branches.

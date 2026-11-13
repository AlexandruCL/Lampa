# Prompt: Ionut's Build 3, Echo and Between sites (Ionut, Phone experience, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` and `DESIGN.md` at hour 7 (2026-11-13 20:43 +0200), with Ionut's answers of hour 7. Written 18 hours before the block starts: B3-0 re-checks every fact of section 1. Implementation not started.**

You are implementing Ionut's part of Build 3 (hours 25 to 32) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *Echo, navigation, Lamp, Pulse, sign-in.*

Checkpoint this block must pass (Checkpoint 3, hours 32 to 34):

*Run the demo script from section 10.4, steps 0:00 to 1:40 plus the Pulse step and the memorial step from the v5 addendum, twice from a cold start, with the crowd simulator running. Write down every break. Fix it, or cut the feature and adjust the script. Then decide which Build 4 rows to attempt, using the cut order in section 7.*

The two steps of concept section 10.4 this lane carries: *1:20 They whisper why; a teammate approves the echo with MFA; it ripples across the Living Map.* and *1:40 No map: the judge turns toward the Piața Unirii poster across the room and the bells come into focus; the arrow card agrees.*

## 0. Ground rules

- **Ionut takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Ionut, with your recommendation. Nothing uses the recommendation until Ionut answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 32.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Ionut: carrying on, cutting or moving it is their decision. Ionut's cut order for this block (hour 7): first the GPS course blend (B3-3.c); then the lantern dim (B3-5); then Sheet (B3-4; the plain views stay); then the echo preview playback; then "Say why" on the lens (B3-3.b). Never cut: record, consent and upload; the arrow and the distance; the next-site score with its test; the Maps links.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Ionut, who takes it to the team. The echo seam of section 3 is the only change in this block. `POST /echoes` has not landed: code against the seam.
- The server sets event weights. The client never sends one.
- No library beyond those already in `apps/web/package.json`. Approved in this block: none. No jsdom, no Testing Library: tests are pure functions in the `node` environment.
- No storage: nothing in this block writes `localStorage`, `sessionStorage` or IndexedDB. The recording and the visited sites live in memory, and a reload forgets both (Ionut's decision, hour 7).
- The microphone is requested only inside the tap on the record control. The recording leaves the phone only through `POST /echoes`, after the consent box is ticked.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. Cristea merges every PR, with a merge commit (Ionut has no Vercel access, so Ionut's PRs show a failing Vercel check that is expected). Branches: `ionut/b3-echo` (this prompt, the glossary and the plan update as a docs commit, the seam, B3-1, B3-3.b) and `ionut/b3-between` (B3-3.a, B3-2, B3-3.c, B3-4, B3-5), which starts from `ionut/b3-echo`. One PR per branch, opened as soon as its verify commands pass. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. The echo recorder and the lens are never offered there, and `MemorialStub` stays untouched. In navigation it is a site like any other, shown with the word "Memorial" in place of a GlowMark.
- Screens follow `DESIGN.md` and the tokens and base components in `apps/web/src/styles/tokens.css` and `apps/web/src/components`. Do not add a colour, font or spacing value that is not a token. Do not edit Cristea's files (`apps/web/src/components/**`, `apps/web/src/screen/**`, `apps/web/src/session.ts`, `apps/web/src/styles/**`).
- The screens of this block play no sound of their own: the beacon, the chime and the whispers are Patrick's, through the callbacks of the seam. The echo preview plays the visitor's own recording.
- UI copy is English only in this block, exactly as `DESIGN.md` 6.9, 6.12, 7.0, 7.6, 7.8 and 7.9 and this prompt write it. The dictionary is Build 4.
- Write in `ionut/` only. Other members' folders are read-only.
- **Keep `ionut/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Ionut a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm ci` and `git pull` have been refused by this machine's auto mode when chained with other commands. Where a step needs one, run it alone, and if it is refused ask Ionut to run it with `!`.

## 1. Current state (checked at hour 7, 2026-11-13 20:43 +0200)

- Build 2 is closed for Ionut: every B2 ID is Done, PRs #17 to #20 are merged, `main` is at `f562343`, clean. The iPhone and Android lens checks passed. Nothing was cut or carried over.
- Still open, all waiting on other lanes (glossary, Blocked): `POST /events` and `/live` (Fabi), `POST /panes` and the `pane` message (Fabi), `bin` on `PaneMessage` (Cristea), the sound bed and the lens sounds (Patrick).
- Deployed: `https://lampa-timisoara.vercel.app` → 200. `https://lampa-api-b45i.onrender.com/health` → `{"ok":true}`. `GET /socket.io/?EIO=4&transport=polling` → 404, `GET /sites` → 404. PR #21 (`cristea/b2-screen`) is open.
- "Needs from others" for this block: `POST /echoes` from Cristea by hour 28: not landed. No echo route exists in `apps/api/src` on `main` `f562343`, and no echo schema exists in `packages/shared/src/contract.ts` on `main`, `origin/cristea/b2-screen` or `origin/cristea/b2-agent`. B3-0 adds the seam.
- Fabi's Build 1 prompt (`fabi/build_1/build_1_prompt.md`, B1-2.a.1) puts every `/live` client in the room `city` and sends each `glow` message, holding all five sites, to the whole namespace. It is not on `main` yet.
- Exists and is built on:
  - `apps/web/src/phone/SiteView.tsx`: state `view: "site" | "lens"`; "Leave an echo" and "Next site" Buttons with no action; the `wake` effect.
  - `apps/web/src/phone/Join.tsx`: the tap on `/` calls `navigate("/s/mx" + search, { state: r })`; a module-level `primedThisLoad` flag guards router state; after the tap it renders `SiteView` or `MemorialStub`.
  - `apps/web/src/phone/ColourLens.tsx` (bottom Button "Back to {Site}", primary once caught), `TopBar.tsx` (`siteName`, `onBack`, `demo`), `GlowMark.tsx` (size M only; props `siteName`, `glow`, `connected`), `useSiteGlow.ts` (one site), `glow.ts`.
  - `apps/web/src/geo/geo.ts` (`LatLng`, `haversineM`, `bearingDeg`), `geofence.ts` (`Fix = LatLng & { accuracy }`, `FenceState = { insideId }`, `stepFence`, `MAX_ACCURACY_M = 60`).
  - `apps/web/src/sensors/useGeolocation.ts` (`useGeolocation(demo)` → `{ position: Fix | null, status: "idle" | "watching" | "denied" | "unavailable" }`), `useCompass.ts` (`useCompass(demo)` → `{ heading, source }`, `smoothHeading`), `useGeofence.ts` (`useGeofence(position, qrSiteId)`), `demo.ts` (`readDemo(search, routeSiteId)`), `primer.ts` (`PrimerResult`).
  - `apps/web/src/sites/sites.ts`: a local copy of the five sites with a `lamp` flag and a shortcut comment. `packages/shared/src/sites.ts` now exports `sites: Site[]` from `sites.json` (`id`, `name`, `lat`, `lng`, `is_memorial`; no `lamp`, no landmark hint).
  - `apps/web/src/api/client.ts`: `api()` sends JSON only. `apps/web/src/session.ts`: `authFetch(path, init)` passes `init.body` through and adds the Bearer header, so a `FormData` body goes through it.
  - `apps/web/src/audio/context.ts` (`getAudioContext`, `unlockAudio`), `apps/web/src/events/index.ts` (`track(kind, siteId)`; `arrived` is an `EventKind`).
  - Components: `Button` (primary, secondary, quiet, icon, danger; sizes m, l; `block`, `loading`), `Notice` (info, error, connection; `action: { label, onClick }`), `Ring`, `RoundControl` (`state`, `label`, `status`, `progress`, `onPress`, `onRelease`; no toggle prop, a tap fires `onPress` then `onRelease`), `Icon` (`back`, `close`, `play`, `pause`, `stop`, `mic`, `check`, `alert`, `headphones`; no arrow). There is no Field or checkbox component and no Sheet.
- Does not exist yet: `apps/web/src/echo/` (B3-0, B3-1.a, B3-1.b), `apps/web/src/nav/` (B3-2.a), `apps/web/src/sensors/heading.ts` (B3-3.c), `apps/web/src/phone/EchoRecorder.tsx` (B3-1.c), `useCityGlow.ts`, `CompassCard.tsx`, `Between.tsx` (B3-2.b), `SiteRow.tsx`, `SitesList.tsx` (B3-2.c), `Sheet.tsx` (B3-4).
- Tokens that exist: `--scrim`, `--surface`, `--surface-2`, `--line`, `--line-strong`, `--lamp`, `--on-lamp`, `--danger`, `--radius-s`, `--radius-m`, `--dur-fast`, `--dur-base`, `--dur-sheet`, `--ease-out`, `--ease-drawer`, `--z-topbar`, `--z-notice`, `--z-sheet`, `--tap-min`, `--tap-primary`, `--tap-round`.
- The site content files `content/sites/*.yaml` carry no landmark hints yet (`fabi/GLOSSARY.md`, Hand-offs, hour 5).
- Scripts: root `typecheck`, `build`, `test`; `apps/web` `test` is `vitest run --passWithNoTests`.
- `.claude/` is ignored by git. `ionut-sensors`, `ionut-api` and `ionut-screens` exist and were updated for this block at hour 7 (scope, documents, rules). No new subagent. Ionut restarts the session before implementing, so the three updated files are the ones the Agent tool loads.
- Devices: Ionut has an iPhone; the team's Android is a teammate's.
- Concept v6 PDF is on this machine. Its recipes for this block:
  - 7.7: "the suggested next site is the one with the lowest score: score = walking minutes to s + 6 · glow (+ ∞ if already visited today)" and "Walking minutes are estimated from distance (about 80 m per minute)".
  - 7.6: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking` and `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`, "show both on iPhone".
  - 9.7: "low-pass filter; blend with GPS course while walking".

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 3, Ionut's rows and Checkpoint 3; section 7, "The memorial site" | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Ionut's table and "Needs from others" | All |
| `ionut/GLOSSARY.md` | Whole file | All |
| `packages/shared/src/contract.ts`, `sites.ts`, `sites.json` | Whole files | B3-0, B3-1.b, B3-3.a |
| `DESIGN.md` | 7.6, 6.4, 6.16 (checkbox), 5.8 (Echo sent), section 9 item 7 | B3-1 |
| `DESIGN.md` | 7.8, 7.9, 6.9, 6.12, 6.5, 5.2 (station views, compass arrow), 5.8 (arrivals), 7.1 (the `/` rows), 7.2 (arrived by GPS), section 9 item 8 | B3-2 |
| `DESIGN.md` | 6.8, 5.2 (Sheet), section 9 items 17 and 18 | B3-4, B3-5 |
| `DESIGN.md` | 4.5, 4.6, 5.4, 5.6, 6.2, 6.7, 6.20, 7.0, 7.5, 7.16, section 8 | B3-1.c, B3-2.b, B3-2.c, B3-3.b, B3-4 |
| `apps/web/src/styles/tokens.css`, `apps/web/src/components/` | Custom property names; exports and props (read, never edit) | Screen tasks |
| `apps/web/src/api/client.ts`, `apps/web/src/session.ts` (read, never edit), `apps/web/src/colour/panes.ts`, `panes.test.ts` | Whole files | B3-1.b |
| `apps/web/src/sensors/`, `apps/web/src/geo/`, `apps/web/src/sites/` | Whole folders | B3-1.a, B3-2.a, B3-3.a, B3-3.c |
| `apps/web/src/phone/` | Whole folder | Screen tasks |
| `fabi/build_1/build_1_prompt.md` | B1-2.a.1 only (rooms and the `glow` broadcast) | B3-2.b |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Echo recorder: MediaRecorder (webm on Chrome, mp4 on Safari), 20 s cap, consent checkbox, upload | 1.5 | B3-1.a, B3-1.b, B3-1.c |
| Between sites: arrow and distance, sites list with distance and glow, next-site score from section 7.7, Google and Apple Maps links | 2.5 | B3-2.a, B3-2.b, B3-2.c |
| Section 8: no new test is listed for this lane in Build 3; the score, the wording, the links, the arrival rule, the recorder rules and the upload are tested here because a silent bug in them breaks demo steps 1:20 and 1:40 | in the hours above | B3-1.a, B3-1.b, B3-2.a |
| `DESIGN.md` section 9 item 7: Echo recorder. Smallest version: 7.6 recording, consent, sent, upload failed | 0.25 styling, from block slack | B3-1.c |
| `DESIGN.md` section 9 item 8: Between sites and Sites list, memorial states included. Smallest version: CompassCard tracking, no-compass and memorial states; Sites list as a plain view instead of a Sheet | 0.75 styling, from block slack | B3-2.b, B3-2.c |
| `DESIGN.md` section 9 item 17 (optional): Sheet component, replaces the plain views for the Sites list, archive image and "What happens to my voice" | 0.5, from block slack | B3-4.a |
| `DESIGN.md` section 9 item 18 (optional): Lantern dim, 6.12 lantern state | 0.25, from block slack | B3-5.a |
| Added by Ionut at hour 7 (plan updated in the docs commit): the phone reads the five sites from `packages/shared` | 0.1 | B3-3.a |
| Added by Ionut at hour 7: "Say why" on the caught lens opens Echo with "Why this colour?" (`DESIGN.md` 7.5; demo step 1:20) | 0.25 | B3-3.b |
| Added by Ionut at hour 7: the tap on `/` opens Between sites (`DESIGN.md` 7.1) | inside the 2.5 | B3-2.c |
| Added by Ionut at hour 7: GPS course blend for the heading (concept 9.7; deferred from Build 1) | 0.5 | B3-3.c |
| Checkpoint 3, demo step 1:20 (the echo is recorded and sent from a phone) | | B3-1.c, B3-3.b, B3-last (with Cristea) |
| Checkpoint 3, demo step 1:40 (the arrow card agrees with the direction of the poster) | | B3-2.b, B3-last (with Patrick) |

Total: 4.0 h of plan tasks, 1.0 h of required styling, 0.75 h of optional styling and 0.85 h of added work: 6.6 h in a 7 h block.

Order: B3-0 by this session. Then, on `ionut/b3-echo` in the one working tree, `ionut-sensors` does B3-1.a.1 while `ionut-api` does B3-1.b.1 in parallel; then `ionut-screens` does B3-1.c.1 and B3-3.b.1 one after another. The session verifies, commits, pushes `ionut/b3-echo` and opens its PR, so Cristea gets the seam early. Then `ionut/b3-between` from `ionut/b3-echo`: `ionut-sensors` does B3-3.a.1, B3-2.a.1 and B3-3.c.1 one after another; when B3-2.a.1 is verified, `ionut-screens` starts B3-2.b.1 (parallel with B3-3.c.1), then B3-2.c.1, B3-3.c.2, B3-4.a.1 and B3-5.a.1 one after another. If the course blend is cut, B3-3.c.1 and B3-3.c.2 both go and nothing else changes. Then B3-last. `SiteView.tsx` and `Join.tsx` are edited by several screen tasks, which is why those never run in parallel.

Conflicts: every Ionut branch adds glossary rows, and Cristea or Fabi may append to `contract.ts`. After each merge into `main`, rebase the open Ionut branch on `main`, re-run its verify, and push before Cristea merges it. Keep both sides when resolving `contract.ts`.

The seam. This session writes it in B3-0 as the first code commit of `ionut/b3-echo`, after the collision check of B3-0 (Ionut's decision, hour 7).

Appended to `packages/shared/src/contract.ts` (owner: the team; Ionut takes it to Cristea, whose `POST /echoes` reads the form and answers with `EchoAccepted`):

```ts
/**
 * POST /echoes is multipart/form-data. The file field is "audio" (audio/webm or audio/mp4).
 * These are its text fields. The phone sends only with consent, so consent is always "true".
 */
export const EchoFields = z.object({
  siteId: z.string(),
  consent: z.literal("true"),
  durationMs: z.coerce.number().int().min(1000).max(20000),
  prompt: z.string().optional(),
});
export type EchoFields = z.infer<typeof EchoFields>;

/** POST /echoes answers 201 with this. Errors: 400 (bad form), 413 (file too large), 429 with Retry-After. */
export const EchoAccepted = z.object({ id: z.string(), status: z.literal("pending") });
export type EchoAccepted = z.infer<typeof EchoAccepted>;
```

New file `apps/web/src/echo/recording.ts` (owner: Ionut's lane; shared by `ionut-sensors`, `ionut-api` and `ionut-screens`):

```ts
/** One finished echo recording, held in memory only. durationMs is 1000 to 20000. */
export type Recording = { blob: Blob; mimeType: "audio/webm" | "audio/mp4"; durationMs: number };
```

The seam with Patrick (owner: Ionut's lane; Patrick's engine and client tools call these, the screens play no sound):

```ts
// apps/web/src/nav/score.ts: the picker behind the client tool suggest_next_site
export function suggestNext(input: {
  sites: readonly PhoneSite[];
  position: LatLng | null;
  glow: Readonly<Record<string, number>> | null;
  visited: ReadonlySet<string>;
}): Suggestion;

// apps/web/src/phone/Between.tsx
type BetweenProps = {
  from: PhoneSite | null; // the site just left; null on "/"
  primer: PrimerResult;
  demo: boolean;
  remote: boolean;
  onBack?: () => void; // absent on "/"
  onTarget?: (siteId: string) => void; // Patrick: the beacon follows the chosen site
  onArrive?: (siteId: string) => void; // Patrick: the arrival chime; never called for the memorial
};

// apps/web/src/phone/EchoRecorder.tsx: opened by the client tool start_echo_recording(prompt)
type EchoRecorderProps = {
  site: PhoneSite;
  demo: boolean;
  prompt?: string;
  onBack: () => void;
  onSent?: () => void;
};
```

### 3.1 Subagents

Ionut asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Ionut, re-runs the checks, commits, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `ionut-sensors` | Recorder logic and the microphone, the sites swap, the score, wording, links and arrival rule, the course blend | opus | reused from Build 2, updated at hour 7 |
| `ionut-api` | The echo upload against the seam | opus | reused from Build 2, updated at hour 7 |
| `ionut-screens` | EchoRecorder, "Say why", CompassCard, Between, Sites list, Sheet, lantern | sonnet | reused from Build 2, updated at hour 7 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B3-1.a.1 | `ionut-sensors` | Recorder rules and the microphone, with tests | `apps/web/src/echo/recorder.ts`, `recorder.test.ts` | first, parallel with B3-1.b.1 |
| B3-1.b.1 | `ionut-api` | Echo upload with tests | `apps/web/src/echo/upload.ts`, `upload.test.ts` | parallel with B3-1.a.1 |
| B3-1.c.1 | `ionut-screens` | EchoRecorder view and its Site view wiring | `apps/web/src/phone/EchoRecorder.tsx`, `EchoRecorder.module.css`, `SiteView.tsx` | after B3-1.a.1 and B3-1.b.1 |
| B3-3.b.1 | `ionut-screens` | "Say why" on the caught lens | `apps/web/src/phone/ColourLens.tsx`, `ColourLens.module.css`, `SiteView.tsx` | after B3-1.c.1 |
| B3-3.a.1 | `ionut-sensors` | Sites from `packages/shared` | `apps/web/src/sites/sites.ts`, `sites.test.ts` | first on `ionut/b3-between` |
| B3-2.a.1 | `ionut-sensors` | Score, visited set, wording, Maps links, arrival rule, with tests | `apps/web/src/nav/score.ts`, `score.test.ts`, `visited.ts`, `format.ts`, `format.test.ts`, `maps.ts`, `maps.test.ts`, `arrival.ts`, `arrival.test.ts` | after B3-3.a.1 |
| B3-3.c.1 | `ionut-sensors` | GPS course blend with tests | `apps/web/src/geo/geofence.ts`, `apps/web/src/sensors/useGeolocation.ts`, `heading.ts`, `heading.test.ts` | after B3-2.a.1, parallel with B3-2.b.1 |
| B3-2.b.1 | `ionut-screens` | City glow hook, CompassCard, Between, "Next site" wiring, arrival | `apps/web/src/phone/useCityGlow.ts`, `CompassCard.tsx`, `CompassCard.module.css`, `Between.tsx`, `Between.module.css`, `GlowMark.tsx`, `GlowMark.module.css`, `SiteView.tsx`, `SiteView.module.css`, `Join.tsx` | after B3-2.a.1, parallel with B3-3.c.1 |
| B3-2.c.1 | `ionut-screens` | SiteRow, Sites list, the `/` entry | `apps/web/src/phone/SiteRow.tsx`, `SiteRow.module.css`, `SitesList.tsx`, `SitesList.module.css`, `Between.tsx`, `Between.module.css`, `Join.tsx` | after B3-2.b.1 |
| B3-3.c.2 | `ionut-screens` | The card uses the blended heading | `apps/web/src/phone/Between.tsx` | after B3-2.c.1 and B3-3.c.1 |
| B3-4.a.1 | `ionut-screens` | Sheet, and the four plain views moved into it | `apps/web/src/phone/Sheet.tsx`, `Sheet.module.css`, `SitesList.tsx`, `SitesList.module.css`, `Between.tsx`, `Between.module.css`, `EchoRecorder.tsx`, `EchoRecorder.module.css` | after B3-3.c.2 |
| B3-5.a.1 | `ionut-screens` | Lantern dim | `apps/web/src/phone/Between.tsx`, `Between.module.css` | after B3-4.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Ionut to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Ionut. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Ionut, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B3-0 Preflight and seam (first, this session)

- [ ] `git status`, `git branch --show-current` (expected `ionut/b3-echo`, created from `main`), `git pull origin main`. List local changes; do not touch them. This prompt, the hour 7 rows of `ionut/GLOSSARY.md` and the Build 3 rows added to `IMPLEMENTATION_PLAN.md` may still be uncommitted: commit the three together as `docs(ionut) added the Build 3 prompt and the hour 7 decisions`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck && npm run build && npm test`.
- [ ] Re-check every fact of section 1 that another lane can have changed since hour 7, and record the answers: `/health`, `POST /echoes`, `/socket.io/` and `POST /events` on `https://lampa-api-b45i.onrender.com`; whether `apps/api/src` on `main` has an echo route; the Hand-offs and Changes of `cristea/GLOSSARY.md`, `fabi/GLOSSARY.md` and `patrick/GLOSSARY.md` since hour 7; whether `content/sites/*.yaml` now carry landmark hints; whether `GlowMark`, `SiteView.tsx`, `Join.tsx` or `ColourLens.tsx` changed on `main`.
- [ ] Collision check before the seam: `git fetch origin`, then grep `packages/shared` and `apps/api/src` on `main` and on every `origin/cristea/*` branch for `EchoFields`, `EchoAccepted` and `/echoes`. If Cristea already has an echo schema or route, stop and ask Ionut before committing anything to `contract.ts`.
- [ ] Append the two schemas of the seam to `packages/shared/src/contract.ts` and create `apps/web/src/echo/recording.ts`, both exactly as written above. Commit: `feat(shared) added EchoFields and EchoAccepted to the contract`.
- [ ] Glossary: Hand-offs line for the echo seam (used by Cristea).
- Verify: `npm run typecheck && npm test`. Paste the summary lines.
- Done when: the baseline is recorded, failures that were already there are listed and not fixed silently, every re-check has its answer, and the seam commit is on `ionut/b3-echo`.

### B3-1 Echo recorder: 20 s cap, consent, upload (1.5 h)

#### B3-1.a The recorder turns a tap into a recording of 1 to 20 seconds

**B3-1.a.1** Recorder rules and the microphone. Subagent: `ionut-sensors`. Files: `apps/web/src/echo/recorder.ts`, `recorder.test.ts`.

- [ ] `recorder.ts` exports the named constants `ECHO_MAX_MS = 20000`, `ECHO_MIN_MS = 1000`, `ECHO_BITS_PER_SECOND = 64000` and `ECHO_MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4"] as const` (Ionut's decision, hour 7).
- [ ] Pure `pickMimeType(isSupported: (type: string) => boolean): string | null`: the first entry of `ECHO_MIME_TYPES` that `isSupported` accepts, `null` when none is.
- [ ] Pure `baseMimeType(type: string): "audio/webm" | "audio/mp4"`: the part before `;`, and `"audio/mp4"` for anything that does not start with `audio/webm`.
- [ ] Pure `micStatus(error: unknown): "denied" | "unavailable"`: a `NotAllowedError` or `SecurityError` name gives `"denied"`; every other error gives `"unavailable"`.
- [ ] Pure `secondsLeft(elapsedMs: number): number`: `ceil((ECHO_MAX_MS - elapsedMs) / 1000)`, kept inside 0 to 20. Pure `tooShort(durationMs: number): boolean`: under `ECHO_MIN_MS`. Pure `clampDuration(ms: number): number`: rounded to an integer and kept at most `ECHO_MAX_MS`.
- [ ] `canRecord(): boolean`: `navigator.mediaDevices?.getUserMedia` and `MediaRecorder` both exist and `pickMimeType(MediaRecorder.isTypeSupported)` is not null.
- [ ] `type MicResult = { status: "ready"; stream: MediaStream } | { status: "denied" } | { status: "unavailable" }` and `openMicrophone(): Promise<MicResult>`. It is called inside the tap on the record control and calls `navigator.mediaDevices.getUserMedia({ audio: true, video: false })` before its first `await`. `canRecord()` false gives `"unavailable"` without a call.
- [ ] `startRecording(stream: MediaStream, onDone: (recording: Recording | null) => void): { stop(): void; startedAt: number }` (`Recording` from `./recording`): a `MediaRecorder` on the stream with `mimeType: pickMimeType(...)` and `audioBitsPerSecond: ECHO_BITS_PER_SECOND`; chunks are collected in memory; a timer calls `stop()` at `ECHO_MAX_MS`; `stop()` is safe to call twice. On the recorder's `stop` event every track of the stream is stopped and `onDone` gets `{ blob, mimeType: baseMimeType(recorder.mimeType), durationMs: clampDuration(performance.now() - startedAt) }`, or `null` when `tooShort`. `startedAt` is `performance.now()` at the start.
- [ ] `recorder.test.ts`, cases by name: "webm with opus is picked when supported"; "mp4 is picked when webm is not supported"; "nothing supported gives null"; "the base type drops the codecs"; "an unknown type counts as mp4"; "a NotAllowedError maps to denied"; "a NotFoundError maps to unavailable"; "20 seconds are left at the start and 0 at 20000 ms"; "14 seconds are left at 6001 ms"; "999 ms is too short and 1000 ms is not"; "a duration over 20000 ms is clamped to 20000".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/echo && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the eleven cases pass. `openMicrophone` and `startRecording` have no tests (no DOM); the phones check them in B3-last.

#### B3-1.b The recording is sent to `POST /echoes`

**B3-1.b.1** Echo upload. Subagent: `ionut-api`. Files: `apps/web/src/echo/upload.ts`, `upload.test.ts`.

- [ ] `upload.ts` exports `echoFileName(mimeType: "audio/webm" | "audio/mp4"): string`: `"echo.webm"` or `"echo.mp4"`.
- [ ] `upload.ts` exports `toEchoForm(recording: Recording, siteId: string, prompt?: string): FormData`: the text fields pass `EchoFields.parse({ siteId, consent: "true", durationMs: String(recording.durationMs), prompt })` first; then `audio` is appended as the blob with `echoFileName(recording.mimeType)`, then `siteId`, `consent` = `"true"`, `durationMs` as text, and `prompt` only when it is given.
- [ ] `upload.ts` exports `sendEcho(form: FormData): Promise<EchoAccepted>`: `authFetch("/echoes", { method: "POST", body: form })` with no `Content-Type` header set (the browser writes the multipart boundary); a response that is not ok throws `ApiError(status)`; the JSON goes through `EchoAccepted.parse`. One request per call and no retry (Ionut's decision, hour 7).
- [ ] `upload.test.ts`, with `../session` mocked as `client.test.ts` does, cases by name: "the form carries the audio file, the site, consent true and the duration"; "the file is named echo.webm for webm and echo.mp4 for mp4"; "the prompt is sent only when given"; "a duration under 1000 ms is refused before sending"; "a 201 gives the parsed EchoAccepted"; "the request sets no Content-Type header"; "a 413 throws ApiError with its status"; "an answer that fails the schema throws"; "a failed send is not retried".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/echo && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the nine cases pass.

#### B3-1.c The visitor records, consents and sends an echo

**B3-1.c.1** EchoRecorder view and its Site view wiring. Subagent: `ionut-screens`. Files: `apps/web/src/phone/EchoRecorder.tsx`, `EchoRecorder.module.css`, `SiteView.tsx`.

- [ ] `SiteView.tsx`: `view` becomes `"site" | "lens" | "echo"` and a state `echoPrompt: string | undefined`. "Leave an echo" sets `view` to `"echo"` with no prompt. In `"echo"` it renders `<EchoRecorder site={site} demo={demo} prompt={echoPrompt} onBack={...} />`; `onBack` sets `view` to `"site"`. The button shows in remote mode too, and the echo carries the viewed site's id (Ionut's decision, hour 7). The `useSiteGlow` call and the `wake` effect stay mounted and `wake` is not sent again on return.
- [ ] `EchoRecorder.tsx` with the props of the seam. Layout per 7.6: `TopBar` (`siteName`, `onBack`, `demo`); the prompt in `--type-lead` (`prompt`, or "Leave a memory of this place. Up to 20 seconds."); `RoundControl`; the consent checkbox; the quiet Button "What happens to my voice"; the bottom buttons with the bottom safe-area padding of 4.5. The view opens with opacity 0 to 1 and `translateY(12px)` to 0 over `--dur-base` `--ease-out`; under `prefers-reduced-motion: reduce` opacity only.
- [ ] The record control is a toggle built on `onPress` alone (`onRelease` is not passed). Idle: `state="idle"`, label "Tap to record"; its tap calls `openMicrophone()` synchronously inside the tap, and on `"ready"` calls `startRecording`. Recording: `state="recording"`, `status="Recording"`, label "Recording, {n} s left" with `secondsLeft`, `progress` = elapsed / `ECHO_MAX_MS`, both refreshed by a timer of `ECHO_TICK_MS = 100`; a tap calls `stop()`; the recorder stops by itself at 20 s.
- [ ] States, with the exact texts:
  - recorded: an icon Button (48px, `play` or `pause`, `aria-label="Play echo"` or "Pause echo") with the duration beside it as "0:14" (`--type-meta`), playing the blob through one `Audio` element on an object URL that is revoked on unmount and on "Record again"; bottom "Send echo" (primary L) and "Record again" (secondary L; its tap calls `openMicrophone()` inside the tap and starts a new recording). Fourth cut of the block: the preview button goes and the duration stays.
  - consent unchecked: "Send echo" disabled with the line "Tick the box to send." under it.
  - uploading: "Send echo" in its `loading` state with the label "Sending"; the recording stays in memory.
  - success: `navigator.vibrate?.([20])` (5.8), `onSent?.()`, and the screen becomes "Sent. A curator listens to it before it plays here." with "Back to {Site}" (primary L) only.
  - upload failed (any thrown error): `<Notice variant="error">Your echo did not send. It is still here.</Notice>` and "Send echo" becomes "Try again"; the recording is never discarded on failure and nothing retries by itself (Ionut's decision, hour 7).
  - microphone denied (`status: "denied"`): `RoundControl` `state="disabled"` with the label "Microphone is off"; the text "LAMPA needs the microphone to record an echo. Allow the microphone in your browser settings, then try again."; Buttons "Try again" (secondary; its tap calls `openMicrophone()` again) and "Back to {Site}" (Ionut's decision, hour 7).
  - cannot record (`canRecord()` false or `status: "unavailable"`): `RoundControl` `state="disabled"` with the label "Microphone is off"; "This browser cannot record an echo." and "Back to {Site}" (Ionut's decision, hour 7).
  - under 1 second recorded (`onDone(null)`): back to idle with the line "That was too short to send. Record again."
- [ ] The consent checkbox follows 6.16 and is built here (no Field component exists): a native `<input type="checkbox">` inside a `<label>` row of at least 48px; the 24px box with a 1.5px `--line-strong` border and radius 6px; checked fill `--lamp` with `<Icon name="check" />` in `--on-lamp`; label "Play my voice here in public after a curator listens to it." in `--type-body`. It starts unticked on every opening and after "Record again" it keeps its value.
- [ ] "What happens to my voice" is a quiet Button with `aria-expanded` that shows and hides this paragraph under it (the plain view until B3-4): "Your recording is stored on our server and transcribed. A curator listens to it. If approved, visitors here hear it in your voice. If rejected, it never plays. We do not ask for your name."
- [ ] Leaving with an unsent recording: the top-bar back and "Back to {Site}" do not leave at once; the bottom buttons are replaced by "Discard this echo?" with "Discard" (danger M; leaves) and "Keep recording" (secondary M; returns to the recorded state), the plain view until B3-4. The browser's back gesture is not intercepted (Ionut's decision, hour 7). With no recording, or after a success, both controls leave at once.
- [ ] The send is `sendEcho(toEchoForm(recording, site.id, prompt))`.
- [ ] A page that goes to the background while recording stops the recording as a tap on stop would: the visitor comes back to the recorded state, or to the too-short line under 1 s (Ionut's decision, hour 7).
- [ ] Unmount stops a running recording, stops the stream's tracks, pauses the preview and revokes the object URL.
- [ ] The memorial never reaches this view: `MemorialStub` is untouched. Demo mode changes nothing but the badge: the microphone is real.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/phone --include=*.css | wc -l` → `0`. Paste the summary lines. Then, on the dev server at 390×844 in desktop Chromium with `navigator.mediaDevices.getUserMedia` stubbed to return the stream of an `OscillatorNode` connected to a `MediaStreamAudioDestinationNode` (as Build 2 stubbed the camera with a canvas stream) and `/session/anon` and `/echoes` mocked: `/s/unirii` → tap → "Leave an echo" → record 3 s → stop → the recorded state; "Send echo" is disabled until the box is ticked; a 201 shows the sent screen; a 500 shows the Notice and "Try again", and a second tap sends the same recording; the request's form fields copied from the network panel; a `NotAllowedError` shows the denied state. Report which states you saw and which you did not.
- Done when: the verify passes and one `POST /echoes` leaves with the fields `audio`, `siteId`, `consent`, `durationMs`.

### B3-2 Between sites: arrow, distance, sites list, next-site score, Maps links (2.5 h)

#### B3-2.a The score, the wording, the links and the arrival rule are pure functions

**B3-2.a.1** Score, visited set, wording, Maps links, arrival rule. Subagent: `ionut-sensors`. Files: `apps/web/src/nav/score.ts`, `score.test.ts`, `visited.ts`, `format.ts`, `format.test.ts`, `maps.ts`, `maps.test.ts`, `arrival.ts`, `arrival.test.ts`.

- [ ] `visited.ts`: a module-level `Set<string>`; exports `markVisited(siteId: string): void`, `visitedSites(): ReadonlySet<string>` (a copy) and `resetVisited(): void` for tests. No storage (Ionut's decision, hour 7).
- [ ] `score.ts` exports `WALK_M_PER_MIN = 80`, `GLOW_WEIGHT_MIN = 6`, the types below and `suggestNext` with the signature of the seam:

  ```ts
  export type Ranked = {
    site: PhoneSite;
    distanceM: number | null;
    score: number;
    visited: boolean;
    tag: "nearest" | "going dark" | null;
  };
  export type Suggestion = { ranked: Ranked[]; suggestion: Ranked | null; allVisited: boolean };
  ```

  The rules (concept 7.7 and Ionut's decisions, hour 7):
  - `distanceM` is `haversineM(position, site)`, `null` with no position. Glow is `glow[site.id]`, counted as 0 when `glow` is null, when the site has no entry, and always for the memorial.
  - `score` = `distanceM / WALK_M_PER_MIN + GLOW_WEIGHT_MIN × glow`; with no position, `GLOW_WEIGHT_MIN × glow` alone.
  - `ranked` holds every site: the sites not visited first, by ascending score; then the visited ones, by ascending score. A tie keeps the order of `sites`.
  - `suggestion` is the first entry not visited. When every site is visited, `allVisited` is true and the suggestion is the site with the lowest glow (a tie goes to the lower `distanceM`, then to the order of `sites`).
  - Only the suggestion carries a `tag`; every other entry has `null`. The tag is `"nearest"` when the suggestion is the memorial, or when a position exists and no other site not visited has a smaller `distanceM`. Otherwise it is `"going dark"`. With `allVisited` it is `"going dark"`, and `"nearest"` for the memorial.
- [ ] `format.ts`, pure, exact outputs:
  - `formatDistance(m: number): string`: under 995 m, rounded to the nearest 10 as "220 m"; from 995 m, one decimal as "1.2 km".
  - `formatWeakDistance(m: number): string`: rounded to the nearest 100 with a floor of 100, as "about 300 m".
  - `walkMinutes(m: number): number`: `ceil(m / 80)` with a floor of 1. `metaLine(m: number): string`: "220 m, about 3 min walk".
  - `compassWord(bearing: number): string`: eight 45-degree sectors centred on north, north-east, east, south-east, south, south-west, west, north-west, as "To the north-east".
  - `relativeAngle(bearing: number, heading: number): number`: `((bearing - heading + 540) mod 360) - 180`, so -180 to under 180, 0 straight ahead, negative to the left.
  - `spokenDirection(rel: number): string` (Ionut's decision, hour 7): absolute value up to 15 gives "ahead"; over 15 and up to 60 gives "ahead and slightly left" or "ahead and slightly right"; over 60 and up to 120 gives "to your left" or "to your right"; over 120 gives "behind you".
  - `spokenLine(name: string, m: number, direction: string): string`: "Muzeul MX Corneliu Miklosi, 220 metres, ahead and slightly left"; from 995 m "1.2 kilometres". With no compass the caller passes `compassWord(bearing)` in lower case ("to the north-east").
  - `unwrapAngle(previous: number, next: number): number`: the angle equal to `next` mod 360 that is nearest to `previous`, so 359 to 1 turns 2 degrees (5.2).
- [ ] `maps.ts`: `googleMapsUrl(site: LatLng): string` and `appleMapsUrl(site: LatLng): string`, exactly the two URLs of concept 7.6 quoted in section 1; `isIPhone(userAgent: string): boolean`: true when it contains `iPhone`, `iPad` or `iPod`.
- [ ] `arrival.ts`: `hasArrived(fence: FenceState, targetId: string, fromId: string | null): boolean`: `fence.insideId === targetId && targetId !== fromId` (Ionut's decision, hour 7: the geofence enters the chosen site, never the site just left).
- [ ] `score.test.ts`, cases by name: "the nearer of two dark sites is suggested as nearest"; "a fully lit site counts as six minutes further"; "a dark site 400 m away beats a lit site 100 m away and is tagged going dark"; "a visited site is never the suggestion while another is not visited"; "visited sites are listed after the others"; "unknown glow counts as 0"; "the memorial's glow counts as 0 and its tag is nearest"; "with no position the score is six times the glow and the tag is going dark"; "all visited suggests the darkest site with allVisited true"; "a tie keeps the order of the sites"; "only the suggestion has a tag".
- [ ] `format.test.ts`, cases by name: "223 m reads 220 m"; "994 m reads 990 m and 995 m reads 1.0 km"; "1234 m reads 1.2 km"; "a weak 340 m reads about 300 m and a weak 20 m reads about 100 m"; "220 m is about 3 min walk and 10 m is about 1 min walk"; "bearing 45 reads To the north-east and bearing 350 reads To the north"; "bearing 10 at heading 350 is 20 degrees to the right"; "the relative angle wraps across north"; "15 degrees is ahead and 16 is ahead and slightly right"; "minus 90 is to your left and 121 is behind you"; "the spoken line joins name, metres and direction"; "unwrapping 359 to 1 gives 361".
- [ ] `maps.test.ts`: "the Google link asks for walking directions to lat,lng"; "the Apple link asks for walking directions to lat,lng"; "an iPhone user agent is an iPhone and an Android one is not". `arrival.test.ts`: "entering the chosen site arrives"; "being inside another site does not arrive"; "the site just left never arrives"; "no site just left still arrives".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/nav && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the thirty cases pass.

#### B3-2.b The compass card points at the chosen site and the phone notices arrival

**B3-2.b.1** City glow hook, CompassCard, Between, "Next site" wiring, arrival. Subagent: `ionut-screens`. Files: `apps/web/src/phone/useCityGlow.ts`, `CompassCard.tsx`, `CompassCard.module.css`, `Between.tsx`, `Between.module.css`, `GlowMark.tsx`, `GlowMark.module.css`, `SiteView.tsx`, `SiteView.module.css`, `Join.tsx`.

- [ ] `useCityGlow(): { glow: Record<string, number> | null; connected: boolean }` (Ionut's decision, hour 7): one Socket.IO connection to `${API_URL}/live` with `query: { room: "city" }`, open only while the hook is mounted; each `SocketMessage.enum.glow` message goes through `GlowMessage.safeParse` and replaces the whole map; `null` until the first message; the last map is kept on disconnect. `useSiteGlow` is not changed.
- [ ] `GlowMark.tsx` gets `size?: "s" | "m"` (default `"m"`): S per 6.5 (core 12px, halo 24px, word in `--type-meta`).
- [ ] `Between.tsx` with the props of the seam. It mounts `useGeolocation(injected)`, `useCompass(...)`, `useGeofence(position, from?.id)` and `useCityGlow()`, with `injected = readDemo(location.search, from?.id)` when the `demo` prop is true, else `null`. In demo mode the position is the injected one, and the compass is the phone's real one: `useCompass(injected)` only when the URL carries `heading=`, else `useCompass(null)` (Ionut's decision, hour 7: the arrow must turn with the judge's phone in demo step 1:40). The demo primer asks for no motion permission, so `SiteView`'s "Next site" tap calls `requestCompass()` inside the tap when `demo` is true and the URL has no `heading=`; on an iPhone the real motion prompt appears there. On `/` in demo mode the injected position sits on the `at` site (`mx` when absent), so Between sites arrives there at once, as `/` did before this block. It keeps the last fix whose accuracy is at most `MAX_ACCURACY_M` as the position used for distance, bearing and the score. Its state is `targetId: string | null`: null follows `suggestNext({ sites: SITES, position, glow, visited: visitedSites() }).suggestion`; a site picked in the list (B3-2.c.1) sets it. `onTarget?.(id)` fires whenever the site shown changes.
- [ ] Layout per 7.8: `TopBar` (`siteName` = `from.name`, `onBack`, `demo`; on `/`, where `from` is null, a top row with the `DemoBadge` only); the `CompassCard` centred; bottom "Sites" (secondary L; no action until B3-2.c.1) and "Open in Maps" (secondary L) with the bottom safe-area padding of 4.5. The view opens with opacity 0 to 1 and `translateY(12px)` to 0 over `--dur-base` `--ease-out`; under `prefers-reduced-motion: reduce` opacity only.
- [ ] "Open in Maps": when `isIPhone(navigator.userAgent)`, the tap shows two secondary L Buttons, "Apple Maps" and "Google Maps", in place of the bottom buttons, with an icon Button `close` (`aria-label="Close"`) that brings the bottom buttons back (the plain view until B3-4); elsewhere it opens `googleMapsUrl(target)` directly. Each link opens with `window.open(url, "_blank", "noopener")`.
- [ ] `CompassCard.tsx` (6.12), props `{ site: PhoneSite; distanceM: number | null; bearing: number | null; heading: number | null; weak: boolean; locationOff: boolean; glow: number | null; connected: boolean; allVisited: boolean }`. Top to bottom: the arrow (120px, `--lamp`, an inline SVG drawn in this file, pointing up at 0 degrees), the distance (`--type-numeral` `--text`), the site name (`--type-title`), `GlowMark` M, the extra line (`--type-body` `--text-2`). No landmark hint line in this block (Ionut's decision, hour 7).
  - tracking: the arrow's `transform: rotate(...)` is written directly to the element through a ref on every update, with `unwrapAngle(previous, relativeAngle(bearing, heading))` and no CSS transition (5.2); distance `formatDistance`; no extra line.
  - no compass (`heading` null): arrow hidden; `formatDistance`; extra line `compassWord(bearing)`.
  - weak position (`weak`: the newest fix has accuracy over 60 m): the last arrow at 40% opacity; `formatWeakDistance` of the last good distance; "Finding your position".
  - no position (`locationOff`: the geolocation status is `"denied"` or `"unavailable"`): arrow hidden; "Distance unknown"; "Location is off. Use Open in Maps or pick from the list."
  - no usable fix yet (`distanceM` null and not `locationOff`: the phone is still waiting for its first fix, or has only had fixes with accuracy over 60 m): arrow hidden; "Distance unknown"; "Finding your position" (Ionut's decision, hour 7).
  - memorial chosen: the word "Memorial" (`--type-label` `--text-2`) in place of the GlowMark; extra line "A place of remembrance. Listening and candles only."; the arrow and the distance as in the other states.
  - `allVisited` and not the memorial: extra line "You have woken every site today. This one is fading."
  - offline: the GlowMark shows "(last known)" through its `connected` prop.
  - The region has `aria-label="Direction to {Site}"` and a visually hidden text, refreshed at most every `SPOKEN_INTERVAL_MS = 10000`, of `spokenLine(...)` with `spokenDirection(...)`, or with `compassWord(bearing)` in lower case when there is no compass.
- [ ] Arrival (Ionut's decision, hour 7): when `hasArrived(fence, targetId, from?.id ?? null)` turns true, once: for a site that is not the memorial, `track("arrived", id)`, `navigator.vibrate?.([30, 60, 30])` and `onArrive?.(id)`; for the memorial none of the three, the event included. Then `navigate("/s/" + id + location.search, { state: { ...primer, arrived: true } })`. Demo mode follows the same rule on the injected position. The card's "arriving" state of 6.12 is not drawn: the Site view opens in the same moment and carries the "waking" line (Ionut's decision, hour 7; record it as a Changes line against 6.12).
- [ ] Returning from another app (7.8): when the document becomes visible and `getAudioContext().state` is not `"running"`, show a `<Notice variant="info" icon="headphones">` whose body is a quiet Button "Tap to listen again" calling `unlockAudio()`, until audio runs (the same shape as the "Tap to listen" Notice in `Join.tsx`).
- [ ] `SiteView.tsx`: `view` gains `"between"`; "Next site" sets it and renders `<Between from={site} primer={primer} demo={demo} remote={remote} onBack={...} />`. `SiteView` gets the new props `primer: PrimerResult` and `arrived: boolean`. With `arrived` it shows the line "{Site} is waking." under the name for `ARRIVED_LINE_MS = 4000` (7.2). Its `wake` effect also calls `markVisited(site.id)`.
- [ ] `Join.tsx`: passes `primer={result}` and `arrived` (true when the router state has `arrived: true` and `primedThisLoad` is set) to `SiteView`, and renders it with `key={site.id}` so an arrival at another site starts from the `"site"` view. The memorial branch calls `markVisited(site.id)` when it first shows `MemorialStub`; `MemorialStub` itself is untouched and shows no "waking" line.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/phone --include=*.css | wc -l` → `0`. Paste the summary lines. Then, on the dev server at 390×844: `/s/unirii?demo=1&heading=0` → tap → "Next site": the card names the suggested site with its distance and the arrow at its bearing; `&heading=90` turns the arrow by 90 degrees the short way. Arrival, with no `demo` and the browser's geolocation overridden (Playwright `context.setGeolocation`, permission granted): position on Piața Unirii's coordinates, `/s/unirii` → tap → "Next site"; then the position moved to the coordinates of the site the card names: its view opens with "{Site} is waking." for 4 s and one `arrived` event is in the `POST /events` body. "Open in Maps" opens the Google link; with an iPhone user agent it shows both buttons. Report which states you saw and which you did not.
- Done when: the verify passes, the arrow follows the injected heading, and an arrival opens the Site view of the chosen site.

#### B3-2.c The visitor picks any site from the list, and `/` starts here

**B3-2.c.1** SiteRow, Sites list, the `/` entry. Subagent: `ionut-screens`. Files: `apps/web/src/phone/SiteRow.tsx`, `SiteRow.module.css`, `SitesList.tsx`, `SitesList.module.css`, `Between.tsx`, `Between.module.css`, `Join.tsx`.

- [ ] `SiteRow.tsx` (6.9), props `{ entry: Ranked; glow: number | null; connected: boolean; here: boolean; remote: boolean; onPick: () => void }`. One `<button>` row, min-height 64px, padding `--space-m`, a 1px `--line` divider between rows, pressed fill `--surface-2`. Left to right: `GlowMark` S (the word "Memorial" in `--type-label` `--text-2` for the memorial); the name (`--type-body` 600 `--text`) over the meta line (`--type-meta` `--text-2`): `metaLine(distanceM)`, "You are here" when `here`, "Distance unknown" with no distance, and no meta line in remote mode; then the tag in `--type-meta` `--lamp`: "Suggested: nearest" or "Suggested: going dark" from `entry.tag`, and "Going dark" when the list's `allVisited` is true.
- [ ] `SitesList.tsx` (7.9), a plain view until B3-4 (section 9 item 8): a top row with the title "Sites" (`--type-title`) and an icon Button `close` with `aria-label="Close"` on the right (the Sheet's own header in 6.8), and a `SiteRow` for all five sites in the order of `ranked`. In remote mode the rows are sorted by name with no distances and no tag. The loading and error states of 7.9 are not built: the five sites are built into the web app. Record that as a Changes line.
- [ ] `Between.tsx`: "Sites" opens the list in place of the card. A row's tap closes the list and sets `targetId` to that site; the tap on the row of `from` calls `onBack`. In remote mode a row's tap calls `navigate("/s/" + id + location.search, { state: primer })`.
- [ ] `Join.tsx`, the `/` entry (Ionut's decision, hour 7; `DESIGN.md` 7.1): after the tap on `/`, `Join` no longer navigates to `/s/mx`; it keeps the primer result and renders `<Between from={null} primer={result} demo={demo} remote={remote} />`. With `/?mode=remote`, or when the primer's `location` is `"denied"`, `Between` opens on the Sites list in remote mode, and the location-denied Notice of 7.1 shows above it: "Location is off. This site still works. To walk to the next one, use the list."
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/phone --include=*.css | wc -l` → `0`. Paste the summary lines. Then, on the dev server at 390×844, with no `demo` and the browser's geolocation overridden to a point between the sites (45.7560, 21.2300): `/` → "Wake the city" → Between sites with the suggested site; "Sites" lists five rows, the suggestion first with its tag, the Cathedral with "Memorial"; a row's tap switches the card to that site; `/?mode=remote` → tap → the list sorted by name with no distances, and a row opens that site's view; from `/s/unirii`, the row "Piața Unirii" reads "You are here" and returns to the Site view. Report which states you saw and which you did not.
- Done when: the verify passes and both entry points reach the list and the card.

### B3-3 Work added by Ionut at hour 7 (0.85 h)

#### B3-3.a The phone reads the five sites from `packages/shared`

**B3-3.a.1** Sites from `packages/shared`. Subagent: `ionut-sensors`. Files: `apps/web/src/sites/sites.ts`, `sites.test.ts`.

- [ ] `sites.ts`: `PhoneSite` becomes `Site & { lamp: boolean }` with `Site` from `@lampa/shared`; `SITES` is `sites` from `@lampa/shared` mapped with `lamp: !site.is_memorial`; `findSite` is unchanged; the shortcut comment is removed.
- [ ] `sites.test.ts`, cases by name: "there are five sites with the ids mx, unirii, victoriei, bastion, cathedral"; "the Cathedral is the only memorial and the only site without a lamp"; "findSite of an unknown id is undefined".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the three cases pass and every test that was green before is still green.

#### B3-3.b "Say why" opens Echo from the caught lens

**B3-3.b.1** "Say why" on the caught lens. Subagent: `ionut-screens`. Files: `apps/web/src/phone/ColourLens.tsx`, `ColourLens.module.css`, `SiteView.tsx`.

- [ ] `ColourLens.tsx` gets the optional prop `onSayWhy?: () => void`. Once the pane's status is `sent`, a secondary L Button "Say why" shows above "Back to {Site}" (7.5). It does not show in any other status, because leaving the lens stops a pane that is still waiting to send (Ionut's decision, hour 7; record it as a Changes line against 7.5).
- [ ] `SiteView.tsx` passes `onSayWhy`: it sets `echoPrompt` to "Why this colour?" and `view` to `"echo"`. The echo's "Back to {Site}" returns to the Site view.
- [ ] "Keep my colours" stays hidden (Cristea's sign-in row has not landed).
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then the hex grep of B3-1.c.1 → `0`. Then, on the dev server with the canvas camera and `/panes` mocked: after a 201, "Say why" opens the recorder with the prompt "Why this colour?"; after a 503 the button is absent. Report what you saw.
- Done when: the verify passes and the prompt shows on the recorder.

#### B3-3.c The heading follows the walking direction when the visitor walks

**B3-3.c.1** GPS course blend. Subagent: `ionut-sensors`. Files: `apps/web/src/geo/geofence.ts`, `apps/web/src/sensors/useGeolocation.ts`, `heading.ts`, `heading.test.ts`.

- [ ] `geofence.ts`: `Fix` becomes `LatLng & { accuracy: number; course?: number | null; speed?: number | null }`. Nothing else in the file changes.
- [ ] `useGeolocation.ts`: each real fix also carries `course` from `coords.heading` and `speed` from `coords.speed`, each `null` when the browser gives `null` or `NaN`. The demo fix carries neither.
- [ ] `heading.ts` exports `COURSE_MIN_SPEED_MPS = 1.0`, `COURSE_MAX_ACCURACY_M = 30`, `COURSE_WEIGHT = 0.5` and the pure `blendHeading(compass: number | null, fix: Fix | null): number | null` (Ionut's decision, hour 7): the course counts when the fix has a `course`, a `speed` of at least 1.0 and an `accuracy` of at most 30. When it counts and a compass heading exists, the result is `smoothHeading(compass, course, COURSE_WEIGHT)`, the compass moved half-way toward the course by the short way round. When it counts and there is no compass, the result is the course. Otherwise the result is the compass heading, `null` included.
- [ ] `heading.test.ts`, cases by name: "standing still keeps the compass"; "walking moves the compass half-way to the course"; "the blend crosses north by the short way"; "a speed of exactly 1.0 counts and 0.9 does not"; "an accuracy of 31 m keeps the compass"; "no compass and a course gives the course"; "no compass and no course gives null"; "a fix without a course keeps the compass".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/sensors src/geo && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the eight cases pass and the geo and sensor cases that were green before are still green.

**B3-3.c.2** The card uses the blended heading. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Between.tsx`.

- [ ] The heading given to the `CompassCard` becomes `blendHeading(compass.heading, position)` from `../sensors/heading`, with `position` the newest fix. Nothing else changes.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary lines.
- Done when: the verify passes. The phones check the walking behaviour in B3-last.

### B3-4 Sheet component (0.5 h, optional, `DESIGN.md` section 9 item 17)

#### B3-4.a The four plain views open in a Sheet

**B3-4.a.1** Sheet, and the four plain views moved into it. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Sheet.tsx`, `Sheet.module.css`, `SitesList.tsx`, `SitesList.module.css`, `Between.tsx`, `Between.module.css`, `EchoRecorder.tsx`, `EchoRecorder.module.css`.

- [ ] `Sheet.tsx` (6.8), props `{ title: string; onClose: () => void; children: ReactNode }`: `--surface`, top corners `--radius-m`, a 4 × 36px `--line-strong` handle (visual only), the title in `--type-title`, an icon Button `close` top-right with `aria-label="Close"`, scrolling content with `overscroll-behavior: contain`, bottom padding with the safe area, height by content up to 85dvh, a `--scrim` backdrop, `--z-sheet`. It closes by the close button, a backdrop tap, Escape and the phone's back gesture (opening pushes a history entry; a `popstate` closes it; closing any other way calls `history.back()` once). Focus moves to the title on open, is trapped inside while open, and returns to the opener on close. Motion per 5.2: `translateY(100%)` to 0 over `--dur-sheet` `--ease-drawer`, close over `--dur-base` `--ease-out`, the backdrop's opacity over the same durations; under `prefers-reduced-motion: reduce` opacity only.
- [ ] The Sites list opens in a Sheet titled "Sites" over the card; its own top row goes.
- [ ] The iPhone Maps buttons open in a Sheet titled "Open in Maps".
- [ ] "What happens to my voice" opens a Sheet with that title and the paragraph.
- [ ] "Discard this echo?" opens a Sheet with that title and its two buttons; closing it keeps the recording.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then the hex grep → `0`. Then, on the dev server at 390×844: each of the four Sheets opens and closes by the button, the backdrop, Escape and the browser's back, and focus returns to its opener; Tab stays inside an open Sheet. Report what you saw.
- Done when: the verify passes and the four plain views are gone.

### B3-5 Lantern dim (0.25 h, optional, `DESIGN.md` section 9 item 18)

#### B3-5.a The compass card dims after ten seconds without a touch

**B3-5.a.1** Lantern dim. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Between.tsx`, `Between.module.css`.

- [ ] `LANTERN_MS = 10000`: after that long with no `pointerdown` or `keydown` on the page, the Between view's content goes to opacity 0.6 (6.12); any tap or key restores 1.0 over `--dur-fast`, and that first tap does nothing else. An open Sheet or the Sites list holds the timer off.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then the hex grep → `0`. On the dev server: the view dims after 10 s and a tap restores it without pressing a button. Report what you saw.
- Done when: the verify passes.

### B3-last Integrate and hand over (last, this session)

- [ ] `ionut/b3-between` rebased on `main` (after `ionut/b3-echo` is merged, or on `ionut/b3-echo` if it is not), then `npm run typecheck && npm run build && npm test` green on it.
- [ ] Push each branch and open its PR, in this order: `ionut/b3-echo`, `ionut/b3-between`. Each PR lists what was verified and what is waiting for a phone, for Cristea or for Patrick. Cristea merges.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs: the echo seam (Cristea); `EchoRecorder` with `prompt` and how `start_echo_recording` opens it (Patrick); `Between` with `onTarget` and `onArrive`, `suggestNext`, `blendHeading`, `useCityGlow` (Patrick); the `arrived` event the phone now sends and the `city` room it joins (Fabi); `Sheet`, `SiteRow`, `GlowMark` size S (Cristea). Blocked: `POST /echoes` (Cristea); the landmark hints (content owners); the beacon, chime and whispers (Patrick).
- [ ] Report written to `ionut/build_3/build_3_report.md`, in the shape of section 4.
- [ ] Ionut's checks on real phones, listed and not claimed.
  - iPhone, deployed build (Ionut): `/s/unirii` → tap → "Leave an echo": the microphone prompt appears in the tap on the record control; the Ring fills and the seconds count down; a tap stops; the preview plays; "Send echo" stays disabled until the box is ticked; the uploaded file's type is the one the recorder picked on that phone (`audio/mp4`, or `audio/webm` where Safari supports it); a denied microphone shows its text and "Try again"; leaving the app while recording comes back to the recorded state. After a catch, "Say why" opens the recorder with "Why this colour?".
  - iPhone, outdoors (Ionut): "Next site": the arrow points at the site while the phone turns; the distance falls while walking toward it; "Open in Maps" shows "Apple Maps" and "Google Maps", and both open walking directions; coming back shows "Tap to listen again" when the sound stopped; entering the site opens its view with "{Site} is waking."
  - Android, deployed build (a teammate): the same steps; the upload carries an `audio/webm` file; one short vibration on "Sent" and the `[30, 60, 30]` pattern on arrival; "Open in Maps" opens Google Maps directly.
  - With Cristea, once `POST /echoes` is on `main` (demo step 1:20): the echo appears in the curator queue and plays there, from both phones.
  - With Patrick (demo step 1:40), on the iPhone with `?demo=1` and no `heading=`: "Next site" shows the motion prompt once, then the arrow turns as the phone turns, and the arrow card and the beacon agree on the direction of the Piața Unirii poster.
- Done when: every box is ticked or listed as Ionut's, and the report is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `B3-n.x.y done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: `POST /echoes` (Cristea); the landmark hints (content owners); the beacon, the chime and the whispers through `onTarget` and `onArrive` (Patrick); still open from earlier blocks: `POST /events`, `/live`, `POST /panes` and the `pane` message (Fabi), `bin` on `PaneMessage` (Cristea), the sound bed and the lens sounds (Patrick).
- **Not finished at hour 32:** each ID, what is left, and its place in Ionut's cut order for this block.
- **Phone checks for Ionut:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 3

- "Leave an echo" on a persona site opens the recorder; the microphone request sits inside the tap on the record control; a recording stops by a tap or at 20 s, and one under 1 s is refused.
- "Send echo" is disabled until the consent box is ticked; one `POST /echoes` follows with the multipart fields of the seam; a failure keeps the recording and offers "Try again"; nothing is stored on the phone.
- "Say why" on a sent catch opens the recorder with "Why this colour?".
- "Next site" and the tap on `/` open Between sites: the arrow shows the bearing to the chosen site minus the heading, the distance follows 6.12, and the no-compass, weak, no-position and memorial states read as written in B3-2.b.1.
- The suggestion is the lowest `minutes + 6 × glow` among the sites not visited since the page loaded; the Sites list shows all five in that order with distance, glow and the tag; a row's tap switches the card.
- "Open in Maps" opens Google walking directions, and on an iPhone offers Apple Maps as well.
- Entering the chosen site's geofence opens its view, sends `arrived` and vibrates on Android; the memorial opens with neither.
- `npm test` is green with the recorder, upload, score, wording, links, arrival, sites and heading cases.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `ionut/GLOSSARY.md` matches the state of the branch.

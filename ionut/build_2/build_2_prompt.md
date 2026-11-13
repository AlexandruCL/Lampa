# Prompt: Ionut's Build 2, Colours and Talk (Ionut, Phone experience, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` and `DESIGN.md` at hour 5 (2026-11-13 18:31 +0200), with Ionut's answers of hours 4 and 5. Implementation not started.**

You are implementing Ionut's part of Build 2 (hours 12 to 18) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *the two stations the demo is built around.*

Checkpoint this block must pass (Checkpoint 2, the line this lane affects):

*1. A colour caught on a phone appears as a pane on `/screen` within one second.*

## 0. Ground rules

- **Ionut takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Ionut, with your recommendation. Nothing uses the recommendation until Ionut answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 18.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Ionut: carrying on, cutting or moving it is their decision. Ionut's cut order for this block (hour 4): first the pane flight becomes a fade; then the window-complete flare becomes the line only; then the 5 s privacy line goes; then the TopBar becomes a plain back button. Never cut: the bin picker and its test, the 2 s hold, `POST /panes`, the name under the swatch.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Ionut, who takes it to the team. The pane seam of section 3 is the only change in this block. `POST /panes` has not landed: code against the seam.
- The server sets event weights. The client never sends one. The phone sends no `colour` event: `POST /panes` is the only request of a catch, and Fabi's endpoint records the event (Ionut's decision, hour 4; Ionut takes it to Fabi).
- No library beyond those already in `apps/web/package.json`. Approved in this block: none. No jsdom, no Testing Library: tests are pure functions in the `node` environment.
- No storage: nothing in this block writes `localStorage`, `sessionStorage` or IndexedDB (Ionut's decision, hour 4).
- Camera frames never leave the phone. Only the `PaneIn` fields are sent. The microphone is never requested.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. Cristea merges every PR, with a merge commit (Ionut has no Vercel access, so Ionut's PRs show a failing Vercel check that is expected). Branches: `ionut/b2-colour` (this prompt and the glossary as a docs commit, the seam, B2-1.a, B2-2.a, B2-2.b, B2-3) and `ionut/b2-lens` (B2-1.b, B2-1.c, B2-2.c), which starts from `ionut/b2-colour`. One PR per branch, opened as soon as its verify commands pass. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. The lens is never offered there, and `MemorialStub` stays untouched.
- Screens follow `DESIGN.md` and the tokens and base components in `apps/web/src/styles/tokens.css` and `apps/web/src/components`. Do not add a colour, font or spacing value that is not a token. Do not edit Cristea's files (`apps/web/src/components/**`, `apps/web/src/screen/**`, `apps/web/src/session.ts`, `apps/web/src/styles/**`). Caught colours are content: they fill only the lens disk, the swatch and the window panes.
- UI copy is English only in this block, exactly as `DESIGN.md` 6.11, 7.0 and 7.5 write it. Romanian names ship as data and are not shown (Ionut's decision, hour 4). The dictionary is Build 4.
- Write in `ionut/` only. Other members' folders are read-only.
- **Keep `ionut/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Ionut a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- `npm ci` is refused by this session's auto mode. Where a step needs it, ask Ionut to run `! npm ci`.

## 1. Current state (checked at hour 4, 2026-11-13 18:03 +0200)

- Build 1 is closed for Ionut: every B1 ID is Done, PRs #6 to #9, #13 and #14 are merged, `main` is at `9649104`, clean. The iPhone, Android and daylight checks passed. Nothing was cut or carried over.
- Still open from Build 1, both waiting on other lanes (glossary, Blocked): the `wake` row with Fabi, the sound bed with Patrick.
- Deployed: `https://lampa-timisoara.vercel.app` → 200. `https://lampa-api-b45i.onrender.com/health` → `{"ok":true}`. `POST /events` → 404, `POST /panes` → 404, `/socket.io/` → 404. Fabi and Patrick have no branch on origin and no glossary. No PR is open.
- "Needs from others" for this block: `POST /panes` from Fabi by hour 15: not landed. The contract had no pane schema; B2-0 adds the seam.
- Exists and is built on: `apps/web/src/phone/SiteView.tsx` ("Catch a colour" Button with no action; `EMPTY_PANES` in the window); `RoseWindow.tsx` (`name`, `size: "l" | "s"`, `filled`, `glow?`); `useSiteGlow.ts` (one Socket.IO connection to `/live`, room `site:<id>`, listens for `glow`); `DemoBadge.tsx`; `apps/web/src/api/client.ts` (`api(path, { method, body, schema })`, `ApiError` with `status`); `apps/web/src/events/queue.ts` (the retry rule this block mirrors); `apps/web/src/sensors/primer.ts`; components `Button`, `Notice`, `Ring` (`progress`, `size` in px, `filling`, `holdMs`, `label`; progress stroke `--text`), `Icon`.
- Does not exist yet: `apps/web/src/colour/` (B2-0, B2-1.a, B2-2.a, B2-2.b, B2-3), `apps/web/src/sensors/camera.ts`, `useLensReading.ts`, `useRotationRate.ts` (B2-1.b), `apps/web/src/phone/ColourLens.tsx`, `TopBar.tsx`, `panes.ts` (B2-1.c, B2-2.c).
- Tokens that exist: `--scrim`, `--surface-2`, `--line-strong`, `--dur-fast`, `--dur-base`, `--dur-flight` (700ms), `--ease-out`, `--ease-in-out`, `--z-topbar`, `--z-notice`, `--z-demo`. `design/css/components.css` lines 347 to 410 hold the reference lens layout (`.lens-view`); it draws the lens ring in `--lamp`, which this block does not follow (Ionut's decision, hour 4).
- Scripts: root `typecheck`, `build`, `test`; `apps/web` `test` is `vitest run --passWithNoTests`. `apps/web/src/main.tsx` renders without `StrictMode`.
- `.claude/` is ignored by git. `ionut-sensors`, `ionut-api` and `ionut-screens` exist and were updated for this block at hour 4 (scope, documents, rules). No new subagent. Ionut restarts the session before implementing, so the three updated files are the ones the Agent tool loads.
- Devices: Ionut has an iPhone; the team's Android is a teammate's.
- Concept v6 PDF is on this machine. Its recipes for this block (section 9.7): "draw the centre of the video frame (about 64×64 px) to a canvas ~10×/s; bucket pixels into 12 hue bins weighted by saturation × brightness; take the strongest bin and average its pixels; if nothing is vivid, use the overall average as night glass" and "the colour stays within a small distance and the phone's rotation rate is low for 2 s".

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 2, Ionut's rows and Checkpoint 2; section 8, Ionut's tests | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Ionut's table and "Needs from others" | All |
| `ionut/GLOSSARY.md` | Whole file | All |
| `packages/shared/src/contract.ts` | Whole file | B2-0, B2-2.b, B2-2.c |
| `DESIGN.md` | 2.3, 2.4 | B2-1.a, B2-3, B2-1.c |
| `DESIGN.md` | 4.5, 4.6, 5.2 (hold rings, lens colour disk, caught pane, station views), 5.6, 5.8 (the three lens rows), 6.3, 6.6, 6.7, 6.11, 6.20, 6.21, 7.0, 7.5, 7.16, section 8, section 9 item 4 | B2-1.c, B2-2.c |
| `design/css/components.css` | Lines 347 to 410 (`.lens-view`), as a layout reference only | B2-1.c |
| `apps/web/src/styles/tokens.css`, `apps/web/src/components/` | Custom property names; exports and props (read, never edit) | B2-1.c, B2-2.c |
| `apps/web/src/api/client.ts`, `apps/web/src/events/queue.ts`, `queue.test.ts` | Whole files | B2-2.b |
| `apps/web/src/sensors/primer.ts`, `sensors.test.ts` | Whole files | B2-1.b |
| `apps/web/src/phone/` | Whole folder | B2-1.c, B2-2.c |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Colour lens: rear camera, 64x64 centre sample 10 times a second, 12 hue bins weighted by saturation x brightness, night-glass fallback. Test for the bin picker with fixed pixel arrays | 3.5 | B2-1.a, B2-1.b, B2-1.c |
| Section 8: Hue-bin colour picker on fixed pixel arrays | in the 3.5 | B2-1.a |
| Hold steady for 2 s (colour distance plus rotation rate), `POST /panes`, vibration where supported, caught-pane feedback | 1.5 | B2-2.a, B2-2.b, B2-2.c |
| Colour names: one ro and en name per hue bin, shown under the caught swatch | 0.25 | B2-3.a |
| `DESIGN.md` section 9 item 4: Colour lens with colour names. Smallest version: 6.11 reading, holding, caught, window complete, name under the swatch; the flight can be a fade | 0.75 styling, from block slack | B2-1.c, B2-2.c |
| Checkpoint 2, line 1 | | B2-2.b, B2-2.c, B2-last (with Fabi and Cristea) |

Total: 5.25 h of tasks plus 0.75 h of styling in a 6 h block.

Order: B2-0 by this session. Then, on `ionut/b2-colour` in the one working tree, `ionut-sensors` does B2-1.a.1, B2-3.a.1 and B2-2.a.1 one after another while `ionut-api` does B2-2.b.1 in parallel. The session verifies, commits, pushes `ionut/b2-colour` and opens its PR, so Fabi and Cristea get the seam early. Then `ionut/b2-lens` from `ionut/b2-colour`: `ionut-sensors` does B2-1.b.1, then `ionut-screens` does B2-1.c.1 and B2-2.c.1 one after another. Then B2-last.

Conflicts: every Ionut branch adds glossary rows, and Cristea or Fabi may append to `contract.ts`. After each merge into `main`, rebase the open Ionut branch on `main`, re-run its verify, and push before Cristea merges it. Keep both sides when resolving `contract.ts`.

The seam. This session writes it in B2-0 as the first code commit of `ionut/b2-colour` (Ionut's decision, hour 4).

Appended to `packages/shared/src/contract.ts` (owner: the team; Ionut takes it to Fabi, who validates `PaneIn` in `POST /panes` and sends the two messages, and to Cristea, whose `/screen` v2 reads them):

```ts
/** POST /panes body. siteId is "gallery" in remote mode. bin null is night glass. */
export const PaneIn = z.object({
  siteId: z.string(),
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(1),
  lightness: z.number().min(0).max(1),
  hex: z.string().regex(/^#[0-9a-f]{6}$/),
  bin: z.number().int().min(0).max(11).nullable(),
  at: z.string().datetime(),
});
export type PaneIn = z.infer<typeof PaneIn>;

/** POST /panes answers 201 with this. A rate limit answers 429 with Retry-After. */
export const PaneAccepted = z.object({
  windowId: z.string(),
  slot: z.number().int().min(0).max(47),
  count: z.number().int().min(1).max(48),
  completed: z.boolean(),
});
export type PaneAccepted = z.infer<typeof PaneAccepted>;

/** Socket message "pane". */
export const PaneMessage = z.object({
  siteId: z.string(),
  windowId: z.string(),
  slot: z.number().int().min(0).max(47),
  hex: z.string().regex(/^#[0-9a-f]{6}$/),
  bin: z.number().int().min(0).max(11).nullable(),
});
export type PaneMessage = z.infer<typeof PaneMessage>;

/** Socket message "window_complete". */
export const WindowCompleteMessage = z.object({ siteId: z.string(), windowId: z.string() });
export type WindowCompleteMessage = z.infer<typeof WindowCompleteMessage>;
```

New file `apps/web/src/colour/reading.ts` (owner: Ionut's lane; shared by `ionut-sensors` and `ionut-api`):

```ts
/** One colour read by the lens. hue 0 to under 360, saturation and lightness 0 to 1 (HSL), bin null is night glass. */
export type Reading = {
  r: number;
  g: number;
  b: number;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
  bin: number | null;
};
```

### 3.1 Subagents

Ionut asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Ionut, re-runs the checks, commits, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `ionut-sensors` | Pure colour logic (bins, names, picker, hold) and the camera and motion hooks | opus | reused from Build 1, updated at hour 4 |
| `ionut-api` | The pane sender against the seam | opus | reused from Setup, updated at hour 4 |
| `ionut-screens` | ColourLens, TopBar, the mini window and the Site view wiring | sonnet | reused from Build 1, updated at hour 4 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B2-1.a.1 | `ionut-sensors` | Hue bins and the bin picker with tests | `apps/web/src/colour/bins.ts`, `bins.test.ts`, `picker.ts`, `picker.test.ts` | first, parallel with B2-2.b.1 |
| B2-3.a.1 | `ionut-sensors` | Colour names | `apps/web/src/colour/names.ts`, `names.test.ts` | after B2-1.a.1, parallel with B2-2.b.1 |
| B2-2.a.1 | `ionut-sensors` | Hold detector with tests | `apps/web/src/colour/hold.ts`, `hold.test.ts` | after B2-3.a.1, parallel with B2-2.b.1 |
| B2-2.b.1 | `ionut-api` | Pane sender with tests | `apps/web/src/colour/panes.ts`, `panes.test.ts` | parallel with the three above |
| B2-1.b.1 | `ionut-sensors` | Rear camera, lens sampling and rotation rate | `apps/web/src/sensors/camera.ts`, `camera.test.ts`, `useLensReading.ts`, `useRotationRate.ts` | after `ionut/b2-colour` is pushed |
| B2-1.c.1 | `ionut-screens` | TopBar, ColourLens up to the holding state, Site view wiring | `apps/web/src/phone/TopBar.tsx`, `TopBar.module.css`, `ColourLens.tsx`, `ColourLens.module.css`, `SiteView.tsx`, `SiteView.module.css` | after B2-1.b.1 |
| B2-2.c.1 | `ionut-screens` | Caught state, sending, vibration, mini window | `apps/web/src/phone/ColourLens.tsx`, `ColourLens.module.css`, `panes.ts`, `panes.test.ts`, `useSiteGlow.ts`, `SiteView.tsx`, `RoseWindow.tsx`, `RoseWindow.module.css` | after B2-1.c.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Ionut to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Ionut. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Ionut, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B2-0 Preflight and seam (first, this session)

- [ ] `git status`, `git branch --show-current` (expected `ionut/b2-colour`), `git pull origin main`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck && npm run build && npm test`.
- [ ] Re-check `POST /panes` and `/socket.io/` on `https://lampa-api-b45i.onrender.com`, and whether a `fabi/GLOSSARY.md` or `patrick/GLOSSARY.md` exists on `origin/main`. Record the answers.
- [ ] Append the four schemas of the seam to `packages/shared/src/contract.ts` and create `apps/web/src/colour/reading.ts`, both exactly as written above. Commit: `feat(shared) added PaneIn, PaneAccepted, PaneMessage and WindowCompleteMessage to the contract`.
- [ ] Glossary: Hand-offs line for the seam (used by Fabi and Cristea).
- Verify: `npm run typecheck && npm test`. Paste the summary lines.
- Done when: the baseline is recorded, failures that were already there are listed and not fixed silently, and the seam commit is on `ionut/b2-colour`.

### B2-1 Colour lens with the hue-bin picker and its test (3.5 h)

#### B2-1.a The picker turns a pixel array into one reading

**B2-1.a.1** Hue bins and the bin picker. Subagent: `ionut-sensors`. Files: `apps/web/src/colour/bins.ts`, `bins.test.ts`, `picker.ts`, `picker.test.ts`.

- [ ] `bins.ts` exports `BIN_COUNT = 12` and `hueBin(hue: number): number` = `floor(((hue + 15) mod 360) / 30)`, with a negative or over-360 hue wrapped into 0 to under 360 first (`DESIGN.md` 2.4).
- [ ] `picker.ts` exports the named constants `SAMPLE_SIZE = 64`, `VIVID_SATURATION_MIN = 0.25`, `VIVID_VALUE_MIN = 0.20`, `NIGHT_GLASS_SHARE = 0.05` (Ionut's decision, hour 4) and `pickColour(rgba: Uint8ClampedArray): Reading` (`Reading` from `./reading`). `rgba` holds 4 bytes per pixel; alpha is ignored.
  - Per pixel, compute HSV hue, saturation and value. A pixel counts when saturation ≥ 0.25 and value ≥ 0.20. Its weight is saturation × value, added to the bin `hueBin(hue)`.
  - Night glass: when fewer than 5% of the pixels count (under 205 of 4096), the reading is the plain average RGB of all pixels, with `bin: null`.
  - Otherwise the strongest bin is the one with the largest weight sum (a tie goes to the lower index), and the reading is the plain average RGB of that bin's counted pixels, with `bin` set to that bin.
  - Bin 0 spans 345 to 14 degrees; averaging in RGB keeps the wrap correct.
  - `r`, `g`, `b` are rounded to integers 0 to 255; `hex` is lower-case `#rrggbb`; `hue` (0 to under 360), `saturation` and `lightness` (0 to 1) are the HSL values of the rounded RGB.
- [ ] `picker.ts` also exports `rgbDistance(a: Reading, b: Reading): number`, the Euclidean distance in RGB (0 to about 441.67).
- [ ] `bins.test.ts`, cases by name: "hue 0 and hue 359 are bin 0"; "hue 14.9 is bin 0 and hue 15 is bin 1"; "hue 344.9 is bin 11 and hue 345 is bin 0"; "each bin's lower edge maps to its own index"; "hue 360 and hue -15 wrap".
- [ ] `picker.test.ts`, with pixel arrays built by a small helper in the test file, cases by name: "a uniform vivid red array reads red, bin 0, hex #ff0000"; "a vivid minority beats a grey majority, not the plain average" (30% saturated blue, 70% mid grey gives bin 8 and the blue's hex); "the strongest bin wins by saturation times value, not by pixel count" (60% dull orange at saturation 0.3, 40% vivid green gives bin 4); "the result is the average of the winning bin's pixels only"; "reds on both sides of 0 degrees share bin 0"; "an all-grey array is night glass with bin null and the average grey"; "a dark array is night glass"; "204 vivid pixels of 4096 is night glass and 205 is not"; "hex is lower case and matches r, g, b"; "hue, saturation and lightness are the HSL of the result"; "rgbDistance of black and white is about 441.67".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/colour && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes.

#### B2-1.b The rear camera gives ten readings a second

**B2-1.b.1** Rear camera, lens sampling and rotation rate. Subagent: `ionut-sensors`. Files: `apps/web/src/sensors/camera.ts`, `camera.test.ts`, `useLensReading.ts`, `useRotationRate.ts`.

- [ ] `camera.ts` exports `type CameraResult = { status: "ready"; stream: MediaStream } | { status: "denied" } | { status: "unavailable" }` and `openRearCamera(): Promise<CameraResult>`. It is called inside the tap that opens the lens and calls `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })` before its first `await`. No `navigator.mediaDevices` gives `"unavailable"` without a call.
- [ ] `camera.ts` exports the pure `cameraStatus(error: unknown): "denied" | "unavailable"`: a `NotAllowedError` or `SecurityError` name gives `"denied"`; every other error (`NotFoundError`, `NotReadableError`, `OverconstrainedError`, anything else) gives `"unavailable"`.
- [ ] `camera.ts` exports `LENS_CENTRE_Y = 0.42` and the pure `lensSquare(videoW: number, videoH: number, viewW: number, viewH: number, size: number): { sx: number; sy: number; side: number }`: the source square of `size` video pixels under the centre of the lens. The video fills the view with `object-fit: cover`, so `scale = max(viewW / videoW, viewH / videoH)`, the square's centre is `x = videoW / 2`, `y = videoH / 2 + (LENS_CENTRE_Y - 0.5) * viewH / scale`; `side` shrinks to the smaller frame side when the frame is smaller than `size`; `sx` and `sy` are floored and clamped so the square stays inside the frame.
- [ ] `camera.ts` exports `stopCamera(stream: MediaStream): void`, which stops every track.
- [ ] `useLensReading(video: HTMLVideoElement | null, active: boolean): Reading | null` in `useLensReading.ts`: while `active` and the video has data (`readyState >= 2`), every `SAMPLE_INTERVAL_MS = 100` it draws `lensSquare(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight, SAMPLE_SIZE)` to one reused 64×64 canvas (`getContext("2d", { willReadFrequently: true })`), reads it with `getImageData` and returns `pickColour` of the data. The timer stops when `active` is false, when the document is hidden, and on unmount. `null` until the first reading. The canvas is never attached to the page and no frame is stored or sent.
- [ ] `useRotationRate(): { current: number | null }` in `useRotationRate.ts`: a ref, not state, so a motion event causes no render. It listens to `devicemotion` and stores the largest absolute value of `rotationRate.alpha`, `beta` and `gamma` in degrees per second; `null` until the first event and when `rotationRate` or all three axes are null. It requests no permission (the primer's grant is what exists). The pure part is `maxRotation(rate: { alpha: number | null; beta: number | null; gamma: number | null } | null): number | null`, exported from `camera.ts`.
- [ ] `camera.test.ts`, cases by name: "a NotAllowedError maps to denied"; "a NotFoundError maps to unavailable"; "an unknown error maps to unavailable"; "lensSquare of a 1280 by 720 frame in a 390 by 844 view at 64 starts at 608, 270"; "lensSquare shrinks to a frame smaller than the sample"; "lensSquare stays inside the frame"; "maxRotation takes the largest absolute axis"; "maxRotation of null axes is null".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/sensors && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the eight cases pass. The hooks have no tests (no DOM); the phones check them in B2-last.

#### B2-1.c The lens view shows the reading and its name

**B2-1.c.1** TopBar, ColourLens up to the holding state, Site view wiring. Subagent: `ionut-screens`. Files: `apps/web/src/phone/TopBar.tsx`, `TopBar.module.css`, `ColourLens.tsx`, `ColourLens.module.css`, `SiteView.tsx`, `SiteView.module.css`.

- [ ] `TopBar.tsx` (`DESIGN.md` 6.20, phone): props `{ siteName: string; onBack: () => void; demo: boolean }`. Height 56px plus `env(safe-area-inset-top)`, `--bg`, `--z-topbar`; left an icon Button (48px hit area) with `aria-label="Back to {siteName}"`; centre the site name in `--type-label` `--text-2`; right the `DemoBadge` when `demo`. The icon is `<Icon name="back" />`.
- [ ] `SiteView.tsx`: state `view: "site" | "lens"` (Ionut's decision, hour 4: no new route). The "Catch a colour" Button's `onClick` calls `openRearCamera()` synchronously inside the tap, stores the promise and sets `view` to `"lens"`. In `"lens"` the component renders `<ColourLens site={site} remote={remote} demo={demo} camera={promise} onBack={...} />` in place of the Site view content; `onBack` sets `view` to `"site"`. The `useSiteGlow` call and the `wake` effect stay mounted in both views and `wake` is not sent again on return.
- [ ] `ColourLens.tsx` props: `{ site: PhoneSite; remote: boolean; demo: boolean; camera: Promise<CameraResult>; onBack: () => void; onReading?: (reading: Reading) => void; onCaught?: (reading: Reading) => void; onComplete?: () => void }`. The three optional callbacks are Patrick's hook for the glass tone, the clink and the chord; the lens plays no sound itself (Ionut's decision, hour 4). `onReading` fires once per new reading.
- [ ] Layout per 6.11 and 7.5, with `design/css/components.css` lines 347 to 410 as the reference: full-bleed `<video autoPlay muted playsInline>` with the stream as `srcObject`; `--scrim` outside a circle; the lens circle `min(72vw, 300px)` wide, centred, its centre at 42% of the viewport height; the colour disk at 40% of the lens, filled with the reading's `hex`, `background-color` transition 100ms linear; a `Ring` around the lens, `size` = lens diameter + 20 in px (computed from `window.innerWidth`, recomputed on resize), `label="Hold still"`, stroke left as the component draws it (`--text`; Ionut's decision, hour 4); the instruction line under the lens in `--type-lead`; under it the 24px swatch (radius 4px, 1.5px `--line-strong` border) with the colour name beside it in `--type-label` `--text`; bottom "Back to {Site}" (secondary, size l, block) with the bottom safe-area padding of 4.5. The name is `colourName(reading.bin)` from `../colour/names`.
- [ ] The mini window top-right under the top bar: `<RoseWindow name={remote ? "Gallery" : site.name} size="s" filled={...} />` with 48 nulls in this task; B2-2.c.1 fills it.
- [ ] States of this task, with the exact texts:
  - starting camera (the `camera` promise is pending, or the video has no data yet): lens `--surface-2`, a 32px spinner (the `.spinner` and `.spinner--32` rules of `design/css/components.css` lines 37 to 47, copied into `ColourLens.module.css`), "Starting the camera".
  - reading (no hold running): live image, disk, Ring empty, "Point at a colour and hold still".
  - holding and unsteady: wired in B2-2.c.1; this task renders the Ring at `progress={0}`.
  - camera denied (`status: "denied"`): lens `--surface-2`, no video; "LAMPA needs the camera to read a colour. Only the colour leaves your phone. Allow the camera in your browser settings, then try again."; Buttons "Try again" (secondary; its tap calls `openRearCamera()` again and uses the new promise) and "Back to {Site}".
  - no camera (`status: "unavailable"`): "This device has no camera we can use. Try on your phone." and "Back to {Site}".
- [ ] The privacy line "Only the colour leaves your phone, never the picture." shows under the instruction for `PRIVACY_LINE_MS = 5000` the first time the lens reaches the reading state after a page load; a module-level flag remembers it, no storage (Ionut's decision, hour 4).
- [ ] The view opens with opacity 0 to 1 and `translateY(12px)` to 0 over `--dur-base` `--ease-out` (5.2); under `prefers-reduced-motion: reduce` opacity only (5.6).
- [ ] Leaving the lens (`onBack`, unmount) and a hidden document call `stopCamera`; a document that becomes visible again in the lens calls nothing by itself: the view shows "Starting the camera" with a "Try again" Button (secondary) whose tap calls `openRearCamera()` (Ionut's decision, hour 5).
- [ ] The memorial never reaches this view: `MemorialStub` is untouched. Demo mode changes nothing but the badge (7.16): the camera is real.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/phone --include=*.css | wc -l` → `0`. Paste the summary lines. Then, on the dev server at 390×844 in desktop Chromium: `/s/unirii` → tap → "Catch a colour" → the lens view with the state the machine's camera gives (reading, denied or no camera), the back button and "Back to Piața Unirii" both return to the Site view, and no second `wake` is sent. Report which states you saw and which you did not.
- Done when: the verify passes and the lens opens and closes from the Site view.

### B2-2 Hold steady, `POST /panes`, vibration, caught-pane feedback (1.5 h)

#### B2-2.a Two steady seconds catch the colour

**B2-2.a.1** Hold detector. Subagent: `ionut-sensors`. Files: `apps/web/src/colour/hold.ts`, `hold.test.ts`.

- [ ] `hold.ts` exports the named constants `HOLD_MS = 2000`, `COLOUR_DISTANCE_MAX = 48`, `ROTATION_MAX_DPS = 20` (Ionut's decision, hour 4), `RESET_MS = 200` (Ionut's decision, hour 5: the Ring's reset time of `DESIGN.md` 6.3), the type `HoldState = { first: Reading | null; startedAt: number | null; pausedUntil: number | null; caught: boolean }`, `initialHold: HoldState`, and the pure `stepHold(state: HoldState, input: { reading: Reading; rotation: number | null; at: number }): HoldState` (`at` in ms). The rules, in this order:
  - Once `caught` is true the state never changes.
  - A break ends the running hold: `first` and `startedAt` become null and `pausedUntil = at + 200`. A hold breaks when `rotation` is over 20, or when `rgbDistance(first, reading)` is over 48. The reading that breaks a hold never starts one.
  - `rotation` of `null` (no motion data: compass denied, desktop) never breaks a hold; colour distance alone decides (Ionut's decision, hour 4).
  - With no hold running, a reading starts one (`first = reading`, `startedAt = at`, `pausedUntil = null`) only when `rotation` is null or at most 20 and `pausedUntil` is null or `at >= pausedUntil`. With no hold running and `rotation` over 20, nothing changes.
  - With a hold running and `at - startedAt >= 2000`, `caught` becomes true and `first` stays the hold's first reading: that reading is the caught colour.
  - Night glass readings hold and catch like any other.
- [ ] `hold.ts` exports `isHolding(state: HoldState): boolean` (`startedAt !== null && !caught`).
- [ ] `hold.test.ts`, cases by name: "the first steady reading starts a hold"; "readings within distance 48 for 2000 ms catch the first reading"; "1999 ms is not caught"; "a reading at distance over 48 breaks the hold and does not start one"; "no hold starts within 200 ms of a break and the first reading after it starts one"; "a reading at distance exactly 48 keeps the hold"; "rotation over 20 degrees per second breaks the hold and nothing starts until it drops"; "rotation exactly 20 keeps the hold"; "null rotation lets colour distance alone decide"; "a caught state ignores later readings"; "night glass can be caught".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/colour && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the eleven cases pass.

#### B2-2.b The caught colour is sent to `POST /panes`

**B2-2.b.1** Pane sender. Subagent: `ionut-api`. Files: `apps/web/src/colour/panes.ts`, `panes.test.ts`.

- [ ] `panes.ts` exports `GALLERY_ID = "gallery"` and `toPaneIn(reading: Reading, siteId: string, at: Date): PaneIn`: `siteId`, `hue`, `saturation`, `lightness`, `hex`, `bin` from the reading, `at` as an ISO string, passed through `PaneIn.parse`.
- [ ] `panes.ts` exports `type PaneStatus = { state: "sending" } | { state: "sent"; accepted: PaneAccepted } | { state: "waiting"; offline: boolean } | { state: "rate_limited" } | { state: "dropped" }` and `createPaneSender({ send, onStatus, intervalMs = 2000 }: { send: (pane: PaneIn) => Promise<PaneAccepted>; onStatus: (status: PaneStatus) => void; intervalMs?: number }): { submit(pane: PaneIn): void; stop(): void }`.
  - `submit` reports `sending` and calls `send` once.
  - Success reports `sent` with the answer.
  - An `ApiError` with status 429 reports `rate_limited`; the pane is dropped.
  - An `ApiError` with status 500 or more, or 401, reports `waiting` with `offline: false`, keeps the pane in memory and tries again every `intervalMs` until it is sent, dropped or `stop()` is called.
  - Any error that is not an `ApiError` or a `ZodError` (a network error) reports `waiting` with `offline: true` and retries the same way.
  - Any other `ApiError` (400, 403, 404 and the rest) and a `ZodError` report `dropped`; no retry (Ionut's decision, hour 4).
  - One pane at a time: a `submit` while one is in flight or waiting is ignored. Nothing is stored (Ionut's decision, hour 4). `stop()` clears the timer.
- [ ] `panes.ts` exports `sendPane(pane: PaneIn): Promise<PaneAccepted>` = `api("/panes", { method: "POST", body: pane, schema: PaneAccepted })`.
- [ ] `panes.test.ts`, with `send` as a mock and fake timers, cases by name: "toPaneIn carries the reading's fields and an ISO time"; "toPaneIn keeps bin null for night glass"; "a 201 reports sending then sent"; "a 429 reports rate_limited and never retries"; "a 503 reports waiting, not offline, and is sent on the next tick"; "a 401 is retried"; "a network error reports waiting offline and is retried"; "a 404 reports dropped and never retries"; "an answer that fails the schema reports dropped"; "a second submit while one waits is ignored"; "stop ends the retries".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/colour && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the eleven cases pass.

#### B2-2.c The visitor sees and feels the catch

**B2-2.c.1** Caught state, sending, vibration, mini window. Subagent: `ionut-screens`. Files: `apps/web/src/phone/ColourLens.tsx`, `ColourLens.module.css`, `panes.ts`, `panes.test.ts`, `useSiteGlow.ts`, `SiteView.tsx`, `RoseWindow.tsx`, `RoseWindow.module.css`.

- [ ] `apps/web/src/phone/panes.ts`, pure: `type WindowPanes = { windowId: string | null; filled: (string | null)[] }` (48 entries), `emptyWindow: WindowPanes`, `applyPane(state: WindowPanes, pane: { windowId: string; slot: number; hex: string }): WindowPanes` and `nextEmptySlot(state: WindowPanes): number | null` (lowest empty index). A pane with a `windowId` different from the state's starts a new empty window holding only that pane (Ionut's decision, hour 4: the window clears when a pane of a new window arrives; after a completion it stays full until then).
- [ ] `panes.test.ts`, cases by name: "the first pane sets the window id and its slot"; "a pane of the same window fills its slot and keeps the others"; "a pane of a new window clears the old panes"; "nextEmptySlot is the lowest empty index and null when full".
- [ ] `useSiteGlow.ts`: on the same socket, also listen for `SocketMessage.enum.pane`, parse with `PaneMessage.safeParse`, ignore other sites, and fold into `WindowPanes` with `applyPane`. Return `{ glow, connected, panes, addPane }`, where `addPane` folds the visitor's own pane in from `PaneAccepted`. No second socket and no new endpoint (Ionut's decision, hour 4: the window starts empty).
- [ ] `SiteView.tsx`: the large RoseWindow gets `panes.filled` in place of `EMPTY_PANES`, and `ColourLens` gets `panes` and `addPane`. In remote mode `ColourLens` gets its own local `WindowPanes` starting empty, because the phone joins no gallery room: the Gallery mini window shows only the visitor's own pane (Ionut's decision, hour 4).
- [ ] `ColourLens.tsx`, holding: each reading goes through `stepHold` with `useRotationRate().current` and `performance.now()`. Ring props, exactly: while `isHolding`, `<Ring filling holdMs={HOLD_MS} progress={1} />`; otherwise `<Ring progress={0} />` with no `filling` (the Ring empties in 200ms by itself, which is the detector's `RESET_MS` pause, so the next fill starts from empty); once caught, `<Ring progress={1} />`. Instruction text: "Point at a colour and hold still" before the first hold has started and while the last `rotation` was over `ROTATION_MAX_DPS`; "Hold still" otherwise, the 200 ms pause included (Ionut's decision, hour 5).
- [ ] Caught (once): sampling stops (`active` false) and the camera keeps showing; the disk fills the lens over 300ms `--ease-out`; the swatch and name freeze on the caught colour, the name in `--type-title`; `onCaught(reading)` fires; `navigator.vibrate?.([40])` (5.8; absent on iOS); the sender gets `toPaneIn(reading, remote ? GALLERY_ID : site.id, new Date())` through `createPaneSender({ send: sendPane, ... })`. The bottom shows "Back to {Site}" as primary, size l. "Say why" and "Keep my colours" are not rendered (Ionut's decision, hour 4: hidden until Echo and sign-in ship). One catch per opening of the lens: the caught state stays until the visitor leaves (Ionut's decision, hour 5).
- [ ] The flight (5.2): after the disk fills, it shrinks to `scale(0.12)` and translates to the mini window's predicted slot (`nextEmptySlot`) over `--dur-flight` `--ease-in-out`, with `transform` only. Under `prefers-reduced-motion: reduce` there is no flight (5.6). First cut of the block: the flight becomes an opacity fade of the disk.
- [ ] Lines under the swatch by `PaneStatus`, exact texts:
  - `sending`: "Sending your colour".
  - `sent`, not completed: `addPane` with the server's `windowId` and `slot` (the server's slot wins over the predicted one); the slot fades from `--surface-2` to the colour over 240ms; "Your colour is in the {Site} window. {count} of 48."; in remote mode "Your colour is in the Gallery window."
  - `sent`, completed: the same `addPane`, then "You completed the window."; `navigator.vibrate?.([40, 60, 40])`; `onComplete()`; the mini window flare with the 5.5 timing (Ionut's decision, hour 5): through a new optional `flare?: boolean` prop of `RoseWindow`, the 4.3 halo goes to opacity 1.0 in 600ms `--ease-out`, holds 1200ms and settles back over 1600ms, with all 48 panes at full brightness meanwhile; under `prefers-reduced-motion: reduce` one 600ms opacity flash (5.6). Second cut of the block: the line only.
  - `waiting`, `offline: false`: the caught state kept, `<Notice variant="error">Not sent yet. Trying again.</Notice>`.
  - `waiting`, `offline: true`: `<Notice variant="connection">` with the 7.0 offline text "No connection. The sound keeps playing. Your colours send when you are back online.", shown after `CONNECTION_NOTICE_MS = 3000` in this state (6.7), and at once the line "Saved on this phone. It sends when you are back online."
  - `rate_limited`: the lens at 0.4 opacity, the Ring hidden, "You have given this window enough colours for now. Try another site."
  - `dropped`: the caught swatch and name stay; no line and no Notice (Ionut's decision, hour 4).
- [ ] A `role="status"` region, visually hidden, announces "Colour caught. {count} of 48 in the {Site} window." once, on `sent` (section 8). The mini window keeps RoseWindow's accessible name.
- [ ] Unmount calls the sender's `stop()`.
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -rnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/phone --include=*.css | wc -l` → `0`. Paste the summary lines. Then, on the dev server at 390×844 with no local API: a catch (with a camera) or the reported reason none was possible; the request body of `POST /panes` copied from the network panel; the line and Notice that showed. Report which states you saw and which you did not.
- Done when: the verify passes, the four pane cases pass, and a catch sends one `POST /panes` whose body parses as `PaneIn`.

### B2-3 Colour names for the 12 hue bins (0.25 h)

#### B2-3.a Every reading has a name in en and ro

**B2-3.a.1** Colour names. Subagent: `ionut-sensors`. Files: `apps/web/src/colour/names.ts`, `names.test.ts`.

- [ ] `names.ts` exports `COLOUR_NAMES: readonly { en: string; ro: string }[]` with the 12 rows of `DESIGN.md` 2.4 in bin order, copied character for character (Red / Roșu, Orange / Portocaliu, Yellow / Galben, Yellow-green / Verde-gălbui, Green / Verde, Mint / Verde-mentă, Turquoise / Turcoaz, Sky blue / Albastru deschis, Blue / Albastru, Violet / Violet, Magenta / Magenta, Pink / Roz), `NIGHT_GLASS = { en: "Night glass", ro: "Sticlă de noapte" }`, and `colourName(bin: number | null, lang: "en" | "ro" = "en"): string`.
- [ ] `names.test.ts`, cases by name: "there are 12 names and each has en and ro"; "bin 0 is Red and Roșu"; "bin 7 is Sky blue and Albastru deschis"; "a null bin is Night glass and Sticlă de noapte"; "the default language is en".
- [ ] Do not run `git add`, `git commit` or `npm install`.
- Verify: `npm run test -w @lampa/web -- src/colour && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: the five cases pass. The name under the swatch is rendered by B2-1.c.1 and frozen by B2-2.c.1.

### B2-last Integrate and hand over (last, this session)

- [ ] `ionut/b2-lens` rebased on `main` (after `ionut/b2-colour` is merged, or on `ionut/b2-colour` if it is not), then `npm run typecheck && npm run build && npm test` green on it.
- [ ] Push each branch and open its PR, in this order: `ionut/b2-colour`, `ionut/b2-lens`. Each PR lists what was verified and what is waiting for a phone or for Fabi. Cristea merges.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs: the pane seam (Fabi, Cristea); `ColourLens` with `onReading`, `onCaught`, `onComplete` and how `start_colour_catch` opens it (Patrick); `colourName` and `hueBin` (Cristea's ticker); `pickColour`, `Reading`; `TopBar`; `useSiteGlow` now returning `panes`.
- [ ] Report written to `ionut/build_2/build_2_report.md`, in the shape of section 4.
- [ ] Ionut's checks on real phones, listed and not claimed.
  - iPhone, deployed build (Ionut): `/s/unirii` → tap → "Catch a colour": the camera prompt appears in that tap; the rear camera shows; the disk, swatch and name follow what is in the middle of the lens circle, not the middle of the screen; a dark scene reads "Night glass"; the Ring fills while the phone is still and resets when it turns (this shows whether the primer's motion grant delivers `rotationRate` on iOS); after 2 s the caught state shows; "Back to Piața Unirii" returns and the camera light goes off; denying the camera shows the 7.5 text and "Try again".
  - Android, deployed build (a teammate): the same steps, plus one short vibration on the catch.
  - With Fabi and Cristea, once `POST /panes` and `/live` are on `main` (Checkpoint 2, line 1): the caught colour shows "… {n} of 48.", fills the mini window, and appears as a pane on `/screen` within one second.
- Done when: every box is ticked or listed as Ionut's, and the report is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `B2-n.x.y done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: `POST /panes`, the `pane` message and the `colour` event recorded by the endpoint (Fabi); the sound callbacks (Patrick); still open from Build 1: `POST /events` and `/live` (Fabi), the sound bed (Patrick).
- **Not finished at hour 18:** each ID, what is left, and its place in Ionut's cut order for this block.
- **Phone checks for Ionut:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 2

- The "Catch a colour" tap on a colour site opens the lens with the rear camera, and the camera request sits inside that tap.
- The lens shows a reading ten times a second, picked by `pickColour` from a 64×64 centre sample with the 2.4 bins, and its name under the swatch; a scene with no vivid pixels reads "Night glass".
- Two steady seconds (colour distance 48, rotation 20 degrees per second) catch the colour; one `POST /panes` with a `PaneIn` body follows; Android vibrates.
- The caught line, the mini window and the failure states follow 6.11 and 7.5 as written in B2-2.c.1.
- `npm test` is green with the bin, picker, name, hold, pane sender, pane reducer and camera cases.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `ionut/GLOSSARY.md` matches the state of the branch.

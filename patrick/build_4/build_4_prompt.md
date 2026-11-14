# Prompt: Patrick's Build 4: demo extras (Patrick, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 28.3 (2026-11-14 17:40 +0200). Implementation not started.**

You are implementing Patrick's part of Build 4: demo extras (hours 37 to 40 in the plan; Patrick runs it from clock hour 28.5 to 31.5, 17:51 to 20:51 on 2026-11-14) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Build 4 no goal sentence. Its title is *demo extras*, and its opening line is: *Three hours, so each person gets one main item. Anything not working at hour 40 is cut and the demo uses the fallback in the last column.*

Checkpoint this block must pass: Build 4 is followed by the freeze, not a checkpoint. The freeze lines this lane affects: *Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived.* and *`/screen` runs 30 minutes with sound and no reload, while `simulate-crowd` sends about 2,000 visitors.*

## 0. Ground rules

- **Patrick takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Patrick, with your recommendation. Nothing uses the recommendation until Patrick answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask. Known differences, all Patrick's decisions (glossary Decisions, hour 37): `/screen` gets the finale's sound and a DOM layer (dips, black, two side-panel lines), not the window flare and amber streets of DESIGN 7.13; the clock offset also starts when a phone view mounts and on the `/screen` start click; Radio Lampa leaves out the concept's approved-echo line; a device with no clock offset starts `FINALE_LEAD_MS` after it receives `finale`, not at once.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block runs from clock hour 28.5 to 31.5 (17:51 to 20:51; Patrick's decision, hour 37). Where this prompt or the plan says hour 40, read 20:51.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Patrick: carrying on, cutting (plan section 7) or moving it is their decision. Patrick's cut line (hour 37): first Radio Lampa (cut order 1); then, if the phone finale is not working at 20:51, the finale plays on `/screen` alone (plan fallback, cut order 3). The phone checks of B4-3 are never cut.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Patrick, who takes it to the team. When another lane's endpoint has not landed, code against its schema. This block adds `FinaleMessage` and `FINALE_LEAD_MS` (B4-1.0) only after Fabi and the team agree.
- The server sets event weights. The client never sends one. Nothing in this block sends events.
- No library beyond plan section 3 without Patrick's approval. Approved: none in this block. Web Audio API directly; Text to Dialogue through the global `fetch`.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. **`ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` never appear in the chat, in a commit, in a glossary line or in command output** (Patrick's decision, hour 5). Do not open, print or `cat` the root `.env`. Scripts print statuses, file names, credit numbers, names and `true` or `false`.
- `main` deploys by itself. The `patrick/` docs commit (this prompt, the glossary) goes straight to `main`, as in earlier blocks. After it, all work happens on the local branch `patrick/b4-work`, which is never pushed. Two PR branches, each cut from `origin/main` and filled by cherry-pick (Patrick's decision, hour 37): `patrick/b4-finale` (B4-1), then `patrick/b4-radio` (B4-2), cut after `patrick/b4-finale` is merged. One small PR per branch. Open it only after the verify commands pass. Patrick merges. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- **Live ElevenLabs calls cost credits.** No agent makes a live call or runs a script with `--run`. Patrick runs `npm run radio:lampa -- --run` once, before the pitch, after the demo numbers are in (B4-2.b). Live Talk runs only at checkpoints and rehearsals (B4-3).
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. **The finale never shows or sounds on the memorial view** (DESIGN 7.11: "a 731 finale happens: ignored on this view; no overlay, no sound"). On `/screen` the candle field and its label stay unchanged through the finale (DESIGN 5.5, 7.13). Radio Lampa never names the Cathedral.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/` (`apps/web/src/styles/tokens.css` and `apps/web/src/components/`). Do not add a colour, font or spacing value that is not a token.
- Write in `patrick/` only. Other members' folders are read-only. Files outside the lane that this prompt lets you touch, each only after its owner agrees and each with a Changes line: Ionut's `apps/web/src/phone/Join.tsx` (one import and the `<PhoneFinale>` element, B4-1.b.1), `apps/web/src/i18n/en.json` and `ro.json` (the three new `finale_*` keys); Cristea's `apps/web/src/screen/ScreenPage.tsx` (one import, the `useScreenFinale` line, two elements, B4-1.c.1 and B4-2.c.1); `packages/shared/src/contract.ts` (B4-1.0, team).
- **Keep `patrick/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Patrick a Decisions line, each new thing another lane can use a Hand-offs line. One docs commit per PR branch (Patrick's decision, hour 25). Build 4 rows use hour 37 and later (Patrick's decision, hour 37).
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 28.3, 2026-11-14 17:40 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Patrick's Build 3 is closed (glossary Done "Build 3", hour 27.5). Ionut's follow-ups merged (#55). `main` is at `4bfb703` after `git pull`, `git status` clean. One open PR, not Patrick's: #57 `fabi/live-published-sites`.
- Carried from Build 3 (Blocked, Patrick's decision hour 27.5): every Build 3 phone check (iPhone B3-1.e, B3-2.a, B3-3.d, B3-4.e live smoke test, B3-5.a, B3-6.b; Android B3-1.e and the lens sounds), the webhook transcript check, and the Checkpoint 3 run. They go into B4-3.
- Still Blocked on the team, not in this block (Patrick's decision, hour 37): speech clips. Only `content/sites/02-unirii.yaml` has persona text; no site has `first_message` except unirii; no narrations; `clips.json` has no greeting, answer or narration file for any site. When the content lands, the command is `npm run publish:site -- --site all` (dry run), then `--run` after Patrick's go.
- Finale pieces that exist: `clips.json` `project.crackle` (`project/crackle-1-2d4bdc14454f.mp3`, 4 s) and `project.waltz` (take 1 `project/waltz-1-7cd34134806b.mp3`, take 2 `project/waltz-2-00915c96fcc1.mp3`, about 45 s each). `SocketMessage` lists `finale` with no payload schema. `LightSurface` (`apps/web/src/lamp/LightSurface.tsx`) takes `pulse={false}` for the finale burst; `LIGHT_LEAVE_MS` 450. `LampCounter` (S, L, light). `pulse.ts`: `startClockOffset()` (once per page, today only from the first Lamp open), `useClockOffset()`. `bus.ts`: `ambientBus()`, `duck(holder, on)`, `DUCK_GAIN` 0.25. `engine.ts`: `loadBuffer(url)`. `context.ts` (Ionut's): `getAudioContext()`, `unlockAudio()`. `room.ts`: `useRoomSound(glowRef, placed, width)`, room beds bypass the duck bus.
- Phone root: `apps/web/src/phone/Join.tsx` renders `Between` (line 142), `Memorial` (line 145) or `SiteView` (line 147). The Lamp opens inside `SiteView`.
- `/screen`: `ScreenPage.tsx` mounts `LivingMap` only after the "Start the Living Map" click. The map is `<div className={styles.map}>` with the canvas, subtitles, the OSM credit and the DemoBadge; the side panel `<aside>` holds the wordmark, two stats, `<Ticker>`, the status line and the QR block. `canvas.ts` draws the candle field and its label (read only).
- Not there yet, added by this block: `FinaleMessage` and `FINALE_LEAD_MS` (B4-1.0), `apps/web/src/audio/finale.ts` (B4-1.a), `apps/web/src/finale/` (B4-1.b, B4-1.c), `apps/web/src/audio/radio.ts` (B4-2.c), `apps/api/src/publish/radio.ts`, `scripts/radio-lampa.ts` and the root script `radio:lampa` (B4-2.a), `ProjectClips.radio` (B4-2.0).
- Needs from others: Fabi's finale trigger at 731 lamps (Build 4 plan row) has not landed: no `fabi/build_4/` prompt, no branch, nothing sends `finale` (checked hour 28.3). The plan's answer: code against `FinaleMessage`. Fabi's `npm run demo:reset` has not landed either. `lamps` and `GET /time` are live (Fabi, hour 11). The deployed `GET /pulse/summary` answered `lampsToday` 721, every glow 0; `GET /pulse/languages` answered `[]` (hour 28.3).
- Credits: ElevenLabs meter 19,405 used of 131,000 (Creator), resets 2026-12-03 (hour 28.3).
- Text to Dialogue (docs read at hour 28.3): `POST https://api.elevenlabs.io/v1/text-to-dialogue`, body `inputs: [{ text, voice_id }]` (at most 10 voices), `model_id` default `eleven_v3`, query `output_format` default `mp3_44100_128`; keep the combined text at 2,000 characters or less; 200 returns the audio file. The docs page gives no price: B4-2.a.1 checks it.
- Persona voices in the site files: `persona.voice` is set for mx, unirii, victoriei and bastion. English site names (`packages/shared/sites.json`): Muzeul MX Corneliu Miklosi, Piața Unirii, Piața Victoriei, Theresia Bastion. `LANGUAGE_NAMES` (`apps/api/src/agent/persona.ts`): ro Romanian, en English, hu Hungarian, de German, sr Serbian. `/pulse/languages` is ordered by conversations, most first.
- `scripts/publish-site.ts` rewrites `apps/web/src/audio/clips.json` from `toClips()`, which rebuilds `project` from the planned project sounds only, so it would drop a `project.radio` entry (B4-2.0 keeps it).
- Scripts the verify commands use: `npm test`, `npm run typecheck`, `npm run build`, `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`, `npm test -w @lampa/api`, `npm run typecheck -w @lampa/api`, `npm run publish:site`, `npm run agent:check`, `npm run simulate:crowd`. `npm run radio:lampa` is added by B4-2.a.1.
- Deployed: web https://lampa-timisoara.vercel.app → 200; API https://lampa-api-b45i.onrender.com/health → 200 (hour 28.3).
- Patrick's phone: an iPhone. Ionut's Android for Android checks. `gh` is at `C:\Program Files\GitHub CLI\gh.exe`.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 4, Patrick's rows and the Freeze lines | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Patrick's table and "Needs from others"; section 7, cut order and "The memorial site" | All |
| `patrick/GLOSSARY.md` | Whole file | All |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | S3 Relight 1884 (printed page 22); clock sync row of section 7.6 (page 32); F3 Radio Lampa and its credit check (pages 54 and 56) | B4-1, B4-2 |
| `DESIGN.md` | 5.5 (1884 finale and candle rows), 5.6, 5.7, 5.8 (finale row); 6.2 Button, 6.7 Notice, 6.13 LampCounter, 6.14 LightSurface; 7.7 ("731 reached while lit"); 7.11 (finale row); 7.12; 7.13 (layout, side panel, finale and Radio Lampa rows); section 9 items 14 and 19 | B4-1, B4-2 |
| `packages/shared/src/contract.ts` | `SocketMessage`, `LAMP_TARGET`, `TimeNow`, `PulseSummary`, `PulseLanguages`, and `FinaleMessage` once B4-1.0 lands | B4-1, B4-2 |
| `packages/shared/sites.json` | Site ids and English names | B4-2 |
| `apps/web/src/audio/` | Whole folder (`context.ts` is Ionut's, read only) | B4-1, B4-2 |
| `apps/web/src/lamp/` | `LightSurface.tsx`, `LightSurface.module.css`, `LampCounter.tsx`, `pulse.ts`, `useWakeLock.ts` | B4-1 |
| `apps/web/src/time/clockOffset.ts` | Whole file | B4-1 |
| `apps/web/src/phone/Join.tsx`, `SiteView.tsx`, `TopBar.tsx`; `apps/web/src/sites/sites.ts` (`PhoneSite`) | Whole files | B4-1.b |
| `apps/web/src/screen/ScreenPage.tsx`, `ScreenPage.module.css`, `canvas.ts`, `projection.ts`, `useScreenSocket.ts` | Whole files (Cristea's; read only except the lines B4-1.c.1 and B4-2.c.1 name) | B4-1.c, B4-2.c |
| `apps/web/src/i18n/t.ts`, `en.json`, `ro.json` | Whole files | B4-1.b |
| `apps/web/src/components/` | Button, Notice | B4-1.b |
| `apps/web/src/api/client.ts` | `API_URL` | B4-1 |
| `apps/api/src/publish/publish.ts`, `scripts/publish-site.ts`, `apps/api/src/content.ts`, `apps/api/src/db/seed.ts` (`parseSiteFile`), `apps/api/src/agent/persona.ts` (`LANGUAGE_NAMES`) | Whole files | B4-2.a |
| `content/sites/*.yaml` | `persona.voice` | B4-2.a |
| `https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert`, `https://elevenlabs.io/pricing` and the pricing pages it links | Endpoint, limits, price per character for `eleven_v3` | B4-2.a |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Patrick: 1884 finale cue on phones and `/screen`: crackle, silence, waltz, started at a shared server time (fallback if cut: play the waltz on `/screen` only) | 1.5 | B4-1.0, B4-1.a, B4-1.b, B4-1.c |
| Patrick: One Radio Lampa episode, generated once from today's numbers (first to cut) (fallback if cut: skip) | 1 | B4-2.0, B4-2.a, B4-2.b, B4-2.c |
| `DESIGN.md` section 9 item 14: Phone finale, 7.12 (with dips, Patrick's decision hour 37) | 0.25 | B4-1.b |
| `DESIGN.md` section 9 item 19: Radio Lampa label on `/screen`, the side-panel label in 7.13 | 0.1 | B4-2.c |
| Plan section 8: no test is Patrick's | 0 | none |
| Freeze: Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived. | Patrick's checks | B4-3 |
| Freeze: `/screen` runs 30 minutes with sound and no reload, while `simulate-crowd` sends about 2,000 visitors. | Patrick's checks | B4-3 |
| Carried from Build 3 (Patrick, hour 27.5): Build 3 phone checks, webhook transcript, Android lens sounds, Checkpoint 3 run | Patrick's checks | B4-3 |

Total: 2.85 h of tasks in a 3 h block, plus Patrick's phone checks.

Order (all on `patrick/b4-work`): B4-0; the contract seam B4-1.0 (after Fabi's yes) and the seam B4-2.0, both committed by this session; then B4-1.a.1 and B4-2.a.1 in parallel (no shared file; Patrick's decision, hour 37). B4-1.b.1 and B4-1.c.1 follow B4-1.a.1, one after the other, on the same subagent. `patrick/b4-finale` is cut and its PR opened (B4-last) as soon as B4-1 passes. B4-2.c.1 starts after that PR is open (Radio Lampa after the finale, Patrick's decision hour 37) and after B4-1.c.1 (both touch `ScreenPage.tsx` and `ScreenFinale.tsx`). B4-3 runs once `patrick/b4-finale` is deployed.

Seams this session writes and commits before the agents start:

```ts
// packages/shared/src/contract.ts (B4-1.0, after Fabi and the team agree), beside LAMP_TARGET
/** Lead between the trigger and the crackle, so every socket has the message before it starts. */
export const FINALE_LEAD_MS = 4000;
/** `finale` on /live, to every socket, sent once by the trigger (Fabi): `at` is server epoch ms when the crackle starts. */
export const FinaleMessage = z.object({ at: z.number().int() });
export type FinaleMessage = z.infer<typeof FinaleMessage>;
```

```ts
// apps/web/src/audio/clips.ts and apps/api/src/publish/publish.ts (B4-2.0): one optional field
export type ProjectClips = { glass?: string; crackle?: string; chime?: string; waltz: string[]; radio?: string };
```

`toClips(sites, exists, radio?: string)` in `apps/api/src/publish/publish.ts` (B4-2.0) sets `project.radio` when `radio` is given; `scripts/publish-site.ts` passes the `project.radio` of the current `clips.json` when it rewrites the file under `--run` (one line), so a later `publish:site -- --run` never drops the episode.

### 3.1 Subagents

Patrick asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Patrick, re-runs the checks, writes the glossary and does the first and last tasks and the seams. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `patrick-web-audio` | Web Audio player, phone and `/screen` React overlays and hooks, Vitest | opus | reused from Build 3 (documents and scope updated for Build 4) |
| `patrick-elevenlabs` | Radio Lampa script builder, generation CLI, Text to Dialogue docs and price check | opus | reused from Build 3 (documents updated for Build 4) |

`patrick-api` is not used in this block.

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B4-1.a.1 | `patrick-web-audio` | Finale timeline maths and audio player | `apps/web/src/audio/finale.ts`, `apps/web/src/audio/finale.test.ts`, `apps/web/src/audio/room.ts`, `apps/web/src/audio/room.test.ts` | parallel with B4-2.a.1 |
| B4-1.b.1 | `patrick-web-audio` | Phone finale overlay | `apps/web/src/finale/useFinale.ts`, `apps/web/src/finale/PhoneFinale.tsx`, `apps/web/src/finale/PhoneFinale.module.css`, `apps/web/src/finale/finale.test.tsx`, `apps/web/src/phone/Join.tsx` (named lines), `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ro.json` (three keys) | after B4-1.a.1 |
| B4-1.c.1 | `patrick-web-audio` | `/screen` finale sound and DOM layer | `apps/web/src/finale/ScreenFinale.tsx`, `apps/web/src/finale/ScreenFinale.module.css`, `apps/web/src/finale/screenFinale.test.tsx`, `apps/web/src/screen/ScreenPage.tsx` (named lines) | after B4-1.b.1 |
| B4-2.a.1 | `patrick-elevenlabs` | Radio Lampa script builder and CLI | `apps/api/src/publish/radio.ts`, `apps/api/src/publish/radio.test.ts`, `scripts/radio-lampa.ts`, root `package.json` (`radio:lampa` only) | parallel with B4-1.a.1 |
| B4-2.c.1 | `patrick-web-audio` | Radio playback on `/screen`, R key, label | `apps/web/src/audio/radio.ts`, `apps/web/src/audio/radio.test.ts`, `apps/web/src/finale/ScreenFinale.tsx`, `apps/web/src/finale/ScreenFinale.module.css`, `apps/web/src/finale/screenFinale.test.tsx`, `apps/web/src/screen/ScreenPage.tsx` (named lines) | after B4-1.c.1 and once the `patrick/b4-finale` PR is open |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Patrick to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Patrick. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Patrick, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B4-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-check each "Needs from others" item of section 1: Fabi's finale trigger and `demo:reset` (glossary, branches, `git log origin/main`).
- [ ] Ask Ionut for the `Join.tsx` lines and the three i18n keys, and Cristea for the `ScreenPage.tsx` lines (Patrick passes the request). Record each yes under Decisions.
- Done when: the baseline is recorded and failures that were already there are listed, not fixed silently.

### B4-1 1884 finale cue on phones and `/screen` (1.5 h)

#### B4-1.0 The `finale` payload in the contract (this session)

- [ ] Patrick takes `FinaleMessage` and `FINALE_LEAD_MS` (seam above) to Fabi and the team: Fabi's trigger at 731 lamps sends `{ at: serverNow + FINALE_LEAD_MS }` once, to every socket, and never replays it on connect (Patrick's decision, hour 37, Package A). Record the answer.
- [ ] After the yes: commit the seam on `patrick/b4-finale` (`feat(shared) finale message payload`). Hand-offs line for Fabi.
- Verify: `npm run typecheck`. Paste the summary line.
- Done when: `FinaleMessage` is on `patrick/b4-finale` and Fabi knows the payload.

#### B4-1.a Finale timeline and player

**B4-1.a.1** Finale timeline maths and audio player. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/finale.ts`, `apps/web/src/audio/finale.test.ts`, `apps/web/src/audio/room.ts`, `apps/web/src/audio/room.test.ts`.

- [ ] Named constants in `finale.ts` (Patrick's decision, hour 37, Package B): `CRACKLE_MS = 1500`, `CRACKLE_FADE_S = 0.2`, `SILENCE_MS = 2000`, `BURST_AT_MS = 3500` (crackle plus silence), `WALTZ_MS = 45000`, `FINALE_END_MS = 48500`. The waltz is take 1, `clips.project.waltz[0]` (Patrick's decision, hour 37). The crackle is `clips.project.crackle`.
- [ ] `finalePhase(serverNow: number, at: number): { phase: "wait" | "crackle" | "silence" | "burst" | "done"; waltzOffsetMs: number }`: before `at` → `"wait"`; `at` to `at + 1500` → `"crackle"`; to `at + 3500` → `"silence"`; to `at + 48500` → `"burst"` with `waltzOffsetMs = serverNow - (at + 3500)`; at or after `at + 48500` → `"done"`. `waltzOffsetMs` is 0 outside `"burst"`.
- [ ] `finaleClock(offset: number | null, at: number, deviceNow: number, receivedAt: number): number`: the server time to use. With an offset, `deviceNow + offset`. With no offset, the device treats the receipt time as `at - FINALE_LEAD_MS` (Patrick's decision, hour 37): it returns `deviceNow - receivedAt + at - FINALE_LEAD_MS`, so the crackle starts `FINALE_LEAD_MS` after receipt, within network latency of the synced devices. The caller keeps `receivedAt` for this `at`.
- [ ] `preloadFinale(): Promise<void>`: fetches and decodes the crackle and waltz take 1 with `loadBuffer` (cached by URL), once per page; a failed load is retried on the next call. Called when a phone view mounts and on the `/screen` start click (B4-1.b.1, B4-1.c.1).
- [ ] `startFinale(at: number, serverNow: number, opts: { surface: "phone" | "screen" }): { stop(): void }`: schedules on `getAudioContext()` time, never through `playClip` (a later clip must not cut the waltz). Received during `"wait"` or `"crackle"`: crackle from its matching point, gain ramped to 0 over `CRACKLE_FADE_S` at `at + 1500`. Received during `"silence"`: nothing until `at + 3500`. At `at + 3500` or later inside `"burst"`: waltz from `waltzOffsetMs`. `"done"`: nothing. Both sources connect to `ctx.destination`, not to the ambient bus. Phone: `duck("finale", true)` from the start of playback, `duck("finale", false)` when the waltz ends or `stop()` runs. Screen: the room beds go to 0 over 0.5 s at the start and back over 4 s at the end, through a new `setRoomLevel(level: number, seconds: number)` in `room.ts` (a master gain between the room beds and the destination, applied after `ROOM_MASTER`).
- [ ] Each `at` plays once per page: a second `startFinale` with the same `at` returns the first handle and schedules nothing.
- [ ] Never call `resume()` here. If `getAudioContext().state !== "running"` at the burst, `startFinale` reports it (`suspended: true` on the handle) and exposes `resumeWaltz(serverNow)`, which the tap handler of B4-1.b.1 calls after `unlockAudio()` to start the waltz at its current offset.
- [ ] Tests in `finale.test.ts`: each phase boundary (`at - 1`, `at`, `at + 1499`, `at + 1500`, `at + 3499`, `at + 3500`, `at + 48499`, `at + 48500`); `waltzOffsetMs` at `at + 10000` is 6500; `finaleClock` with an offset, and with `null` (received at device time 1000 for `at` 50000: server time 46000 at device time 1000, so the crackle starts at device time 5000); the same `at` twice schedules once (fake context); a message received at `at + 2000` starts no crackle and starts the waltz at `at + 3500`. In `room.test.ts`: `setRoomLevel` ramps the master gain (fake context).
- Verify: `npm test -w @lampa/web -- finale room` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass, and dropping the "once per `at`" rule fails at least one test.

#### B4-1.b Phone finale (DESIGN 7.12, item 14)

**B4-1.b.1** Phone finale overlay. Subagent: `patrick-web-audio`. Files: `apps/web/src/finale/useFinale.ts`, `apps/web/src/finale/PhoneFinale.tsx`, `apps/web/src/finale/PhoneFinale.module.css`, `apps/web/src/finale/finale.test.tsx`, `apps/web/src/phone/Join.tsx` (named lines), `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ro.json`.

- [ ] `useFinale(): FinaleMessage | null` in `useFinale.ts`: its own `/live` socket (`io(`${API_URL}/live`)`, no room query, as `useWhispers` opens its own; Patrick's decision, hour 37), parses `finale` with `FinaleMessage.safeParse` (a failed parse is ignored), returns the latest message whose `finalePhase` is not `"done"`. Disconnects on unmount.
- [ ] `PhoneFinale({ site }: { site?: PhoneSite })`: renders nothing when `site?.is_memorial` (DESIGN 7.11). On mount it calls `startClockOffset()` (Patrick's decision, hour 37: the offset also starts when a non-memorial phone view mounts; `pulse.ts` already keeps one offset per page and is not edited) and `preloadFinale()`. On a message it calls `startFinale(at, finaleClock(offset, at, Date.now(), receivedAt), { surface: "phone" })`.
- [ ] Visual sequence, from `finalePhase` (DESIGN 7.12, with dips, Patrick's decision hour 37): crackle: an overlay of `--bg` over the whole screen (`z-index: var(--z-light)`, 40) dips three times to opacity 0.6 (40% brightness) in 1.5 s, each dip at least 250 ms (DESIGN 5.7), CSS keyframes; silence: the overlay at opacity 1, nothing on screen; burst: `LightSurface` with `pulse={false}` fades in over 800 ms with `t("finale_line")` ("12 November 1884. 731 lamps. Tonight, again.", `--type-title` `--ink-on-light`) and `LampCounter` L, light variant, at 731 of 731; the exit is a quiet Button `t("back_to", { name: siteName(site) })`. A message received late starts at its matching phase.
- [ ] "Back to {Site}" closes the overlay at once; the waltz keeps playing to the end (DESIGN 7.12). At `at + 48500` the overlay leaves with `LightSurface` `leaving` (450 ms) and unmounts.
- [ ] The overlay renders after the view in the DOM, so it covers a lit Lamp (DESIGN 7.7 "731 reached while lit").
- [ ] Reduced motion (`prefers-reduced-motion: reduce`): no dips; the overlay fades to dark over 1500 ms instead (DESIGN 5.6), then the silence and burst as above.
- [ ] Audio suspended at the burst: a Notice (info) with the Button `t("finale_tap_waltz")` ("Tap to hear the waltz"); its tap calls `unlockAudio()` then `resumeWaltz(serverNow)`. The visual plays either way.
- [ ] New i18n keys in `en.json` and `ro.json` (Patrick's decision, hour 37: Romanian drafts that Ionut reviews): `finale_line` (en "12 November 1884. 731 lamps. Tonight, again.", ro "12 noiembrie 1884. 731 de lămpi. În seara asta, din nou."), `finale_tap_waltz` (en "Tap to hear the waltz", ro "Atinge pentru a asculta valsul"), `finale_label` (en "The 1884 moment", ro "Momentul 1884"; the overlay's `aria-label`; Patrick's decision, hour 37). `back_to` is Ionut's key, reused.
- [ ] `Join.tsx` (Ionut's yes, B4-0): one import line, `<PhoneFinale />` (no site) beside the city `<Between from={null} …>` (line 142) and `<PhoneFinale site={site!} />` beside `<SiteView …>` (line 147), each wrapped with its view in a fragment. Not beside `<Memorial>`. No other line changes. `site` is optional on `PhoneFinale`: with no site the exit reads Ionut's `t("back")` ("Back") instead of "Back to {Site}" (Patrick's decision, hour 37).
- [ ] Tests in `finale.test.tsx` (`renderToStaticMarkup`, injected phase): the memorial renders nothing even with a live message (fails when the `is_memorial` check is removed); the burst shows the line, "731 / 731" and the back button; the silence shows nothing but the overlay; reduced motion has no dip class; the suspended state shows "Tap to hear the waltz".
- Verify: `npm test -w @lampa/web -- finale` and `npm run typecheck -w @lampa/web` and `npm run build -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass and the build is clean. The phone look is Patrick's check (B4-3). Do not mark it done.

#### B4-1.c `/screen` finale (sound and DOM layer, Patrick's decision hour 37)

**B4-1.c.1** `/screen` finale sound and DOM layer. Subagent: `patrick-web-audio`. Files: `apps/web/src/finale/ScreenFinale.tsx`, `apps/web/src/finale/ScreenFinale.module.css`, `apps/web/src/finale/screenFinale.test.tsx`, `apps/web/src/screen/ScreenPage.tsx` (named lines).

- [ ] `useScreenFinale(): FinaleMessage | null`: `useFinale()` plus, on mount (which happens after the start click, because `LivingMap` mounts only then), `startClockOffset()` and `preloadFinale()`; on a message, `startFinale(at, finaleClock(offset, at, Date.now(), receivedAt), { surface: "screen" })`.
- [ ] `<FinaleMapLayer finale={…} placed={…} />` inside the `styles.map` div, under the OSM credit (the credit stays visible, DESIGN 7.13): an overlay of `--bg` over the map area; crackle: three dips to opacity 0.6 in 1.5 s, each at least 250 ms; silence: opacity 1 for 2 s; burst: fades to 0 over 800 ms; the canvas is not changed (no window flare, no amber streets: Patrick's decision, hour 37). The overlay leaves a hole over the candle field circle (radius R) and the box of its label exactly as `canvas.ts` places them (read from its code, without changing it), so the candles stay unchanged (DESIGN 5.5, 7.13). Reduced motion: a 1500 ms fade to dark instead of the dips.
- [ ] `<FinalePanel finale={…} />` in the side panel, directly above `<Ticker>`: during the burst, "731 / 731" (`--screen-numeral`, "731" in `--lamp`, "/ 731" in `--text-2`) and "12 November 1884" (`--screen-meta` `--text-2`); English only, as the rest of `/screen`; they fade out over 4 s at `at + 48500` (DESIGN 7.13 "settles back over 4 s").
- [ ] `ScreenPage.tsx` (Cristea's yes, B4-0): one import line, `const finale = useScreenFinale();` in `LivingMap`, the two elements above. No other line changes.
- [ ] Tests in `screenFinale.test.tsx`: the panel lines show only during the burst; the map layer's hole is computed from the Cathedral's placed position (fails when the hole is removed); reduced motion has no dip class.
- Verify: `npm test -w @lampa/web -- finale` and `npm run typecheck -w @lampa/web` and `npm run build -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass and the build is clean. The room check is Patrick's (B4-3). Do not mark it done.

### B4-2 One Radio Lampa episode (1 h, first to cut)

#### B4-2.0 `project.radio` (this session, on `patrick/b4-work`)

- [ ] Commit the `ProjectClips.radio?` seam in both files, the `radio` parameter of `toClips`, the `publish-site.ts` line that passes it (seam above), and one test in `apps/api/src/publish/publish.test.ts`: `toClips(sites, exists, "project/radio-1-abc.mp3").project.radio` is that file, and without the argument there is no `radio` key.
- Verify: `npm test -w @lampa/api -- publish` and `npm run typecheck`. Paste the summary lines. Removing the `radio` line in `toClips` fails the new test (a dry `publish:site` returns before it writes `clips.json`, so it proves nothing here).
- Done when: the seam and its test are committed on `patrick/b4-work`.

#### B4-2.a Script builder and CLI

**B4-2.a.1** Radio Lampa script builder and CLI. Subagent: `patrick-elevenlabs`. Files: `apps/api/src/publish/radio.ts`, `apps/api/src/publish/radio.test.ts`, `scripts/radio-lampa.ts`, root `package.json` (`radio:lampa` only).

- [ ] Docs check first: the price per character of Text to Dialogue with `eleven_v3` on the pricing pages. If it is not 1 credit per character (`CREDITS_PER_CHAR`), stop the credit estimate and report the number under Blocked; carry on with the rest.
- [ ] `radioScript(summary: PulseSummary, languages: PulseLanguages, voices: Record<string, string>): { inputs: { text: string; voice_id: string }[]; chars: number }` in `radio.ts`, English only (Patrick's decision, hour 37, Template C without the echo line). Names are the English names from `packages/shared/sites.json`. Lines in this order:
  1. mx: "Good evening, this is Radio Lampa, from the museum. Today {visitorsToday} people came by and caught {coloursToday} colours." ("1 person came by", "1 colour" for 1.)
  2. unirii, or victoriei when unirii is the busiest: "{Busiest} was the brightest of us tonight. Show-off." Busiest is the site with the highest `glow` in `summary.glow` (the first in file order on a tie). When every glow is 0 the line is skipped (Patrick's decision, hour 37).
  3. victoriei: when `lampsToday >= LAMP_TARGET`: "{lampsToday} lamps lit today. In 1884 it took 731. Tonight, again."; otherwise "{lampsToday} lamps lit today. {LAMP_TARGET - lampsToday} short of 1884. Tomorrow."
  4. bastion: "Most of you spoke {Language} to us." with the first entry of `languages.languages` named by `LANGUAGE_NAMES`; skipped when the list is empty or the code is not in `LANGUAGE_NAMES`.
  5. mx: "Good night, Timișoara. Keep us lit."
  The Cathedral is never named. `voices` comes from `persona.voice` of the four site files; a missing voice throws `missing voice <id>`.
- [ ] `scripts/radio-lampa.ts`, root script `"radio:lampa": "tsx --env-file-if-exists=.env scripts/radio-lampa.ts"` (Package D, Patrick's decision hour 37). Flags: `--api <url>` (default `https://lampa-api-b45i.onrender.com`), `--run`, `--max-credits <n>` (default 2000). It fetches `GET /pulse/summary` and `GET /pulse/languages`, parses them with the contract schemas (a failed fetch or parse prints the status and exits 1), reads the voices with `parseSiteFile`, and builds the script.
- [ ] Dry run (default): prints each line as `<site id>: <text>`, then `chars <n>`, `estimate <n> credits`. No ElevenLabs call, no key needed.
- [ ] `--run`: stops with exit 1 if the estimate is above `--max-credits` or above 2,000 characters; otherwise `POST /v1/text-to-dialogue?output_format=mp3_44100_128` with `model_id: "eleven_v3"`, 180 s timeout, writes `apps/web/public/audio/project/radio-1-<hash>.mp3` (the hash as `publish.ts` names its files: first 12 hex of sha256), and sets `project.radio` in `apps/web/src/audio/clips.json`, leaving every other key as it is. Prints the file name and the estimate only, never a key or a response body; a non-200 prints the status and exits 1.
- [ ] Tests in `radio.test.ts` (fixtures, no network): the full five lines; unirii busiest → victoriei says line 2; every glow 0 → line 2 skipped; lamps at 731 and at 721; empty languages → line 4 skipped; unknown language code → skipped; 1 visitor and 1 colour singular; no line contains "Cathedral"; missing voice throws; `chars` equals the summed text length.
- Verify: `npm test -w @lampa/api -- radio`, `npm run typecheck -w @lampa/api`, and `npm run radio:lampa` (dry run against the deployed API). Paste the summary lines and the dry-run output.
- Done when: the tests pass and the dry run prints the script and an estimate under 2,000 credits. Removing the zero-glow skip fails a test.

#### B4-2.b The episode (Patrick)

- [ ] Patrick runs `npm run radio:lampa` (dry), reads the script, then `npm run radio:lampa -- --run` once, before the pitch, after the demo numbers are in (Package D). Patrick listens. This session commits the MP3 and `clips.json` on a branch and opens a PR. Patrick's check. Do not mark it done.
- Done when: the file is on `main` and Patrick has heard it.

#### B4-2.c Playback on `/screen` and the label (DESIGN item 19)

**B4-2.c.1** Radio playback on `/screen`, R key, label. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/radio.ts`, `apps/web/src/audio/radio.test.ts`, `apps/web/src/finale/ScreenFinale.tsx`, `apps/web/src/finale/ScreenFinale.module.css`, `apps/web/src/finale/screenFinale.test.tsx`, `apps/web/src/screen/ScreenPage.tsx` (named lines).

- [ ] `radio.ts`: `playRadio(): Promise<"ended" | "stopped" | "failed" | "none">` plays `clips.project.radio` through `getAudioContext()` to `ctx.destination` with its own source (not `playClip`); `"none"` when `project.radio` is absent. While it plays, `setRoomLevel(DUCK_GAIN, 0.2)`, back to 1 over 0.8 s at the end. `stopRadio()`. `isRadioPlaying()`.
- [ ] In `ScreenFinale.tsx`, `FinalePanel` also listens for the R key (`r` or `R`, `keydown` on `window`): starts `playRadio()`; pressed while the episode plays → nothing; the listener exists only while `LivingMap` is mounted, so R before the start click does nothing (Patrick's decision, hour 37). A `finale` message arriving while the episode plays calls `stopRadio()` (same decision).
- [ ] While it plays, "Radio Lampa" shows above the Ticker in the same slot as the finale lines (`--screen-meta` `--text-2`, the side panel's label style in 7.13); no captions (DESIGN 7.13). No visible button.
- [ ] `ScreenPage.tsx`: no new line beyond B4-1.c.1's; if one is needed, stop and report.
- [ ] Tests: `playRadio` resolves `"none"` with no file; a second R while playing starts nothing; the label shows only while playing; a finale stops the episode.
- Verify: `npm test -w @lampa/web -- radio finale` and `npm run typecheck -w @lampa/web` and `npm run build -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass and the build is clean.

### B4-3 Phone and room checks (Patrick and Ionut; never cut)

Each line is Patrick's or Ionut's check. Do not mark it done.

- [ ] Carried from Build 3 on the deployed `main`, iPhone (Patrick): B3-1.e (Lamp raise, light, lower), B3-2.a (two phones pulse together; steady with reduced motion), B3-3.d (headphones, `/s/mx?demo=1` → Next site → Piața Unirii), B3-4.e (one live Talk smoke test plus one retry: tools and the webhook row, Fabi checks the stored transcript), B3-5.a (`/screen` room sound on speakers; if silent after the start click, `unlockAudio()` moves into Cristea's click handler, one line, her yes), B3-6.b (an echo whisper on iOS).
- [ ] Android (Ionut): B3-1.e and the lens tone, clink and chord.
- [ ] Checkpoint 3 steps 1:40 and 2:00, twice from a cold start.
- [ ] Finale, once Fabi's trigger is deployed (nothing sends `finale` before it; `npm run simulate:crowd -- --api https://lampa-api-b45i.onrender.com --lamps` then brings the count to 731 to fire it): iPhone and Android on a site view, one with the Lamp lit, and `/screen` together: crackle, silence and waltz start together; "Back to {Site}" leaves the waltz playing; the memorial view stays silent and unchanged; the `/screen` candle field stays unchanged.
- [ ] Radio Lampa on `/screen` speakers: R plays it, the label shows, room beds duck.
- [ ] Freeze lines: the full demo script twice on each phone; `/screen` 30 minutes with sound and no reload under `simulate-crowd` with about 2,000 visitors.

### B4-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch, `npm test` and the other verify scripts green on it.
- [ ] Cut each PR branch from `origin/main` and fill it by cherry-pick from `patrick/b4-work`: `patrick/b4-finale` (B4-1.0 and B4-1) as soon as B4-1 passes; `patrick/b4-radio` (B4-2.0 and B4-2) after `patrick/b4-finale` is merged. Push each and open its PR. Each PR lists what was verified and what is waiting for a phone.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists `FinaleMessage`, `FINALE_LEAD_MS`, `useFinale`, `PhoneFinale`, `setRoomLevel`, `npm run radio:lampa`.
- [ ] Patrick's checks on real phones, listed and not claimed: B4-3.
- Done when: every box is ticked or listed as Patrick's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: Fabi's finale trigger and `demo:reset`; the team's speech-clip content; Ionut's review of the three Romanian drafts.
- **Not finished at 20:51 (clock hour 31.5):** each ID, what is left, and its place in the cut order.
- **Phone checks for Patrick:** what you could not run here.
- **For the freeze:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 4: demo extras

- A `finale` message plays crackle, silence and waltz take 1 at the shared server time on every non-memorial phone view and on `/screen`, or the finale plays on `/screen` alone (cut order 3) and the glossary says so.
- The memorial view and the `/screen` candle field are unchanged by the finale.
- One Radio Lampa episode is on `main` and plays on `/screen` with the R key and its label, or it is cut (cut order 1) and the glossary says so.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `patrick/GLOSSARY.md` matches the state of the branch.
- `IMPLEMENTATION_PLAN.md` is unchanged by this block: every answer changes `DESIGN.md` details or Patrick's own earlier decisions, not a plan row (Changes lines in the glossary).

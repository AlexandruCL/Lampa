# Prompt: Patrick's Build 3: Echo, navigation, Lamp, Pulse, sign-in (Patrick, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 23.8 (2026-11-14 13:11 +0200). Implementation not started.**

You are implementing Patrick's part of Build 3: Echo, navigation, Lamp, Pulse, sign-in (hours 25 to 32 in the plan; Patrick runs it from hour 24 to hour 31, 13:21 to 20:21 on 2026-11-14) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Build 3 no goal sentence. Its title is *Echo, navigation, Lamp, Pulse, sign-in*.

Checkpoint this block must pass: *Run the demo script from section 10.4, steps 0:00 to 1:40 plus the Pulse step and the memorial step from the v5 addendum, twice from a cold start, with the crowd simulator running. Write down every break. Fix it, or cut the feature and adjust the script. Then decide which Build 4 rows to attempt, using the cut order in section 7.* For this lane that means step 1:40 of concept 10.4: *No map: the judge turns toward the Piața Unirii poster across the room and the bells come into focus; the arrow card agrees.* Step 2:00 (lamps fill, the counter) runs in the same rehearsal with `simulate:crowd -- --lamps`.

## 0. Ground rules

- **Patrick takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Patrick, with your recommendation. Nothing uses the recommendation until Patrick answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask. Known differences, all Patrick's decisions at hour 24 and listed under Changes in the glossary: the three client tools moved from Build 2 are built here (plan updated, hour 24); the room sound plays each bed at `glow × 0.8`, not at `glow`; whispers read a new public route that is not in the contract yet (B3-6, Blocked on the team).
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block runs from hour 24 to hour 31 (Patrick's decision, hour 24).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Patrick: carrying on, cutting (plan section 7) or moving it is their decision. The block holds 10.25 h of work in 7 h. Patrick's order and cut line (hour 24): build in the order of section 3; when late, cut first the echo whispers (B3-6, cut order item 6), then the sound compass for several sites (B3-3.b's compass voices, cut order item 7; the single beacon stays).
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Patrick, who takes it to the team. When another lane's endpoint has not landed, code against its schema. This block adds one schema, `ApprovedEchoes` (B3-6.0), only after Cristea and the team agree.
- The server sets event weights. The client never sends one. The Lamp sends `lamp` through `track(kind, siteId)`; nothing else in this block sends events.
- No library beyond plan section 3 without Patrick's approval. Approved: none in this block. Web Audio API directly; Screen Wake Lock, DeviceOrientation and `navigator.vibrate` are browser APIs.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. **`ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` never appear in the chat, in a commit, in a glossary line or in command output** (Patrick's decision, hour 5). Do not open, print or `cat` the root `.env`. Scripts print statuses, file names, credit numbers, names and `true` or `false`.
- `main` deploys by itself. The `patrick/` docs commit (this prompt, the glossary, the plan update) goes straight to `main`, as in earlier blocks. After it, all work happens on the local branch `patrick/b3-work`, which is never pushed. Three PR branches, each cut from `origin/main` after the previous one is merged and filled by cherry-pick (Patrick's decision, hour 24): `patrick/b3-lamp` (B3-1, B3-2), then `patrick/b3-nav` (the audio-bus seam, B3-3, B3-4), then `patrick/b3-screen` (B3-5, B3-6). One small PR per branch. Open it only after the verify commands pass. Cristea merges every team PR. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- **Live ElevenLabs calls cost credits.** No paid generation in this block: the compass, beacon and room sound reuse the beds, the whispers play visitor echoes, the Lamp plays the crackle already made. One live Talk smoke test by Patrick on the iPhone after `patrick/b3-nav` is merged, plus one retry after a fix (B3-4.e; Patrick's decision, hour 24). No agent makes a live call.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. No Lamp, no LampCounter, no whisper there. It is in the sound compass like any site; arriving there plays no chime and fades the beacon out over 3 s (DESIGN 5.8).
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/` (`apps/web/src/styles/tokens.css` and `apps/web/src/components/`). Do not add a colour, font or spacing value that is not a token. The one value that is not a token is the pulse's darkest point `#E2D9C8`, which DESIGN 6.14 gives as a result of the `--bg` overlay at 0.12, not a new colour.
- Write in `patrick/` only. Other members' folders are read-only. Files outside the lane that this prompt lets you touch, each only after its owner agrees and each with a Changes line: Ionut's `apps/web/src/phone/SiteView.tsx`, `Between.tsx`, `useSiteGlow.ts`; Cristea's `apps/web/src/screen/ScreenPage.tsx` (one hook line) and `apps/api/src/echoes/router.ts` (the approved route); `packages/shared/src/contract.ts` (`ApprovedEchoes`, after the team agrees); `apps/api/src/content.ts` (`persona.archive`); `IMPLEMENTATION_PLAN.md` (the hour-24 update, already in the docs commit).
- **Keep `patrick/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Patrick a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 23.6 to 23.8, 2026-11-14 12:57 to 13:11 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Patrick's Build 2 is closed (glossary Done "Build 2", hour 13): #38, the note PR and #43 merged. `main` is at `b579612`, `git status` clean, `git pull` up to date, no open PRs.
- Carried from Build 2, under Blocked: Ionut's Android check of the lens tone, clink and chord; one live Talk session to see the webhook store a transcript. Both go into B3-4.e and B3-last.
- Blocked row B1-1.b is answered: Fabi's `npm run db:seed` (Hand-offs, Fabi hour 12) upserts the sites without touching events, and at 13:05 the deployed `GET /agent/session?site=unirii&lang=en` returned `overrides` present and a signed URL (booleans read only). B3-0 removes the row.
- Content: only `02-unirii.yaml` has persona text and `tap_to_ask`. Every site file has `facts: []` and `directions_hint: {}`. No narrations, no archive images. The speech-clip Blocked row (hour 9) stays open; it is the team's.
- `apps/web/src/audio/engine.ts`: one bed at a time (`current`), wired `source → gain → ctx.destination`; `load(url)` is private; `healStep` rebuilds only `current` after the page returns. `clip.ts`: `playClip(file, inTap)`, `stopClip()`. `note.ts`: lens sounds. `clips.json` has the beds, the four project sounds (crackle, chime, glass, waltz) and unirii's clips; `clips.ts` `SiteClips` has no `archive` field. `useBed(siteId, glow)` always plays while `SiteView` is mounted, so today the site bed keeps playing in Between sites.
- `apps/web/src/talk/`: `Talk.tsx` (props `site`, `demo`, `remote`, `mic`, `onBack`, `panes`, `addPane`), `useLiveTalk.ts` (client tools `set_light`, `start_colour_catch`), `tools.ts`, `Captions.tsx`. The live persona plays through the SDK's own audio, not our context, so the duck is driven by `isSpeaking` and by `playClip`.
- Ionut (Hand-offs, hour 25 in his glossary): `Between` (`from`, `primer`, `demo`, `remote`, `notice?`, `onBack?`, `onTarget?(siteId)`, `onArrive?(siteId)`, never for the memorial); it has no prop to open on a chosen site. It holds `position` (`useGeolocation`), `heading` (`useCompass`, `blendHeading`), the shown site and the `audioOff` "Tap to listen again" Notice. It is rendered in two places: `SiteView.tsx` (view `between`) and `Join.tsx` line 97 (`/`). `suggestNext({ sites, position, glow, visited })` in `apps/web/src/nav/score.ts`; `bearingDeg`, `haversineM` in `apps/web/src/geo/geo.ts`; `relativeAngle` in `nav/format.ts`. `EchoRecorder` (`site`, `demo`, `prompt?`, `onBack`, `onSent?`) opens from `SiteView` through `echoPrompt` and `view = "echo"`. `SiteView`'s "Raise a lamp" button has no `onClick`. `requestCompass()` in `sensors/primer.ts` asks for the iOS motion permission; the demo primer skips it.
- Fabi: `lamps` on `/live` to every socket (`LampsMessage` `{ litToday, target: 731, sites: [{ siteId, lightingNow }] }`, four lamp sites; `litToday` counts `lamp` events since local midnight; `lightingNow` = distinct sessions with a `lamp` at the site in the last 90 s). Nothing on the phone reads it yet. `GET /time` and `getClockOffset()` (`apps/web/src/time/clockOffset.ts`, 5 pings, lowest RTT, null when every ping failed). `npm run simulate:crowd -- --lamps --candles <n>`. `POST /events` stores `lamp` with weight 2 and skips a `lamp` at the memorial. This answers the plan's "the clock offset and the per-site lamp count from Fabi in Build 3".
- Ionut's heading and position hooks are on `main` (Needs from others, hour 25): landed.
- Cristea: `echo_approved` on `/live`, rooms `screen` and `site:<id>` (`EchoApprovedMessage` `{ echoId, siteId, audioUrl, transcript, lang }`); `GET /blob/:key` public once approved (`audioUrl` is relative to the API). No route lists approved echoes for a site (B3-6.0). `/screen` (`ScreenPage.tsx`) has the "Start the Living Map" click and plays no audio; `apps/web/src/screen/projection.ts` projects the sites.
- Not there yet, added by this block: `apps/web/src/lamp/` (B3-1, B3-2), `apps/web/src/audio/bus.ts` (B3-0 seam), `apps/web/src/audio/navMaths.ts`, `nav.ts` (B3-3), `apps/web/src/audio/room.ts` (B3-5), `apps/web/src/audio/whisper.ts` (B3-6), `apps/web/src/talk/Archive.tsx` (B3-4), the `persona.archive` key (B3-4.a), `GET /echoes/approved` (B3-6.0), the three client tools on the agent (B3-4.d).
- Scripts used here: `npm test`, `npm run typecheck`, `npm run build`, `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`, `npm test -w @lampa/api`, `npm run typecheck -w @lampa/api`, `npm run publish:site`, `npm run agent:check`, `npm run simulate:crowd`, `npm run db:seed`.
- Deployed: web https://lampa-timisoara.vercel.app → 200; API https://lampa-api-b45i.onrender.com/health → `{"ok":true}` (12:58).
- Patrick's phone: an iPhone. Ionut's Android for Android checks. `gh` is at `C:\Program Files\GitHub CLI\gh.exe`.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 3, Patrick's rows and Checkpoint 3 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Patrick's table and "Needs from others"; section 7, cut order and "The memorial site" | All |
| `patrick/GLOSSARY.md` | Whole file | All |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | 7.6 "Direction and sound, in a few lines" (printed pages 24 to 25); S3 Relight 1884 (page 22); 11.1 client tools (pages 39 to 40) | B3-1, B3-3, B3-4 |
| `DESIGN.md` | 5.2 (lamp pulse row), 5.6, 5.7, 5.8; 6.3 Ring, 6.13 LampCounter, 6.14 LightSurface; 7.2 Site view; 7.3 Talk; 7.4 Archive image; 7.7 Lamp; 7.8 Between sites; 7.11 (sound rule only); 7.13 (room sound lines only) | B3-1 to B3-6 |
| `packages/shared/src/contract.ts`, `sites.ts` | `EventIn`, `LampsMessage`, `LAMP_TARGET`, `TimeNow`, `EchoApprovedMessage`, `SocketMessage`, `Site` | B3-1, B3-2, B3-6 |
| `apps/web/src/audio/` | Whole folder (`context.ts` is Ionut's, read only) | B3-1, B3-3, B3-4, B3-5, B3-6 |
| `apps/web/src/talk/` | Whole folder | B3-3.c, B3-4 |
| `apps/web/src/phone/SiteView.tsx`, `Between.tsx`, `Join.tsx`, `useSiteGlow.ts`, `useCityGlow.ts`, `TopBar.tsx`, `EchoRecorder.tsx`, `Sheet.tsx` | Whole files | B3-1, B3-3, B3-4, B3-6 |
| `apps/web/src/sensors/primer.ts`, `useCompass.ts`, `heading.ts`, `demo.ts`; `apps/web/src/geo/geo.ts`; `apps/web/src/nav/score.ts`, `format.ts`; `apps/web/src/time/clockOffset.ts`; `apps/web/src/events/index.ts` | Whole files | B3-1, B3-2, B3-3, B3-4 |
| `apps/web/src/components/` | Button, Notice, Ring, Icon and `components.test.tsx` | B3-1, B3-4 |
| `apps/web/src/screen/ScreenPage.tsx`, `projection.ts`, `useScreenSocket.ts` | Whole files | B3-5 |
| `apps/api/src/content.ts`, `apps/api/src/agent/persona.ts`, `apps/api/src/publish/publish.ts` with their tests | Whole files | B3-4.a, B3-4.b |
| `apps/api/src/echoes/router.ts` and its test | Whole file | B3-6.a |
| Root `package.json`, `apps/web/package.json`, `apps/api/package.json` | Scripts and dependencies | All |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Lamp: raise gesture (pitch above 60 degrees for 1.5 s, below 40 to lower), full-screen light, Wake Lock, `lamp` events per minute held, city counter and "people lighting this site now" | 2 | B3-1.a, B3-1.b, B3-1.c, B3-1.d |
| Section 11: Lamp: raise gesture, Wake Lock, `lamp` events, city counter, people lighting now | same 2 | as above |
| Section 6: Lamp pulse: every lit phone pulses on a slow 4 s cycle aligned to server time through the clock offset | 0.5 | B3-2.a |
| Section 11: Lamp pulse on the shared clock | same 0.5 | as above |
| Section 6: Navigation audio: sound compass for the 2 to 3 nearest sites (HRTF panner from bearing minus heading, low-pass by distance), beacon for the chosen site, arrival chime, 12 dB ducking under the persona voice | 3.5 | B3-0 (bus seam), B3-3.a, B3-3.b, B3-3.c, B3-3.d |
| Section 11: Navigation audio: sound compass, beacon, chime, ducking | same 3.5 | as above |
| Section 6: Approved echoes play as whispers from the site's direction | 1 | B3-6.0, B3-6.a, B3-6.b |
| Section 11: Echo whispers from the site's direction | same 1 | as above |
| Section 6: Room sound on `/screen`: each bed at gain equal to glow, panned by map position | 1.5 | B3-5.a |
| Section 11: Room sound on `/screen` | same 1.5 | as above |
| Section 6: Talk client tools moved from Build 2: `show_archive_image` (images listed under `persona.archive` in the site files), `start_echo_recording`, `suggest_next_site` (Patrick, hour 24) | 0 in the plan (inside the Build 2 Talk row); 1 h estimated | B3-4.a, B3-4.b, B3-4.c, B3-4.d, B3-4.e |
| Section 11: Talk client tools moved from Build 2: archive image, echo recording, next site (Patrick, hour 24) | same | as above |
| Section 8 tests owned by Patrick | none | none (section 8 lists none for Patrick; this block adds unit tests anyway, B3-1.a, B3-2.a, B3-3.a, B3-4, B3-5.a, B3-6) |
| `DESIGN.md` 9, item 9: Lamp station: LightSurface, LampCounter, presence line, synchronised pulse. 7.7 instruction, lit, presence line states, pulse in phase (steady when no offset), 0.75 h, required (demo 2:00) | 0.75 (slack) | B3-1.b, B3-2.a |
| `DESIGN.md` 7.2: LampCounter S on the Site view (lamp sites only) | in B3-1 | B3-1.d |
| Checkpoint 3, step 1:40: No map: the judge turns toward the Piața Unirii poster across the room and the bells come into focus; the arrow card agrees. | in B3-3 | B3-3.b, B3-3.d; run at B3-last |
| Checkpoint 3, step 2:00 (lamps fill, the counter; the finale itself is Build 4) | in B3-1 | B3-1.c, B3-1.d; run at B3-last |
| Carried from Build 2: Android lens sounds; webhook stores a transcript | 0 | B3-4.e, B3-last |

Total: 8.5 h of plan tasks, 1 h of moved tools and 0.75 h of styling, 10.25 h in a 7 h block. Cut line above (ground rules).

Order: B3-0 and the seams first. Then in parallel: stream L (one `patrick-web-audio` agent: B3-1.a.1 → B3-1.b.1 → B3-2.a.1) and stream N (a second `patrick-web-audio` agent: B3-3.a.1 → B3-3.b.1 → B3-3.c.1), with `patrick-api` on B3-4.a.1 and `patrick-elevenlabs` on B3-4.b.1 at the same time (API files only). Then B3-1.c.1 and B3-1.d.1 (Ionut's files, after his yes), `patrick/b3-lamp` PR. After it merges: B3-4.c.1 (Talk tools), B3-3.d.1 (Between and Site view wiring), B3-4.d (Patrick adds the tools in the dashboard), `patrick/b3-nav` PR, then B3-4.e on the deployed build. Then B3-5.a.1 and, once the team has agreed B3-6.0, B3-6.a.1 and B3-6.b.1, `patrick/b3-screen` PR.

Seams, committed by this session on `patrick/b3-work` before any agent starts:

```ts
// apps/web/src/audio/bus.ts (owner: this session; used by engine.ts, nav.ts, whisper.ts; driven by Talk)
import { getAudioContext } from "./context";

export const DUCK_GAIN = 0.25; // −12 dB
export const DUCK_ATTACK_S = 0.2;
export const DUCK_RELEASE_S = 0.8;

let bus: GainNode | undefined;
const holds = new Set<string>();

/** The ambient bus: beds, compass, beacon and whispers connect here, never to destination. */
export function ambientBus(): GainNode {
  if (!bus) {
    const ctx = getAudioContext();
    bus = ctx.createGain();
    bus.connect(ctx.destination);
  }
  return bus;
}

/** Duck the ambient bus while any holder ("live", "clip") is on. */
export function duck(holder: string, on: boolean): void {
  const before = holds.size > 0;
  if (on) holds.add(holder);
  else holds.delete(holder);
  const after = holds.size > 0;
  if (before === after) return;
  const g = ambientBus().gain;
  const t = getAudioContext().currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(after ? DUCK_GAIN : 1, t + (after ? DUCK_ATTACK_S : DUCK_RELEASE_S));
}
```

and in `apps/web/src/audio/engine.ts`: `load` exported as `loadBuffer` (same body; its one caller renamed), and `connect()` connects to `ambientBus()` in place of `ctx.destination`.

```ts
// apps/web/src/audio/clips.ts: one new field on SiteClips (owner: this session; filled by B3-4.b.1)
export type ArchiveImage = { id: string; file: string; alt: Record<string, string>; credit: string; year: string };
export type SiteClips = {
  beds: string[];
  greeting: Record<string, string>;
  answers: Record<string, Record<string, string>>;
  narrations: Record<string, Record<string, string>>;
  tapToAsk: { id: string; q: Record<string, string>; a: Record<string, string> }[];
  archive: ArchiveImage[]; // persona.archive, file order; `file` is relative to /archive/
};
```

and `"archive": []` added by hand to each of the five sites in `clips.json`, and to the `site()` fixture in `apps/web/src/audio/engine.test.ts`.

```ts
// apps/web/src/phone/Between.tsx: one new optional prop (owner: B3-3.d.1, after Ionut agrees)
initialTarget?: string; // the site suggest_next_site chose; used as the first targetId
```

### 3.1 Subagents

Patrick asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Patrick, re-runs the checks, writes the glossary and does the first and last tasks, the seams and the dashboard read. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `patrick-web-audio` | Web Audio, the Lamp, Talk and navigation sound in `apps/web`, their hooks and Vitest tests | opus | reused from Build 2; scope widened to `apps/web/src/lamp/`, the room sound and the lines of `Between.tsx`, `useSiteGlow.ts` and `ScreenPage.tsx` its tasks name |
| `patrick-api` | Express routes, the persona renderer and the content schema in `apps/api`, with Vitest tests | opus | reused from Build 1; scope widened to `apps/api/src/echoes/router.ts` (the approved route only) |
| `patrick-elevenlabs` | Publish code (`apps/api/src/publish/`) and its tests | opus | reused from Build 2 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B3-1.a.1 | `patrick-web-audio` | Lamp maths and hooks | `apps/web/src/lamp/lampMaths.ts`, `lampMaths.test.ts`, `usePitch.ts`, `useWakeLock.ts`, `useLampEvents.ts` | parallel with B3-3.a.1, B3-4.a.1, B3-4.b.1 |
| B3-1.b.1 | `patrick-web-audio` | Lamp view, LightSurface, LampCounter | `apps/web/src/lamp/Lamp.tsx`, `Lamp.module.css`, `LightSurface.tsx`, `LightSurface.module.css`, `LampCounter.tsx`, `LampCounter.module.css`, `lamp.test.tsx`, `presence.ts`, `presence.test.ts` | after B3-1.a.1 |
| B3-2.a.1 | `patrick-web-audio` | Pulse in phase | `apps/web/src/lamp/pulse.ts`, `pulse.test.ts`, `LightSurface.tsx`, `LightSurface.module.css` | after B3-1.b.1 |
| B3-1.c.1 | `patrick-web-audio` | `lamps` folded into `useSiteGlow` | `apps/web/src/phone/useSiteGlow.ts` | after B3-2.a.1 and Ionut's yes |
| B3-1.d.1 | `patrick-web-audio` | Lamp wiring in the Site view | `apps/web/src/phone/SiteView.tsx` | after B3-1.c.1 |
| B3-3.a.1 | `patrick-web-audio` | Navigation maths | `apps/web/src/audio/navMaths.ts`, `navMaths.test.ts` | parallel with stream L |
| B3-3.b.1 | `patrick-web-audio` | Navigation voices | `apps/web/src/audio/nav.ts`, `useNavAudio.ts`, `apps/web/src/audio/useBed.ts` | after B3-3.a.1 |
| B3-3.c.1 | `patrick-web-audio` | Ducking in Talk | `apps/web/src/talk/Talk.tsx`, `apps/web/src/talk/useLiveTalk.ts` | after B3-3.b.1 |
| B3-4.a.1 | `patrick-api` | `persona.archive` schema and prompt lines | `apps/api/src/content.ts`, `apps/api/src/agent/persona.ts`, `persona.test.ts` | parallel with streams L and N |
| B3-4.b.1 | `patrick-elevenlabs` | `archive` copied into `clips.json` | `apps/api/src/publish/publish.ts`, `publish.test.ts` | parallel with streams L and N (after B3-0's seams) |
| B3-4.c.1 | `patrick-web-audio` | The three client tools and the archive card | `apps/web/src/talk/tools.ts`, `tools.test.ts`, `useLiveTalk.ts`, `Talk.tsx`, `Captions.tsx`, `Captions.module.css`, `Archive.tsx`, `Archive.module.css`, `talk.test.tsx` | after `patrick/b3-lamp` merges and B3-3.c.1 |
| B3-3.d.1 | `patrick-web-audio` | Between and Site view wiring for nav and tools | `apps/web/src/phone/Between.tsx`, `SiteView.tsx` | after B3-4.c.1 and Ionut's yes |
| B3-5.a.1 | `patrick-web-audio` | Room sound on `/screen` | `apps/web/src/audio/room.ts`, `room.test.ts`, `apps/web/src/screen/ScreenPage.tsx` (one hook line) | after `patrick/b3-nav` merges and Cristea's yes |
| B3-6.a.1 | `patrick-api` | `GET /echoes/approved` | `apps/api/src/echoes/router.ts`, `router.test.ts` (the new route's tests only) | after B3-6.0; parallel with B3-5.a.1 |
| B3-6.b.1 | `patrick-web-audio` | Whispers on the phone | `apps/web/src/audio/whisper.ts`, `whisper.test.ts`, `useWhispers.ts`, `apps/web/src/phone/SiteView.tsx`, `Between.tsx` (one hook line each) | after B3-6.a.1 and B3-5.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Patrick to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Patrick. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Patrick, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B3-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-check each "Needs from others" item of section 1: `lamps` and `GET /time` on the deployed API; Ionut's `Between` props unchanged.
- [ ] Push the docs commit (this prompt, the glossary, the two plan rows) to `main` and tell Patrick the team needs to see the plan rows.
- [ ] The glossary's Blocked row B1-1.b is removed (answered, section 1; done in the docs commit).
- [ ] Ask Patrick to ask Ionut for the lines in `SiteView.tsx`, `Between.tsx`, `useSiteGlow.ts`, and Cristea for the `ScreenPage.tsx` line and B3-6.0. Record each answer.
- [ ] Commit the seams above on `patrick/b3-work`: `bus.ts`; `loadBuffer` and `ambientBus()` in `engine.ts`; `ArchiveImage` and `archive` in `clips.ts`, `clips.json` and the `engine.test.ts` fixture. Verify `npm run typecheck -w @lampa/web` exit 0 and `npm test -w @lampa/web` passing.
- Done when: the baseline is recorded, failures that were already there are listed, not fixed silently, and the seams are committed.

### B3-1 Lamp (2 h)

#### B3-1.a Raise gesture, events and Wake Lock (logic)

**B3-1.a.1** Lamp maths and hooks. Subagent: `patrick-web-audio`. Files: `apps/web/src/lamp/lampMaths.ts`, `lampMaths.test.ts`, `usePitch.ts`, `useWakeLock.ts`, `useLampEvents.ts`.

- [ ] `lampMaths.ts`: `RAISE_DEG = 60`, `LOWER_DEG = 40`, `RAISE_HOLD_MS = 1500`, `LOWER_HOLD_MS = 500`, `LAMP_EVENT_MS = 60000` (Patrick's decisions, hour 24).
- [ ] `pitchFromBeta(beta: number | null): number | null`: `b = Math.abs(beta)`, then `b > 90 ? 180 - b : b`, giving 0 to 90; null stays null.
- [ ] `stepRaise(state, pitch, nowMs)`: a pure state machine with states `down` (with `aboveSince`), `lit` (with `belowSince`). `down` → `lit` once the pitch has stayed at or above `RAISE_DEG` for `RAISE_HOLD_MS`; a pitch under `RAISE_DEG` resets `aboveSince`. `lit` → `down` once the pitch has stayed under `LOWER_DEG` for `LOWER_HOLD_MS`; a pitch at or above `LOWER_DEG` resets `belowSince`. Returns the state and `progress` 0..1 of the raise hold for the Ring.
- [ ] `usePitch()`: listens to `deviceorientation` and returns `{ pitch, available }`; `available` false when no event with a non-null `beta` has arrived within 1 s of mount.
- [ ] `useLampEvents(siteId, lit)`: on `lit` becoming true calls `track("lamp", siteId)` once, then every `LAMP_EVENT_MS` while lit; clears the timer when lit ends or on unmount. The offline queue of `track` covers reconnects.
- [ ] `useWakeLock(on)`: `navigator.wakeLock.request("screen")` when `on`; releases when off; re-requests on `visibilitychange` to visible while on; a refusal or a missing API is ignored (DESIGN 6.14 "works anyway").
- [ ] Tests in `lampMaths.test.ts`: `pitchFromBeta` for −120, −30, 0, 45, 90, 135, null; `stepRaise` lights at exactly 1500 ms above 60 and not at 1499; a dip to 59 resets the hold; 40 is not "below"; lowers at 500 ms under 40; progress 0, 0.5, 1. `useLampEvents` timer maths through an exported `lampEventDue(litAtMs, sentCount, nowMs)`: due at 0, not at 59,999, due at 60,000.
- Verify: `npm test -w @lampa/web -- lamp` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass, and changing `RAISE_HOLD_MS` or the `< LOWER_DEG` comparison fails a test.

#### B3-1.b Lamp view (screen and styling)

**B3-1.b.1** Lamp view, LightSurface, LampCounter. Subagent: `patrick-web-audio`. Files: `apps/web/src/lamp/Lamp.tsx`, `Lamp.module.css`, `LightSurface.tsx`, `LightSurface.module.css`, `LampCounter.tsx`, `LampCounter.module.css`, `lamp.test.tsx`, `presence.ts`, `presence.test.ts`.

- [ ] `Lamp` props: `site: PhoneSite`, `demo: boolean`, `lamps: LampsMessage | null`, `connected: boolean`, `motion: "granted" | "denied" | "unavailable"`, `onBack: () => void`. Layout and copy as DESIGN 7.7: top bar; "Raise your phone above your head."; Ring 160 px filled by `progress`; LampCounter L dark variant with the presence line; "Light without raising" (quiet); "Back to {Site}" (secondary L).
- [ ] Lit: LightSurface (DESIGN 6.14: z 40, `--lamp-white`, enters 600 ms `--ease-out`, leaves 450 ms) with "Your lamp is lit.", LampCounter L light variant with presence, "Lower your phone to stop.", and the quiet "Lower the lamp" button. On lighting: `playClip(clips.project.crackle)` (`playClip` adds `AUDIO_BASE` itself) when `crackle` is present (it is optional in `ProjectClips`) and `navigator.vibrate?.([20])`. Lowering returns to the instruction with "Lamp lowered. Raise it again to keep it lit."
- [ ] `motion` not `granted`, or `usePitch().available` false: Ring and instruction replaced by "This phone cannot tell when it is raised. Tap to light the lamp." and a primary L "Light the lamp" (DESIGN 7.7).
- [ ] "Light without raising" and "Light the lamp" light the lamp with the same events, crackle and Wake Lock; "Lower the lamp" lowers it.
- [ ] `LampCounter` sizes S and L, states loading ("... / 731"), live, offline ("(last known)" when `connected` is false and a value is known), as DESIGN 6.13; `role="status"` `aria-atomic="true"`, its announced text changed at most once a minute.
- [ ] `presence.ts`: `presenceLine(count: number | null, lit: boolean, site: string, lang: "en" | "ro"): string | null` with every row of the DESIGN 6.13 table, including "0 while lit treated as 1" and the Romanian "de" from 20. `null` hides the line. The Lamp passes `lang` from `talk/lang.ts`'s rule, folded to `ro` or `en`.
- [ ] Tests: `presence.test.ts` covers null, 0, 1, 2, 3, 19, 20, 21 before and while lit in both languages; `lamp.test.tsx` renders the instruction, the lit state and the no-motion state with `renderToStaticMarkup`.
- Verify: `npm test -w @lampa/web -- lamp presence` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the three states render, every presence row has a passing test, and no colour, font or spacing value outside the tokens is used.

#### B3-1.c City counter and people lighting now (data)

**B3-1.c.1** `lamps` folded into `useSiteGlow`. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/useSiteGlow.ts` (Ionut's file; only after Ionut agrees).

- [ ] Add `lamps: LampsMessage | null` to the returned object; the existing socket listens for `SocketMessage.enum.lamps` and parses with `LampsMessage.safeParse`, ignoring a failed parse. The last value stays when the socket disconnects (the counter shows it as "(last known)"); the Lamp and the Site view pass `null` as the presence count while `connected` is false, which hides the line (DESIGN 6.13; Patrick's decision, hour 24).
- Verify: `npm run typecheck -w @lampa/web` exit 0 and `npm test -w @lampa/web` passing. Paste the summary lines.
- Done when: `useSiteGlow(siteId).lamps` is typed and filled from the socket; the diff touches only the `lamps` lines.

#### B3-1.d Lamp wiring and LampCounter S

**B3-1.d.1** Lamp wiring in the Site view. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/SiteView.tsx` (Ionut's file; only after Ionut agrees).

- [ ] View `"lamp"` added. The "Raise a lamp" `onClick` calls `requestCompass()` inside the tap (it asks for the iOS motion permission, which the demo primer skips) and sets the view; the result goes to `Lamp`'s `motion`.
- [ ] LampCounter S under the GlowMark, lamp sites only (`site.lamp`), not in remote mode, from `live.lamps` and `live.connected` (DESIGN 7.2).
- Verify: `npm run typecheck -w @lampa/web` exit 0; `npm run build -w @lampa/web` ok; `npm test -w @lampa/web` passing. Paste the summary lines.
- Done when: the Site view opens the Lamp and shows the counter; the diff touches only these lines.

#### B3-1.e Lamp on phones

- [ ] Patrick's check. Do not mark it done. On the iPhone, deployed build, `/s/unirii?demo=1`: Raise a lamp asks for motion, raising lights after 1.5 s with the crackle, the screen stays awake, lowering closes it, the counter rises, the presence line reads "You are lighting Piața Unirii." With `npm run simulate:crowd -- --lamps` running, the counter and presence change.
- [ ] Ionut's check on the Android. Do not mark it done. The same steps.

### B3-2 Lamp pulse (0.5 h)

#### B3-2.a Pulse in phase on the shared clock

**B3-2.a.1** Pulse in phase. Subagent: `patrick-web-audio`. Files: `apps/web/src/lamp/pulse.ts`, `pulse.test.ts`, `LightSurface.tsx`, `LightSurface.module.css`.

- [ ] `PULSE_MS = 4000`. `pulseDelayMs(deviceNow: number, offset: number): number` = `-(((deviceNow + offset) % PULSE_MS) + PULSE_MS) % PULSE_MS`, so 0 at every whole multiple of server time.
- [ ] `getClockOffset()` called once per page load, started the first time the Lamp opens; the result is kept in the module for the page. Null keeps the surface steady (DESIGN 6.14).
- [ ] LightSurface overlay: `--bg` at opacity 0 → 0.12 → 0, keyframes 0%, 50%, 100%, 4000 ms, `ease-in-out`, infinite, `animation-delay` from `pulseDelayMs` set when the surface opens and when the offset arrives. No pulse under `prefers-reduced-motion: reduce` and none in the finale burst.
- [ ] Tests: `pulseDelayMs` for server time 0, 1000, 3999, 4000, 8001, and a negative offset.
- Verify: `npm test -w @lampa/web -- pulse` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass, and with the offset null the surface renders without the animation.
- [ ] Patrick's check. Do not mark it done. Two phones lit side by side breathe together; with reduced motion on, steady.

### B3-3 Navigation audio (3.5 h)

#### B3-3.a Distance, direction and the sites to play (logic)

**B3-3.a.1** Navigation maths. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/navMaths.ts`, `navMaths.test.ts`.

- [ ] Constants (Patrick's decisions, hour 24): `COMPASS_SITES = 3`, `COMPASS_GAIN = 0.25`, `BEACON_GAIN = 1`, `FAR_M = 500`, `NEAR_M = 40`, `FAR_FACTOR = 0.3`, `CUTOFF_FAR_HZ = 400`, `CUTOFF_NEAR_HZ = 8000`, `SMOOTH_S = 0.1`, `MEMORIAL_FADE_S = 3`.
- [ ] `distanceFactor(m: number | null)`: 0.3 at `FAR_M` or more, 1 at `NEAR_M` or less, linear between; null gives 0.3.
- [ ] `cutoffFor(m: number | null)`: 400 Hz at `FAR_M` or more, 8000 Hz at `NEAR_M` or less, interpolated on a log scale (`400 × 20^t`, `t` from 0 far to 1 near); null gives 400.
- [ ] `pannerPosition(bearing: number | null, heading: number | null): { x: number; z: number }`: with both known, `rel = ((bearing − heading + 540) % 360) − 180`, `x = sin(rel)`, `z = −cos(rel)` (concept 7.6); otherwise `{ x: 0, z: −1 }` (centred ahead).
- [ ] `compassSites(sites, position, targetId)`: the `COMPASS_SITES` nearest sites by `haversineM`, the target excluded, any glow, the memorial included; an empty list with no position.
- [ ] Tests: each function at its edges (39, 40, 270, 500, 501 m; null), `pannerPosition` straight ahead, 90 left and right, behind, and the 359/1 wrap; `compassSites` with the target among the nearest and with no position.
- Verify: `npm test -w @lampa/web -- navMaths` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the tests pass, and swapping the log curve for a linear one fails a test.

#### B3-3.b Compass voices, beacon, chime and the memorial fade

**B3-3.b.1** Navigation voices. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/nav.ts`, `useNavAudio.ts`, `apps/web/src/audio/useBed.ts`.

- [ ] `nav.ts`: one voice per site: `AudioBufferSourceNode` (looping, the picked bed through `bedUrl` and `loadBuffer`) → `BiquadFilterNode` lowpass → `PannerNode` (`panningModel = "HRTF"`) → `GainNode` → `ambientBus()`. `setNav({ position, heading, targetId, sites })` adds and removes voices to match `compassSites` plus the target, and sets each voice's cutoff, position and gain with `setTargetAtTime(…, SMOOTH_S)`: the target at `BEACON_GAIN × distanceFactor`, the others at `COMPASS_GAIN × distanceFactor`. No position: the target only, centred, at 400 Hz. Demo mode (`demo` true): the target's distance counts as `NEAR_M` (gain 1, 8000 Hz), so only its pan follows the heading; the compass voices keep their real distances (Patrick's decision, hour 24, for demo step 1:40). Voices fade in over `FADE_IN_S` and out over `RAMP_S` (engine constants).
- [ ] `stopNav()`, `arrive(siteId, memorial)`: not memorial → `playClip(clips.project.chime)` when present; memorial → no chime, the beacon fades to 0 over `MEMORIAL_FADE_S`; both then stop the other nav voices. A `stopNav()` that comes after `arrive()` (Between unmounts when the Site view opens) leaves the chime and the 3 s fade running to their end.
- [ ] Heal: nav voices are rebuilt after the page returns from another app, with the same `healStep` rule as the bed.
- [ ] `useNavAudio({ position, heading, targetId, demo })`: calls `setNav` on each change and `stopNav` on unmount.
- [ ] `useBed(siteId, glow, on = true)`: with `on` false the bed stops (`stopBed`); back to true it plays again. Existing callers unchanged.
- Verify: `npm test -w @lampa/web` passing, `npm run typecheck -w @lampa/web` exit 0. Paste the summary lines.
- Done when: typecheck and tests pass; the graph and the heal are read in the report, as there is no Web Audio in node.

#### B3-3.c Ducking under the persona voice

**B3-3.c.1** Ducking in Talk. Subagent: `patrick-web-audio`. Files: `apps/web/src/talk/Talk.tsx`, `apps/web/src/talk/useLiveTalk.ts`.

- [ ] `duck("live", conversation.isSpeaking)` on each change of `isSpeaking`, and `duck("live", false)` when Talk closes.
- [ ] At Talk's two `playClip` call sites only (the tap-to-ask answer in `Talk.tsx`, the greeting in `useLiveTalk.ts`): `duck("clip", true)` before the call and `duck("clip", false)` when its promise resolves (ended, stopped or failed). `clip.ts` is not changed, so the Lamp crackle and the arrival chime do not duck (Patrick's decision, hour 24). The browser voice in `speak.ts` is not ducked.
- Verify: `npm test -w @lampa/web` passing, `npm run typecheck -w @lampa/web` exit 0. Paste the summary lines.
- Done when: both holders are set and released on every path, read in the report.

#### B3-3.d Wiring into Between sites and the Site view

**B3-3.d.1** Between and Site view wiring. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/Between.tsx`, `SiteView.tsx` (Ionut's files; only after Ionut agrees). `Join.tsx` needs no line: `Between` calls `useNavAudio` itself, so `/` gets the sound too.

- [ ] `Between`: the `initialTarget` prop of the seam, used as the first `targetId`; one line `useNavAudio({ position: here, heading: blendHeading(heading, position), targetId: shownId, demo })`; the arrival effect calls `arrive(shown.id, shown.is_memorial)` (for the memorial too, which today skips `onArrive`).
- [ ] `SiteView`: `useBed(site.id, glow, view !== "between")`; a `nextTarget` state passed to `Between` as `initialTarget`; `Talk` gets `onEcho={(p) => { setEchoPrompt(p); setView("echo"); }}` and `onNextSite={(id) => { setNextTarget(id); setView("between"); }}` (B3-4.c.1's props).
- Verify: `npm run typecheck -w @lampa/web` exit 0; `npm run build -w @lampa/web` ok; `npm test -w @lampa/web` passing. Paste the summary lines.
- Done when: the diff touches only these lines in Ionut's files.
- [ ] Patrick's check. Do not mark it done. iPhone with headphones, `/s/mx?demo=1`, then "Next site" (that tap asks for the motion permission) and Piața Unirii from Sites: the Unirii bed is centred when the phone faces Piața Unirii and moves to one ear when turned away, and the arrow card agrees (Checkpoint 3 step 1:40); the bed of the site just left stops in Between; arrival plays the chime; after Google Maps and back, "Tap to listen again" brings the sounds back; in Talk the bed drops while the persona speaks.

### B3-4 Talk client tools moved from Build 2 (1 h estimated)

#### B3-4.a `persona.archive` in the content schema and the prompt

**B3-4.a.1** Schema and prompt lines. Subagent: `patrick-api`. Files: `apps/api/src/content.ts`, `apps/api/src/agent/persona.ts`, `persona.test.ts`.

- [ ] `ArchiveImage = z.object({ id: z.string().min(1), file: z.string().min(1), alt: Text, credit: z.string(), year: z.string() })`; `persona.archive: z.array(ArchiveImage).optional()` (Patrick's decision, hour 24).
- [ ] `renderPersonaPrompt` adds one line per image after the facts: `Archive image {id}: {alt in the visitor's language, else en}`; no line when there is none.
- [ ] Tests: two images listed in order with the language fallback; none gives the same prompt as today.
- Verify: `npm test -w @lampa/api` passing, `npm run typecheck -w @lampa/api` exit 0. Paste the summary lines.
- Done when: the tests pass and an empty `archive` leaves every existing persona test unchanged.

#### B3-4.b `archive` in `clips.json`

**B3-4.b.1** `archive` copied by `toClips`. Subagent: `patrick-elevenlabs`. Files: `apps/api/src/publish/publish.ts`, `publish.test.ts`.

- [ ] `toClips` copies `persona.archive` (or `[]`) into `SiteClips.archive`; no generation, no credits.
- [ ] Tests: a site with two images gives both in order; a site without gives `[]`.
- Verify: `npm test -w @lampa/api` passing; `npm run publish:site -- --site all` → `total new 0 credits`. Paste the summary lines.
- Done when: removing the copy fails a test.

#### B3-4.c The three tools and the archive card

**B3-4.c.1** Client tools and archive card. Subagent: `patrick-web-audio`. Files: `apps/web/src/talk/tools.ts`, `tools.test.ts`, `useLiveTalk.ts`, `Talk.tsx`, `Captions.tsx`, `Captions.module.css`, `Archive.tsx`, `Archive.module.css`, `talk.test.tsx`.

- [ ] `show_archive_image({ image_id })`: finds the id in `clips.sites[site.id].archive`; found → an image card in Captions (max height 40dvh, `--radius-s`, credit line `--type-meta` `--text-3`) and returns `"shown"`; tapping the card opens a `Sheet` with the image full width, `object-fit: contain`, alt text, credit and year (DESIGN 7.4: loading "Loading image", error "This image did not load." and the alt text); unknown id → `"no such image"`. Image URL `/archive/{file}`.
- [ ] `start_echo_recording({ prompt })`: returns `"opened"`; ends the session when the next agent speaking turn finishes (`isSpeaking` goes true, then false), or `TOOL_END_CAP_MS = 8000` after the call if no turn starts, then calls a new prop `onEcho(prompt)` (Patrick's decisions, hour 24).
- [ ] `suggest_next_site()`: `suggestNext({ sites: SITES.filter((s) => s.id !== site.id), position: { lat: site.lat, lng: site.lng }, glow: null, visited: visitedSites() }).suggestion` (the visitor stands at this site); returns `"{name}: {directions_hint.en}"` from `GET /sites/{id}?lang=en` within 3 s, else `"{name}"`; ends the session by the same rule as `start_echo_recording` and calls a new prop `onNextSite(siteId)` (DESIGN 7.3).
- [ ] Tests: `tools.test.ts` for each parser and return string, the unknown image id, a missing `prompt`; `talk.test.tsx` renders the image card.
- Verify: `npm test -w @lampa/web` passing, `npm run typecheck -w @lampa/web` exit 0, `npm run build -w @lampa/web` ok. Paste the summary lines.
- [ ] Tests: the end rule through an exported `shouldEnd({ calledAt, sawSpeaking, speaking, now })`: not before a turn, at the end of a turn, at 8000 ms with no turn, not at 7999.
- Done when: the tests pass.
- The `onEcho` and `onNextSite` props are wired in `SiteView.tsx` by B3-3.d.1.

#### B3-4.d The tools on the agent

- [ ] Patrick adds three client tools on `LAMPA monument` in the dashboard, after `patrick/b3-nav` is deployed: `show_archive_image` (one required string `image_id`), `start_echo_recording` (one required string `prompt`), `suggest_next_site` (no parameters); each with wait for response off and a 20 s timeout (Patrick's decisions, hour 24). This session reads names and booleans only and runs `npm run agent:check` → exit 0.

#### B3-4.e Live smoke test

- [ ] Patrick's check. Do not mark it done. One live Talk session on the iPhone at `/s/unirii`: ask the persona to suggest the next site and to record an echo; see whether a tool fires. One retry after a fix. Fabi then checks that the webhook stored the transcript (carried Blocked row).

### B3-5 Room sound on `/screen` (1.5 h)

#### B3-5.a Four beds panned by map position

**B3-5.a.1** Room sound. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/room.ts`, `room.test.ts`, `apps/web/src/screen/ScreenPage.tsx` (one hook line; only after Cristea agrees).

- [ ] `ROOM_MASTER = 0.8`, `ROOM_PAN_MAX = 0.8` (Patrick's decisions, hour 24). `roomGain(glow) = ROOM_MASTER × clamp(glow, 0, 1)`; `roomPan(x, width) = ROOM_PAN_MAX × (2x / width − 1)`.
- [ ] `useRoomSound(glowRef, placed, width)`: `glowRef` and the placed positions are the ones `LivingMap` already has (`useScreenSocket`'s `glowRef`, `PLACED`); the hook reads `glowRef.current` once a second (Patrick's decision, hour 24); for the four colour sites only (never the memorial, never the Gallery), each picked bed `source → StereoPannerNode → GainNode → destination`, gain ramped to `roomGain` over `RAMP_S` on each glow message, pan from the projected x. It starts after the "Start the Living Map" click, which already ran in a tap; it calls `unlockAudio()` there.
- [ ] One line in `ScreenPage.tsx` calling `useRoomSound(glowRef, PLACED, <map width>)` inside `LivingMap`, the map width being the one its projection uses. Room sound does not go through the duck bus (Patrick's decision, hour 24).
- [ ] Tests: `roomGain` at 0, 0.5, 1, 1.2; `roomPan` at the left edge, centre and right edge; the memorial is never in the list.
- Verify: `npm test -w @lampa/web -- room` passing, `npm run typecheck -w @lampa/web` exit 0, `npm run build -w @lampa/web` ok. Paste the summary lines.
- Done when: the tests pass and the `ScreenPage.tsx` diff is one hook line and its import.
- [ ] Patrick's check. Do not mark it done. Laptop `/screen` with the speaker: after the click, the awake sites are heard from their side of the room; `simulate:crowd` raises the level of the site it wakes; the Cathedral adds nothing.

### B3-6 Echo whispers (1 h, first to cut)

#### B3-6.0 Contract: `ApprovedEchoes` (team decision)

- [ ] Patrick takes this to Cristea and the team: `GET /echoes/approved?site=<id>`, public, 120 a minute per IP, `Cache-Control: no-store`, answering `ApprovedEchoes` `{ echoes: [{ echoId, audioUrl, lang }] }`, the 5 newest approved echoes of the site, newest first; 404 `unknown_site`; 404 `no_echo` for the Cathedral; 503 `unavailable` without a database. The schema goes into `packages/shared/src/contract.ts` only after they agree. Until then B3-6 is Blocked.

#### B3-6.a The approved route

**B3-6.a.1** `GET /echoes/approved`. Subagent: `patrick-api`. Files: `apps/api/src/echoes/router.ts`, `router.test.ts` (the new route's tests only; Cristea's file, after she agrees).

- [ ] The route as B3-6.0, one SQL query on `echoes` with `status = 'approved'` and the site, ordered by `created_at` descending (the table has no approval time), limit 5; `audioUrl` built the same way as in the `echo_approved` broadcast.
- [ ] Tests: approved only, newest first, at most 5; Cathedral 404; unknown site 404; no database 503.
- Verify: `npm test -w @lampa/api` passing, `npm run typecheck -w @lampa/api` exit 0. Paste the summary lines.
- Done when: the tests pass and removing the status filter fails a test.

#### B3-6.b Whispers on the phone

**B3-6.b.1** Whispers. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/whisper.ts`, `whisper.test.ts`, `useWhispers.ts`, `apps/web/src/phone/SiteView.tsx`, `Between.tsx` (one hook line each; Ionut's files, after he agrees).

- [ ] `WHISPER_GAIN = 0.35`, `WHISPER_GAP_MS = 20000`, `WHISPER_COUNT = 5` (Patrick's decisions, hour 24). `nextWhisper(list, lastPlayedId)`: the next echo after the last one played, round-robin.
- [ ] `useWhispers(siteId, position, heading)`: fetches `GET /echoes/approved?site=<id>` once per site, also adds `echo_approved` messages of the site room; plays one echo at a time through `loadBuffer` → `PannerNode` (HRTF, `pannerPosition` from the site's bearing) → `GainNode` at `WHISPER_GAIN` → `ambientBus()`, starting the next one `WHISPER_GAP_MS` after the last ended. A failed load or decode skips that echo. Never at the memorial.
- [ ] One line in `SiteView.tsx` (the site, centred) and one in `Between.tsx` (the shown site, from its direction).
- [ ] Tests: `nextWhisper` with an empty list, one, five, and a last id no longer in the list.
- Verify: `npm test -w @lampa/web -- whisper` passing, `npm run typecheck -w @lampa/web` exit 0, `npm run build -w @lampa/web` ok. Paste the summary lines.
- Done when: the tests pass and the Ionut-file diffs are one line each.
- [ ] Patrick's check. Do not mark it done. On the iPhone, an approved echo recorded on Chrome (webm) plays as a whisper at the site; if the iPhone cannot decode webm, say so and it is skipped.

### B3-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch, `npm test`, `npm run typecheck` and `npm run build` green on it.
- [ ] Push each branch and open its PR, in this order: `patrick/b3-lamp`, `patrick/b3-nav`, `patrick/b3-screen`. Each PR lists what was verified and what is waiting for a phone.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists what other lanes can now use (`useSiteGlow().lamps`, `ambientBus`/`duck`, `useBed`'s `on`, `Between`'s `initialTarget`, `persona.archive`, `GET /echoes/approved`).
- [ ] Patrick's checks on real phones, listed and not claimed: on the iPhone B3-1.e, B3-2.a, B3-3.d, B3-4.e, B3-5.a, B3-6.b; on Ionut's Android B3-1.e and the carried lens-sound check. Checkpoint 3: step 1:40 at `/s/mx?demo=1` → Next site → Piața Unirii, facing the Unirii poster, and step 2:00 with `npm run simulate:crowd -- --lamps` raising the counter, twice from a cold start.
- Done when: every box is ticked or listed as Patrick's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: B3-6.0 (the team's answer on `GET /echoes/approved`), Ionut's yes for his three files, Cristea's yes for `ScreenPage.tsx` and her router, the speech-clip content (team), archive images with sources (team).
- **Not finished at hour 31:** each ID, what is left, and its place in the cut order.
- **Phone checks for Patrick:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 3

- Raising the phone at a lamp site lights the Lamp after 1.5 s, sends `lamp` at once and every minute held, keeps the screen awake, shows the city counter and the presence line, and lowering closes it; without motion, a tap lights it.
- Lit phones pulse on the 4 s server-time cycle when the clock offset is known, and stay steady otherwise.
- In Between sites the chosen site's bed is heard from its direction, clearer as it gets nearer, with up to three nearest sites faintly around it; arrival plays the chime (none at the memorial); other audio drops 12 dB while the persona speaks.
- `/screen` plays the four colour beds at `glow × 0.8`, panned by map position, after the start click.
- The three client tools work in Talk once Patrick has added them on the agent.
- Approved echoes play as whispers from the site's direction, or B3-6 is listed as cut or Blocked with its reason.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `patrick/GLOSSARY.md` matches the state of the branch.

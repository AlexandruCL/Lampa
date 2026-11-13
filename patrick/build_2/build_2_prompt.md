# Prompt: Patrick's Build 2: Colours and Talk (Patrick, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 10.5 (2026-11-13 23:52 +0200). Implementation not started.**

You are implementing Patrick's part of Build 2: Colours and Talk (hours 12 to 18 in the plan; Patrick runs it from hour 10.5 to hour 16.5) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *the two stations the demo is built around.*

Checkpoint this block must pass: *3. Live Talk answers on a phone and at least one client tool fires.* *4. With the ElevenLabs key removed, Talk falls back to tap-to-ask without a reload.* *5. Patrick has listened to every generated bed and picked a take.*

## 0. Ground rules

- **Patrick takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Patrick, with your recommendation. Nothing uses the recommendation until Patrick answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask. Known differences, all Patrick's decisions at hour 10 and listed under Changes in the glossary: three client tools move to Build 3; ducking stays in Build 3 (DESIGN 7.3 puts it in Talk); the clink and the window chord are added to the colour-to-note row.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block runs from hour 10.5 to hour 16.5 (Patrick's decision, hour 10).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Patrick: carrying on, cutting (plan section 7) or moving it is their decision. If the block runs late, cut first the clink and the chord (B2-3.b), then the `set_light` tint (B2-1.c, its box only).
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Patrick, who takes it to the team. When another lane's endpoint has not landed, code against its schema. This block changes nothing in `packages/shared`.
- The server sets event weights. The client never sends one. Talk sends no `talk_turn` event in this block (Patrick's decision, hour 10).
- No library beyond plan section 3 without Patrick's approval. Approved: `@elevenlabs/react` **1.22.0 exact** (MIT, published 2026-11-10, pulls `@elevenlabs/client` 1.36.0), in `apps/web` only, for B2-1 (Patrick's decision, hour 10). Nothing else. The browser voice is the built-in `speechSynthesis`.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. **`ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` never appear in the chat, in a commit, in a glossary line or in command output** (Patrick's decision, hour 5). Do not open, print or `cat` the root `.env`. The browser gets only the signed URL from `GET /agent/session`. Scripts print statuses, file names, credit numbers, names and `true` or `false`, never a key, an id or a response body.
- `main` deploys by itself. The `patrick/` docs commit (this prompt, the glossary, the plan update) goes straight to `main`, as in Setup and Build 1. After it, all work happens on the local branch `patrick/b2-work`, which is never pushed. Two PR branches are cut from `origin/main` and get their commits by cherry-pick, in this order (Patrick's decision, hour 10): `patrick/b2-talk` (SDK, seams, Talk screen, fallback, tapToAsk text, unirii content and clips, the Talk wiring in `SiteView.tsx`), then `patrick/b2-note` (note maths, lens sounds, the lens wiring, `picks.json`), cut after `patrick/b2-talk` is merged because both touch `SiteView.tsx`. One small PR per branch. Open it only after the verify commands pass. Cristea merges every team PR. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- **Live ElevenLabs calls cost credits.** Develop against fakes and the recorded clips. In this block: one paid generation run (`npm run publish:site -- --site unirii --run`, B2-2.c), made by this session after Patrick says go; one live Talk smoke test, made by Patrick on the iPhone on the deployed build, plus one retry after a fix if it fails (B2-1.f). No agent makes a live call. Nothing else live until Checkpoint 2 (Patrick's decisions, hour 10).
- **Models (Patrick's decisions, hour 6 and 8):** TTS `eleven_v3`. The publish code already sets it; do not change it.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. Talk is never offered there (`GET /agent/session` answers 404 `no_persona`); the memorial view does not change in this block.
- **Content.** Patrick writes the Piața Unirii persona text and its three questions himself, in Romanian and English (B2-2.0; Patrick's decision, hour 10). Nobody else writes persona text, facts, tap-to-ask answers or narrations into `content/sites/`. Tests use fixtures inside the test files.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/` (`apps/web/src/styles/tokens.css` and `apps/web/src/components/`). Do not add a colour, font or spacing value that is not a token. The one colour that does not come from a token is the `set_light` tint, which comes from the agent (DESIGN 5.2).
- Write in `patrick/` only. Other members' folders are read-only. Files outside the lane that this prompt lets you touch: `apps/web/src/phone/SiteView.tsx` (the Talk view and the lens callbacks, after Ionut agrees), `content/sites/02-unirii.yaml` (`persona` keys only, written by Patrick), `apps/web/package.json` and `package-lock.json` (the one dependency), `IMPLEMENTATION_PLAN.md` (the hour-10 update, already in the docs commit). Each gets a Changes line.
- **Keep `patrick/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Patrick a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 10.3 to 10.5, 2026-11-13 23:37 to 23:52 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Patrick's Build 1 is done and merged (#27, #28, #29; `main` `750ff4f` deployed). After it, PR #30 put `site_id` in `AgentSession.dynamicVariables`, and Patrick added the webhook tools `get_site_stats` and `get_recent_echo` on the agent `LAMPA monument` (glossary, hour 9). Nothing carried over. `main` is at `4c288d2`, `git status` clean, no open PRs.
- Checkpoint 1 line 1 (a bed plays after the tap) was reported done by Patrick on the iPhone and with Ionut on the Android (B1-4.c, B1-last). Checkpoint 1 runs hours 10 to 12 for the team; Patrick starts Build 2 at hour 10.5 and joins checkpoint checks when asked.
- `GET /agent/session?site=<id>&lang=<AgentLang>` is on `main` and deployed (`apps/api/src/agent/session.ts`, Cristea; Hand-offs, Cristea hour 12): visitor token required; 200 `AgentSession` (`signedUrl`, `overrides?`, `dynamicVariables` with eight keys including `site_id`), `Cache-Control: no-store`; 401; 404 `unknown_site`; 404 `no_persona` (Cathedral); 429 with `Retry-After` past 6 per 10 min; 503 `agent_unavailable`. Real stats come from Fabi's `getSiteStats`. This answers the plan's "`GET /agent/session` from Cristea by hour 14".
- `getPersona` (`apps/api/src/agent/persona.ts`) sends overrides only for a site whose `persona` in the **`sites` table** has `name.en`, `voice`, `traits`, `first_message.en` and `cathedral_line.en`. Today no site has them, so every live session uses the agent's own prompt ("the Lamp"). Unirii's new text (B2-2.0) reaches the table only through `npm run db:reset`, which wipes every event (glossary Blocked B1-1.b, still open; Fabi's glossary says `db:reset` is not run again). Live Talk works without it.
- Content: all five site files have `facts: []` and no `persona.name`, `first_message`, `cathedral_line` or `tap_to_ask`; unirii has `persona.voice` and `traits: ""`. `clips.json` has ten beds and the four project sounds (glass `project/glass-1-c664253292b2.mp3`), and no greeting, answer or narration. `picks.json` is `{}`: Checkpoint 2 line 5 is open.
- `apps/web/src/audio/`: `clips.ts` (`SiteClips`, `ProjectClips`, `Clips`, `AUDIO_BASE`, `clips`, `picks`), `context.ts` (Ionut: `getAudioContext`, `unlockAudio`), `engine.ts` (`playBed`, `setBedGlow`, `stopBed`, `bedGain`; beds load through `fetch` and `decodeAudioData` and play through the one context), `useBed.ts`.
- `apps/web/src/phone/SiteView.tsx` (Ionut): the Talk button has no `onClick`; "Catch a colour" calls `openRearCamera()` inside the tap and renders `ColourLens` without `onReading`, `onCaught`, `onComplete`. Ionut's Blocked row (hour 5) asks Patrick to pass those three and to open the lens from `start_colour_catch` the same way.
- `ColourLens` props: `site`, `remote`, `demo`, `camera: Promise<CameraResult>`, `onBack`, `onReading?(Reading)`, `onCaught?(Reading)`, `onComplete?()`, `panes`, `addPane`. `Reading` = `{ r, g, b, hex, hue, saturation, lightness, bin }` (`apps/web/src/colour/reading.ts`; `bin` null is night glass). `TopBar({ siteName, onBack, demo })`. Components: `Button` (primary, secondary, quiet, icon; sizes m, l; `block`, `icon`, `loading`), `Notice` (info, error, connection; `action`), `RoundControl` (`state`: idle, listening, recording, speaking, connecting, disabled; `label`, `status`, `level`, `onPress`, `onRelease`). Icons: back, close, play, pause, stop, mic, check, alert, headphones. `@lampa/shared` exports `colourName(hex)`, `hexHue(hex)`, `COLOUR_NAMES`, `NIGHT_GLASS`, `AgentLang`, `AgentSession`.
- Not there yet, added by this block: `@elevenlabs/react` (not installed), `apps/web/src/talk/` (B2-1, B2-2), `apps/web/src/audio/clip.ts` (B2-2.b), `apps/web/src/audio/note.ts` (B2-3), the `tapToAsk` text in `clips.json` (B2-2.a), the client tools `set_light` and `start_colour_catch` on the agent (B2-1.e).
- `@elevenlabs/react` 1.22.0 types (read from the packed tarball at hour 10): wrap in `ConversationProvider`; `useConversation()` returns `startSession(options)` (returns `void`; failures arrive through `onError`, `onStatusChange`, `onDisconnect`), `endSession()`, `status` (`disconnected`, `connecting`, `connected`, `disconnecting`), `isSpeaking`, `setMuted(boolean)`, `getInputVolume()`. Options accept `signedUrl` with `connectionType: "websocket"`, `overrides` (`agent.prompt.prompt`, `agent.firstMessage`, `agent.language`, `tts.voiceId`, the same shape as `AgentSession.overrides`), `dynamicVariables` (string, number, boolean), `clientTools` (name to function returning `string | number | void`, sync or a Promise), `onConnect`, `onDisconnect(details)` with `details.reason` `"error" | "agent" | "user"`, `onError(message)`, `onMessage({ message, role: "user" | "agent", event_id })`. `MessagePayload` has no tentative flag: each `onMessage` is a final line.
- Tests: `npm test` runs Vitest in `apps/api` and `apps/web`; the web tests run in the `node` environment with no DOM; components are tested with `renderToStaticMarkup` (`apps/web/src/components/components.test.tsx`). Scripts used here: `npm test`, `npm run typecheck`, `npm run build`, `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`, `npm test -w @lampa/api`, `npm run typecheck -w @lampa/api`, `npm run publish:site`, `npm run agent:check`.
- Deployed: web https://lampa-timisoara.vercel.app → 200; API https://lampa-api-b45i.onrender.com/health → `{"ok":true}` (23:40).
- Patrick's phone: an iPhone. No Android (Ionut's Android for Android checks). `gh` is at `C:\Program Files\GitHub CLI\gh.exe`, not on PATH.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 2, Patrick's rows, the "Before sleeping" line and Checkpoint 2 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Patrick's table and "Needs from others" | All |
| `patrick/GLOSSARY.md` | Whole file | All |
| `patrick/setup/elevenlabs_findings.md` | Sketch 2 (React SDK) and "For Patrick" items 7, 8, 12 to 15, 17 | B2-1 |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Section 11.1: client tools and Sketch 2 (printed pages 39 to 40); "The Talk fallback" (printed page 41) | B2-1, B2-2 |
| `DESIGN.md` | 5.2 (Talk rows, `set_light` overlay), 5.8 (sound cues), 6.4 RoundControl, 6.10 Captions, 7.0 copy voice, 7.3 Talk | B2-1, B2-2, B2-3 |
| `packages/shared/src/contract.ts`, `colours.ts` | `AgentLang`, `AgentSession`; `colourName`, `hexHue`, `NIGHT_GLASS` | B2-1, B2-3 |
| `apps/web/src/api/client.ts`, `apps/web/src/session.ts` | `api()`, `ApiError` | B2-1 |
| `apps/web/src/audio/clips.ts`, `clips.json`, `picks.json`, `context.ts`, `engine.ts` | Whole files | B2-1, B2-2, B2-3, B2-5 |
| `apps/web/src/phone/SiteView.tsx`, `ColourLens.tsx`, `TopBar.tsx`, `panes.ts`; `apps/web/src/colour/reading.ts`; `apps/web/src/sensors/camera.ts` | Whole files | B2-1, B2-3 |
| `apps/web/src/components/` | Button, Notice, RoundControl, Icon and `components.test.tsx` | B2-1, B2-2 |
| `apps/api/src/publish/publish.ts`, `publish.test.ts`; `apps/api/src/content.ts`; `scripts/publish-site.ts` | Whole files | B2-2 |
| `content/sites/02-unirii.yaml` | Whole file | B2-2 |
| `node_modules/@elevenlabs/react/dist/**/*.d.ts`, `node_modules/@elevenlabs/client/dist/**/*.d.ts` (after B2-1.a.1) | Types only | B2-1 |
| Root `package.json`, `apps/web/package.json`, `apps/api/package.json` | Scripts and dependencies | All |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Talk, live: `GET /agent/session`, `useConversation`, client tools (`show_archive_image`, `set_light`, `start_colour_catch`, `start_echo_recording`, `suggest_next_site`), captions. `show_archive_image`, `start_echo_recording` and `suggest_next_site` move to Build 3, where their screens are built (Patrick, hour 10) | 3 | B2-1.a, B2-1.b, B2-1.c, B2-1.d, B2-1.e, B2-1.f |
| Section 11: Talk, live, with the five client tools and captions. `show_archive_image`, `start_echo_recording` and `suggest_next_site` move to Build 3, where their screens are built (Patrick, hour 10) | same 3 | as above |
| Section 6: Talk fallback: tap-to-ask with pre-generated clips, browser speech synthesis as last resort, automatic switch on agent error | 1.5 | B2-1.b (switch rules), B2-2.0, B2-2.a, B2-2.b, B2-2.c |
| Section 11: Talk fallback: tap-to-ask clips, browser voice last | same 1.5 | as above |
| Section 6: Colour to note: hue to pentatonic step, lightness to octave, via `playbackRate` on the glass sample, plus the clink on a catch and the chord of a completed window from the same sample (Patrick, hour 10) | 0.5 | B2-3.a, B2-3.b |
| Section 11: Colour to note mapping, clink and window chord | same 0.5 | as above |
| Section 6: Before sleeping, Patrick starts `publish-site.ts` for all five sites. | 0 | B2-4.a |
| Section 8 tests owned by Patrick | none | none (section 8 lists none for Patrick; this block adds unit tests anyway, B2-1.b, B2-2.a, B2-3.a) |
| `DESIGN.md` 9, item 5: Talk. Captions, RoundControl, tap-to-ask fallback; archive image inline only (no Sheet), 0.5 h, required | 0.5 (slack) | B2-1.c, B2-2.b. The archive image waits for `show_archive_image` in Build 3 |
| Checkpoint 2 line 3: Live Talk answers on a phone and at least one client tool fires. | in B2-1 | B2-1.e, B2-1.f |
| Checkpoint 2 line 4: With the ElevenLabs key removed, Talk falls back to tap-to-ask without a reload. | in B2-2 | B2-1.b, B2-2.b, B2-2.c; run at Checkpoint 2 (B2-last) |
| Checkpoint 2 line 5: Patrick has listened to every generated bed and picked a take. | 0 | B2-5.a |

Total: 5 h of tasks plus 0.5 h of styling in a 6 h block.

Order: B2-0 and the seams first. Then in parallel: B2-1.a.1 → B2-1.b.1 → B2-1.c.1 → B2-2.b.1 (one `patrick-web-audio` agent, in sequence, all in `apps/web/src/talk/` and `apps/web/src/audio/clip.ts`), B2-2.a.1 (`patrick-elevenlabs`), B2-3.a.1 (a second `patrick-web-audio` agent, `apps/web/src/audio/note.ts` only). Patrick meanwhile writes B2-2.0, adds the agent tools (B2-1.e) and listens to the beds (B2-5.a). B2-2.c (paid run) after B2-2.0 and B2-2.a.1. B2-1.d (Talk wiring in `SiteView.tsx`) after B2-1.c.1 and Ionut's yes. `patrick/b2-talk` PR, merge, then B2-1.f on the deployed build. B2-3.b.1 (lens wiring, `SiteView.tsx` and `Talk.tsx`) after B2-1.d and B2-3.a.1. Then `patrick/b2-note`. B2-4.a before sleep.

Seams, committed by this session on `patrick/b2-work` before any agent starts:

```ts
// apps/web/src/audio/clips.ts: one new field on SiteClips (owner: this session; filled by B2-2.a.1)
export type SiteClips = {
  beds: string[]; // take 1 first
  greeting: Record<string, string>; // lang -> file
  answers: Record<string, Record<string, string>>; // tap_to_ask id -> lang -> file
  narrations: Record<string, Record<string, string>>; // narration id -> lang -> file
  tapToAsk: { id: string; q: Record<string, string>; a: Record<string, string> }[]; // persona.tap_to_ask text, file order
};
```

and `"tapToAsk": []` added by hand to each of the five sites in `apps/web/src/audio/clips.json`, and to the `site()` fixture in `apps/web/src/audio/engine.test.ts` (it is typed `SiteClips`, so the new field would break the typecheck).

```ts
// apps/web/src/audio/note.ts (owner: B2-3.a.1 writes the bodies; Talk's lens host imports these names)
import type { Reading } from "../colour/reading";

export const PENTATONIC = [0, 2, 4, 7, 9] as const;
/** playbackRate for the glass sample. hue null is night glass. */
export function noteRate(hue: number | null, lightness: number): number {
  throw new Error("not implemented");
}
/** Lens reading: plays only when the note changes, at most once per TONE_GAP_MS. */
export function readingTone(reading: Reading): void {
  throw new Error("not implemented");
}
/** Colour caught: the clink. */
export function caughtClink(reading: Reading): void {
  throw new Error("not implemented");
}
/** Window completed by this visitor: the chord of its colours. */
export function windowChord(hexes: (string | null)[]): void {
  throw new Error("not implemented");
}
```

### 3.1 Subagents

Patrick asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Patrick, re-runs the checks, writes the glossary and does the first and last tasks, the seams, the paid run and the dashboard read. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `patrick-web-audio` | Web Audio, the Talk screen and its React hooks, Vitest tests in `apps/web` | opus | reused from Build 1; scope widened to `apps/web/src/talk/`, the `@elevenlabs/react` dependency and the Talk and lens lines of `SiteView.tsx` |
| `patrick-elevenlabs` | Publish code (`apps/api/src/publish/`) and its tests | opus | reused from Build 1 |

`patrick-api` (Build 1) gets no task in this block and stays as it is.

Subtasks with no agent task, because they are Patrick's or need a paid call or the dashboard: B2-1.e (Patrick adds the tools; this session reads them), B2-1.f (Patrick's phone), B2-2.0 (Patrick writes the content), B2-2.c and B2-4.a (paid runs, this session after Patrick's go), B2-5.a (Patrick listens; this session writes `picks.json`).

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B2-1.a.1 | `patrick-web-audio` | Install `@elevenlabs/react` 1.22.0 exact | `apps/web/package.json`, `package-lock.json` | first, after the seams |
| B2-1.b.1 | `patrick-web-audio` | Pure Talk logic with tests: language, switch rules, tool answers, questions | `apps/web/src/talk/lang.ts`, `machine.ts`, `tools.ts`, `questions.ts` and their `.test.ts` | after B2-1.a.1; parallel with B2-2.a.1 and B2-3.a.1 |
| B2-1.c.1 | `patrick-web-audio` | Talk screen, captions, live session, the two client tools, lens host | `apps/web/src/talk/Talk.tsx`, `Talk.module.css`, `Captions.tsx`, `Captions.module.css`, `useLiveTalk.ts`, `talk.test.tsx` | after B2-1.b.1 |
| B2-2.b.1 | `patrick-web-audio` | Tap-to-ask fallback in Talk: clip playback, browser voice | `apps/web/src/audio/clip.ts`, `apps/web/src/talk/speak.ts`, `Talk.tsx`, `Talk.module.css`, `talk.test.tsx` | after B2-1.c.1 |
| B2-1.d.1 | `patrick-web-audio` | Talk wiring in `SiteView.tsx` | `apps/web/src/phone/SiteView.tsx` (Talk lines only) | after B2-2.b.1 and Ionut's yes |
| B2-2.a.1 | `patrick-elevenlabs` | `tapToAsk` text in `toClips` | `apps/api/src/publish/publish.ts`, `publish.test.ts` | parallel with B2-1.b.1 |
| B2-3.a.1 | `patrick-web-audio` (second instance) | Note maths and lens sounds | `apps/web/src/audio/note.ts`, `note.test.ts` | parallel with B2-1.b.1 |
| B2-3.b.1 | `patrick-web-audio` | Lens callbacks in `SiteView.tsx` and Talk's lens host | `apps/web/src/phone/SiteView.tsx` (the `ColourLens` lines only), `apps/web/src/talk/Talk.tsx` (the `ColourLens` lines only) | after B2-1.d.1 merged and B2-3.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Patrick to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Patrick. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Patrick, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B2-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Commit the docs straight to `main` and push: `patrick/build_2/build_2_prompt.md`, `patrick/GLOSSARY.md`, `IMPLEMENTATION_PLAN.md` (the hour-10 update). Message `docs(patrick) wrote the Build 2 prompt`.
- [ ] Create the local branch `patrick/b2-work` from `origin/main`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-check each "Needs from others" item of section 1: `GET /agent/session` deployed (`curl -s -o /dev/null -w "%{http_code}" https://lampa-api-b45i.onrender.com/agent/session?site=unirii` → 401 without a token); Ionut's and Fabi's Blocked and Hand-offs rows unchanged.
- [ ] Write the two seams of section 3 as given, one commit each on `patrick/b2-work`: `feat(audio) added tapToAsk to the clips manifest` (`clips.ts`, `clips.json`, `engine.test.ts`), `feat(audio) added the note seam` (`note.ts`). `npm run typecheck -w @lampa/web` exit 0 after each.
- Done when: the baseline is recorded, failures that were already there are listed, not fixed silently, and both seams are committed.

### B2-1 Talk, live (3 h)

#### B2-1.a The SDK in `apps/web`

**B2-1.a.1** Install the SDK. Subagent: `patrick-web-audio`. Files: `apps/web/package.json`, `package-lock.json`.

- [ ] `npm install @elevenlabs/react@1.22.0 --save-exact -w @lampa/web` (Patrick's decision, hour 10). `apps/web/package.json` lists `"@elevenlabs/react": "1.22.0"`; the lock resolves `@elevenlabs/client` 1.36.0.
- [ ] Nothing else in either file changes.
- Verify: `npm ls @elevenlabs/react @elevenlabs/client -w @lampa/web` and `npm run typecheck -w @lampa/web`. Paste both.
- Done when: both versions print as above and typecheck exits 0.

#### B2-1.b Pure Talk logic

**B2-1.b.1** Language, switch rules, tool answers, questions. Subagent: `patrick-web-audio`. Files: `apps/web/src/talk/lang.ts`, `machine.ts`, `tools.ts`, `questions.ts`, `lang.test.ts`, `machine.test.ts`, `tools.test.ts`, `questions.test.ts`. No React, no DOM, no SDK import in these files.

- [ ] `lang.ts`: `visitorLang(navigatorLanguage: string | undefined): AgentLang`: the first two letters, lower case, if they are `ro`, `en`, `hu`, `de` or `sr`, else `en` (Patrick's decision, hour 10). Tests: `"ro-RO"` → `ro`, `"DE"` → `de`, `"sr-Latn-RS"` → `sr`, `"fr-FR"` → `en`, `""` and `undefined` → `en`.
- [ ] `machine.ts`: `TALK_CONNECT_MS = 8000` (DESIGN 7.3). `type TalkMode = "connecting" | "live" | "fallback" | "timeup"`. `type TalkEvent = { type: "timeout" } | { type: "session_failed" } | { type: "mic_denied" } | { type: "connected" } | { type: "error" } | { type: "disconnected"; reason: "error" | "agent" | "user" }`. `step(mode, event): { mode: TalkMode; notice: "resting" | "mic_off" | null; endSession: boolean; caption: "timeup" | null }`. Rules (Patrick's decision, hour 10):
  - From `connecting`: `timeout`, `session_failed` (any non-200 from `GET /agent/session`, 429, 503 and 404 included, or a network failure), `error` and `disconnected` with reason `error` go to `fallback` with notice `resting`; `mic_denied` goes to `fallback` with notice `mic_off`; `connected` goes to `live`.
  - From `live`: `error` and `disconnected` with reason `error` go to `fallback` with notice `resting`; `disconnected` with reason `agent` goes to `timeup` with caption `timeup` and no notice (the 120 s cap); `disconnected` with reason `user` stays `live` (the screen is closing).
  - From `fallback` or `timeup`: `connected` returns the same mode with `endSession: true` (a late session would bill); every other event changes nothing.
  - Any event not listed above changes nothing (same mode, no notice, no caption, `endSession: false`).
  - `endSession` is `false` everywhere else.
  - Why `agent` means the cap (fact, SDK 1.36.0 source): `reason: "agent"` comes from a WebSocket close with code 1000 or from the `end_call` system tool, which this agent does not have; a socket error or any other close code is `reason: "error"`.
  - Tests: one per rule above, by name; plus "a late connect after the 8 s switch ends the session" and "a timeout after connected changes nothing".
- [ ] `tools.ts`: `parseLight(params: unknown): { hex: string; alpha: number } | null`: `color` must match `^#[0-9a-fA-F]{6}$`, `intensity` a finite number clamped to 0..1; `alpha = min(intensity, 1) × 0.25` (DESIGN 5.2); anything else → `null` (Patrick's decision, hour 10). `LIGHT_OK = "ok"`, `LIGHT_UNKNOWN = "unknown colour"`. `caughtLine(hex: string): string` → `` `caught ${colourName(hex).en} (${hex})` `` (concept Sketch 2; `colourName` from `@lampa/shared`). `LENS_CLOSED = "the visitor closed the lens"`. Tests: a valid call; intensity 2 → alpha 0.25; intensity −1 → alpha 0; `"red"`, `"#12345"`, missing intensity, `null` → `null`; `caughtLine("#c8102e")` names the colour in English.
- [ ] `questions.ts`: `type Question = { id: string; q: string; a: string; file: string | null }`. `questionsFor(siteId: string, lang: AgentLang, c: Clips = clips): Question[]`: the site's `tapToAsk` in file order; `q` and `a` in `lang`, else `en` per string; `file` = `answers[id][lang]`, else `answers[id].en`, else `null`; an entry with no `en` text in `q` or `a` and none in `lang` is left out; an unknown site → `[]`. `greetingFor(siteId, lang, c = clips): string | null`: `greeting[lang]`, else `null` (no fallback to `en`: the greeting must match the session's language). Tests on a fixture `Clips`: ro text with ro clip; ro missing → en text and en clip; text but no clip → `file: null`; unknown site → `[]`; greeting present and absent.
- Verify: `npm test -w @lampa/web` and `npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: the four test files pass, and removing the late-connect `endSession: true` from `machine.ts` fails a test.

#### B2-1.c Talk screen with the live session

**B2-1.c.1** Talk screen, captions, live session, two client tools, lens host. Subagent: `patrick-web-audio`. Files: `apps/web/src/talk/Talk.tsx`, `Talk.module.css`, `Captions.tsx`, `Captions.module.css`, `useLiveTalk.ts`, `talk.test.tsx`.

- [ ] `Talk` props: `{ site: PhoneSite; demo: boolean; remote: boolean; mic: Promise<"granted" | "denied">; onBack: () => void; panes; addPane }` (`panes` and `addPane` exactly as `SiteView` passes them to `ColourLens`). `Talk` renders `<ConversationProvider>` around its content; nothing outside `apps/web/src/talk/` imports the SDK. `SiteView` imports `Talk` statically, never with `lazy()` or `import()`: on import the SDK adds a document tap listener that unlocks an iOS AudioContext for 30 s, so it must be loaded before the Talk tap (fact, `@elevenlabs/client` 1.36.0 `platform/web/audioUnlock.js`; Patrick's decision, hour 10).
- [ ] `useLiveTalk(site, lang, mic)` runs once on mount: awaits `mic` (`denied` → event `mic_denied`); on `granted` starts the 8 s timer (`TALK_CONNECT_MS`; Patrick's decision, hour 10: the iOS microphone prompt does not count); calls `api(`/agent/session?site=${site.id}&lang=${lang}`, { schema: AgentSession })` (failure → `session_failed`); then `startSession({ signedUrl, connectionType: "websocket", overrides, dynamicVariables, clientTools })` (findings 7, 8, 15; overrides only when the response has them). `onConnect` → `connected`; `onError` → `error`; `onDisconnect(d)` → `disconnected` with `d.reason`. Every event goes through `step()`; when it returns `endSession: true`, call `endSession()`. `lang = visitorLang(navigator.language)`.
- [ ] Hold to talk (Patrick's decision, hour 10): the mic is muted (`setMuted(true)`) from connect, unmuted while the RoundControl is held, muted again on release. The "Hands-free" secondary M button toggles `aria-pressed`; on, the mic stays unmuted and the RoundControl turns into tap to start / tap to end (DESIGN 6.4). The level ring takes `getInputVolume()` once per animation frame while listening.
- [ ] RoundControl states and labels (DESIGN 6.4): `connecting` "Connecting" (holding does nothing, Patrick's decision, hour 10); `idle` "Hold to talk"; `listening` "Listening"; `speaking` (`isSpeaking`) "Hold to interrupt".
- [ ] `Captions` (DESIGN 6.10): persona name once at the top: `site.name` (Patrick's decision, hour 10: persona names are not on the phone) with "AI voice" beside it; agent lines in `--type-lead` `--text`; visitor lines in `--type-body` `--text-2` under "You"; newest at the bottom; auto-scrolls only if already at the bottom; `aria-label="Captions"`, not a live region. Empty state: "{site.name} is listening. Hold the button and ask anything." Lines come from `onMessage` (final lines only, finding 12). Fact (SDK 1.36.0 source): `onMessage` fires once per agent response and once per visitor transcript, never for tentative text; key each line by `event_id` and `role`. `timeup` adds the last line "Time is up for this conversation." and the questions of B2-2.b appear.
- [ ] Greeting (Patrick's decision, hour 10): on mount, if `greetingFor(site.id, lang)` is a file, play it at once through `playClip` (B2-2.b.1 adds `playClip`; until then this box waits for it). No greeting file → silence until the agent's first message. No `en` fallback for the greeting. On `connected` the greeting clip is stopped (`stopClip()`), so two voices never overlap (Patrick's decisions, hour 10).
- [ ] Client tool `set_light`: `parseLight(params)`; valid → a full-screen overlay in that hex at that alpha, transition `--dur-glow` `--ease-in-out`, kept until the next `set_light` or Talk closes; returns `LIGHT_OK`; invalid → returns `LIGHT_UNKNOWN`, no change.
- [ ] Client tool `start_colour_catch` (Patrick's decision, hour 10): returns a Promise. Talk shows a primary L button "Catch a colour" above the RoundControl while the call waits (Patrick's decision, hour 10). Its tap calls `openRearCamera()` inside the tap (iOS) and shows `ColourLens` over Talk with `site`, `remote`, `demo`, `camera`, `panes`, `addPane`; the conversation stays connected and `Talk` stays mounted. `onCaught(reading)` resolves `caughtLine(reading.hex)` and closes the lens; `onBack` resolves `LENS_CLOSED` and closes it. A second call while one is open resolves the first with `LENS_CLOSED`. Leaving Talk resolves an open one with `LENS_CLOSED`. Leave `onReading` and `onComplete` unset (B2-3.b.1 adds them).
- [ ] Layout (DESIGN 7.3): `TopBar` (back, site name, DemoBadge in demo); Captions fill the middle; bottom: RoundControl, then "Hands-free", then "End conversation" (quiet). "End conversation" and Back both call `endSession()` and `onBack()` (Patrick's decision, hour 10). Station open motion per DESIGN 5.2. Tokens only.
- [ ] Tests in `talk.test.tsx` (`renderToStaticMarkup`, no SDK connection, no DOM): Captions empty state text; Captions with one agent and one visitor line shows "You" once and "AI voice" once; region `aria-label="Captions"` and no `aria-live`. The SDK wiring in `useLiveTalk.ts` is read, not tested (no WebSocket in node): say so in the report.
- Verify: `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`. Paste the summary lines.
- Done when: all three pass and `grep -rn "xi-api-key\|ELEVENLABS" apps/web/src/talk` prints nothing.

#### B2-1.d Talk opens from the Site view

**B2-1.d.1** Talk wiring. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/SiteView.tsx`, the Talk lines only. Starts only after this session records Ionut's yes in the glossary.

- [ ] `view` gains `"talk"`. The Talk button's `onClick`, inside the tap and before any `await`: `navigator.mediaDevices.getUserMedia({ audio: true })` turned into a `Promise<"granted" | "denied">` (granted: stop every track at once, the SDK opens its own), stored in state, then `setView("talk")`. `view === "talk"` renders `<Talk site demo remote mic onBack={() => setView("site")} panes={remote ? local : live.panes} addPane={remote ? … : live.addPane} />`, the same panes logic as the lens.
- [ ] Nothing else in the file changes.
- Verify: `npm run typecheck -w @lampa/web`, `npm test -w @lampa/web`, `npm run build -w @lampa/web`; `git diff --stat apps/web/src/phone/SiteView.tsx`. Paste.
- Done when: all pass and the diff touches only `SiteView.tsx`.

#### B2-1.e Client tools on the agent

Patrick's check in the ElevenLabs dashboard, agent `LAMPA monument`, Tools, "Add tool", type Client. The descriptions below steer the LLM and are Patrick's wording (Patrick's decisions, hour 10). Do not mark it done until the read below passes.

- [ ] `set_light`: description "Change the colour of the light on the visitor's screen."; parameters `color` string, required, "A colour as #rrggbb"; `intensity` number, required, "0 to 1". "Wait for response" off.
- [ ] `start_colour_catch`: description "Ask the visitor to catch a colour of this place with their camera. Returns the colour they caught."; no parameters; "Wait for response" on (`expects_response: true`), response timeout 120 s (findings 13).
- [ ] This session verifies with a names-and-booleans read of `GET /v1/convai/agents/{id}` and `GET /v1/convai/tools` (as for the webhook tools at hour 9): the agent lists four tools, `get_site_stats`, `get_recent_echo`, `set_light`, `start_colour_catch`; `start_colour_catch` has `expects_response` `true` and `response_timeout_secs` 120; `set_light` has parameters `color` and `intensity`. Then `npm run agent:check` → exit 0.
- Done when: the read prints the four names and the two values, and `agent:check` passes.

#### B2-1.f Live smoke test

Patrick's check. Do not mark it done. After `patrick/b2-talk` is merged and deployed, Patrick opens `https://lampa-timisoara.vercel.app/s/unirii?demo=1` on the iPhone, taps Talk, allows the microphone, holds the button and asks one question, then asks to catch a colour. One session, ended with "End conversation"; if it fails, one more session after a fix (Patrick's decisions, hour 10). Reported: the persona answered (Checkpoint 2 line 3), captions showed both lines, and whether `start_colour_catch` opened the button and the lens.

### B2-2 Talk fallback (1.5 h)

#### B2-2.0 Piața Unirii content

Patrick's task. Patrick writes it himself; this session does not draft it unless Patrick asks (Patrick's decision, hour 10). Do not mark it done before the verify passes.

- [ ] In `content/sites/02-unirii.yaml`, under `persona:`: `name` (ro, en), `traits`, `first_message` (ro, en), `cathedral_line` (ro, en), and `tap_to_ask` with three entries, each `id`, `q` (ro, en), `a` (ro, en), as defined in `apps/api/src/content.ts`. Every answer is under three sentences. No text about 1989 except the `cathedral_line`. `facts` stays as it is (the team's).
- Verify (this session): `npm run publish:site -- --site unirii` → the dry run plans 1 greeting per language and 3 answers per language as `new`, and prints the total. Paste the plan lines and the total.
- Done when: the dry run lists 2 greetings and 6 answers.

#### B2-2.a Question text in the clips manifest

**B2-2.a.1** `tapToAsk` in `toClips`. Subagent: `patrick-elevenlabs`. Files: `apps/api/src/publish/publish.ts`, `publish.test.ts`.

- [ ] `SiteClips` in `publish.ts` gains `tapToAsk: { id: string; q: Record<string, string>; a: Record<string, string> }[]`, the same as the seam in `apps/web/src/audio/clips.ts`.
- [ ] `toClips` fills it from `persona.tap_to_ask` of each site file, in file order, `id`, `q`, `a` copied as they are, whether or not a clip file exists (Patrick's decision, hour 10: the text works with no clip); `[]` for a site without `tap_to_ask`, for the memorial and for a malformed `persona` the planner already rejects.
- [ ] Tests by name: "toClips copies tap_to_ask text in file order"; "toClips gives [] without tap_to_ask"; "toClips keeps the text when the answer clip is missing".
- Verify: `npm test -w @lampa/api`, `npm run typecheck -w @lampa/api`. Paste.
- Done when: both pass and removing the copy fails the first test.

#### B2-2.b Tap-to-ask in Talk

**B2-2.b.1** Fallback screen, clip playback, browser voice. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/clip.ts`, `apps/web/src/talk/speak.ts`, `apps/web/src/talk/Talk.tsx`, `Talk.module.css`, `talk.test.tsx`.

- [ ] `clip.ts`: `playClip(file: string): Promise<"ended" | "stopped" | "failed">` loads `AUDIO_BASE + file` with `fetch` and `decodeAudioData` and plays it through `getAudioContext()` (the context Join unlocked in the tap, so iOS plays it outside a tap); a non-200 or a failed decode is `"failed"` (Vercel answers a missing file with `index.html`, as in `engine.ts`). `stopClip()` stops the current clip, which resolves `"stopped"`. One clip at a time: a new `playClip` stops the old one. Decoded buffers are cached by file. No retry.
- [ ] `speak.ts`: `speak(text: string, lang: AgentLang): Promise<"ended" | "failed">` with `speechSynthesis` and a `SpeechSynthesisUtterance` whose `lang` is the code; `"failed"` when `speechSynthesis` is missing or the utterance errors. `stopSpeaking()`.
- [ ] In `Talk.tsx`, mode `fallback` (DESIGN 7.3, 7.0): Notice info "Live conversation is resting. Tap a question." for `resting`; Notice error "The microphone is off, so the monument cannot hear you. Tap a question instead, or allow the microphone in your browser settings." for `mic_off`. The RoundControl and "Hands-free" are replaced by one secondary L button per question from `questionsFor(site.id, lang)`, full width, left-aligned text. Mode `timeup` shows the same buttons with no Notice.
- [ ] A tapped question: stop any clip or speech; the button shows the pause icon and "Playing"; the others stay enabled; the answer text `a` is added to Captions as a persona line. `file` → `playClip(file)`; `"failed"` or no file → `speak(a, lang)`; that `"failed"` too → Notice error "Could not play the answer. Here it is as text." (DESIGN 7.3). Tapping the playing button stops it.
- [ ] A site with no questions in fallback (Patrick's decision, hour 10): Notice info "Live conversation is resting. Try again in a few minutes." and no question buttons; Back works.
- [ ] The greeting box of B2-1.c.1: `playClip(greetingFor(...))` on mount, now that `playClip` exists.
- [ ] Leaving Talk stops any clip and speech.
- [ ] Tests in `talk.test.tsx` by name: "fallback shows one button per question"; "fallback with no questions shows the resting line with try again"; "mic off shows the microphone notice". Render the fallback part as a component with props so it renders with `renderToStaticMarkup` and no SDK. `playClip` and `speak` are read, not tested (no AudioContext or speechSynthesis in node): say so in the report.
- Verify: `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`. Paste.
- Done when: all pass and the three named tests exist.

#### B2-2.c Unirii clips (paid run)

This session, after B2-2.0 and B2-2.a.1, and only after Patrick says go for this run.

- [ ] Read the credit meter (`GET /v1/user/subscription`, credit numbers only) before.
- [ ] `npm run publish:site -- --site unirii --run`: makes the 2 greetings and 6 answers in `eleven_v3`, rewrites `clips.json` with `greeting`, `answers` and `tapToAsk` for unirii. Read the meter after.
- [ ] Patrick listens to the eight clips (Patrick's check). A clip he rejects is reported to him; a retake is his decision.
- Verify: `npm run publish:site -- --site unirii` → every item `exists`, `total new 0 credits`; `node -e "const c=require('./apps/web/src/audio/clips.json').sites.unirii; console.log(Object.keys(c.greeting).length, Object.keys(c.answers).length, c.tapToAsk.length)"` → `2 3 3`. Paste.
- Done when: both print as above and the clips and `clips.json` are committed (`feat(audio) generated the Piața Unirii greeting and answers`).

### B2-3 Colour to note (0.5 h)

#### B2-3.a Note maths and lens sounds

**B2-3.a.1** Bodies of the `note.ts` seam. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/note.ts`, `note.test.ts`.

- [ ] Numbers (Patrick's decision, hour 10): `PENTATONIC` `[0, 2, 4, 7, 9]` semitones; step index `floor(hue / 72)` for hue in 0 to under 360 (5 arcs of 72° from 0°); octave −1 for lightness under 0.35, 0 up to and including 0.65, +1 above; `noteRate = 2 ** ((step + 12 × octave) / 12)`; `hue` null (night glass) → step 0, octave −1 (`0.5`). `TONE_GAP_MS = 250`, `TONE_GAIN = 0.4`, `CLINK_GAIN = 0.6`, `CLINK_S = 0.6`, `CHORD_GAIN = 0.25`, `CHORD_MAX = 5`. Saturation is not used.
- [ ] `readingTone(reading)`: note from `reading.bin === null ? null : reading.hue` and `reading.lightness`; plays the glass sample (`clips.project.glass`, loaded once through `getAudioContext()`, `fetch` and `decodeAudioData`) at that `playbackRate` and `TONE_GAIN` only when the rate differs from the last tone's and at least `TONE_GAP_MS` passed since it.
- [ ] `caughtClink(reading)`: the same note one octave up (`rate × 2`), `CLINK_GAIN`, stopped after `CLINK_S`.
- [ ] `windowChord(hexes)`: non-null hexes → note via `hexHue(hex)` (null hue counts as night glass) and the HSL lightness of the hex; distinct rates, lowest `CHORD_MAX`, all started at the same `currentTime`, each at `CHORD_GAIN`.
- [ ] A glass sample that fails to load: nothing plays, one console line, no retry within the page.
- [ ] Tests by name: "hue arcs map to the five pentatonic steps" (0, 71.9, 72, 144, 216, 288, 359.9); "lightness picks the octave" (0.34, 0.35, 0.65, 0.66); "night glass is step 0 an octave down"; "chord notes are distinct and at most five" (a pure helper `chordRates(hexes)` exported for the test); "tone throttle" (a pure helper `shouldPlay(rate, now, last)` exported for the test: same rate → no; new rate after 249 ms → no; after 250 ms → yes). Playback is read, not tested (no AudioContext in node).
- Verify: `npm test -w @lampa/web`, `npm run typecheck -w @lampa/web`. Paste.
- Done when: both pass, and changing `TONE_GAP_MS` or the 0.35 boundary fails a test.

#### B2-3.b The lens plays

**B2-3.b.1** Lens callbacks. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/SiteView.tsx` (the `ColourLens` lines only), `apps/web/src/talk/Talk.tsx` (the `ColourLens` lines only). Cut first if the block runs late.

- [ ] Both places pass `onReading={readingTone}`, `onCaught` that calls `caughtClink(reading)` (Talk: before resolving the tool), and `onComplete={() => windowChord(<the panes' 48 hexes at that moment>)}` from the same `panes` the lens shows.
- [ ] Nothing else in either file changes.
- Verify: `npm run typecheck -w @lampa/web`, `npm test -w @lampa/web`, `npm run build -w @lampa/web`, `git diff --stat`. Paste.
- Done when: all pass and the diff touches only the two files.

### B2-4 Before sleep

#### B2-4.a Batch run for all five sites

This session, at the end of the block, only after Patrick says go.

- [ ] `npm run publish:site -- --site all` (dry run): every bed and the unirii clips `exists`; the four other persona sites and the Cathedral plan no speech item while their content is missing (Blocked, Speech clips). Report the plan lines and total to Patrick.
- [ ] If the total is above 0 and Patrick says go: `npm run publish:site -- --site all --run`, meter before and after.
- Done when: the dry run shows `total new 0 credits`, or the run finished and the dry run after it does.

### B2-5 Bed picks

#### B2-5.a Patrick picks a take per site

Patrick's check (Checkpoint 2 line 5). This session writes the file.

- [ ] Patrick listens to the two takes of each of the five beds (`apps/web/public/audio/<site>/bed-1-…wav`, `bed-2-…wav`) and names a take per site.
- [ ] This session writes `apps/web/src/audio/picks.json` as `{ "<site>": 1 | 2 }` for all five, on `patrick/b2-note`.
- Verify: `node -e "const p=require('./apps/web/src/audio/picks.json');console.log(['mx','unirii','victoriei','bastion','cathedral'].every(s=>p[s]===1||p[s]===2))"` → `true`; `npm test -w @lampa/web`. Paste.
- Done when: `true` and the tests pass.

### B2-last Integrate and hand over (last, this session)

- [ ] All branches of this block merged into a local throwaway branch, `npm test`, `npm run typecheck` and `npm run build` green on it.
- [ ] Secret scan: `git log -p origin/main..patrick/b2-work | grep -ciE "xi-api-key|sk_[a-z0-9]{20}|signed_url=|ELEVENLABS_API_KEY="` → 0.
- [ ] Push each branch and open its PR with `gh`, in this order: `patrick/b2-talk`, then `patrick/b2-note` after the first is merged. Each PR lists what was verified and what is waiting for a phone, and asks Ionut to review the `SiteView.tsx` lines.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked, and Hand-offs lists what other lanes can now use.
- [ ] Patrick's checks on real phones, listed and not claimed:
  - iPhone, deployed, after `patrick/b2-talk`: B2-1.f (Checkpoint 2 line 3).
  - iPhone, at Checkpoint 2 with Cristea: `ELEVENLABS_API_KEY` removed on Render (Cristea), Talk at `/s/unirii` shows "Live conversation is resting. Tap a question." within 8 s and the three questions play their clips, without a reload (line 4). Key restored after.
  - iPhone, microphone refused in the prompt: the microphone Notice and the questions.
  - Ionut's Android, after `patrick/b2-note`: the lens plays a tone that changes with the colour, a clink on catch.
  - B2-5.a (line 5).
- Done when: every box is ticked or listed as Patrick's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: persona and tap-to-ask content for mx, victoriei, bastion and the Cathedral narrations (team); unirii's persona reaching the `sites` table without wiping events (Fabi, B1-1.b); Ionut's yes for the `SiteView.tsx` lines.
- **Not finished at hour 16.5:** each ID, what is left, and its place in the cut order (B2-3.b first, then the `set_light` tint).
- **Phone checks for Patrick:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating: Talk at a site whose persona is not in the `sites` table speaks as "the Lamp"; `ColourLens` is mounted from Talk as well as from the Site view.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 2: Colours and Talk

- Tapping Talk at a persona site opens Talk, asks for the microphone, and connects a live session with the signed URL, overrides when the API sends them, and the eight dynamic variables.
- `set_light` and `start_colour_catch` are on the agent and in the browser; `start_colour_catch` returns the caught colour's name and hex.
- With no session after 8 s, on any session error, or with the microphone refused, Talk shows tap-to-ask without a reload; a late session is ended at once.
- Piața Unirii has three questions with clips in ro and en and a greeting in both; a missing clip is read by the browser voice.
- The lens plays a tone from hue and lightness, a clink on catch and a chord on a completed window (or B2-3.b is listed as cut).
- `picks.json` names a take for all five sites.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `patrick/GLOSSARY.md` matches the state of the branch.

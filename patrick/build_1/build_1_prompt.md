# Prompt: Patrick's Build 1: the spine (Patrick, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 7 (2026-11-13 21:09 +0200). Implementation not started.**

You are implementing Patrick's part of Build 1: the spine (hours 2 to 10 in the plan, run by Patrick from hour 7.5 to hour 15.5) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *a tap on a phone changes what `/screen` shows.*

Checkpoint this block must pass: *1. On the iPhone and on the Android, one tap grants location and compass and a sound bed plays.* and *4. `npm test` is green.*

## 0. Ground rules

- **Patrick takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Patrick, with your recommendation. Nothing uses the recommendation until Patrick answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block runs from hour 7.5 to hour 15.5 (Patrick's decision, hour 7).** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Patrick: carrying on, cutting (plan section 7) or moving it is their decision. If the block runs late, cut from the end of the order: the project sounds (B1-3) move to Build 2 first.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Patrick, who takes it to the team. When another lane's endpoint has not landed, code against its schema. This block changes nothing in `packages/shared`.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Patrick's approval. Approved: none. The publish code uses the global `fetch`, `node:crypto`, `node:fs` and the `yaml` and `zod` already in the repo. No ElevenLabs SDK (Patrick's decision, hour 7).
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. **`ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` never appear in the chat, in a commit, in a glossary line or in command output** (Patrick's decision, hour 5). Do not open, print or `cat` the root `.env`. Scripts print statuses, file names, credit numbers and `true` or `false`, never a key, an id or a response body. Voice IDs are not secret and go into the site files.
- `main` deploys by itself. The `patrick/` docs commit goes straight to `main`, as in Setup (Patrick's decision, hour 5). After it, all work happens on the local branch `patrick/b1-work`, which is never pushed. Three PR branches are cut from `origin/main` and get their commits by cherry-pick, in this order (Patrick's decision, hour 7): `patrick/b1-engine` (clips seam, engine, wiring, the five bed prompts, the generated beds and `clips.json`), `patrick/b1-persona` (content seam, renderer, `getPersona`, the `app.ts` line, voice IDs), `patrick/b1-publish` (publish code, CLI, root script, project sounds), cut only after the first two are merged, because `publish.ts` imports the content seam and writes the clips manifest. One small PR per branch. Open it only after the verify commands pass. Cristea merges every team PR. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- **Live ElevenLabs calls cost credits.** Develop against fakes. In this block only this session makes live generation calls, and only `npm run publish:site -- ... --run` after Patrick says go for that run. No agent runs `--run`, except the one spend-proof verify of B1-2.c.1 (no env file, empty key, `--max-credits 0`). No live Talk.
- **Models (Patrick's decisions, hour 6):** TTS `eleven_v3`; sound effects `eleven_text_to_sound_v2` with `model_id` set and every sound 22 s or less; music `music_v2_5` with `model_id` set. `/music-terms` is read in Build 1 before the waltz is used outside the demo.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. Narrations are read aloud word for word from the team's checked text; nothing writes text about 1989.
- **No placeholder content.** Nobody in this block writes persona text, facts, tap-to-ask answers or narrations into `content/sites/`. Tests use fixtures inside the test files. The only content Patrick writes is the five `sound_bed` lines and the voice IDs.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. This block adds no visible element.
- Write in `patrick/` only. Other members' folders are read-only. Files outside the lane that this prompt lets you touch: `apps/api/src/app.ts` (one line), `apps/web/src/phone/SiteView.tsx`, `MemorialStub.tsx`, `Join.tsx` (one line each, after Ionut agrees), `content/sites/*.yaml` (`sound_bed`, `persona.voice`, `narrator_voice` only), root `package.json` (one script). Each gets a Changes line.
- **Keep `patrick/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Patrick a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 7, 2026-11-13 20:51 to 21:09 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200). Patrick's Setup is done and merged (PR #24, `6297852`). Nothing carried over from Setup. `main` is at `1063e29` at 21:09, `git pull` up to date.
- The other three lanes have finished Build 1 and are in Build 2. Patrick starts Build 1 at hour 7.5.
- Checkpoint 1 lines 2 and 3 were run by the team before 21:09 (`fabi/GLOSSARY.md`, B1-last phone): a tap on Ionut's iPhone at the deployed `/s/mx` brightened Muzeul MX on `/screen`. Line 1's "a sound bed plays" was not part of it: no bed exists yet.
- `apps/api/src/agent/session.ts` (Cristea) serves `GET /agent/session` and takes `getPersona?: (siteId, lang: AgentLang) => Promise<Persona | null>` with `Persona = { prompt, firstMessage, voiceId }`. Without a persona it sends no `overrides`. A throw in `getPersona` answers 503 `agent_unavailable`. `apps/api/src/app.ts` line 18 mounts `createAgentRouter()` with no arguments. Cristea's Blocked row B2-1 waits for Patrick's `getPersona` line there.
- `apps/api/src/seam.ts` (Fabi): `Db = { query(text, params?) }`; `AppDeps = { db?, onEventsStored?, latestGlow? }`. The `sites` table has `name jsonb`, `persona jsonb`, `facts jsonb`, `is_memorial`, `status` (`draft` or `published`).
- `apps/api/src/db/seed.ts` (Fabi): `parseSiteFile(text)` validates one site YAML as a loose object and keeps unknown keys; `toSiteRow` copies `persona` and `facts` into the table, and nothing else of the new keys. `npm run db:reset` wipes every table, events included, and reseeds from `content/sites/`.
- `content/sites/01-mx.yaml` … `05-cathedral.yaml` exist with approximate coordinates and **empty content**: `persona: { voice: "", traits: "" }`, `facts: []`, `sound_bed: ""`, `directions_hint: {}`. No key exists yet for persona name, first message, tap-to-ask, Cathedral line or narrations. This block defines them (seam in section 3); the team fills them.
- `packages/shared`: `sites` (from `sites.json`, with `is_memorial`), `AgentLang` (`ro`, `en`, `hu`, `de`, `sr`), `AgentSession`.
- `apps/web/src/audio/context.ts` (Ionut): `getAudioContext()`, `unlockAudio()`. `primeDevice` resumes the context inside the join tap. `Join.tsx` renders `SiteView` for persona sites and `MemorialStub` (props `name`, `demo`, `notice`; no site id) for the Cathedral. Ionut's Blocked row of hour 1: "No sound bed plays after the tap", waiting on Patrick.
- Not there yet, added by this block: `apps/web/public/` (Vite's default public folder, served at `/`), `apps/web/src/audio/engine.ts`, `useBed.ts`, `clips.ts`, `clips.json`, `picks.json`, `apps/api/src/content.ts`, `apps/api/src/agent/persona.ts`, `apps/api/src/publish/`, `scripts/publish-site.ts`, the root script `publish:site`.
- Root scripts: `dev`, `build`, `typecheck`, `test` (all workspaces), `db:reset`, `glow:check`, `agent:check`. `npm test -w @lampa/api` and `npm test -w @lampa/web` run Vitest (web: `node` environment, no DOM). `scripts/` belongs to no workspace, so `typecheck` and `test` do not cover it.
- "Needs from others" for Build 1: site content YAML at hour 0. **Not landed**: coordinates are approximate and content is empty (`fabi/GLOSSARY.md` Hand-off, hour 5). Patrick's answer (hour 7): code and tests run on fixtures; the team fills content; each site is generated when its content lands.
- Deployed at 20:51: web `https://lampa-timisoara.vercel.app/` answered 200; API `https://lampa-api-b45i.onrender.com/health` answered 200 `{"ok":true}`. Vercel rewrites unknown paths to `/index.html`; a real file in `public/` is served first (checked in B1-last).
- ElevenLabs docs read at hour 7: `POST /v1/sound-generation` takes `output_format` as a query parameter (default `mp3_44100_128`; `wav_24000` allowed; PCM and WAV at 44.1 kHz need Pro), body `text`, `loop` (default false), `duration_seconds` 0.5 to 30, `model_id`. `POST /v1/text-to-voice/design` exists; its page states no cost. Rates for estimates come from `patrick/setup/elevenlabs_findings.md`: TTS 1 credit per character, sound effects 40 credits per second, music budgeted at 2,727 credits per minute (Findings 3).
- The Setup API key has Agents Write. Whether it also has Text to Speech, Sound Effects and Music access: not checked (B1-0).
- Patrick has an iPhone and no Android phone. No `graphify-out/`. `.claude/agents/` holds `patrick-elevenlabs.md` (updated for this block), `patrick-web-audio.md` and `patrick-api.md` (new). A restart is needed before implementing.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 1, Patrick's rows and Checkpoint 1 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Patrick's table and "Needs from others" | All |
| `patrick/GLOSSARY.md` | Whole file | All |
| `patrick/setup/elevenlabs_findings.md` | Sketch 3 and Prices | B1-2 |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Appendix A (printed page 49); section 11.1 sketch 3 (printed page 40) | B1-1, B1-2 |
| `DESIGN.md` | 5.8 (sound cues), 7.1 (join: "Waking {Site}", 2 s fade), 7.11 (memorial: bed at 50%) | B1-4 |
| `apps/api/src/agent/session.ts`, `apps/api/src/app.ts`, `apps/api/src/seam.ts` | Whole files | B1-1 |
| `apps/api/src/db/seed.ts` | `SiteFile`, `parseSiteFile`, `toSiteRow` | B1-1, B1-2 |
| `db/migrations/001_init.sql` | The `sites` table | B1-1 |
| `content/sites/*.yaml` | Whole files | B1-1, B1-2 |
| `packages/shared/src/contract.ts`, `sites.ts` | `AgentLang`, `Site`, `sites` | B1-1, B1-4 |
| `apps/web/src/audio/context.ts`, `apps/web/src/phone/SiteView.tsx`, `MemorialStub.tsx`, `Join.tsx` | Whole files | B1-4 |
| Root `package.json`, `apps/api/package.json`, `apps/web/package.json` | Scripts | All |
| `https://elevenlabs.io/docs/api-reference/text-to-speech/convert`, `.../text-to-sound-effects/convert`, `.../music/compose` | Path, query, body | B1-2 |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Voices for the four personas. Prompt renderer from Appendix A | 1.5 | B1-1.a, B1-1.b |
| Section 11: Four persona voices, prompt renderer | same 1.5 | B1-1.a, B1-1.b |
| Section 6: `scripts/publish-site.ts`: greeting and tap-to-ask clips per language, two takes of each sound bed, files named by input hash so nothing is paid for twice. For a memorial site: narrations in a calm narrator voice instead of persona clips | 3.5 | B1-2.a, B1-2.b, B1-2.c, B1-2.d |
| Section 11: `scripts/publish-site.ts`, including the memorial narrator | same 3.5 | B1-2.a, B1-2.b, B1-2.c, B1-2.d |
| Section 6: Project-wide sounds: glass tone, lamp crackle, arrival chime, waltz | 0.5 | B1-3.a |
| Section 11: Glass tone, crackle, chime, waltz | same 0.5 | B1-3.a |
| Section 6: Audio engine v1: unlock on tap, load and loop a bed, gain follows glow | 1.5 | B1-4.a, B1-4.b, B1-4.c |
| Section 11: Audio engine v1: unlock, loop a bed, gain from glow | same 1.5 | B1-4.a, B1-4.b, B1-4.c |
| Section 11, Cristea's needs: `publish-site.ts` as an importable function from Patrick for add-a-place | in B1-2 | B1-2.b (`publishSite` in `apps/api/src/publish/`) |
| Checkpoint 1, line 1: On the iPhone and on the Android, one tap grants location and compass and a sound bed plays. | in B1-4 | B1-4.c, B1-last |
| Checkpoint 1, line 4: `npm test` is green. | none given | B1-last |
| Section 8: no test is Patrick's. `DESIGN.md` section 9: no item is Patrick's in Build 1 (item 5 is Build 2) | none | none |

Total: 7 h of tasks in an 8 h block (hour 7.5 to 15.5): B1-1 1.5 h, B1-2 3.5 h, B1-3 0.5 h, B1-4 1.5 h.

Order (Patrick's decision, hour 7): B1-0. The session commits both seams. Then three agent tasks start in parallel: B1-4.a.1 (engine), B1-1.b.1 (persona), B1-2.b.1 (publish core). Patrick meanwhile does B1-1.a (voices) and B1-2.a (bed prompts) by hand and asks Ionut about the wiring. Then B1-2.c.1 (CLI) after B1-2.b.1, and B1-4.b.1 (wiring) after B1-4.a.1 and Ionut's yes. Then B1-2.d (bed run). PR `patrick/b1-engine` goes first, before Checkpoint 1 if the clock allows; then `patrick/b1-persona` (Cristea's B2-1 waits on it); then B1-3.a and `patrick/b1-publish`.

#### Seams (this session commits them before starting the agents)

`apps/api/src/content.ts`: the site-file keys Patrick's lane reads (Patrick's decision, hour 7). Read by B1-1.b.1 and B1-2.b.1.

```ts
import { z } from "zod";

/** Language code -> text. `en` is the fallback. An empty string counts as missing. */
export const Text = z.record(z.string(), z.string());
export type Text = z.infer<typeof Text>;

export const Fact = z.object({ text: z.string(), source: z.string() });
export const TapToAsk = z.object({ id: z.string().min(1), q: Text, a: Text });

/** `persona:` of a persona site. Reaches the `sites` table through `toSiteRow`. */
export const PersonaContent = z.looseObject({
  name: Text.optional(),
  voice: z.string().optional(),
  traits: z.string().optional(),
  first_message: Text.optional(),
  cathedral_line: Text.optional(),
  tap_to_ask: z.array(TapToAsk).optional(),
});
export type PersonaContent = z.infer<typeof PersonaContent>;

export const Narration = z.object({ id: z.string().min(1), title: Text, text: Text, source: z.string() });

/** Top-level keys of the memorial site file. Read by the publish script only. */
export const MemorialContent = z.looseObject({
  narrator_voice: z.string().optional(),
  narrations: z.array(Narration).optional(),
});
export type MemorialContent = z.infer<typeof MemorialContent>;
```

`apps/web/src/audio/clips.ts` with `clips.json` = `{ "sites": {}, "project": { "waltz": [] } }` and `picks.json` = `{}`: written by the publish CLI (B1-2.c.1), read by the engine (B1-4.a.1).

```ts
import clipsJson from "./clips.json";
import picksJson from "./picks.json";

/** File paths under `apps/web/public/audio/`, served at `AUDIO_BASE`. Keep in step with `SiteClips` in `apps/api/src/publish/`. */
export type SiteClips = {
  beds: string[]; // take 1 first
  greeting: Record<string, string>; // lang -> file
  answers: Record<string, Record<string, string>>; // tap_to_ask id -> lang -> file
  narrations: Record<string, Record<string, string>>; // narration id -> lang -> file
};
export type ProjectClips = { glass?: string; crackle?: string; chime?: string; waltz: string[] };
export type Clips = { sites: Record<string, SiteClips>; project: ProjectClips };

export const AUDIO_BASE = "/audio/";
export const clips = clipsJson as Clips;
/** Hand-edited by Patrick after listening (Checkpoint 2 line 5): site id -> take 1 or 2. Without a pick, take 1 plays. */
export const picks = picksJson as Record<string, 1 | 2>;
```

### 3.1 Subagents

Patrick asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Patrick, re-runs the checks, writes the glossary, runs the live generation with Patrick's go, and does B1-0, the seams and B1-last. It does not implement the agent tasks itself. B1-1.a, B1-2.a and B1-4.c are Patrick's own work; B1-2.d and B1-3.a are live runs by this session.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `patrick-elevenlabs` | ElevenLabs generation code (`publishSite`) and its CLI | `opus` | reused from Setup, scope widened |
| `patrick-api` | Express and TypeScript in `apps/api`: prompt renderer, `getPersona` | `opus` | new |
| `patrick-web-audio` | Web Audio engine and React hook in `apps/web` | `opus` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B1-1.b.1 | `patrick-api` | Renderer, `getPersona`, the `app.ts` line, tests | `apps/api/src/agent/persona.ts`, `persona.test.ts`, `apps/api/src/app.ts` | after the seams, parallel with B1-2.b.1 and B1-4.a.1 |
| B1-2.b.1 | `patrick-elevenlabs` | `publishSite`, `publishProject`, `toClips`, tests | `apps/api/src/publish/publish.ts`, `publish.test.ts` | after the seams, parallel with B1-1.b.1 and B1-4.a.1 |
| B1-2.c.1 | `patrick-elevenlabs` | CLI and root script | `scripts/publish-site.ts`, root `package.json` | after B1-2.b.1 |
| B1-4.a.1 | `patrick-web-audio` | Engine, `useBed`, tests | `apps/web/src/audio/engine.ts`, `engine.test.ts`, `useBed.ts` | after the seams, parallel with B1-1.b.1 and B1-2.b.1 |
| B1-4.b.1 | `patrick-web-audio` | Three wiring lines in Ionut's files | `apps/web/src/phone/SiteView.tsx`, `MemorialStub.tsx`, `Join.tsx` | after B1-4.a.1 and Ionut's yes |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Patrick to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Patrick. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- The agents share one working tree on `patrick/b1-work`. They do not run `git add`, `git commit`, `npm install` or a live ElevenLabs call. This session commits each agent's files as their own commit after re-running its verify command, so each commit can be cherry-picked to its PR branch.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Patrick, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B1-0 Preflight (first, this session)

- [ ] `node -v` prints `v26.`; `git config user.name` prints `petrix0`.
- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Commit `patrick/` to `main` as `docs(patrick) added Patrick's Build 1 prompt and glossary lines` and push. The commit holds `patrick/GLOSSARY.md` and `patrick/build_1/build_1_prompt.md` only.
- [ ] `git switch -c patrick/b1-work`.
- [ ] `npm ci` if `node_modules` is older than `package-lock.json`.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-read the Blocked and Hand-offs tables of `cristea/`, `fabi/` and `ionut/GLOSSARY.md` on `origin/main`. List what moved since section 1, especially any content in `content/sites/`.
- [ ] Patrick's check, do not mark it done: in the ElevenLabs dashboard, the API key in `.env` has access to Text to Speech, Sound Effects and Music (and keeps Agents Write). Patrick says yes or changes the key.
- [ ] Write the two seams of section 3 exactly as given and run `npm run typecheck`. Commit them as two commits, so each can be cherry-picked to its branch: `feat(api) added the content keys seam` (`apps/api/src/content.ts`) and `feat(audio) added the clips manifest seam` (`apps/web/src/audio/clips.ts`, `clips.json`, `picks.json`).
- Done when: the docs commit is on `origin/main`, the baseline is recorded with failures that were already there listed and not fixed silently, and the seam commit is on `patrick/b1-work`.

### B1-1 Voices for the four personas, prompt renderer from Appendix A (1.5 h)

#### B1-1.a Five voices are chosen and their IDs are in the site files (0.25 h)

Patrick's task, by hand in the ElevenLabs dashboard (Patrick's decision, hour 7: library voices, no Voice Design). Do not mark it done.

- [ ] Patrick picks one voice from the ElevenLabs voice library for each persona site (`mx`, `unirii`, `victoriei`, `bastion`) and one calm narrator voice for the Cathedral. No cloned real person. Each voice must speak Romanian and English (TTS model `eleven_v3`).
- [ ] Patrick tells this session the five voice names and IDs. This session writes each ID into `persona.voice` of the four persona files and into a new top-level `narrator_voice:` of `05-cathedral.yaml`, and changes nothing else in those files. Commit as `feat(content) added the persona and narrator voice ids`, with a Changes line (team files) and a Done line listing the voice names.
- Verify: `grep -c 'voice: "[A-Za-z0-9]\{10,\}"' content/sites/0[1-4]-*.yaml` prints `1` per file, and `grep -c '^narrator_voice: "' content/sites/05-cathedral.yaml` prints `1`.
- Done when: five IDs are in the files and named in the glossary.

#### B1-1.b `getPersona` gives Cristea's route a rendered Appendix A prompt per site and language (1.25 h)

**B1-1.b.1** Prompt renderer and `getPersona`. Subagent: `patrick-api`. Files: `apps/api/src/agent/persona.ts`, `apps/api/src/agent/persona.test.ts`, `apps/api/src/app.ts`.

- [ ] `persona.ts` exports `APPENDIX_A` (string), `LANGUAGE_NAMES`, `renderPersonaPrompt(site, lang)` and `makeGetPersona(db: Db)`, with `Db` from `../seam.js`, `AgentLang` from `@lampa/shared`, `PersonaContent` and `Fact` from `../content.js`, and `Persona` from `./session.js`.
- [ ] `APPENDIX_A` is the Appendix A text, line for line as in concept page 49, with `Timișoara` spelled with ș:

```
You are {{persona_name}}, the voice of {{site_name}} in Timișoara.
You are part of LAMPA, a public art installation. You are an AI voice; say so if asked.
Speak {{visitor_language}}. Keep every answer under three sentences: the visitor is standing in the street.
Personality: {{persona_traits}}.
Only state historical facts from your knowledge base. If you are unsure, say you don't remember and invite the visitor to tell you what they know.
Right now: local time {{local_time}}; your glow is {{site_glow}}%; {{colours_today}} colours were caught here today; {{lamps_lit_today}} of 731 lamps are lit in the city.
The visitor has already been to: {{sites_visited}}. Never assume an order; react to where they have been.
Returning visitor: {{returning_visitor}}. If "yes", greet {{visitor_name}} like an old friend.
Goals, in order:
1. make the visitor feel the place;
2. invite exactly one action (start_colour_catch, start_echo_recording or set_light); when a colour is caught, say something about that colour and this place;
3. suggest the next sleeping site with suggest_next_site and give its landmark hint.
Never ask for personal data. Do not discuss politics beyond the curated history in your knowledge base.
```

- [ ] `LANGUAGE_NAMES = { ro: "Romanian", en: "English", hu: "Hungarian", de: "German", sr: "Serbian" }`.
- [ ] `renderPersonaPrompt` replaces exactly four slots: `{{persona_name}}` with `persona.name[lang]`, else `persona.name.en`; `{{site_name}}` with the site's `name[lang]`, else `name.en`; `{{visitor_language}}` with `LANGUAGE_NAMES[lang]`; `{{persona_traits}}` with `persona.traits`. The seven dynamic variables (`visitor_name`, `local_time`, `site_glow`, `colours_today`, `lamps_lit_today`, `sites_visited`, `returning_visitor`) stay as literal `{{…}}` text (Findings 11, hour 6). Then it appends, after one empty line, `Your knowledge base:` and one line per fact `- <text> (source: <source>)`, and after one more empty line `If the visitor asks about the Metropolitan Cathedral or December 1989, say only this: <cathedral_line>` with `cathedral_line[lang]`, else `cathedral_line.en`. With no facts, the knowledge-base heading is followed by the line `- (none yet)`.
- [ ] `makeGetPersona(db)` returns `(siteId, lang) => Promise<Persona | null>`. It runs `SELECT name, persona, facts, is_memorial FROM sites WHERE id = $1 AND status = 'published'`. It returns `null` when there is no row, when `is_memorial` is true, when `PersonaContent.safeParse(persona)` fails, or when any of these is missing or an empty string: `persona.name.en`, `persona.voice`, `persona.traits`, `persona.first_message.en`, `persona.cathedral_line.en` (Patrick's decisions, hour 7). Facts that fail `Fact` are left out. Otherwise it returns `{ prompt: renderPersonaPrompt(...), firstMessage: first_message[lang] or first_message.en, voiceId: persona.voice }`. A database error is thrown, not caught: Cristea's route turns it into 503.
- [ ] `apps/api/src/app.ts`: add the property `getPersona: deps.db && makeGetPersona(deps.db)` to the object `createAgentRouter` receives (at hour 7 it receives none, so the call becomes `createAgentRouter({ getPersona: deps.db && makeGetPersona(deps.db) })`; if Fabi's `getSiteStats` is already there, keep it), and add the import. Nothing else in the file.
- [ ] Tests in `persona.test.ts`, named: "fills the four slots"; "keeps the seven dynamic variables literal"; "lists facts with their sources"; "adds the Cathedral line in the visitor's language"; "falls back to en for name, first message and Cathedral line"; "returns null without a Cathedral line"; "returns null for each missing required field"; "returns null for the memorial"; "returns null for an unknown or draft site". `makeGetPersona` is tested with a fake `Db` that returns fixed rows. Fixtures are made-up test text in the test file, never about 1989.
- [ ] Do not run `git add`, `git commit`, `npm install`. Do not open or print `.env`.
- Verify: `npm test -w @lampa/api && npm run typecheck -w @lampa/api`. Paste the summary lines.
- Done when: all named tests pass, typecheck exits 0, and `app.ts` differs from `main` by the import and the `getPersona` property.

### B1-2 `scripts/publish-site.ts`, including the memorial narrator (3.5 h)

#### B1-2.a The five sound-bed prompts are in the site files (0.25 h)

Patrick's task, by hand (Patrick's decision, hour 7). Do not mark it done.

- [ ] Patrick writes the `sound_bed:` line of each of the five files in `content/sites/`: an ambient description of the place at dusk, no speech, no music with words. The Cathedral's is quiet (it plays at 50%, muted under a testimony, `DESIGN.md` 7.11). Nothing else in the files changes.
- [ ] This session commits it as `feat(content) added the five sound-bed prompts`, with a Changes line (team files).
- Verify: `grep -c '^sound_bed: ""' content/sites/*.yaml` prints `0` for every file.
- Done when: five non-empty `sound_bed` lines are committed on `patrick/b1-work`.

#### B1-2.b `publishSite` plans, prices and generates a site's clips without paying twice (1.5 h)

**B1-2.b.1** Publish core. Subagent: `patrick-elevenlabs`. Files: `apps/api/src/publish/publish.ts`, `apps/api/src/publish/publish.test.ts`.

- [ ] Before writing code, read `https://elevenlabs.io/docs/api-reference/text-to-speech/convert` and `https://elevenlabs.io/docs/api-reference/music/compose` for the `output_format` query parameter. If the music page lists no `output_format`, stop the music item and report it as Blocked.
- [ ] Named constants: `API = "https://api.elevenlabs.io/v1"`; `TTS_MODEL = "eleven_v3"`; `SFX_MODEL = "eleven_text_to_sound_v2"`; `MUSIC_MODEL = "music_v2_5"`; `SPEECH_FORMAT = "mp3_44100_128"`; `BED_FORMAT = "wav_24000"` (Patrick's decision, hour 7); `BED_SECONDS = 15`; `BED_TAKES = 2`; `TTS_TIMEOUT_MS = 60000`; `SFX_TIMEOUT_MS = 60000`; `MUSIC_TIMEOUT_MS = 180000`; `CREDITS_PER_CHAR = 1`; `CREDITS_PER_SFX_SECOND = 40`; `CREDITS_PER_MUSIC_MINUTE = 2727`; `MAX_CREDITS_DEFAULT = 6000`.
- [ ] Project sounds (Patrick's decision, hour 7), `PROJECT_SOUNDS`: glass, 3 s, one take, "single soft glass bell note, clear, long gentle decay"; crackle, 4 s, one take, "a 19th-century gas street lamp being lit: match strike, soft gas whoosh, gentle crackle settling into a low warm hum"; chime, 2 s, one take, "soft warm two-note glass chime, gentle, short decay, no reverb tail"; waltz, music, 45,000 ms, two takes, "1880s Viennese waltz, small salon orchestra, warm, wonder, slow crescendo". Short sounds are sound effects with `loop: false` and `SPEECH_FORMAT`; the waltz is `POST ${API}/music` with `prompt`, `music_length_ms`, `model_id` and `SPEECH_FORMAT`.
- [ ] Requests: TTS is `POST ${API}/text-to-speech/<voice_id>?output_format=<fmt>` with body `{ text, model_id }`; a sound effect is `POST ${API}/sound-generation?output_format=<fmt>` with body `{ text, model_id, duration_seconds, loop }`; beds have `loop: true`, `duration_seconds: BED_SECONDS`, `BED_FORMAT`. Every request carries `xi-api-key` and `signal: AbortSignal.timeout(<its timeout>)`.
- [ ] Plan per site from a `SiteFile` (`parseSiteFile` in `../db/seed.js`) with `PersonaContent` and `MemorialContent` from `../content.js`. A persona site: one greeting per language key in `persona.first_message`, one answer per `tap_to_ask` item and language key in its `a`, all with `persona.voice`. The memorial site (`is_memorial: true`): one narration per `narrations` item and language key in its `text`, with `narrator_voice`, and no greeting or answers. Every site: `BED_TAKES` beds from `sound_bed`. An item whose voice or text is missing or empty is planned as skipped, with the reason `no voice`, `no text` or `no sound_bed`.
- [ ] File names (Patrick's decision, hour 7: named by input hash): `hash` is the first 12 hex characters of SHA-256 over `JSON.stringify([path, query, body, take])` (no key). Names: `<siteId>/bed-<take>-<hash>.wav`, `<siteId>/greeting-<lang>-<hash>.mp3`, `<siteId>/answer-<id>-<lang>-<hash>.mp3`, `<siteId>/narration-<id>-<lang>-<hash>.mp3`, `project/<name>-<take>-<hash>.mp3`.
- [ ] Credits per item: TTS characters × `CREDITS_PER_CHAR`; sound effect seconds × `CREDITS_PER_SFX_SECOND`; music minutes × `CREDITS_PER_MUSIC_MINUTE`, rounded up.
- [ ] Export `type PublishOpts = { fetch: typeof fetch; apiKey: string; exists: (file: string) => boolean; put: (file: string, bytes: Uint8Array) => void; run: boolean; maxCredits: number }`, `type PlanItem = { file: string; credits: number; state: "exists" | "new" | "skipped"; reason?: string }` and `type PublishResult = { items: PlanItem[]; newCredits: number; outcome: "dry" | "done" | "over_cap" | "failed"; failed?: { file: string; status: number | "error" } }`.
- [ ] Export `publishSite(site: SiteFile, opts)` and `publishProject(opts)`, both returning `Promise<PublishResult>`. With `run: false`, no request. With `run: true` and the sum of `new` items over `maxCredits`, no request and `over_cap`. Otherwise new items are made one after another; only a 200 is `put`; the first non-200 or error stops the run with `failed`; items already `put` stay.
- [ ] Export `type SiteClips` with the same shape as in `apps/web/src/audio/clips.ts`, and `toClips(sites: SiteFile[], exists): { sites: Record<string, SiteClips>; project: { glass?: string; crackle?: string; chime?: string; waltz: string[] } }`, listing only files for which `exists` is true. The comment on `SiteClips` says to keep it in step with the web seam.
- [ ] Nothing in this file prints, logs or returns a key, an id beyond voice IDs in requests, or a response body.
- [ ] Tests in `publish.test.ts` with a fake `fetch` that counts calls and records URLs and bodies, and an in-memory `exists`/`put`, named: "a dry run makes no request"; "plans greetings, answers and two bed takes per language"; "plans narrations and no greeting for the memorial"; "skips items without a voice or text and says why"; "a second run makes no request"; "take 1 and take 2 get different names and the same input the same name"; "over the cap makes no request"; "stops at the first failed request and keeps what was made"; "sends the models, loop and duration the plan settles"; "toClips lists only files that exist". Fixtures are made-up test text, never about 1989.
- [ ] Do not run `git add`, `git commit`, `npm install` or a live call. Do not open or print `.env`.
- Verify: `npm test -w @lampa/api && npm run typecheck -w @lampa/api`. Paste the summary lines.
- Done when: all named tests pass and typecheck exits 0.

#### B1-2.c One command shows the plan and its cost, and with `--run` makes only what is missing (1 h)

**B1-2.c.1** CLI and root script. Subagent: `patrick-elevenlabs`. Files: `scripts/publish-site.ts`, root `package.json`.

- [ ] Root `package.json`: add one script and nothing else, `"publish:site": "tsx --env-file-if-exists=.env scripts/publish-site.ts"`.
- [ ] Arguments: `--site <id>` (repeatable) or `--site all`; `--project`; `--run`; `--max-credits <n>` (default `MAX_CREDITS_DEFAULT`). At least one of `--site` or `--project` is required; otherwise print the usage line and exit 1. An unknown site id prints `unknown site <id>` and exits 1.
- [ ] Read `content/sites/*.yaml` in file-name order with `parseSiteFile`. Files go to `apps/web/public/audio/<file>` (folders created as needed). `exists` checks that path.
- [ ] Without `--run` (Patrick's decision, hour 7): no request and no file written. Print one line per item, `<exists|new|skipped:<reason>> <file> <credits>`, then `total new <n> credits`, and exit 0.
- [ ] With `--run`: if `ELEVENLABS_API_KEY` is empty print `missing ELEVENLABS_API_KEY` and exit 1. Print the same lines, then `over cap <n> > <max>` and exit 1, or `made <file>` per new file, or `failed <file> <status>` and exit 1. After every `--run`, rewrite `apps/web/src/audio/clips.json` from `toClips` over all five sites and the project (two-space JSON, newline at the end), so a run for one site keeps the others. Never write `picks.json`.
- [ ] The script never prints the key, a response body or an upstream error message.
- [ ] The key check comes before any planning or request: with `--run` and an empty key, nothing else happens.
- [ ] Do not run `--run` except in the third verify command below, which loads no env file, empties the key and caps credits at 0. Do not run `git add`, `git commit` or `npm install`. Do not open or print `.env`.
- Verify: `npm run publish:site -- --site all; echo "exit $?"` and `npm run publish:site -- --project; echo "exit $?"` and `ELEVENLABS_API_KEY= npx tsx scripts/publish-site.ts --site unirii --run --max-credits 0; echo "exit $?"` in Git Bash. Paste the output.
- Done when: the first two print every planned item with its state and a total and exit 0 with no file written (`git status --short apps/web` unchanged); the third prints `missing ELEVENLABS_API_KEY` and exit 1.

#### B1-2.d Both bed takes exist for the five sites (0.75 h)

This session, with Patrick. It spends credits.

- [ ] After B1-2.a and B1-2.c: `npm run publish:site -- --site unirii`. Show Patrick the lines and the total (expected 1,200 credits: 2 takes × 600). Run `npm run publish:site -- --site unirii --run` only after Patrick says go. This first run proves the key's Sound Effects access and that `wav_24000` is accepted on Starter (the docs say only that 44.1 kHz needs Pro). A refusal is a `failed` line: stop and take it to Patrick.
- [ ] Then `npm run publish:site -- --site all` (expected about 4,800 credits for the other four sites), and `npm run publish:site -- --site all --run` only after Patrick says go for this run.
- [ ] Patrick reads the dashboard usage page and says which meter moved and by how much (Findings 1, hour 6). Record it as a Decisions line.
- [ ] Commit the ten `.wav` files and `clips.json` as `feat(audio) generated the five sound beds, two takes each`, with a Done line giving the credits shown and the meter Patrick saw.
- Verify: `npm run publish:site -- --site all` lists every bed as `exists` and `total new` counts only items that are still skipped or new; `node -e "const c=require('./apps/web/src/audio/clips.json');console.log(Object.values(c.sites).map(s=>s.beds.length).join(' '))"` prints `2 2 2 2 2`.
- Done when: ten bed files are committed and the meter reading is recorded.

### B1-3 Project-wide sounds: glass tone, lamp crackle, arrival chime, waltz (0.5 h)

#### B1-3.a The four project sounds exist (0.5 h)

This session, with Patrick. It spends credits. First to move to Build 2 if the block runs late.

- [ ] `npm run publish:site -- --project`, show Patrick the lines and the total (expected about 4,450 credits). Run `npm run publish:site -- --project --run` only after Patrick says go.
- [ ] Patrick listens to all five files and says keep or retake per file. A retake is Patrick's decision: delete that file and rerun.
- [ ] This session reads `https://elevenlabs.io/music-terms` and gives Patrick what it says about public performance and commercial use (Findings 6). Patrick's answer is a Decisions line.
- [ ] Commit the files and `clips.json` as `feat(audio) generated the glass tone, crackle, chime and waltz`.
- Verify: `node -e "const p=require('./apps/web/src/audio/clips.json').project;console.log(!!p.glass,!!p.crackle,!!p.chime,p.waltz.length)"` prints `true true true 2`.
- Done when: the files are committed, Patrick has listened, and the music terms answer is recorded.

### B1-4 Audio engine v1: unlock on tap, load and loop a bed, gain follows glow (1.5 h)

#### B1-4.a The engine loops a site's bed and follows glow (1 h)

**B1-4.a.1** Engine and `useBed`. Subagent: `patrick-web-audio`. Files: `apps/web/src/audio/engine.ts`, `apps/web/src/audio/engine.test.ts`, `apps/web/src/audio/useBed.ts`.

- [ ] `engine.ts` plays through `getAudioContext()` from `./context` and never creates another AudioContext. It never calls `resume()`: unlocking stays in Ionut's tap.
- [ ] Named constants (Patrick's decisions, hour 7): `ASLEEP_GAIN = 0.3`, `MEMORIAL_GAIN = 0.5`, `FADE_IN_S = 2`, `RAMP_S = 1`, `RETRY_MS = 2000`.
- [ ] `bedGain(glow: number | null, memorial: boolean): number`: `MEMORIAL_GAIN` for a memorial; otherwise `ASLEEP_GAIN + (1 - ASLEEP_GAIN) × g`, with `g` the glow clamped to 0..1 and `null` read as 0.
- [ ] `bedUrl(siteId, c = clips, p = picks): string | null`: `AUDIO_BASE + c.sites[siteId].beds[(p[siteId] ?? 1) - 1]`, or `null` when there is no such file.
- [ ] The engine keeps one current bed: `{ siteId, memorial, glow, promise, source?, gain? }`. `memorial` is looked up inside the engine from `sites` in `@lampa/shared` (`is_memorial`; an id not in `sites` counts as not memorial), so no caller passes it.
- [ ] `playBed(siteId: string, glow: number | null): Promise<"playing" | "failed">`: for the site already current (loading or playing) it returns the same promise and only applies `setBedGlow(glow)`. For another site it stops the current bed and starts a new one: `null` URL resolves `"failed"` at once; otherwise `fetch` then `decodeAudioData` (decoded buffers cached by URL), one retry after `RETRY_MS`, then `"failed"` with one `console.info` line and no notice (Patrick's decision, hour 7). It plays an `AudioBufferSourceNode` with `loop = true` through one `GainNode`, the gain ramping linearly from 0 to `bedGain(glow, memorial)` over `FADE_IN_S` (`DESIGN.md` 7.1). A load that finishes after its bed stopped being current (another `playBed` or a `stopBed`) never starts, and its promise resolves `"failed"`.
- [ ] `setBedGlow(glow: number | null)`: stores the glow and, when the bed is playing, ramps linearly to `bedGain(glow, memorial)` over `RAMP_S`. `stopBed()`: clears the current bed (a pending load then never starts), ramps a playing bed to 0 over `RAMP_S`, then stops and disconnects it.
- [ ] `useBed.ts` exports `useBed(siteId: string, glow: number | null): void`: on mount and on a new `siteId` it calls `playBed(siteId, glow)`, on unmount `stopBed()`, and on a new `glow` `setBedGlow(glow)`.
- [ ] Tests in `engine.test.ts` (Vitest, `node` environment, no DOM), named: "an asleep site plays at 0.3"; "full glow plays at 1"; "half glow plays at 0.65"; "glow outside 0..1 is clamped"; "the memorial plays at 0.5 whatever the glow"; "bedUrl plays take 1 without a pick"; "bedUrl plays take 2 when picked"; "bedUrl is null for a site without beds".
- [ ] Do not run `git add`, `git commit`, `npm install`.
- Verify: `npm test -w @lampa/web && npm run typecheck -w @lampa/web`. Paste the summary lines.
- Done when: all named tests pass and typecheck exits 0.

#### B1-4.b The bed starts on the Site view and the memorial view (0.25 h)

Before this agent task, Patrick asks Ionut for a yes on the three lines below (Patrick's decision, hour 7). Whether Join waits on `playBed` for "Waking {Site}" stays Ionut's change and is listed as a Hand-off.

**B1-4.b.1** Wiring. Subagent: `patrick-web-audio`. Files: `apps/web/src/phone/SiteView.tsx`, `apps/web/src/phone/MemorialStub.tsx`, `apps/web/src/phone/Join.tsx`.

- [ ] `SiteView.tsx`: one line `useBed(site.id, glow);` right after `const { glow, connected } = live;`, plus its import.
- [ ] `MemorialStub.tsx`: a new prop `siteId: string` and one line `useBed(siteId, null);`, plus its import.
- [ ] `Join.tsx`: pass `siteId={site!.id}` to `MemorialStub`. Nothing else.
- [ ] Do not run `git add`, `git commit`, `npm install`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web && npm run build -w @lampa/web`. Paste the summary lines, and `git diff --stat` showing only these three files.
- Done when: the three files differ from `main` by those lines only, and all three commands exit 0.

#### B1-4.c A bed plays on the iPhone after the tap (0.25 h)

Patrick's check. Do not mark it done.

- [ ] After `patrick/b1-engine` is deployed: on Patrick's iPhone, open `https://lampa-timisoara.vercel.app/s/unirii?demo=1`, tap the join button: the bed fades in within 3 s and loops with no audible gap. Then `/s/cathedral?demo=1`: the quiet bed plays, at a lower level.
- [ ] With the iPhone's silent switch on and off. Report what was heard. Web Audio is usually silent with the switch on; if so, that is a question for Patrick (a Blocked line), not an engine bug.
- Done when: Patrick reports both sites heard; any failure goes back as a Blocked line.

### B1-last Integrate and hand over (last, this session)

- [ ] Re-run every agent task's verify command on `patrick/b1-work`. Then `npm run typecheck && npm run build && npm test` green on it.
- [ ] Break one rule and watch it fail, then restore: set `ASLEEP_GAIN` to 0 and see "an asleep site plays at 0.3" fail; drop the `take` from the hash input and see "take 1 and take 2 get different names" fail; remove the `cathedral_line.en` check and see "returns null without a Cathedral line" fail. Paste each failing line.
- [ ] `git log -p origin/main..patrick/b1-work | grep -c -E 'sk_[A-Za-z0-9]{20,}|agent_[A-Za-z0-9]{20,}|signed_url=|conversation_signature='` prints `0`. `git status --short` shows no `.env` and no PDF.
- [ ] Cut each PR branch from `origin/main` and cherry-pick its commits; run `npm run typecheck && npm run build && npm test` on each: `patrick/b1-engine` (clips seam, engine, wiring, bed prompts, beds), then `patrick/b1-persona` (content seam, persona, voice IDs), then `patrick/b1-publish` (publish core, CLI, project sounds), cut from `origin/main` only after the first two are merged.
- [ ] Push each branch and give Patrick the PR link the push prints; Patrick opens the PR and asks Cristea to merge. Each PR lists what was verified and what waits for a phone.
- [ ] After `patrick/b1-engine` is deployed: `curl -sI https://lampa-timisoara.vercel.app/audio/<one bed file> | grep -i content-type` shows `audio/wav`, not `text/html`.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: the content keys (seam `apps/api/src/content.ts`) for whoever writes the site files; `useBed(siteId, glow)`, `playBed(siteId, glow)` (resolves `"playing"` or `"failed"`; a second call for the same site returns the same promise, for Ionut's "Waking {Site}"), `stopBed`, `setBedGlow`, `bedGain`; `clips.json` and `picks.json`; `npm run publish:site` with its flags; `publishSite`, `publishProject`, `toClips` for Cristea's add-a-place; `getPersona` wired in `app.ts` (answers Cristea's B2-1 for Patrick's part).
- [ ] Patrick's checks on real phones, listed and not claimed: B1-4.c on the iPhone; Checkpoint 1 line 1 on the Android with Ionut.
- Done when: every box is ticked or listed as Patrick's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: content for the five sites not landed (persona name, traits, first messages, Cathedral lines, tap-to-ask, facts, narrations; the team); the new `persona` keys reach the `sites` table only through `npm run db:reset`, which wipes all events (Fabi, through Patrick); the music page's `output_format`; `wav_24000` refused on Starter, or the key lacking Sound Effects, TTS or Music access; Ionut's yes on the wiring.
- **Not finished at hour 15.5:** each ID, what is left, and its place in the cut order. Patrick's order for this block: B1-3 moves to Build 2 first.
- **Phone checks for Patrick:** B1-4.c on the iPhone; the Android check of Checkpoint 1 line 1 with Ionut.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 1

- After the join tap on a persona site, its bed fades in over 2 s, loops, and its gain follows glow (0.3 asleep to 1.0); the Cathedral's bed plays at 0.5. Unit tests cover the gain and the pick.
- `GET /agent/session` sends the rendered Appendix A prompt, first message and voice for a site whose content is complete, and no overrides otherwise; the tests cover each null case.
- `npm run publish:site` prints every planned clip with its cost and makes nothing without `--run`; a second `--run` makes no request; the ten beds exist in `apps/web/public/audio` and `clips.json` lists them.
- The four project sounds exist, or B1-3 is listed as moved to Build 2.
- No key, agent id or signed URL is in git, in the glossary or in the chat.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `patrick/GLOSSARY.md` matches the state of the branch.

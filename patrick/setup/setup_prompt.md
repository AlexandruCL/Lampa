# Prompt: Patrick's Setup (Patrick, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 5 (2026-11-13 19:05 +0200). Implementation not started.**

You are implementing Patrick's part of Setup (hours 0 to 2 in the plan, started at hour 5) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Setup no goal line. Its time budget row reads: *repo, deploys, accounts wired, contracts agreed*

Checkpoint this block must pass: *Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database.*

## 0. Ground rules

- **Patrick takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Patrick, with your recommendation. Nothing uses the recommendation until Patrick answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block is 2 hours long and started at hour 5, so it ends at hour 7.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Patrick: carrying on, cutting or moving it is their decision.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Patrick, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Patrick's approval. Approved: none. This block installs nothing: the script uses the global `fetch` and the `tsx` 4.23.15 already in the repo, and no ElevenLabs SDK (Patrick's decision, hour 5).
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. **`ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` never appear in the chat, in a commit, in a glossary line or in command output** (Patrick's decision, hour 5). Do not open, print or `cat` the root `.env`. A command may print a status code and `true` or `false`, nothing more.
- `main` deploys by itself. The `patrick/` docs commit goes straight to `main` (Patrick's decision, hour 5). After it, work on branches: `patrick/setup-agent` holds S-1.b and S-1.c. One small PR per branch. Open it only after the verify commands pass. Cristea merges every team PR. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. This block starts no conversation and generates no audio: its only ElevenLabs calls are `GET /v1/convai/agents/{agent_id}` and `GET /v1/convai/conversation/get-signed-url`.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. Setup builds no screen.
- Write in `patrick/` only. Other members' folders are read-only.
- **Keep `patrick/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Patrick a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 5, 2026-11-13 18:49 to 19:05 +0200)

- Hour 0 is 2026-11-13 13:21 (+0200), read from `cristea/GLOSSARY.md`. There is no previous block for Patrick. `patrick/` did not exist before this prompt.
- `main` is at `f2df14a` (PR #15, `cristea/b2-agent`), clean. Remote branches: `main`, `ionut/b1-checkpoint`, `ionut/b1-iphone`. No `patrick/` branch exists.
- `apps/api/src/agent/session.ts` (Cristea, hour 12 of her glossary) already serves `GET /agent/session`. It calls `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=<id>` with the header `xi-api-key`, reads `signed_url`, and answers 503 `agent_unavailable` while `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` is unset. It exports `Persona = { prompt, firstMessage, voiceId }` and takes `getPersona(siteId, lang)` from Patrick in Build 1. `apps/api/src/app.ts` mounts `createAgentRouter()` with no arguments.
- `packages/shared/src/contract.ts` holds `AgentLang` (`ro`, `en`, `hu`, `de`, `sr`) and `AgentSession` (`signedUrl`, optional `overrides.agent.prompt.prompt`, `overrides.agent.firstMessage`, `overrides.agent.language`, `overrides.tts.voiceId`, and seven `dynamicVariables`: `visitor_name`, `local_time`, `site_glow`, `colours_today`, `lamps_lit_today`, `sites_visited`, `returning_visitor`). Patrick accepts them as they stand (Patrick's decision, hour 5).
- `.env.example` lists `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. No root `.env` exists on this machine. Patrick creates it in S-1.a.
- Open on Cristea's side, from the Blocked table of `cristea/GLOSSARY.md`: "Live Talk (Checkpoint 2 lines 3 and 4): no ElevenLabs agent exists yet", waiting on Patrick.
- Not there yet, added by this block: `scripts/` (S-1.b), the root script `agent:check` (S-1.b), `patrick/setup/elevenlabs_findings.md` (S-1.c).
- Root scripts that exist: `dev`, `build`, `typecheck`, `test`. The last three run the same script in every workspace that has one. `scripts/` belongs to no workspace, so `typecheck` and `test` do not cover it.
- "Needs from others" for Setup: site content YAML at hour 0. Not landed: no `content/` folder, no `packages/shared/sites.json`, and `fabi/GLOSSARY.md` has no Done line. Nothing in this block reads site content.
- ElevenLabs: the paid month is running and no agent exists (Patrick's answer, hour 5).
- ElevenLabs docs read at hour 5:
  - `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url` takes the query `agent_id` and answers 200 `{ "signed_url": string }`. The page names no auth header and says nothing about credits.
  - `GET https://api.elevenlabs.io/v1/convai/agents/{agent_id}` answers the agent's config. The override flags are booleans, `false` until enabled, under `platform_settings.overrides.conversation_config_override`: `agent.prompt.prompt`, `agent.first_message`, `agent.language`, `tts.voice_id`. The page names no auth header.
  - Overrides are turned on in the agent's **Security** tab. An override sent for a field that is not enabled throws for most fields.
  - `https://elevenlabs.io/docs/api-reference/authentication`: every request carries the API key in the `xi-api-key` header.
  - `https://elevenlabs.io/pricing` is readable as text: Starter lists 30,000 credits a month; the page gives TTS at 1 credit per character, sound effects at 200 credits per generation, music at 900 credits per minute, speech to text at 330 credits per minute, and no credit rate for agent conversation. S-1.c re-reads these.
  - `POST https://api.elevenlabs.io/v1/convai/agents/create` exists; this block does not use it (Patrick's decision, hour 5).
- The concept PDF `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` is in the repo root on this machine, gitignored. Section 11.1 is on printed pages 38 to 42, Appendix A on printed page 49. Its sketch 1 uses the env name `MONUMENT_AGENT_ID` and a limit of 6 per hour; `main` uses `ELEVENLABS_AGENT_ID` and 6 per 10 minutes, and `main` wins.
- Deployed at 18:50: web `https://lampa-timisoara.vercel.app/` answered 200; API `https://lampa-api-b45i.onrender.com/health` answered 200 `{"ok":true}`. The API sleeps after about 15 minutes idle, so a first call can take about 50 s.
- This machine: Windows 11, Node v26.13.1, npm 11.20.0, `winget` and `pdftotext` present. Not installed: `gh`. `node_modules` is not installed. `git config user.name` and `git config user.email` are both empty.
- Patrick has an iPhone. Patrick has no Android phone. Setup needs no phone check from Patrick.
- No graph exists in `graphify-out/`. No file existed in `.claude/agents/` before this prompt; `patrick-elevenlabs.md` was written with it.
- `DESIGN.md` section 9 has no Setup item for Patrick; the first is item 5, in Build 2. Plan section 8 has no test for Patrick.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Setup, Patrick's row, the All row and the "Done when" line | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Patrick's table and "Needs from others" | All |
| `IMPLEMENTATION_PLAN.md` | Section 3, the paragraph on the ElevenLabs sketches; section 9, the ElevenLabs and credits rows | S-1.c |
| `patrick/GLOSSARY.md` | Whole file | All |
| `cristea/GLOSSARY.md` | Blocked and Hand-offs | S-0, S-last |
| `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` | Section 11.1 (printed pages 38 to 42) and Appendix A (printed page 49) | S-1.a, S-1.c |
| `apps/api/src/agent/session.ts` | Whole file | S-1.b, S-1.c |
| `packages/shared/src/contract.ts` | `AgentLang`, `AgentSession` | S-1.c |
| Root `package.json`, `.env.example`, `.gitignore` | Whole files | S-1.b |
| `https://elevenlabs.io/docs/api-reference/authentication` | The header name | S-1.b, S-1.c |
| `https://elevenlabs.io/docs/api-reference/conversations/get-signed-url` | Whole page | S-1.b, S-1.c |
| `https://elevenlabs.io/docs/api-reference/agents/get` | The override flags under `platform_settings` | S-1.b |
| `https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides` and the dynamic variables page next to it | Whole pages | S-1.c |
| Other pages under `https://elevenlabs.io/docs/` | The React SDK (`useConversation`, `startSession`, client tools), text to speech, sound effects, music, speech to text | S-1.c |
| `https://elevenlabs.io/pricing` and the pricing pages it links for the API and for agents | Prices and what the paid tiers include | S-1.c |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: Verify ElevenLabs docs and prices. Create the one agent template with overrides enabled. Fetch a signed URL from a script | 2 | S-1.a, S-1.b, S-1.c |
| Section 11: ElevenLabs docs and price check, agent template, signed URL from a script | same 2 | S-1.a, S-1.b, S-1.c |
| Section 3: The ElevenLabs sketches in section 11.1 come from research. Patrick checks method names, signed-URL flow and credit prices against the current docs in the first two hours, before anyone builds on them. | same 2 | S-1.c |
| Section 6, All: 30 minutes on the contract, written into `packages/shared`: event kinds (`wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`) and socket messages (`glow`, `pane`, `window_complete`, `echo_approved`, `lamps` with a per-site count of people lighting now, `candle`, `finale`). Remote mode is `/?mode=remote` | none given | already held: the team agreed the contract at hour 0 (`cristea/GLOSSARY.md`, Decisions). Patrick's part, the agent schemas, is accepted at hour 5 and re-checked in S-1.c |
| Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database. | none given | not this lane: the phone checks are reported in `cristea/GLOSSARY.md` and `ionut/GLOSSARY.md`; `db:reset` is Fabi's row. Listed in S-last |

Total: 2 h of tasks in a 2 h block: S-1.a 0.5 h, S-1.b 0.5 h, S-1.c 1 h.

Order (Patrick's decision, hour 5: the agent first, because Cristea's Build 2 is Blocked on it): S-0. Then Patrick starts S-1.a by hand while this session starts S-1.b.1 and S-1.c.1 in parallel. The live run of `npm run agent:check` waits for S-1.a. Then S-last. If the block runs late: first the price check of S-1.c.1 shrinks to the numbers on the official pricing page with no budget table; then sketch 3 moves to the start of Build 1. Never cut: the agent with its overrides, and `agent:check` passing.

The two agent tasks share no code and no file.

### 3.1 Subagents

Patrick asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Patrick, re-runs the checks, writes the glossary and does S-0 and S-last. It does not implement the agent tasks itself. S-1.a is Patrick's own work in the ElevenLabs dashboard and has no agent task (Patrick's decision, hour 5); S-1.b's script is its verify command.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `patrick-elevenlabs` | ElevenLabs API scripts and docs checks | `opus` | new |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| S-1.b.1 | `patrick-elevenlabs` | `scripts/agent-check.ts` and the root script `agent:check` | `scripts/agent-check.ts`, root `package.json` | after S-0, parallel with S-1.c.1 |
| S-1.c.1 | `patrick-elevenlabs` | Sketches and prices against the current docs | `patrick/setup/elevenlabs_findings.md` | after S-0, parallel with S-1.b.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list `patrick-elevenlabs`, stop and ask Patrick to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Patrick. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- The two agents share one working tree. They do not run `git add`, `git commit` or `npm install`. This session commits each agent's files after re-running its verify command.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the check fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Patrick, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### S-0 Preflight (first, this session)

- [ ] `node -v` prints `v26.` followed by the minor and patch. If it does not, stop and tell Patrick.
- [ ] `git config user.name` and `git config user.email` each print a value. Both were empty at hour 5. If either is empty, stop and ask Patrick to set them; do not invent a name or an address.
- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] `git check-ignore -q .env && git check-ignore -q LAMPA_Hackathon_Concept_Timisoara_v6.pdf` exits 0.
- [ ] Commit `patrick/` to `main` as `docs(patrick) added Patrick's glossary and setup prompt` and push. The commit holds `patrick/GLOSSARY.md` and `patrick/setup/setup_prompt.md` only.
- [ ] `git switch -c patrick/setup-agent`.
- [ ] `npm ci`, then `ls node_modules/.bin/tsx` from the repo root lists the file. If it does not, stop and tell Patrick: the root script of S-1.b depends on it.
- [ ] Baseline before any change, summary lines recorded: `npm run typecheck`, `npm run build`, `npm test`.
- [ ] Re-read the Blocked and Hand-offs tables of `cristea/GLOSSARY.md` on `origin/main`. List what moved since section 1.
- [ ] `patrick/GLOSSARY.md` exists. Do not recreate it.
- Done when: `node -v` shows major 26, the git identity is set, the docs commit is on `origin/main`, the baseline is recorded and failures that were already there are listed, not fixed silently.

### S-1 ElevenLabs docs and price check, agent template, signed URL from a script (2 h)

#### S-1.a The one agent template exists with its four overrides on (0.5 h)

Patrick's task, by hand in the ElevenLabs dashboard. Do not mark it done. This session shows Patrick this list and waits; it does not open the dashboard and does not ask for the key or the id.

- [ ] In the workspace of the paid account, create one blank agent named `LAMPA monument` (Patrick's decision, hour 5).
- [ ] System prompt, pasted as it is (Appendix A, with the name, site, language and traits filled; Patrick's decision, hour 5). The double braces are ElevenLabs dynamic variables and stay as written:

```
You are the Lamp, the voice of the city in Timișoara.
You are part of LAMPA, a public art installation. You are an AI voice; say so if asked.
Speak English. Keep every answer under three sentences: the visitor is standing in the street.
Personality: warm, curious, brief.
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

- [ ] First message: `Good evening. I am a voice of Timișoara. Ask me about this place.`
- [ ] If the dashboard asks for a placeholder value per dynamic variable, enter the values Cristea's route sends before Fabi's stats land: `visitor_name` = `traveller`, `local_time` = `12:00`, `site_glow` = `0`, `colours_today` = `0`, `lamps_lit_today` = `0`, `sites_visited` = `none yet`, `returning_visitor` = `no`.
- [ ] Default language English. Additional languages: Romanian, Hungarian, German, Serbian.
- [ ] Maximum conversation duration: 120 seconds.
- [ ] LLM and voice: leave the dashboard's defaults. Tell this session their two names, which go into the glossary's Done line.
- [ ] Add no tool, no knowledge base and no webhook. They come in Build 2.
- [ ] **Security** tab: turn on the overrides for system prompt, first message, language and voice ID. Leave every other override off.
- [ ] Start no test conversation in the dashboard.
- [ ] Create an API key in the same workspace. Create the file `.env` in the repo root yourself, with the two lines `ELEVENLABS_API_KEY=<the key>` and `ELEVENLABS_AGENT_ID=<the agent id>`. Paste neither value into the chat.
- Verify: `npm run agent:check` (from S-1.b). Paste the six lines.
- Done when: the six lines read `agent 200`, four `override ... true` lines and `signed_url 200 true`, and the command exits 0.

#### S-1.b One command proves the agent's overrides and fetches a signed URL (0.5 h)

**S-1.b.1** `scripts/agent-check.ts` and the root script `agent:check`. Subagent: `patrick-elevenlabs`. Files: `scripts/agent-check.ts`, root `package.json`.

- [ ] Root `package.json`: add one script and nothing else, `"agent:check": "tsx --env-file-if-exists=.env scripts/agent-check.ts"`. Add no dependency.
- [ ] `scripts/agent-check.ts`: TypeScript, ES module, no import beyond Node built-ins, the global `fetch`. No ElevenLabs SDK (Patrick's decision, hour 5).
- [ ] Named constants in the file: `API = "https://api.elevenlabs.io/v1/convai"`, `TIMEOUT_MS = 10000`. Every request carries the header `xi-api-key` with `ELEVENLABS_API_KEY` and `signal: AbortSignal.timeout(TIMEOUT_MS)`. The header name is the one `https://elevenlabs.io/docs/api-reference/authentication` gives (read at hour 5). The two calls are documented at `https://elevenlabs.io/docs/api-reference/agents/get` and `https://elevenlabs.io/docs/api-reference/conversations/get-signed-url`.
- [ ] Env: read `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` from `process.env`. For each one that is empty or unset, print `missing <NAME>` and, after both are looked at, exit 1 without any request.
- [ ] Call 1: `GET ${API}/agents/${ELEVENLABS_AGENT_ID}`. Print `agent <status>`. On a 200, read the four flags under `platform_settings.overrides.conversation_config_override` and print, in this order, `override prompt <v>` from `agent.prompt.prompt`, `override first_message <v>` from `agent.first_message`, `override language <v>` from `agent.language`, `override voice_id <v>` from `tts.voice_id`, where `<v>` is `true` only when the value is the boolean `true` and `false` in every other case, a missing path included.
- [ ] Call 2, made whatever call 1 answered: `GET ${API}/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`. Print `signed_url <status> <v>`, where `<v>` is `true` only when the status is 200 and the body's `signed_url` is a non-empty string.
- [ ] A timeout or a network error on a call prints that call's line with `error` in place of the status and counts as a failure.
- [ ] Exit code 0 only when both statuses are 200, all four flags are `true` and the signed URL is present. Exit 1 in every other case.
- [ ] The script never prints the key, the agent id, the signed URL, a response body or an error message from upstream. (Patrick's decision, hour 5.)
- [ ] No unit test (Patrick's decision, hour 5): the script is the check.
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not open or print `.env`.
- Verify: `ELEVENLABS_API_KEY= ELEVENLABS_AGENT_ID= npm run agent:check; echo "exit $?"` in Git Bash. Paste the output. If a root `.env` exists by then and the output is not the two `missing` lines, paste the output as it is and say so in your report.
- Done when: with both values empty the output is `missing ELEVENLABS_API_KEY`, `missing ELEVENLABS_AGENT_ID` and `exit 1`, and no request left the machine. The live run with Patrick's `.env` is this session's check in S-last, not yours.

#### S-1.c The concept's sketches and prices are checked against the current docs (1 h)

**S-1.c.1** Sketches and prices against the current docs. Subagent: `patrick-elevenlabs`. Files: `patrick/setup/elevenlabs_findings.md`.

- [ ] Read concept section 11.1 and Appendix A: `pdftotext -layout LAMPA_Hackathon_Concept_Timisoara_v6.pdf -` prints the text, where section 11.1 starts at the line `11.1 ElevenLabs: Best Use of ElevenLabs` and ends at `11.2 Tiger Data`, and Appendix A starts at `Appendix A -- Persona system prompt template`. Read `apps/api/src/agent/session.ts` and `AgentLang` and `AgentSession` in `packages/shared/src/contract.ts`. Call no ElevenLabs API and generate nothing.
- [ ] Docs to read: `https://elevenlabs.io/docs/api-reference/authentication`, `https://elevenlabs.io/docs/api-reference/conversations/get-signed-url`, `https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides` and the dynamic variables page next to it, and the pages under `https://elevenlabs.io/docs/` for the React SDK, text to speech, sound effects, music and speech to text. Prices: `https://elevenlabs.io/pricing` and the pricing pages it links for the API and for agents.
- [ ] Write `patrick/setup/elevenlabs_findings.md` with these five headings, in this order. Every statement carries the URL of the page it comes from and the time it was read. A point the docs do not settle is written as "not stated", never filled in.
- [ ] `## Sketch 1: signed URL and session data`. One table row per item, with the columns "Sketch or code on main", "Current docs", "Same or different": the endpoint and its query; the auth header name; the response field; whether the call uses credits; the override object the browser passes (`agent.prompt.prompt`, `agent.firstMessage`, `agent.language`, `tts.voiceId`) against what `startSession` takes; the `dynamicVariables` object and what a variable used in the prompt but missing at start does; how long a signed URL stays valid.
- [ ] `## Sketch 2: the browser conversation`. Same columns: the package name `@elevenlabs/react` and the hook `useConversation`; `startSession({ signedUrl, overrides, dynamicVariables })`; `endSession`; the `clientTools` shape and what a tool returns; how a blocking tool with a long timeout is declared; `onMessage` and `onError`; whether the connection is WebSocket or WebRTC when a signed URL is used. For the package: the output of `npm view @elevenlabs/react version license time.modified`.
- [ ] `## Sketch 3: generation`. Same columns: the package name `@elevenlabs/elevenlabs-js` with its `npm view` line; `textToSpeech.convert` and the model id `eleven_v3`, with whether audio tags need it; `textToSoundEffects.convert` with `durationSeconds`, `loop` and the allowed length range; `music.compose` with `prompt` and `musicLengthMs`; the Scribe speech-to-text call and its model id.
- [ ] `## Prices`. From the official pricing pages only: the name and monthly credits of the plan with about 30,000 credits; credits per character for TTS on `eleven_v3`; credits per second for sound effects; the price of music per minute; the price of Scribe per hour; how live agent conversation is billed (credits or minutes, and the rate); what the plan's licence says about commercial use and music. Then the concept's budget table, row by row, with a column "Recomputed at the official rate" and the new total next to 18,600.
- [ ] `## For Patrick`. A list of every row marked "different" or "not stated", each with what it changes in Build 1 or Build 2 and your recommendation. If the recomputed total is over 30,000 credits, say so on the first line. Decide nothing: this list goes to Patrick.
- [ ] Change no code and no schema. A field that `main` names differently from the docs is a line under "For Patrick".
- [ ] Do not run `git add`, `git commit` or `npm install`. Do not open or print `.env`.
- Verify: `grep -c '^## ' patrick/setup/elevenlabs_findings.md && grep -c 'https://elevenlabs.io' patrick/setup/elevenlabs_findings.md`. Paste both numbers.
- Done when: the first number is 5, the second is 10 or more, and no table cell is empty.

### S-last Integrate and hand over (last, this session)

- [ ] Re-run S-1.b.1's verify command. Then commit as `feat(scripts) added agent:check for the ElevenLabs agent and its signed URL`, with the glossary's Done line for S-1.b.1 and a Changes line for the root `package.json`.
- [ ] Re-run S-1.c.1's verify command and read the file once against its five headings. Commit as `docs(patrick) recorded the ElevenLabs docs and price check`, with the Done line for S-1.c.1.
- [ ] Put the "For Patrick" list of the findings to Patrick, one question at a time with the recommendation. Each answer becomes a Decisions line; each item without an answer a Blocked line.
- [ ] Once Patrick reports S-1.a finished: `npm run agent:check; echo "exit $?"`. Paste the output. All six lines good and `exit 0` tick S-1.a's verify; record its Done line with the LLM and voice names Patrick gave. A `false` or a status that is not 200 goes back to Patrick with the line that failed.
- [ ] Break one rule and watch the check fail, then ask Patrick to restore it: Patrick turns the language override off in the Security tab, and `npm run agent:check` prints `override language false` and exits 1. Patrick turns it back on, and the command prints four `true` lines and exits 0 again. Paste both outputs.
- [ ] `git status --short` shows no `.env` and no PDF. `git log -p origin/main..HEAD | grep -c -E 'sk_[A-Za-z0-9]{20,}|agent_[A-Za-z0-9]{20,}|signed_url=|conversation_signature='` prints `0`.
- [ ] `git fetch`, rebase `patrick/setup-agent` on `origin/main`, then `npm run typecheck && npm run build && npm test` green on it.
- [ ] Push the branch. Give Patrick the pull-request link that the push prints; Patrick opens the PR in the browser and asks Cristea to merge it. The PR text lists what was verified and that nothing waits for a phone.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists: `npm run agent:check` (needs the two env values in the root `.env`; prints statuses and booleans only); the agent `LAMPA monument` with its four overrides on, five languages and the 120 s cap; `patrick/setup/elevenlabs_findings.md` for Cristea (signed URL, Scribe) and Ionut (nothing yet); Patrick's acceptance of `AgentSession`, `AgentLang`, `getPersona` and `ELEVENLABS_AGENT_ID`.
- [ ] Patrick's task with Cristea. Do not mark it done: give Cristea `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` directly, not through git or a chat an agent reads, for the Render dashboard of `lampa-api`; tell her the four overrides are on and that her Blocked row B2-last can be answered; point her to the Scribe row of the findings.
- [ ] Not this lane, listed so the "Done when" line is whole: the deployed URL opens over HTTPS on both phones (reported in `cristea/GLOSSARY.md` and `ionut/GLOSSARY.md`); `npm run db:reset` works from a clean database (Fabi's Setup row, not landed at hour 5).
- Done when: every box is ticked or listed as Patrick's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: a docs field that differs from `AgentSession`; a recomputed credit total over 30,000; whether the signed-URL call uses credits, if the docs do not state it.
- **Not finished at hour 7:** each ID, what is left, and its place in the cut order. Setup rows are not in the plan's cut order. Patrick's order for this block is: the budget table of the price check first, then sketch 3, which moves to the start of Build 1.
- **Phone checks for Patrick:** none in Setup.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Setup

- The agent `LAMPA monument` exists, and `npm run agent:check` prints `agent 200`, four `override ... true` lines and `signed_url 200 true`, and exits 0.
- With the language override turned off, the same command exits 1.
- `patrick/setup/elevenlabs_findings.md` has its five headings, and every "different" or "not stated" row has an answer from Patrick or a Blocked line.
- No key, agent id or signed URL is in git, in the glossary or in the chat.
- The PR for `patrick/setup-agent` is open with its verify output, and Cristea has the two values for Render.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `patrick/GLOSSARY.md` matches the state of the branch.

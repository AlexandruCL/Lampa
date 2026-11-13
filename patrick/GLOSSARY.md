# Glossary: Patrick (Patrick, Sound and voice)

Hour 0: 2026-11-13 13:21 (+0200).

## Done
| ID | What | Verify summary | Commit | Hour |
|---|---|---|---|---|
| S-0 | Preflight: Node v26.13.1, git identity set, `.env` and PDF ignored, `npm ci` with `tsx` present, baseline recorded. `main` moved `f2df14a` → `f9d271c` since the prompt (Fabi's `db:reset` and `sites.json` in PR #16, Ionut's colour work in PR #17); Cristea's Blocked and Hand-offs unchanged | `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` 37 passed (37), 119 passed (119). No failures already there | 387c717 | 6 |
| S-1.b.1 | `scripts/agent-check.ts` and root script `agent:check`: env check, `GET /agents/{id}` with the four override flags, `GET /conversation/get-signed-url`, 10 s timeout, statuses and booleans only. No top-level await (root is CJS under tsx); agent id URL-encoded; a 200 with a non-JSON body prints `error` | `ELEVENLABS_API_KEY= ELEVENLABS_AGENT_ID= npm run agent:check` → `missing ELEVENLABS_API_KEY`, `missing ELEVENLABS_AGENT_ID`, exit 1. Broken on purpose: fake key and id → `agent 401`, `signed_url 401 false`, exit 1 | 1137ed3 | 6 |
| S-1.c.1 | `patrick/setup/elevenlabs_findings.md`: the three sketches of concept 11.1 and the official prices against the current docs, 20 items under "For Patrick". Recomputed budget 14,590 credits plus LLM fees (17,331 at the cautious music rate) against 18,600, under 30,000 | `grep -c '^## '` → 5; `grep -c 'https://elevenlabs.io'` → 30; no empty table cell | 8ee438f | 6 |
| S-1.a | Agent `LAMPA monument` (blank template) with the Appendix A prompt and first message, English plus Romanian, Hungarian, German, Serbian, 120 s cap, no tools; Security overrides on for system prompt, first message, language, voice ID. LLM: DeepSeek Flash 4.1 (dashboard default). Voice: Eric - Smooth, Trustworthy (dashboard default). Root `.env` written by Patrick | `npm run agent:check` → `agent 200`, four `override … true`, `signed_url 200 true`, exit 0 | none (dashboard) | 7 |
| S-last | Integrated on `patrick/setup-agent`, rebased on `origin/main`; findings answered (Decisions, hour 6 and 7); language-override failure test skipped (Patrick's decision) | `git log -p origin/main..HEAD \| grep -c` secret patterns → 0; `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` 37 passed (37), 131 passed (131); no `.env` or PDF in `git status` | this commit | 7 |

## Changes
Anything that differs from the plan, `DESIGN.md` or the contract, and any file outside this lane that was touched.
| Hour | ID | What changed | Files | Why |
|---|---|---|---|---|
| 5 | Setup prompt | Patrick's Setup starts at hour 5, three hours after the block's end in plan section 5 | none | Nothing of the Setup row had landed at hour 5; Patrick keeps the full row |
| 5 | Setup prompt | The agent template is verified by a zero-conversation script (`npm run agent:check`) that also fetches the signed URL; the plan row names only "a signed URL from a script" | `patrick/setup/setup_prompt.md` | One script covers the row's last two parts and gives "overrides enabled" a command to check |
| 6 | S-1.b.1 | Added one root script, `agent:check`, next to Fabi's `db:reset` | root `package.json` | Outside `patrick/`; the prompt allows this one line |
| 7 | S-1.a | The API key needs ElevenLabs Agents **Write**, not Read: `get-signed-url` answered 401 `missing_permissions` (`convai_write`) with a read-only key | ElevenLabs dashboard | Found by the live `agent:check`; reading the agent works with Read |
| 7 | S-last | The language-override failure test was not run | none | Patrick's decision |

## Decisions
The owner's answers only.
| Hour | Decision | Reason |
|---|---|---|
| 5 | Setup: the prompt and the glossary carry the real hour (5), not the plan's hour for the block | Patrick's answer; same as Fabi |
| 5 | Setup: the full row is built, in this order: the agent template with its overrides, then the signed-URL script, then the docs and price check | Cristea's B2-last is Blocked on the agent |
| 5 | Setup: the concept PDF `LAMPA_Hackathon_Concept_Timisoara_v6.pdf` is in the repo root on this machine (gitignored) and is the source for section 11.1 and Appendix A | Patrick added it at hour 5 |
| 5 | Setup: the ElevenLabs paid month is running and no agent exists. Patrick creates the one agent by hand in the dashboard from the checklist in the prompt; a script verifies it through `GET /v1/convai/agents/{agent_id}` | Same way Cristea did Auth0; no credits used |
| 5 | Setup: the agent's own system prompt is Appendix A with its seven dynamic variables kept and the four per-site slots filled as: name "the Lamp", site "the city", language English, traits "warm, curious, brief". Its own first message is "Good evening. I am a voice of Timișoara. Ask me about this place." | Used only when no per-site override is sent |
| 5 | Setup: agent settings are the four overrides (system prompt, first message, language, voice), default language English plus `ro`, `hu`, `de`, `sr`, and a maximum conversation length of 120 s. The LLM and the default voice stay at the dashboard defaults and are written down. Client and server tools wait for Build 2. No live test conversation in Setup | The concept's guardrail; live calls cost credits |
| 5 | Setup: Patrick creates the root `.env` himself with `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. Neither value goes through the chat or into git. Scripts print only status codes and `true` or `false`. Patrick gives both values to Cristea directly for the Render dashboard | Cristea's prompt keeps both out of git |
| 5 | Setup: the script is `scripts/agent-check.ts` at the repo root, plain `fetch`, no ElevenLabs SDK, run as `npm run agent:check` = `tsx --env-file-if-exists=.env scripts/agent-check.ts` in the root `package.json` | The plan puts scripts in `scripts/`; `tsx` 4.23.15 is already in the repo |
| 5 | Setup: `agent:check` prints `agent <status>`, then `override prompt`, `override first_message`, `override language`, `override voice_id` each with `true` or `false`, then `signed_url <status> <true or false>`. It never prints the key, the id or the URL. It exits 1 when an env value is missing, a status is not 200, a flag is false or no `signed_url` string comes back. 10 s timeout per call. No unit test: the script is the check | Patrick accepted the recommended behaviour |
| 5 | Setup: Patrick accepts `AgentSession`, `AgentLang` (`ro`, `en`, `hu`, `de`, `sr`), the `Persona` / `getPersona(siteId, lang)` seam and the env name `ELEVENLABS_AGENT_ID` as they stand on `main`. A field the live docs name differently is reported to Patrick as Blocked, and Patrick takes it to Cristea | Answers Cristea's hour-12 Hand-off "not yet agreed" for Patrick's part |
| 5 | Setup: docs and price findings go to `patrick/setup/elevenlabs_findings.md`: the three sketches of concept section 11.1 against the current docs, and the official prices for TTS, sound effects, music, Scribe and live conversation against the concept's 18,600-credit budget. A total over 30,000 credits is reported to Patrick as a decision | Build 1 and Build 2 are written from this file |
| 5 | Setup: `patrick/` goes to `main` as one docs commit. Then one branch `patrick/setup-agent`, one PR opened from GitHub's push link in the browser (`gh` is not installed), merged by Cristea | Same as the other three lanes |
| 5 | Setup: one subagent, `patrick-elevenlabs` on `opus`, started twice in parallel for the script and for the findings | A misread doc costs Build 1 and Build 2 |
| 5 | Setup: if late, the price check shrinks first to the numbers on the official pricing page with no budget table; then sketch 3 moves to the start of Build 1. Never cut: the agent with its overrides, and `agent:check` passing | Cristea's Talk route waits on them |
| 5 | Setup: the agent is named `LAMPA monument`; the block ends at hour 7; Appendix A goes into the dashboard as written, tool names included, though the tools arrive in Build 2; dashboard test values for the dynamic variables are `traveller`, `12:00`, `0`, `0`, `0`, `none yet`, `no`; `agent:check` prints `missing <NAME>` for an unset value and `error` in place of a status on a timeout or network failure, and always makes both calls | Patrick confirmed each value the prompt had filled in |
| 5 | Devices for Patrick's checks: an iPhone. No Android phone | Patrick's answer |
| 6 | Git identity for this repo (local config): name `petrix0` with Patrick's own address | S-0 found both empty; Patrick gave the values |
| 6 | Findings 1: stay on Starter; after the first real Build 1 generation run, read the dashboard usage page to see which meter moved (credits, dollars or call minutes) and write the budget guard against that | The pricing pages disagree; the budget fits under every reading |
| 6 | Findings 2: keep the 4,000-credit Talk reserve as LLM-fee cover until the dashboard shows the LLM rate; keep the 120 s cap | Live Talk is billed in minutes; the LLM rate is not stated |
| 6 | Findings 3: budget the waltz at 4,091 credits (about 2,727 per minute) until the first take shows the real charge; working total 17,331 | 900 per minute and "11 minutes on Starter" disagree |
| 6 | Findings 4: TTS stays on `eleven_v3`, as in the concept; no v3/v4 listening test | Avoids spending credits on a comparison |
| 6 | Findings 5: sound effects use `eleven_text_to_sound_v2`, with `model_id` set explicitly; every sound is 22 s or less | Supported until 1 March 2027, after the event; 22 s fits every page's limit |
| 6 | Findings 6: music uses `music_v2_5`, with `model_id` set explicitly; `/music-terms` is read in Build 1 before the waltz is used outside the demo | `music_v1` is removed on 31 January 2027; the terms are unread |
| 6 | Findings 7 and 8: Build 2 wraps the Talk screen in `ConversationProvider` and passes `signedUrl`, `overrides` and `dynamicVariables` to `startSession`; if the installed types reject that, `overrides` go on the provider. No contract change | `@elevenlabs/react` 1.22.0 requires the provider |
| 6 | Findings 11: Build 1's `getPersona` renderer fills `persona_name`, `site_name`, `visitor_language` and `persona_traits` into the prompt text; `AgentSession` stays unchanged | Missing-variable behaviour in a live session is not stated |
| 6 | Findings 13 and 15: `start_colour_catch` gets `expects_response: true` and `response_timeout_secs: 120`; `startSession` passes `connectionType: "websocket"` with `signedUrl` | A visitor who walks away must not hold the session; a signed URL is a WebSocket URL |
| 7 | Findings 9 and 10: done in S-1.a: the four overrides are on, and Serbian is available as an agent language, so `sr` keeps live Talk | Patrick checked the dashboard |
| 7 | Findings 12, 14, 16, 17: dynamic variables stay strings and numbers; Build 2 captions show final messages only, told apart by the package's types; the signed-URL call is treated as free and stays rate-limited at 6 per 10 min; the session response is never cached (15 min expiry) | No change needed on `main` |
| 7 | Findings 18, 19, 20: Scribe uses `scribe_v3` in Build 3 and stays out of the 30,000 budget until the meter is known; the ElevenLabs credit stays on the About page; the memorial narrator is priced when its text is written (about 1,200 credits, still under 30,000) | Patrick accepted the recommendations |
| 7 | Setup: the language-override failure test (S-last) is skipped | Patrick: "it works" |

## Blocked
| Since hour | ID | Question | Recommendation | Waiting on |
|---|---|---|---|---|

## Hand-offs
What other lanes can use now: endpoints, hooks, socket messages, scripts, env vars.
| Hour | Name | Where | Used by |
|---|---|---|---|
| 7 | `npm run agent:check`: needs `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` in the root `.env`; prints statuses and booleans only; exit 0 when the agent answers 200 with the four overrides on and a signed URL comes back | root `package.json`, `scripts/agent-check.ts` | all |
| 7 | Agent `LAMPA monument`: overrides on for system prompt, first message, language, voice ID; languages en (default), ro, hu, de, sr; 120 s cap. The API key needs ElevenLabs Agents **Write** (`get-signed-url` requires `convai_write`). Patrick gives both values to Cristea directly for Render; this answers her Blocked row B2-last | ElevenLabs dashboard | Cristea |
| 7 | `patrick/setup/elevenlabs_findings.md`: for Cristea, the signed-URL rows (Sketch 1), the React SDK rows (Sketch 2: `ConversationProvider`, `connectionType: "websocket"`) and the Scribe row (`scribe_v3`); for Ionut, nothing yet | `patrick/setup/elevenlabs_findings.md` | Cristea, Ionut |
| 7 | Patrick accepts `AgentSession`, `AgentLang`, `getPersona(siteId, lang)` and `ELEVENLABS_AGENT_ID` as they stand on `main`; the four Appendix A slots are filled by `getPersona`, so the contract does not change | `packages/shared/src/contract.ts`, `apps/api/src/agent/session.ts` | Cristea |

# Prompt: Ionut's Build 4, memorial view and ro/en dictionary (Ionut, Phone experience, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` and `DESIGN.md` at hour 23 (2026-11-14 12:20 +0200), with Ionut's answers of hour 23; B4-3 (Cristea's new-place request) added at the team's hour 37 (clock 2026-11-14 15:12 +0200) with Ionut's answers. Written before the block starts: B4-0 re-checks every fact of section 1. Implementation not started.**

You are implementing Ionut's part of Build 4 (hours 37 to 40) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: *Three hours, so each person gets one main item. Anything not working at hour 40 is cut and the demo uses the fallback in the last column.*

Checkpoint this block must pass (Freeze, hours 40 to 44; Build 4 has no checkpoint of its own):

*Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived.*

## 0. Ground rules

- **Ionut takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Ionut, with your recommendation. Nothing uses the recommendation until Ionut answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 40.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Ionut: carrying on, cutting (plan section 7) or moving it is their decision. Ionut's order for this block (hour 23, hour 37): the memorial view (B4-2) first, because it is never cut; the dictionary (B4-1) second; the new-place fallback (B4-3) last. Ionut's cut order if the block runs late: first the new-place fallback (the QR of a place published from `/curate` shows "We could not find this place." on a phone; its window still appears on `/screen`; Ionut's decision, hour 37); then the dictionary (English only, plan cut order item 4: `pickLang` then returns `"en"` for every phone, one line, so the memorial is English too; Ionut's decision, hour 23); then testimony audio (testimonies as text with their sources); then the stillness check (a tap lights the candle). The memorial view itself is never cut.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. This block changes none of them: `candle` is already a client event kind. Do not change them without Ionut, who takes it to the team.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Ionut's approval. Approved: none. The dictionary is the plan's "JSON dictionary and one `t()` function".
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- No storage: nothing in this block writes `localStorage`, `sessionStorage` or IndexedDB. The lit candle lives in memory for the page load (Ionut's decision, hour 23).
- Render deploys the API from `main` by itself. **The web app no longer does:** Vercel git deploys are off (`apps/web/vercel.json`, Cristea, hour 30), so Cristea redeploys the web app by hand after a merge, before any phone check. Cristea merges every PR, with a merge commit (Ionut has no Vercel access, so Ionut's PRs show a failing Vercel check that is expected). Branches: `ionut/b4-memorial` (this prompt, the glossary, the plan and `DESIGN.md` updates as a docs commit, the seam, B4-2) `ionut/b4-lang`, made from `ionut/b4-memorial` after B4-2 (B4-1), and `ionut/b4-new-place`, made from `ionut/b4-lang` after B4-1 (B4-3; both change `Join.tsx` and `SiteView.tsx`). One PR per branch. Open it only after the verify commands pass. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`, with `(ionut)` for docs commits.
- Live ElevenLabs calls cost credits. This block makes none.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. **Nobody in this block writes text about 1989, test fixtures included:** fixtures use neutral words ("Fixture title", "Fixture text", "Fixture source").
- At the memorial: no Talk, lens, lamp, echo, glow word, percentage, number, RoseWindow, finale, "Keep my colours", vibration or sound effect. No game verbs (wake, catch, raise, glow, light up the city). No primary amber button.
- Screens follow `DESIGN.md` and the tokens and base components in `apps/web/src/components` and `apps/web/src/styles/tokens.css`. Do not add a colour, font or spacing value that is not a token.
- iOS sensor and audio calls start inside the user's tap, before the first `await`. A testimony's `audio.play()` runs inside its play tap.
- Write in `ionut/` only. Other members' folders are read-only. Files of other lanes touched by this block, each with the owner's agreement: `apps/web/src/audio/engine.ts` and `engine.test.ts` (Patrick agreed, hour 23: `setBedMuted`), `apps/web/src/audio/clips.ts` (one optional field, Patrick agreed, hour 23). Each gets a Changes line.
- **Keep `ionut/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Ionut a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work. Rows for work done in this block use hour 37 or later (Ionut's decision, hour 23).
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.

## 1. Current state (checked at hour 23, 2026-11-14 12:20 +0200)

- Previous block: every ID of Ionut's Build 3 prompt is done and merged (PRs #31 to #38; `ionut/build_3/build_3_report.md`). Phone results of 2026-11-14 in the glossary (`B3-last.phone`): echo on iPhone and Android, curator queue and the outdoors walk passed. Carried over, not in this block: "Tap to listen again" is silent until Patrick wires the beacon (Blocked B3-2.b); the `?demo=1` step 1:40 check with Patrick.
- `main` is `23dcf0f` (B4-0, hour 37: moved from `b579612` by four docs commits of Patrick and Cristea; `ionut/b4-memorial` fast-forwarded to it). No open PRs of Ionut's. B4-0 baseline: the local `node_modules` lacked `@auth0/auth0-react`, `recharts` and `@elevenlabs/react` (already in the lockfile); after `npm install` (Ionut's approval, hour 37; npm rewrote `package-lock.json` with `"peer": true` flags only, reverted, not committed) `npm run typecheck` exit 0, `npm run build` exit 0, `npm test` 310 + 363 passed.
- The plan row was widened by Cristea at hour 30 (`IMPLEMENTATION_PLAN.md` Build 4 table and section 11): "Memorial view" is now 1.5 h, the candle hold is 10 s (5 s with `?demo=1`), not 60 s. `DESIGN.md` 5.2, 6.22, 7.11, 7.16 and 7.17 say 10 s.
- `apps/web/src/phone/MemorialStub.tsx`: name, "Memorial", "Listen" and "Light a candle" buttons with no action, `useBed(siteId, null)`, no way out. `Join.tsx` line 100 renders it for the Cathedral with `siteId`, `name`, `demo`, `notice` (no `primer`, no `remote`). B4-2.c replaces it with `Memorial.tsx`.
- The candle path from the API to `/screen` works: one `POST /events` `{ kind: "candle", siteId: "cathedral" }` answered `202 {"accepted":1}` and `/screen` drew it (`cristea/GLOSSARY.md` Hand-offs, hour 30). `CLIENT_KINDS` in `apps/api/src/events/weights.ts` holds `candle`. The phone sends it with `track("candle", "cathedral")` (`apps/web/src/events/index.ts`), queued and retried.
- Motion: `apps/web/src/sensors/useRotationRate.ts` returns the largest absolute rotation rate (°/s) as a ref, `null` until a `devicemotion` event with a rate arrives; it asks for no permission. The primer asks iOS for orientation (`DeviceOrientationEvent.requestPermission`) inside the join tap; whether that grant also delivers `devicemotion` on the iPhone is not verified (B4-2.d). In `?demo=1` the primer asks for nothing, so an iPhone gets no rate there. `colour/hold.ts` `stepHold` is the lens's detector (colour plus 20 °/s) and is not reused.
- Audio: `apps/web/src/audio/engine.ts` (Patrick) plays the memorial bed at `MEMORIAL_GAIN` 0.5 through `useBed`; it exports `playBed`, `setBedGlow`, `stopBed`, `bedGain`, `bedUrl`, `healStep` (Patrick's rebuild after the page returns, B4-0 re-check), and has no mute. B4-2.b adds `setBedMuted`.
- Testimonies: `content/sites/05-cathedral.yaml` has `narrator_voice` and **no `narrations`**; no Cathedral speech clip exists in `apps/web/public/audio/cathedral/` (two beds only). `apps/web/src/audio/clips.json` `sites.cathedral.narrations` is `{}` and carries audio paths only (narration id → lang → file), no title, text or source. Patrick agreed (hour 23) that `publish:site` writes each narration's `title`, `text` and `source` into `clips.json` as `testimonies`, the way it writes `tapToAsk`. Not landed. The narration content (ro and en, each checked against its source) is team work, not written. Until both land, the testimony list is empty and the view hides it (Ionut's decision, hour 23).
- Language: no dictionary exists. `apps/web/src/talk/lang.ts` `visitorLang` (Patrick) maps `navigator.language` to the agent's five languages and is not reused for the UI. `colourName(bin, lang)` in `apps/web/src/colour/names.ts` already speaks ro and en. Site names in `@lampa/shared` `sites` (`packages/shared/sites.json`) are one string each (`Site.name: string`): "Muzeul MX Corneliu Miklosi", "Piața Unirii", "Piața Victoriei", "Theresia Bastion", "Metropolitan Cathedral". Two get Romanian names through the dictionary (`site_name.cathedral`, `site_name.bastion`) and `siteName(site)` in the seam (Ionut's decision, hour 37); the other three are Romanian already. UI strings sit inline in `apps/web/src/phone/*.tsx` (14 files) and `apps/web/src/nav/format.ts`.
- `DESIGN.md` 7.0 and 6.22 give the Romanian for about 12 strings; this session drafts the rest and Ionut, a native Romanian speaker, reviews every Romanian string before the `ionut/b4-lang` PR (Ionut's decision, hour 23).
- Base components: `Button` (`variant` primary, secondary, quiet, icon; `size`; `block`; `loading` with a spinner; `icon`), `Ring` (`progress`, `size`, `filling`, `holdMs`, `label`), `Notice`, `Icon` (`back`, `close`, `play`, `pause`, `stop`, `mic`, `check`, `alert`, `headphones`). `TopBar` (`siteName`, `onBack`, `demo`) always shows a back labelled "Back to {siteName}".
- "Needs from others" for this block: narration content (team) and the `testimonies` field in `clips.json` (Patrick): not landed (above). For B4-3: `GET /sites/:id?lang=ro|en` (Fabi, public) is on `main` (`apps/api/src/sites/router.ts`): 200 `SiteDetail` (`packages/shared/src/contract.ts`: `id`, `name` in the asked language, `lat`, `lng`, `is_memorial`, `radius_m`, `interactions`, `facts`, `directions_hint`, `glow`) for any published site, 404 `{ "error": "unknown_site" }`, 503 without a database.
- B4-3 (Cristea's request, team agreed at hour 37): a place published from `/curate` gets a QR for `/s/<id>`, and `findSite` (`apps/web/src/sites/sites.ts`) reads only the bundled `sites.json`, so the phone shows "We could not find this place.". What a new place has (Cristea, hour 37): never a memorial; interactions any of `talk`, `colours`, `echo`, `lamp`; `POST /panes` accepts it when it has `colours`; `POST /echoes` answers 404 for it; `/live` puts its socket in `city` only (`roomsFor`), and `glow` messages carry every site, so `useSiteGlow` gets its glow unchanged while `pane` messages of other visitors do not reach it (Fabi's file); its greeting and bed are in `blobs`, not `clips.json`, so it has no sound (Patrick; `bedUrl`, `questionsFor` and `greetingFor` return `null` or `[]` for an id missing from `clips.json`, so nothing throws); it is not in Between sites, the Sites list or the geofence (bundled `SITES` only), and `?demo=1` on it injects the MX position (`demo.ts`). These limits stay; B4-3 does not change them.
- `GET /sites/:id` sends `name: r.name[lang]` with no English fallback (`directions_hint` has one), and a site's `name` is any language record (`apps/api/src/content.ts` `Text`), so a place with no Romanian name would answer 500 to a Romanian phone. Ionut asks Fabi (hour 37) for `r.name[lang] ?? r.name.en` in `apps/api/src/sites/router.ts`; Blocked on Fabi until it lands. Add-a-place (`POST /sites`) is on no branch at hour 37.
- Scripts the verify commands use: root `npm run typecheck`, `npm run build`, `npm test`; web `npm run typecheck -w @lampa/web`, `npm run build -w @lampa/web`, `npm run test -w @lampa/web` (`vitest run --passWithNoTests`, `node` environment).
- Deployed: web `https://lampa-timisoara.vercel.app/s/cathedral` → 200; API `https://lampa-api-b45i.onrender.com/health` → 200 `{"ok":true}`.
- Phones and tools: Ionut's iPhone and a teammate's Android. Headless Chrome through the npx-cached Playwright for browser checks when the Playwright MCP is down.
- `.claude/` is ignored by git. `ionut-sensors` (opus) and `ionut-screens` (sonnet) are reused and were updated for this block at hour 23 (scope, documents, rules). No new subagent. Ionut restarts the session before implementing, so the updated files are the ones the Agent tool loads.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 4, Ionut's rows, and the Freeze list after it | All |
| `IMPLEMENTATION_PLAN.md` | Section 7, "The memorial site" and "Cut order when behind" | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Ionut's table and "Needs from others" | All |
| `ionut/GLOSSARY.md` | Whole file | All |
| `DESIGN.md` | 5.2 (hold rings), 6.2, 6.4, 6.20, 6.22, 6.23, 7.0, 7.11, 7.16, section 8, section 9 item 13 | B4-2 |
| `DESIGN.md` | 7.0 and every section of a phone screen whose strings B4-1.c moves (7.1, 7.2, 7.5, 7.6, 7.8, 7.9, 6.12) | B4-1 |
| `packages/shared/src/contract.ts` | `EventKind`, `Site` | B4-2 |
| `apps/web/src/audio/clips.ts`, `clips.json`, `engine.ts`, `engine.test.ts`, `useBed.ts` | Whole files | B4-2.b |
| `apps/web/src/sensors/useRotationRate.ts`, `camera.ts` (`maxRotation`), `demo.ts` | Whole files | B4-2.a, B4-2.c |
| `apps/web/src/events/index.ts` | `track` | B4-2.c |
| `apps/web/src/phone/` | `Join.tsx`, `MemorialStub.tsx`, `TopBar.tsx`, `SiteView.tsx` ("Next site" and `Between`), `Between.tsx` props | B4-2.c |
| `apps/web/src/phone/`, `apps/web/src/nav/format.ts`, `format.test.ts`, `score.ts` | Whole files | B4-1 |
| `apps/web/src/components/`, `apps/web/src/styles/tokens.css` | Read, never edit | B4-2.c, B4-1.c, B4-3.b |
| `packages/shared/src/contract.ts` | `SiteDetail` | B4-3 |
| `apps/web/src/api/client.ts`, `apps/web/src/sites/sites.ts` | Whole files | B4-3.a |
| `apps/web/src/phone/Join.tsx`, `SiteView.tsx` | Whole files | B4-3.b |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Section 6: "Memorial view (`DESIGN.md` 7.11; widened by Cristea, hour 30): back and a way on to the next site; Listen opens the Testimonies, playing Patrick's narrations with their text and source; the candle lights after 10 s of stillness (60 s until Cristea's decision, hour 30) measured by motion only (no microphone), 5 s with `?demo=1`, sends a `candle` event" (fallback: "back button, testimonies as text with their sources, and a tap lights the candle; the memorial site itself is never cut"). Section 11: "Memorial view: back and next site, testimonies, candle with motion-only stillness (10 s, 5 s in demo mode)" | 1.5 | B4-2.a, B4-2.b, B4-2.c, B4-2.d |
| Section 6: "Language dictionary for ro and en, picked from `navigator.language`" (fallback: "English only"). Section 11: "ro and en dictionary (a native speaker reviews the Romanian strings first)" | 1.5 | B4-1.a, B4-1.b, B4-1.c, B4-1.d |
| `DESIGN.md` section 9 item 13: "Memorial view: Testimony list and Candle", smallest version "7.11 with testimonies playing, the stillness Candle (5 s in demo mode) and the tap fallback; if the stillness check is not working at the freeze, ship the tap fallback alone" | 0.75 (styling) | B4-2.c |
| Section 8: no new test is listed for this lane in Build 4. The candle stepper, the testimony selector, `setBedMuted`, `t()` and the ro wording of `nav/format.ts` are tested here because a silent bug in them breaks the memorial step or a Romanian phone | in the hours above | B4-2.a, B4-2.b, B4-1.a, B4-1.b |
| Section 6 and 11, added at hour 37 at Cristea's request (team agreed; plan updated): "New-place pages: `/s/<id>` of a place published from `/curate` loads from `GET /sites/:id` when it is not in `sites.json`" (fallback: "the QR of a new place shows 'We could not find this place.'; its window still appears on `/screen`") | 0.5 | B4-3.a, B4-3.b, B4-3.c |
| Freeze line: "Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived." | phones | B4-2.d, B4-1.d, B4-3.c, B4-last |

Total: 3.5 h of tasks plus 0.75 h of required styling in a 3 h block. The styling comes from no slack: Ionut's cut order in section 0 applies from the start.

Order: B4-0 (seam) → B4-2.a.1 and B4-2.b.1 in parallel → B4-2.c.1 → push `ionut/b4-memorial` and open its PR → `ionut/b4-lang` from it: B4-1.a.1 → B4-1.b.1 → B4-1.c.1 → B4-1.d (Ionut's review) → push `ionut/b4-lang` → `ionut/b4-new-place` from it: B4-3.a.1 → B4-3.b.1 → B4-last. B4-1.a.1 may run in parallel with B4-2.c.1 (no shared file).

#### The seam (B4-0 commits it on `ionut/b4-memorial`, before any agent starts)

`apps/web/src/i18n/t.ts` (owner: this session; tests B4-1.a.1):

```ts
import en from "./en.json";
import ro from "./ro.json";

export type Lang = "en" | "ro";
export type Key = keyof typeof en;

/** "ro" when `navigator.language` starts with "ro", else "en" (Ionut's decision, hour 23). */
export function pickLang(navigatorLanguage: string | undefined): Lang {
  return (navigatorLanguage ?? "").toLowerCase().startsWith("ro") ? "ro" : "en";
}

/** The page's language, read once at load. No in-app switch. */
export const LANG: Lang = pickLang(typeof navigator === "undefined" ? undefined : navigator.language);
// Screen readers pick their voice from <html lang>.
if (typeof document !== "undefined") document.documentElement.lang = LANG;

const DICTS: Record<Lang, Partial<Record<Key, string>>> = { en, ro };

/** One UI string in `lang` (English when ro lacks the key), with `{name}` slots filled from `vars`. */
export function t(key: Key, vars: Record<string, string | number> = {}, lang: Lang = LANG): string {
  const s = DICTS[lang][key] ?? en[key];
  return s.replace(/\{(\w+)\}/g, (slot, name: string) => (name in vars ? String(vars[name]) : slot));
}

/** A site's name in `lang`: a `site_name.<id>` key when the dictionary has one, else `site.name` as `sites.json` or `GET /sites/:id` gives it (Ionut's decision, hour 37). */
export function siteName(site: { id: string; name: string }, lang: Lang = LANG): string {
  const key = `site_name.${site.id}`;
  return key in en ? t(key as Key, {}, lang) : site.name;
}
```

`apps/web/src/i18n/en.json` and `ro.json` start with the memorial keys (en from `DESIGN.md`; ro from `DESIGN.md` where it gives one, else this session's draft, reviewed by Ionut in B4-1.d):

| Key | en | ro |
|---|---|---|
| `back` | Back | Înapoi |
| `next_site` | Next site | Următorul loc |
| `memorial.lead` | A place of remembrance for December 1989. | Un loc de amintire pentru decembrie 1989. |
| `memorial.testimonies` | Testimonies | Mărturii |
| `memorial.narrator` | Read by a narrator. AI voice. | Citite de un narator. Voce AI. |
| `testimony.meta` | Narrated, {duration} | Narațiune, {duration} |
| `testimony.meta_pending` | Narrated | Narațiune |
| `testimony.source` | Source: {source} | Sursa: {source} |
| `testimony.play` | Play testimony: {title} | Ascultă mărturia: {title} |
| `testimony.pause` | Pause testimony: {title} | Oprește mărturia: {title} |
| `testimony.loading` | Loading | Se încarcă |
| `testimony.error` | This testimony did not load. The text is below. | Mărturia nu s-a încărcat. Textul e mai jos. |
| `candle.label` | Candle | Lumânare |
| `candle.ready` | Hold your phone still to light a candle. | Ține telefonul nemișcat ca să aprinzi o lumânare. |
| `candle.lit` | Your candle is lit. | Lumânarea ta e aprinsă. |
| `candle.tap` | Light a candle | Aprinde o lumânare |
| `site_name.cathedral` | Metropolitan Cathedral | Catedrala Mitropolitană |
| `site_name.bastion` | Theresia Bastion | Bastionul Theresia |

`apps/web/src/audio/clips.ts`, `SiteClips` gains one optional field (Patrick agreed, hour 23; his `publish:site` writes it, and his API-side `SiteClips` follows):

```ts
  testimonies?: { id: string; title: Record<string, string>; text: Record<string, string>; source: string }[]; // narrations' text, file order; audio in `narrations`
```

Signatures B4-2.c.1 builds on (owners B4-2.a.1 and B4-2.b.1; exact):

```ts
// apps/web/src/memorial/candle.ts
export const CANDLE_HOLD_MS = 10_000;
export const CANDLE_DEMO_HOLD_MS = 5_000;
export const STILL_MAX_DPS = 5;
export const NO_MOTION_MS = 3_000;
export const CANDLE_TICK_MS = 100;
export type CandleState = { openedAt: number; stillSince: number | null; sawRate: boolean; lit: boolean; fallback: boolean };
export function initialCandle(at: number): CandleState;
export function stepCandle(s: CandleState, input: { rate: number | null; at: number; holdMs: number }): CandleState;
export function candleProgress(s: CandleState, at: number, holdMs: number): number; // 0 to 1

// apps/web/src/memorial/testimonies.ts
export type Testimony = { id: string; title: string; text: string; source: string; audio: string | null };
export function testimoniesFor(siteId: string, lang: Lang, c?: Clips): Testimony[];
export function formatClock(seconds: number): string; // 160 → "2:40"

// apps/web/src/audio/engine.ts
export function bedTarget(glow: number | null, memorial: boolean, muted: boolean): number; // 0 when muted, else bedGain(glow, memorial)
export function setBedMuted(muted: boolean): void;
```

### 3.1 Subagents

Ionut asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Ionut, re-runs the checks, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `ionut-sensors` | Pure logic with Vitest tests: candle stepper, testimony selector, `setBedMuted`, `t()` tests, ro wording in `nav/format.ts` | opus | reused from Build 1 to 3, updated at hour 23 |
| `ionut-screens` | Phone screens with CSS Modules: the memorial view, Testimony, Candle, TopBar change, moving the phone strings to `t()`, the new-place fallback in Join and SiteView | sonnet | reused from Build 1 to 3, updated at hour 23 and hour 37 |
| `ionut-api` | `fetchSite` for `GET /sites/:id`, with tests | opus | reused from Setup to Build 3, updated at hour 37 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B4-2.a.1 | `ionut-sensors` | Candle stillness stepper and tests | `apps/web/src/memorial/candle.ts`, `candle.test.ts` | parallel with B4-2.b.1 |
| B4-2.b.1 | `ionut-sensors` | Testimony selector, `formatClock`, `setBedMuted`, tests | `apps/web/src/memorial/testimonies.ts`, `testimonies.test.ts`, `apps/web/src/audio/engine.ts`, `apps/web/src/audio/engine.test.ts` | parallel with B4-2.a.1 |
| B4-2.c.1 | `ionut-screens` | Memorial view, Testimony, Candle, Join and TopBar wiring | `apps/web/src/phone/Memorial.tsx`, `Memorial.module.css`, `Testimony.tsx`, `Testimony.module.css`, `Candle.tsx`, `Candle.module.css`, `Join.tsx`, `TopBar.tsx`, `MemorialStub.tsx` (deleted) | after B4-2.a.1 and B4-2.b.1 |
| B4-1.a.1 | `ionut-sensors` | `t()` and `pickLang` tests | `apps/web/src/i18n/t.test.ts` | after B4-0; may run with B4-2.c.1 |
| B4-1.b.1 | `ionut-sensors` | ro wording in `nav/format.ts` | `apps/web/src/nav/format.ts`, `format.test.ts`, `apps/web/src/i18n/en.json`, `ro.json` | after B4-2.c.1, on `ionut/b4-lang` |
| B4-1.c.1 | `ionut-screens` | Phone strings to `t()` | every `apps/web/src/phone/*.tsx` except `Memorial.tsx`, `Testimony.tsx`, `Candle.tsx`; `apps/web/src/phone/glow.ts`, `glow.test.ts`; `apps/web/src/i18n/en.json`, `ro.json` | after B4-1.b.1 |
| B4-3.a.1 | `ionut-api` | `fetchSite` and `PhoneSite.interactions` | `apps/web/src/api/sites.ts`, `sites.test.ts`, `apps/web/src/sites/sites.ts` | after B4-1.c.1, on `ionut/b4-new-place` |
| B4-3.b.1 | `ionut-screens` | Join fallback, a new place's buttons | `apps/web/src/phone/Join.tsx`, `SiteView.tsx`, `apps/web/src/i18n/en.json`, `ro.json` | after B4-3.a.1 |

Rules for this session:

- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Ionut to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Ionut. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Ionut (through the question prompt, with the recommendation first), record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B4-0 Preflight and seam (first, this session)

- [x] `git status`, `git branch --show-current`, `git pull` of `main`. List local changes; do not touch them. If `main` moved, bring `ionut/b4-memorial` up to it.
- [x] Baseline before any change, summary lines recorded: `npm run typecheck && npm run build && npm test`.
- [x] Re-check each fact of section 1 that can have moved: `content/sites/05-cathedral.yaml` `narrations`, `clips.json` `testimonies` and Cathedral clips, `engine.ts` exports, `MemorialStub.tsx` and its line in `Join.tsx`, the deployed web and API. Update section 1 and the Blocked rows where a fact moved.
- [x] Docs commit on `ionut/b4-memorial`: this prompt, the glossary rows of hour 23, the `IMPLEMENTATION_PLAN.md` and `DESIGN.md` updates of hour 23. Message `docs(ionut) wrote the Build 4 prompt and recorded the memorial and dictionary decisions`.
- [x] Ionut reviews the 18 Romanian strings of the seam table before the seam commit (Ionut's decision, hour 23): show him the table through the question prompt, apply his corrections to `ro.json` and to this prompt's table.
- [x] Seam commit: `apps/web/src/i18n/t.ts`, `en.json`, `ro.json` with the keys of the seam table, and the `testimonies?` line in `apps/web/src/audio/clips.ts`, exactly as in section 3. `npm run typecheck -w @lampa/web` exit 0. Message `feat(web) added the ro and en dictionary seam and the testimonies field`.
- Done when: the baseline is recorded, failures that were already there are listed and not fixed silently, and both commits exist.

### B4-2 Memorial view: back and next site, testimonies, candle with motion-only stillness (1.5 h, plus 0.75 h styling)

#### B4-2.a The candle lights after 10 s of motion-only stillness (5 s in demo mode)

**B4-2.a.1** Candle stillness stepper. Subagent: `ionut-sensors`. Files: `apps/web/src/memorial/candle.ts`, `apps/web/src/memorial/candle.test.ts`.

- [x] `candle.ts` exports exactly the constants, `CandleState`, `initialCandle`, `stepCandle` and `candleProgress` of the seam. Pure: no DOM, no timers, no React.
- [x] `initialCandle(at)` → `{ openedAt: at, stillSince: null, sawRate: false, lit: false, fallback: false }`.
- [x] `stepCandle(s, { rate, at, holdMs })`, in this order:
  1. `s.lit` or `s.fallback` → return `s` unchanged.
  2. `rate === null` and `!s.sawRate`: if `at - s.openedAt >= NO_MOTION_MS` → `{ ...s, fallback: true }`; else `s` (Ionut's decision, hour 23: no rate within 3 s shows the tap fallback).
  3. `rate === null` after a rate was seen → `{ ...s, stillSince: null }` (no reading counts as not still; Ionut's decision, hour 23).
  4. `rate < STILL_MAX_DPS` (strictly under 5 °/s, `DESIGN.md` 6.22) → `stillSince` is `s.stillSince ?? at`, `sawRate: true`; `lit: true` when `at - stillSince >= holdMs`.
  5. Otherwise (moved) → `{ ...s, stillSince: null, sawRate: true }`.
- [x] `candleProgress(s, at, holdMs)`: 1 when `s.lit`; 0 when `s.stillSince === null`; else `(at - s.stillSince) / holdMs` clamped to 0..1.
- [x] Tests by name: "still for 10 s lights the candle"; "still for 9.9 s does not"; "5 s is enough with the demo hold"; "a rate of exactly 5 deg/s counts as moving"; "moving resets the hold to zero"; "no rate for 3 s shows the fallback"; "no rate for 2.9 s does not"; "a rate seen before 3 s means no fallback later"; "a null after a rate resets the hold"; "a lit candle stays lit when the phone moves"; "progress is 0 when not still, half after 5 of 10 s, 1 when lit".
- Verify: `npm run test -w @lampa/web -- src/memorial/candle && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, and changing `<` to `<=` in step 4 fails "a rate of exactly 5 deg/s counts as moving".

#### B4-2.b Testimonies come from `clips.json`, and the bed falls silent while one plays

**B4-2.b.1** Testimony selector and the bed mute. Subagent: `ionut-sensors`. Files: `apps/web/src/memorial/testimonies.ts`, `apps/web/src/memorial/testimonies.test.ts`, `apps/web/src/audio/engine.ts`, `apps/web/src/audio/engine.test.ts`.

- [x] `testimoniesFor(siteId, lang, c = clips)`: `c.sites[siteId]?.testimonies ?? []` in file order, mapped to `Testimony`: `title` and `text` in `lang`, else `en`; an item with no `title.en` or no `text.en` and no text in `lang` is left out; `source` as written; `audio` = `AUDIO_BASE + c.sites[siteId].narrations[id][lang]`, else the `en` file, else `null`.
- [x] `formatClock(seconds)`: whole seconds rounded down, `m:ss` (`0` → "0:00", `42` → "0:42", `160` → "2:40", `600` → "10:00"); a non-finite value → "0:00".
- [x] `engine.ts` `bedTarget(glow, memorial, muted)`: pure, `0` when `muted`, else `bedGain(glow, memorial)`. Every gain the engine sets (connect, `setBedGlow`, unmute) goes through it.
- [x] `engine.ts` `setBedMuted(muted)` (Patrick agreed, hour 23): a module flag; when `true`, the current bed ramps to 0 over `RAMP_S`; when `false`, it ramps back to `bedGain(current.glow, current.memorial)` over `RAMP_S`; a bed that connects while muted starts at 0; `setBedGlow` keeps the bed at 0 while muted; `playBed` of a different site clears the flag. No other behaviour of the engine changes.
- [x] Tests by name: "testimonies keep file order"; "ro text when the phone is ro, en otherwise"; "an item with no English title is left out"; "audio falls back to the English file, then null"; "no testimonies field gives an empty list"; "formatClock"; "bedTarget is 0 when muted"; "bedTarget is the memorial 0.5 when not muted"; "bedTarget follows the glow when not muted". The engine tests stay pure, as the existing ones are: no Web Audio stub. Fixtures use neutral words only (section 0). Tests pass `lang` explicitly and never rely on `LANG`.
- Verify: `npm run test -w @lampa/web -- src/memorial src/audio && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, every engine test that passed in B4-0 still passes, and returning `bedGain` without the muted check fails "bedTarget is 0 when muted". The session checks by reading that `setBedGlow` and the connect path call `bedTarget`.

#### B4-2.c The visitor at the Cathedral listens to testimonies, lights a candle, and goes back or on

**B4-2.c.1** Memorial view, Testimony and Candle. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Memorial.tsx`, `Memorial.module.css`, `Testimony.tsx`, `Testimony.module.css`, `Candle.tsx`, `Candle.module.css`, `Join.tsx`, `TopBar.tsx`, `MemorialStub.tsx` (deleted).

- [ ] Every string through `t()` from `../i18n/t` with the seam's keys; the site name is `siteName(site)`.
- [ ] `TopBar`: `onBack` becomes optional and the back button is not rendered without it; a new optional `backLabel` replaces the "Back to {siteName}" accessible name when given. SiteView's uses do not change.
- [ ] `Memorial` (`site`, `demo`, `remote`, `primer`, `notice?`), one page per `DESIGN.md` 7.11 (Ionut's decision, hour 23: not a separate Testimonies screen): `TopBar` with the site name, `demo`, and back; the name (`--type-display`); `memorial.lead` (`--type-lead` `--text-2`); when `testimoniesFor(site.id, LANG)` is not empty, the heading `memorial.testimonies` (`--type-title`), `memorial.narrator` (`--type-meta` `--text-3`) and one `Testimony` per item; when it is empty, none of the three (Ionut's decision, hour 23: no placeholder line); then the `Candle` with `--space-2xl` above it, centred; at the bottom a quiet L `next_site` button. No amber primary.
- [ ] Back (Ionut's decision, hour 23): when the visitor came from inside the app (`useLocation().key !== "default"`), back calls `navigate(-1)` with `backLabel` `t("back")`; on a cold open (QR or typed link) no back is shown and `next_site` is the way on.
- [ ] `next_site` opens `Between` with `from={site}`, `primer`, `demo`, `remote`, and `onBack` returning to the memorial, the way `SiteView` does (Ionut's decision, hour 23).
- [ ] Sound: `useBed(site.id, null)` as the stub had it; `setBedMuted(true)` while a testimony plays, `setBedMuted(false)` when it pauses, ends or fails, and on unmount.
- [ ] `Testimony` (6.23): play/pause `Button` icon variant left of the title, named `testimony.play` or `testimony.pause` with the title; title (`--type-body` 600); meta `testimony.meta` with `formatClock(duration)` once the duration is known, `testimony.meta_pending` before (Ionut's decision, hour 23); `testimony.source` always visible (plain text: the content's `source` is a string with no URL field; Ionut's decision, hour 23). The `Audio` element is made on the first play tap and `play()` is called inside that tap before any `await`; `preload` stays the browser default. States: ready; loading (button `loading`, `testimony.loading`); playing (text under the item, max 65ch, elapsed "0:42 / 2:40" tabular); paused (keeps position); ended (back to ready, text stays visible); error (`testimony.error` and the text). `audio === null` → the item shows the error state at once (Ionut's decision, hour 23). Only one plays at a time: `Memorial` holds the playing id and starting one pauses the other. Item padding `--space-m`, 1px `--line` divider, no card.
- [ ] `Candle` (6.22): `Ring` 200px, `role="progressbar"` named `candle.label`, with the SVG candle inside (stem 12 × 48px `--text-2` radius 2px, base 40px above the ring's bottom inner edge; teardrop flame 18 × 30px `--lamp-white`, scaled from its base 0.4 → 1.0 with the progress, 40% opacity at 0.4, 100% when lit); the line under it. Every `CANDLE_TICK_MS` the component reads `useRotationRate()` and calls `stepCandle` with `holdMs` `CANDLE_DEMO_HOLD_MS` when `demo`, else `CANDLE_HOLD_MS`; the Ring shows `candleProgress`; a reset empties the Ring in 200ms `--ease-out` (5.2).
- [ ] Candle states: ready and filling show `candle.ready`; lit shows a full Ring, flame 1.0 and `candle.lit` in a `role="status"` announced once; fallback (no rate in 3 s) hides the Ring and shows a secondary L `candle.tap` under the flame at 0.4, and its tap lights it at once. On lighting (stillness or tap): `track("candle", site.id)` once, and a module-level `litThisLoad = true`. A Candle that mounts with `litThisLoad` already true shows `candle.lit` above a ready Ring, so a second candle can be lit (`DESIGN.md` 7.11, in memory only, Ionut's decision, hour 23). No vibration, no sound, no count.
- [ ] `Join.tsx`: the memorial branch renders `Memorial` with `site`, `demo`, `remote`, `primer={result}`, `notice`; `MemorialStub.tsx` is deleted and nothing imports it.
- [ ] `Join.tsx` keeps this page load's primer result in a module variable `lastPrimer` next to `primedThisLoad`, set in the tap; the initial `result` is `state ?? lastPrimer` when `primedThisLoad`, so a back to `/` or to a site page after the tap opens it without a second tap (Ionut's decision, hour 23: the memorial back is `navigate(-1)`, and `/` has no history state). A reload still asks for the tap.
- [ ] Remote mode: the same view; the candle counts the same. A 731 finale is ignored on this view.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -nE "#[0-9a-fA-F]{3,6}\b" apps/web/src/phone/Memorial.module.css apps/web/src/phone/Testimony.module.css apps/web/src/phone/Candle.module.css | wc -l` → `0`. Paste the summary lines.
- Session browser check (headless Chrome, 390×844), after the agent: `/s/cathedral?demo=1` → join tap → the view per 7.11 with no Testimonies section (empty list), the Candle in its fallback after 3 s (no `devicemotion` in headless Chrome), the tap lights it and one `POST /events` carries `candle` for `cathedral`; "Next site" opens Between sites from the Cathedral and its back returns; back hidden on the cold open; after arriving from Between sites on `/`, back lands on `/` showing Between sites with no join tap, and the phone's back from a site page does the same; with a temporary local `testimonies` fixture in `clips.json` (not committed): two items render, play shows loading then the error state (no audio file), only one item is active at a time.
- Done when: the verify lines pass, the hex grep is 0, and the browser check passes.

#### B4-2.d The memorial works on real phones

Ionut's check. Do not mark it done. After Cristea merges and redeploys the web app:

- iPhone, `/s/cathedral` (no demo): join tap (the orientation prompt); holding still fills the Ring over 10 s and lights the candle; moving resets it with no message; `/screen` shows a new candle. This settles whether the orientation grant delivers `devicemotion` on iOS. If the fallback button shows instead, report it: the tap lights the candle and the stillness check is listed as not working on iOS. Once a rate is seen there is no tap fallback: if the hand-held phone never stays under 5 °/s for 10 s, report it as a fail with what you saw.
- iPhone, `/s/cathedral?demo=1`: the fallback "Light a candle" after 3 s (expected, no motion permission in demo mode); its tap lights the candle.
- Android, `/s/cathedral` and `?demo=1`: stillness lights it after 10 s and 5 s.
- Both: "Next site" opens Between sites; back after arriving from the list returns; no back on a cold open from the QR; the bed plays quietly. Testimonies: only once Patrick's clips land.

### B4-1 Language dictionary for ro and en, picked from `navigator.language` (1.5 h)

Runs on `ionut/b4-lang`, made from `ionut/b4-memorial` after B4-2.c.1 is committed (B4-1.a.1 may run earlier on `ionut/b4-memorial`).

#### B4-1.a `t()` picks the language and never shows a missing key

**B4-1.a.1** Dictionary tests. Subagent: `ionut-sensors`. Files: `apps/web/src/i18n/t.test.ts`.

- [x] Tests call `pickLang` and pass `lang` to `t` explicitly; none relies on `LANG` (the machine's own `navigator.language` would decide it).
- [x] Tests by name: "ro-RO, ro and RO pick ro"; "en-GB, hu-HU, de, sr and undefined pick en"; "t fills every slot"; "an unknown slot stays as written"; "a key missing in ro falls back to en"; "en.json and ro.json have the same keys"; "no value is empty"; "siteName gives Catedrala Mitropolitană in ro and Metropolitan Cathedral in en"; "siteName of a site with no key is its own name".
- Verify: `npm run test -w @lampa/web -- src/i18n && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, and deleting one key from `ro.json` fails "en.json and ro.json have the same keys".

#### B4-1.b The directions on Between sites speak Romanian on a Romanian phone

**B4-1.b.1** `nav/format.ts` through `t()` (Ionut's decision, hour 23). Subagent: `ionut-sensors`. Files: `apps/web/src/nav/format.ts`, `apps/web/src/nav/format.test.ts`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ro.json`.

- [ ] Every user-visible string `format.ts` builds (distance words, "about N min walk", the eight compass words, the spoken directions of the hour 7 decision, the spoken line) comes from a `nav.*` key; each exported function that returns text gains a last parameter `lang: Lang = LANG`, so callers do not change. Numbers keep their format; the Romanian decimal separator is a comma ("1,2 km"; Ionut's decision, hour 23). Tests pass `lang` explicitly and never rely on `LANG`.
- [ ] The ro values are drafted by this agent from the en values and marked for Ionut's review in its report (B4-1.d). Site names come from `siteName(site, lang)` and stay in the nominative: a sentence that needs another case is rephrased ("spre {site}", "la {site}").
- [ ] The score tags `"nearest"` and `"going dark"` stay as values in `score.ts`; their display text gets `nav.tag_nearest` and `nav.tag_going_dark` keys here, used by `SiteRow` in B4-1.c.1.
- [ ] Every existing `format.test.ts` case still passes unchanged for en; new ro cases: one per function, including "1,2 km" and one spoken line.
- Verify: `npm run test -w @lampa/web -- src/nav src/i18n && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, and the key-parity test of B4-1.a.1 passes with the new keys.

#### B4-1.c Every phone screen speaks Romanian on a Romanian phone

**B4-1.c.1** Phone strings to `t()`. Subagent: `ionut-screens`. Files: every `apps/web/src/phone/*.tsx` except `Memorial.tsx`, `Testimony.tsx` and `Candle.tsx`; `apps/web/src/phone/glow.ts`, `glow.test.ts`; `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ro.json`.

- [ ] `glow.ts`: `glowWord` keeps its English union as values (code compares them); the GlowMark shows it through `glow.asleep`, `glow.waking`, `glow.awake`, `glow.fully_lit`; `glowLine` gains a last parameter `lang: Lang = LANG`; existing glow tests pass unchanged, plus one ro case with `lang` passed explicitly.

- [ ] Every user-visible string and accessible name in those files goes through `t()`, with flat keys named `<screen>.<what>` (`join.wake`, `lens.point`, `echo.sent`). Site names come from `siteName(site)`; colour names from `colourName(bin, LANG)`; the score tags from `nav.tag_nearest` and `nav.tag_going_dark`. Existing English wording does not change.
- [ ] The ro values: `DESIGN.md` 7.0 and 6.22 where they give one; otherwise drafted by this agent and listed in its report for Ionut's review. Site names stay in the nominative: "Culoarea ta e în vitraliul de la {site}. {count} din 48." replaces the 7.0 genitive (Ionut's decision, hour 23). No em dashes, no exclamation marks, the 7.0 memorial voice at the Cathedral.
- [ ] `<html lang>` is already set from `LANG` by `t.ts` (seam); nothing to add.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`, then `grep -nE '>[A-Z][a-z]+[^<{]*<|aria-label="[A-Za-z]|`[A-Z][a-z]+ ' apps/web/src/phone/*.tsx apps/web/src/phone/glow.ts` → no hit that is UI text (list any hit that is not, with its line). Paste the summary lines.
- Session browser check (headless Chrome with `--lang=ro-RO`, then `--lang=en-US`): `/s/unirii?demo=1` join and Site view, the lens with a red canvas camera, the echo recorder, `/` Between sites and the Sites list, `/s/cathedral?demo=1`: every visible string is Romanian with `ro-RO` and unchanged English with `en-US`.
- Done when: the verify lines pass and both browser runs show one language each, with no key names on screen.

#### B4-1.d Ionut reviews every Romanian string

Ionut's check. Do not mark it done. This session lists every `ro.json` value with its en value in one table in the PR description; Ionut corrects them, the session commits the corrections as `fix(web) applied Ionut's review of the Romanian strings`, and the PR opens only after that.

### B4-3 New-place pages from `GET /sites/:id` (0.5 h, added at hour 37, Cristea's request, first to cut)

Runs on `ionut/b4-new-place`, made from `ionut/b4-lang` after B4-1 is committed.

#### B4-3.a The phone can load a published place it does not have in `sites.json`

**B4-3.a.1** `fetchSite`. Subagent: `ionut-api`. Files: `apps/web/src/api/sites.ts`, `apps/web/src/api/sites.test.ts`, `apps/web/src/sites/sites.ts`.

- [ ] `sites.ts`: `PhoneSite` becomes `Site & { lamp: boolean; interactions?: string[] }`; `interactions` is set only for a fetched place, so the bundled sites do not change.
- [ ] `api/sites.ts`: `fetchSite(id: string, lang: Lang = LANG): Promise<PhoneSite | null>` calls `api(`/sites/${encodeURIComponent(id)}?lang=${lang}`, { schema: SiteDetail })` and returns `{ id, name, lat, lng, is_memorial, lamp: interactions.includes("lamp"), interactions }`; an `ApiError` with status 404 → `null`; any other error is thrown unchanged.
- [ ] Tests by name (`fetch` and `localStorage` stubbed, as `client.test.ts` does; `lang` passed explicitly): "a SiteDetail becomes a PhoneSite with its interactions"; "lamp is true only when interactions list lamp"; "a 404 gives null"; "a 503 throws ApiError 503"; "a network error throws"; "the path encodes the id and carries lang".
- Verify: `npm run test -w @lampa/web -- src/api && npm run typecheck -w @lampa/web`. Paste the summary line.
- Done when: every case passes, and returning `null` for every `ApiError` fails "a 503 throws ApiError 503".

#### B4-3.b Scanning a new place's QR opens its Site view

**B4-3.b.1** Join fallback and the new place's buttons. Subagent: `ionut-screens`. Files: `apps/web/src/phone/Join.tsx`, `apps/web/src/phone/SiteView.tsx`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ro.json`.

- [ ] `Join.tsx`: when `siteId` is given and `findSite` misses, `fetchSite(siteId)` runs on mount. While it runs: the join layout with the line `join.looking` "Looking for this place…" and no button. `null` (404) → the existing "We could not find this place." view, unchanged. Any other failure → an error `Notice` `join.unreachable` "We could not reach LAMPA. Check your connection, then try again." with a secondary L `join.try_again` "Try again" that fetches again (Ionut's decision, hour 37). A found place renders exactly as a bundled site from then on (join tap, `SiteView`). A bundled site never fetches.
- [ ] `SiteView.tsx`, only when `site.interactions` is set (a fetched place; Ionut's decision, hour 37): "Talk" only when it lists `talk`, "Catch a colour" only when it lists `colours`, "Raise a lamp" from `site.lamp` as today, "Leave an echo" never (`POST /echoes` answers 404 for it). Bundled sites show what they show today.
- [ ] The states above follow `DESIGN.md` 7.1 and 7.2 as updated at hour 37.
- [ ] New strings through `t()`; their ro values drafted by this agent and listed in its report. Ionut reviews them before the `ionut/b4-new-place` PR, the same way as B4-1.d.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary lines.
- Session browser check (headless Chrome, 390×844, `GET /sites/:id` routed by Playwright): `/s/newplace` with a 200 `SiteDetail` whose `interactions` are `["colours", "lamp"]` → "Looking for this place…", then the join view with its name, the tap, then the Site view with "Catch a colour" and "Raise a lamp" only; 404 → "We could not find this place."; 503 then 200 → the Notice, "Try again", then the join view; `/s/unirii` → no request to `/sites/unirii`; on the fetched place no page error, "Talk" hidden and "Next site" opens Between sites.
- Done when: the verify lines pass and the browser check passes.

#### B4-3.c A new place opens on real phones

Ionut's check. Do not mark it done. After Cristea merges and redeploys the web app: Cristea publishes a place from `/curate`; Ionut scans its QR on the iPhone and the Android; the Site view opens with its name and only the buttons of its interactions; a caught colour lands in its window on `/screen`. No sound and no glow from other visitors' panes on the phone are expected (section 1).

### B4-last Integrate and hand over (last, this session)

- [ ] The three branches of this block merged into a local throwaway branch, `npm run typecheck && npm run build && npm test` green on it.
- [ ] Push each branch and open its PR, in this order: `ionut/b4-memorial`, then `ionut/b4-lang`, then `ionut/b4-new-place`. Each PR lists what was verified, what waits for a phone, and that the web app needs Cristea's manual redeploy.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked; Hand-offs lists `t()`, `LANG`, `Lang`, the dictionary files, `Memorial`, `setBedMuted`, `testimoniesFor`, the `testimonies` field, `siteName`, `fetchSite` and `PhoneSite.interactions`; and for Cristea: `/s/<id>` of a published place opens on a phone.
- [ ] Ionut's checks on real phones, listed and not claimed: B4-2.d per phone; a phone set to Romanian shows the join, Site view, lens, echo, Between sites and memorial in Romanian, and an English phone in English; the Freeze line (full demo script, twice per phone) with the Build 4 items that survived.
- Done when: every box is ticked or listed as Ionut's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected: the narration content (team) and Patrick's `publish:site` run that writes `testimonies` and the narration clips; the iOS motion question if B4-2.d shows the fallback; for a new place, the English name fallback in `GET /sites/:id` and the site room on `/live` (Fabi), and its sound (Patrick).
- **Not finished at hour 40:** each ID, what is left, and its place in Ionut's cut order (section 0).
- **Phone checks for Ionut:** what you could not run here.
- **For the freeze:** what the other lanes should know: `t()` is there for their own strings; the memorial needs Patrick's clips to show testimonies; the web app needs a manual redeploy.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 4

- At `/s/cathedral` the visitor sees the memorial view of `DESIGN.md` 7.11 with no game element, can go back (when they came from inside the app) and on to the next site, and lights a candle by 10 s of stillness (5 s in demo mode) or by the tap fallback; each candle sends one `candle` event that reaches `/screen`.
- When `clips.json` carries the Cathedral's `testimonies`, each plays its narration with its text and source, one at a time, with the bed silent while it plays; while it carries none, the view shows no testimony section.
- `/s/<id>` of a place published from `/curate` opens its Site view on a phone, with only the buttons of its interactions and no "Leave an echo"; an unknown id still shows "We could not find this place."; a failed request offers "Try again" (unless B4-3 was cut).
- A phone whose language starts with "ro" shows every phone screen and the Between sites directions in Romanian reviewed by Ionut; any other phone shows English.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `ionut/GLOSSARY.md` matches the state of the branch.

# Prompt: Cristea's Build 4, demo extras (Identity, infra, Living Map, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 37 (2026-11-14 13:21 +0200), `main` at `b579612`. The team agreed to the plan line, the contract additions and the requests to other lanes at hour 37. Implementation not started.**

You are implementing Cristea's part of Build 4 (hours 37 to 40) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Build 4 no goal line. Its intro, word for word: *Three hours, so each person gets one main item. Anything not working at hour 40 is cut and the demo uses the fallback in the last column.*

Cristea's row and its fallback (plan section 6, Build 4): *Add a place: form in the console (use my location, name, facts, persona), `POST /sites` and `/sites/:id/publish` behind `write:site`, calling the same publish code as the script. QR code for the new URL* | 2.5 h | fallback *show a pre-filled form and a pre-published sixth site*.

Build 4 has no checkpoint. The lines that judge this row:

- Plan section 10: *"A new place published in under 5 minutes" counts only if Build 4's add-a-place row survived the freeze.*
- Concept PDF v6, demo script 10.4: *2:40 Scalability: a teammate adds a fifth place in the console and publishes it; its empty window appears on the Living Map.* (With the Cathedral and MX it is now the sixth place.)
- Freeze (plan section 6), the first line: *Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived.*

## 0. Ground rules

- **Cristea takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Cristea, with your recommendation. Nothing uses the recommendation until Cristea answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 40.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Cristea: carrying on, cutting (plan section 7) or moving it is their decision. Cut order inside this block (Cristea's decision, hour 37): the subtitle flip (B4-2.c), then `siteName` on `PendingEcho` (B4-2.b), then the step-list styling of `DESIGN.md` section 9 item 15, then the `/screen` position easing (circles jump instead). Never cut: `POST /sites`, the publish steps, the `/screen` fade-in, the QR code. Below all of these the plan's fallback holds: a pre-filled form and a sixth site published ahead of time.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Cristea, who takes it to the team. This block appends only the schemas written in the seam below; the team agreed to them at hour 37. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one.
- No library beyond plan section 3 without Cristea's approval. Approved: none new. `qrcode` 1.5.4 is already installed (Build 2).
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server.
- `main` deploys by itself. Work on branches: `cristea/b4-places` (B4-1.a, B4-1.b, B4-1.e, B4-2.b API side), `cristea/b4-screen` (B4-1.d, B4-2.c), `cristea/b4-console` (B4-1.c, B4-2.a, B4-2.b console side). One small PR per branch, in that order. Open it only after the verify commands pass. Cristea merges. A broken `main` is fixed or reverted within 15 minutes. Prompt and glossary commits go straight to `main`, as in earlier blocks.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. In this block: every test uses a fake `fetch`. A live publish runs only as Cristea's check or at a rehearsal, never from an agent.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. A place added through the console is never a memorial (`is_memorial` is always false).
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token.
- Write in `cristea/` only. Other members' folders are read-only. Other lanes' code files are read-only too: what this block needs from them goes under Blocked as a request.
- **Keep `cristea/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Cristea a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- Stop the Vite dev server before `npm ci` in a worktree (it locks the `@lampa/*` links).

## 1. Current state (checked at hour 37, 2026-11-14 13:21 +0200)

- Build 3 is closed for this lane: every B3 ID is under Done, nothing was cut. Cristea moved four checks to the end of Build 4: the phone candle, Keep my colours on the iPhone, the Checkpoint 3 runs, and the post-call webhook with a live Talk.
- `main` is at `b579612` (Patrick's Build 2 close). The working tree is clean. No open PRs. Remote branches: `main` only.
- Web `https://lampa-timisoara.vercel.app/curate` → 200. API `https://lampa-api-b45i.onrender.com/health` → 200 `{"ok":true}`.
- What this block builds on:
  - `apps/api/src/publish/publish.ts` (Patrick's): `publishSite(site: SiteFile, opts: PublishOpts)` plans a greeting per `persona.first_message` language (needs `persona.voice`, else skipped `no voice`), one answer per `tap_to_ask` entry, and `BED_TAKES = 2` beds of 15 s from `sound_bed` (else skipped `no sound_bed`). `PublishOpts.exists(file)` and `put(file, bytes)` are synchronous. File names are `<siteId>/<stem>-<hash>.<ext>`, with the hash taken over path, query, body and take, so the same inputs give the same name and cost nothing the second time. Credits: 1 per character of speech, 40 per second of sound (one bed take is 600). `outcome` is `dry`, `done`, `over_cap` or `failed`. Patrick's hand-off: site ids, `tap_to_ask` ids and language keys go into file names unchecked, so validate them before user input reaches these.
  - `apps/api/src/db/seed.ts` (Fabi's): `SiteFile` (Zod), `toSiteRow`, `INSERT_SITE` (hard-codes `'published'`). The `sites` table (migration 001): `id` PK, `city`, `slug` UNIQUE, `name` jsonb, `geom` geography point, `radius_m`, `interactions text[]`, `persona` jsonb, `facts` jsonb, `directions_hint` jsonb, `glow_k`, `is_memorial`, `active_from`, `active_until`, `status` `draft | published`. There is no `sound_bed` column.
  - `apps/api/src/content.ts`: `Fact` `{ text, source }`, `PersonaContent` (`name`, `voice`, `traits`, `first_message`, `cathedral_line`, `tap_to_ask`).
  - `apps/api/src/sites/router.ts` (Fabi's): `GET /sites/:id?lang=` answers `SiteDetail` for any published site in the table, public, 120 a minute per IP. `GET /sites?near=` answers at most 5 sites within 2000 m.
  - Glow (Fabi's, glossary hour 7): every `glow` message lists all published sites from the table, zeros included, every 5 s and about 1 s after a nudge. `onEventsStored` (in `AppDeps`) is the nudge.
  - `apps/api/src/panes/router.ts` (Fabi's) accepts a pane for any published site in the table whose `interactions` hold `colours`.
  - `apps/api/src/echoes/router.ts` (Cristea's): `SELECT_BLOB` left-joins `echoes`; a blob with no echo row answers 404 `unknown_blob`, marked `// shortcut: ... until add-a-place audio arrives in Build 4`. `SELECT_PENDING` returns `id, site_id, created_at, lang, transcript, audio_url`. `canModerate`, `curatorOnly`.
  - `apps/api/src/auth/session.ts`: `requireVisitor` sets `req.visitor = { sub, kind, permissions }`; Auth0 tokens carry `permissions` (RBAC).
  - `apps/api/src/app.ts`: routers mounted after `express.json()`, the last being `createPulseRouter`.
  - Web: `apps/web/src/curate/CuratePage.tsx` holds one heading-tab "Echo queue" and decides access from the API's 403; `signIn()` calls `loginWithRedirect` without clearing `lampa.signInReturnTo` (`SIGN_IN_RETURN_KEY` in `apps/web/src/auth/claimFlow.ts`). `queue.ts` exports `siteName` (bundled names). `authApi(path, token, schema)` in `apps/web/src/auth/authApi.ts`.
  - Web `/screen`: `ScreenPage.tsx` builds `COLOUR_SITE_IDS`, `SITE_NAMES` and `PLACED = layout(sites, MAP_LINES)` once at module level from the bundled `sites`. `projection.ts` `layout()` returns each point with a label side `below | above`. `useScreenSocket` applies `glow`. `Subtitle.tsx` is placed per site in `ScreenPage.tsx`. `tickerCopy.ts` has no "New place" line yet. `QRBlock.tsx` draws to a canvas.
  - `design/css/components.css` block `6.16 Field` (`.field`, `.field__label`, `.field__input`) and `design/css/console.css`.
- What does not exist yet, and which subtask adds it: the place schemas (B4-0 seam), `POST /sites` (B4-1.a), `POST /sites/:id/publish` and public site audio (B4-1.b), `place:reset` (B4-1.e), the Add a place tab (B4-1.c), `/screen` learning new sites (B4-1.d), the `/curate` return-key line (B4-2.a), `siteName` on `PendingEcho` (B4-2.b), the subtitle flip (B4-2.c).
- What a sixth site does not reach, and stays out of this block (Cristea's decision, hour 37; requests go under Blocked): the phone (`findSite` in Ionut's `apps/web/src/sites/sites.ts` reads the bundle, so `/s/<new id>` does not know the site), the `/live` room `site:<id>` (Fabi's `live/socket.ts` admits bundled ids only), `POST /echoes` and the agent tools (bundled ids), and playback of the new site's clips (Patrick's engine reads the bundled `clips.json`).
- Auth0: `write:site` belongs to the `admin` role only, and stays so (Cristea's decision, hour 37). The demo publisher signs in with an admin account.
- Needs from others for this block: `publishSite` as an importable function from Patrick, landed (Patrick's hand-off, hour 8). Nothing else is needed for the API or `/screen`.
- Scripts the verify commands use: root `typecheck`, `build`, `test`; `npm test -w @lampa/api`, `npm test -w @lampa/web`, `npm run typecheck -w <ws>`, `npm run build -w @lampa/web`. No baseline run yet at hour 37: B4-0 records it.
- Devices for Cristea's checks: an iPhone and a laptop with HDMI. No Android phone.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 4, Cristea's row, and the Freeze list | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Cristea's table and "Needs from others" | All |
| `cristea/GLOSSARY.md` | Whole file | All |
| `IMPLEMENTATION_PLAN.md` | Section 7 (cut order), section 9 (credits and Render rows), section 10 | All |
| `DESIGN.md` | Section 9 item 15; sections 6.1, 6.2, 6.7, 6.16, 6.17, 7.0, 7.15 | B4-1.c, B4-2.a, B4-2.b |
| `DESIGN.md` | Sections 5.5, 5.6, 6.18, 7.13 | B4-1.d, B4-2.c |
| `design/css/components.css` block 6.16, `design/css/console.css` | That block, whole file | B4-1.c |
| `packages/shared/src/contract.ts`, `index.ts`, `sites.ts` | Whole file | All |
| `apps/api/src/publish/publish.ts`, `apps/api/src/content.ts`, `apps/api/src/db/seed.ts` | Whole file | B4-1.a, B4-1.b |
| `db/migrations/001_init.sql` | The `sites` and `blobs` tables | B4-1.a, B4-1.b |
| `apps/api/src/app.ts`, `seam.ts`, `auth/session.ts`, `echoes/router.ts`, `echoes/router.test.ts`, `sites/router.ts` | Whole file | B4-1.a, B4-1.b, B4-2.b |
| `content/sites/01-mx.yaml` | `persona.voice` only | B4-1.a |
| `apps/web/src/curate/`, `apps/web/src/auth/authApi.ts`, `apps/web/src/auth/claimFlow.ts`, `apps/web/src/components/index.ts` and the components it exports, `apps/web/src/api/client.ts` | Every file, whole file | B4-1.c, B4-2.a, B4-2.b |
| `apps/web/src/screen/` | Every file | B4-1.d, B4-2.c |
| `patrick/GLOSSARY.md`, `fabi/GLOSSARY.md`, `ionut/GLOSSARY.md` | Hand-offs | B4-0, B4-last |
| Concept PDF v6 (gitignored, on this machine) | Section 10.4 (step 2:40), the add-a-place table in section 8.3 | B4-last |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| Add a place: form in the console (use my location, name, facts, persona), `POST /sites` and `/sites/:id/publish` behind `write:site`, calling the same publish code as the script. QR code for the new URL | 2.5 | B4-1.a, B4-1.b, B4-1.c, B4-1.d |
| Section 11: Add a place: form, endpoints, QR code | in the 2.5 | B4-1.a, B4-1.b, B4-1.c |
| Fallback: show a pre-filled form and a pre-published sixth site | in the 2.5 | B4-1.c (`?demo=1` pre-fill), B4-1.e (`place:reset`), B4-last (the place the last rehearsal published stays published as the fallback) |
| `DESIGN.md` section 9 item 15 (optional): Add a place. Smallest version: Field styling, publish step list, QRBlock | slack (0.5) | B4-1.c |
| `DESIGN.md` 5.5 and 7.13: New site published, its window fades in from opacity 0 over 1200ms; ticker "New place: {Site}" | in the 2.5 | B4-1.d |
| Section 10: "A new place published in under 5 minutes" counts only if Build 4's add-a-place row survived the freeze | | B4-last |
| Demo 2:40: a teammate adds a fifth place in the console and publishes it; its empty window appears on the Living Map | | B4-1, B4-last |
| Carried from Build 3 (Cristea's decision, hour 37): `/curate` clears `lampa.signInReturnTo` before its sign-in | slack | B4-2.a |
| Carried from Build 3 (Cristea's decision, hour 37): `siteName` on `PendingEcho` | slack | B4-2.b |
| Carried from Build 3 (Cristea's decision, hour 37): the echo subtitle at Piața Unirii covers the Victoriei and Bastion windows | slack | B4-2.c |
| Carried from Build 3 (Cristea's decision, hour 30): phone candle, Keep my colours on the iPhone, Checkpoint 3 runs, post-call webhook | | B4-last |

Total: 2.5 h of tasks plus about 0.75 h of styling and carry-overs from slack, in a 3 h block.

Order: B4-0 (this session: baseline, docs commit, seam commit). Then three agents in parallel, one per branch, in worktrees: `cristea-api` runs B4-1.a.1, B4-1.b.1, B4-1.e.1, B4-2.b.1; `cristea-console` runs B4-1.c.1, B4-2.a.1, B4-2.b.2; `cristea-canvas` runs B4-1.d.1, B4-2.c.1. Then B4-last.

#### The seam (this session commits it first, on `cristea/b4-places`)

Appended to `packages/shared/src/contract.ts`, after `PulseCandles`, and `PendingEcho` gains one optional field. Cristea tells the team (Changes line). The console and the API both import these.

```ts
// PendingEcho gains, after audioUrl:
  siteName: z.string().optional(), // the site's English name from the sites table (Build 4)

// Add a place (Cristea, Build 4): POST /sites and POST /sites/:id/publish, behind write:site.
export const PLACE_ID = /^[a-z0-9-]{2,40}$/;
export const PlaceInteraction = z.enum(["talk", "colours", "echo", "lamp"]);
export type PlaceInteraction = z.infer<typeof PlaceInteraction>;
export const PlaceFact = z.object({
  text: z.string().trim().min(10).max(280),
  source: z.string().trim().max(500).regex(/^https:\/\/\S+$/),
});
export const PlaceIn = z.object({
  name: z.object({ ro: z.string().trim().min(2).max(60), en: z.string().trim().min(2).max(60) }),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  facts: z.array(PlaceFact).min(2).max(5),
  persona: z.string().trim().min(10).max(400),
  interactions: z.array(PlaceInteraction).min(1),
});
export type PlaceIn = z.infer<typeof PlaceIn>;
export const PlaceDraft = z.object({ id: z.string().regex(PLACE_ID), status: z.literal("draft") });
export type PlaceDraft = z.infer<typeof PlaceDraft>;
export const PublishStep = z.enum(["greeting", "bed", "live"]);
export type PublishStep = z.infer<typeof PublishStep>;
export const PublishIn = z.object({ step: PublishStep });
export const PublishOut = z.object({ step: PublishStep, credits: z.number().int().min(0) });
export type PublishOut = z.infer<typeof PublishOut>;
```

`index.ts` already re-exports `contract.ts`; check it, and add nothing if it does.

The id rule, in `packages/shared/src/placeId.ts` (exported from `index.ts`), used by the API and shown by the console:

```ts
/** English name → site id: lower case, diacritics stripped, every run of other characters → "-", trimmed, at most 40. */
export function placeId(nameEn: string): string {
  return nameEn
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
```

Answers (Cristea's decisions, hour 37), for both sides:

| Call | Answer |
|---|---|
| `POST /sites` with `PlaceIn` | 201 `PlaceDraft`; 400 `{"error":"invalid_place"}` (schema fails); 400 `{"error":"invalid_id"}` (`placeId` result fails `PLACE_ID`); 401; 403 `{"error":"forbidden"}` without `write:site`; 409 `{"error":"site_exists"}` (the id is published or seeded); 429 `{"error":"rate_limited"}` with `Retry-After` past 10 an hour per `sub`; 503 `{"error":"unavailable"}` |
| `POST /sites` again for an id that is still a draft | overwrites the draft, 201 `PlaceDraft` |
| `POST /sites/:id/publish` with `PublishIn` | 200 `PublishOut` (`credits` = new credits spent; 0 when the files existed); 400 `{"error":"invalid_step"}`; 401; 403 `forbidden`; 404 `{"error":"unknown_site"}`; 409 `{"error":"already_published"}` for any step on a published site; 409 `{"error":"over_cap"}` past 2,000 credits; 502 `{"error":"generation_failed"}`; 503 `unavailable` (no database, or no `ELEVENLABS_API_KEY` for `greeting` and `bed`) |

Commit: `feat(shared) added the add-a-place schemas and siteName on PendingEcho`.

### 3.1 Subagents

Cristea asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Cristea, re-runs the checks, writes the glossary and does the first and last tasks. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `cristea-api` | Express routes, publish wiring into `blobs`, and their Vitest tests in `apps/api` | opus | reused, documents updated for Build 4 |
| `cristea-console` | The `/curate` console: Add a place tab, form, steps, QR, with Vitest tests in `apps/web` | opus | reused, documents updated for Build 4 |
| `cristea-canvas` | `/screen`: new sites from glow, refit and fade-in, ticker line, subtitle placement | opus | reused, documents updated for Build 4 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B4-1.a.1 | `cristea-api` | `POST /sites` saves a draft | `apps/api/src/places/router.ts`, `places/router.test.ts`, `places/content.ts`, `places/content.test.ts`, `apps/api/src/app.ts` | parallel with B4-1.c.1 and B4-1.d.1 |
| B4-1.b.1 | `cristea-api` | Publish steps into `blobs`, public site audio | `apps/api/src/places/router.ts`, `places/router.test.ts`, `places/publish.ts`, `places/publish.test.ts`, `apps/api/src/echoes/router.ts`, `echoes/router.test.ts` | after B4-1.a.1 |
| B4-1.e.1 | `cristea-api` | `place:reset` | `apps/api/src/places/reset.ts`, `places/reset.test.ts`, `apps/api/package.json` (scripts block) | after B4-1.b.1 |
| B4-2.b.1 | `cristea-api` | `GET /echoes` fills `siteName` | `apps/api/src/echoes/router.ts`, `echoes/router.test.ts` | after B4-1.e.1 |
| B4-1.c.1 | `cristea-console` | Add a place tab | `apps/web/src/curate/*` (new: `AddPlace.tsx`, `AddPlace.module.css`, `placeForm.ts`, `placeForm.test.ts`, `PublishSteps.tsx`, `PlaceQR.tsx`, `demoPlace.ts`; changed: `CuratePage.tsx`, `CuratePage.module.css`), `apps/web/src/auth/authApi.ts`, `authApi.test.ts` | parallel with B4-1.a.1 and B4-1.d.1 |
| B4-2.a.1 | `cristea-console` | `/curate` clears the return key | `apps/web/src/curate/CuratePage.tsx`, `queue.ts`, `queue.test.ts` | after B4-1.c.1 |
| B4-2.b.2 | `cristea-console` | The queue shows `siteName` | `apps/web/src/curate/queue.ts`, `queue.test.ts` | after B4-2.a.1 |
| B4-1.d.1 | `cristea-canvas` | New sites on `/screen` | `apps/web/src/screen/ScreenPage.tsx`, `useScreenSocket.ts`, `canvas.ts`, `newSites.ts`, `newSites.test.ts`, `tickerCopy.ts`, `ticker.test.ts` | parallel with B4-1.a.1 and B4-1.c.1 |
| B4-2.c.1 | `cristea-canvas` | Subtitle flips above when below covers a site | `apps/web/src/screen/Subtitle.tsx`, `Subtitle.module.css`, `subtitlePlace.ts`, `subtitlePlace.test.ts`, `ScreenPage.tsx` | after B4-1.d.1 |

No agent installs a package, so `package-lock.json` does not change. B4-1.e.1 edits only the `scripts` block of `apps/api/package.json`.

Rules for this session:

- The three branches run at the same time, so start each of the three agents with `isolation: "worktree"`. Each agent's first agent task starts with: check out its branch and run `npm ci` (B4-1.a.1: `git checkout cristea/b4-places && npm ci`; B4-1.c.1: `git checkout cristea/b4-console && npm ci`; B4-1.d.1: `git checkout cristea/b4-screen && npm ci`).
- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Cristea to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Cristea. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Cristea, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B4-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm ci && npm run typecheck && npm run build && npm test`.
- [ ] Re-check the other three glossaries' Hand-offs for anything that moved since hour 37 (a phone fallback for unknown sites, `demo:reset` touching `sites`).
- [ ] Docs commit to `main`: this prompt and the hour-37 glossary lines. Commit: `docs(cristea) recorded the Build 4 prompt and Cristea's hour-37 decisions`.
- [ ] Seam commit on a new `cristea/b4-places` from `main`, as written above, with a Changes line for `packages/shared/src/contract.ts` and `placeId.ts`. Then `cristea/b4-console` and `cristea/b4-screen` from that commit.
- Verify: `npm run typecheck && npm run build && npm test` on the seam commit. Paste the summary line.
- Done when: the baseline is recorded, failures that were already there are listed and not fixed silently, and the seam commit passes the same chain.

### B4-1 Add a place: form, endpoints, QR code (2.5 h)

All values are Cristea's decisions, hour 37, including the UI strings below that `DESIGN.md` does not give, public `site-` audio for drafts, the 15 s location timeout and the 403 shown at "Saving place".

#### B4-1.a An admin's place is saved as a draft with a safe id

**B4-1.a.1** `POST /sites`. Subagent: `cristea-api`. Files: `apps/api/src/places/router.ts`, `apps/api/src/places/router.test.ts`, `apps/api/src/places/content.ts`, `apps/api/src/places/content.test.ts`, `apps/api/src/app.ts`.

- [ ] First: `git checkout cristea/b4-places && npm ci`.
- [ ] `places/content.ts`, named constants and one function:
  - `NEW_PLACE_VOICE = "2V7k6GOisfFlHlBdz8ec"` (MX's `persona.voice`), `NEW_PLACE_CITY = "timisoara"`, `NEW_PLACE_RADIUS_M = 40`, `NEW_PLACE_GLOW_K = 5`, `PLACE_LIMIT = 10`, `PLACE_WINDOW_MS = 3_600_000`, `PLACE_MAX_CREDITS = 2000`.
  - `greeting(name)`: `{ ro: "Bună seara. Sunt " + name.ro + ".", en: "Good evening. I am " + name.en + "." }` (name only, Cristea's decision, hour 37; the persona description goes into `persona.traits` for Talk).
  - `bedPrompt(nameEn)`: `"Quiet evening city ambience at " + nameEn + ", Timișoara, calm steady ambient loop, no speech, no music"`.
  - `placeSiteFile(id, place: PlaceIn): SiteFile`: `id`, `city` `NEW_PLACE_CITY`, `name`, `location { lat, lng }`, `radius_m`, `interactions`, `is_memorial: false`, `glow_k`, `persona { name, voice: NEW_PLACE_VOICE, traits: place.persona, first_message: greeting(name) }`, `facts`, `sound_bed: bedPrompt(name.en)`, `directions_hint {}`, `active { from: null, until: null }`. Parsed through `SiteFile` before it is returned.
- [ ] `places/router.ts` exports `createPlacesRouter(deps: { db?: Db; tx?: Tx; onStored?: OnEventsStored; fetch?: typeof fetch })`, mounted in `app.ts` after `createPulseRouter` with `{ db: deps.db, tx: deps.tx, onStored: deps.onEventsStored }`.
- [ ] `POST /sites`, in this order: `requireVisitor`; `writeSiteOnly` (403 `forbidden` unless `req.visitor.permissions` holds `write:site`); `placeLimiter` (`PLACE_LIMIT` per `PLACE_WINDOW_MS` per `sub`, memory store, 429 `rate_limited` with `Retry-After`, marked with a `shortcut:` comment as in `sites/router.ts`); `PlaceIn.safeParse` (400 `invalid_place`); `placeId(name.en)` must match `PLACE_ID` (400 `invalid_id`); no `deps.db` → 503.
- [ ] Store with one statement, `UPSERT_DRAFT`: insert the row from `toSiteRow(placeSiteFile(id, place))` with `status 'draft'`, `ON CONFLICT (id) DO UPDATE SET <every column> ... WHERE sites.status = 'draft' RETURNING id`. No row returned → 409 `site_exists`. A `slug` clash (unique violation `23505` on `sites_slug_key`) is also 409 `site_exists`. Answer 201 `PlaceDraft.parse({ id, status: "draft" })`. A database error answers 503 and logs one line without the body.
- [ ] `content.test.ts` cases by name: "the id strips diacritics", "the id joins words with one dash", "a name of only symbols gives an empty id", "the id is at most 40 characters and does not end in a dash", "the greeting is the name only, in Romanian and English", "placeSiteFile is never a memorial", "placeSiteFile uses MX's voice".
- [ ] `router.test.ts`, in the style of `apps/api/src/echoes/router.test.ts` (express on port 0, `fetch`, a fake `Db`, RS256 Auth0 tokens as `auth/session.test.ts` signs them). Cases by name: "no token is 401", "an anonymous token is 403", "an Auth0 token without write:site is 403", "a valid place answers 201 draft", "the stored row is a draft with the derived id", "the same draft again is 201", "a published id is 409 site_exists", "one fact is 400 invalid_place", "a source that is not https is 400", "a name of only symbols is 400 invalid_id", "the eleventh place in an hour is 429", "no database is 503".
- [ ] Check that the rule bites: let `writeSiteOnly` pass anyone, see the two 403 cases fail, restore it. Say so in the report.
- [ ] Commit: `feat(api) added POST /sites for drafts behind write:site`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the nineteen cases pass and the earlier API tests still pass.

#### B4-1.b Publishing a draft generates its greeting and bed once, stores them in `blobs`, and makes the site live

**B4-1.b.1** Publish steps. Subagent: `cristea-api`. Files: `apps/api/src/places/router.ts`, `apps/api/src/places/router.test.ts`, `apps/api/src/places/publish.ts`, `apps/api/src/places/publish.test.ts`, `apps/api/src/echoes/router.ts`, `apps/api/src/echoes/router.test.ts`.

- [ ] `places/publish.ts`:
  - `siteBlobKey(file) = "site-" + file.replaceAll("/", "_")`.
  - `runStep(deps: { db: Db; fetch: typeof fetch; apiKey: string }, site: SiteFile, step: "greeting" | "bed"): Promise<PublishResult>`. Calls Patrick's `publishSite` unchanged, with the site narrowed to the step: for `greeting`, `sound_bed: ""` (the beds plan as skipped); for `bed`, `persona` without `voice` (the greeting plans as skipped). File names do not change, because the hash covers the request, not the site.
  - Before the call, load the site's existing keys once: `SELECT key FROM blobs WHERE starts_with(key, $1)` with `"site-" + site.id + "_"`, into a `Set`. `exists(file)` reads the set. `put(file, bytes)` pushes the promise of `INSERT INTO blobs (key, content_type, data) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING` (content type `audio/mpeg` for `.mp3`, `audio/wav` for `.wav`) into a list. After `publishSite` returns, await every insert, even when the outcome is `failed`, so a retry never pays for a file it already made. An insert that fails makes the step `failed`.
  - `run: true`, `maxCredits: PLACE_MAX_CREDITS`.
- [ ] `POST /sites/:id/publish`, in this order: `requireVisitor`; `writeSiteOnly`; `PublishIn.safeParse` (400 `invalid_step`); `:id` must match `PLACE_ID` (else 404 `unknown_site`); no `deps.db` → 503; read the row (`SELECT ... FROM sites WHERE id = $1`): none → 404 `unknown_site`; `status = 'published'` → 409 `already_published`.
  - `greeting` and `bed`: no `ELEVENLABS_API_KEY` → 503. Rebuild the site with `placeSiteFile` from the row (name, location, facts, `persona.traits`, interactions). `runStep`; `done` → 200 `PublishOut { step, credits: newCredits }`; `over_cap` → 409 `over_cap`; `failed` → 502 `generation_failed` and one log line with the file name and status only.
  - `live`: `UPDATE sites SET status = 'published' WHERE id = $1 AND status = 'draft'`, then `deps.onStored?.()` (the glow nudge, so the window appears in about 1 s), then 200 `PublishOut { step: "live", credits: 0 }`.
- [ ] `echoes/router.ts`, `GET /blob/:key`: a blob with no echo row whose key starts with `site-` is sent with `Cache-Control: public, max-age=3600`; any other blob with no echo row stays 404 `unknown_blob`. Replace the hour-25 `shortcut:` comment with one line saying site audio is public.
- [ ] `publish.test.ts` with a fake `fetch` (200 with a few bytes) and a fake `Db`. Cases by name: "the greeting step makes one clip per language and no bed", "the bed step makes two takes and no greeting", "files already in blobs are not fetched again", "a failed fetch keeps the files made before it", "the keys start with site- and hold no slash", "over 2000 credits fetches nothing", "the key never appears in a log line".
- [ ] `router.test.ts` new cases: "publish without write:site is 403", "an unknown step is 400", "an unknown site is 404", "a published site is 409", "greeting answers 200 with its credits", "a second greeting answers 200 with 0 credits", "a failed generation is 502", "no key is 503", "live publishes the draft and nudges glow". `echoes/router.test.ts` new cases: "a site blob is public", "a blob with no echo and no site prefix is 404".
- [ ] Check that the rule bites: make `exists` always false, see "a second greeting answers 200 with 0 credits" fail, restore it.
- [ ] Commit: `feat(api) published drafts step by step through publishSite into blobs`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the eighteen cases pass and the earlier API tests still pass.

#### B4-1.e A rehearsal's place can be put back to draft, so the next run publishes it again at no credit

**B4-1.e.1** `place:reset`. Subagent: `cristea-api`. Files: `apps/api/src/places/reset.ts`, `apps/api/src/places/reset.test.ts`, the `scripts` block of `apps/api/package.json`.

- [ ] `reset.ts` exports `resetPlace(db: Db, id: string): Promise<"reset" | "seeded" | "invalid" | "none">`: an id failing `PLACE_ID` gives `invalid`; one of the bundled `sites` from `@lampa/shared` gives `seeded` and is never touched; otherwise `UPDATE sites SET status = 'draft' WHERE id = $1 AND status = 'published'` gives `reset` when a row changed and `none` otherwise. Rows in `windows`, `panes`, `echoes` and `interaction_events` stay (Cristea's decision, hour 37: no delete; the foreign keys forbid it once a pane exists).
- [ ] The script part (run when the file is the entry point, opening the pool with `createPool()` as `db/seed-sites.ts` does) takes the id from `process.argv[2]`, prints one line (`reset <id>`, `refused: <id> is a seeded site`, `refused: invalid id`, `no published place <id>`) and exits 0 only for `reset`.
- [ ] `apps/api/package.json` gains `"place:reset": "tsx --env-file-if-exists=../../.env src/places/reset.ts"`.
- [ ] `reset.test.ts` with a fake `Db`, cases by name: "a published place goes back to draft", "a seeded id is refused and no query runs", "an invalid id is refused", "an unknown id reports none".
- [ ] Commit: `feat(api) added place:reset to put a rehearsal's place back to draft`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the four cases pass. After a reset, the next `POST /sites` with the same English name overwrites the draft and the greeting and bed steps answer `credits: 0`.

#### B4-1.c An admin fills the form at the place, publishes it, and gets the QR code for its page

**B4-1.c.1** Add a place tab. Subagent: `cristea-console`. Files: `apps/web/src/curate/*` (new: `AddPlace.tsx`, `AddPlace.module.css`, `placeForm.ts`, `placeForm.test.ts`, `PublishSteps.tsx`, `PlaceQR.tsx`, `demoPlace.ts`; changed: `CuratePage.tsx`, `CuratePage.module.css`), `apps/web/src/auth/authApi.ts`, `apps/web/src/auth/authApi.test.ts`.

- [ ] First: `git checkout cristea/b4-console && npm ci`.
- [ ] `authApi.ts`: `ApiError` (Ionut's, in `api/client.ts`) holds only the status, and the console must tell three 409s apart. On a response that is not ok, `send` reads the JSON body's `error` string when there is one and throws `AuthApiError extends ApiError` with `code?: string`; existing callers keep working because it is still an `ApiError`. POST calls pass `init` `{ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(...) }`. Tests in `authApi.test.ts`: "an error body's code is on the thrown error", "an error without a JSON body still throws ApiError with the status".
- [ ] Tabs in `CuratePage.tsx`: a `role="tablist"` with two `role="tab"` buttons, "Echo queue (n)" (n = pending count, no count while loading) and "Add a place", `aria-selected`, Left and Right arrows move between them, the selected panel `role="tabpanel"`. The echo queue keeps its current behaviour. The access gate stays as it is (signed out, no `moderate:echo`, session ended).
- [ ] `AddPlace.tsx`, `DESIGN.md` 7.15 "Add a place", one column, max 640 px, works at 390 px wide. Fields in order, as `.field` blocks from `design/css/components.css` 6.16: "Name in Romanian", "Name in English" (required); "Use my location" (Button secondary L) filling read-only latitude and longitude and "accuracy 12 m" (`--type-meta`, the real value); "Facts": two rows at start, each a text area and a "Source URL" input, "Add a fact" (Button quiet) up to 5 rows; "Persona description" (text area, helper "How the place speaks: slow, proud, a little deaf."); "Interactions": checkboxes Talk, Catch a colour, Leave an echo, Raise a lamp (values `talk`, `colours`, `echo`, `lamp`), all four ticked at start; then "Publish place" (Button primary L). Under the English name, in `--type-meta`, "Page: /s/{placeId(name.en)}" so the admin sees the id.
- [ ] Location: `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, `timeout: 15_000`, `maximumAge: 0`. Denied, unavailable or timed out → "Location is off. Allow it in your browser settings, or type the coordinates." and the latitude and longitude become editable inputs. Accuracy over `WEAK_ACCURACY_M = 30` → helper in `--text-2` "Accuracy is {n} m. Move into the open and try again for a better fix." (does not block).
- [ ] `placeForm.ts`: `toPlaceIn(form)` builds a `PlaceIn` and `validate(form)` returns one message per invalid field from `PlaceIn.safeParse` plus `placeId`: "Enter a name of 2 to 60 characters.", "Add the place's location.", "Add at least two facts.", "Write 10 to 280 characters.", "Use a link that starts with https://.", "Write 10 to 400 characters.", "Tick at least one interaction.", "This name gives no page address. Use letters or numbers." On submit, errors show under each field (6.16 error state, `aria-invalid`, `aria-describedby`) and focus moves to the first invalid field.
- [ ] Publishing (`PublishSteps.tsx`): the form locks (fieldset `disabled`) and a step list shows "Saving place", "Generating greeting", "Generating sound bed", "Publishing", each with its state: pending `--text-3`, in progress spinner `--text`, done check `--ok`, failed alert `--danger`. The calls, in order, with `authApi` and the Auth0 token: `POST /sites` (`PlaceDraft`), then `POST /sites/:id/publish` with `{ step: "greeting" }`, `{ step: "bed" }`, `{ step: "live" }` (`PublishOut`). A 409 `already_published` on `live` counts as done.
- [ ] A failed step shows its error text under it and "Try again" (Button secondary M), which resends that step only: 403 → "This account cannot publish places."; 409 `site_exists` → "A place with this page address already exists. Change the English name."; 409 `over_cap` → "This would use more than 2,000 credits. Nothing was generated."; 502 → "The voice service did not answer. Try again; files already made are kept."; 503 → "The server is not ready. Try again in a minute."; 429 → "Too many places this hour. Try again later."; other errors and network failures → "That did not save. Try again." A 401 or session end shows the 7.15 "Your session ended. Sign in again." Notice. On 403 or `site_exists` the form unlocks so the admin can change it.
- [ ] Success: `PlaceQR.tsx` renders the `DESIGN.md` 6.17 console QRBlock: `QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#0E121A", light: "#FFF4E0" } })` at 200 px, `url = window.location.origin + "/s/" + id`, the URL under it in `--type-meta`, "Copy link" (Button secondary M, `navigator.clipboard.writeText`, then "Link copied" for 2 s); loading is an empty `--lamp-white` square; on error, no code and the URL as text. Under it "Open {English name}" (Button secondary M, opens the URL) and "Add another place" (Button quiet, clears the form).
- [ ] `demoPlace.ts`: `export const DEMO_PLACE: { name: { ro: string; en: string }; lat: number; lng: number } | null = null;` with a comment that the team picks the place (Blocked). With `?demo=1` on `/curate` and `DEMO_PLACE` set, the form starts with that name and location; facts and persona stay empty for the presenter to type (Cristea's decision, hour 37). With `DEMO_PLACE` null, `?demo=1` changes nothing.
- [ ] Styling (`DESIGN.md` section 9 item 15, optional, cut third): Field styling from 6.16, the step list, the QRBlock. Tokens only.
- [ ] `placeForm.test.ts` cases by name: "a complete form gives a valid PlaceIn", "one fact is invalid", "an http source is invalid", "a name of symbols gives the page-address message", "the first invalid field is named first", "empty fact rows past the second are dropped before validation", "all four interactions are ticked at start", "the QR url is origin plus /s/ plus the id", "a 409 already_published on live counts as done", "each error status maps to its message".
- [ ] Commit: `feat(curate) added the Add a place tab with publish steps and the QR code`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the twelve cases pass, the earlier web tests still pass, and `/curate` at 390 px and 1440 px (signed out is enough here) shows no horizontal scroll and no console error.

#### B4-1.d A newly published place fades in on `/screen` without a reload

**B4-1.d.1** New sites on `/screen`. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/ScreenPage.tsx`, `useScreenSocket.ts`, `canvas.ts`, `newSites.ts`, `newSites.test.ts`, `tickerCopy.ts`, `ticker.test.ts`.

- [ ] `newSites.ts`: `unknownIds(glow, known)` returns the `siteId`s of a glow message that are not in `known` (`gallery` excluded). `toSite(detail: SiteDetail): Site`. No contract change: the `glow` message already lists every published site.
- [ ] In `useScreenSocket` (not in demo mode): on each `glow`, for each unknown id not already being fetched, `fetch(API_URL + "/sites/" + id)` once, parsed with `SiteDetail`. A failed fetch is forgotten, so the next glow tries again. Unknown ids already present in the first glow message after a connect are added with no ticker line; an id first seen in a later glow message is a new place and adds the ticker line "New place: {Site}" (`DESIGN.md` 7.13; a reload is not a publish; Cristea's decision, hour 37).
- [ ] The site list becomes state in `ScreenPage.tsx` (bundled `sites` plus the fetched ones); `COLOUR_SITE_IDS`, `SITE_NAMES` and the layout are derived from it. A colour site is one whose `SiteDetail.interactions` holds `colours`; the new site is never a memorial.
- [ ] Refit (Cristea's decision, hour 37): when the list changes, `layout(all sites, MAP_LINES)` is computed again; every existing circle, label and map line moves to its new place over `REFIT_MS = 1200` with `--ease-out` (Cristea's decision, hour 37); the new site's window fades in from opacity 0 over 1200 ms (`DESIGN.md` 5.5). Reduced motion (5.6): positions jump, the fade is 150 ms.
- [ ] Tests: `newSites.test.ts` "a known id is not unknown", "gallery is never unknown", "an unknown id is listed once", "toSite keeps name, lat, lng and is_memorial"; `ticker.test.ts` "new place line reads New place: {Site}". A refit test in `newSites.test.ts`: "six sites still land inside the map area and no two closer than 2.95R" with a sixth site 400 m east of Piața Victoriei, and "a sixth site on MX's coordinates stays finite, inside the map and 2.95R apart" ("Use my location" at the venue gives MX's position; no place is refused for being close, Cristea's decision, hour 37).
- [ ] Commit: `feat(screen) faded in newly published places from the glow list`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the seven cases pass, the earlier web tests still pass, and headless Chromium at 1920×1080 against a throwaway Socket.IO server that sends a glow with the five ids, then one with a sixth id (and a stub `GET /sites/<id>`), shows the sixth window fading in, the five circles moving once, and one "New place:" ticker line; console free of errors besides the favicon.

### B4-2 Carried from Build 3 (slack)

#### B4-2.a A curator who cancels sign-in on `/curate` stays on `/curate`

**B4-2.a.1** Clear the return key. Subagent: `cristea-console`. Files: `apps/web/src/curate/CuratePage.tsx`, `apps/web/src/curate/queue.ts`, `apps/web/src/curate/queue.test.ts`.

- [ ] `queue.ts` exports `clearVisitorReturn()`, which calls `writeSession(SIGN_IN_RETURN_KEY, null)` (both exported from `apps/web/src/auth/claimFlow.ts`); `signIn()` in `CuratePage.tsx` calls it before `loginWithRedirect`.
- [ ] Test "curate sign-in clears the visitor return key" (with a stubbed `sessionStorage`).
- [ ] Commit: `fix(curate) cleared the visitor return key before a curator signs in`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the case passes.

#### B4-2.b The echo queue names every site, including places added in the console

**B4-2.b.1** `GET /echoes` fills `siteName`. Subagent: `cristea-api`. Files: `apps/api/src/echoes/router.ts`, `apps/api/src/echoes/router.test.ts`.

- [ ] `SELECT_PENDING` joins `sites` and returns `s.name->>'en' AS site_name`; each `PendingEcho` gets `siteName` when it is not null.
- [ ] Test "pending echoes carry the site's English name".
- [ ] Commit: `feat(api) named the site on each pending echo`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the case passes.

**B4-2.b.2** The queue shows `siteName`. Subagent: `cristea-console`. Files: `apps/web/src/curate/queue.ts`, `apps/web/src/curate/queue.test.ts`.

- [ ] `siteName(echo)` returns `echo.siteName` when set, else the bundled name, else the id.
- [ ] Tests "siteName prefers the API's name", "siteName falls back to the bundled name".
- [ ] Commit: `feat(curate) showed the API's site name in the queue`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: both cases pass.

#### B4-2.c An echo subtitle never covers another site's window

**B4-2.c.1** Subtitle flip. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/Subtitle.tsx`, `Subtitle.module.css`, `subtitlePlace.ts`, `subtitlePlace.test.ts`, `ScreenPage.tsx`.

- [ ] `subtitlePlace(point, box, others)`: `below` by default; `above` when the box below the site's circle overlaps another site's circle (radius `SITE_RADIUS`) and the box above does not; `below` when both overlap (Cristea's decision, hour 37). Uses the laid-out points, so it follows the refit.
- [ ] Tests "Piața Unirii's subtitle goes above", "a site with free space below keeps it below", "both sides covered stays below".
- [ ] Commit: `fix(screen) placed the echo subtitle above when below covers another site`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the three cases pass.

### B4-last Integrate and hand over (last, this session)

- [ ] All three branches merged into a local throwaway branch from `main`: `npm ci && npm run typecheck && npm run build && npm test` green.
- [ ] Push each branch and open its PR, in this order: `cristea/b4-places`, `cristea/b4-screen`, `cristea/b4-console`. Each PR lists what was verified and what waits for Cristea. Cristea merges with a merge commit.
- [ ] After `cristea/b4-places` deploys, against `https://lampa-api-b45i.onrender.com` (no credits): `POST /sites` with an anonymous token → 403; `POST /sites/x/publish` with an anonymous token → 403; `GET /blob/site-unknown` → 404. Paste each status.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists `POST /sites`, `POST /sites/:id/publish` with its answers, `PlaceIn` and the other place schemas, `placeId`, public site audio at `GET /blob/site-<id>_<file>`, `siteName` on `PendingEcho`, and `/screen` picking up new places from the glow list.
- [ ] Blocked rows written for the requests to other lanes (section 1): Ionut (`findSite` falls back to `GET /sites/:id`, so the QR page opens on a phone), Fabi (`/live` admits `site:<id>` for published sites in the table; whether `demo:reset` removes added places), Patrick (play a new site's greeting and bed from `GET /blob/site-...`; a clips list for a site in the table).
- [ ] Cristea's checks, listed and not claimed:
  - Laptop, deployed `/curate` as an admin: fill the form for a real place (one live publish, about 1,400 credits), see the four steps go to done, scan the QR code with the iPhone, and see the new window fade in on the deployed `/screen` with "New place: {Site}". Time it from opening the tab: under 5 minutes counts for plan section 10.
  - iPhone, deployed `/curate` as an admin at 390 px: fill the form with "Use my location" (allow and deny once each), see the validation and the accuracy line, no horizontal scroll. Stop before "Publish place" unless this is the live run.
  - The same place published again: "Saving place" answers `site_exists`. Then `npm run place:reset -w @lampa/api -- <id>`, reload `/screen`, publish again: greeting and bed answer 0 credits and the window fades in again.
  - Laptop: a curator without the admin role gets "This account cannot publish places." at "Saving place".
  - Laptop, `/screen` with an echo at Piața Unirii: the subtitle sits above the circle.
  - Carried from Build 3: the phone candle appears in the Cathedral's circle with one ticker line and no number; Keep my colours on the iPhone (once Ionut places it); the Checkpoint 3 runs (demo 0:00 to 1:40, the Pulse step and the memorial step, twice from a cold start with `simulate-crowd`); the post-call webhook stores a row after one live Talk session.
- Done when: every box is ticked or listed as Cristea's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected:
  - The demo place's names and location for `DEMO_PLACE` (the team decides at the checkpoint).
  - Which published place is the fallback (the last rehearsal's).
  - Ionut's `findSite` fallback, Fabi's `/live` rooms and `demo:reset`, Patrick's playback of site clips.
- **Not finished at hour 40:** each ID, what is left, and its place in the in-block cut order (section 0).
- **Phone and screen checks for Cristea:** what you could not run here.
- **For the freeze:** what the other lanes should know: a published place appears in every `glow` message and on `/screen`; until Ionut's fallback lands, its QR page does not open a site view on a phone.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 4

- An admin can save a place as a draft and publish it in four steps from `/curate`; a curator without `write:site` gets 403 and "This account cannot publish places."
- Publishing makes the greeting (ro, en) and two bed takes once through `publishSite`, stores them in `blobs` as public `site-` keys, never spends more than 2,000 credits a call, and never pays twice for a file.
- The published place appears in the glow list and fades in on `/screen` within about a second, with "New place: {Site}"; the five sites refit over 1200 ms.
- The console shows the QR code for `origin + /s/<id>` with Copy link and Open.
- `npm run place:reset -w @lampa/api -- <id>` puts a rehearsal's place back to draft, and the rerun costs 0 credits.
- `/curate` clears the visitor return key before sign-in; the queue names sites from the API; the Piața Unirii subtitle no longer covers other windows (unless cut).
- `npm test` is green and holds the place, publish, console and `/screen` tests.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `cristea/GLOSSARY.md` matches the state of the branch.

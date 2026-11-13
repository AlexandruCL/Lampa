# Prompt: Cristea's Build 3, Echo, navigation, Lamp, Pulse, sign-in (Identity, infra, Living Map, LAMPA)

**Status: prompt completed and checked against `IMPLEMENTATION_PLAN.md` at hour 25 (2026-11-13 21:01 +0200). Re-checked against `main` `6aeee0b` in B3-0: Fabi's `POST /panes` (writes `anon_id`), `GET /screen/state` and `Tx`/`asTx` have landed, so the seam is additive and the echoes and claim routers use `Tx` (Decisions, hour 25). Baseline at `6aeee0b`: API `Tests 170 passed (170)`, web `Tests 177 passed (177)`.**

You are implementing Cristea's part of Build 3 (hours 25 to 32) in this repository. Follow the checklist in section 3 in order, except where it says agent tasks run in parallel. Tick a box only after its verify command has run and passed.

Goal from the plan: the plan gives Build 3 no goal line. Its title is *Echo, navigation, Lamp, Pulse, sign-in*.

Checkpoint this block must pass (Checkpoint 3, word for word):

*Run the demo script from section 10.4, steps 0:00 to 1:40 plus the Pulse step and the memorial step from the v5 addendum, twice from a cold start, with the crowd simulator running. Write down every break. Fix it, or cut the feature and adjust the script. Then decide which Build 4 rows to attempt, using the cut order in section 7.*

The demo steps this lane carries (concept PDF v6, section 10.4 and the v5 addendum): *1:20 They whisper why; a teammate approves the echo with MFA; it ripples across the Living Map.* and *1:55 New. In demo mode the judge opens the Cathedral, hears a narration and holds still for 5 seconds (60 in real use). The candle lights and appears quietly on the Living Map. About 15 seconds.*

## 0. Ground rules

- **Cristea takes every decision. You may not guess.** If this prompt, the plan, `DESIGN.md`, the contract, a recorded answer or the existing code does not settle a choice, stop that item and ask Cristea, with your recommendation. Nothing uses the recommendation until Cristea answers. Look up facts yourself. Carry on with items that do not depend on the answer.
- **This prompt follows `IMPLEMENTATION_PLAN.md` and `DESIGN.md`.** If you find a difference between them and this prompt, stop that item and ask. The differences Cristea already decided are in `cristea/GLOSSARY.md`, Decisions and Changes, hour 25.
- **Read only the documents in section 2.** If you need something outside the list, say which file and why before opening it.
- **The block ends at hour 32.** Each task carries its plan hours. When a task has used its hours and is not done, stop and tell Cristea: carrying on, cutting (plan section 7) or moving it is their decision. Cristea's cut order for this block (hour 25): first the echo ripples and subtitle on `/screen` (B3-7), then the fake demo candles (the demo part of B3-6.b), then Keep my colours and `POST /me/claim` (B3-5, plan cut item 8). Never cut: `POST /echoes`, approve and reject with the 403 test, the curator console, the Post-login Action with MFA, and the memorial on `/screen`.
- **Contract first.** `packages/shared` holds the event kinds, socket messages and Zod schemas. Do not change them without Cristea, who takes it to the team. When another lane's endpoint has not landed, code against its schema.
- The server sets event weights. The client never sends one. `echo_approved` is stored by the approve endpoint only, with `WEIGHTS.echo_approved` from `apps/api/src/events/weights.ts`.
- No library beyond plan section 3 without Cristea's approval. Approved: `@auth0/auth0-react` 2.30.0, exact, MIT, released 2026-10-30 (B3-4.a, hour 25). Not added: `multer`. `POST /echoes` parses multipart with `express.raw` and the built-in `Response.formData()` (B3-1.a, hour 25). No ElevenLabs SDK in `apps/api`: Scribe is one `fetch`.
- No secrets in git or in the web bundle. `.env` stays out of git, and API keys stay on the server. `ELEVENLABS_API_KEY` never appears in a response, a log line or a test fixture. Echo audio and transcripts never appear in a log line.
- `main` deploys by itself. Work on branches: `cristea/b3-echoes` (the seam commit, B3-1, B3-2, B3-5.a), `cristea/b3-console` (B3-4, B3-5.b), `cristea/b3-screen` (B3-6, B3-7). One small PR per branch. Open it only after the verify commands pass, and as soon as they pass, without waiting for the end of the block. Cristea merges with a merge commit. A broken `main` is fixed or reverted within 15 minutes.
- Commit messages follow the repo's style: `type(scope) what changed`.
- Live ElevenLabs calls cost credits. Develop against the recorded clips. Live Talk runs only at checkpoints and rehearsals. No test and no verify command in this prompt calls `api.elevenlabs.io`. One live Scribe call (about 110 credits for 20 s) runs at Checkpoint 3 only.
- The Cathedral is a memorial: no persona, no game, no counter, no microphone prompt, and no generated text about 1989 at runtime. It takes no echo (`POST /echoes` answers 404 `no_echo`), gets no window, no ripple and no number on `/screen`, and contributes no sound.
- Screens follow `DESIGN.md` and the tokens and base components in `design/css/`. Do not add a colour, font or spacing value that is not a token. `design/css/` stays untouched.
- Write in `cristea/` only. Other members' folders are read-only. Files of other lanes that this block edits are listed in the seam and in each agent task, and each gets a Changes line.
- **Keep `cristea/GLOSSARY.md` current.** Each finished ID gets a Done line, each deviation or file touched outside this lane a Changes line, each answer from Cristea a Decisions line, each new thing another lane can use a Hand-offs line. The line goes in the same commit as the work.
- Before you claim anything done, run its verify command and paste the summary line. No claim without output.
- For a failing test, find the cause first, then fix. Do not patch around a symptom.
- In Git Bash, prefix CLI calls that carry a leading-slash argument with `MSYS_NO_PATHCONV=1` (glossary, Changes, S-1.c.1).

## 1. Current state (checked at hour 25, 2026-11-13 21:01 +0200)

- Build 2 is closed for this lane: every B2 ID is under Done, nothing was cut. `main` is at `1063e29` (Fabi's Checkpoint 1 docs). No open PRs from this lane.
- Still open from Builds 1 and 2, under Blocked in the glossary: the live pane checks with Fabi (`POST /panes` and `GET /screen/state` not on `main`), live Talk with Patrick, team agreement on the Build 2 schemas, `getPersona` and `getSiteStats` not passed to `createAgentRouter`, and the HDMI laptop checks.
- Web: `https://lampa-timisoara.vercel.app/screen` → 200. API: `https://lampa-api-b45i.onrender.com/health` → 200 `{"ok":true}`.
- API on `main`:
  - `apps/api/src/app.ts`: `createApp(deps: AppDeps = {})` with `express.json()` mounted globally after `sessionRouter`, then the agent, events and sites routers.
  - `apps/api/src/index.ts`: builds the http server, `attachLive`, and the glow loop with `onEventsStored: () => loop?.nudge()`.
  - `apps/api/src/seam.ts` (Fabi's): `Db`, `LatestGlow`, `Live = { emitGlow, close }`, `AppDeps = { db?, onEventsStored?, latestGlow? }`.
  - `apps/api/src/live/socket.ts` (Fabi's): `attachLive` returns `Live`. It has no way to send any message other than `glow`. The rooms are `city`, `screen` and `site:<id>`.
  - `apps/api/src/events/router.ts` (Fabi's): `INSERT_EVENTS` (params: session id, user sub, ts[], site_id[], kind[], weight[]), `userSub(visitor)`. `weights.ts`: `WEIGHTS.echo_approved = 5`.
  - `apps/api/src/auth/session.ts`: `requireVisitor` sets `req.visitor = { sub, kind: "anon" | "auth0", permissions }`; the HS256 check lives in a private `verify`; `visitorLimiter` 120 a minute per `sub`.
  - `apps/api/src/sites/router.ts`: `sitesLimiter = rateLimit({ windowMs: 60_000, limit: 120 })` per IP.
- Database (migration 001, applied to Tiger): `echoes (id uuid, site_id, author_sub, anon_id, audio_url NOT NULL, public_audio_url, transcript, lang, status pending|approved|rejected, voice_mode own|city, created_at)`; `blobs (key text PK, content_type, data bytea, created_at)`; `panes` has `author_sub` and `anon_id`; `interaction_events` has `session_id` and `user_sub`. No consent column, and none is added (Cristea's decision, hour 25).
- Contract (`packages/shared/src/contract.ts`): `EventKind` holds `candle` and `echo_approved`; `SocketMessage` holds `echo_approved` and `candle`, with no payload schema for either. `ScreenState` has no candles. No schema for echoes or the claim. The B3-0 seam adds them.
- Web on `main`:
  - `apps/web/src/main.tsx` renders `<App />` with no provider.
  - `apps/web/src/routes/Curate.tsx` is a placeholder (`<>Curate</>`).
  - `apps/web/src/api/client.ts` (Ionut's): `api()`, `API_URL`, `ApiError`, all through `authFetch` with the anonymous token.
  - `apps/web/src/session.ts`: `getToken()`.
  - Components: `Button`, `Icon`, `Notice`, `Ring`, `RoundControl` in `apps/web/src/components/`.
  - No Auth0 package in `apps/web/package.json`. `design/css/console.css` holds the console styles and `components.css` the `.audio-player` block.
- `/screen` on `main`, in `apps/web/src/screen/`:
  - `useScreenSocket(siteIds, demo)` returns `{ glowRef, windowsRef, effectsRef, connected, coloursToday, events }`, with `ScreenEffect` (`pane`, `complete`) and `ScreenEvent` (`pane`, `complete`).
  - `canvas.ts` draws the Cathedral as a 1px `--line` circle with its name in `--text-2`.
  - `tickerCopy.ts`: `tickerText`, `timeAgo`. `demoFeed.ts`: `DEMO_PANE_MS`, `nextDemoMessage`. `Ticker.tsx`, `QRBlock.tsx`.
- Auth0 tenant `lampa.eu.auth0.com`, as recorded in the glossary (B1-2.a.1): API `https://lampa-api-b45i.onrender.com` with RBAC and permissions in the token; `moderate:echo`, `write:site`; roles `curator`, `admin`; SPA `LAMPA`; passwordless email code and passkey; callback, logout and origin URLs `https://lampa-timisoara.vercel.app` and `http://localhost:5173`. Nothing in the glossary records an Action, an MFA factor, offline access, refresh-token rotation or branding; this session has no dashboard access, so Cristea confirms the tenant's state in B3-3.a.1.
- Auth0 docs read at hour 25: the customize-mfa page skips MFA on `event.transaction.protocol === "oauth2-refresh-token"`; the refresh-token rotation page requires offline access for the SDK's refresh tokens. The pricing page and the SPA SDK page could not be fetched. In `@auth0/auth0-react` 2.30.0 (`src/auth0-context.tsx`, read from the npm package), `useAuth0()` outside a provider returns the initial state (`isAuthenticated` false, `isLoading` true) and every method throws "You forgot to wrap your component in <Auth0Provider>."
- Needs from others for this block, none landed:
  - Fabi's candle broadcast (`candle` on `/live`, Fabi's Build 3 row) and `GET /screen/state`, which would carry `candles`.
  - Fabi's `POST /panes` writing `anon_id`, which the claim needs to move panes.
  - Ionut's echo recorder, which needs `POST /echoes` by plan hour 28.
  - Ionut placing `KeepMyColours`.
  - Patrick's echo whispers, which read `echo_approved` and `GET /blob/:key`.

  Until each lands, code against the B3-0 schemas.
- ElevenLabs Scribe (Patrick's findings, `patrick/setup/elevenlabs_findings.md` rows 57, 71 and item 18): `POST https://api.elevenlabs.io/v1/speech-to-text`, multipart with `model_id` and `file`, header `xi-api-key`; model `scribe_v3`; 330 credits a minute.
- A built-in multipart parse was run on this machine at hour 25 (Node 26.7.0, Express 5.3.0). The route used `express.raw({ type: "multipart/form-data", limit: "2mb" })` and then `new Response(req.body, { headers: { "content-type": req.get("content-type") } }).formData()`, and it read `siteId` and a 1234-byte `audio/webm` file.
- Scripts: root `typecheck`, `build`, `test`; `apps/web` and `apps/api` each have `test` (`vitest run --passWithNoTests`). The last full run, at `632187b`, gave API `Tests 89 passed (89)` and web `Tests 169 passed (169)`; B3-0 records the baseline at `main`.
- Devices for Cristea's checks: an iPhone and a laptop with HDMI. No Android phone.

## 2. Documents to read (and only these)

| Doc | Which part | Needed for |
|---|---|---|
| `IMPLEMENTATION_PLAN.md` | Section 6, Build 3, Cristea's rows and Checkpoint 3 | All |
| `IMPLEMENTATION_PLAN.md` | Section 11, Cristea's table and "Needs from others" | All |
| `cristea/GLOSSARY.md` | Whole file | All |
| `IMPLEMENTATION_PLAN.md` | Section 7 (cut order, the memorial site), section 8 (Cristea's tests), section 9 (Auth0, credits and Render rows) | All |
| `DESIGN.md` | Section 9, items 10, 11 and 16 | B3-4, B3-6, B3-7 |
| `DESIGN.md` | Sections 2.3, 5.5, 5.6, 6.18, 7.13 | B3-6, B3-7 |
| `DESIGN.md` | Sections 6.1, 6.2, 6.15, 7.0 (copy voice), 7.10, 7.15 | B3-4, B3-5 |
| `design/css/console.css`, `design/css/components.css` block 6.15 (`.audio-player`) | Whole file, that block | B3-4 |
| `design/css/livingmap.css` | `__candle`, `__subtitle`, `__subtitle-lang` | B3-6, B3-7 |
| `packages/shared/src/contract.ts`, `index.ts`, `sites.ts` | Whole file | All |
| `patrick/setup/elevenlabs_findings.md` | Rows 57 and 71, item 18 | B3-1.b |
| `db/migrations/001_init.sql` | The `echoes`, `blobs`, `panes` and `interaction_events` tables | B3-1, B3-2, B3-5.a |
| `fabi/GLOSSARY.md`, `ionut/GLOSSARY.md` | Hand-offs | B3-0, B3-1, B3-5, B3-6 |
| `apps/api/src/app.ts`, `index.ts`, `seam.ts`, `auth/session.ts`, `auth/session.test.ts`, `events/router.ts`, `events/router.test.ts`, `events/weights.ts`, `live/socket.ts`, `sites/router.ts`, `agent/session.ts` | Whole file | B3-0, B3-1, B3-2, B3-5.a |
| `apps/web/src/main.tsx`, `App.tsx`, `routes/Curate.tsx`, `routes/paths.ts`, `api/client.ts`, `session.ts`, `components/index.ts` and the components it exports | Whole file | B3-4, B3-5.b |
| `apps/web/src/screen/` | Every file | B3-6, B3-7 |
| `.env.example` | Whole file | B3-4.a |
| Concept PDF v6 (`LAMPA_Hackathon_Concept_Timisoara_v6.pdf`, gitignored, on this machine) | Section 10.4, the v5 addendum, the echo pipeline (p. 40), Auth0 sketches 1 and 2 | B3-3, B3-5, B3-last |

## 3. Checklist

### Plan coverage

| Plan line (section 6 and 11; section 8; `DESIGN.md` section 9; checkpoint) | Hours | Subtasks |
|---|---|---|
| `POST /echoes`: multipart upload, store in `blobs`, Scribe transcript, status `pending` | 2 | B3-1.a, B3-1.b |
| The same row's addition, made by Cristea at hour 25 in plan sections 6 and 11: Also `GET /blob/:key` (public once approved, `moderate:echo` before) and `GET /echoes?status=pending` for the curator queue (added by Cristea, hour 25) | in the 2 | B3-1.c |
| Approve and reject endpoints behind `moderate:echo`, broadcast on approval. Test: the endpoint returns 403 without the permission | 1 | B3-2.a |
| Section 8: Moderation endpoint returns 403 without `moderate:echo` | in the 1 | B3-2.a |
| Post-login Action: roles claim, MFA forced for curator and admin | 0.5 | B3-3.a |
| Curator console v1: queue with audio player, transcript, approve, reject | 2 | B3-4.a, B3-4.b |
| Keep my colours: `loginWithRedirect`, then `POST /me/claim` moves anonymous rows to the Auth0 subject | 0.5 | B3-5.a, B3-5.b |
| Memorial on `/screen`: candle points at the Cathedral that fade over the same hours as glow, a quiet ticker line, no number, no room sound | 0.5 | B3-6.a, B3-6.b |
| `DESIGN.md` section 9 item 10: Curator queue. Smallest version: 7.15 list, detail, AudioPlayer as a native `<audio controls>` styled with tokens, approve, reject without the inline confirm | slack | B3-4.b |
| `DESIGN.md` section 9 item 11: Living Map memorial: candle field and the calm ticker line. Smallest version: 7.13 candle field and the 6.18 memorial line | slack | B3-6.b |
| `DESIGN.md` section 9 item 16 (optional, moved into Build 3 by Cristea, hour 25): Echo ripples and subtitles on `/screen`. Smallest version: 5.5 rings plus the 7.13 subtitle | slack | B3-7.a |
| `DESIGN.md` 7.10: Auth0 Universal Login branding, logo and primary colour (Cristea's decision, hour 25) | in the 0.5 of the Action | B3-3.a |
| Checkpoint 3, demo step 1:20: a teammate approves the echo with MFA; it ripples across the Living Map | | B3-1, B3-2, B3-3, B3-4, B3-7, B3-last |
| Checkpoint 3, memorial step 1:55: the candle appears quietly on the Living Map | | B3-6, B3-last |

Total: 6.5 h of tasks in a 7 h block. Styling items 10 and 11 (0.5 h each) and item 16 (0.5 h) come from slack; item 16 is first to cut.

Order:

1. **B3-0, this session, first.** The docs commit to `main` goes in before the seam (Cristea's decision, hour 25). Then the seam commit opens `cristea/b3-echoes`. `cristea/b3-console` and `cristea/b3-screen` branch from the seam commit.
2. **Three agents run in parallel on disjoint files:**
   - `cristea-api` on `cristea/b3-echoes`: B3-1.a.1, B3-1.b.1, B3-1.c.1, B3-2.a.1, B3-5.a.1, one after another. `POST /echoes` comes first because Ionut needs it by plan hour 28.
   - `cristea-console` on `cristea/b3-console`: B3-4.a.1, B3-4.b.1, B3-5.b.1.
   - `cristea-canvas` on `cristea/b3-screen`: B3-6.a.1, B3-6.b.1, B3-7.a.1.
3. **B3-3.a.1 runs while the agents work.** Cristea works the Auth0 dashboard and this session writes the Action file.
4. **B3-last, this session, last.**

The seam. This session writes it in B3-0 and commits it as the first commit of `cristea/b3-echoes`: `feat(shared) added the echo, candle and claim schemas and the live emit seam`. The team agreed the contract part, and Fabi agreed the `emit` part, which edits his three files (Decisions, hour 25). The seam commit holds both, and each of Fabi's files gets a Changes line.

In `packages/shared/src/contract.ts`, insert `CandleMessage` directly above `ScreenState`, and add one field to `ScreenState`:

```ts
// candle on /live (Fabi's Build 3 row), and the candles in GET /screen/state
export const CandleMessage = z.object({ id: z.string(), siteId: z.string(), litAt: z.string() });
export type CandleMessage = z.infer<typeof CandleMessage>;
```

```ts
// inside ScreenState's z.object, after coloursToday:
  candles: z.array(CandleMessage).default([]),
```

Appended at the end of `packages/shared/src/contract.ts`:

```ts
// POST /echoes, multipart fields: siteId, consent ("true"), audio (audio/webm or audio/mp4, at most 2 MB). 201:
export const EchoAccepted = z.object({ id: z.string(), status: z.literal("pending") });
export type EchoAccepted = z.infer<typeof EchoAccepted>;

// GET /echoes?status=pending (needs moderate:echo), oldest first
export const PendingEcho = z.object({
  id: z.string(),
  siteId: z.string(),
  createdAt: z.string(),
  lang: z.string().nullable(),
  transcript: z.string().nullable(),
  audioUrl: z.string(), // "/blob/<key>", relative to the API
});
export type PendingEcho = z.infer<typeof PendingEcho>;
export const PendingEchoes = z.object({ echoes: z.array(PendingEcho) });
export type PendingEchoes = z.infer<typeof PendingEchoes>;

// echo_approved on /live, rooms "screen" and "site:<id>"
export const EchoApprovedMessage = z.object({
  echoId: z.string(),
  siteId: z.string(),
  audioUrl: z.string(),
  transcript: z.string().nullable(),
  lang: z.string().nullable(),
});
export type EchoApprovedMessage = z.infer<typeof EchoApprovedMessage>;

// POST /me/claim with an Auth0 token; anonToken is the visitor's anonymous token
export const ClaimIn = z.object({ anonToken: z.string().min(1) });
export type ClaimIn = z.infer<typeof ClaimIn>;
export const ClaimResult = z.object({
  panes: z.number().int().min(0),
  echoes: z.number().int().min(0),
  events: z.number().int().min(0),
});
export type ClaimResult = z.infer<typeof ClaimResult>;
```

The `emit` part (Fabi's files, after his agreement):

Additive: Fabi's `Tx`, `emitPane`, `emitWindowComplete`, `OnPane`, `tx` and `onPane` (landed after this prompt was first written) stay as they are.

```ts
// apps/api/src/seam.ts: SocketMessage joins the existing type import; Emit is new; emit joins Live and AppDeps
/** Sends payload as message to one room of /live. */
export type Emit = (room: string, message: SocketMessage, payload: unknown) => void;
// Live gains:    emit: Emit;
// AppDeps gains: emit?: Emit;
```

```ts
// apps/api/src/live/socket.ts, in the returned object
    emit: (room, message, payload) => void live.to(room).emit(message, payload),
```

```ts
// apps/api/src/index.ts: createApp gets emit as a closure, since live is made after the server
const server = createServer(createApp({ db, tx, onEventsStored: () => loop?.nudge(), onPane, latestGlow, emit: (...a) => live.emit(...a) }));
```

The router signatures `cristea-api` writes (B3-1, B3-2, B3-5.a) and `app.ts` mounts after the sites router:

```ts
// apps/api/src/echoes/router.ts
export type EchoesDeps = { db?: Db; tx?: Tx; onStored?: () => void; emit?: Emit; fetch?: typeof fetch };
export function createEchoesRouter(deps: EchoesDeps): Router; // POST /echoes, GET /echoes, GET /blob/:key, POST /echoes/:id/approve, POST /echoes/:id/reject
// apps/api/src/me/claim.ts
export function createClaimRouter(deps: { tx?: Tx }): Router; // POST /me/claim
// app.ts, after the last router:
//   app.use(createEchoesRouter({ db: deps.db, tx: deps.tx, onStored: deps.onEventsStored, emit: deps.emit }));
//   app.use(createClaimRouter({ tx: deps.tx }));
```

Transactions use Fabi's `Tx` from `apps/api/src/seam.ts` (`asTx(pool)` in `db/pool.ts`: one client, `BEGIN`, `COMMIT`, `ROLLBACK` and rethrow on a throw), not `BEGIN` through `Db`: `Db` is `pool.query`, so its queries can land on different connections (Cristea's decision, hour 25). Tests pass a fake `Tx` that runs the function on the fake `Db` and records a rollback when it throws.

### 3.1 Subagents

Cristea asks you to delegate: each agent task below goes to the project subagent named for it, started with the Agent tool. This session coordinates. It starts the agents, puts their questions to Cristea, re-runs the checks, writes the glossary and does the first and last tasks and B3-3. It does not implement the agent tasks itself.

Subagents for this block, in `.claude/agents/`:

| Subagent | Kind of work | Model | New or reused |
|---|---|---|---|
| `cristea-api` | Express routes, multipart upload, Scribe call, moderation, claim, and their Vitest tests in `apps/api` | opus | reused from Builds 1 and 2, documents updated for Build 3 |
| `cristea-console` | Auth0 React client, the `/curate` console, `KeepMyColours`, with Vitest tests in `apps/web` | opus | new in Build 3 |
| `cristea-canvas` | `/screen` candle field, memorial ticker line, echo ripples and subtitle | opus | reused from Builds 1 and 2, documents updated for Build 3 |

Agent tasks:

| Agent task | Subagent | What | Files it alone may edit | Runs |
|---|---|---|---|---|
| B3-1.a.1 | `cristea-api` | `POST /echoes` stores the echo and its audio | `apps/api/src/echoes/router.ts`, `router.test.ts`, `apps/api/src/app.ts` | parallel with B3-4.a.1 and B3-6.a.1 |
| B3-1.b.1 | `cristea-api` | Scribe transcript after the 201 | `apps/api/src/echoes/scribe.ts`, `scribe.test.ts`, `router.ts` | after B3-1.a.1 |
| B3-1.c.1 | `cristea-api` | `GET /blob/:key` and the pending list | `apps/api/src/echoes/router.ts`, `router.test.ts` | after B3-1.b.1 |
| B3-2.a.1 | `cristea-api` | Approve and reject, 403 test, broadcast | `apps/api/src/echoes/router.ts`, `router.test.ts` | after B3-1.c.1 |
| B3-3.a.1 | none: Cristea in the Auth0 dashboard, this session for the file and the Vercel env var (as B1-2.a.1) | Post-login Action, MFA, URLs, rotation, branding | `cristea/build_3/post-login.js` | parallel with the three agents |
| B3-5.a.1 | `cristea-api` | `POST /me/claim` | `apps/api/src/me/claim.ts`, `claim.test.ts`, `apps/api/src/auth/session.ts`, `apps/api/src/app.ts` | after B3-2.a.1 |
| B3-4.a.1 | `cristea-console` | Auth0 provider and the console API client | `apps/web/src/auth/AuthProvider.tsx`, `apps/web/src/auth/authApi.ts`, `authApi.test.ts`, `apps/web/src/main.tsx`, `apps/web/package.json`, `package-lock.json`, `.env.example` | parallel with B3-1.a.1 and B3-6.a.1 |
| B3-4.b.1 | `cristea-console` | `/curate` echo queue | `apps/web/src/curate/*`, `apps/web/src/routes/Curate.tsx` | after B3-4.a.1 |
| B3-5.b.1 | `cristea-console` | `ClaimOnReturn` and `KeepMyColours` | `apps/web/src/auth/AuthProvider.tsx`, `KeepMyColours.tsx`, `KeepMyColours.module.css`, `claimFlow.ts`, `claimFlow.test.ts` | after B3-4.b.1 |
| B3-6.a.1 | `cristea-canvas` | Candle state and geometry | `apps/web/src/screen/candles.ts`, `candles.test.ts` | parallel with B3-1.a.1 and B3-4.a.1 |
| B3-6.b.1 | `cristea-canvas` | Candle field, memorial ticker line, demo candles | `apps/web/src/screen/useScreenSocket.ts`, `canvas.ts`, `demoFeed.ts`, `demoFeed.test.ts`, `tickerCopy.ts`, `ticker.test.ts`, `Ticker.tsx`, `Ticker.module.css`, `ScreenPage.tsx` | after B3-6.a.1 |
| B3-7.a.1 | `cristea-canvas` | Echo ripples, subtitle, echo ticker line | `apps/web/src/screen/useScreenSocket.ts`, `canvas.ts`, `tickerCopy.ts`, `ticker.test.ts`, `Subtitle.tsx`, `Subtitle.module.css`, `ScreenPage.tsx` | after B3-6.b.1 |

`package-lock.json` is touched only by B3-4.a.1; the other branches do not install anything.

Rules for this session:

- The three branches run at the same time, so start each of the three agents with `isolation: "worktree"`, as in Build 2. Each agent's first agent task starts with: check out its branch and run `npm ci` (B3-1.a.1: `git checkout cristea/b3-echoes && npm ci`; B3-4.a.1: `git checkout cristea/b3-console && npm ci`; B3-6.a.1: `git checkout cristea/b3-screen && npm ci`).
- Start each agent task with the Agent tool and its subagent's name as the agent type. The prompt you give it is the agent task block from this file, word for word. The subagent's own file holds its scope, documents and rules.
- If the Agent tool does not list one of these subagents, stop and ask Cristea to restart the session. Do not replace it with a general agent.
- If the work turns out to need a kind of subagent that does not exist, stop that agent task and ask Cristea. A new subagent is their decision.
- Agents that run at the same time have file lists that do not overlap. If a task turns out to need a file outside its list, the agent stops and reports.
- Re-run each verify command yourself before you tick the box, and for a rule that matters check that the test fails when the rule is broken. Agent reports are evidence, not proof.
- When an agent lists a Blocked question, ask Cristea, record the answer in the glossary, and send it back to the agent. The other agent tasks carry on.

### B3-0 Preflight (first, this session)

- [ ] `git status`, `git branch --show-current`, `git pull`. List local changes; do not touch them.
- [ ] Baseline before any change, summary lines recorded: `npm ci && npm run typecheck && npm run build && npm test`. Stop the Vite dev server before `npm ci` (it locks the `@lampa/*` links).
- [ ] Re-check each "Needs from others" item of section 1 against `main` and the other three glossaries.
- [ ] Docs commit to `main`: this prompt, the hour-25 glossary lines, the plan line for the two added endpoints, and `cristea/build_3/post-login.js` from B3-3.a.1. Commit: `docs(cristea) recorded the Build 3 prompt and Cristea's hour-25 decisions`.
- [ ] Seam commit on a new `cristea/b3-echoes` from `main`, as written above, contract and `emit` together, with a Changes line for `apps/api/src/seam.ts`, `live/socket.ts` and `index.ts`. Then `cristea/b3-console` and `cristea/b3-screen` from that commit.
- Verify: `npm run typecheck && npm run build && npm test` on the seam commit. Paste the summary line.
- Done when: the baseline is recorded, failures that were already there are listed, not fixed silently, and the seam commit passes the same chain.

### B3-1 `POST /echoes`: multipart upload, store in `blobs`, Scribe transcript, status `pending` (2 h)

Branch `cristea/b3-echoes`. All values are Cristea's decisions, hour 25.

#### B3-1.a A visitor's recording is stored as a pending echo with its audio

**B3-1.a.1** `POST /echoes`. Subagent: `cristea-api`. Files: `apps/api/src/echoes/router.ts`, `apps/api/src/echoes/router.test.ts`, `apps/api/src/app.ts`.

- [ ] First: `git checkout cristea/b3-echoes && npm ci`.
- [ ] `createEchoesRouter(deps: EchoesDeps)` as in the seam; mounted in `app.ts` after the last router (`createToolsRouter`) with `{ db: deps.db, tx: deps.tx, onStored: deps.onEventsStored, emit: deps.emit }`.
- [ ] `POST /echoes`, in this order: `requireVisitor`; `echoLimiter`, 5 requests per 10 minutes per `req.visitor.sub` (memory store, 429 `{"error":"rate_limited"}` with `Retry-After`); `express.raw({ type: "multipart/form-data", limit: "2mb" })`; a body over 2 MB answers 413 `{"error":"too_large"}`. Named constants `ECHO_MAX_BYTES = 2 * 1024 * 1024`, `ECHO_LIMIT = 5`, `ECHO_WINDOW_MS = 600_000`.
- [ ] Parse with `new Response(req.body, { headers: { "content-type": req.get("content-type") } }).formData()`. Anything that is not multipart, or fails to parse, answers 400 `{"error":"invalid_echo"}`.
- [ ] Field checks: `siteId` not in `sites` from `@lampa/shared` → 404 `{"error":"unknown_site"}`; the site has `is_memorial` true → 404 `{"error":"no_echo"}`; `consent` not exactly `"true"` → 400 `invalid_echo`; `audio` missing, not a `File`, empty, or with a type that does not start with `audio/webm` or `audio/mp4` → 400 `invalid_echo`. No `deps.tx` → 503 `{"error":"unavailable"}`, after the checks.
- [ ] Store, in one transaction, inside `deps.tx(async (db) => ...)` (Fabi's `Tx`; it rolls back on a throw): `INSERT INTO blobs (key, content_type, data)` with key `echo-<crypto.randomUUID()>`, the file's type as given, and its bytes; `INSERT INTO echoes (site_id, author_sub, anon_id, audio_url) ... RETURNING id`. `anon_id` is `req.visitor.sub` for an anonymous visitor and null otherwise; `author_sub` is the sub for an Auth0 visitor and null otherwise; `audio_url` is `/blob/<key>`. `status`, `voice_mode` and `created_at` take their defaults.
- [ ] Answer 201 `EchoAccepted.parse({ id, status: "pending" })`. A database error answers 503 `unavailable` and logs one line with no audio.
- [ ] `router.test.ts`, in the style of `apps/api/src/events/router.test.ts`: an express app with `express.json()` and the router on port 0, called with `fetch` and a `FormData` body; a fake `Db` that records queries and a fake `Tx` over it; HS256 tokens signed with `"test-secret"`. Cases by name:
  - "no token is 401"
  - "a webm echo is stored and answers 201 pending"
  - "an mp4 echo with a codecs parameter is stored"
  - "an anonymous echo stores anon_id and no author_sub"
  - "consent missing is 400"
  - "consent false is 400"
  - "an audio/wav file is 400"
  - "an empty file is 400"
  - "a JSON body is 400"
  - "an unknown site is 404 unknown_site"
  - "the cathedral is 404 no_echo"
  - "a body over 2 MB is 413"
  - "the sixth echo in ten minutes is 429"
  - "no database is 503"
- [ ] Check that the rule bites: let the consent check pass anything, see its two cases fail, restore it. Say so in the report.
- [ ] Commit: `feat(api) added POST /echoes with blob storage and consent`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the fourteen cases pass and the earlier API tests still pass.

#### B3-1.b A stored echo gets a transcript and a language, or stays without one

**B3-1.b.1** Scribe transcript. Subagent: `cristea-api`. Files: `apps/api/src/echoes/scribe.ts`, `apps/api/src/echoes/scribe.test.ts`, `apps/api/src/echoes/router.ts`.

- [ ] `scribe.ts` exports `transcribe(deps: { db: Db; fetch: typeof fetch }, echoId: string, audio: Blob): Promise<void>`. With no `ELEVENLABS_API_KEY` it returns at once. Otherwise: `POST https://api.elevenlabs.io/v1/speech-to-text`, header `xi-api-key`, a `FormData` with `model_id` `scribe_v3` and `file` the audio, timeout 30 s (`AbortSignal.timeout(30_000)`). On 200, `UPDATE echoes SET transcript = $2, lang = $3 WHERE id = $1` with `text` and `language_code` from the body, stored as Scribe returns them. Named constants `SCRIBE_URL`, `SCRIBE_MODEL = "scribe_v3"`, `SCRIBE_TIMEOUT_MS = 30_000`.
- [ ] Any failure (no key, network, timeout, a status that is not 200, a body without a string `text`, a database error) leaves `transcript` and `lang` null and logs one line with the echo id and the status only. `transcribe` never throws.
- [ ] `router.ts` calls `void transcribe({ db, fetch: deps.fetch ?? fetch }, id, audio)` after the 201 has been sent. The upload's answer never waits for Scribe.
- [ ] `scribe.test.ts` with a fake `fetch` and a fake `Db`, no network. Cases by name:
  - "no key makes no call"
  - "a 200 stores the text and the language code"
  - "the request sends scribe_v3 and the key header"
  - "a 401 stores nothing and does not throw"
  - "a network error stores nothing and does not throw"
  - "a body without text stores nothing"
  - "the key never appears in a log line"
- [ ] Commit: `feat(api) transcribed echoes with Scribe after the upload answers`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the seven cases pass, and a test in `router.test.ts` named "the upload answers before Scribe returns" passes with a fake `fetch` that never resolves.

#### B3-1.c Approved audio is public, pending audio is for curators, and curators can list the queue

**B3-1.c.1** `GET /blob/:key` and `GET /echoes?status=pending`. Subagent: `cristea-api`. Files: `apps/api/src/echoes/router.ts`, `apps/api/src/echoes/router.test.ts`.

- [ ] `GET /blob/:key`, 120 a minute per IP (as `sitesLimiter`): look up the blob and the echo whose `audio_url` is `/blob/<key>`. No blob → 404 `{"error":"unknown_blob"}`. A blob with no echo row → 404 `unknown_blob` in this block (add-a-place audio comes in Build 4). Echo `approved` → 200 with the stored `Content-Type`, the bytes, and `Cache-Control: public, max-age=3600`, no token needed. Echo `pending` → runs `requireVisitor` (401 without a valid token); the visitor needs `kind` `auth0` and `moderate:echo` in `permissions`, otherwise 403 `{"error":"forbidden"}`; then 200 with `Cache-Control: no-store`. No database → 503 `unavailable`.
- [ ] `GET /echoes?status=pending`: `requireVisitor`, `visitorLimiter`, then the same permission check (403 `forbidden`). Any other `status` value → 400 `{"error":"invalid_status"}`. Answer 200 `PendingEchoes.parse(...)`, oldest first, `createdAt` as ISO, `audioUrl` the row's `audio_url`, `Cache-Control: no-store`.
- [ ] The permission check is one function in `router.ts`, `canModerate(visitor)`, used by every curator route.
- [ ] Cases added to `router.test.ts`:
  - "approved audio is served without a token"
  - "pending audio without a token is 401"
  - "pending audio with an anonymous token is 403"
  - "pending audio with moderate:echo is served with no-store"
  - "an unknown blob key is 404"
  - "the pending list needs moderate:echo"
  - "the pending list is oldest first and passes PendingEchoes"
  - "status=approved is 400"

  Auth0 tokens in the tests come from `makeRequireVisitor` with a local RS256 key pair, as in `auth/session.test.ts`.
- [ ] Commit: `feat(api) served echo audio by status and listed pending echoes for curators`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the eight cases pass.

### B3-2 Approve and reject endpoints behind `moderate:echo`, broadcast on approval, 403 test (1 h)

#### B3-2.a A curator's approval plays the echo on the map; a rejection removes its audio

**B3-2.a.1** Approve and reject. Subagent: `cristea-api`. Files: `apps/api/src/echoes/router.ts`, `apps/api/src/echoes/router.test.ts`.

- [ ] `POST /echoes/:id/approve` and `POST /echoes/:id/reject`: `requireVisitor`, `visitorLimiter`, `canModerate` (403 `{"error":"forbidden"}`). An `id` that is not a uuid, or no row → 404 `{"error":"unknown_echo"}`; a row that is not `pending` → 409 `{"error":"not_pending"}`. No database → 503 `unavailable`. Success answers 204 with no body.
- [ ] Approve: `UPDATE echoes SET status = 'approved', public_audio_url = audio_url WHERE id = $1 AND status = 'pending' RETURNING site_id, audio_url, transcript, lang, anon_id, author_sub`. Then one `echo_approved` event through `INSERT_EVENTS` from `events/router.ts`: session id `anon_id ?? author_sub`, user sub `author_sub`, `ts` now, the echo's site, kind `echo_approved`, weight `WEIGHTS.echo_approved`. Then `deps.onStored?.()`. Then, when `deps.emit` is set, `emit` of `SocketMessage.enum.echo_approved` with `EchoApprovedMessage.parse({ echoId, siteId, audioUrl, transcript, lang })` to `screen` and to `site:<siteId>`. A failing event insert or emit logs one line and still answers 204: the echo is approved.
- [ ] Reject: `UPDATE echoes SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING audio_url`, then `DELETE FROM blobs WHERE key = $1` with the key taken from `audio_url`. No event, no broadcast.
- [ ] Cases added to `router.test.ts`:
  - "approve without moderate:echo is 403" (the section 8 test, with an Auth0 token that has no permissions)
  - "approve with an anonymous token is 403"
  - "reject without moderate:echo is 403"
  - "approve without a token is 401"
  - "approve sets approved and answers 204"
  - "approve stores one echo_approved event with weight 5"
  - "approve emits echo_approved to screen and the site room"
  - "approve of an approved echo is 409"
  - "approve of an unknown id is 404"
  - "reject sets rejected and deletes the blob"
  - "reject emits nothing"
- [ ] Check that the rule bites: remove `canModerate` from the approve route, see "approve without moderate:echo is 403" fail, restore it. Say so in the report.
- [ ] Commit: `feat(api) added echo approve and reject behind moderate:echo with the 403 test`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the eleven cases pass.

### B3-3 Post-login Action: roles claim, MFA forced for curator and admin (0.5 h)

#### B3-3.a Curators and admins must pass a second factor, and tokens carry their roles

**B3-3.a.1** Auth0 dashboard checklist. By Cristea, with this session for the file and the env var. Files: `cristea/build_3/post-login.js`.

- [ ] This session writes `cristea/build_3/post-login.js` in the B3-0 docs commit (Cristea's decisions, hour 25: the source is committed so the team can read it, and silent refreshes skip MFA):

  ```js
  exports.onExecutePostLogin = async (event, api) => {
    const ns = "https://lampa.city";
    const roles = event.authorization?.roles ?? [];
    api.idToken.setCustomClaim(`${ns}/roles`, roles);
    api.accessToken.setCustomClaim(`${ns}/roles`, roles);
    // Silent refreshes in /curate must not ask for a second factor (Auth0's customize-mfa example).
    if (event.transaction?.protocol === "oauth2-refresh-token") return;
    if (roles.includes("curator") || roles.includes("admin")) {
      api.multifactor.enable("any", { allowRememberBrowser: false });
    }
  };
  ```

- [ ] Cristea: Actions, Library, a custom post-login Action named `LAMPA roles and staff MFA` with the code above, deployed and added to the Login flow.
- [ ] Cristea: Security, Multi-factor Auth, factor **One-time Password** on; policy **Never** (the Action decides who gets MFA). Auth0's factor page says the available factors depend on the plan, and this session could not read the pricing page: if One-time Password is not offered on this tenant, stop and tell this session, which asks Cristea.
- [ ] Cristea: APIs, `https://lampa-api-b45i.onrender.com`, Settings: **Allow Offline Access** on (Auth0's refresh-token rotation page: "You must enable offline access"; `useRefreshTokens` sends the `offline_access` scope).
- [ ] Cristea: Applications, `LAMPA`:
  - Allowed Callback URLs: `https://lampa-timisoara.vercel.app`, `https://lampa-timisoara.vercel.app/curate`, `http://localhost:5173`, `http://localhost:5173/curate`.
  - Allowed Logout URLs: the same four.
  - Refresh Token Rotation on.
- [ ] Cristea: Branding, Universal Login: the wordmark PNG from `DESIGN.md` 3.1 as the logo and primary colour `#FFB547`. Check the label on the amber button: if Auth0 renders it white, set the primary colour to `#8A5300` (`DESIGN.md` 7.10).
- [ ] This session sets `VITE_AUTH0_AUDIENCE=https://lampa-api-b45i.onrender.com` on Vercel `lampa-timisoara` (production) and adds a Hand-offs line.
- Verify: `curl -s -o /dev/null -w "%{http_code}" https://lampa.eu.auth0.com/.well-known/jwks.json` → 200, and `grep -c "multifactor.enable" cristea/build_3/post-login.js` → 1. Paste the summary line.
- Done when: Cristea reports that the Action is deployed in the Login flow, OTP is on, offline access, the URLs and rotation are set, and the branding is checked. Cristea's check, after B3-4 deploys: signing in as a curator asks for a one-time password; a visitor with no role signs in with the email code alone. Do not mark that check done.

### B3-4 Curator console v1: queue with audio player, transcript, approve, reject (2 h)

Branch `cristea/b3-console`. Scope (Cristea's decisions, hour 25): the smallest version of `DESIGN.md` section 9 item 10, the "Echo queue" tab only (Add a place is Build 4), native `<audio controls>`, reject without the inline confirm, the list refreshed on load, after each action and every 30 s.

#### B3-4.a The web app can sign a curator in and call the API with their Auth0 token

**B3-4.a.1** Auth0 provider and the console API client. Subagent: `cristea-console`. Files: `apps/web/src/auth/AuthProvider.tsx`, `apps/web/src/auth/authApi.ts`, `apps/web/src/auth/authApi.test.ts`, `apps/web/src/main.tsx`, `apps/web/package.json`, `package-lock.json`, `.env.example`.

- [ ] First: `git checkout cristea/b3-console && npm ci`.
- [ ] `npm install -w @lampa/web --save-exact @auth0/auth0-react@2.30.0`.
- [ ] `.env.example` gains `VITE_AUTH0_AUDIENCE=` under the other `VITE_AUTH0_` names.
- [ ] `AuthProvider.tsx`: wraps `Auth0Provider` with `domain` `import.meta.env.VITE_AUTH0_DOMAIN`, `clientId` `import.meta.env.VITE_AUTH0_CLIENT_ID`, `authorizationParams={{ redirect_uri: window.location.origin, audience: import.meta.env.VITE_AUTH0_AUDIENCE }}`, `cacheLocation="localstorage"`, `useRefreshTokens`, and `onRedirectCallback={(appState) => window.location.replace(appState?.returnTo ?? window.location.pathname)}`. The full reload returns the visitor to the page they left; the session survives it in local storage. B3-5.b.1 changes `onRedirectCallback` for the claim. With `VITE_AUTH0_DOMAIN` unset (local dev without the value), it renders its children with no provider: `useAuth0` then reports `isLoading` true, so `/curate` stays in its loading state and `KeepMyColours` renders nothing.
- [ ] `main.tsx` renders `<AuthProvider><App /></AuthProvider>`. `App.tsx` (Ionut's) is not edited.
- [ ] `authApi.ts`: `authApi<T>(path: string, token: string, schema?: ZodType<T>, init?: RequestInit): Promise<T | undefined>` calls `${API_URL}${path}` with `Authorization: Bearer <token>`, throws `ApiError(status)` from `apps/web/src/api/client.ts` on a status that is not 2xx, returns `undefined` on 204 and `schema.parse(json)` otherwise. `authBlob(path, token): Promise<Blob>` does the same for audio. `api()` and `authFetch` are not changed: phone calls keep the anonymous token (Cristea's decision, hour 25).
- [ ] `authApi.test.ts` with a stubbed global `fetch`. Cases by name:
  - "sends the Auth0 token as a Bearer header"
  - "a 204 returns undefined"
  - "a 403 throws ApiError 403"
  - "a body that fails the schema throws"
  - "authBlob returns the response blob"
- [ ] Commit: `feat(web) added the Auth0 provider and an API client for Auth0 tokens`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the five cases pass and the bundle builds; `grep -c "VITE_AUTH0_AUDIENCE" .env.example` prints 1.

#### B3-4.b A curator can listen to each pending echo, read its transcript, and approve or reject it

**B3-4.b.1** `/curate` echo queue. Subagent: `cristea-console`. Files: `apps/web/src/curate/CuratePage.tsx`, `CuratePage.module.css`, `EchoDetail.tsx`, `EchoDetail.module.css`, `queue.ts`, `queue.test.ts`, `apps/web/src/routes/Curate.tsx`.

- [ ] `routes/Curate.tsx` renders `CuratePage`. Classes are ported from `design/css/console.css` and the `.audio-player` block of `components.css`, same values, camelCase names. Buttons and Notices are the house `Button` and `Notice` from `apps/web/src/components`.
- [ ] Access states (`DESIGN.md` 7.15):
  - Not signed in: a centred column with the wordmark, "Curator console" (`--type-title`), "Sign in with your curator account. Two-factor sign-in is required." and a primary L Button "Sign in". The button calls `loginWithRedirect({ authorizationParams: { redirect_uri: window.location.origin + "/curate" }, appState: { returnTo: "/curate" } })`.
  - Signed in, and `GET /echoes?status=pending` answers 403: "This account cannot curate. Ask the team to add the curator role." with a quiet Button "Sign out", which calls `logout({ logoutParams: { returnTo: window.location.origin + "/curate" } })`.
  - `getAccessTokenSilently` fails with `login_required` or `consent_required`: Notice error "Your session ended. Sign in again." with the action "Sign in".
- [ ] Queue (tab label "Echo queue (n)", the only tab): a desk layout with a 360px list on the left and the detail on the right on `--surface`. Under 1024px the list is the screen, and a row opens the detail with a back Button "Back to the queue".
  - Each row: the site name (`--type-body` 600) and a meta line (`--type-meta` `--text-2`). The meta line is the language name from `new Intl.DisplayNames(["en"], { type: "language" }).of(lang)` (the raw code when that throws; left out when `lang` is null), then the time ago from `timeAgo` in `apps/web/src/screen/tickerCopy.ts` plus " ago" ("now" stays "now").
  - The selected row has a `--surface-2` fill. The first row is selected on load.
- [ ] Detail:
  - Site, time, language, and the duration once the audio's `loadedmetadata` gives a finite `duration`, as `m:ss`.
  - The audio: `authBlob(audioUrl, token)`, then `URL.createObjectURL`, then `<audio controls src>` with the `.audio-player` styles. The URL is revoked when the selection changes. Loading: the control is disabled with "Loading audio". Error: "Could not play this echo." and a quiet link "Download it" to the object URL when there is one.
  - The transcript in `--type-body`, max 65ch, `lang` set; null shows "No transcript yet. Listen to the recording." in `--text-3`.
  - The consent line "The visitor agreed to public playback in their own voice."
  - At the bottom: "Approve" (primary M) and "Reject" (danger M), 12px apart.
- [ ] Actions:
  - Approve: the button shows "Approving" while loading. On 204 the row leaves the list, the next echo is selected, and a Notice info reads "Approved. It plays on the Living Map now."
  - Reject: one request, no inline confirm (`DESIGN.md` section 9 item 10). On 204 the row leaves and the next is selected.
  - A 403: Notice error "You do not have permission to moderate. Sign in again with your curator account."
  - Any other failure: Notice error "That did not save. Try again."; the echo stays selected.
  - A 409: the row leaves (another curator moderated it).
- [ ] Other states: empty queue "No echoes waiting. New ones appear here as visitors record them."; loading: list rows at their final height with "Loading" in `--text-3`. The list is fetched on load, after each approve or reject, and every 30 s (`QUEUE_REFRESH_MS = 30_000`), keeping the selection when the selected echo is still pending.
- [ ] Focus (`DESIGN.md` 6.1): every control is reachable by Tab with the house focus ring; the list is a `<ul>` of buttons; after approve or reject, focus moves to the newly selected row.
- [ ] `queue.ts` holds the pure parts, with `queue.test.ts` cases by name:
  - "the first echo is selected on load"
  - "removing the selected echo selects the next one"
  - "removing the last echo selects the one before"
  - "a refresh keeps the selection when it is still pending"
  - "a refresh selects the first echo when the selection is gone"
  - "the meta line names Romanian for ro"
  - "the meta line leaves out a null language"
  - "the duration 19.4 s reads 0:19"
- [ ] Commit: `feat(web) added the curator echo queue at /curate`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/curate/*.css apps/web/src/curate/*.tsx | wc -l`. Paste the summary line.
- Done when: the eight cases pass and the grep count is 0. This session then runs the dev server with the API mocked by Playwright's `page.route` (two pending echoes, a 403 variant and an empty variant; no database is touched) and with `useAuth0` signed in through a mocked token endpoint, and confirms by screenshot at 1440 × 900 and 390 × 844: the signed-out column, the list and detail, the empty queue and the 403 state, with nothing clipped; and checks the console for errors.

### B3-5 Keep my colours: `loginWithRedirect`, then `POST /me/claim` moves anonymous rows to the Auth0 subject (0.5 h)

#### B3-5.a The API moves a visitor's anonymous rows to their account, only for the token's owner

**B3-5.a.1** `POST /me/claim`. Subagent: `cristea-api`. Files: `apps/api/src/me/claim.ts`, `apps/api/src/me/claim.test.ts`, `apps/api/src/auth/session.ts`, `apps/api/src/app.ts`.

- [ ] `session.ts` exports `verifyAnon(token: string): Promise<string | null>`: the HS256 check of `requireVisitor` (same secret, algorithm and expiry), returning the `sub` when it starts with `anon:` and null otherwise. `requireVisitor` uses it, so the logic is written once.
- [ ] `createClaimRouter({ tx })`, `POST /me/claim`: `requireVisitor`, `visitorLimiter`; an anonymous caller → 403 `{"error":"forbidden"}`; a body that fails `ClaimIn` → 400 `{"error":"invalid_body"}`; `verifyAnon(anonToken)` null → 400 `{"error":"invalid_anon_token"}`; no `deps.tx` → 503 `unavailable`.
- [ ] In one transaction, inside `deps.tx(async (db) => ...)` (Fabi's `Tx`), with `$1` the anonymous sub and `$2` the Auth0 sub:
  - `UPDATE panes SET author_sub = $2 WHERE anon_id = $1 AND author_sub IS NULL`
  - `UPDATE echoes SET author_sub = $2 WHERE anon_id = $1 AND author_sub IS NULL`
  - `UPDATE interaction_events SET user_sub = $2 WHERE session_id = $1 AND user_sub IS NULL`

  `session_id` is never rewritten, so the aggregates and unique-visitor counts stay as they were (Cristea's decision, hour 25). Answer 200 `ClaimResult.parse({ panes, echoes, events })` from the three `rowCount`s.
- [ ] Mounted in `app.ts` after the echoes router with `{ tx: deps.tx }`.
- [ ] `claim.test.ts`, cases by name:
  - "no token is 401"
  - "an anonymous caller is 403"
  - "a tampered anonToken is 400"
  - "an expired anonToken is 400"
  - "an Auth0 token passed as anonToken is 400"
  - "a valid claim runs the three updates with the two subs and answers the counts"
  - "a database error rolls back and answers 503"
- [ ] Check that the rule bites: let `verifyAnon` skip the signature check, see "a tampered anonToken is 400" fail, restore it. The eleven token tests in `auth/session.test.ts` still pass.
- [ ] Commit: `feat(api) added POST /me/claim with a verified anonymous token`.
- Verify: `npm run typecheck -w @lampa/api && npm test -w @lampa/api`. Paste the summary line.
- Done when: the seven cases pass and every earlier API test passes.

#### B3-5.b A visitor taps Keep my colours, signs in, and lands back where they were with their colours kept

**B3-5.b.1** `ClaimOnReturn` and `KeepMyColours`. Subagent: `cristea-console`. Files: `apps/web/src/auth/AuthProvider.tsx`, `apps/web/src/auth/KeepMyColours.tsx`, `apps/web/src/auth/KeepMyColours.module.css`, `apps/web/src/auth/claimFlow.ts`, `apps/web/src/auth/claimFlow.test.ts`.

The claim runs right after the redirect, under `AuthProvider`, whether or not the page mounts `KeepMyColours` (Cristea's decision, hour 25). Every `sessionStorage` read and write is inside try/catch.

- [ ] `KeepMyColours` takes no props. Ionut places it on the Site view and after a catch (Cristea's decision, hour 25); this task does not edit Ionut's files. Signed out, it is a quiet Button "Keep my colours" whose tap calls `loginWithRedirect({ appState: { claim: true, returnTo: location.pathname + location.search } })`.
- [ ] `AuthProvider.tsx`: `onRedirectCallback(appState)` with `appState.claim` true stores `appState.returnTo` under `sessionStorage` key `lampa.claimReturnTo` and does not navigate; without `claim` it navigates as in B3-4.a.1. A `ClaimOnReturn` component rendered inside `Auth0Provider`, next to the children: once `isAuthenticated` is true and `lampa.claimReturnTo` is set, it runs `claimAnonymous(getAccessTokenSilently)` once, writes `lampa.claimResult` as `"saved"` or `"failed"`, removes `lampa.claimReturnTo`, and calls `window.location.replace(returnTo)`. It renders nothing.
- [ ] `KeepMyColours`, signed in: on mount it reads and removes `lampa.claimResult`, and shows:
  - `"saved"`: Notice info "Saved. Your colours stay with your account."
  - `"failed"`: Notice error "You are signed in, but your colours did not move to your account." with the action "Try again", which runs `claimAnonymous` again and shows the same two outcomes.
  - No result: renders nothing (`DESIGN.md` 7.10: already signed in, the button is not shown).
- [ ] Sign-in cancelled: Auth0 returns with an error, `isAuthenticated` stays false, `lampa.claimReturnTo` is not set, nothing changes and no message shows.
- [ ] `claimFlow.ts`: `claimAnonymous(getAuth0Token: () => Promise<string>): Promise<ClaimResult>` takes the anonymous token from `getToken()` in `apps/web/src/session.ts` and posts `ClaimIn` to `/me/claim` through `authApi` with `ClaimResult` as the schema.
- [ ] `claimFlow.ts` also exports the pure step `nextClaimStep({ isAuthenticated, returnTo })`: `"claim"` when signed in with a stored `returnTo`, `"wait"` otherwise. `ClaimOnReturn` uses it.
- [ ] `claimFlow.test.ts` with a stubbed `fetch`. Cases by name:
  - "posts the anonymous token in the body and the Auth0 token in the header"
  - "a 400 throws so the Notice offers Try again"
  - "a result that fails ClaimResult throws"
  - "a signed-in return with a stored returnTo claims"
  - "a signed-out return waits"
  - "a signed-in visit with no stored returnTo waits"
- [ ] Commit: `feat(web) claimed anonymous colours after sign-in and added Keep my colours`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/auth/*.css | wc -l`. Paste the summary line.
- Done when: the six cases pass and the grep count is 0. Cristea's check on the iPhone once Ionut places the button: tap, sign in with the email code, return to the same page, see "Saved. Your colours stay with your account." Do not mark it done.

### B3-6 Memorial on `/screen`: candle points that fade like glow, a quiet ticker line, no number, no room sound (0.5 h)

Branch `cristea/b3-screen`.

#### B3-6.a Each candle has a fixed place in the Cathedral's circle and an alpha that fades over hours

**B3-6.a.1** Candle state and geometry. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/candles.ts`, `apps/web/src/screen/candles.test.ts`.

- [ ] First: `git checkout cristea/b3-screen && npm ci`.
- [ ] Named constants: `CANDLE_TAU_MS = 6 * 3600_000` (`DESIGN.md` 2.3), `CANDLE_MIN_DECAY = 0.05`, `CANDLE_MAX = 200`, `CANDLE_RADIUS_U = 3` (the point is a 6 × u disk, as `.living-map__candle`: core to 3 × u), `CANDLE_HALO = 3` (halo to 9 × u), `CANDLE_SPREAD = 0.85`.
- [ ] `type Candle = { id: string; litAt: number }`. `candleDecay(litAt, now) = Math.exp(-(now - litAt) / CANDLE_TAU_MS)`; `candleAlpha(decay) = 0.25 + 0.65 × decay`.
- [ ] `applyCandle(list, message: unknown, now)`: parses with `CandleMessage.safeParse`; invalid, a `siteId` that is not a memorial site in `sites`, an unparseable `litAt`, or an id already in the list returns the same array. Otherwise it adds the candle, drops candles under `CANDLE_MIN_DECAY`, and keeps the newest `CANDLE_MAX` (oldest dropped first).
- [ ] `applyCandleState(list, candles: CandleMessage[], now)` merges the state's candles by the same rules.
- [ ] `candlePosition(id): { dx, dy }`, fractions of R: FNV-1a 32-bit of the id; angle = (low 16 bits / 65536) × 2π; distance = √(high 16 bits / 65536) × `CANDLE_SPREAD`. The same id always gives the same place.
- [ ] `candles.test.ts`, cases by name:
  - "decay is 1 at lighting and about 0.37 after six hours"
  - "alpha is 0.9 at decay 1 and 0.25 at decay 0"
  - "a candle older than the minimum decay is not added"
  - "a duplicate id is ignored"
  - "a candle for a colour site is ignored"
  - "the 201st candle drops the oldest"
  - "the same id gives the same position"
  - "every position lies inside the spread"
- [ ] Commit: `feat(screen) added the candle state with decay and fixed positions`.
- Verify: `npm run typecheck -w @lampa/web && npm test -w @lampa/web`. Paste the summary line.
- Done when: the eight cases pass.

#### B3-6.b The Cathedral shows its candles, quietly, and the ticker notes each new one in one calm line

**B3-6.b.1** Candle field, memorial ticker line, demo candles. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/useScreenSocket.ts`, `canvas.ts`, `demoFeed.ts`, `demoFeed.test.ts`, `tickerCopy.ts`, `ticker.test.ts`, `Ticker.tsx`, `Ticker.module.css`, `ScreenPage.tsx`.

- [ ] `useScreenSocket` adds `candlesRef: RefObject<Candle[]>`. `SocketMessage.enum.candle` goes to `applyCandle`; when the array changed, a `{ kind: "candle"; at }` event is added. `GET /screen/state` passes `state.candles` to `applyCandleState` (the field is in the seam; Fabi fills it). Candles older than the minimum decay are dropped on each glow update.
- [ ] Demo (Cristea's decision, hour 25): `DEMO_CANDLE_MS = 20_000`; `nextDemoCandle(n, now): CandleMessage` with id `demo-candle-<n>`, `siteId` `cathedral` and `litAt` now; passed through the same `applyCandle` path every 20 s while `demo` is true.
- [ ] `canvas.ts` (`DESIGN.md` 7.13 "Candle field", 5.5 "Candle fading"):
  - Keep the 1px `--line` outline circle of radius R at the Cathedral and its name in `--text-2`.
  - Each candle is a disk of radius `CANDLE_RADIUS_U × u` px in `--lamp-white`. Its halo is a radial gradient of `--lamp-white` from alpha 0.25 to 0 out to `CANDLE_HALO ×` the point radius.
  - Point and halo take `candleAlpha(candleDecay(...))`, eased over 1200 ms each time it is recomputed on a glow update. A new candle fades in over 1200 ms.
  - No number, no glow line, no ring, no halo of `--lamp`.
  - Reduced motion (`DESIGN.md` 5.6) keeps the candle fades.
- [ ] Ticker (`DESIGN.md` 6.18, memorial line): the copy is "A candle was lit at the Cathedral." in `--screen-body` `--text-2`. In place of a swatch it has a 10px circle of `--lamp-white` at 60% opacity. It has no time ago and fades in over 1200 ms. At most one memorial line is in the list: a newer candle replaces it in place.
- [ ] `ticker.test.ts` adds:
  - "a candle line reads A candle was lit at the Cathedral."
  - "a second candle replaces the memorial line in place"

  `demoFeed.test.ts` adds:
  - "a demo candle is for the cathedral and passes CandleMessage"
- [ ] Commit: `feat(screen) drew the candle field and the memorial ticker line`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/canvas.ts apps/web/src/screen/*.css | wc -l`. Paste the summary line.
- Done when: the three cases pass and the grep count is 0. This session then opens `http://localhost:5173/screen?demo=1` at 1920 × 1080, waits for two demo candles, and confirms by screenshot: points inside the Cathedral's circle, no number under it, one memorial line in the ticker, and no console error.

### B3-7 Echo ripples and subtitle on `/screen` (from slack, first to cut)

#### B3-7.a An approved echo ripples from its window, shows its words under it, and gets a ticker line

**B3-7.a.1** Echo ripples, subtitle, echo ticker line. Subagent: `cristea-canvas`. Files: `apps/web/src/screen/useScreenSocket.ts`, `canvas.ts`, `tickerCopy.ts`, `ticker.test.ts`, `Subtitle.tsx`, `Subtitle.module.css`, `ScreenPage.tsx`.

- [ ] `SocketMessage.enum.echo_approved` is parsed with `EchoApprovedMessage.safeParse`; invalid, or a site that is not a colour site, is ignored. Otherwise it adds an effect `{ kind: "echo"; siteId; at }`, an event `{ kind: "echo"; siteId; at }`, and a subtitle `{ siteId, text, lang, at }` when `transcript` is not null.
- [ ] Ripple (`DESIGN.md` 5.5, "Echo approved"): three 2 × u `--text` rings grow from R to 3R over 3000 ms, started 400 ms apart, alpha 0.4 to 0. Named constants `ECHO_RING_MS = 3000`, `ECHO_RING_GAP_MS = 400`, `ECHO_RINGS = 3`. Under reduced motion (`DESIGN.md` 5.6): no rings; instead one 600 ms opacity flash on the window, as the complete effect does today; the subtitle (opacity fade shortened to 150 ms) and the ticker line still show.
- [ ] `Subtitle.tsx` (`DESIGN.md` 7.13), DOM, classes ported from `.living-map__subtitle` and `__subtitle-lang`. It is placed under the site's window at the position `layout` gives, in a `--surface` box (radius `--radius-s`, max width 520 × u). It shows the first 90 characters of the transcript in `--screen-subtitle` `--text` and the language code in `--screen-meta`. It is shown 8 s and fades out over 600 ms (`SUBTITLE_MS = 8000`, `SUBTITLE_FADE_MS = 600`). A newer subtitle at the same site replaces it.
- [ ] Ticker line "New echo at {Site}" with no swatch, as the pane line's layout otherwise.
- [ ] `ticker.test.ts` adds:
  - "an echo line names the site"
  - "an echo for the cathedral adds no line"
- [ ] Commit: `feat(screen) rippled approved echoes with a subtitle and a ticker line`.
- Verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web && grep -nE "#[0-9A-Fa-f]{3,8}" apps/web/src/screen/canvas.ts apps/web/src/screen/*.css | wc -l`. Paste the summary line.
- Done when: the two cases pass and the grep count is 0. This session then starts a throwaway Socket.IO server on port 3001 (a scratchpad script, namespace `/live`, CORS for `http://localhost:5173`) that sends one valid `EchoApprovedMessage` for `unirii` 5 s after a `screen` socket joins. It runs the dev server with `VITE_API_URL=http://localhost:3001`, opens `/screen`, and confirms by screenshot the rings, the subtitle under the window and the ticker line.

### B3-last Integrate and hand over (last, this session)

- [ ] All three branches merged into a local throwaway branch, `npm ci && npm run typecheck && npm run build && npm test` green on it.
- [ ] Push each branch and open its PR as soon as its own verify passes, in this order: `cristea/b3-echoes`, `cristea/b3-screen`, `cristea/b3-console`. Each PR lists what was verified and what waits for Fabi, Ionut, Patrick or a phone. Cristea merges with a merge commit.
- [ ] After `cristea/b3-echoes` deploys, against `https://lampa-api-b45i.onrender.com`, with a token from `POST /session/anon` (paste each status):
  - `POST /echoes` with a 1 s webm and `consent=true` for `mx` → 201.
  - The same for `cathedral` → 404 `no_echo`.
  - `GET /echoes?status=pending` with the anonymous token → 403.
  - `POST /echoes/<id>/approve` with the anonymous token → 403.
  - `GET /blob/<key>` of that pending echo with no token → 401.

  These calls use no ElevenLabs credit only while `ELEVENLABS_API_KEY` is absent from Render. While the key is set, each upload triggers one Scribe call: send the one test upload only and say so.
- [ ] Glossary complete: every ID of this prompt is under Done or Blocked. Hand-offs lists:
  - `POST /echoes` (fields, limits, answers) and `EchoAccepted`, for Ionut.
  - `EchoApprovedMessage` on `screen` and `site:<id>`, and `GET /blob/:key` (public once approved), for Patrick's whispers.
  - `PendingEchoes` and the approve and reject answers.
  - `CandleMessage` and `ScreenState.candles`, for Fabi.
  - `ClaimIn`, `ClaimResult`, `POST /me/claim`, and the fact that panes move only if `POST /panes` writes `anon_id`, for Fabi.
  - `KeepMyColours` and where it goes, for Ionut.
  - `AuthProvider` in `main.tsx`.
  - `VITE_AUTH0_AUDIENCE`.
  - The `https://lampa.city/roles` claim.
  - `Live.emit` and `AppDeps.emit`.
- [ ] Cristea's checks, listed and not claimed:
  - Laptop: sign in at the deployed `/curate` as a curator (email code, then a one-time password), see the queue, play one echo, approve it and see the ripple, subtitle and ticker line on the deployed `/screen`; reject another and see it leave.
  - Laptop: a visitor account with no role sees "This account cannot curate."
  - iPhone: once Ionut's recorder is on `main`, record and send an echo (mp4 from Safari); it reaches the queue with a transcript (one Scribe call).
  - iPhone: once Ionut places `KeepMyColours`, sign in and see "Saved. Your colours stay with your account."
  - Laptop, `/screen`: a candle from the phone (Fabi's broadcast) appears inside the Cathedral's circle with one memorial ticker line and no number; `/screen?demo=1` shows a new candle every 20 s.
  - Checkpoint 3: demo steps 1:20 and 1:55 twice from a cold start with `simulate-crowd` running.
- Done when: every box is ticked or listed as Cristea's, and the report below is posted.

## 4. Report

After each ID, post one line and add it to the glossary's Done table: `<ID> done | verify: <command> → <summary line> | commit: <sha>`. End the block with:

- **Blocked:** one line each, the question and your recommendation. Expected:
  - The candle broadcast and `GET /screen/state` from Fabi.
  - `POST /panes` writing `anon_id`.
  - Ionut's recorder and the placement of `KeepMyColours`.
  - Patrick's whispers reading `echo_approved`.
- **Not finished at hour 32:** each ID, what is left, and its place in the cut order (ripples and subtitle, then demo candles, then the claim).
- **Phone and screen checks for Cristea:** what you could not run here.
- **For the checkpoint:** what the other lanes should know before integrating.

If a test or build cannot run on this machine, say so and list what you verified by reading the code.

## 5. Exit for Build 3

- A visitor with a token can send a webm or mp4 echo of up to 2 MB with consent to a colour site; the API stores it as `pending` with its audio in `blobs`, answers before Scribe, and fills the transcript when Scribe answers; the Cathedral answers 404 `no_echo`.
- Pending audio and the queue need `moderate:echo`; approved audio is public; a rejected echo's audio is deleted.
- Approve and reject answer 403 without `moderate:echo` (the section 8 test); approve stores one `echo_approved` event and broadcasts `echo_approved` to `screen` and the site room.
- Curators and admins must pass a one-time password; every token carries `https://lampa.city/roles`.
- `/curate` lets a curator sign in, list pending echoes, play each one, read its transcript, approve and reject, with the access, empty, loading and error states of `DESIGN.md` 7.15.
- `POST /me/claim` moves only the rows of the anonymous token the caller holds; `KeepMyColours` signs a visitor in and claims on return.
- `/screen` draws candles inside the Cathedral's circle, fading over hours, with one calm ticker line and no number; `/screen?demo=1` adds a candle every 20 s; an approved echo ripples, shows a subtitle and adds a ticker line (unless cut).
- `npm test` is green and holds the echo, Scribe, moderation, claim, console, claim-flow, candle and ticker tests.
- Every row of "Plan coverage" is done, or listed as waiting or cut with its reason.
- `cristea/GLOSSARY.md` matches the state of the branch.

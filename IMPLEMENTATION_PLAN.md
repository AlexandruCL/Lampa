# LAMPA implementation plan

48 hours, 4 people. Source: `LAMPA_Hackathon_Concept_Timisoara_v4.pdf` (section numbers below point into it), plus `LAMPA_Hackathon_Concept_Timisoara_v6.pdf`, which is v5 (v4 plus the addendum page for the fifth site) with the Iron Tree replaced by Muzeul MX Corneliu Miklosi throughout the text.

This plan covers code, data, integrations, testing and submission. It contains no visual or UX design work: that goes in `DESIGN.md`. Every screen task here means a working, unstyled screen. Styling is done by each screen's owner in the same block, see "Where styling hours come from" at the end.

## 0. Decisions of 10 November 2026

These were settled after `DESIGN.md` was written and override anything older in this file or the PDF.

- The Iron Tree is replaced by Muzeul MX Corneliu Miklosi in Timișoara, the venue where the hackathon takes place. It is a persona site like the Iron Tree was (same code path, same YAML format). Its coordinates, facts with sources, persona traits, sound-bed prompt and direction hint are not written yet: the team collects them on site before hour 0. Nothing in the code depends on the Iron Tree: the palette id `tree` stays as an internal colour set name.
- Five sites, not four. The fifth is the Metropolitan Cathedral, a 1989 memorial: narrated, sourced testimonies and a candle, nothing else (details in section 7).
- The Lamp station moves from Ionut to Patrick. Cristea builds the design tokens and base components at the start of Build 1. Cristea's load is over budget and the team accepts it.
- The clock offset endpoint moves from Build 4 to Build 3, because the lamp pulse needs it.
- Radio Lampa stays, first in the cut order. Memorial mode leaves the cut order.
- Remote mode opens at `/?mode=remote`.

## 1. Time budget

4 people x 48 h = 192 person-hours. The split below is what the timeline in section 5 adds up to.

| Bucket | Per person | Team | Notes |
|---|---|---|---|
| Setup and kick-off | 2 h | 8 h | repo, deploys, accounts wired, contracts agreed |
| Feature tasks | 20 h | 80 h | the estimates in section 6. After the 10 November moves: Ionut 18.25 h, Patrick 23 h, Fabi 21 h, Cristea 23.75 h (86 h) |
| Slack inside build blocks | 4 h | 16 h | meals, breaks, small blockers; blocks are planned at about 80% |
| Checkpoints (integrate, then fix) | 5 h | 20 h | three of them, everyone stops building |
| Freeze: bugs only, device pass, load test | 4 h | 16 h | no new features after hour 40 |
| Backup video, README, sponsor write-ups | 2 h | 8 h | |
| Rehearsal, submission, last slack | 2 h | 8 h | |
| Sleep | 9 h | 36 h | 6 h on night one, 3 h on night two |
| Total | 48 h | 192 h | |

Bug time is 9 h per person (36 person-hours): the three checkpoints plus the freeze window. That is 23% of waking hours and it is not available for features. If a checkpoint overruns, cut scope from section 7. Do not borrow from the next checkpoint.

## 2. Lanes

The PDF lists five roles (section 10.1). With four people, pitch work is shared and the Living Map moves to Cristea.

| Person | Lane | Owns |
|---|---|---|
| Ionut | Phone experience | join, primer, sensors, geofence, demo mode, colour lens, echo recorder, between-sites screens, memorial candle |
| Patrick | Sound and voice | ElevenLabs agent, voices, generation script, Web Audio engine, Talk station, navigation sound, Lamp station |
| Fabi | Data and real-time | Tiger schema, events API, Socket.IO, glow loop, panes and windows, Pulse, crowd simulator, clock offset |
| Cristea | Identity, infra, Living Map | repo, deploys, design tokens and base components, Auth0, sessions, curator console, add-a-place, `/screen` and its map lines |

Each person merges to `main` through small pull requests. `main` auto-deploys, so a broken `main` blocks phone testing for everyone: fix or revert within 15 minutes.

## 3. Decisions that save hours

| Decision | Instead of | Reason |
|---|---|---|
| Socket.IO | raw `ws` | rooms and reconnect come built in |
| `pg` with plain SQL files | an ORM | the Tiger judges read the SQL; migrations are numbered `.sql` files run by one script |
| Canvas 2D for `/screen` | PixiJS, MapLibre | five sites and a few hundred panes do not need a renderer |
| Web Audio API directly | Tone.js | we need panner, low-pass, gain and playbackRate, all native |
| JSON dictionary and one `t()` function | an i18n library | two or three languages, flat keys |
| Recharts, plus hand-written SVG arcs for the colour clock | several chart libraries | one dependency |
| Audio for the five seeded sites committed in `apps/web/public/audio` | object storage | served by the Vercel CDN, zero setup |
| Echo uploads and add-a-place audio in a Postgres `blobs` table (bytea), served by `GET /blob/:key` | Cloudflare R2 | removes a whole service. Limit: fine for tens of MB, move to object storage after the event |
| `glow_k` set by hand in the seed | nightly calibration job | calibration needs 28 days of data. Keep the SQL from section 11.2 F in the repo, run it by hand |
| Curator approval only | automatic echo screening, Whisper backup | a human already listens to every echo before it plays |
| Voice Changer: no | the open question in section 11.1 | costs credits per echo and adds a processing step |
| Zod schemas in `packages/shared` | hand validation | one schema validates the API body and types the client |
| Server assigns event weights | client sends weights | the client is not trusted to set its own glow |
| `tokens.css` plus CSS Modules | Tailwind | Vite supports CSS Modules with no setup; `DESIGN.md` tokens are plain CSS custom properties |
| `qrcode` npm package | one QR library per screen | draws to canvas on `/screen` and to SVG in the console |
| Seeded sites built into the web app as `packages/shared/sites.json` | `GET /sites` before the first screen | the join screen never waits on a cold Render API. Glow still arrives over the socket |
| Map lines traced from OpenStreetMap as lat/lng polylines | map tiles | the Bega and the Cetate ring, projected like the sites, credited "© OpenStreetMap contributors" on `/screen` |
| Auth0 Universal Login with logo and amber primary colour | custom fonts and full theming | only curators and "Keep my colours" visitors see it |

Phone sensors need HTTPS. From hour 2, test on real phones against the deployed URL (or a tunnel to the dev server). Do not wait for a checkpoint to find out that iOS rejected a permission call.

The ElevenLabs sketches in section 11.1 come from research. Patrick checks method names, signed-URL flow and credit prices against the current docs in the first two hours, before anyone builds on them.

## 4. Before hour 0

Only if the rules allow preparation. None of this is code.

- Accounts created and keys in a shared vault: ElevenLabs (paid month started), Tiger Cloud, Auth0 tenant, Vercel, Render, GitHub repo with secret scanning on.
- Content for the four persona sites (Muzeul MX Corneliu Miklosi, Piața Unirii, Piața Victoriei, Theresia Bastion with the Bega) as YAML in the format of section 8.3: coordinates, facts with sources, persona traits, first message, three tap-to-ask questions with answers, sound-bed prompt, direction hint. Romanian and English at minimum. Each persona also gets one plain, pre-written sentence pointing visitors to the Cathedral, with no jokes; personas never improvise about 1989.
- Content for the Metropolitan Cathedral as YAML with `is_memorial: true`: coordinates, direction hint, a quiet sound-bed prompt, and three to five short narrations of published accounts of December 1989, each with its source. No persona, no tap-to-ask. A team member checks every narration against its source before hour 0.
- Devices: one iPhone, one Android, a laptop with HDMI for `/screen`, a speaker, a mobile hotspot.

If content is not ready at hour 0, Patrick loses the overnight generation slot and Talk fallback slips a full block.

## 5. Timeline

Hours are relative to the start. The sleep windows assume a start around midday. Slide them to your real nights, but keep the order: each sleep follows a build block and is followed by a checkpoint.

| Hours | Phase | Length |
|---|---|---|
| 0 to 2 | Setup | 2 h |
| 2 to 10 | Build 1: the spine | 8 h |
| 10 to 12 | Checkpoint 1 | 2 h |
| 12 to 18 | Build 2: Colours and Talk | 6 h |
| 18 to 24 | Sleep. Batch audio generation runs unattended | 6 h |
| 24 to 25 | Checkpoint 2 | 1 h |
| 25 to 32 | Build 3: Echo, navigation, Lamp, Pulse, sign-in | 7 h |
| 32 to 34 | Checkpoint 3 | 2 h |
| 34 to 37 | Sleep | 3 h |
| 37 to 40 | Build 4: demo extras | 3 h |
| 40 | Feature freeze | |
| 40 to 44 | Bugs only, iOS and Android pass, load test | 4 h |
| 44 to 46 | Backup video, README, sponsor write-ups | 2 h |
| 46 to 48 | Two timed rehearsals, submit, slack | 2 h |

## 6. Phases

### Setup (hours 0 to 2)

| Who | Task |
|---|---|
| Cristea | npm workspaces: `apps/web` (Vite, React, TypeScript), `apps/api` (Express, TypeScript), `packages/shared`. Web on Vercel, API on Render, both deploying from `main`. `.env.example`, no `.env` in git |
| Fabi | Tiger service. Migration 001: extensions, `sites`, `windows`, `panes`, `echoes`, `blobs`, `interaction_events` hypertable. `npm run db:reset` rebuilds schema, seeds the five sites from YAML and writes `packages/shared/sites.json` |
| Patrick | Verify ElevenLabs docs and prices. Create the one agent template with overrides enabled. Fetch a signed URL from a script |
| Ionut | Routes: `/`, `/s/:siteId`, `/screen`, `/pulse`, `/curate`. Typed API client. Vitest running |
| All | 30 minutes on the contract, written into `packages/shared`: event kinds (`wake`, `talk_turn`, `colour`, `lamp`, `candle`, `echo_approved`, `echo_heard`, `arrived`) and socket messages (`glow`, `pane`, `window_complete`, `echo_approved`, `lamps` with a per-site count of people lighting now, `candle`, `finale`). Remote mode is `/?mode=remote` |

Done when the deployed URL opens over HTTPS on both phones and `npm run db:reset` works from a clean database.

### Build 1: the spine (hours 2 to 10)

Goal: a tap on a phone changes what `/screen` shows.

| Who | Task | Hours |
|---|---|---|
| Ionut | Landing at `/s/:siteId` and the primer: one tap requests location and compass (iOS `requestPermission`) and resumes the AudioContext | 2 |
| Ionut | `useGeolocation`, `useCompass` (iOS and Android paths), `useGeofence` with the hysteresis recipe from section 9.7, plus geo helpers with tests | 2.5 |
| Ionut | Demo mode: `?demo=1` injects position and heading | 1 |
| Ionut | Site view from `sites.json`: asleep or awake from glow, entry points for the four interactions (memorial site: listen and candle only), `wake` event, client batching to `POST /events` every 2 s | 1 |
| Patrick | Voices for the four personas. Prompt renderer from Appendix A | 1.5 |
| Patrick | `scripts/publish-site.ts`: greeting and tap-to-ask clips per language, two takes of each sound bed, files named by input hash so nothing is paid for twice. For a memorial site: narrations in a calm narrator voice instead of persona clips | 3.5 |
| Patrick | Project-wide sounds: glass tone, lamp crackle, arrival chime, waltz | 0.5 |
| Patrick | Audio engine v1: unlock on tap, load and loop a bed, gain follows glow | 1.5 |
| Fabi | `POST /events`: Zod validation, server-side weights, batch insert | 1.5 |
| Fabi | Socket.IO `/live` with rooms `city`, `site:<id>`, `screen`. Broadcast on insert | 1.5 |
| Fabi | `site_activity_1m` continuous aggregate, the glow query, the 5 s loop that pushes glow to all clients. Test for the decay maths | 2.5 |
| Fabi | `GET /sites?near=` with PostGIS, `GET /sites/:id` | 1 |
| Cristea | Design tokens first: `tokens.css`, the two self-hosted fonts (`@fontsource/atkinson-hyperlegible-next`, `@fontsource/piazzolla`), the nine icons, Button, Notice, Ring, RoundControl, as `DESIGN.md` specifies. Everyone styles against these | 2.5 |
| Cristea | Auth0 tenant: SPA app, API with RBAC and permissions in the token, roles, passwordless and passkey | 1.5 |
| Cristea | `POST /session/anon` (signed JWT, 24 h), `requireVisitor` middleware that accepts the anon token or an Auth0 token, rate limiting | 2 |
| Cristea | `/screen` v1: sites placed by projecting lat and lng onto the canvas, brightness follows glow, live over the socket | 3 |

### Checkpoint 1 (hours 10 to 12)

Everyone stops building. Pass when all of these hold on the deployed build:

1. On the iPhone and on the Android, one tap grants location and compass and a sound bed plays.
2. The `wake` event is a row in `interaction_events`.
3. `/screen` brightens that site within 5 seconds.
4. `npm test` is green.
5. Ten minutes outdoors in daylight with both phones: the dark theme's text is readable on the join and site screens. If not, raise it with the team before Build 2.

Expect the two hours to go to iOS permissions, CORS, sockets on Render and continuous aggregate lag.

### Build 2: Colours and Talk (hours 12 to 18)

Goal: the two stations the demo is built around.

| Who | Task | Hours |
|---|---|---|
| Ionut | Colour lens: rear camera, 64x64 centre sample 10 times a second, 12 hue bins weighted by saturation x brightness, night-glass fallback. Test for the bin picker with fixed pixel arrays | 3.5 |
| Ionut | Hold steady for 2 s (colour distance plus rotation rate), `POST /panes`, vibration where supported, caught-pane feedback | 1.5 |
| Ionut | Colour names: one ro and en name per hue bin, shown under the caught swatch | 0.25 |
| Patrick | Talk, live: `GET /agent/session`, `useConversation`, client tools (`show_archive_image`, `set_light`, `start_colour_catch`, `start_echo_recording`, `suggest_next_site`), captions | 3 |
| Patrick | Talk fallback: tap-to-ask with pre-generated clips, browser speech synthesis as last resort, automatic switch on agent error | 1.5 |
| Patrick | Colour to note: hue to pentatonic step, lightness to octave, via `playbackRate` on the glass sample | 0.5 |
| Fabi | `POST /panes`: rate limit, slot assignment, window completes at 48, archive and open a new one, broadcast. Test for slot and completion logic. `GET /screen/state` for `/screen` on reconnect | 2.5 |
| Fabi | `colour_readings` hypertable and the `colour_1h` aggregate | 0.5 |
| Fabi | Agent server tools `get_site_stats` and `get_recent_echo`, behind a shared-secret header. The same site stats passed to `GET /agent/session` | 1 |
| Fabi | `scripts/simulate-crowd.ts`, minimal: fake sessions sending events and panes. Everyone uses it from here on to develop without phones | 1 |
| Cristea | `GET /agent/session`: signed URL, per-site overrides, dynamic variables, rate limit. The API key never reaches the browser | 1.5 |
| Cristea | `/screen` v2: each site draws its window with 48 slots, panes appear on the socket message, ticker, counters | 3.5 |
| Cristea | Map lines: trace the Bega and the Cetate ring from OpenStreetMap as about five polylines in `packages/shared`, draw them once to the static layer, add the OSM credit | 0.75 |

Before sleeping, Patrick starts `publish-site.ts` for all five sites.

### Checkpoint 2 (hours 24 to 25)

1. A colour caught on a phone appears as a pane on `/screen` within one second.
2. The crowd simulator fills a window to 48, it completes, and a new one starts.
3. Live Talk answers on a phone and at least one client tool fires.
4. With the ElevenLabs key removed, Talk falls back to tap-to-ask without a reload.
5. Patrick has listened to every generated bed and picked a take.

### Build 3: Echo, navigation, Lamp, Pulse, sign-in (hours 25 to 32)

| Who | Task | Hours |
|---|---|---|
| Ionut | Echo recorder: MediaRecorder (webm on Chrome, mp4 on Safari), 20 s cap, consent checkbox, upload | 1.5 |
| Ionut | Between sites: arrow and distance, sites list with distance and glow, next-site score from section 7.7, Google and Apple Maps links | 2.5 |
| Patrick | Lamp: raise gesture (pitch above 60 degrees for 1.5 s, below 40 to lower), full-screen light, Wake Lock, `lamp` events per minute held, city counter and "people lighting this site now" | 2 |
| Patrick | Lamp pulse: every lit phone pulses on a slow 4 s cycle aligned to server time through the clock offset | 0.5 |
| Patrick | Navigation audio: sound compass for the 2 to 3 nearest sites (HRTF panner from bearing minus heading, low-pass by distance), beacon for the chosen site, arrival chime, 12 dB ducking under the persona voice | 3.5 |
| Patrick | Approved echoes play as whispers from the site's direction | 1 |
| Patrick | Room sound on `/screen`: each bed at gain equal to glow, panned by map position | 1.5 |
| Fabi | Lamps lit today: query and broadcast | 1 |
| Fabi | People lighting now: distinct sessions with a `lamp` event at each site in the last 90 s, sent per site in the `lamps` message | 0.5 |
| Fabi | Clock offset endpoint (5 pings, lowest RTT), moved here from Build 4 for the lamp pulse | 0.5 |
| Fabi | `candle` events and broadcast; Pulse shows the memorial's candles as marks with no numbers | 0.5 |
| Fabi | `GET /pulse/*`, cached 5 s: glow, gap-filled interactions, unique visitors with hyperloglog, colour clock, languages | 2.5 |
| Fabi | `/pulse` page: charts and the colour clock ring | 2 |
| Fabi | Post-call webhook with HMAC check into `conversations` | 0.5 |
| Cristea | `POST /echoes`: multipart upload, store in `blobs`, Scribe transcript, status `pending` | 2 |
| Cristea | Approve and reject endpoints behind `moderate:echo`, broadcast on approval. Test: the endpoint returns 403 without the permission | 1 |
| Cristea | Post-login Action: roles claim, MFA forced for curator and admin | 0.5 |
| Cristea | Curator console v1: queue with audio player, transcript, approve, reject | 2 |
| Cristea | Keep my colours: `loginWithRedirect`, then `POST /me/claim` moves anonymous rows to the Auth0 subject | 0.5 |
| Cristea | Memorial on `/screen`: candle points at the Cathedral that fade over the same hours as glow, a quiet ticker line, no number, no room sound | 0.5 |

### Checkpoint 3 (hours 32 to 34)

Run the demo script from section 10.4, steps 0:00 to 1:40 plus the Pulse step and the memorial step from the v5 addendum, twice from a cold start, with the crowd simulator running. Write down every break. Fix it, or cut the feature and adjust the script. Then decide which Build 4 rows to attempt, using the cut order in section 7.

### Build 4: demo extras (hours 37 to 40)

Three hours, so each person gets one main item. Anything not working at hour 40 is cut and the demo uses the fallback in the last column.

| Who | Task | Hours | Fallback if cut |
|---|---|---|---|
| Ionut | Language dictionary for ro and en, picked from `navigator.language` | 1.5 | English only |
| Ionut | Memorial candle: lights after 60 s of stillness measured by motion only (no microphone), 5 s with `?demo=1`, sends a `candle` event | 1 | a tap lights the candle; the memorial site itself is never cut |
| Patrick | 1884 finale cue on phones and `/screen`: crackle, silence, waltz, started at a shared server time | 1.5 | play the waltz on `/screen` only |
| Patrick | One Radio Lampa episode, generated once from today's numbers (first to cut) | 1 | skip |
| Fabi | Finale trigger at 731 lamps, using the clock offset from Build 3 | 0.5 | broadcast "start now" without sync |
| Fabi | Compression and retention policies. `EXPLAIN ANALYZE` of raw table against aggregate, numbers into the README | 1 | policies only |
| Fabi | `npm run demo:reset`: clean state, one window at 47 of 48, lamps just under 731 | 0.5 | not optional, do this first |
| Cristea | Add a place: form in the console (use my location, name, facts, persona), `POST /sites` and `/sites/:id/publish` behind `write:site`, calling the same publish code as the script. QR code for the new URL | 2.5 | show a pre-filled form and a pre-published sixth site |

### Freeze (hours 40 to 44)

No new features. Work the bug list from the three checkpoints, in the order the demo script hits them.

- Full demo script on the iPhone and the Android, twice each, including the Build 4 items that survived.
- `/screen` runs 30 minutes with sound and no reload, while `simulate-crowd` sends about 2,000 visitors.
- Wake the Render API and confirm the cold-start time. Keep a tab pinging it until the pitch.
- Grep the built bundle for key prefixes. Confirm `.env` was never committed.

### Submission (hours 44 to 48)

| Hours | Work |
|---|---|
| 44 to 46 | Record the backup video. README: setup, architecture, one section per sponsor with links to the exact files (section 11.5) |
| 46 to 47 | Two rehearsals with a timer, on the hotspot, not the venue Wi-Fi |
| 47 to 48 | Submit. The remaining time is slack |

## 7. Scope

### In, and built in this order

1. Anonymous session, five seeded sites (four with personas, the Cathedral memorial), join by link or QR, demo mode.
2. Events into Tiger, glow from the continuous aggregate, live `/screen`.
3. Colours of the City with windows.
4. Talk, live and with the tap-to-ask fallback.
5. Echo with curator approval behind Auth0 roles and MFA.
6. Sound navigation, arrow, sites list, Maps links.
7. Lamp and the lamps counter.
8. Pulse dashboard with the colour clock.
9. Passkey or passwordless sign-in that keeps anonymous contributions.
10. The Cathedral memorial: narrated testimonies, the candle, candles on `/screen` and `/pulse`.
11. Lamp extras: people lighting now, and phones pulsing together.

### The memorial site

The Metropolitan Cathedral follows the concept's memorial rules (sections 1.12 and "A minute of stillness"): no persona character, no game, no counter.

- Visitors can listen to the narrations and light a candle. Talk, the colour lens, the lamp and visitor echoes are not offered there.
- The candle lights after 60 s of stillness, measured by motion only, so no microphone prompt appears at a memorial. Demo mode shortens it to 5 s.
- `/screen` shows candles as small points that fade like glow, with a quiet ticker line. No rose window, no number, no room sound.
- `/pulse` shows candles as marks without numbers.
- In navigation it is treated like any site: sites list, arrow, Maps links, sound compass, next-site score. Personas mention it only with their one pre-written sentence.
- The demo script gets a step of about 15 s at the Cathedral (see the v5 addendum).

### Cut order when behind

Cut from the top. Each line names what the demo loses. The memorial site is not in this list: if its stillness check fails, a tap lights the candle.

1. Radio Lampa episode: loses the closing gag.
2. Post-call webhook and the languages chart: Pulse shows one chart fewer.
3. Clock-synced finale: `/screen` plays the finale alone.
4. Language dictionary: English UI, personas still answer in the visitor's language.
5. Add a place, live: becomes a pre-filled form.
6. Echo whispers on phones: echoes still play on `/screen`.
7. Sound compass for several sites: keep the single beacon and the arrow.
8. Passkey sign-in and claim: curators still sign in, visitors stay anonymous.

Do not cut below this line. Items 1 to 5 of the "In" list are the demo.

### Left out

Service worker and offline cache (stale-cache bugs in the last hours cost more than it saves; use the hotspot), device flow for pairing screens, the Me page and delete-my-data, QR poster PDF, place nominations, temporary places, ambient loudness, Paint with Light, Bega Time River, street routing, Organizations, pgvector, Voice Changer, dubbing, nightly music.

Delete-my-data is a privacy promise in the concept. It is out of the hackathon build, so do not claim it in the pitch.

## 8. Tests

Small, and only where a silent bug would break the demo.

| Test | Owner |
|---|---|
| `bearing`, Haversine, geofence enter and exit with accuracy | Ionut |
| Hue-bin colour picker on fixed pixel arrays | Ionut |
| Glow decay: known events at known times give the expected value | Fabi |
| Pane slot assignment and window completion at 48 | Fabi |
| Moderation endpoint returns 403 without `moderate:echo` | Cristea |
| Anonymous token: expired or tampered tokens are rejected | Cristea |
| `/screen` projection: the five sites land inside the map area, and no two are closer than 2.4R after the spacing rule | Cristea |

`npm test` runs before every checkpoint. Everything else is verified by the checkpoint lists on real phones.

## 9. Schedule risks

| Risk | What it costs | What we do |
|---|---|---|
| iOS refuses a sensor or audio call made outside a tap | hours, found late | Ionut tests on the iPhone from hour 2, not at the checkpoint |
| ElevenLabs API differs from the PDF sketches | Patrick's Build 1 and 2 | docs check in Setup. Tap-to-ask needs only plain TTS, so it survives |
| Credits run out during development | no live Talk at the demo | develop against the recorded clips. Live conversation only at checkpoints and rehearsals |
| Render free tier sleeps and drops sockets | a dead `/screen` on stage | keep-alive tab. Socket.IO reconnect, then refetch state on reconnect |
| Continuous aggregate lags behind new events | glow looks frozen | `materialized_only = false` in migration 002, which creates the aggregate in Build 1; verified at checkpoint 1 |
| Auth0 passkey and MFA setup takes longer than 2 h | Cristea falls behind on `/screen` | email code first, passkey only if the tenant accepts it quickly |
| One lane blocks another | idle people | the contract from Setup, plus `simulate-crowd` so nobody waits for a phone |
| Cristea is over budget: Build 1 holds about 9 h of tasks in an 8 h block | `/screen` v1 late for Checkpoint 1 | accepted by the team. Tokens ship first because everyone styles against them; if Cristea is still behind at Checkpoint 3, add-a-place falls back to the pre-filled form |
| A narration about 1989 contains an error | harm to people who lived it, and to the project's credibility | every narration is checked against its cited source before hour 0; no generated text about 1989 is improvised at runtime |

## 10. Done

From section 10.7, checked at hour 44:

- A stranger opens the link on iOS or Android and hears a site within 10 seconds.
- A caught colour reaches the right window on `/screen` within a second.
- `/screen` runs 30 minutes without a reload, with sound.
- No secrets in the repo or the bundle. `npm run db:reset` rebuilds schema and seed.
- README, backup video and two timed rehearsals are finished.

"A new place published in under 5 minutes" counts only if Build 4's add-a-place row survived the freeze.

## 11. Per member

The same tasks as section 6, regrouped so each person can read their own 48 hours top to bottom. Checkpoints, freeze and submission (section 5) are shared by all four and are not repeated here. In earlier versions of this plan Ionut was P1, Patrick was P2, Fabi was P3 and Cristea was P4.

### Ionut: phone experience (18.25 h of tasks)

| Block | Task | Hours |
|---|---|---|
| Setup | Routes, typed API client, Vitest | 2 |
| Build 1 | Landing and primer: one tap for location, compass and audio | 2 |
| Build 1 | `useGeolocation`, `useCompass`, `useGeofence`, geo helpers with tests | 2.5 |
| Build 1 | Demo mode with injected position and heading | 1 |
| Build 1 | Site view from `sites.json`, `wake` event, event batching | 1 |
| Build 2 | Colour lens with the hue-bin picker and its test | 3.5 |
| Build 2 | Hold steady, `POST /panes`, vibration, caught-pane feedback | 1.5 |
| Build 2 | Colour names for the 12 hue bins | 0.25 |
| Build 3 | Echo recorder: 20 s cap, consent, upload | 1.5 |
| Build 3 | Between sites: arrow, distance, sites list, next-site score, Maps links | 2.5 |
| Build 4 | ro and en dictionary (a native speaker reviews the Romanian strings first) | 1.5 |
| Build 4 | Memorial candle: motion-only stillness, 5 s in demo mode | 1 |

Needs from others: `POST /events` and `GET /sites` from Fabi by hour 6, `POST /panes` from Fabi by hour 15, `POST /echoes` from Cristea by hour 28. Until each lands, code against the Zod schema in `packages/shared`.

### Patrick: sound and voice (23 h of tasks)

| Block | Task | Hours |
|---|---|---|
| Setup | ElevenLabs docs and price check, agent template, signed URL from a script | 2 |
| Build 1 | Four persona voices, prompt renderer | 1.5 |
| Build 1 | `scripts/publish-site.ts`, including the memorial narrator | 3.5 |
| Build 1 | Glass tone, crackle, chime, waltz | 0.5 |
| Build 1 | Audio engine v1: unlock, loop a bed, gain from glow | 1.5 |
| Build 2 | Talk, live, with the five client tools and captions | 3 |
| Build 2 | Talk fallback: tap-to-ask clips, browser voice last | 1.5 |
| Build 2 | Colour to note mapping | 0.5 |
| Before sleep | Start batch generation for all five sites | |
| Build 3 | Lamp: raise gesture, Wake Lock, `lamp` events, city counter, people lighting now | 2 |
| Build 3 | Lamp pulse on the shared clock | 0.5 |
| Build 3 | Navigation audio: sound compass, beacon, chime, ducking | 3.5 |
| Build 3 | Echo whispers from the site's direction | 1 |
| Build 3 | Room sound on `/screen` | 1.5 |
| Build 4 | 1884 finale cue at a shared server time | 1.5 |
| Build 4 | One Radio Lampa episode (first to cut) | 1 |

Needs from others: site content YAML at hour 0, `GET /agent/session` from Cristea by hour 14, heading and position from Ionut's hooks by hour 25, the clock offset and the per-site lamp count from Fabi in Build 3.

### Fabi: data and real-time (21 h of tasks)

| Block | Task | Hours |
|---|---|---|
| Setup | Tiger service, migration 001, `npm run db:reset` with seed | 2 |
| Build 1 | `POST /events` with validation and server-side weights | 1.5 |
| Build 1 | Socket.IO `/live` with rooms | 1.5 |
| Build 1 | Continuous aggregate, glow query, 5 s loop, decay test | 2.5 |
| Build 1 | `GET /sites?near=`, `GET /sites/:id` | 1 |
| Build 2 | `POST /panes`, windows, completion at 48, test, `GET /screen/state` | 2.5 |
| Build 2 | `colour_readings` and `colour_1h` | 0.5 |
| Build 2 | Agent server tools behind a secret header, site stats for `GET /agent/session` | 1 |
| Build 2 | `simulate-crowd.ts`, minimal | 1 |
| Build 3 | Lamps lit today: query and broadcast | 1 |
| Build 3 | People lighting now, per site | 0.5 |
| Build 3 | Clock offset endpoint | 0.5 |
| Build 3 | `candle` events, candle marks on Pulse | 0.5 |
| Build 3 | `GET /pulse/*` | 2.5 |
| Build 3 | `/pulse` page with the colour clock | 2 |
| Build 3 | Post-call webhook (first to cut) | 0.5 |
| Build 4 | `npm run demo:reset` (do this first) | 0.5 |
| Build 4 | Finale trigger | 0.5 |
| Build 4 | Compression, retention, `EXPLAIN ANALYZE` numbers | 1 |

Needs from others: `requireVisitor` middleware from Cristea by hour 6. Everyone else depends on this lane first, so `POST /events` and the socket ship before anything else in Build 1.

### Cristea: identity, infra, Living Map (23.75 h of tasks, over budget by agreement)

| Block | Task | Hours |
|---|---|---|
| Setup | Workspaces, Vercel and Render deploys, `.env.example` | 2 |
| Build 1 | Design tokens, fonts, icons, Button, Notice, Ring, RoundControl | 2.5 |
| Build 1 | Auth0 tenant, apps, API, roles, passwordless | 1.5 |
| Build 1 | Anonymous session token, `requireVisitor`, rate limiting, token test | 2 |
| Build 1 | `/screen` v1: sites on canvas, brightness from glow | 3 |
| Build 2 | `GET /agent/session` | 1.5 |
| Build 2 | `/screen` v2: windows, panes, ticker, counters | 3.5 |
| Build 2 | Map lines from OpenStreetMap | 0.75 |
| Build 3 | `POST /echoes` with storage and transcript | 2 |
| Build 3 | Approve and reject behind `moderate:echo`, 403 test | 1 |
| Build 3 | Post-login Action with MFA for staff | 0.5 |
| Build 3 | Curator console: echo queue | 2 |
| Build 3 | Keep my colours and `POST /me/claim` | 0.5 |
| Build 3 | Memorial candles and ticker line on `/screen` | 0.5 |
| Build 4 | Add a place: form, endpoints, QR code | 2.5 |

Needs from others: socket messages from Fabi by hour 6, the signed-URL call and Scribe snippet from Patrick, `publish-site.ts` as an importable function from Patrick for add-a-place.

## Where styling hours come from

Task estimates above produce unstyled, working screens. `DESIGN.md` puts the required styling at about 9.75 person-hours, which does not fit the 2 free hours left in Build 4.

So each owner styles a screen in the same block where they build it, out of that block's slack, using the tokens and base components Cristea ships at the start of Build 1. `DESIGN.md` section 9 lists each styling item with its owner. If a block's slack runs out, cut from the top of the cut order (Radio Lampa first). Do not take styling time from checkpoints or the freeze window.

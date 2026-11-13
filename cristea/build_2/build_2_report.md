# Report: Cristea's Build 2, Colours and Talk (Identity, infra, Living Map, LAMPA)

Written at hour 18, 2026-11-13. `main` at `1d5c1a3`. PR #15 merged; PR #21 (`cristea/b2-screen`) open, Vercel check passing, mergeable.

## Done

| ID | Verify | Commit |
|---|---|---|
| B2-0 | baseline API `11 passed`, web `76 passed`; after the seam the same chain → exit 0 | 35bfacf |
| B2-1.a.1 | no ElevenLabs env: `agent_unavailable` 503, `no_persona` 404, 401; API starts without the key | 30d539d |
| B2-1.b.1 | API `31 passed` (18 cases plus 2 for the 503 answer); returning the upstream body fails 2 cases | a990546, e40b0b4 |
| B2-3.a.1 | `bega:59 ring:59`; the ring is variant A, every point from OSM | 4d35961, a365a99 |
| B2-3.b.1 | web `81 passed`, 15 projection cases, hex 0; `MIN_SPACING = 0` fails 5 cases; screenshots at both sizes | ad51220, f1bba1f |
| B2-2.a.1 | 23 cases pass; `applyPane` without the site check fails 2 cases | 7e87619 |
| B2-2.b.1 | web `109 passed`, no `useGlowSocket`; then `sites` from `@lampa/shared` | 42cb851, 75ebc3a |
| B2-2.c.1 | web `152 passed`, hex 0; demo watched about 2 minutes: fill, flash, ring, one flare and empty | 4466c0c |
| B2-2.d.1 | web `157 passed`, hex 0; screenshots at both sizes; QR grid matches `/?mode=remote` with 0 mismatches | 61e3f55 |
| B2-last | throwaway merge with `main` (#15 to #19), clean install: API `37 passed`, web `169 passed`; production preview of `/screen?demo=1` has no console message; deployed `/agent/session`: `no_persona` 404, `unauthorized` 401, `agent_unavailable` 503 | 43e01d7, f2df14a |

Nothing from the cut order was cut: the QR code, the flare, the pane ring and the map lines all shipped.

## Changes from the prompt

- A rejecting `getPersona`, or session data that fails the schema, answers 503 `agent_unavailable` (Cristea's answer).
- The Bega was committed before the ring, and the ring got its own commit.
- The projection file holds 15 cases, not 14, because Build 1 left ten.
- `ticker.ts` is `tickerCopy.ts`. On Windows, `ticker.ts` and `Ticker.tsx` resolve to the same file.
- The ticker shows the newest whole lines that fit: about 2 two-row lines at 1080, not six.
- Each window sits on a `--bg` disk, so the gaps between the rings are leading.
- The slot leading is `max(1.5 × dpr, 0.012 × R)`.
- The DemoBadge sits top-left of the map in a `.demo` class, with Ionut's text.

## Blocked

- **Live Talk (Checkpoint 2, lines 3 and 4):** the env vars are on Render and the deployed route returns a signed URL.
  - Left: one live session with Patrick (a client tool fires), then the tap-to-ask fallback with the key removed. Patrick turns on the four overrides before `getPersona` lands.
- **Live panes (Checkpoint 2, lines 1 and 2):** waiting for Fabi's `/live`, `POST /panes` and `GET /screen/state`.
- **Schemas:** the team still has to agree `PaneMessage`, `WindowCompleteMessage`, `ScreenState`, `AgentSession` and `AgentLang`.
- **Patrick's lane:**
  - Patrick passes `getPersona` to `createAgentRouter`.
- **Fabi's lane:** Fabi passes `getSiteStats` to `createAgentRouter`.

## Not finished at hour 18

Nothing in code. The rest is the open checks above and the screen and phone checks below.

## Screen and phone checks for Cristea

- **On the HDMI laptop, after #21 is merged:**
  - `/screen?demo=1`: river, ring, credit, windows filling, ticker, counters and QR code, read from across the room.
  - `/screen` without demo: empty windows, "Waiting for the first visitor tonight.", and `...` in both counters.
- **Watch in real time:** the shared test browser painted about one frame per second, so these have not been seen as they run:
  - the flare's hold
  - the ticker's completion line and its 400 ms fade
  - reduced motion
- **The screen's shape:** at a 2:1 viewport, the bottom of the map (the Cathedral) was cut off and no ticker line fit. Check the room screen is 16:9.
- **Scan the QR code** with the iPhone.

## For the checkpoint

- **Fabi:**
  - `/screen` expects `pane` and `window_complete` on `/live` in `room: "screen"`.
  - It fetches `GET /screen/state` with no header on every connect.
- **Patrick:** `GET /agent/session` answers 404, 429 or 503 when Talk should fall back to tap-to-ask.
- **The map lines** were traced with the fixture's coordinates, which equal `sites.json`. If `sites.json` changes, re-trace them and re-take the spacing screenshots.

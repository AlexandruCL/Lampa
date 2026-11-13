# Build 2 report: Colours (Ionut, Phone experience)

Written at hour 5 (2026-11-13, about 19:10 +0200). Prompt: `ionut/build_2/build_2_prompt.md`. Glossary: `ionut/GLOSSARY.md`.

## Done

| ID | Verify | Commit |
|---|---|---|
| B2-0 | Baseline on `a10caf0`: `npm run typecheck && npm run build && npm test` → exit 0, web `Tests  76 passed (76)`, api `Tests  11 passed (11)`, no failures already there. Seam narrowed to `PaneIn` and `PaneAccepted` (Ionut's decision: Cristea's PR #15 already exported `PaneMessage` and `WindowCompleteMessage`) | 34207bf |
| B2-2.b.1 | `npx vitest run src/colour/panes.test.ts` → `Tests  11 passed (11)`; a 429 that waits fails its case | 33ce0d7 |
| B2-1.a.1 | `Tests  27 passed (27)` over bins, picker, panes; `NIGHT_GLASS_SHARE` 0.06 and averaging every pixel each fail their cases | 502f3e7 |
| B2-3.a.1 | `Tests  5 passed (5)`; a null bin named as bin 0 fails its case | 3cf60c6 |
| B2-2.a.1 | Full verify exit 0, web `Tests  119 passed (119)`; breaking at distance ≥ 48 and catching at 1999 ms each fail their cases | 3f3d53e |
| (rebase) | `bins.ts`, `names.ts` re-export from `@lampa/shared` after PR #15 (Ionut's decision); web 119, api 31, exit 0 | 4a86675 |
| B2-1.b.1 | `npm run test -w @lampa/web -- src/sensors` → `Tests  22 passed (22)`; centring the square at half height fails "… starts at 608, 270" | 2e01e10 |
| B2-1.c.1 | `✓ built in 410ms`, `Tests  127 passed (127)`, hex grep `0`; fake-camera run of reading, night glass, denied with retry, no camera, both back controls | 40a02ac |
| B2-2.c.1 | `✓ built in 499ms`, `Tests  131 passed (131)`, hex grep `0`; a reducer that keeps old panes fails "a pane of a new window clears the old panes"; every `PaneStatus` state seen with a mocked API (below) | 36e0f4e |
| B2-last | PR #17 merged (`f9d271c`); `ionut/b2-lens` rebased on `main`; this report | this commit |

Review rounds on agent work, all fixed before the commit: the Ring sat 20px off the lens centre; a `role="status"` around the live colour name would have announced 10 readings a second; the catch sent the latest reading instead of the hold's first; the offline Notice's 3 s timer restarted on every 2 s retry and never showed; "Try again" after a hidden page kept a stale hold and caught 230 ms after the tap (fixed in `36ff405`: now 2283 ms). Also in `36ff405`, by Ionut's decision: a caught view survives a hidden page.

What `POST /panes` sent in the mocked run (canvas camera `#3a7bd5`): `{"siteId":"unirii","hue":214.8387096774194,"saturation":0.6485355648535565,"lightness":0.5313725490196078,"hex":"#3a7bd5","bin":7,"at":"2026-11-13T17:00:58.334Z"}`, one request per catch. It comes out of `toPaneIn`, which runs `PaneIn.parse`.

States seen with Playwright mocks (not a real API): 201 → "Your colour is in the Piața Unirii window. 6 of 48." and the announcement "Colour caught. 6 of 48 in the Piața Unirii window."; completed → "You completed the window."; 503 → "Not sent yet. Trying again."; 429 → the rate-limit line, lens at 0.4, no Ring; 404 → swatch and name only; network error → "Saved on this phone. It sends when you are back online." at once and the connection Notice after 3 s.

## Blocked

- **`POST /panes`** (Fabi): not on `main`, deployed API → 404. Recommendation: validate `PaneIn`, record the `colour` event with the server's weight, answer 201 `PaneAccepted` or 429 with `Retry-After`.
- **`pane` and `window_complete` on `/live`** (Fabi): not sent; `/socket.io/` → 404. Recommendation: send `PaneMessage` to `site:<id>` and to `screen` after each accepted pane.
- **`bin` on `PaneMessage`** (Cristea, Ionut asks): without it `/screen` names a night-glass catch by its tinted hex. Recommendation: add `bin` nullable 0 to 11; Fabi copies it from `PaneIn`.
- **Sound callbacks** (Patrick): `ColourLens` takes `onReading`, `onCaught`, `onComplete`; nothing passes them yet.
- Still open from Build 1: `POST /events` and `/live` (Fabi); the sound bed (Patrick).

## Not finished at hour 18

Nothing cut, nothing carried over. All IDs are done. After Ionut's `npm ci` (needed for `pg` and `yaml` from Fabi's PR #16), `ionut/b2-lens` on `main` `387c717`: `npm run typecheck && npm run build && npm test` → exit 0, `✓ built in 435ms`, web `Tests  131 passed (131)`, api `Tests  37 passed (37)`.

## Phone checks for Ionut

- iPhone, deployed build: `/s/unirii` → tap → "Catch a colour". The camera prompt appears in that tap; the rear camera shows; the disk, swatch and name follow the middle of the lens circle; a dark scene reads "Night glass"; the Ring fills while still and resets when the phone turns (this shows whether the primer's orientation grant also delivers `rotationRate`; if not, colour distance alone decides); after 2 s the caught state shows; "Back to Piața Unirii" returns and the camera light goes off; a denied camera shows the 7.5 text and "Try again"; leaving the app and coming back shows "Starting the camera" with "Try again".
- Android, deployed build (a teammate): the same steps, plus one short vibration on the catch.
- Not run here: a real camera, the flight and flare motion by eye, reduced motion, remote mode (`/?mode=remote`, Gallery window), the second `wake` check (no `POST /events` could leave the page without an API).

## For the checkpoint

- The phone sends one `POST /panes` per catch with a `PaneIn` body and nothing else; no `colour` event. `siteId` is `"gallery"` in remote mode.
- The phone reads `pane` messages on `site:<id>` with Cristea's `PaneMessage` and ignores other sites. A pane with a new `windowId` clears the phone's window.
- The phone takes "{count} of 48" from `PaneAccepted.count` and puts the pane in `PaneAccepted.slot`, so the server's slot must match what `/screen` draws.
- A 429 shows the rate-limit state and is never retried; 5xx, 401 and network errors are retried every 2 s while the lens stays open; other 4xx drop the pane quietly.

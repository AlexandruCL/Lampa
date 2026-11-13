# Report: Ionut's Build 3, Echo and Between sites

Branches: `ionut/b3-echo` (PR #31, open) and `ionut/b3-between` (from `ionut/b3-echo`, its PR opened with this report). Every ID of the prompt is done; nothing was cut. Agent reports were re-checked by the session: each verify re-run, a rule broken on purpose for each tested rule, and every screen checked in headless Chrome at 390×844 (the Playwright MCP server did not connect; the session drove the cached Playwright package with the installed Chrome, no install).

## Done

| ID | Verify | Commit |
|---|---|---|
| B3-0 | Baseline web green, API failed only on `socket.io` missing locally; `npm ci` (Ionut's approval) → `npm run typecheck && npm run build && npm test` exit 0, API 170, web 177. No echo schema or route anywhere; seam committed | e06f624 |
| B3-1.a.1 | `npm run test -w @lampa/web -- src/echo/recorder` → `Tests 11 passed (11)`; no 20 s cap → its case fails | 7738d25 |
| B3-1.b.1 | `src/echo` → `Tests 20 passed (20)`; a `Content-Type` header → its case fails | 339c7aa |
| B3-1.c.1 | typecheck, build, web 197, hex 0; browser: every recorder state; a 500 then a 201 sent the same recording with `audio(echo.webm)`, `siteId`, `consent`, `durationMs` | 6298def |
| B3-3.b.1 | web 197, hex 0; browser: 201 → "Say why" opens the recorder with "Why this colour?"; 503 → no button | 2c715fb |
| B3-3.a.1 | web `Tests 200 passed (200)` (197 before) | aad5a56 |
| B3-2.a.1 | `src/nav` → `Tests 30 passed (30)`; glow weight 0 and no visited-first sort → 5 cases fail | f04199f |
| B3-3.c.1 | `src/sensors src/geo` → `Tests 42 passed (42)`; speed `<=` → its case fails | e05d3fc |
| B3-2.b.1 | web 238, hex 0; browser: arrow 99.8° = bearing at `heading=0`, 9.8° at `heading=90`; Google link; iPhone Apple and Google; GPS arrival at the Bastion with "Theresia Bastion is waking." for 4 s and one `arrived` event | 8859efa |
| B3-2.c.1 | web 238, hex 0; browser 15 of 15: `/` → card and list, suggestion first with its tag, Cathedral "Memorial", row switches the card, remote sorted by name, location denied → list and Notice, "You are here", `/?demo=1` arrives at MX | a18bfe7 |
| B3-3.c.2 | web 238; Between check 11 of 11 | c3adb42 |
| B3-4.a.1 | web 238, hex 0; browser: four Sheets × Close, backdrop, Escape, back (16 of 16), title focus, focus back, Tab trapped; list check 15 of 15 in the Sheet | 38454e2 |
| B3-5.a.1 | web 238, hex 0; browser 10 of 10: 0.6 after 10 s, the waking tap or Enter does nothing else, an open Sheet holds the timer | 63e51f6 |

Final chain on `ionut/b3-between`: `npm run typecheck && npm run build && npm test` → exit 0, API `Tests 170 passed (170)`, web `Tests 238 passed (238)`.

## Blocked

- `POST /echoes` (Cristea): not on `main`, the deployed API answers 404, so a real send shows the failure Notice. Recommendation: Cristea's B3-1; when PR #31 and her seam meet in `contract.ts`, keep one `EchoAccepted` (identical). Her router may ignore `durationMs` and `prompt`.
- Landmark hints (content owners, Fabi): `directions_hint: {}` in every site YAML; the card shows no hint line.
- The beacon, the chime and the whispers (Patrick): wire `onTarget` and `onArrive` of `Between`; `EchoRecorder` `prompt` for `start_echo_recording`; `suggestNext` for `suggest_next_site`.
- Still open from earlier blocks, unchanged: the sound bed and the lens sounds (Patrick). `POST /events`, `/live`, `POST /panes`, the `pane` message and `bin` have landed on `main` since hour 7 (Fabi, Cristea); their old Blocked rows can be closed after the Checkpoint 3 run.

## Not finished at hour 32

Nothing: no ID was cut. Known limits, in the glossary Changes:

- A Sheet that unmounts without closing itself (a site picked in the Sites sheet, a remote row, "Discard") leaves one history entry: the next back press stays on the same screen once.
- If `new MediaRecorder(...)` throws after the microphone opened, the microphone stays on (no error path in the prompt).
- A waking `pointerdown` with no `click` after it (a drag) swallows the next click once.

## Phone checks for Ionut

- iPhone, deployed build: `/s/unirii` → tap → "Leave an echo": the microphone prompt in the tap on the record control; the Ring fills and the seconds count down; a tap stops; the preview plays; "Send echo" disabled until the box is ticked; the uploaded type (`audio/mp4`, or `audio/webm`); a denied microphone shows its text and "Try again"; leaving the app while recording comes back to the recorded state. After a catch, "Say why" opens the recorder with "Why this colour?".
- iPhone, outdoors: "Next site": the arrow follows the site while the phone turns and blends with the walking course; the distance falls while walking; "Open in Maps" opens a Sheet with "Apple Maps" and "Google Maps", both with walking directions; "Tap to listen again" after coming back; entering the site opens its view with "{Site} is waking."; the weak, location-off and memorial lines.
- Android (a teammate): the same; an `audio/webm` upload; one short vibration on "Sent" and `[30, 60, 30]` on arrival; "Open in Maps" opens Google Maps directly.
- With Cristea, once `POST /echoes` is on `main` (demo step 1:20): the echo in the curator queue from both phones.
- With Patrick (demo step 1:40), iPhone with `?demo=1` and no `heading=`: "Next site" shows the motion prompt once, the arrow turns with the phone, and the arrow card and the beacon agree on the Piața Unirii poster.

## For the checkpoint

- Merge PR #31 first, then the `ionut/b3-between` PR (it contains #31's commits until then).
- Patrick's Build 2 prompt edits `apps/web/src/phone/SiteView.tsx` (Talk view, lens callbacks). Both Ionut branches change the same file (`view` gains `"echo"` and `"between"`, `echoPrompt`, `primer`, `arrived`, "Next site"): expect a merge conflict; keep both sides.
- `/` no longer goes to `/s/mx`: after the tap it opens Between sites; with `?demo=1` it arrives at MX at once as before.
- The phone now sends `arrived` (weight 0 on the server) and stays connected to `/live` while Between sites is open.
- Not seen in a browser: weak position, location off, the memorial and all-visited card lines, offline "(last known)", "Tap to listen again", cannot-record and stop-on-hide in the recorder. The phones cover them.

# The Dialogue of the Bells

Owners: Cristea (contract and API, about 3 hours), Ionut (phone and `/screen`, about 4.5 hours). Needs two phones to test.

## What the visitor gets

In Piața Unirii the visitor picks one of two towers: the Roman Catholic cathedral or the Serbian Orthodox cathedral. Their phone becomes one bell, rung by a flick of the wrist or a tap. When the two towers ring together three times in a row, every phone in the square plays a chord and the square's window flares on `/screen`.

## Decisions

- The tower is picked by a tap. GPS is not used to tell the sides apart: the square is about as wide as the GPS error.
- The bell sound is made with WebAudio. No audio files and no ElevenLabs credits.
- Phones do not play the other tower's rings from the network, because the delay would spoil the rhythm. People hear each other's phones in the air. The other tower's rings are shown as a light pulse.
- Phones send rings with a POST. The live socket only sends from server to phone today, and it stays that way.
- Harmony rule: the last three rings of each tower pair up one to one, each pair at most 300 ms apart, all within the last 6 seconds. After a harmony, none is declared for 10 seconds.

## Contract (Cristea, first, 15 minutes, both owners agree before building)

In `packages/shared/src/contract.ts`:

```ts
export const BellTower = z.enum(["catholic", "serbian"]);
/** POST /bells/ring. `at` is the server clock in epoch ms (phone clock plus the /time offset). Answers 204. */
export const BellIn = z.object({ siteId: z.string(), tower: BellTower, at: z.number().int() });
/** `bell` on /live, room "site:<id>". */
export const BellMessage = BellIn;
/** `harmony` on /live, rooms "site:<id>" and "screen". */
export const HarmonyMessage = z.object({ siteId: z.string(), at: z.number().int() });
```

Add `"bell"` and `"harmony"` to `SocketMessage`.

## Tasks for Cristea (API)

| # | Task | Files | Hours |
|---|---|---|---|
| C1 | The contract above | `packages/shared/src/contract.ts` | 0.25 |
| C2 | Pure `judgeHarmony(rings, nowMs)` with the rule above, and `pruneRings(rings, nowMs)` that keeps the last 10 seconds | new `apps/api/src/bells/harmony.ts` | 0.75 |
| C3 | `POST /bells/ring`: `requireVisitor`, a limiter of 5 per second per visitor, `BellIn` parsed, `at` replaced by the server time when it is more than 2 seconds away from it; stores the ring in memory, emits `bell` to `site:<id>`, and emits `harmony` to `site:<id>` and `screen` when `judgeHarmony` says so | new `apps/api/src/bells/router.ts`, wired in `createApp` | 1.25 |
| C4 | Tests: the harmony rule (in rhythm, out of rhythm, one tower only, cooldown), and the route (204, bad body 400, rate limit 429) | new `bells/harmony.test.ts`, `bells/router.test.ts` | 0.75 |

Use the existing generic `emit(room, message, payload)` on the `Live` object from `apps/api/src/live/socket.ts`; no new emitter is needed.

Shortcut to mark in the code: rings are kept in memory in one API process. It breaks with two API instances; move to the database then.

## Tasks for Ionut (phone and `/screen`)

| # | Task | Files | Hours |
|---|---|---|---|
| I1 | Pure flick detector: `createFlickDetector(thresholdDegPerS = 250, refractoryMs = 350)` returns `(rate, nowMs) => boolean`, true on the upward crossing only | new `apps/web/src/bells/flick.ts` and test | 0.5 |
| I2 | Bell sound: a few sine partials with exponential decay on the shared `AudioContext`; one pitch per tower a fifth apart (220 Hz and 330 Hz); a major chord for harmony | new `apps/web/src/bells/bellSound.ts` | 0.75 |
| I3 | Screen: pick a tower, then ring. A ring comes from a flick (`useRotationRate` read on each animation frame) or from tapping the bell, which is also the fallback when motion is refused. Each ring plays at once and posts `BellIn` with `at = Date.now() + offset` from `getClockOffset` | new `apps/web/src/phone/Bells.tsx` and `.module.css`, new `apps/web/src/bells/ring.ts` for the POST | 1.5 |
| I4 | Listen for `bell` and `harmony` on the site socket: a pulse for the other tower, the chord and a full-screen glow for harmony | `apps/web/src/phone/useSiteGlow.ts`, `Bells.tsx` | 0.5 |
| I5 | Entry button in the site view, only at Unirii: add a `bells` flag to `PhoneSite` the way `lamp` is set in `apps/web/src/sites/sites.ts`. Ask for motion permission inside the tap with `requestCompass()`, as the lamp button does | `sites/sites.ts`, `phone/SiteView.tsx` | 0.25 |
| I6 | `/screen`: on `harmony`, run the existing window flare for that site (the `FLARE_*` sequence in `screen/canvas.ts` that `window_complete` already uses) | `apps/web/src/screen/useScreenSocket.ts`, `screen/canvas.ts` | 0.5 |
| I7 | Strings in ro and en | `apps/web/src/i18n/en.json`, `ro.json` | 0.25 |

## Order

1. C1 together.
2. Ionut builds I1, I2, I3 and I5 against no server: one phone already rings. Cristea builds C2 to C4.
3. Join: I4 and I6, then the two-phone test.

## Checks

- `npx vitest run src/bells` in `apps/api` and in `apps/web`; type-check both.
- Two phones in `?demo=1` at Unirii, one per tower: three rings together give the chord on both phones and the flare on `/screen`. Random ringing gives no harmony.
- An iPhone: the motion prompt appears from the tap; refusing it still lets the visitor ring by tapping.

## Table demo

Two posters at opposite ends of the table, one per tower. Judges and teammates ring from either side.

## Risks

- Flick threshold differs between phones. The tap fallback always works; tune the threshold on two real devices.
- Network delay above 300 ms on the venue Wi-Fi does not matter, because rings carry the time they happened, not the time they arrived.

## Cut line

If the API half is not ready, ship I1 to I3 and I5 alone: one phone, one bell, no harmony.

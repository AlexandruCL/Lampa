# Message in a Bottle on the Bega

Owners: Cristea (bridges and API, about 3 hours), Ionut (shared maths, phone and `/screen`, about 4 hours). Last in the build order; first to cut.

## What the visitor gets

At a bridge the visitor records an echo and drops it "into the river". It drifts downstream at a slow virtual speed. Later, a visitor at a bridge further down hears it when it passes.

## Blocker to clear first

None of the five sites is on the river, so the feature needs new places. Cristea adds two or three bridges and takes their coordinates on site or from OpenStreetMap. Suggested, to confirm: Podul Decebal, Podul Michelangelo, Podul Traian.

## Decisions

- A bottle is an ordinary echo whose site is the launch bridge. No new table, no new column, the same moderation.
- Position is computed, not stored: metres along the Bega line in `packages/shared/src/mapLines.ts`.
- The Bega flows west. The line's points run west to east, so downstream means a smaller distance along the line.
- A bottle starts drifting when it is recorded (`created_at`), even while it waits for approval. Only approved bottles can be caught.
- A bridge catches a bottle while the bottle is within 150 m of it.
- Speed comes from the `BOTTLE_SPEED_MPS` environment variable. Default 0.05 m/s (180 m per hour). For the table demo, set it so the trip between two bridges takes about a minute.

## Tasks for Cristea

| # | Task | Files | Hours |
|---|---|---|---|
| C1 | Two or three bridge places: `interactions: [bottle]`, `persona: {}`, `radius_m: 40`, no sound bed; then seed them | new `content/sites/06-….yaml` onward, `packages/shared/src/sites.ts` | 1 |
| C2 | `GET /echoes/bottles?site=<bridgeId>`, public, rate-limited like `/echoes/approved`: approved echoes of the last 24 hours recorded at other bridges, kept when `catchable` says so; answers in the `ApprovedEchoes` shape plus the launch bridge's id | `apps/api/src/echoes/router.ts`, `packages/shared/src/contract.ts` | 1.25 |
| C3 | Route tests: a bottle upstream and in range is returned; out of range, downstream, pending or from a non-bridge site is not | `apps/api/src/echoes/router.test.ts` | 0.75 |

## Tasks for Ionut

| # | Task | Files | Hours |
|---|---|---|---|
| I1 | Pure functions with tests: `alongM(point, line)` (metres from the line's start to the nearest point on it), `bottleAlongM(launchAlongM, launchedAtMs, nowMs, speedMps)`, `catchable(bottleAlongM, bridgeAlongM, windowM = 150)` | new `packages/shared/src/river.ts` and test, exported from `index.ts` | 1 |
| I2 | Bridge view: the site view shows only what a bridge offers. "Drop an echo in the river" opens the existing `EchoRecorder` with a river prompt | `apps/web/src/phone/SiteView.tsx` | 0.75 |
| I3 | "Listen to the water": fetch `/echoes/bottles` on arrival and every 30 seconds, play each bottle once with the existing whisper player; an empty river shows a quiet line of text | new `apps/web/src/audio/useBottles.ts`, `SiteView.tsx` | 1.25 |
| I4 | Strings in ro and en | `apps/web/src/i18n/en.json`, `ro.json` | 0.25 |
| I5 | Optional: bottle dots drifting along the river on `/screen` | `apps/web/src/screen/canvas.ts` | 0.75 |
| I6 | Optional: play the bottle from the direction of the nearest river point, with the panner maths `useWhispers` already uses | `audio/useBottles.ts` | 0.5 |

## Order

1. I1 first: both halves use it.
2. C1 next, because nothing can be tested without bridges.
3. C2 and C3 beside I2 and I3.
4. I5 and I6 only if everything else is done.

## To check before starting

- A bridge with an empty persona must not show Talk, the colour lens or the lamp. Bundled sites show every button today (`has()` in `SiteView.tsx` and `lamp` in `sites/sites.ts`), so bridges need their interactions listed on the phone.
- Bridges will appear on `/screen`, in the sites list, in the glow loop and on Pulse. Decide whether they should, and leave them out where not.
- The launch bridge's own whispers (`/echoes/approved`) would also play the bottle there. Decide whether that is wanted.

## Checks

- `npx vitest run src/river` in `packages/shared`, `npx vitest run src/echoes` in `apps/api`; type-check all three packages.
- Two phones in `?demo=1`, one at each bridge, with a fast speed: record at the upper bridge, approve it in the console, hear it at the lower bridge about a minute later.

## Table demo

Two bridge cards on the table. Speed set fast. A judge records at one card; a minute later a teammate's phone at the other card plays it.

## Risks

- An echo approved late may already have drifted past every bridge. At the default speed there are hours of margin; in the demo, approve at once.
- Bridge coordinates that are off by more than the 40 m radius break arrival. Take them on site.

## Cut line

This is the first feature to drop. If only half the time is left, ship without I5 and I6.

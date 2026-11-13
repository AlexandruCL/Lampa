# Report: Cristea's Build 1 (Identity, infra, Living Map)

Written at hour 9, 2026-11-13. `main` at `2f1e250`.

## Done

| ID | Verify | Commit |
|---|---|---|
| B1-0 | seam on `main`; same chain → exit 0, `Tests 7 passed (7)` | 4f3090c |
| B1-1.a.1 | `cmp` silent, `✓ built`, 13 woff2 files | 09396f0 |
| B1-1.b.1 | typecheck and build exit 0; no hex literal in the modules | 2a9b499 |
| B1-1.c.1 | `Tests 13 passed (13)`; removing the Ring rounding fails its case | c9069d5 |
| B1-2.a.1 | JWKS → `200`; email code lands on `/?code=`, passkey works (Cristea) | no repo files |
| B1-3.a.1 | POST → token, `/health` → 200, no secret → exit 1 | 17f0213 |
| B1-3.b.1 | `Tests 11 passed (11)`; a plain decode in place of the HS256 check fails three cases | 4f9f912 |
| B1-3.c.1 | `Tests 14 passed (14)`; keeping the stale token on a 401 fails both retry cases | 280b3d5 |
| B1-4.a.1 | nine cases pass; `MIN_SPACING = 0` fails the spacing cases | e87eb3c |
| B1-4.b.1 | eight cases pass; moving the 0.15 threshold fails three cases | 41509c8 |
| B1-4.c.1 | build and tests pass, hex count 0; screenshots at 1920×1080 and 1280×720 show no overlap or clipping | c01a467, 238b18e, 4feafee |
| B1-last | `main`: API `11 passed`, web `76 passed`; deployed `POST /session/anon` → 200 | 2f1e250 |

Every optional state shipped inside its hour: Button danger and loading, Notice connection, RoundControl speaking and connecting. Nothing from the cut order was cut, the passkey included.

## Changes from the prompt

- `SESSION_SECRET` went into the Render dashboard by hand, because Render CLI 2.36.0 cannot set env vars.
- `sessionRouter` is mounted before `express.json()`, so a broken body cannot stop `POST /session/anon`.
- `/screen` draws at `canvas.width / 1380`, since the canvas fills only the map area.
- Sites sit at least 2.95R apart instead of 2.4R, and labels avoid other circles and are shifted inside the map at its edges. The tests still hold the 2.4R floor from plan section 8.

## Blocked

- Live socket check: waits on Fabi's `/live`. Recommendation: run it together as soon as it is on `main`.
- `GlowMessage`, `Site` and the five site ids: Fabi has not agreed them yet. Recommendation: keep them as they are on `main`.
- The 2.95 spacing was tuned on approximate coordinates. Recommendation: repeat the screenshot check when `sites.json` lands.

## Not finished at hour 10

None. The checks below wait on other people, not on work in this lane.

## Phone and room checks for Cristea

- Laptop: the deployed `/screen` renders the start screen and all five sites. Still to report: the names read from across the room.
- iPhone: the deployed page works.
- With Fabi: a `wake` brightens its site within 5 s, and "Reconnecting to the city…" shows and clears.
- Team: Checkpoint 1 line 5 in daylight on Ionut's screens.

## For the checkpoint

- Visitor routes mount `requireVisitor` then `visitorLimiter`. `req.visitor` is `{ sub, kind, permissions }`. Every failure is 401 `{"error":"unauthorized"}`.
- Local API runs need `SESSION_SECRET` in the root `.env`.
- `/screen` joins `/live` with `query: { room: "screen" }`, no token, and reads `glow` as `GlowMessage`. Locally it needs `VITE_API_URL`, or the socket goes to `undefined/live`.
- Ionut's `phone/glow.ts` can now re-export `glowWord` and `glowLine` from `apps/web/src/screen/glow.ts`.
- Auth0: tenant `lampa.eu.auth0.com`, audience `https://lampa-api-b45i.onrender.com`. Email-code users and passkey users are separate Auth0 users, so each account needs its own role.
- The per-IP limit on `POST /session/anon` assumes one proxy in front of Render. Two phones on different networks would confirm it.

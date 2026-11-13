# Report: Ionut's Build 1, the spine

Everything is on `main` at `4d3e52d` (PRs #6, #7, #8, #9, merged by Cristea).

`npm run typecheck && npm run build && npm test` → `✓ built in 296ms`, web `Tests  58 passed (58)`, api `Tests  11 passed (11)`; exit 0.

## Done
- B1-0 done | seam `EventIn`, `EventBatch`, `EventsAccepted` in `packages/shared/src/contract.ts` | commit: 1a6bd5d
- B1-1.a.1 done | verify: `npm run test -w @lampa/web -- src/geo && npm run typecheck -w @lampa/web` → `Tests  12 passed (12)` | commit: 395f347
- B1-1.b.1 done | verify: `npm run test -w @lampa/web -- src/sensors && npm run typecheck -w @lampa/web` → `Tests  7 passed (7)` | commit: 968266f
- B1-1.c.1 done | verify: same → `Tests  14 passed (14)` | commit: ccbfb25
- B1-2.a.1 done | verify: `npm run test -w @lampa/web -- src/events && npm run typecheck -w @lampa/web` → `Tests  9 passed (9)` | commit: 56c831a
- B1-2.b.1 done | verify: `npm run test -w @lampa/web -- src/api && npm run typecheck -w @lampa/web` → `Tests  6 passed (6)` | commit: d4d0c05
- B1-3.a.1 done | verify: `npm run typecheck -w @lampa/web && npm run build -w @lampa/web && npm test -w @lampa/web` → `Tests  55 passed (55)`, hex count 0 | commit: bf4232c
- B1-3.b.1 done | verify: same → `Tests  58 passed (58)`, hex count 0 | commits: b3d2fb1, 211d018 ("Use the compass" retry)
- B1-last: PRs merged, glossary and Hand-offs complete; the checks below stay open.

Each rule that matters was broken once on purpose and its test failed (listed in the glossary's Done rows).

## Blocked
- Fabi: `POST /events` and `/live` are not on `main`. Until then `wake` batches are refused (kept and retried) and the Site view stays on "Listening for the city…". Recommendation: `POST /events` validates `EventBatch`, sets the weights, answers 202 `EventsAccepted`; `/live` joins `query: { room: "site:<id>" }` and sends `glow`.
- Patrick: no sound bed after the tap. Recommendation: his engine plays through `getAudioContext()` once `unlockAudio()` reports `"running"`.
- Cristea's foundation for B1-3: landed (PR #4), not blocked.

## Not finished at hour 10
Nothing. No cut from the cut order was used.

## Phone checks for Ionut
Not runnable here; the dev-server checks ran in desktop Chromium at 390×844.
- iPhone, deployed (passed, reported by Ionut): `/s/unirii` → one tap → the iOS location and motion prompts appear, both granted, the Site view shows; `/s/unirii?demo=1` → "Demo position", no prompt; `/s/cathedral` → memorial landing and stub. Also: deny motion → "Use the compass" shows on the Site view and asks again.
- Android, a teammate (passed, reported by Ionut): the same steps.
- With Fabi, once `POST /events` lands: a `wake` from the phone is a row in `interaction_events`.
- With Patrick, once the engine lands: a sound bed plays after the tap (Checkpoint 1 line 1).
- Not seen in a browser: the "Tap to listen" and "Location is off" Notices, the 8 s "Still connecting" Notice, glow over the socket, "(last known)".

## For the checkpoint
- Every web call goes through `authFetch`: each `api()` call gets an anonymous token first and retries once on a 401.
- `track("wake", siteId)` runs once when a Site view opens; the memorial sends nothing and opens no socket.
- The phone sites are local (`apps/web/src/sites/sites.ts`) until `packages/shared/sites.json` lands; `Site` is now in the contract, and the swap is Ionut's call.
- `glowWord` and `glowLine` live in `apps/web/src/phone/glow.ts` until Cristea's `screen/glow.ts` lands.
- `primeDevice()` must run inside the tap; `useGeolocation` mounts only after it.

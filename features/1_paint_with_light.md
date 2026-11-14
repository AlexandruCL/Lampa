# Paint with Light (phone-only)

Owner: Ionut. Estimate: 3 to 4 hours. No server work, no contract change.

## What the visitor gets

At a site, the visitor taps "Paint with light", points the rear camera at a dark scene and moves a light (or moves the phone in front of lamps) for 8 seconds. Each pixel keeps the brightest value it saw, so the light leaves a trail. The visitor saves or shares the finished image.

## Out of scope

- Upload, storage, moderation and the Living Map. The image never leaves the phone unless the visitor shares it.
- Manual exposure control. The camera's auto-exposure stays on.
- The memorial: the button is in `SiteView` only, and `Memorial` is a separate view.

## Tasks

| # | Task | Files | Hours |
|---|---|---|---|
| 1 | Pure helpers: `stackSize(videoW, videoH, maxEdge = 1280)` and `stackProgress(elapsedMs, durationMs)` | new `apps/web/src/paint/stack.ts` | 0.25 |
| 2 | `startStack(video, canvas, durationMs)`: draws the first frame normally, then every frame with `globalCompositeOperation = "lighten"`; uses `requestVideoFrameCallback` when present, else `requestAnimationFrame`; returns `{ stop, done: Promise<Blob> }` (`canvas.toBlob`, JPEG, quality 0.9) | `paint/stack.ts` | 1 |
| 3 | Screen with the states opening, denied, unavailable, ready, painting (progress bar and seconds left), result | new `apps/web/src/phone/PaintLight.tsx` and `.module.css` | 1.5 |
| 4 | Save or share: `navigator.share({ files })` when `navigator.canShare` accepts the file, else an `<a download>` link | `PaintLight.tsx` | 0.25 |
| 5 | Entry button in the site view's button grid, shown where the site has `colours`; opens the camera inside the tap, as the colour lens does | `apps/web/src/phone/SiteView.tsx` | 0.25 |
| 6 | Strings in ro and en | `apps/web/src/i18n/en.json`, `ro.json` | 0.25 |
| 7 | Tests for task 1 | new `paint/stack.test.ts` | 0.25 |

## Reuse

- `openRearCamera`, `stopCamera` and `CameraResult` from `apps/web/src/sensors/camera.ts`.
- The view switch in `SiteView.tsx` (`view` state, `camera` promise), the same way `ColourLens` is opened.
- `Button`, `Notice`, `TopBar` and `DemoBadge`.

## Checks

- `npx vitest run src/paint` and `npx tsc --noEmit -p .` in `apps/web`.
- On an iPhone and an Android phone: camera opens from the tap, the trail appears, the image saves or shares, the camera stops when leaving the screen.

## Table demo

Dim the table lamp. A judge waves a second phone's torch in front of a façade postcard. The trail appears over the postcard.

## Risks

- In a bright room the result is an ordinary photo. The screen says "works best in the dark".
- A long-edge cap of 1280 px keeps memory and frame time low on older phones.

## Cut line

If time runs out after task 4, ship without the progress bar.

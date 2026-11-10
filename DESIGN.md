# LAMPA design

This document is the whole visual and UX specification for the hackathon build. It stands alone: every value an engineer needs is written here. It covers the phone app (`/`, `/s/:siteId`), the Living Map (`/screen`), the Pulse dashboard (`/pulse`) and the curator console (`/curate`).

Five sites ship: the Iron Tree, Piața Unirii, Piața Victoriei (the 1884 lamps), Theresia Bastion with the Bega, and the Metropolitan Cathedral (Catedrala Mitropolitană), which is the 1989 memorial and works differently (section 7.11).

Stack it is written for: Vite, React, TypeScript; styling is one global stylesheet of tokens (`tokens.css`, holding every custom property in this document plus the base rules in 4.5) and one CSS Module per component that reads only those custom properties. No Tailwind, no motion library, no icon library. Canvas 2D for `/screen`, Recharts plus hand-written SVG for `/pulse`, the `qrcode` npm package for QR codes.

Design read: an outdoor night installation app for strangers on phones, in a lamp-lit night style. Dials: phone ENERGY 1 / RHYTHM 1 / MOTION 2; `/screen` ENERGY 3 / RHYTHM 1 / MOTION 3; `/pulse` and `/curate` ENERGY 1 / RHYTHM 1 / MOTION 1.

---

## 1. Direction

LAMPA is used in the dark: on a cold street in Timișoara's old town, one hand on the phone, headphones in, eyes mostly on the buildings. The interface is a night city with almost no light of its own. Light appears only where people have added it: a site's glow, a caught colour, a raised lamp. The one recognisable idea is **earned light**: the screen stays dark ink, and the single warm accent (1884 arc-lamp amber) is spent only on light and on the one action that makes light. The second motif is the circle: the lens, the rose window, the lamp, the colour clock are all circles; everything else is a plain rectangle.

This is not:

- a map app (no map on the phone, ever; the Maps links leave the app)
- a game (no points, badges, streaks, leaderboards, confetti, "unlock"), and at the memorial not even a counter
- a tour guide (no paragraphs to read while walking; everything important is also spoken)
- a neon night theme (no glow on controls, no gradients on surfaces, no blur, no violet)
- a dashboard on the phone (no stat rows; one number at a time)

---

## 2. Colour

One theme only: night (decided). Reasons: the product is used outdoors at night with headphones, the 1884 story is about light in the dark, and caught colours read truest on dark neutral glass. A second theme would double the testing for a 48-hour team. Daylight readability is handled by contrast floors that are far above AA (primary text 12.6:1 or higher on every surface, never a weight below 400, never body text below 17px).

Daylight check, done once at Checkpoint 1 (10 minutes): one person takes the iPhone and the Android outside in daylight at full screen brightness and reads, at arm's length, the Join screen, the Site view and the Colour lens instructions. Pass: every word and the primary button are readable without shading the screen. Any failure is written on the Checkpoint 1 bug list; the fix is a larger size or `--text` instead of `--text-2` for that element, never a second theme.

Neutrals are tinted toward the night blue of the LAMPA cover (hue about 255). The accent is a warm amber taken from an arc lamp.

### 2.1 Tokens

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0E121A` | page background on every surface, rose-window leading lines, QR dark modules |
| `--surface` | `#171C26` | raised areas: sheets, list rows, chart cards, curator panels, top bar |
| `--surface-2` | `#222937` | inputs, pressed rows, secondary button pressed fill, disabled button fill, empty rose-window panes |
| `--line` | `#2E3646` | decorative dividers, chart gridlines, map streets on `/screen`. Never the only boundary of a control |
| `--line-strong` | `#7A8397` | borders of secondary buttons, inputs, checkboxes, ring tracks, rose-window frame |
| `--text` | `#F2EEE6` | primary text, icons, ring progress |
| `--text-2` | `#BDB6AA` | secondary text: distances under names, labels, visitor captions, chart axis titles |
| `--text-3` | `#9B9488` | tertiary text: timestamps, credits, placeholders, disabled labels |
| `--lamp` | `#FFB547` | the accent: primary button fill, glow marks and halos, compass arrow, lamp counter value, chart lines |
| `--lamp-pressed` | `#E89A2A` | primary button pressed fill |
| `--on-lamp` | `#1A1206` | text and icons on `--lamp` and `--lamp-pressed` |
| `--lamp-white` | `#FFF4E0` | full-screen light: Lamp lit, finale burst, QR light modules, candle flames and candle points |
| `--ink-on-light` | `#2B1F0E` | primary text on `--lamp-white`, focus ring on `--lamp-white` |
| `--ink-on-light-2` | `#6A5536` | secondary text on `--lamp-white` |
| `--danger` | `#FF8A7A` | errors, reject, recording dot. Always paired with an icon or word |
| `--ok` | `#7FD6A0` | curator "Approved", publish step done. Always paired with a check icon |
| `--focus` | `#A8D1FF` | keyboard focus ring on dark surfaces |
| `--river` | `#4A7BB0` | the Bega on the `/screen` map (required; decorative, carries no text) |
| `--scrim` | `rgba(14, 18, 26, 0.80)` | darkens the camera image outside the colour lens |
| `--backdrop` | `rgba(14, 18, 26, 0.72)` | behind an open sheet (no blur) |

There is no warning colour. Notices that are not errors (reconnecting, live talk resting, weak GPS) use `--surface-2` with `--text` and an icon, so amber keeps meaning "light".

### 2.2 Contrast, computed (WCAG 2.x relative luminance)

| Foreground on background | Ratio | Allowed use |
|---|---|---|
| `--text` on `--bg` / `--surface` / `--surface-2` | 16.20 / 14.75 / 12.60 | any text |
| `--text-2` on `--bg` / `--surface` / `--surface-2` | 9.32 / 8.48 / 7.25 | any text |
| `--text-3` on `--bg` / `--surface` / `--surface-2` | 6.24 / 5.68 / 4.85 | any text 15px and up |
| `--lamp` on `--bg` / `--surface` / `--surface-2` | 10.67 / 9.71 / 8.30 | text, icons, UI |
| `--on-lamp` on `--lamp` / `--lamp-pressed` | 10.55 / 8.02 | button labels |
| `--danger` on `--bg` / `--surface` / `--surface-2` | 8.19 / 7.45 / 6.37 | text, icons |
| `--ok` on `--bg` / `--surface` | 10.74 / 9.78 | text, icons |
| `--focus` on `--bg` / `--surface` | 11.81 / 10.75 | focus ring (needs 3:1) |
| `--line-strong` on `--bg` / `--surface` / `--surface-2` | 4.93 / 4.49 / 3.83 | control borders (needs 3:1) |
| `--ink-on-light` on `--lamp-white` | 14.76 | text, focus ring on light |
| `--ink-on-light-2` on `--lamp-white` | 6.50 | secondary text on light |
| `--ink-on-light` / `--ink-on-light-2` on the darkest point of the lamp pulse (`#E2D9C8`, 6.14) | 11.49 / 5.06 | lamp screen text while pulsing |
| `--lamp-white` on `--bg` | 17.20 | candle flames, candle points (non-text) |
| `--text` on camera image under `--scrim`, worst case (pure white frame) | 8.83 | lens instructions |
| `--lamp` on camera image under `--scrim`, worst case | 5.82 | lens ring and labels |
| `--river` on `--bg` | 4.24 | decorative map only |
| `--line` on `--bg` | 1.55 | decorative only, never a control edge |

Pairs that are forbidden: `--text` on `--lamp-pressed` (2.00), `--focus` on `--lamp` (1.11; the focus ring always sits on a 2px `--bg` gap, see 6.1).

### 2.3 Colour that carries meaning

- **Glow** (0 to 1 per site, pushed every 5 s) is shown by amber light, and always by a word and a number too:

| Glow | Word (en / ro) | Amber treatment |
|---|---|---|
| 0.00 to 0.14 | Asleep / Adormit | GlowMark core at 25% opacity, no halo |
| 0.15 to 0.59 | Waking / Se trezește | core at `25% + 75% × glow`, halo at `0.35 × glow` |
| 0.60 to 0.99 | Awake / Treaz | same formula |
| 1.00 | Fully lit / Aprins complet | core 100%, halo 0.35 |

- **Caught colours** are content, never chrome. They appear only inside rose-window panes, the lens, the ticker swatch and the colour clock. No UI element takes a pane's colour.
- **Rose-window backlight**: a filled pane is drawn at `mix(paneColour, --bg, 0.45 + 0.55 × glow)` (asleep windows show their panes at 45% brightness, a fully lit window at 100%). Empty panes are `--surface-2`.
- **Recording**: a 10px `--danger` dot plus the word "Recording" and the seconds counter. The dot never appears without the word.
- **Memorial**: the Metropolitan Cathedral never shows glow words, percentages, amber halos, counters or panes. Its only light is candles in `--lamp-white`. Each candle fades with the same decay as glow (`e^(-(now - litAt) / 6 h)`) and is no longer drawn below 0.05.

### 2.4 Colour names

The lens sorts hues into 12 bins. Bin index `= floor(((hue + 15) mod 360) / 30)`, with hue in degrees from 0 to 360 (HSL/HSV hue, red at 0). The bin picker in the lens must use these exact bins so the name matches the colour. When no pixel is vivid enough, the result is "night glass" and has no bin.

| Bin | Hue range (degrees) | English | Romanian |
|---|---|---|---|
| 0 | 345 to 14 | Red | Roșu |
| 1 | 15 to 44 | Orange | Portocaliu |
| 2 | 45 to 74 | Yellow | Galben |
| 3 | 75 to 104 | Yellow-green | Verde-gălbui |
| 4 | 105 to 134 | Green | Verde |
| 5 | 135 to 164 | Mint | Verde-mentă |
| 6 | 165 to 194 | Turquoise | Turcoaz |
| 7 | 195 to 224 | Sky blue | Albastru deschis |
| 8 | 225 to 254 | Blue | Albastru |
| 9 | 255 to 284 | Violet | Violet |
| 10 | 285 to 314 | Magenta | Magenta |
| 11 | 315 to 344 | Pink | Roz |
| none | no vivid pixels | Night glass | Sticlă de noapte |

The names are content. The lens and the `/screen` ticker show them; they never decide any UI colour.

---

## 3. Typography

### 3.1 Families

| Role | Family | Fallback stack | Why |
|---|---|---|---|
| UI and reading (`--font-ui`) | Atkinson Hyperlegible Next, weights 400, 600, 700 | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | drawn by the Braille Institute for low-vision readers; letters that cannot be confused (Il1, O0) matter on a dim, moving phone and for low-vision visitors the concept names |
| Names and headings (`--font-display`) | Piazzolla, weight 600, optical size axis on | `Georgia, "Times New Roman", serif` | a sturdy book serif with Latin Extended and Cyrillic; it carries the printed, municipal voice of the LAMPA poster and stays solid at large sizes in the dark |

Loading: both are self-hosted from the npm packages `@fontsource/atkinson-hyperlegible-next` (version 5.3.0) and `@fontsource/piazzolla` (version 5.3.0), both under the SIL Open Font License 1.1. Import only these weights: Atkinson Hyperlegible Next 400, 600, 700 and Piazzolla 600. The packages ship woff2 files split by unicode range with `font-display: swap`, so the phone downloads only the subsets a page uses, and no request goes to a third-party font server. `/screen` must wait for `document.fonts.ready` before the first canvas text draw.

Glyph coverage (verified): Atkinson Hyperlegible Next 2.001 covers the Romanian comma-below ș and ț and the Hungarian ő and ű. It has no Cyrillic. Piazzolla covers all of these and Cyrillic. Decision: Serbian Cyrillic in captions and transcripts renders in the system fallback font of the stack above, glyph by glyph. No extra font is loaded for it.

There is no drawn logo. The wordmark is the text `LAMPA` in `--font-display` 600, letter-spacing `0.04em`. The one image version (for Auth0, 7.10) is that wordmark exported as a transparent PNG, 300 × 80px, in `#0E121A`.

### 3.2 Phone, console and Pulse scale (fixed rem, root 16px)

| Token | Size / line height | Weight | Tracking | Family | Use |
|---|---|---|---|---|---|
| `--type-meta` | 15px / 22px | 400 | 0 | ui | timestamps, credits, helper text, distance under a list name |
| `--type-label` | 17px / 20px | 600 | 0 | ui | buttons, field labels, glow words |
| `--type-body` | 17px / 26px | 400 | 0 | ui | all running text, notices, visitor captions, transcripts |
| `--type-lead` | 21px / 30px | 400 | 0 | ui | persona captions, the one instruction on a station screen |
| `--type-title` | 27px / 32px | 600 | -0.01em | display | screen headings ("Sites", "Echo queue"), "Your lamp is lit." |
| `--type-display` | 34px / 38px | 600 | -0.01em | display | the site name on Join and Site view |
| `--type-numeral` | 56px / 56px | 700 | -0.02em | ui | live numbers: distance, lamp counter, city glow |

Meta (15px) and body (17px) are closer than a 1.25 step on purpose: 15px is the smallest size readable on a moving phone outdoors, and 17px is the iOS reading default.

### 3.3 `/screen` scale (projector, readable across a room)

All `/screen` sizes are written for a 1920 × 1080 canvas and multiplied by `--u: calc(100vw / 1920)`. Canvas text uses the same numbers times `canvas.width / 1920`.

| Token | Size / line height | Weight | Family | Use |
|---|---|---|---|---|
| `--screen-meta` | 22 / 28 | 400 | ui | glow line under a site name, credits, reconnect notice |
| `--screen-body` | 28 / 36 | 400 | ui | ticker lines, QR caption |
| `--screen-name` | 30 / 36 | 600 | display | site names under windows |
| `--screen-subtitle` | 30 / 40 | 400 | ui | echo transcript subtitles |
| `--screen-title` | 40 / 44 | 600 | display | wordmark at the top of the side panel |
| `--screen-numeral` | 72 / 72 | 700 | ui | lamps lit today, colours caught today |

### 3.4 Rules

- Numerals: every number that changes while visible (distance, counters, glow %, timers) uses `font-variant-numeric: tabular-nums` and `--font-ui`. The display serif is never used for live numbers.
- Never all-caps for labels or headings. Sentence case everywhere.
- Never truncate a site name. Wrap to at most two lines with `text-wrap: balance`. Buttons grow taller instead of truncating; a button label may wrap to two lines.
- Long German and Hungarian words: `overflow-wrap: anywhere` on headings and buttons, `hyphens: auto` on body text, and `<html lang>` set to the active UI language so hyphenation works. Persona captions get `lang` set to the conversation language.
- Line length: running text max `65ch` (transcripts, console, Pulse).
- Languages shipped in the UI: English and Romanian (from `navigator.language`, Romanian if it starts with `ro`, else English). A native Romanian speaker on the team reviews every Romanian string before Build 4. Captions and transcripts may arrive in Hungarian, German or Serbian (Latin or Cyrillic); they render in `--font-ui`, and Cyrillic falls back to the system font (3.1).
- Text sizes are in `rem`, so browser text zoom works; nothing is set in fixed `px` heights that would clip enlarged text.

---

## 4. Space, shape, depth

Styling mechanics: every value in sections 2 to 5 is a custom property in the single global `tokens.css`. Component styles live in CSS Modules and use only `var(--token)`; a hex value or pixel size typed straight into a module is a defect, except the fixed geometry this document gives per component (for example 96px round controls).

### 4.1 Spacing (4px base)

| Token | Value | Typical use |
|---|---|---|
| `--space-2xs` | 4px | icon to text inside a button |
| `--space-xs` | 8px | label to field, glow mark to word |
| `--space-s` | 12px | between stacked buttons (minimum gap between any two tap targets) |
| `--space-m` | 16px | inside rows and cards; page gutter on screens narrower than 360px |
| `--space-l` | 24px | page gutter from 360px up; between groups |
| `--space-xl` | 32px | between a heading and its content |
| `--space-2xl` | 48px | between the reading area and the action area on station screens |
| `--space-3xl` | 64px | top padding of Join, side-panel padding on `/screen` (× `--u`) |

### 4.2 Shape

| Token | Value | Use |
|---|---|---|
| `--radius-s` | 8px | inputs, list rows, archive images, chart cards, notices, tooltips |
| `--radius-m` | 14px | buttons, sheets (top corners only) |
| `--radius-round` | 50% | circles only: lens, round controls, glow marks, rings, icon buttons |

Buttons are never pills. Cards never nest: two boxes deep at most (a sheet may hold rows; a row never holds a card).

### 4.3 Borders and depth

- Borders: 1px `--line` for dividers; 1.5px `--line-strong` for control outlines.
- No box shadows anywhere. Elevation is shown by surface colour: `--bg` (ground), `--surface` (raised), `--surface-2` (inset or pressed).
- No `backdrop-filter`. The camera, Web Audio and the canvas already compete for the phone's GPU.
- The only glow in the product is the site glow halo: a radial gradient of `--lamp` from `alpha 0.35 × glow` at the centre to 0 at 1.6 × the window radius. It is never applied to buttons, text or icons.

### 4.4 Layers (z-index)

`0` page, `10` top bar, `20` notice, `30` sheet and backdrop, `40` full-screen light (Lamp lit, finale), `50` demo badge.

### 4.5 Breakpoints and safe areas

| Name | Width | Behaviour |
|---|---|---|
| phone | under 720px | the design target; one column; actions in the bottom 40% of the screen |
| wide | 720px and up | phone views are centred in a 560px column on `--bg` |
| desk | 1024px and up | `/curate` becomes two panes; `/pulse` becomes two columns |
| screen | `/screen` only | designed for 1920 × 1080 landscape, scales by `--u` from 1280 × 720 to 3840 × 2160; under 1024px wide it shows "The Living Map needs a screen at least 1024 px wide." |

Phone baseline (ship before the first component):

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`. Never `user-scalable=no` or `maximum-scale`.
- `<meta name="theme-color" content="#0E121A">` and `<meta name="color-scheme" content="dark">`.
- `html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; overscroll-behavior: none; background: var(--bg); }`
- App shell height `100dvh`. Top bar pads `env(safe-area-inset-top)`; the bottom action area pads `calc(var(--space-l) + env(safe-area-inset-bottom, 0px))`.
- `button, a, [role="button"] { touch-action: manipulation; user-select: none; -webkit-user-select: none; }`. Never `user-select: none` on body text.
- `input, textarea, select { font-size: 16px; }` minimum (prevents iOS zoom; the token sizes are larger anyway).
- Every `:hover` rule lives inside `@media (hover: hover) and (pointer: fine)`.

### 4.6 Tap targets

| Token | Value | Use |
|---|---|---|
| `--tap-min` | 48px | every control on the phone and in the console |
| `--tap-primary` | 56px | primary buttons and station entry buttons (cold November nights mean gloves) |
| `--tap-round` | 96px | Talk and record round controls |

Adjacent targets keep at least `--space-s` (12px) between hit areas. Icon buttons draw a 24px icon inside a 48px hit area.

### 4.7 Icons

Nine inline SVG icons, 24 × 24 viewBox, `stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none` unless marked filled. No icon library.

| Name | Path |
|---|---|
| back | `M15 5l-7 7 7 7` |
| close | `M6 6l12 12M18 6L6 18` |
| play (filled) | `M8 5v14l11-7z` |
| pause (filled) | `M7 5h3v14H7zM14 5h3v14h-3z` |
| stop (filled) | `M7 7h10v10H7z` |
| mic | `M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3` |
| check | `M5 12l5 5 9-10` |
| alert | `M12 3l10 18H2zM12 10v5M12 18v.01` |
| headphones | `M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z` |

The compass arrow is its own filled shape: `M12 2l7 19-7-4-7 4z`, drawn at 120px.

Icons beside a visible word get `aria-hidden="true"`. Icon-only buttons get an `aria-label`.

---

## 5. Motion

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | anything entering, press feedback, release snap-back |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | things moving on screen: pane flight, glow changes |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | sheets |
| `linear` | | hold progress rings, recording timer, candle |
| `--dur-press` | 120ms | button press scale and fill |
| `--dur-fast` | 180ms | notices, view exit, focus ring |
| `--dur-base` | 240ms | view enter, sheet exit |
| `--dur-sheet` | 320ms | sheet enter |
| `--dur-glow` | 1200ms | any glow change on phone and `/screen` |
| `--dur-flight` | 700ms | caught pane flying into the mini window |

Exits are about 75% of their enter. `ease-in` is never used.

### 5.2 What animates and how

| Element | Trigger | Motion | Purpose |
|---|---|---|---|
| Any button | pointer down | `transform: scale(0.97)` and fill to pressed token, `--dur-press` `--ease-out`; on release back in `--dur-press` | feedback |
| Station views (Talk, Colour, Lamp, Echo, Between sites) | open | opacity 0 to 1 and `translateY(12px)` to 0, `--dur-base` `--ease-out`; close: opacity to 0, `--dur-fast` | spatial continuity |
| Sheet | open / close | `translateY(100%)` to 0, `--dur-sheet` `--ease-drawer`; close `--dur-base` `--ease-out`; backdrop opacity same durations | spatial continuity |
| Notice | appears / clears | opacity and `translateY(-8px)`, `--dur-fast` `--ease-out` | state change |
| GlowMark, rose-window brightness, halo | glow message (every 5 s) | opacity and colour mix over `--dur-glow` `--ease-in-out` | state change without jumps |
| Hold rings (lens 2 s, lamp 1.5 s, candle 60 s) | holding | stroke fills `linear` over the hold time; on break, empties in 200ms `--ease-out` | slow while the user commits, fast when the system resets |
| Recording ring (echo, 20 s) | recording | fills `linear` over 20 s | time left |
| Lens colour disk | 10 readings per second | `background-color` transition 100ms linear | follows the camera without flicker |
| Caught pane | caught | disk scales to fill the lens, 300ms `--ease-out`; then shrinks to `scale(0.12)` and translates to the mini window's slot, `--dur-flight` `--ease-in-out`; the slot then fades from `--surface-2` to the colour over 240ms | shows where the colour went |
| Compass arrow | heading or position update | `transform: rotate(...)` set directly on the element every update, no CSS transition; unwrap angles so 359 to 1 turns 2 degrees, not 358 | direction |
| Talk round control while listening | mic level | outer ring `scale(1 + 0.08 × level)` written to `style.transform` each frame | proof the mic hears you |
| Talk background under `set_light` | tool call | colour overlay at `min(intensity, 1) × 0.25` alpha, `--dur-glow` `--ease-in-out` | the monument changes the light |
| Lamp pulse (all lit phones together) | LightSurface lit and the clock offset known | brightness dips from 100% to 88% and back every 4 s, in phase on every phone (6.14) | strangers' lamps breathe as one |
| Candle flame (memorial) | stillness progress | flame `scale(0.4)` to `scale(1)` with the Ring's progress; lit: stays at 1 | the candle grows as you stay |

### 5.3 Never animates

Persona and visitor captions (no typewriter effect), numbers (no counting up; they change in place), sites list order, chart data on refresh (Recharts `isAnimationActive={false}`), anything in `/curate` (keyboard-heavy tool), page scroll (no scroll-linked effects, no fade-in on scroll), anything on an endless loop on the phone.

### 5.4 Interruption

- All phone UI motion uses CSS transitions (they retarget from the current value); keyframes only for the `/screen` and finale sequences, which nobody interrupts.
- Releasing a hold at any point empties its ring in 200ms and cancels the action.
- Opening a station while a view transition is running cancels the old one; the new view starts from opacity 0.
- If a new glow value arrives mid-transition, the transition retargets from the current value.

### 5.5 `/screen` canvas motion

Drawn in one `requestAnimationFrame` loop. Static layers (streets, river, window frames) are drawn once to an offscreen canvas and copied each frame. `devicePixelRatio` is capped at 2. The loop pauses when `document.hidden`. No React state is updated per frame.

| Event | Animation |
|---|---|
| Glow update | window brightness and halo ease to the new value over 1200ms |
| New pane | its segment flashes from `--lamp-white` to the pane colour over 1400ms `--ease-out`; one ring of 2px `--text` grows from radius R to 1.3R and fades from alpha 0.5 to 0 over 1200ms |
| Echo approved | three 2px `--text` rings grow from R to 3R over 3000ms, 400ms apart, alpha 0.4 to 0; the subtitle appears under the window (section 7.13) |
| Window complete | halo goes to alpha 1.0 and radius 2.6R in 600ms `--ease-out`, holds 1200ms, settles back over 1600ms; all 48 panes at full brightness during the flare; the slot set then empties into the new window over 800ms |
| Lamp lit | the site's name line brightens from `--text-2` to `--lamp` for 1000ms, then back over 1000ms |
| New site published | its window fades in from opacity 0 over 1200ms |
| Candle lit (memorial) | a new candle point fades in from 0 to its alpha over 3000ms `--ease-out`; no ring, no flash, no sound; existing points never move |
| Candle fading | each point's alpha follows its decay; recomputed with each glow update and eased over 1200ms |
| 1884 finale | see 7.13; the memorial's candles do not change during it |

### 5.6 Reduced motion (`prefers-reduced-motion: reduce`)

Fewer and gentler, not none. Keep: opacity fades (shortened to 150ms), glow brightness changes, ring fills (they carry time information), candle point fades on `/screen`. Remove: every `translate` and `scale` (views, sheets, notices appear by opacity only), the pane flight (the slot simply fades in), the talk level ring (show the word "Listening" instead), the candle flame growth (the flame shows at full size from the start; the Ring still fills), the lamp pulse (the lit screen stays at steady 100% brightness), `/screen` rings and ripples (one 600ms opacity flash on the segment or window instead), the finale flicker (replaced by a 1500ms fade to dark).

### 5.7 Flashing

Nothing flashes more than twice per second. The finale "crackle" is at most three dips in 1.5 s, each dip at least 250ms, and never full-screen white to black: it dips from the current image to 40% brightness. The lamp pulse is 0.25 cycles per second with a 12% brightness change and smooth (cosine-like) easing, so it is not a flash under WCAG 2.3.1.

### 5.8 Haptics and sound cues

Vibration runs only where `navigator.vibrate` exists (Android Chrome). iOS gets the sound and the visual alone. Every sound cue has a visual equivalent, and every visual event that matters is also spoken or heard.

| Event | Sound (generated asset) | Vibration | Visual |
|---|---|---|---|
| Lens reading a colour | glass tone, pitch from hue and lightness | none | colour disk |
| Colour caught | glass clink | `[40]` | disk fills lens, pane flight |
| Window completed by you | chord of the window's colours | `[40, 60, 40]` | mini window flare, line "You completed the window." |
| Arrived at a site | arrival chime | `[30, 60, 30]` | Between sites switches to the Site view with "{Site} is waking." |
| Arrived at the memorial | no chime; the beacon bed fades out over 3 s | none | Between sites switches to the memorial view; no "waking" line |
| Lamp lit | lamp crackle and hum | `[20]` | full-screen warm light |
| Echo sent | none | `[20]` | "Sent." state |
| Candle lit | none (silence is the point) | none | candle ring completes, flame at full size |
| Testimony starts or ends | none added (the narration is the sound) | none | play button state and caption text |
| 1884 finale | crackle, silence, waltz | none | finale sequence |

---

## 6. Components

All tokens referenced are from sections 2 to 5. State priority when several apply: disabled, loading, pressed, focus, hover, default.

### 6.1 Focus (applies to every interactive element)

`:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }` The 2px offset shows `--bg` between element and ring, so the ring passes 3:1 against any element colour. On `--lamp-white` surfaces the ring is `--ink-on-light`. Focus appears instantly (no transition). Never `outline: none` without this replacement.

### 6.2 Button

Purpose: every text action. Anatomy: optional 24px icon, label (`--type-label`), optional spinner. Full width on the phone; width fits content in the console and on `/screen`.

| Variant | Default | Pressed | Disabled |
|---|---|---|---|
| primary | fill `--lamp`, label `--on-lamp` | fill `--lamp-pressed`, scale 0.97 | fill `--surface-2`, label `--text-3` |
| secondary | transparent, 1.5px `--line-strong` border, label `--text` | fill `--surface-2`, scale 0.97 | border `--line`, label `--text-3` |
| quiet | transparent, no border, label `--text-2`, underline offset 4px | label `--text` | label `--text-3`, no underline |
| danger | transparent, 1.5px `--danger` border, label `--danger` | fill `--surface-2` | as secondary disabled |
| icon | 48px circle (`--radius-round`), transparent, 24px icon `--text`, `aria-label` required | fill `--surface-2`, scale 0.97 | icon `--text-3` |

Sizes: L height `--tap-primary` (56px), padding 0 `--space-l`; M height `--tap-min` (48px), padding 0 `--space-m`. Radius `--radius-m`. Height grows when the label wraps (min-height, not height).

Hover (fine pointers only): primary fill `--lamp-pressed`; secondary fill `--surface`; quiet label `--text`.

Loading: label stays, a 16px spinner (2px `--on-lamp` or `--text` arc, 270 degrees, rotating 800ms linear) replaces the icon, `aria-busy="true"`, taps ignored. Error: the button returns to default and a Notice or field error says what failed; the button never turns red. Only one primary button per screen.

### 6.3 Ring

Purpose: progress around a circle (hold steady, raise lamp, recording time, candle). Anatomy: SVG circle track and progress arc, starting at 12 o'clock, clockwise, round caps. Track 1.5px `--line-strong`; progress 6px `--text` (on dark) or `--ink-on-light` (on light). States: empty, filling (linear), complete (stroke stays full), reset (empties in 200ms `--ease-out`). Exposes `role="progressbar"` with `aria-valuenow` in whole percent, updated at most once per second for screen readers.

### 6.4 RoundControl

Purpose: Talk (hold to talk, or a start/stop toggle in hands-free) and Echo (record toggle). Anatomy: 96px circle (`--tap-round`), 32px icon (mic or stop), a Ring around it at 112px, a text label under it (`--type-label`, always visible).

| State | Look | Label (en) |
|---|---|---|
| idle | fill `--surface-2`, 1.5px `--line-strong` border, mic `--text` | "Hold to talk" / "Tap to record" |
| pressed or listening | fill `--lamp`, mic `--on-lamp`, level ring scales with mic level | "Listening" |
| persona speaking | fill `--surface-2`, ring `--lamp` at 40% opacity | "Hold to interrupt" |
| connecting | fill `--surface-2`, spinner inside | "Connecting" |
| recording | fill `--surface-2`, stop icon `--text`, Ring fills over 20 s, `--danger` dot and seconds above | "Recording, 14 s left" |
| disabled | fill `--surface-2`, icon `--text-3`, no ring | reason in the label ("Microphone is off") |
| error | idle look | Notice explains |

Keyboard: Space or Enter held acts as hold; in toggle mode, press toggles. Hold is never the only way: Talk offers a "Hands-free" switch (secondary button that toggles `aria-pressed`) that turns the control into tap to start / tap to end.

### 6.5 GlowMark

Purpose: how awake a site is. Anatomy: 20px circle (core, `--lamp` at the opacity in 2.3), a 40px halo circle behind it (`--lamp` radial gradient at `0.35 × glow`), then the word and the percent: "Awake, 72%" in `--type-label` `--text`. Sizes: S (core 12px, halo 24px, word in `--type-meta`) for list rows; M as above for the Site view. Loading (no glow received yet): core at 25%, word "Listening for the city…" in `--text-3`. Offline: keeps the last value and adds "(last known)" in `--text-3`. Accessible name: "{Site} is awake, glow 72 percent". Never used for the memorial: wherever a GlowMark would sit, the memorial shows the word "Memorial" (`--type-label` `--text-2`, "Memorial" in Romanian as well) and nothing else.

### 6.6 RoseWindow

Purpose: a site's stained-glass window of caught colours. The four colour sites have one; the memorial never does. Same geometry on phone (SVG) and `/screen` (canvas). Radius R; start angle 12 o'clock; clockwise.

| Ring | Slots | Radius band |
|---|---|---|
| centre rosette | 0 to 7 (8 sectors) | 0 to 0.30R |
| inner ring | 8 to 23 (16 segments) | 0.34R to 0.62R |
| outer ring | 24 to 47 (24 segments) | 0.66R to 1.00R |

Leading (the gaps and the strokes between segments): `--bg`, stroke width `max(1.5px, 0.012R)`. Frame: 1.5px `--line-strong` circle at R + 2px. Fill: empty slot `--surface-2`; filled slot per 2.3. Halo behind: per 4.3.

Sizes: L 240px diameter on the Site view (`min(64vw, 280px)`); S 72px in the lens corner; `/screen` 192 × `--u` px. States: loading (frame and empty slots only, no halo), asleep, awake, complete flare (5.5), offline (last known slots, no halo change). Accessible name: "{Site} window, 31 of 48 panes". On the phone it is not interactive.

### 6.7 Notice

Purpose: connection, permission and fallback messages. Inline at the top of the content area under the top bar (pushes content, never covers it). Anatomy: 24px icon, text (`--type-body`), optional action as a quiet button on the right or below when the text wraps. Fill `--surface-2`, radius `--radius-s`, padding `--space-s` `--space-m`.

| Variant | Icon | Use | Live region |
|---|---|---|---|
| info | headphones or none, `--text` | "Tap to listen" (audio suspended), live talk resting, demo info | `role="status"` |
| connection | alert, `--text-2` | reconnecting, slow network | `role="status"` |
| error | alert, `--danger` | permission denied, upload failed | `role="alert"` |

At most one Notice at a time; the newest replaces the old. Connection notices wait 3 s before showing (most reconnects finish sooner), and clear on success with "Connected" for 2 s.

### 6.8 Sheet

Purpose: content over a station without leaving it: sites list, archive image, "What happens to your voice". Anatomy: `--surface`, top corners `--radius-m`, a 4 × 36px `--line-strong` handle (visual only, no drag), a title (`--type-title`), a close icon button top-right, scrolling content with `overscroll-behavior: contain`, bottom padding includes the safe area. Height: content height, max 85dvh. Closes by close button, backdrop tap, Escape, and the phone's back gesture (opening pushes a history entry). Focus moves to the title on open and returns to the opener on close; focus is trapped inside while open.

### 6.9 SiteRow

Purpose: one site in the sites list. Anatomy, left to right: GlowMark S, then name (`--type-body` 600 `--text`) over a meta line (`--type-meta` `--text-2`: "220 m, about 3 min walk"), then a reason tag when it is the suggestion ("Suggested: going dark", `--type-meta` `--lamp`). Whole row is one button, min-height 64px, padding `--space-m`, divider 1px `--line` between rows. States: default; pressed fill `--surface-2`; current site shows "You are here" instead of the distance; no position shows no distance line ("Distance unknown"). Memorial row: the word "Memorial" replaces the GlowMark; it can be the suggestion (the next-site score treats it like any site), but its tag is always "Suggested: nearest", never "going dark".

### 6.10 Captions

Purpose: what the persona and the visitor said during Talk. Anatomy: persona name (`--type-label` `--text-2`) with "AI voice" (`--type-meta` `--text-3`) beside it, once at the top; persona lines in `--type-lead` `--text`; visitor lines in `--type-body` `--text-2` under a "You" label (`--type-meta`); archive image cards inline. Newest at the bottom, area scrolls, auto-scrolls only if the user was already at the bottom. Keeps the whole conversation (2 minutes maximum). States: empty ("{Persona} is listening. Hold the button and ask anything." in `--text-2`), streaming (partial persona line shows as it arrives, no cursor effect), fallback (answer text of the tapped question). The region is `aria-label="Captions"` and not a live region (the voice is already audible; announcing it would talk over it).

### 6.11 ColourLens

Purpose: read a colour from the rear camera. Anatomy: full-bleed camera video; `--scrim` over everything outside a circle; the lens circle `min(72vw, 300px)` diameter, centred horizontally, centre at 42% of the viewport height; inside the lens the live image plus a colour disk (40% of the lens) filled with the current reading; a Ring around the lens (hold steady 2 s); the mini RoseWindow S in the top-right corner under the top bar; the instruction line under the lens (`--type-lead`); under it a 24px swatch square (radius 4px, 1.5px `--line-strong` border) of the current reading with the colour's name beside it (`--type-label` `--text`, from 2.4, in the UI language, updated with each reading).

| State | What shows | Text (en) |
|---|---|---|
| starting camera | lens empty `--surface-2`, spinner | "Starting the camera" |
| reading | live image, colour disk, Ring empty | "Point at a colour and hold still" |
| holding | Ring filling over 2 s | "Hold still" |
| unsteady | Ring resets (200ms) | "Hold still" stays |
| caught | disk fills lens, flight to mini window; the swatch and name freeze on the caught colour (name now `--type-title`) | "Your colour is in the {Site} window. {n} of 48." |
| caught, window complete | mini window flare | "You completed the window." |
| sending failed | caught state kept, Notice | "Not sent yet. Trying again." |
| rate limited | lens dimmed, Ring hidden | "You have given this window enough colours for now. Try another site." |
| camera denied | lens `--surface-2`, no video | see 7.5 |
| remote mode | mini window is the Gallery window | "Your colour is in the Gallery window." |

### 6.12 CompassCard

Purpose: glanceable direction and distance to the chosen site. Anatomy, top to bottom: the compass arrow (120px, `--lamp`), distance (`--type-numeral` `--text`), site name (`--type-title`), GlowMark M, the landmark hint (`--type-body` `--text-2`, one sentence from the site content). Arrow rotation is relative bearing (bearing to site minus heading). States:

| State | Arrow | Distance | Extra line |
|---|---|---|---|
| tracking | rotates | "220 m" | none |
| no compass (denied or unsupported) | hidden | "220 m" | "To the north-east" (from absolute bearing, eight directions) |
| weak position (accuracy over 60m, fix ignored) | last arrow at 40% opacity | "about 300 m" | "Finding your position" |
| no position | hidden | "Distance unknown" | "Location is off. Use Open in Maps or pick from the list." |
| arriving (inside the geofence) | replaced by a GlowMark L | "Here" | "{Site} is waking." |
| memorial chosen | rotates as usual | "220 m" | the word "Memorial" instead of the GlowMark; the extra line reads "A place of remembrance. Listening and candles only." |
| arriving at the memorial | hidden | "Here" | none; the memorial view opens |
| lantern (10 s without touch) | opacity 0.6, everything else 0.6 | stays | tap anywhere restores 1.0 in `--dur-fast` |

In the lantern state the arrow (`--lamp` at 60% on `--bg`) still measures above 3:1 and the distance numeral above 4.5:1. The accessible text is updated at most every 10 s: "Iron Tree, 220 metres, ahead and slightly left".

### 6.13 LampCounter

Purpose: the city-wide goal. Anatomy: value "412 / 731" (`--type-numeral`, value in `--lamp`, "/ 731" in `--text-2`), label "lamps lit today" (`--type-meta` `--text-2`). Sizes: S inline on the Site view (value in `--type-label`, one line: "412 / 731 lamps lit today"); L on Lamp and finale screens (on `--lamp-white`: value `--ink-on-light`, rest `--ink-on-light-2`); `/screen` uses `--screen-numeral`. States: loading ("... / 731" with "lamps lit today"), live, offline (last value plus "(last known)"), 731 reached (finale). The memorial never shows it. The value is `role="status"` `aria-atomic="true"` and is announced at most once a minute ("412 of 731 lamps lit today").

Presence line (size L only, on the Lamp screen): one sentence under the counter in `--type-body` (`--text-2` on dark, `--ink-on-light-2` on light), saying how many people are lighting this site now. The count is the number of distinct sessions that sent a lamp event at this site in the last 90 s, delivered per site in the `lamps` socket message. While the visitor's own lamp is lit, the count includes them.

| Count | Before lighting (en / ro) | While lit (en / ro) |
|---|---|---|
| unavailable (no per-site value in the message, offline, or not received yet) | line hidden | line hidden |
| 0 | "Nobody is lighting {Site} right now." / "Nimeni nu aprinde {Site} acum." | (treated as 1) |
| 1 | "1 person is lighting {Site} now." / "O persoană aprinde {Site} acum." | "You are lighting {Site}." / "Tu aprinzi {Site}." |
| 2 | "2 people are lighting {Site} now." / "2 persoane aprind {Site} acum." | "You and 1 other person are lighting {Site} now." / "Tu și încă o persoană aprindeți {Site} acum." |
| 3 to 19 | "{n} people are lighting {Site} now." / "{n} persoane aprind {Site} acum." | "You and {n-1} others are lighting {Site} now." / "Tu și încă {n-1} persoane aprindeți {Site} acum." |
| 20 and more | same English | Romanian inserts "de": "{n} de persoane aprind {Site} acum." / "Tu și încă {n-1} de persoane aprindeți {Site} acum." |

The line changes in place (no animation). It is not a live region; screen readers reach it by reading the screen.

### 6.14 LightSurface

Purpose: the phone as a light source (Lamp lit, finale burst). Full screen at z 40, fill `--lamp-white`, no chrome except the bottom text block and one quiet exit button (`--ink-on-light`, 48px, "Lower the lamp"). Requests Screen Wake Lock while open and releases it on close. States: entering (opacity 0 to 1 over 600ms `--ease-out`), lit, pulsing, leaving (opacity to 0 over 450ms), wake lock refused (works anyway; screen may dim).

Pulsing (Lamp lit only, not the finale): every lit phone breathes on the same 4 s cycle, so a square full of raised phones pulses together.

- An overlay of `--bg` covers the whole LightSurface, text included, with opacity running from 0 to 0.12 and back. The screen goes from `--lamp-white` (100%) at its brightest to `#E2D9C8` (about 88%) at its darkest. Text stays above 4.5:1 throughout (2.2).
- Curve: a CSS keyframe animation of the overlay's `opacity`, 4000ms, infinite: keyframes 0% opacity 0, 50% opacity 0.12, 100% opacity 0, timing function `ease-in-out` (close to a cosine). Opacity only, so it runs off the main thread.
- Phase: brightest at every whole multiple of 4000ms of server time. With `serverNow = Date.now() + clockOffset`, set `animation-delay: -(serverNow mod 4000)ms` when the surface opens and whenever the clock offset changes. Phones agree to within the offset's error (tens of ms).
- No clock offset yet: no pulse; the surface stays at steady 100% until the offset is known, then starts in phase. A pulse out of step with other phones is worse than none.
- Reduced motion: no pulse, steady 100%.

### 6.15 AudioPlayer (curator)

Purpose: listen to an echo before approving. Anatomy: play/pause icon button (48px), a scrubber (native `<input type="range">` styled: track 4px `--line-strong`, played part `--lamp`, thumb 20px `--text` with 48px hit area), time "0:07 / 0:19" (`--type-meta` tabular). States: loading (button disabled, "Loading audio"), ready, playing, ended (resets to start), error ("Could not play this echo. Download it" as a quiet link to `GET /blob/:key`). Keyboard: Space toggles play when the player has focus, arrow keys seek 5 s.

### 6.16 Field

Purpose: text input, text area, checkbox (echo consent, add a place).

- Text input and text area: label above (`--type-label`), field 48px high (text area 120px), fill `--surface-2`, 1.5px `--line-strong` border, radius `--radius-s`, text `--type-body` `--text`, placeholder `--text-3` (placeholders never replace labels). Focus: border `--text` plus the focus ring. Error: border `--danger`, message under the field with alert icon in `--danger` `--type-meta`, `aria-invalid="true"` and `aria-describedby` to the message. Disabled: border `--line`, text `--text-3`.
- Checkbox: 24px box, 1.5px `--line-strong`, radius 6px; checked fill `--lamp` with check icon `--on-lamp`; the whole row (box plus label text) is the 48px hit area; label `--type-body`.

### 6.17 QRBlock

Purpose: join the installation from `/screen`, open a newly published place. Generated with the `qrcode` npm package: drawn to a canvas on `/screen`, rendered as an SVG string everywhere else. Options: error correction level `M`, margin 4 (modules), dark colour `#0E121A`, light colour `#FFF4E0`. Anatomy: the code, and a caption under it. The `/screen` code encodes the app's origin plus `/?mode=remote`. Sizes: `/screen` 240 × `--u` px with caption "Scan to join from here" (`--screen-body`); console 200px with the URL in `--type-meta` and a "Copy link" secondary button. States: loading (empty `--lamp-white` square), ready, error (no code; caption shows the URL as text).

### 6.18 Ticker (`/screen`)

Purpose: what just happened. DOM, not canvas. Anatomy: up to 6 lines, newest on top; each line: optional 20px square swatch (pane colour, radius 2px) then text (`--screen-body` `--text`), time ago (`--screen-meta` `--text-3`). Lines wrap to two lines max. A new line fades in over 400ms; older lines move down instantly. Empty state: "Waiting for the first visitor tonight." in `--text-2`. Line copy in 7.13.

Memorial line (calmer variant): no swatch; in its place a 10px circle of `--lamp-white` at 60% opacity; text in `--screen-body` `--text-2` (not `--text`); no time-ago; fades in over 1200ms instead of 400ms. Copy: "A candle was lit at the Cathedral." / "O lumânare a fost aprinsă la Catedrală." At most one memorial line is in the list at a time: a newer candle replaces the older memorial line in place instead of adding a line.

### 6.19 ChartCard and ColourClock (`/pulse`)

ChartCard: `--surface` card, radius `--radius-s`, padding `--space-l`, title as the question it answers (`--type-label` `--text`), a one-sentence text summary under the chart (`--type-meta` `--text-2`, e.g. "Busiest now: Piața Unirii, 38 interactions in the last 5 minutes."), and a visually hidden `<table>` with the same data. Recharts styling: gridlines horizontal only, 1px `--line`; axis ticks 15px `--text-3`; lines 2px `--lamp`, no dots, no area fill; bars `--lamp` with value labels in `--text` at the bar end; tooltip `--surface-2`, radius `--radius-s`, `--type-meta`. No legends: series are labelled directly or split into small multiples. States: loading (card at its final height, title visible, a 1px `--line` baseline, "Loading" in `--text-3`), empty (title plus "No {thing} yet today."), error ("Could not load. Trying again in 5 s."), stale (over 30 s old: "Updated {n} s ago" in `--text-3`).

ColourClock: a 24-segment ring (one per hour, 0 at 12 o'clock, clockwise), outer diameter 420px at desk width and `min(84vw, 360px)` on a phone, ring thickness 18% of the radius, 2px `--bg` gaps. Each segment is filled with that hour's mean hue at the hour's mean lightness (real data colour); hours with no panes are drawn as a 1.5px `--line-strong` outline. Hour labels 0, 6, 12, 18 outside the ring in `--type-meta` `--text-3`. The centre shows the current hour's colour as a 30%-radius disk with "Now, {hour}:00" and the pane count below the ring in `--type-meta`. The current hour's segment has a 3px `--text` outline. The hidden table lists hour, hex and pane count.

CandleMarks (the memorial on `/pulse`): a ChartCard titled "Candles at the Metropolitan Cathedral" with no numbers anywhere. Inside: a 1px `--line` horizontal line across the card, labelled only "Earlier today" at its left end and "Now" at its right end (`--type-meta` `--text-3`). Each candle lit in the last 24 hours is a 6px circle of `--lamp-white` at 60% opacity, placed on the line by the time it was lit (left end is 24 hours ago, right end is now), vertically jittered within ±8px by a hash of its id so close candles do not hide each other. No axis values, no tooltip, no count, no hidden table. The text summary is "Candles have been lit here today." or, with none, "No candles yet today." Loading and error states as ChartCard, without numbers.

### 6.20 TopBar

Purpose: orientation and exit on phone sub-views and the console header. Phone: height 56px plus top safe area, `--bg` (no fill change), left a back icon button (48px, `aria-label="Back to {Site}"`), centre the site name in `--type-label` `--text-2` (only on station views), right the DemoBadge slot. Console: 64px, `--surface`, wordmark left, tabs centre-left, signed-in email (`--type-meta` `--text-2`) and a quiet "Sign out" right.

### 6.21 DemoBadge

Purpose: tell judges the position is simulated. Shown on every phone view when `?demo=1`. A `--surface-2` rounded rectangle (`--radius-s`), `--type-meta` `--text`: "Demo position". Not interactive. Screen readers read it as part of the top bar.

### 6.22 Candle (memorial)

Purpose: the minute of stillness. Anatomy: a Ring 200px; inside it a candle drawn in SVG: a 12 × 48px stem in `--text-2` with 2px radius, centred, its base 40px above the ring's bottom inner edge; a teardrop flame 18 × 30px in `--lamp-white` above the stem, scaled from its base from 0.4 (unlit) to 1.0 (lit) with the Ring's progress; under the Ring one instruction line (`--type-body` `--text`).

| State | Look | Text (en / ro) |
|---|---|---|
| ready | Ring empty, flame 0.4 at 40% opacity | "Hold your phone still to light a candle." / "Ține telefonul nemișcat ca să aprinzi o lumânare." |
| filling | Ring fills linearly over 60 s (5 s with `?demo=1`) while the phone is still; flame grows | same line |
| moved | Ring empties in 200ms; flame back to 0.4; no other message | same line |
| lit | Ring full, flame 1.0 at 100% opacity, stays | "Your candle is lit." / "Lumânarea ta e aprinsă." |
| no motion sensor, permission denied, or stillness check not shipped | Ring hidden; flame 0.4; a secondary L button under it | "Light a candle" / "Aprinde o lumânare"; tapping lights it at once (lit state) |

Stillness uses motion only: the phone counts as still while the rotation rate stays under 5 degrees per second. The microphone is never used. The Ring is a `role="progressbar"` named "Candle"; the lit state is announced once via `role="status"`: "Your candle is lit."

### 6.23 Testimony

Purpose: one narrated, sourced testimony at the memorial. Anatomy, stacked: title (`--type-body` 600 `--text`, for example "The night of 17 December"); a meta line "Narrated, 2:40" (`--type-meta` `--text-2`); a source line "Source: {source name, year}" (`--type-meta` `--text-2`, and a link when the source has a URL); a play/pause Button (icon variant) at the left of the title. While playing, the narration text appears under the item in `--type-body` `--text` (max 65ch), and the play button becomes pause with the elapsed time "0:42 / 2:40" (tabular). Item padding `--space-m`, 1px `--line` divider between items, no card.

States: ready; loading (button disabled with spinner, "Loading"); playing; paused (keeps position); ended (back to ready, text stays visible); error ("This testimony did not load. The text is below." and the narration text shown). Only one testimony plays at a time; starting another pauses the current one. The play button is named "Play testimony: {title}". The narrator is labelled once at the top of the list: "Read by a narrator. AI voice." Sources are always visible, never behind a tap.

---

## 7. UX experience

### 7.0 Copy voice

The interface speaks plainly and quietly; the sites speak with character (that is the personas' job, not the UI's). Rules: second person, present tense, short sentences, verbs from the concept (wake, catch, raise, leave, listen). No exclamation marks, no "unlock", "points", "level", "awesome". Numbers are real or not shown. Every error says what happened and what to do next. Button labels are a verb plus an object ("Wake Piața Unirii", "Send echo"), never "OK", "Get started", "Learn more". No em dashes in UI copy.

| Moment | English | Romanian |
|---|---|---|
| Join, poster site | "{Site} is asleep." / button "Wake {Site}" | "{Site} doarme." / "Trezește {Site}" |
| Headphones hint | "Put on headphones. LAMPA guides you with sound." | "Pune-ți căștile. LAMPA te ghidează prin sunet." |
| Keep open | "Keep LAMPA open while you walk. Sound and location stop when the page is in the background." | "Ține LAMPA deschisă cât mergi. Sunetul și locația se opresc când pagina e în fundal." |
| Lens | "Point at a colour and hold still" | "Țintește o culoare și ține telefonul nemișcat" |
| Caught | "Your colour is in the Iron Tree window. 47 of 48." | "Culoarea ta e în vitraliul Arborelui de Fier. 47 din 48." |
| Talk fallback | "Live conversation is resting. Tap a question." | "Conversația live e în pauză. Alege o întrebare." |
| Echo sent | "Sent. A curator listens to it before it plays here." | "Trimis. Un curator îl ascultă înainte să se audă aici." |
| Offline | "No connection. The sound keeps playing. Your colours send when you are back online." | "Fără conexiune. Sunetul continuă. Culorile tale se trimit când revii online." |

A native Romanian teammate reviews every Romanian string before Build 4.

Memorial voice: at the Metropolitan Cathedral the UI uses no verbs from the game loop (no wake, catch, raise, glow, light up the city) and no numbers. It speaks in short, plain, past-tense or present-tense statements, and every factual sentence has a visible source. The four personas mention the Cathedral only with one pre-written sentence each, approved like any other content, with no jokes and no invitation to "wake" it. For example: "The Metropolitan Cathedral remembers December 1989. If you go, go quietly."

### 7.1 Join and permission primer (`/s/:siteId` first view, and `/`)

User goal: hear the place within seconds, with one tap.

Layout (phone, top to bottom): wordmark `LAMPA` (`--type-label`, `--text-2`) at `--space-3xl` from the top; the site name (`--type-display`); the line "{Site} is asleep." (`--type-lead` `--text-2`); a dark RoseWindow L with the site's real panes at asleep brightness (the page's single visual); then, in the bottom action area: headphones icon with "Put on headphones. LAMPA guides you with sound." (`--type-body` `--text-2`), the primary button L "Wake {Site}", and under it the keep-open line (`--type-meta` `--text-3`). On `/` (no site in the URL) the name is "Timișoara is asleep." and the button is "Wake the city".

Primary action: the one button. In the same tap handler it requests location, requests compass (`DeviceOrientationEvent.requestPermission` on iOS), and resumes the AudioContext. Camera and microphone are never asked here.

The five seeded sites' names, poster lines, coordinates and sound beds are built into the web app, so this screen renders and plays without waiting for the API.

Memorial variant (`/s/` for the Metropolitan Cathedral): no rose window and no "asleep" line. The page shows the name, the line "A place of remembrance for December 1989." / "Un loc de amintire pentru decembrie 1989." (`--type-lead` `--text-2`), an unlit Candle drawing (flame 0.4, no Ring) in place of the window, the same headphones hint, and the primary L button "Listen" / "Ascultă". The tap asks for the same permissions; success opens the memorial view (7.11).

| Situation | What happens |
|---|---|
| success with site | button shows loading "Waking {Site}" until the bed plays (target under 3 s), then the Site view enters; the sound fades in over 2 s |
| success on `/` | Between sites opens with the sound compass running and the CompassCard pointing at the suggested site |
| location denied, site in URL | continue to the Site view (QR mode: the URL says where you are); Notice info: "Location is off. This site still works. To walk to the next one, use the list." |
| location denied on `/` | the Sites list opens in remote mode (no distances) with the same Notice |
| compass denied | continue; CompassCard uses words instead of the arrow (6.12) |
| audio blocked or suspended | Notice info with action "Tap to listen" on every view until audio runs |
| API slow (cold start) | nothing blocks; glow shows "Listening for the city…"; after 8 s Notice connection: "Still connecting to the city. You can already listen." |
| site id unknown | "We could not find this place." plus primary "Show all sites" |
| first run with no data | the window is empty (48 `--surface-2` panes); the line reads "{Site} is asleep. Be the first light tonight." |

### 7.2 Site view (`/s/:siteId`)

User goal: choose what to do here.

Layout: top bar with DemoBadge only; site name (`--type-display`); GlowMark M; LampCounter S (lamp sites only); RoseWindow L centred with its halo; then the action area in the bottom 40%: **Talk** as primary L, then a two-column grid (`repeat(auto-fit, minmax(9rem, 1fr))`, gap `--space-s`) of secondary L buttons for the interactions this site has: "Catch a colour", "Raise a lamp" (only where the site lists `lamp`), "Leave an echo"; then a quiet row: "Next site" (opens Between sites) and "Keep my colours" (only after this session has caught at least one colour and the visitor is not signed in). At large text sizes the grid falls to one column by itself.

Sending `wake` happens on open; the glow then follows the 5 s pushes.

| Situation | What happens |
|---|---|
| asleep (glow under 0.15) | window at 45% brightness, no halo, GlowMark "Asleep" |
| wake from you | within 5 s the halo grows (1200ms); nothing else celebrates |
| site at 100% | GlowMark "Fully lit"; persona and sound handle the rest |
| arrived by GPS from Between sites | chime, vibration, the view enters with the line "{Site} is waking." under the name for 4 s |
| offline | Notice connection; actions still open (Talk falls back, colours queue) |
| remote mode (`/?mode=remote`, the `/screen` QR code) | no arrival line; "Raise a lamp" hidden (it needs to be at the lamp sites) |
| memorial site | never shows this view; it has its own (7.11) |

### 7.3 Talk

User goal: ask the monument something and hear it answer.

Layout: top bar (back, site name); Captions fill the middle; the bottom action area holds the RoundControl (hold to talk), under it the "Hands-free" toggle (secondary M), then "End conversation" (quiet). Opening Talk is the moment the microphone is requested, inside the tap on the Site view's Talk button.

| Situation | What happens |
|---|---|
| connecting (signed URL plus session) | RoundControl "Connecting"; the pre-generated greeting clip plays at once so the visitor hears the persona even before the live session opens |
| live, holding | "Listening"; release sends |
| persona speaking | captions stream; other audio ducks 12 dB (sound engine); RoundControl "Hold to interrupt" |
| `show_archive_image` | an image card appears in Captions (max height 40dvh, `--radius-s`, credit line `--type-meta` `--text-3`); tapping it opens the Sheet full size with the image's alt text and credit |
| `set_light` | background tint per 5.2 |
| `start_colour_catch` | the Colour lens opens; after catching it returns to Talk and the persona reacts |
| `start_echo_recording` | the Echo recorder opens with the persona's prompt as its instruction |
| `suggest_next_site` | the conversation ends after the persona's line; Between sites opens on that site with the beacon |
| 2-minute cap reached | session ends; Captions end with "Time is up for this conversation." and the tap-to-ask questions appear |
| microphone denied | no live session; tap-to-ask opens with Notice error: "The microphone is off, so the monument cannot hear you. Tap a question instead, or allow the microphone in your browser settings." |
| agent error, no credits, slow network (no session after 8 s) | automatic switch, no reload: Notice info "Live conversation is resting. Tap a question."; RoundControl is replaced by 3 to 4 secondary L buttons, one per question, full width, left-aligned text |
| tapped question playing | that button shows a pause icon and "Playing"; others stay enabled (tapping one stops the current clip); the answer text appears in Captions |
| clip fails to load | the browser voice reads the answer text; Captions show it; no message unless that fails too ("Could not play the answer. Here it is as text.") |
| first run | Captions empty state (6.10) |

### 7.4 Archive image

Opened from Talk only. Sheet with the image `width: 100%`, `object-fit: contain`, alt text from the media caption, credit and year under it (`--type-meta` `--text-2`), close button. Loading: a `--surface-2` box at 4:3 with "Loading image". Error: "This image did not load." and the caption text. Empty state does not exist (the tool only fires with an image id).

### 7.5 Catch a colour (Colour lens)

User goal: give the site a colour from the real city.

Layout: ColourLens fills the screen; top bar with back; mini window top-right; instruction under the lens; bottom: "Back to {Site}" (secondary L). After a catch the bottom shows "Say why" (secondary L, opens Echo with the prompt "Why this colour?") and "Back to {Site}" (primary L), plus "Keep my colours" (quiet) if not signed in.

The camera is requested inside the tap that opened the lens. Frames never leave the phone; the screen says so on first use under the instruction for 5 s: "Only the colour leaves your phone, never the picture."

| Situation | What happens |
|---|---|
| success | 6.11 caught states; clink, vibration, flight; `POST /panes`; the slot fills when the server confirms (within 1 s); if the server assigns a different slot than predicted, the mini window shows the server's slot |
| window completed by your pane | chord, mini window flare, "You completed the window." |
| camera denied | lens empty; text: "LAMPA needs the camera to read a colour. Only the colour leaves your phone. Allow the camera in your browser settings, then try again."; buttons "Try again" (secondary) and "Back to {Site}" |
| no camera (desktop) | "This device has no camera we can use. Try on your phone." and "Back to {Site}" |
| dark scene | the reading is "Night glass" (a real, allowed colour), named as such under the swatch |
| slow network | the catch completes locally; "Sending your colour" under the line; then the confirmed line |
| offline | Notice connection; the pane waits and sends on reconnect; the line reads "Saved on this phone. It sends when you are back online." |
| rate limited | 6.11 |

### 7.6 Leave an echo (Echo recorder)

User goal: leave up to 20 seconds of memory that may play here later.

Layout: top bar; the prompt (`--type-lead`: the persona's prompt, or by default "Leave a memory of this place. Up to 20 seconds."); RoundControl in toggle mode; under it the consent Checkbox: "Play my voice here in public after a curator listens to it." and a quiet link "What happens to my voice" (opens a Sheet: "Your recording is stored on our server and transcribed. A curator listens to it. If approved, visitors here hear it in your voice. If rejected, it never plays. We do not ask for your name."); bottom: after recording, "Send echo" (primary L), "Record again" (secondary L).

The microphone is requested inside the tap on the record control.

| Situation | What happens |
|---|---|
| recording | `--danger` dot, "Recording", seconds left, Ring fills over 20 s; stops by tap or at 20 s |
| recorded | play/pause preview (icon button 48px with "0:14"), Send and Record again |
| consent unchecked | "Send echo" disabled with the line "Tick the box to send." under it |
| uploading | "Send echo" loading "Sending"; the recording stays on the phone until the server accepts it |
| success | the screen becomes: "Sent. A curator listens to it before it plays here." plus "Back to {Site}" (primary) |
| upload failed | Notice error "Your echo did not send. It is still here." and "Send echo" becomes "Try again"; the recording is never discarded on failure |
| microphone denied | RoundControl disabled "Microphone is off"; text with the settings instruction; "Back to {Site}" |
| under 1 second recorded | "That was too short to send. Record again." |
| leaving with an unsent recording | browser back opens a confirm Sheet: "Discard this echo?" with "Discard" (danger M) and "Keep recording" (secondary M) |

### 7.7 Raise a lamp (Lamp)

User goal: light a lamp for the city by raising the phone.

Layout before lighting: top bar; instruction "Raise your phone above your head." (`--type-title`); a Ring 160px in the centre that fills while the pitch is above 60 degrees, for 1.5 s; LampCounter L (dark variant: value `--lamp`) with its presence line; bottom: "Light without raising" (quiet) for visitors who cannot lift their arms, and "Back to {Site}" (secondary L).

Lit: LightSurface with, at the bottom, "Your lamp is lit." (`--type-title` `--ink-on-light`), LampCounter L light variant with its presence line ("You and 4 others are lighting Piața Victoriei now."), and "Lower your phone to stop." (`--type-meta` `--ink-on-light-2`); the quiet "Lower the lamp" button for the no-raise path. The surface pulses in step with every other lit phone (6.14). Lowering below 40 degrees closes the LightSurface and returns to the instruction with "Lamp lowered. Raise it again to keep it lit."

| Situation | What happens |
|---|---|
| motion permission denied or no sensor | the Ring and instruction are replaced by "This phone cannot tell when it is raised. Tap to light the lamp." and a primary L "Light the lamp" |
| offline | the lamp lights locally; minutes held send on reconnect; counter shows "(last known)"; presence line hidden; the pulse continues if the clock offset was already known |
| presence count not in the `lamps` message | presence line hidden; nothing else changes |
| clock offset not known | the lit screen stays steady (no pulse) until it is |
| 731 reached while lit | the finale takes over (7.12) |

### 7.8 Between sites (`/s/:siteId` after "Next site", and `/` after joining)

User goal: walk to the next site, mostly by ear.

Layout: top bar (back to the last site, DemoBadge); CompassCard centred; bottom: "Sites" (secondary L, opens the Sites list Sheet) and "Open in Maps" (secondary L). On iPhone "Open in Maps" opens a Sheet with two secondary L buttons, "Apple Maps" and "Google Maps"; elsewhere it opens Google Maps directly.

The screen dims to the lantern state after 10 s without a touch (6.12). Arrival inside the geofence (enter at distance under radius plus min(accuracy, 30 m), exit at radius plus 25 m) triggers the chime and opens the Site view.

| Situation | What happens |
|---|---|
| sound compass running | nothing visual beyond the card; the 2 to 3 nearest beds play from their directions |
| returning from Maps | the page resumes; Notice info with action "Tap to listen again" until audio runs |
| GPS weak or lost | CompassCard states (6.12) |
| all sites visited today | the suggestion falls back to the darkest site with the tag "Going dark"; the card line reads "You have woken every site today. This one is fading." |
| memorial chosen or suggested | navigation is the same as any site (sound compass bed, beacon, arrow, distance, Maps links); the card shows the memorial states in 6.12; arrival has no chime (5.8) |
| offline | the arrow and distance keep working from the cached site list; glow shows "(last known)" |

### 7.9 Sites list

Sheet titled "Sites". SiteRows for all five sites, sorted by the next-site score, the suggestion first with its tag. Tap a row: the Sheet closes and the CompassCard switches to that site (beacon). In remote mode (`/?mode=remote`) rows are sorted by name with no distances, and a tap opens that site's view directly (the memorial opens its memorial view).

States: loading (three rows with GlowMark in loading state and the name line in `--text-3` "Loading sites"), error ("Could not load the sites." plus "Try again" secondary), empty (cannot happen with seeded sites; if it does: "No places are published yet.").

### 7.10 Keep my colours (sign-in)

User goal: keep what was done anonymously.

Entry points: the quiet button on the Site view and after a catch. Tap leads to Auth0 Universal Login (passwordless email code first, passkey if the tenant allows). On return the app calls `POST /me/claim`.

Auth0 Universal Login branding (set in the Auth0 dashboard, no code), two settings only: the logo (the wordmark PNG from 3.1, `#0E121A` on transparent) and the primary colour `#FFB547`. Everything else, including the font and the light page background, stays Auth0's default. Check once after setting it: the label on the amber button must render dark (black on `#FFB547` is 11.95:1). If Auth0 renders it white (1.76:1, a failure), set the primary colour to `#8A5300` instead (white on it is 6.33:1). That is the only allowed change.

| Situation | What happens |
|---|---|
| success | back on the screen they left; Notice info: "Saved. Your colours stay with your account." |
| claim failed | Notice error: "You are signed in, but your colours did not move to your account." with action "Try again" |
| sign-in cancelled | back where they were, nothing changes, no message |
| already signed in | the button is not shown |

### 7.11 Memorial: the Metropolitan Cathedral (memorial view)

The Metropolitan Cathedral is the place where the December 1989 revolution is remembered. User goal: listen, and if they wish, leave a candle. This view is required, not optional.

Allowed here: narrated, sourced testimonies and the minute-of-stillness candle. Not allowed here: Talk, the colour lens, the lamp, visitor echoes, glow words or percentages, counters, points, the rose window, the finale, "Keep my colours", persona characters.

Layout (phone, top to bottom): top bar (back, DemoBadge); the name "Metropolitan Cathedral" / "Catedrala Mitropolitană" (`--type-display`); the line "A place of remembrance for December 1989." (`--type-lead` `--text-2`); the heading "Testimonies" / "Mărturii" (`--type-title`) with "Read by a narrator. AI voice." (`--type-meta` `--text-3`); two to four Testimony items (6.23); then, with `--space-2xl` above it, the Candle (6.22) centred; bottom: "Back" (quiet) only. No primary amber button anywhere on this view.

The site's sound bed plays at 50% of its normal level while no testimony plays and is muted while one plays. Testimonies never start by themselves.

| Situation | What happens |
|---|---|
| first open | testimonies ready, candle ready; nothing plays until tapped |
| testimony playing | 6.23 playing state; the narration text is on screen with its source |
| candle filling | Ring fills over 60 s (5 s with `?demo=1`) while still, by motion only; moving resets it without a message |
| candle lit | "Your candle is lit." Its point appears on the Living Map (7.13) and as a mark on Pulse (7.14). No vibration, no sound, no count |
| leaving and coming back the same day | the candle shows lit again; a second candle can be lit (the Ring is ready again under "Your candle is lit.") |
| no motion sensor, motion permission denied, or the stillness check did not ship | the tap fallback in 6.22: "Light a candle" lights it at once |
| testimony audio fails | 6.23 error state: the text is shown with its source |
| testimony list fails to load | "The testimonies did not load." with "Try again" (secondary L); the candle still works |
| offline | testimonies already loaded keep playing; a candle lit offline sends on reconnect without telling the visitor anything |
| remote mode | the same view; the candle counts the same |
| a 731 finale happens | ignored on this view; no overlay, no sound |

### 7.12 The 1884 finale (phone)

Triggered by the `finale` socket message at the shared server time, on every phone view except memorial sites. Sequence: current screen dips three times to 40% brightness over 1.5 s (crackle); 2 s of `--bg` with nothing on screen (silence); LightSurface fades in over 800ms (burst) with "12 November 1884. 731 lamps. Tonight, again." (`--type-title` `--ink-on-light`) and "731 / 731 lamps lit today"; the waltz plays (45 s). A quiet "Back to {Site}" is available the whole time; it closes the overlay but the waltz keeps playing to the end. Reduced motion: no dips, a 1.5 s fade to dark instead. If the visitor's audio is suspended, the visual plays and the Notice offers "Tap to hear the waltz".

### 7.13 Living Map (`/screen`)

User goal (people in the room): see the city react to what people are doing, and join.

Start: the page opens on a full-screen `--bg` with the wordmark (`--screen-title`) and a primary L button "Start the Living Map" with the line "Turns on the room sound." (browsers need one click before audio). After the click the button never shows again until reload.

Layout at 1920 × 1080: the map takes the left 1380px (72%); a side panel takes the right 540px, `--bg` with a 1px `--line` left border and `--space-3xl` × `--u` padding.

- Map artwork (canvas, static layer): about five polylines traced from OpenStreetMap and stored as lat/lng points, projected exactly like the sites. Projection: fit the bounding box of all five sites plus the polylines into the map area with 12% padding, equirectangular with longitude scaled by cos(45.75 degrees). The Bega: 14 × `--u` px stroke, `--river` at 35% alpha, round joins. The Cetate ring (the line of the old fortress boulevards): 2 × `--u` px stroke `--line-strong` at 50% alpha, dash 10 × `--u` on / 8 × `--u` off. Any other traced street: 1.5 × `--u` px `--line`. District names (Cetate, Fabric, Iosefin, Elisabetin) in `--screen-meta` `--text-3`, only where they do not touch a window or label.
- OpenStreetMap credit: "© OpenStreetMap contributors" in `--screen-meta` `--text-3` (6.24:1 on `--bg`), drawn as DOM text in the map area's bottom-right corner, 16 × `--u` px in from the right edge of the map area and from the bottom of the screen. Always visible, including during the finale; never covered by a window, label or subtitle.
- Sites: the four colour sites each get a RoseWindow (R = 96 × `--u`) at their projected position; under each window: name (`--screen-name` `--text`) and glow line "Awake, 72%" (`--screen-meta` `--text-2`). The Metropolitan Cathedral gets a candle field instead (below). No two of the five site circles (windows and the candle field) closer than 2.4R centre to centre: after projection, repeat up to 20 times: for each pair closer than 2.4R, push both apart equally along the line between them. If a site would leave the map area, clamp it inside the 12% padding. Labels sit under their circle; if two labels would overlap, the lower site's label moves above its circle. The Gallery window (remote colours) sits in the bottom-left corner of the map area with the name "Gallery", and takes part in the same spacing rule.
- Candle field (the memorial): a circle of radius R at the Cathedral's position, outlined by a 1px `--line` circle so the place is findable when empty. Each candle lit in the last hours is a point: a 6 × `--u` px disk of `--lamp-white` with a soft halo (radial gradient of `--lamp-white` from alpha 0.25 to 0 over 3× the point radius). Alpha of point and halo is `0.25 + 0.65 × decay` (decay as in 2.3); points under decay 0.05 are removed; at most 200 points (oldest dropped first). Position inside the circle comes from a hash of the candle's id (deterministic, never moves). Under the circle: the name in `--screen-name` `--text-2` (calmer than other names) and no glow line, no number. The memorial contributes no sound to the room mix.
- Side panel, top to bottom: wordmark; "Lamps lit today" label (`--screen-meta` `--text-2`) over "412 / 731" (`--screen-numeral`, value `--lamp`); "Colours caught today" over its number (`--screen-numeral` `--text`); the Ticker; the QRBlock pinned to the bottom.
- Echo subtitle: under the window, a `--surface` box (radius `--radius-s`, max width 520 × `--u`) with the first 90 characters of the transcript (`--screen-subtitle` `--text`) and the language code in `--screen-meta`; shown 8 s, fades out over 600ms.

Ticker copy: "New colour at {Site}: {colour name}" (with swatch; name from 2.4), "New echo at {Site}", "Lamp lit at {Site}", "The {Site} window is complete.", "New place: {Site}", and the calmer memorial line "A candle was lit at the Cathedral." (6.18).

The lamps and colours counters never include the memorial, and the room sound mixes only the four colour sites.

| Situation | What happens |
|---|---|
| no activity yet | all windows asleep; the candle field shows only its outline circle; Ticker empty state; counters show 0 |
| candle lit at the memorial | the point fades in (5.5); the memorial ticker line appears or replaces the previous one; no sound |
| socket disconnected | the map keeps its last state; after 3 s the side panel shows "Reconnecting to the city…" (`--screen-meta` `--text-2`); on reconnect it refetches state and the line disappears |
| API cold start | the map draws from the static site list; counters show "..." until the first data |
| 1884 finale | the map dips three times to 40% over 1.5 s; 2 s black; then every window goes to full brightness and halo 1.0 and every street line turns `--lamp` over 800ms; the side panel shows "731 / 731" and "12 November 1884"; holds for the waltz; settles back over 4 s. The candle field and its label are drawn above the dips and the black, unchanged, and no street inside its circle turns amber |
| Radio Lampa episode (if it ships) | plays through the room; the side panel shows "Radio Lampa" above the Ticker while it plays; no captions in this build |
| window shorter than 1024px | the message in 4.5 |

### 7.14 Pulse of Timișoara (`/pulse`)

User goal (judges, public): see the city's live data.

Layout desk (1024px and up): page padding `--space-xl`; header: "Pulse of Timișoara" (`--type-title`) and "Live. Updated every 5 seconds." (`--type-meta` `--text-2`). Two columns 7fr / 5fr, gap `--space-l`.

- Left: ColourClock card "Colours of the city, by hour" (the largest element); under it the card "Interactions per 5 minutes, last 3 hours" as four small multiples (one per colour site, 2 × 2, shared y-scale, site name above each); under that the CandleMarks card "Candles at the Metropolitan Cathedral" (6.19), full column width, no numbers.
- Right: "City glow now" (`--type-numeral` and a GlowMark M; the mean of the four colour sites); "Glow by site" (horizontal bars, one per colour site, `--lamp`, value labels); "Lamps lit today" (LampCounter L, dark variant, plus a 4px `--surface-2` track with a `--lamp` fill); "Colours caught today" and "Unique visitors today" (numbers in `--type-numeral`, each with its label); "Languages spoken to the monuments" (horizontal bars, `--text-2` fill, labels in the language's own name, e.g. "Magyar").

Phone: one column, in order: ColourClock, City glow, Lamps, Glow by site, Colours, Visitors, Interactions, Candles, Languages.

The memorial appears on `/pulse` only in the CandleMarks card. It is left out of every number, bar, chart and table on the page (city glow, glow by site, interactions, lamps, colours). Unique visitors stays city-wide and is not split by site, so it reveals nothing about the memorial.

States per card in 6.19. Whole-page failure (no `/pulse/*` response for 30 s): header line becomes "Not updating. Last update {time}." in `--text-2`.

### 7.15 Curator console (`/curate`)

User goal: approve or reject echoes quickly and safely; add a place.

Access:

| Situation | Screen |
|---|---|
| not signed in | centred column: wordmark, "Curator console" (`--type-title`), "Sign in with your curator account. Two-factor sign-in is required." and primary L "Sign in" (Auth0 with MFA) |
| signed in without `moderate:echo` | "This account cannot curate. Ask the team to add the curator role." and quiet "Sign out" |
| session expired | Notice error "Your session ended. Sign in again." with action "Sign in"; unsaved choices are none (each approve or reject is one request) |

Echo queue (tab "Echo queue (3)"): desk layout, left list 360px of pending echoes (each a row: site name `--type-body` 600, "0:19, Romanian, 4 min ago" `--type-meta` `--text-2`; selected row fill `--surface-2`), right detail on `--surface`: site, time, language, duration; AudioPlayer; transcript (`--type-body`, max 65ch, `lang` set); consent line "The visitor agreed to public playback in their own voice."; bottom: "Approve" (primary M) and "Reject" (danger M), 12px apart. Under 1024px: the list is the screen and a row opens the detail with a back button.

| Situation | What happens |
|---|---|
| approve | button loading "Approving"; on success the row leaves the list, the next echo is selected, and a Notice info reads "Approved. It plays on the Living Map now." |
| reject | an inline confirm replaces the two buttons: "Reject this echo? It will never play." with "Reject echo" (danger M) and "Cancel" (secondary M) |
| 403 from the API | Notice error "You do not have permission to moderate. Sign in again with your curator account." |
| request failed | Notice error "That did not save. Try again."; the echo stays selected |
| transcript missing | "No transcript yet. Listen to the recording." in `--text-3` |
| empty queue | "No echoes waiting. New ones appear here as visitors record them." |
| loading | list rows at final height with "Loading" in `--text-3` |

Add a place (tab "Add a place"): one column, max 640px, works on a phone (the curator stands at the place). Fields in order: Name in Romanian, Name in English (text inputs, required); Location: secondary L "Use my location" fills read-only latitude, longitude and "accuracy 12 m" (`--type-meta`); Facts: at least two rows of text area plus source URL input, "Add a fact" quiet button; Persona description (text area, helper "How the place speaks: slow, proud, a little deaf."); Interactions (checkboxes Talk, Catch a colour, Leave an echo, Raise a lamp); then primary L "Publish place".

| Situation | What happens |
|---|---|
| validation | errors under each field on submit; focus moves to the first invalid field |
| location denied | "Location is off. Allow it in your browser settings, or type the coordinates." and the latitude and longitude fields become editable |
| weak accuracy (over 30 m) | helper under the coordinates in `--text-2`: "Accuracy is 45 m. Move into the open and try again for a better fix." (not blocking) |
| publishing | the form locks; a step list shows each step with an icon and word: "Saving place", "Generating greeting", "Generating sound bed", "Publishing" (pending `--text-3`, in progress spinner `--text`, done check `--ok`, failed alert `--danger`) |
| success | QRBlock with the new URL, "Open {Site}" (secondary M), "Add another place" (quiet); the new window fades in on `/screen` |
| a step failed | the failed step shows its error text; "Try again" retries from that step; already generated files are not paid for twice |
| missing `write:site` | "This account cannot publish places." |

### 7.16 Demo mode (`?demo=1`)

Every phone view shows the DemoBadge. Injected position and heading drive the same states as real sensors. One timing changes: the memorial candle needs 5 s of stillness instead of 60 s. Demo mode never shows a fake permission prompt.

### 7.17 Plan coverage

Every screen, route and view the implementation plan names, and where it is specified:

| Plan item | Section |
|---|---|
| Route `/` and remote mode `/?mode=remote` | 7.1, 7.8, 7.9 |
| Route `/s/:siteId` (landing, primer, site view; memorial landing and memorial view for the Cathedral) | 7.1, 7.2, 7.11 |
| Route `/screen` (v1 sites and glow, v2 windows, panes, ticker, counters, room sound, finale, OpenStreetMap artwork and credit, memorial candle field and ticker line) | 7.13 |
| Route `/pulse` (charts, colour clock, glow, interactions, visitors, languages, lamps, memorial candle marks) | 7.14 |
| Route `/curate` (echo queue, approve, reject, MFA sign-in) | 7.15 |
| Join, primer | 7.1 |
| Demo mode | 7.16 |
| Colour lens, hold steady, caught-pane feedback, night glass, colour names | 7.5, 2.4 |
| Talk live, captions, five client tools | 7.3, 7.4 |
| Talk fallback (tap-to-ask, browser voice) | 7.3 |
| Lamp (raise gesture, full-screen light, counter, people lighting this site now, phones pulsing together) | 7.7, 6.13, 6.14 |
| Echo recorder (20 s cap, consent, upload) | 7.6 |
| Between sites (arrow, distance, Maps links) | 7.8 |
| Sites list (distance, glow, next-site suggestion) | 7.9 |
| Keep my colours (sign-in and claim) | 7.10 |
| Memorial view: testimonies and the candle after 60 s of stillness (5 s in demo mode), tap fallback | 7.11, 6.22, 6.23 |
| Memorial on the Living Map and on Pulse | 7.13, 7.14 |
| 1884 finale on phones and `/screen` | 7.12, 7.13 |
| Radio Lampa episode | 7.13 |
| Add a place with QR code | 7.15, 6.17 |
| Daylight check at Checkpoint 1 | 2 |
| ro and en dictionary | 3.4, 7.0 |

---

## 8. Accessibility

- **Contrast floor**: 4.5:1 for all text, 3:1 for control boundaries and meaningful icons; the token table in 2.2 is the only allowed set of pairs. In practice primary text is 12.6:1 or more, which is what survives glare.
- **Focus**: 6.1 on every control, in every surface, including `/screen`'s start button and the console. Tab order follows visual order. Sheets trap focus and return it.
- **Screen-reader names** (all also visible text unless noted): the round control is a `<button>` named "Hold to talk to {Persona}" or "Record an echo"; the compass card region is named "Direction to {Site}" and its text updates at most every 10 s; GlowMark and RoseWindow names per 6.5 and 6.6; icon-only buttons have `aria-label` ("Back to {Site}", "Close", "Play echo"); the lens announces "Colour caught. {n} of 48 in the {Site} window." via `role="status"`; progress rings expose `role="progressbar"`.
- **Never colour alone**: glow has a word and a percent; recording has a word; errors have an icon and text; publish steps have icons and words; chart series are labelled directly; the colour clock has a hidden table with hex values and counts.
- **Sound never alone**: every cue in 5.8 has a visual twin; persona speech has captions; echoes on `/screen` have subtitles.
- **Visual never alone**: arrival, caught, window complete and finale all have sound; the arrow card has the spoken landmark hint from the persona.
- **Gestures never alone**: hold to talk has a hands-free toggle; raise the lamp has "Light without raising"; hold steady has no alternative because the camera must be still to read (a visitor who cannot hold still can still Talk, Echo and Lamp); the candle has a tap alternative when there is no motion sensor or permission. The stillness minute itself has no alternative when a sensor exists (stillness is the point of it), and it never needs the microphone.
- **Text scaling**: everything in `rem`; layouts tested at 200% text: Site view action grid falls to one column, button labels wrap, the CompassCard numeral may wrap below the arrow.
- **One-handed**: primary actions sit in the bottom 40% of the phone screen; the only top control is Back, and every station also has a bottom "Back to {Site}" button.
- **Glare and night**: one dark theme with the contrast above; no text under 15px on the phone; no weight under 400; the Lamp screen is the brightest thing in the app and only appears on purpose.
- **Noise**: captions are always on in Talk; push-to-talk is the default (hands-free is opt-in) because street noise breaks turn-taking.
- **Gloves**: 56px primary targets, 48px minimum, 12px gaps.
- **Motion and light**: 5.6 and 5.7. The lamp pulse is a 12% brightness change at 0.25 Hz with smooth easing, and stops under reduced motion.
- **Memorial**: every testimony has its full narration text on screen with its source, so deaf visitors get the same content; the candle has a tap alternative; nothing on the memorial view depends on colour, sound or motion alone.
- **Language**: `<html lang>` follows the UI language; captions and transcripts carry their own `lang`.
- **Pocket and walking**: the lantern dim keeps the arrow readable; nothing important requires reading while walking because the persona speaks the landmark hint.

---

## 9. Build order

Styling is done inline: each owner styles a screen in the same block in which they build it, using that block's slack, not Build 4. Nothing is built unstyled and restyled later. P4 lays the foundation (item 1) at the very start of Build 1 so every later screen is built on the tokens and base components from its first line. Radio Lampa stays first in the plan's cut order; the memorial is not in the cut order.

Hours are styling time on top of the feature task, taken from the owner's slack in that block. Required items are needed for the demo script or are decided as required (the memorial); optional items can go without breaking anything.

| # | Item | Owner, block | Smallest version that counts | Styling hours | Status |
|---|---|---|---|---|---|
| 1 | Foundation: `tokens.css` (every custom property in 2.1, 3, 4, 5.1, plus the 4.5 baseline and the 6.1 focus rule), fonts, the nine icons, and the base components Button, Notice, Ring, RoundControl | P4, start of Build 1 | Button primary, secondary, quiet, icon; Notice info and error; Ring with linear fill; RoundControl idle, listening, recording, disabled | 1.5 | required |
| 2 | Join and Site view: GlowMark, RoseWindow (SVG), memorial landing variant | P1, Build 1 | 7.1 success, location denied, audio blocked, memorial variant; 7.2 asleep and awake | 1.0 | required (demo 0:20) |
| 3 | Living Map base: palette, projection, OpenStreetMap polylines and credit, five-site spacing rule, start button | P4, Build 1 | 7.13 map layer, site labels, credit; windows as plain circles until item 6 | 0.75 | required (demo 0:00) |
| 4 | Colour lens with colour names | P1, Build 2 | 6.11 reading, holding, caught, window complete, name under the swatch; the flight can be a fade | 0.75 | required (demo 0:50) |
| 5 | Talk | P2, Build 2 | Captions, RoundControl, tap-to-ask fallback; archive image inline only (no Sheet) | 0.5 | required (demo 0:20) |
| 6 | Living Map windows: RoseWindow on canvas, pane flash, Ticker, counters, QRBlock | P4, Build 2 | 7.13 side panel and windows; skip ripples | 0.75 | required (demo 0:50 to 2:00) |
| 7 | Echo recorder | P1, Build 3 | 7.6 recording, consent, sent, upload failed | 0.25 | required (demo 1:20) |
| 8 | Between sites and Sites list, memorial states included | P1, Build 3 | CompassCard tracking, no-compass and memorial states; Sites list as a plain view instead of a Sheet | 0.75 | required (demo 1:40) |
| 9 | Lamp station: LightSurface, LampCounter, presence line, synchronised pulse | P2, Build 3 | 7.7 instruction, lit, presence line states, pulse in phase (steady when no offset) | 0.75 | required (demo 2:00) |
| 10 | Curator queue | P4, Build 3 | 7.15 list, detail, AudioPlayer as a native `<audio controls>` styled with tokens, approve, reject without the inline confirm | 0.5 | required (demo 1:20) |
| 11 | Living Map memorial: candle field and the calm ticker line | P4, Build 3 | 7.13 candle field and the 6.18 memorial line | 0.5 | required |
| 12 | Pulse, with CandleMarks | P3, Build 3 | ChartCard styling, ColourClock, glow bars, lamps, CandleMarks; languages chart only if it ships | 0.75 | required (demo 2:20) |
| 13 | Memorial view: Testimony list and Candle | P1, Build 4 | 7.11 with testimonies playing, the stillness Candle (5 s in demo mode) and the tap fallback; if the stillness check is not working at the freeze, ship the tap fallback alone | 0.75 | required |
| 14 | Phone finale | P2, Build 4 | 7.12 without dips; if the synced finale is cut, `/screen` plays it alone | 0.25 | required if the finale ships |
| 15 | Add a place | P4, Build 4 | Field styling, publish step list, QRBlock | 0.5 | optional (the pre-filled form is the fallback) |
| 16 | Echo ripples and subtitles on `/screen` | P4, Build 3 or 4 | 5.5 rings plus the 7.13 subtitle | 0.5 | optional |
| 17 | Sheet component | P1, Build 3 | replaces the plain views for the Sites list, archive image and "What happens to my voice" | 0.5 | optional |
| 18 | Lantern dim | P1, Build 3 | 6.12 lantern state | 0.25 | optional |
| 19 | Radio Lampa label on `/screen` | P2, Build 4 | the side-panel label in 7.13 | 0.1 | first to cut |

Required styling per owner: P1 3.5 h (items 2, 4, 7, 8, 13), P2 1.5 h (5, 9, 14), P3 0.75 h (12), P4 4.0 h (1, 3, 6, 10, 11). P1 and P4 use almost all of their 4 h of block slack. If a block overruns, drop the optional items first, then shrink a required item to the smallest version in this table. Never take styling time from a checkpoint or the freeze.

Required tokens: all of them.

Required components: Button, Notice, Ring, RoundControl, GlowMark, RoseWindow, Captions, ColourLens, CompassCard, LampCounter, LightSurface, TopBar, DemoBadge, Ticker, QRBlock, ChartCard, ColourClock (with CandleMarks), AudioPlayer, Field (checkbox), Candle, Testimony, SiteRow. Optional: Sheet (plain views until it ships), Field text inputs (add a place).

---

## 10. Sources and gaps

### 10.1 Where the decisions came from

| Decision | Source |
|---|---|
| Theme derived from setting (night, outdoors, headphones), one accent at about 10% visual weight, neutrals tinted toward the brand hue, no gradient text, no side-stripe borders, reflex fonts rejected (Inter, Outfit, Fraunces and the rest), modals avoided in favour of inline states | impeccable (core); its UX brief structure from impeccable shape; phone-to-desktop adaptations (two-pane console, centred phone column, projector scale) from impeccable adapt; one high-impact moment per surface and exit faster than enter from impeccable animate |
| One system (one button family, one radius scale, one card style, two boxes deep), no violet, nothing moves because the page scrolled, no fade-in on scroll | taste skill |
| Dark ground with a warm amber accent (its "time amber on night" palette, indigo dropped), focus ring with offset, state priority order, semantic tokens, 44 to 48px targets with 8px or more gaps, safe areas, line charts with direct labels and table fallbacks, `role="status"` with atomic announcements | ui ux pro max (search script and pre-delivery checklist) and its design-system skill |
| Easing curves and durations, scale 0.97 on press, never from `scale(0)`, hold rings slow-fill and fast-release, transitions over keyframes for interruptible UI, hover gated to fine pointers, reduced motion as fewer not zero | emil-skills: emil-design-eng and animate |
| Viewport meta, `dvh`, safe-area padding, no tap highlight, 16px inputs, `touch-action: manipulation`, no zoom lock | emil-skills: mobile-native |
| Canvas loop rules, transform and opacity only, no per-frame React state, no animated CSS variables, no backdrop blur | emil-skills: animation-performance |
| Dials, purpose for every technique, real numbers or none, empty, loading and error states for every data view, no em dashes, plain verb-object buttons | antislop (core, ui, copywriting, layoutmobile), loaded per the user's global instructions |

The decisions listed in 10.2 were made by the user on 2026-11-10 and override any source above.

Where sources disagreed: ui ux pro max proposed Outfit and Work Sans and an indigo palette; impeccable's font rules and the taste skill's no-violet rule won. impeccable recommends OKLCH; tokens are written in hex because the brief for this handoff asks for hex and the values were checked for contrast in that form. The taste skill's rules for marketing pages (photographs, sections per screen, hero entrances) do not apply to an app and were not used.

### 10.2 Resolved 2026-11-10

These were open in the first version of this document; the user has decided them.

1. **Memorial site**: a fifth site, the Metropolitan Cathedral, is the 1989 memorial (7.11). It is required, not in the cut order.
2. **People lighting this site now**: built. The count is distinct sessions with a lamp event at the site in the last 90 s, sent per site in the `lamps` message (6.13).
3. **Phones pulsing together**: built, as a 4 s pulse in phase with server time (6.14).
4. **Remote mode URL**: `/?mode=remote`, encoded in the `/screen` QR code.
5. **Colour names**: 12 hue bins with English and Romanian names (2.4).
6. **Font coverage**: verified. Atkinson Hyperlegible Next 2.001 has Romanian ș ț and Hungarian ő ű but no Cyrillic; Piazzolla has all of them. Serbian Cyrillic captions use the system fallback (3.1).
7. **Daylight**: dark theme only, with a 10-minute daylight check at Checkpoint 1 (section 2).
8. **Romanian copy**: a native Romanian teammate reviews the strings before Build 4.
9. **Map artwork**: the Bega and the Cetate ring are traced from OpenStreetMap as about five polylines, with the credit on screen (7.13). `--river` is required.
10. **Window placement**: the five-site spacing rule in 7.13.
11. **QR library**: the `qrcode` npm package (6.17).
12. **Styling setup**: one global `tokens.css` plus CSS Modules; no Tailwind.
13. **Join without the API**: the five seeded sites are built into the web app (7.1).
14. **Auth0 branding**: logo and amber primary colour only (7.10).
15. **Styling budget**: each owner styles inline from block slack; P4 builds the foundation at the start of Build 1; the Lamp station belongs to P2 (section 9).

### 10.3 Still open

1. **Daylight is untested**: the Checkpoint 1 check is the only test, and there is no light theme to fall back to.
2. **iOS haptics**: there is no Vibration API on iOS, so feedback there is sound and visual only.
3. **Left out by the plan, so not designed**: Me page and personal mini-window, delete my data, audio postcard, Pair screen, nominations, persona tester, Admin, pocket mode touch lock, the Auth0 token debug panel.
4. **Auth0 plan limits**: whether the amber primary colour gets a dark button label depends on the tenant; 7.10 gives the fallback colour.
5. **Own lamp in the presence count**: if the first lamp event is sent only after a full minute held, a visitor's own lamp is not counted for up to 60 s. The copy treats a count of 0 while lit as 1 (6.13); sending a lamp event at the moment of lighting would make the number exact.
6. **Memorial testimony content**: the number of testimonies, their texts, the narrator voice and the sources are content work outside this document. The view needs at least two testimonies to look intentional.
7. **Memorial view timing**: the memorial view is required but is scheduled in P1's Build 4, the shortest block. If the plan moves it earlier, section 9 item 13 moves with it.
8. **Skill gaps**: all four sources loaded. The impeccable teach interview and the ui ux pro max persistence step were skipped (this handoff does not interview the user or write extra files). The emil-skills apple-design file was not read because the design uses no drag gestures or spring sheets.

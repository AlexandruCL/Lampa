# LAMPA: iPhone test plan

What to test by hand, on iPhones, before the demo. Part 1 covers Message in a Bottle (`3_bottle_on_the_bega.md`, PR #77). Part 2 covers the rest of the project.

# Part 1: Message in a Bottle

## Why these tests

The automated tests and the simulated run cover the logic. They do not cover the iPhone, the real database or the curator console.

| Covered already | By what |
|---|---|
| River maths, bridge order and spacing | `packages/shared/src/river.test.ts` |
| `GET /echoes/bottles`: upstream only, the 150 m window, 404, 503, speed fallback | `apps/api/src/echoes/router.test.ts` |
| Bridges stay off `/screen`; the seed and `sites.json` agree | `newSites.test.ts`, `seed.test.ts` |
| Record at Decebal, hear once at Michelangelo, then once at Maria | simulated run: real API code and web app, in-memory store, desktop Chrome |

| Not covered: test by hand | Why it matters |
|---|---|
| Playback on iOS (tests A, C, D) | A bottle plays from a timer, not from a tap. iOS can suspend audio after the microphone was used, after a lock or after switching apps. This is the biggest unknown. |
| Recording format on iOS (test A) | The iPhone picks its own audio format. No test has decoded an iPhone recording on an iPhone. |
| The polling and play-once logic in `useBottles` (tests A, B, E) | Only the small helper `newBottles` has a unit test. |
| The bridge screen and the recorder texts (tests F, G) | No component test renders a bridge. |
| The real approve route and the console (tests A, H) | The simulation skipped the Auth0 login and approved in the store directly. |
| The bottles query on real Postgres (test A) | The simulation used an in-memory stand-in. |
| Bridges missing from `/screen`, the sites list and Pulse on the live app (test I) | Checked only in unit tests and with a mocked API. |
| `demo:reset` keeping the bridges (test J) | The code changed; no test asserts it. |

Not testable by hand in one session: the 24-hour cut-off, and GPS arrival (nobody can be at the bridges).

## Before you start

1. PR #77 is merged and deployed, and `npm run db:seed` has run on the deployed database.
2. On Render, service `lampa-api`: `BOTTLE_SPEED_MPS=8`. Wait for the redeploy.
3. Two iPhones, **A** and **B**, with Safari. On each:
   - Ring/Silent switch on **Ring**, volume at about half. Silent mode can mute web audio.
   - Settings → Display & Brightness → Auto-Lock → **Never**, for the session.
   - Headphones are optional. Without them, keep the phones a metre apart.
4. A laptop with the curator logged in at `<app>/curate`.
5. A stopwatch. **Start it when phone A shows "Sent."**

Use these links. `?demo=1` is required: away from the bridge, the first GPS fix would otherwise take the phone out of the bridge view.

| Bridge | Link |
|---|---|
| Decebal (top) | `<app>/s/pod-decebal?demo=1` |
| Michelangelo (middle) | `<app>/s/pod-michelangelo?demo=1` |
| Maria (bottom) | `<app>/s/pod-maria?demo=1` |

Timing at speed 8, counted from "Sent.":

| From → to | Heard between |
|---|---|
| Decebal → Michelangelo | 1 min 23 s and 2 min 01 s |
| Michelangelo → Maria | 2 min 03 s and 2 min 41 s |
| Decebal → Maria | 3 min 45 s and 4 min 23 s |

The phone asks every 10 seconds, so playback can start up to 10 seconds into the window. An echo must be **approved before its window ends**, or nobody hears it.

Limit to remember: one phone can send **5 echoes per 10 minutes**. A sixth shows "Your echo did not send. It is still here."

## Tests

Mark each step ✅ or ❌. For a ❌, write what the screen showed and the stopwatch time.

### A. The main run: Decebal → Michelangelo

This is the demo. If it fails, stop and report before going on.

1. Phone B: open the Michelangelo link, tap **Wake Michelangelo Bridge**.
   - Expect: "Listen to the water. The river is quiet now; echoes dropped upstream drift past here."
2. Phone A: open the Decebal link, tap **Wake Decebal Bridge**, then **Drop an echo in the river**.
   - Expect: the prompt "Say something for the people downstream. Up to 20 seconds."
   - Expect: iOS asks for the microphone on the tap of the round button. Allow it.
3. Phone A: record about 5 seconds, saying something you will recognise. Tap the round button to stop.
4. Phone A: tap play and listen to the preview. Tick the box, tap **Send echo**.
   - Expect: "Sent. It is already drifting downstream. Once a curator approves it, the next bridge can hear it." **Start the stopwatch.**
5. Laptop: the echo appears in the queue under **Decebal Bridge**. Play it, then approve it, within one minute.
6. Phone B: do not touch it. Watch from 1 min 20 s.
   - Expect: between 1 min 23 s and about 2 min 10 s the line changes to "Listen to the water. An echo is drifting past." and **you hear phone A's recording**.
   - Expect: when it ends, the line goes back to "The river is quiet now".
7. Phone B: keep watching until 3 minutes.
   - Expect: the bottle does **not** play a second time.

### B. The second leg: Michelangelo → Maria, and Decebal → Maria

1. Phone A: open the Maria link, wake it.
   - Expect: the listening line, **Next site**, and **no** "Drop an echo in the river" button.
2. Phone B (still at Michelangelo): **Drop an echo in the river**, record, send. Start the stopwatch. Approve on the laptop.
3. Phone A: expect to hear it between 2 min 03 s and about 2 min 50 s, once.
4. Phone B: open the Decebal link, drop an echo, send. Restart the stopwatch. Approve.
5. Phone B: open the Michelangelo link again and wake it. Expect the bottle there between 1 min 23 s and 2 min 10 s.
6. Phone A (still at Maria): expect the same bottle between 3 min 45 s and about 4 min 30 s.

### C. iPhone: hearing after using the microphone

The phone that just recorded must still be able to hear.

1. Phone A at Michelangelo: drop an echo and send it. Tap **Back to Michelangelo Bridge**. Leave phone A there.
2. Phone B at Decebal: drop an echo, send, start the stopwatch. Approve on the laptop.
3. Phone A: expect to hear phone B's bottle in the usual window.
   - If the line says "An echo is drifting past." but there is **no sound**, that is the iOS audio problem. Report it as such.

### D. iPhone: lock, app switch, silent switch

For each case, phone B drops a bottle at Decebal and phone A listens at Michelangelo. Approve each one at once.

1. **Lock.** Lock phone A at 30 s, unlock it at 1 min 30 s.
   - Expect: the page is still the bridge view and the bottle plays before 2 min 01 s.
2. **App switch.** At 30 s go to the Home Screen on phone A, open another app, come back to Safari at 1 min 30 s.
   - Expect: the same as for the lock.
3. **Late return.** Lock phone A at 30 s and unlock it at 2 min 30 s.
   - Expect: nothing plays, because the bottle has passed. No error on screen.
4. **Silent switch.** Put phone A on Silent before the window.
   - Note what happens: sound or no sound. Either is acceptable; we only need to know for the demo.

### E. Play once, and interruptions

1. **Leave and return.** After a bottle has played fully on phone A, and while still inside its window, tap **Drop an echo in the river**, then go back without recording.
   - Expect: the bottle does not play again.
2. **Cut off.** While a bottle is playing on phone A, tap **Drop an echo in the river**.
   - Expect: the sound stops. Go back: it plays again from the start if its window is still open.
3. **Reload.** After a bottle has played, reload the page inside the window and wake the bridge again.
   - Expect: it plays once more. This is known and accepted: the phone forgets on reload.
4. **Two bottles.** Phone B at Decebal sends two echoes about 15 seconds apart. Approve both.
   - Expect on phone A: both play, the first sent first, one after the other, never on top of each other.

### F. What each bridge shows

Check on one iPhone, in English, then set the iPhone language to Romanian and check again.

| Bridge | Must show | Must not show |
|---|---|---|
| Decebal | Drop an echo in the river · Next site | The listening line · Talk · Catch a colour · Paint with light · Raise a lamp · Leave an echo · the rose window |
| Michelangelo | The listening line · Drop an echo in the river · Next site | The same list, except the listening line |
| Maria | The listening line · Next site | Drop an echo in the river, and the same list |

1. Names: Decebal Bridge / Podul Decebal, Michelangelo Bridge / Podul Michelangelo, Maria Bridge / Podul Maria.
2. Within a few seconds the glow mark stops saying "Listening for the city…". "Still connecting to the city" must not stay on screen.
3. Nothing is cut off or overlapping on the iPhone screen, in portrait.
4. **Next site** opens the compass with the five sites. No bridge is in the list.

### G. The recorder at a bridge

1. The consent line says "…at the bridges downstream…", not "here".
2. **What happens to my voice** says "visitors at the bridges downstream".
3. Record for under one second: expect "That was too short to send. Record again."
4. Let a recording run: it stops by itself at 20 seconds.
5. Without the box ticked, **Send echo** is disabled and "Tick the box to send." shows.
6. Deny the microphone once (Safari → aA → Website Settings → Microphone → Deny): expect the "LAMPA needs the microphone…" text and **Try again**. Allow it again afterwards.

### H. Bottles that must not be heard

1. **Not approved.** Phone B drops at Decebal. Do not approve. Phone A at Michelangelo hears nothing through the window.
2. **Approved late.** Approve that same echo at 2 min 30 s. Phone A still hears nothing at Michelangelo. Phone A at Maria can still hear it between 3 min 45 s and 4 min 23 s.
3. **Rejected.** Phone B drops at Decebal, the curator rejects it. Nothing plays anywhere.
4. **Upstream.** Phone A drops at Michelangelo, approved. Phone B at Decebal hears nothing.
5. **Where it was dropped.** A bottle is never heard at its own bridge: after test A, phone A at Decebal has heard nothing.

### I. The rest of the app is unchanged

1. `<app>/screen` on the laptop: five sites, no bridges. Approving a bridge echo adds no ticker line and no subtitle.
2. `<app>/pulse`: the same four colour sites as before.
3. On an iPhone, `<app>/s/unirii?demo=1`: Talk, colours, lamp, bells and Leave an echo are all there, and whispers still play.
4. Leave an echo at Unirii: the texts still say "here", not "bridges downstream".

### J. After the demo reset

1. Run `npm run demo:reset` on the deployed database.
2. Open the Michelangelo link on an iPhone.
   - Expect: the bridge still opens and can still record. Bottles recorded before the reset are gone.

## Afterwards

- Remove `BOTTLE_SPEED_MPS` on Render, or every bottle passes all the bridges in a few minutes.
- Set Auto-Lock back on both phones.

## Results

| Test | Phone, iOS version | ✅ / ❌ | Notes |
|---|---|---|---|
| A | | | |
| B | | | |
| C | | | |
| D | | | |
| E | | | |
| F | | | |
| G | | | |
| H | | | |
| I | | | |
| J | | | |

---

# Part 2: the rest of the project

Part 1 tests only the bottle. This part lists the iPhone tests the rest of LAMPA still needs. It is based on which code has automated tests and which does not; it is not a record of what the team has already tried by hand. If a test here was already done on an iPhone, mark it ✅ with the date.

## What the automated tests leave open

The pure logic is well covered (about 1000 tests). The screens, the hooks that talk to the phone, and everything that needs a real device are not.

| Area | Has tests | No test: check by hand |
|---|---|---|
| Join and permissions | primer logic, demo mode | `Join.tsx`, the iOS motion and compass prompts, audio unlock |
| Site view, glow, rose window | glow and pane maths | `SiteView`, `GlowMark`, `RoseWindow`, the live socket hooks |
| Talk | state machine, tools, captions logic | `Talk.tsx`, `useLiveTalk`, the live ElevenLabs session and microphone |
| Catch a colour | colour picking, hold, bins, pane sender | `ColourLens`, the rear camera, `useLensReading`, offline sending |
| Paint with light | frame stacking | `PaintLight`, the camera, save and share |
| Raise a lamp | pitch and lamp maths, pulse | `Lamp`, `usePitch`, `useWakeLock`, the counter |
| Bells | flick detection, harmony on the API | `Bells`, `bellSound`, two phones ringing together |
| Echo and whispers | recorder logic, upload, whisper queue | `EchoRecorder`, `useWhispers`, playback on iOS |
| Memorial | candle stepper, testimony selector | `Memorial`, `Candle`, `Testimony`, narration audio |
| Between sites | geofence, scoring, nav maths, heading | `Between`, `CompassCard`, `useCompass`, `useGeolocation`, `useNavAudio`, Maps links |
| Finale | finale timing | `PhoneFinale`, `ScreenFinale`, `useFinale` |
| Accounts | claim route, session | `AuthProvider`, `KeepMyColours`, the Auth0 redirect on iOS |
| `/screen` | projection, ticker, windows, candles | `ScreenPage`, `canvas`, `useScreenSocket` |
| `/curate` | place form, queue | `CuratePage`, `AddPlace`, `EchoDetail`, `PublishSteps`, `PlaceQR` |
| `/pulse` | queries and copy | `PulsePage` and every chart |

Things only an iPhone can show:
- **Permissions inside the tap.** iOS grants motion, compass, camera and microphone only when asked from a tap.
- **Audio after an interruption.** A lock, an app switch, a phone call or the microphone can suspend sound.
- **No vibration.** Safari on iOS has no vibration, so every "buzz" must also be visible or audible.
- **The compass.** iOS gives a true heading only through its own API.
- **Screen wake lock.** Needs iOS 16.4 or later.
- **Share sheet.** Saving a light painting goes through the iOS share sheet.

## Before you start

Same phones and laptop as Part 1. Use `?demo=1` links for everything except test U. Unless a step says otherwise, wear headphones.

| Site | Link |
|---|---|
| City (landing) | `<app>/?demo=1` |
| MX | `<app>/s/mx?demo=1` |
| Piața Unirii | `<app>/s/unirii?demo=1` |
| Piața Victoriei | `<app>/s/victoriei?demo=1` |
| Theresia Bastion | `<app>/s/bastion?demo=1` |
| Cathedral (memorial) | `<app>/s/cathedral?demo=1` |
| Remote visitor | `<app>/?mode=remote` |

## Tests

### K. Join, permissions and sound

1. Open the MX link in a fresh Safari tab (or a Private tab, so no permission is remembered).
   - Expect: "Muzeul MX Corneliu Miklosi is asleep.", "Put on headphones…", the button **Wake Muzeul MX Corneliu Miklosi**.
2. Tap **Wake**.
   - Expect: the site view opens, the sound bed starts within a second or two, and "…is waking." shows for about 4 seconds.
3. Open the city link and tap **Wake the city**.
   - Expect: iOS asks for location, then for motion and orientation. Allow both. The compass view opens.
4. Repeat step 3 in a new Private tab and **deny** location.
   - Expect: "Location is off. This site still works. To walk to the next one, use the list." The app stays usable.
5. Deny motion and orientation: expect a **Use the compass** button on the site view, and tapping it asks again.
6. Open `<app>/s/nowhere`: expect "We could not find this place." and **Show all sites**.
7. Turn on Airplane Mode and open a link: expect "We could not reach LAMPA…" and **Try again**, which works once the network is back.
8. Rotate the iPhone to landscape and back: nothing breaks or stays cut off.

### L. Site view and live glow

1. At Unirii the site view shows: the name, the glow mark, the lamp counter, the rose window, the historical photos, then Talk, Catch a colour, Paint with light, Raise a lamp, Ring the bells, Leave an echo, Next site.
2. The glow mark leaves "Listening for the city…" within a few seconds and shows Asleep, Waking, Awake or Fully lit.
3. With phone B catching a colour at the same site (test N), phone A's rose window gains the pane within a couple of seconds, without a reload.
4. Swipe the historical photos: captions and credits are readable, nothing overlaps.
5. Turn on Airplane Mode for 20 seconds, then off.
   - Expect: the glow shows "(last known)" while offline and recovers by itself.
6. Check the bottom of the screen: no button sits under the iPhone's home indicator.

### M. Talk

1. At Victoriei tap **Talk**. Allow the microphone.
   - Expect: the site greets you by voice within about 8 seconds, in the phone's language.
2. Ask a question aloud. Expect a spoken answer and captions on screen that match it.
3. Tap one of the suggested questions: expect its answer without speaking.
4. Ask it to take you to another site: expect the compass view for that site.
5. Ask to leave an echo: expect the echo recorder with a prompt.
6. Talk over the voice: it stops and listens.
7. Go **Back**: the voice stops at once and the sound bed returns.
8. Deny the microphone and tap **Talk**: expect a clear message, not a frozen screen.
9. Lock the phone mid-conversation and unlock: note what happens. The session may end; it must not leave sound playing with no way to stop it.
10. Start Talk on phones A and B at the same site: both work.
11. At the Cathedral there is no Talk button.

### N. Catch a colour

1. At Bastion tap **Catch a colour**. Allow the camera.
   - Expect: the **rear** camera, live, with "Point at a colour and hold still" and "Only the colour leaves your phone, never the picture."
2. Point at a strongly coloured object and hold still for 2 seconds.
   - Expect: "Hold still", then a tone and "Colour caught", then "Your colour is in the Theresia Bastion window. N of 48."
3. Move the phone while holding: the hold resets and nothing is caught.
4. Point at something grey or dark: nothing is caught.
5. Tap **Say why**: the echo recorder opens with "Why this colour?".
6. Airplane Mode on, catch a colour.
   - Expect: "Saved on this phone. It sends when you are back online." Turn the network back on: it sends by itself and the count goes up.
7. Catch colours quickly until refused: expect "You have given this window enough colours for now. Try another site."
8. Deny the camera: expect the "LAMPA needs the camera to read a colour…" text.
9. Switch to another app and back: the camera picture returns, not a black box.
10. Open `<app>/?mode=remote` and catch a colour: expect "Your colour is in the Gallery window."

### O. Paint with light

1. At MX tap **Paint with light**. Read "Works best in the dark…".
2. In a dim room tap **Start painting** and move a torch or a second phone's screen in front of the camera for 8 seconds.
   - Expect: a countdown, then a picture with the light trails.
3. Tap **Save or share**: the iOS share sheet opens with an image. **Save Image** puts it in Photos.
4. Tap **Paint again**: a clean new painting starts.
5. Deny the camera: expect the "LAMPA needs the camera to paint with light…" text.

### P. Raise a lamp

1. At Unirii tap **Raise a lamp**. Allow motion if iOS asks.
2. Raise the phone above your head for about 2 seconds.
   - Expect: the screen turns to the lamp light and "Your lamp is lit." There is no vibration on iPhone; the light is the only signal.
3. Hold it up for 30 seconds: the screen does not dim or lock.
4. Lower the phone: "Lamp lowered. Raise it again to keep it lit."
5. Phone B raises a lamp at the same site: phone A shows "You and 1 other person are lighting Piața Unirii now."
6. The counter "… / 731 lamps lit today" goes up, on the phone and on `/screen`.
7. Deny motion: expect "This phone cannot tell when it is raised. Tap to light the lamp." and the tap works.
8. The Cathedral has no lamp button.

### Q. Dialogue of the Bells

Two iPhones at Unirii, no headphones.

1. Both tap **Ring the bells**. Phone A picks **Roman Catholic cathedral**, phone B **Serbian Orthodox cathedral**.
2. Flick the wrist: the bell rings on that phone and the other phone hears the other tower.
3. Tap the bell instead of flicking: it also rings.
4. Ring together, three times within a few seconds, each pair at the same moment.
   - Expect: "The towers ring together." on both phones, and the harmony on `/screen`.
5. Ring out of time: no harmony.
6. **Change tower** works, and the sound bed is silent while the bells view is open.
7. With motion denied the hint reads "Tap the bell…" and tapping rings.

### R. Leave an echo and hear whispers

1. At Unirii tap **Leave an echo**, record 5 seconds, play the preview, tick the box, **Send echo**.
   - Expect: "Sent. A curator listens to it before it plays here."
2. Approve it on the laptop.
   - Expect: phone B, on the Unirii site view, hears it as a whisper within about 20 seconds, and `/screen` shows a ticker line and, if transcribed, a subtitle.
3. Stay on the site view for two minutes: whispers repeat about every 20 seconds, never two at once.
4. Open any sub-view (Talk, lens): whispers stop. Go back: they resume.
5. Reject an echo on the laptop: it never plays.
6. The recorder checks from Part 1, test G, steps 3 to 6, pass here too.
7. Go back with an unsent recording: expect "Discard this echo?" with **Discard** and **Keep recording**.
8. The Cathedral has no echo button and plays no whispers.

### S. The memorial

1. Open the Cathedral link.
   - Expect: "A place of remembrance for December 1989.", testimonies, a candle. No Talk, colours, lamp or echo. The sound is quiet.
2. Play a testimony: narration starts, the label "Read by a narrator. AI voice." and the source are shown. Pause and resume work.
3. Start a second testimony: the first one stops.
4. Hold the phone still for the time shown (5 seconds in demo mode).
   - Expect: "Your candle is lit." and a candle on `/screen` at the Cathedral.
5. Move the phone during the hold: the count starts again.
6. With motion denied: a **Light a candle** button appears and works.
7. Lock and unlock during a testimony: it can be resumed.

### T. Between sites, in demo mode

1. From any site tap **Next site**.
   - Expect: a suggested site with its distance, walking minutes and a direction, and a beacon sound.
2. Open the list: five sites, the current one marked "You are here", one marked as suggested. No bridges.
3. Pick the Cathedral: expect "A place of remembrance. Listening and candles only."
4. **Open in Maps** offers Apple Maps and Google Maps, and each opens with the right destination.
5. Return from Maps to Safari: the compass view is still there. If the sound stopped, "Tap to listen again" brings it back.
6. Add `&heading=90` to a demo link: the direction words change accordingly.
7. After waking all five sites: "You have woken every site today. This one is fading."

### U. On site, with real GPS (not possible from a desk)

Use links without `?demo=1`. These are the only tests that need walking.

1. Standing at a site, open `<app>/`: the phone arrives by itself within about 60 m.
2. Scan the site's QR code from 100 m away: the site opens at once, then closes after the first good GPS fix. This is expected.
3. Walk from one site towards another with the compass view open.
   - Expect: the arrow turns with the phone, the beacon sounds from the right side in headphones and gets brighter as you approach, the distance counts down, and the next site opens on arrival.
4. Hold the phone flat and turn on the spot: the arrow follows without jumping.
5. Walk with the phone locked in a pocket for a minute, then unlock: position and sound recover. The Join screen warns that they stop in the background.
6. Walk out of a site: the site view closes after about 85 m.
7. Indoors or between tall buildings: a poor GPS fix does not throw you out of a site.

### V. The finale

1. With `/screen` open on the laptop and two iPhones on any site, trigger the finale (the curator's control, or the 731st lamp).
   - Expect on `/screen`: the 1884 moment.
   - Expect on both phones at the same moment: "12 November 1884. 731 lamps. Tonight, again.", a crackle, a short silence, then the waltz for about 45 seconds.
2. A phone that was locked when it started shows **Tap to hear the waltz** after unlocking, and the tap plays it.
3. Leave the overlay with Back: the waltz stops when the view changes.
4. A phone that opens the app after the finale ended sees nothing of it.
5. Press R on `/screen`: the episode starts. It does nothing while a finale is showing.

### W. Keep my colours

1. Tap **Keep my colours**, then **Sign in**.
   - Expect: the Auth0 page opens in Safari; after signing in you are back on the same site.
2. Expect "Saved. Your colours stay with your account."
3. Catch a colour, close the tab, reopen the app: you are still signed in.
4. In a Private tab the sign-in still completes.
5. Sign in on phone B with the same account after catching colours there: no error.

### X. The projector, the console and Pulse

On the laptop, while the phone tests run.

1. `/screen`: five sites on the map with the river and the ring road; panes, candles, lamps, echoes and bells from the phones appear within a couple of seconds; the QR code opens the remote link on an iPhone.
2. `/screen` left open for 30 minutes: no slowdown, no frozen ticker. Unplug the network for a minute: it recovers by itself.
3. `/curate` without a login is refused; with the curator account it shows the pending echoes, oldest first, each with its site name, playable.
4. `/curate`, add a place: fill the form, publish, wait for every publish step to finish. Scan its QR with an iPhone.
   - Expect: the new place opens, shows only the interactions that were ticked, plays its own sound bed, and appears on `/screen`.
5. `/pulse`: every card shows data after the phone tests, and a readable empty state after `demo:reset`.
6. Open `/curate` and `/pulse` on an iPhone: usable, even if built for a laptop.

### Y. Language and accessibility

1. Set the iPhone to Romanian: every screen in tests K to T is in Romanian, with ș and ț drawn correctly and no English left over.
2. Settings → Accessibility → Display & Text Size → Larger Text, at a large size: nothing essential is cut off.
3. Turn on VoiceOver on the site view: the glow mark, the rose window ("…window, N of 48 panes"), the lamp counter and every button are announced.
4. Settings → Accessibility → Motion → Reduce Motion: animations calm down and nothing stops working.
5. Bright outdoor light and lowest screen brightness: the texts stay readable.

### Z. Endurance

1. Use one iPhone for 30 minutes across all five sites.
   - Expect: no reload, no silent audio, and the phone does not get hot enough to dim the screen.
2. Battery: note the percentage before and after.
3. Take a phone call mid-session, hang up: sound returns, or one tap brings it back.
4. Connect and disconnect Bluetooth headphones mid-session: sound moves to the right output.
5. Low Power Mode on: the app still works; note anything that degrades.

## Results, Part 2

| Test | Phone, iOS version | ✅ / ❌ | Notes |
|---|---|---|---|
| K Join | | | |
| L Site view | | | |
| M Talk | | | |
| N Colour | | | |
| O Paint | | | |
| P Lamp | | | |
| Q Bells | | | |
| R Echo | | | |
| S Memorial | | | |
| T Between | | | |
| U On site | | | |
| V Finale | | | |
| W Account | | | |
| X Laptop | | | |
| Y Language | | | |
| Z Endurance | | | |

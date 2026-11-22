# Fault log

Every fault found gets one entry here, in the same commit as its fix (owner requirement 5). `tools/check_faults.sh` (CI job `handoff`) fails a commit whose new entry is missing a field, whose Probe has no FAIL line, or whose Proof has no PASS line; it also fails a fix commit with no entry, and a push that spreads new entries over more than one commit.

Fields, all required:
- **Found:** where and how it showed up.
- **Probe:** the test that reproduces it before the fix, with its FAIL line. No probe, no fix.
- **Cause:** the line or rule that produces it.
- **Class:** what kind of fault it is, stated wide enough to cover every place it could also be.
- **Sweep:** every place of that class that was checked, with the result; new probes added for the class.
- **Fix:** what changed.
- **Proof:** the run after the fix, with its PASS line.

Checked with no fault found are listed at the end of each sweep, so the next session does not re-check them.

## F1: masks stayed on screen after the act ended
- Found: batch 1, step 0 bot sweep (`web/step0/test_cue.cjs`).
- Probe: `FAIL  night 3 desktop idle: t=2800 masks on screen 3 (max 2)` (same line for every bot that ended the act early, nights 1-3, desktop and phone).
- Cause: `endAct()` stopped judging but left the remaining beats PENDING, and `drawMasks()` draws every pending spawned beat.
- Class: scene-owned state still acting after its scene or act ends.
- Sweep: after `endAct`: beats (fault, fixed), scheduled drums (already stopped), judging and timeouts (already guarded by `S.ended`), feedback, fall pose, confetti. Batch 3 added `sameRunProbe`: after the act ends, 40 presses and advances change nothing; a second act in the same page plays exactly like a fresh page; no confetti carries over. Result: no further fault.
- Fix: `endAct()` marks every pending beat DONE with result `cut` (batch 1).
- Proof: `CHECKS 43 of 43 pass` (batch 1); batch 3 `CHECKS 47 of 47 pass`, `RESULT PASS`.

## F2: HUD built a new string on every change
- Found: batch 1, per-frame gate in `test_cue.cjs`.
- Probe: `FAIL  string building in writeHud line 623` (and lines 624, 625).
- Cause: `'Laughs ' + S.laughs` in `writeHud()`.
- Class: allocation or lookup in code that runs every frame or every input event.
- Sweep: batch 1 gate covered the named hot functions only. Batch 3 widened it: `callGraphGate` fails when a hot function calls any function that is not itself hot-checked. It found F5.
- Fix: label text moved into the HTML; `writeHud` writes only the number, only on change (batch 1).
- Proof: `CHECKS 43 of 43 pass` (batch 1); batch 3 `CHECKS 47 of 47 pass`, `RESULT PASS`.

## F3: mask started far too large (owner: "start too large")
- Found: owner playing `cue.html`, 20 Nov.
- Probe: none before the fix (the owner's report was the evidence; this predates requirement 5). Batch 2 restored the old value as a mutation and the new gate failed on it (`MUTATIONS 11 of 11 caught`). Batch 3 `layoutGate` on the old value: FAIL at every size, e.g. 0.75 x 844 = 633 px at 390x844.
- Cause: `view.R0 = Math.max(w, h) * 0.75`.
- Class: sizes derived from the screen.
- Sweep: batch 2 checked only the mask radius against half the smaller side. That sweep was too narrow and missed F4.
- Fix: batch 2 used `Math.min(w, h) * 0.48`; replaced in batch 3 (F4).
- Proof: batch 2 `CHECKS 44 of 44 pass`, `RESULT PASS`; superseded by F4.

## F4: the batch 2 fix still let the mask leave the top of the screen
- Found: batch 3 wide layout probe.
- Probe: `FAIL  layout 1280x800: mask start r 384 at (640,320) leaves the screen`; same at 1920x1080, 2560x1080 and 844x390.
- Cause: the face sits at 40% of the height, not the middle, so half the smaller side is more than the distance to the top edge. The batch 2 gate compared against half the smaller side, so it passed the bug.
- Class: sizes derived from the screen (same as F3); gates that check an assumption instead of the real geometry.
- Sweep: `layoutGate` at 7 screens (1280x800, 1920x1080, 2560x1080, 390x844, 844x390, 360x640, 768x1024): mask start disk inside all four edges from the real face centre; start at least 1.3x the cue; cue top below the HUD; whiteface hat on screen at the fit; cue and result word clear of both touch pads. The batch 2 `maskStartGate` is replaced by `layoutGate`, which checks everything it checked plus the other edges. Only the mask start failed.
- Fix: `view.R0 = max(1.3 R, 0.96 x distance from the face centre to the nearest edge)`; `maskStartFrac` now means that fraction.
- Proof: `CHECKS 47 of 47 pass`, `RESULT PASS`; mutation `mask start sized from the screen, not the face position (batch 2 fault)` caught.

## F5: helper functions called every frame were not checked
- Found: batch 3 `callGraphGate` (sweep of F2).
- Probe: `FAIL  hot judgeHit calls winGood, which is not hot-checked`; same for `winPerfect` and `rand`.
- Cause: the hot list in `test_cue.cjs` was written by hand and missed helpers.
- Class: a check that covers a hand-picked list instead of everything reachable.
- Sweep: every function reachable from the frame loop and the input handlers is now hot-checked or listed in `COLD_OK` with a reason (`playSound` one-shot source; `showResults`, `resultsText` once per act; `showError` error path). The three helpers had no allocation.
- Fix: `winGood`, `winPerfect`, `rand`, `usePageClock` added to the hot list.
- Proof: `CHECKS 47 of 47 pass`, `RESULT PASS`; mutation `new helper called per frame but not hot-checked` caught.

## F6: the act froze when the audio clock did not run
- Found: batch 3 probes (node and headless Chrome).
- Probe: node `FAIL  no audio: act never reached results (act clock frozen at 0 misses)`; Chrome `FAIL  no Web Audio: results not reached in 30 s`, `FAIL  audio clock never runs: results not reached in 30 s`, `FAIL  audio clock stuck while running: results not reached in 30 s` (all on the batch 2 code).
- Cause: `actNow()` read only `AudioContext.currentTime`, and fell back to a test-only clock when there was no context.
- Class: anything that waits on a clock or event that may never come (premortem item: first use of a sound before it is ready).
- Sweep: act time, results delay, beat timeouts and the fall pose all read `actNow()`; confetti and crowd use the frame step; nothing else waits. Cases probed: no Web Audio; a context that stays suspended; a context that reports running but whose clock stands still; tab hidden for 60 s on the page clock (no misses counted while hidden).
- Fix: the act uses the audio clock only if the context is running at the start; otherwise the page clock. A watchdog switches to the page clock if the audio clock stands still for `audioStallMs` (500 ms) during an act, and stops the scheduled drums. Hidden time is removed from the page clock. `unlockAudio` calls `resume()`.
- Proof: node `CHECKS 47 of 47 pass`; Chrome `BROWSER CHECKS PASS (5 scenarios + 2 play-throughs)`; mutations `no page clock without audio` and `hidden time counted` caught.

## F7: a touch pad stayed pressed after the browser cancelled the touch
- Found: batch 3 browser probe.
- Probe: `FAIL  pad-cancel: hit pad stays pressed after the browser cancels the touch` (batch 2 code).
- Cause: the pads listened for `pointerup` only.
- Class: input state that can stick.
- Sweep: pads (fault); keyboard (no held state, key repeat and modifiers ignored); window blur and tab hidden release both pads. Space pressed while a panel button has focus during an act: probed, does not restart the act (no fault).
- Fix: `pointercancel`, `pointerleave` and `lostpointercapture` release the pad.
- Proof: `BROWSER CHECKS PASS (5 scenarios + 2 play-throughs)`.

## F8: camera drag kept running after an interrupted touch, and a second finger took it over
- Found: session 6 static read (suspected S1), proven in session 8 batch 2.
- Probe: `node web/check_input_loop.cjs` on 64ea803: `FAIL  S1 drag released by pointercancel: camera turned 200 px after the drag ended`; same for `lostpointercapture` and `tab hidden`; `FAIL  S1 second finger down keeps the first drag: first finger moved 1 px, camera turned -199 px`; `FAIL  S1 second finger move ignored: second finger turned the camera 249 px`.
- Cause: `web/game/index.html` `bindInput()` cleared `dragX` on `pointerup` and `blur` only and never stored which pointer owned the drag.
- Class: input state across interruptions and multiple pointers.
- Sweep: game page: `pointerup`, `blur` (no fault); `pointercancel`, `lostpointercapture`, tab hidden, second finger down, move and up (fault); keys (`onKey` holds no state, ignores repeat and modifiers: no fault); sliders and bar buttons (no held state: no fault). `cue.html`: pads release on cancel, leave, lost capture, blur and tab hidden (F7, no fault); two pads at once is intended; keys hold no state (no fault).
- Fix: one drag owned by `dragId`; other pointers ignored; `pointercancel`, `lostpointercapture`, `pointerup` of that pointer, `blur` and tab hidden end it (`endDrag`, `endDragOf`, `onVisibility`).
- Proof: `node web/check_input_loop.cjs`: `CHECKS 18 of 18 pass`, `MUTATIONS 12 of 12 caught`, `RESULT PASS` (5 S1 mutations).

## F9: an error in the game loop repeated every frame with nothing on screen
- Found: session 6 static read (suspected S2), proven in session 8 batch 2.
- Probe: `FAIL  S2 frame error does not escape the loop: frame() threw "probe boom"`, `FAIL  S2 frame error shown on screen: no visible element shows the error`, `FAIL  S2 frame error not repeated every frame: the failing body ran 5 times in 5 frames`, `FAIL  S2 error outside the frame shown on screen: no visible element shows the error`, `FAIL  S2 unhandledrejection outside the frame shown on screen: no visible element shows the error` (64ea803).
- Cause: `frame()` had no try/catch, and the page had no error screen or `error`/`unhandledrejection` listener.
- Class: errors that fail silently, in the loop or in any callback.
- Sweep: game page: frame loop (fault); resize observer, context restore, loading promise, event handlers (fault, covered by the window listeners); load failure already wrote the HUD (kept). `cue.html`: loop already caught and showed errors (no fault); errors outside the loop (fault, F12).
- Fix: `frame()` schedules the next frame, then runs `frameBody()` in try/catch; `showError()` shows a full-screen `#err` panel once and stops the body; `bindErrors()` sends window `error` and `unhandledrejection` to it.
- Proof: `node web/check_input_loop.cjs`: `RESULT PASS` (4 S2 mutations caught).

## F10: fps meter counted the page-open time and the hidden-tab gap
- Found: session 6 static read (suspected S4), proven in session 8 batch 2.
- Probe: `FAIL  S4 first frame not counted: first reading 0.50 fps (page open 2 s before the loop)`, `FAIL  S4 hidden-tab gap not counted: reading 2.68 fps after a 5 s hidden tab at a steady 60` (64ea803).
- Cause: `last` started at 0 and was never reset after a hidden tab, so the first frame's `raw` was the whole gap, and `stepFps(raw)` counted it unclamped.
- Class: clocks after a gap (first frame, hidden tab).
- Sweep: game page: fps meter (fault); governor (already ignored frames over `ignoreOver`, now also frames with no gap: no fault); mixer and effects use the clamped `dt` (no fault). `cue.html`: `dt` clamped from the first frame, act clock paused while hidden (F6, no fault); no fps meter.
- Fix: `raw` is 0 when there is no measured gap (first frame; `onVisibility` sets `last = 0` on return); `stepFps` and `govStep` skip `dt <= 0`.
- Proof: `node web/check_input_loop.cjs`: `RESULT PASS` (2 S4 mutations caught).

## F11: starting quality tier picked by input type
- Found: session 6 static read (suspected S3), proven in session 8 batch 2.
- Probe: `FAIL  S3 tier start not picked by input type: govInit calls matchMedia 1 time(s) and reads the input type` (64ea803).
- Cause: `govInit()` chose steps and start from `(pointer: coarse)`; rule 31 says measured frame time. Both lists and starts were equal ([1.25, 1], start 0), so the look did not change and no owner call was needed.
- Class: device decisions made from input type instead of measurement.
- Sweep: game page: `govInit` (fault); `watchDpr` and resize use the real ratio (no fault). `cue.html`: `(pointer: coarse)` picks the phone timing windows, a design setting with a player override, not a quality tier (no fault).
- Fix: one `dprSteps` and `dprStart` in CONFIG; `govInit` takes them; the governor steps down by frame time. `web/mutate_perf.mjs` mutation `maxdpr` retargeted to `dprSteps` (the game changed on purpose; the mutation is unchanged otherwise).
- Proof: `node web/check_input_loop.cjs`: `RESULT PASS` (S3 mutation caught).

## F12: errors outside the cue loop failed silently
- Found: session 8 batch 2 sweep of F9's class.
- Probe: `node web/step0/smoke_cue.cjs`: `FAIL  late-error: timer error outside the loop not shown on the error panel`, `FAIL  late-error: rejected promise outside the loop not shown on the error panel`.
- Cause: `cue.html` caught errors only inside `loop()`.
- Class: errors that fail silently (as F9).
- Sweep: see F9. Prototype code: fixed, not deferred, because a silent error in a key or pad handler would give the playtest a wrong answer (the cue looks broken or unfair without saying so).
- Fix: window `error` and `unhandledrejection` listeners call `showError()`.
- Proof: `BROWSER CHECKS PASS (6 scenarios + 2 play-throughs)`.

## F13: startle and wince faces sampled off the face atlas (blank skin)
- Found: session 9 batch 1, first look at `web/step0/cue_model.html` mid-cue: after a miss his face showed no eyes, brows or mouth.
- Probe: `OLD=1 node web/step0/cube25d/probe_faces.cjs` (old offsets): `FAIL  face startle [0,-0.5]: dark eye and brow pixels in the eye band 0.0% (min 1%)`, `FAIL  face wince [0.5,-0.5]: dark eye and brow pixels in the eye band 0.0% (min 1%)`.
- Cause: face cell offsets `startle: [0, -0.5]`, `wince: [0.5, -0.5]` (copied from the game page CONFIG.faces). The atlas is loaded with flipY false, so its rows run down: the lower cells are at v + 0.5; v - 0.5 lands outside the atlas and clamps to the skin edge.
- Class: texture-atlas cell offsets that point outside the atlas (any face, card or sprite cell table).
- Sweep: `web/step0/cube25d/model_layer.js` faces (fault, fixed). `web/game/index.html` CONFIG.faces line 483: same values, same shader and atlas, so the same blank startle and wince faces (lasting code; its own probe on the game page and fix are left for session 10, the next checks session, owner requirement 6; listed in HANDOFF open items). Crowd cards (`aCell` from `layout.card_cells`, flipY true): not swept this session.
- Fix: `startle: [0, 0.5]`, `wince: [0.5, 0.5]` in `model_layer.js`.
- Proof: `node web/step0/cube25d/probe_faces.cjs`: `PASS  face startle [0,0.5]: ... 18.1%`, `PASS  face wince [0.5,0.5]: ... 13.1%`, `RESULT PASS`.

## F14: cue ring centred on his forehead, not his face
- Found: session 9 batch 1, same look: the pale target circle sat between hat brim and nose; the nose was on its lower edge.
- Probe: `node web/step0/cube25d/probe_faces.cjs` with the old anchor: `FAIL  cue centre to nose: 0.48 R (max 0.3 R), R 65 px`.
- Cause: `faceCentre` was the middle of the head mesh bounds (1.41 m), which include the crown under the hat; the painted face is centred on the nose, about 0.12 m lower.
- Class: screen anchors taken from mesh bounds instead of the feature they mark.
- Sweep: `model_layer.js` face anchor (fault, fixed); blob shadow uses the root position on the floor (no fault); the cue's ring, target and feedback word all read view.cx/cy/R from the one anchor (no fault).
- Fix: `faceCentre: [0, 1.29, 0.1]` (nose, three.js axes).
- Proof: `PASS  cue centre to nose: 0.12 R (max 0.3 R), R 65 px`.

## F15: game page startle and wince faces sampled off the face atlas (blank skin)
- Found: F13 sweep (session 9): `web/game/index.html` CONFIG.faces had the same off-atlas offsets; probed and fixed in session 10, the next checks session (owner requirement 6).
- Probe: `OLD=1 python3 -I web/game/probe_face_cells.py web/game/index.html web/game/assets/clown_v2.glb web/game/assets/face_atlas.png`: `FAIL  face startle [0,-0.5]: face UV area u 0.00-0.50 v -0.50-0.00 inside the atlas no, feature pixels 0.0% (min 1%)`, `FAIL  face wince [0.5,-0.5]: ... inside the atlas no, feature pixels 0.0% (min 1%)`.
- Cause: same as F13: the atlas is loaded with flipY false, so its rows run down and the lower cells are at v + 0.5; v - 0.5 lands outside the atlas and clamps to the skin edge.
- Class: texture-atlas cell offsets that point outside the atlas (any face, card or sprite cell table).
- Sweep: `web/game/index.html` CONFIG.faces (fault, fixed); `web/step0/cube25d/model_layer.js` and `web/step0/walk.html` faces (correct, [0, 0.5] and [0.5, 0.5]); crowd cards (`cell = (i * 5 + tier * 3) % card_cells`, 12 cells in a 3072x384 one-row atlas, flipY true: always inside, no fault); the v2 Whiteface and Performer atlases with the fixed offsets: probe PASS for both.
- Fix: `startle: [0, 0.5]`, `wince: [0.5, 0.5]` in the game page CONFIG.faces, with the row direction written in the comment above. New probe `web/game/probe_face_cells.py` (face UV area per cell inside the atlas and holding feature pixels), added to CI job `step0`.
- Proof: `python3 -I web/game/probe_face_cells.py ...`: `PASS  face startle [0,0.5]: ... inside the atlas yes, feature pixels 9.6% (min 1%)`, `PASS  face wince [0.5,0.5]: ... feature pixels 5.8% (min 1%)`, `RESULT PASS`.

## F16: pages served over http ask for a missing favicon (HTTP 404 in the console)
- Found: session 10, `smoke_walk.cjs` under the system Chrome (the bundled test browser did not ask for the icon). Session 9 had seen the same 404 on `cue_model.html` and set it aside.
- Probe: `node web/step0/smoke_walk.cjs`: `FAIL desktop 1280x720: loads, no page error console error Failed to load resource: the server responded with a status of 404 (Not Found)`.
- Cause: no `<link rel="icon">` in the page, so Chrome requests `/favicon.ico`, which no page ships.
- Class: page requests for resources that do not exist (missing icon, asset path typos).
- Sweep: `web/step0/walk.html`, `web/step0/cue_model.html`, `web/step0/cue.html`, `web/game/index.html`: all had no icon link (fault, fixed). The game page checks (`check_step4.mjs`, `check_step5.mjs`, `check_perf.mjs`, `check-runtime.cjs`) skip favicon 404s; left as they are (not loosened; the pages no longer ask).
- Fix: `<link rel="icon" href="data:,">` after the title in all four pages.
- Proof: `node web/step0/smoke_walk.cjs`: `RESULT walk smoke 22 of 22 pass`; one-off load of the other three pages in Chrome: `PASS step0/cue_model.html HTTP errors: 0`, same for `cue.html` and `game/index.html`.

## F17: walk jerks once a cycle (arms snap at the loop seam; slap legs in a walking stride)
- Found: session 10, owner on the walk sample: "the walking movement were jerky".
- Probe: new gate `clown_v2/probe_clip_loop.py` on the run 18/28 GLBs: `FAIL  clip walk: frame furthest from its neighbours' midpoint 39.7 deg, forearm_L at seam (max 4)` (clown), `60.1 deg, forearm_L at seam` (Whiteface), `57.4 deg, upper_arm_L at seam` (Performer). Exported tracks: upper arm 16 and 26 deg steps in the first two frames, 44 deg at the seam, every other step under 4 deg. In Blender, the same walk time posed twice came out 23-27 deg apart (arms).
- Cause: `s3_rig.make_action` builds the clips in turn (idle, walk, slap) and each one leaves an NLA strip on the rig. While the next clip was posed, view-layer updates evaluated those strips and leaked their pose into the posers, so every key depended on the one before it. The walk's first key inherited the idle pose (arms), so the cycle did not close; the slap was posed over the walk strip (legs mid-stride). Second, smaller part: `walk_dt` 0.083 made a 30.88-frame cycle while the export samples whole frames, so the last 0.88 frame was cut.
- Class: build-time state leaking between generated animation keys (any generator that poses a rig with earlier actions or NLA live), and loops whose length is not a whole number of sampled frames.
- Sweep: walk (fault, all 3 characters), slap (fault: up to 46 deg change on shin_L once fixed; it is not a loop, so the probe does not test it; before/after pose sheets show the stride gone), idle (built first, no leak: 0.0 deg change). Other generators: `s2_*` build no actions; `check_model.py`/`s3_check.py` only read. Page side: see F18.
- Fix: `make_action` poses every key with no action and the NLA off, keys after, turns the NLA back on, and keeps quaternion signs continuous key to key; `walk_dt` = 1/12 (30 whole frames, last frame = first). The clip probe runs in CI after every rig build (build job and both cast jobs), with a mutation (a 20 deg pop on one frame must FAIL).
- Proof: local full rebuilds: `PASS  clip walk: ... 2.3 deg, shin_L at frame 7 (max 4)` (clown), `1.7 deg` (Whiteface), `2.7 deg` (Performer); mutation `FAIL  clip walk: ... 20.0 deg, upper_arm_L at frame 15`; step 3 gates PASS (walk edge stretch p99.9 1.54 -> 1.39).

## F18: a wobbling stick restarts the walk from its first frame
- Found: F17 sweep of `web/step0/walk.html`: stopping reset the walk, and any input dip under the dead zone stopped him.
- Probe: `node web/step0/smoke_walk.cjs` (new case, stick alternating 0.21 / 0.19 each frame): `FAIL stick wobbling at the dead zone for 60 frames: walk restarts 30 (max 1)`.
- Cause: stop and start followed the raw input every frame, and every start called `walk.reset()`. Also the clip speed had a 0.3 floor while the ground speed followed the stick, so the feet slid at small tilts.
- Class: animation state driven straight from noisy input with no hysteresis.
- Sweep: `walk.html` (fault, fixed). `cue_model.html` and the game page have no stick-driven walk.
- Fix: he stops only after the input has stayed under the dead zone for `stopDelay` 0.12 s (coasting on the last direction meanwhile); a walk still fading out carries on instead of restarting; clip speed = stick strength exactly.
- Proof: `node web/step0/smoke_walk.cjs`: `PASS stick wobbling at the dead zone for 60 frames: walk restarts 1 (max 1)`, `RESULT walk smoke 23 of 23 pass` (with the rebuilt GLBs: speed 0.748 m/s from planted feet).

## F19: camera cut count carried over between walks (panel shows cuts the player never saw)
- Found: session 12 (owner: "test it out first"), `node web/step0/smoke_walk.cjs` on `9e1d597`.
- Probe: `smoke_walk.cjs` new case right after "Walk out": `FAIL desktop 1280x720: walk out starts with its first shot only (cuts 2, want 1)`; old case `FAIL desktop 1280x720: shots corridor > wings > entrance, cuts 4` (same on phone portrait and landscape); walk back `cuts 7`, walk out from the room `cuts 11`.
- Cause: session 11 batch 1 made `begin()` call `placeStart()` on every start (before: only after a walk ended); `placeStart()` clears `S.shot` and calls `cutTo()`, which counts a cut, and `S.cuts` was never reset, so the load's first shot and every earlier walk were added in.
- Class: per-walk state carried from one walk into the next.
- Sweep: `walk.html` `placeStart()` and `enterRoom()`/`leaveRoom()`: cut count (fault); gloom, face, mood, face paint, held input, moving, ended, room, gains HUD, bought items and carry, performer tags (reset; now checked by "'Walk back again' leaves the room clean" and "walk out from the room" on every screen). `S.walkStarts` is a test counter, cumulative by design. Cue pages: per-act state already covered by `test_cue.cjs` (unchanged pages).
- Fix: `placeStart()` resets `S.cuts` to 0 before the first shot, so each walk counts its own shots.
- Proof: `node web/step0/smoke_walk.cjs`: `PASS desktop 1280x720: walk out starts with its first shot only (cuts 1, want 1)`, `PASS desktop 1280x720: shots corridor > wings > entrance, cuts 3`, `PASS walk out from the room: walk scene, gloom 0, face smile, tempo 1.18, HUD false, paint 0.400, cuts 1`.

## F20: touch stick pops up under the finger in the cube room
- Found: session 12 sweep of the room on touch screens.
- Probe: `smoke_walk.cjs` (MutationObserver on `#stick` while in the room, taps on the dressing table): `FAIL phone portrait 390x844: touch stick never shown in the room (shown 3 times)` (landscape the same).
- Cause: the `pointerdown` handler shows the stick whenever the loop runs (`S.running`); in the room the loop runs but there is nothing to walk, so every tap on a table or turn button showed the stick.
- Class: the touch stick shown where he cannot walk.
- Sweep: the room (fault), the fade into the room and the end-of-walk panel at the ring edge (same handler, `S.running` still true: fault), the start panel (`S.running` false: no fault). Cue pages use fixed pads, no floating stick.
- Fix: the stick starts only when he can walk: not in the room and not after the walk has ended (`S.room`, `S.ended`).
- Proof: `PASS phone portrait 390x844: touch stick never shown in the room (shown 0 times)`, `PASS phone landscape 844x390: touch stick never shown in the room (shown 0 times)`.

## F21: feet leave the frame at the entrance-to-wings cut on the walk back
- Found: session 12, new walk-back case in `smoke_walk.cjs`.
- Probe: `FAIL phone portrait 390x844: walk back, clown feet and head in frame every tick (2 of 601 out) entrance -1.30,13.80 feet false head true; entrance -1.30,13.77 feet false head true` (desktop and landscape the same count).
- Cause: `pickShot()` keeps the held shot until he is `zoneHyst` 0.25 m inside the next zone, but each shot's field of view is fitted to its own zone only (`build_walk.py` `fit_shot`), so in that 0.25 m band past the edge he can be outside the held shot's frame. The walk out never hit it; walking back toward the entrance camera does.
- Class: a held shot (cut hysteresis) framing him outside the area it was fitted for.
- Sweep: all cut lines, both ways, on 3 screens: corridor/wings and wings/entrance on the walk out (0 out before and after) and the walk back (entrance to wings: fault; wings to corridor: in frame). No other page cuts between shots.
- Fix: `inShotFrame()` projects his feet and a point at `frameH` 1.9 m through the held camera; once he is past the held zone and either leaves `frameEdge` 0.98 of the frame, the cut happens as soon as he is inside the next zone (no hysteresis). While he stays framed the 0.25 m hysteresis still stops flicker at the line. No plate re-render, shots unchanged.
- Proof: `PASS desktop 1280x720: walk back, clown feet and head in frame every tick (0 of 601 out)`, `PASS desktop 1280x720: walk back shots entrance > wings > corridor, cuts 3`; walk out unchanged `PASS desktop 1280x720: shots corridor > wings > entrance, cuts 3`, `(0 of 411 out)`.

## F22: dressing table runs 4 px off the right edge in phone portrait
- Found: session 12, layout case in `smoke_walk.cjs`.
- Probe: `FAIL phone portrait 390x844: dressing table on screen, buttons at least 44 px (44, 44, 44), clear of the clown and the room buttons | table {"l":16,"t":566,"r":394,...} ... screen 390x844`.
- Cause: `#prep` width 92% plus 10 px padding each side in content-box sizing: 359 + 20 px from a 16 px left edge ends at 394.
- Class: fixed panels sized in % or viewport units plus padding without border-box.
- Sweep: `walk.html` `#prep` (fault, landscape too: within the screen only because of its 340 px cap), `#panel` (inset 0, no width), `#roomBar` (left/right 0); `cue.html` and `cue_model.html` `.pad` (buttons, border-box by default; covered by the cue layout gate); `web/game/index.html` sets border-box on everything.
- Fix: `#prep` uses `box-sizing: border-box`.
- Proof: `PASS phone portrait 390x844: dressing table on screen, buttons at least 44 px (44, 44, 44), clear of the clown and the room buttons | table {"l":16,"t":566,"r":374,...} ... screen 390x844`.

## F23: room HUD writes "0" over "0" when he comes in
- Found: session 12, HUD case in `smoke_walk.cjs` (MutationObserver on the Laughs, Mask and carry text).
- Probe: `FAIL desktop 1280x720: room HUD written only on change (66 writes, 1 repeats laughsN '0')` (same on phone portrait and landscape).
- Cause: `enterRoom()` sets the shown-value caches `S.shownLaughs`/`S.shownMask` to -1, so the first `updateGains()` writes the count-up start 0 into `#laughsN`, which already shows 0 on the first visit.
- Class: HUD caches reset instead of mirroring what the DOM shows.
- Where: `web/step0/walk.html`
- Deferred: prototype code (owner requirement 5 scope): one write per room visit, nothing the player sees, does not change the playtest answer. Fix when the room is kept: keep the caches equal to the DOM text instead of resetting them (also the `p.off = null` reset of the table buttons). Its check stays and prints FAIL until then.

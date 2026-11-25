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

## F24: the Light cannot be escaped on a phone
- Found: owner's phone play, 22 Nov 17:58 ("the ring still unable to avoid the light"), session 17.
- Probe: real-play bot in `smoke_night1.cjs` (phone portrait, 8 s game time, steering away from the spot and round the ring): `FAIL Light: running from it at 100% stick escapes it (real play) caught by the Light {"inT":3.45,...,"r":2.5}` and `FAIL Light: running from it at 60% stick ... {"inT":1.55,"t":1.65,...,"over":"lose"}`. Batch 2's check teleported him out of the spot and never ran from it.
- Cause: (1) run speed = speed x stick length (radius 48 px), so a normal thumb drag (60%) made him 1.03 m/s, slower than the Light's 1.2; (2) the spot re-centred on him while he was inside it, so from its middle he escaped at only the speed difference (1.75 m / 0.52 m/s = 3.4 s, the measured 3.45 s); (3) it grew 0.25 m per escape up to 2.5 m in a 6.8 m ring and chased forever.
- Class: stick length scaling speed (walk and Mirror World); a pursuer that never loses its target.
- Where: `web/step0/night1.html` (`stickCurve()` in `moveInput()` and `mwClown()`, `mwLight()`).
- Fix: drags past `stickFull` 0.35 of the radius are full speed (night 1 only); the spot holds while he is in it and chases only once he is out; growth 0.15 m, cap 1.75 m; after `lightChase` 2.5 s of chasing it loses him for `lightLose` 1.5 s and drifts to the middle, then flares and looks again. Standing still 3 s in it still beats it.
- Proof: desk `run 1 : inside the spot 1.30 s of 8.0 s`, `run 0.6 : inside the spot 0.90 s of 8.0 s` (gate: at most 2 s); full 3-screen pass in the batch 3 commit.

## F25: the corridor tip stays on screen in the ring
- Found: stranger cold read 22 Nov (`design/STRANGER-night1-full-cold-read.md` finding 2).
- Probe: `Mirror World: the cut at the door ...` step reads `#mwTip` in the ring; before the fix it read "The mirror corridor. The way to the ring is the pale door." (stranger screenshot phone_mw.png).
- Cause: `tip()` holds a tip for `tipSecs` 4.5 s; `mwCut()` moved him to the ring without clearing it.
- Class: scene-owned UI not cleared when the space changes.
- Where: `web/step0/night1.html` `mwCut()`.
- Fix: the cut clears the tip, its timer and its queue.
- Proof: the step checks the ring's tip text (batch 3 commit).

## F26: the Mirror pads cover the hint on a phone
- Found: stranger cold read finding 3 ("the FALL button sits on top of the bottom hint").
- Probe: the corridor step checks the hint box against the pads box on touch screens.
- Cause: `#hint` spans the full width at the bottom; `#pads` sits bottom right over it.
- Class: fixed overlays that share a screen edge.
- Where: `web/step0/night1.html` CSS `#hint`, `enterMW()`, `endMW()`.
- Fix: `#hint.padded` keeps 100 px clear on the right while the pads show.
- Proof: phone screens in the batch 3 full pass.

## F27: falls squash him into the floor ("what that fall he squashed")
- Found: owner's phone play, 22 Nov 19:38 (ring entrance screenshot: a folded lump at the child's trip), session 18.
- Probe: new read-only hook `__night.gpProbe(kind, mood)` (plays a page pose at 60 fps in one call on the reflection's rig): the same input three times gave first-frame heights 1.785 / 0.793 / 1.102 m and lowest body points -0.96 to -1.18 m for prat, trip, dive and kneel; ring-entrance screenshot `desk_PROBE_flop.png` (session box, not committed). After the restore step alone: three identical runs, lowest points still -0.07 to -0.30 m.
- Cause: (1) the page poses (`gpApply`, batch 3) rotate bones after the mixer. three.js `PropertyMixer` writes a bone only when the clip's value changes; the idle clip holds most bones still, so the pose was added again every frame. (2) No floor contact: the hips drop is fixed, so the belly flop put his face 0.17 m under the floor and the slumped walk-back lean added 0.13 m. (3) Staging: the child's trip ran straight away from the ring-entrance camera, the act's missed-chain fall and the bow-over straight back from the low-seat camera, so each read as a squat.
- Class: any layer that changes bones after the mixer without putting them back (the mood layer already did; the page poses did not); any pose that reaches the floor; falls played along the camera's line.
- Where: `web/step0/night1.html` (`gpApply`, `gpRestore` in `moodRestore`, `gpMood`, `gpFloor`, `noteFall`, `tripAcross`, `segMiss`, the bow in `segFall`).
- Fix: `gpApply` saves the 11 bones and the hips position it writes, `moodRestore` puts them back before every mixer update; the posture lean fades out over `fallMoodFade` 0.15 s while a fall plays and back in as he gets up; floor contact (`fallFloor`) lifts the hips by the lowest of the sampled skin points (per bone, the extremes along 6 axes, chosen at load) for prat, trip, dive and kneel; the child's trip turns across the camera, widest of `tripAngles` 90/75/60/45 degrees whose whole fall line is walkable, away from the child; the missed-chain fall turns side-on (`missYaw`), the bow-over is played three-quarter on (`bowYaw` 0.9 rad).
- Proof: `smoke_night1.cjs` steps "falls: same pose every time, nothing under the floor" (every pose x 3 moods twice, lowest -0.010 to -0.022 m), "trip for the child is seen across the camera" (45 deg at the smoke's spot; the passage is 2.9 m wide there), "act: falls seen across the camera" (90 and 48 deg); mutations `gprestore`, `fallfloor`, `tripacross`, `missyaw`.

## F28: the vanity glass hides his reflection's face; the check measured a fixed height
- Found: owner's phone play, 22 Nov 19:38 ("the vanity table too high, does not show his face").
- Probe: desk, the reflection's head bone projects to y 360 px; the glass spans y 140-357 px, so the face is below the glass.
- Cause: the dressing plate's glass (centre 1.55 m, 1.1 m tall) was placed for a standing man; he sits with his head bone at 0.85 m. Batch 3's check projected a point 1.3 m above the reflection's feet, not its head, and passed.
- Class: checks that measure a fixed offset instead of the body part they mean.
- Where: `web/step0/cube25d/build_cube.py` (vanity CONFIG), the dressing plates, `night1.html` `vanityGlass`/`vanitySize`, `smoke_night1.cjs` vanity step.
- Fix: table top 0.80 -> 0.72 m, glass centre 1.55 -> 1.20 m, 0.9 m tall, bulbs follow; only the dressing view re-rendered (32 samples; front layer byte-identical, back and mid changed; old plates in `art/backups/dressing_before_s18b1/`). The check now projects the reflection's head bone and 0.15 m and 0.3 m above it, all inside the glass.
- Proof: desk glass y 230-405 px, head bone y 360 px; mutation `vanitylow`.

## F29: the big mirror's image floats and slides; the vanity image lagged
- Found: owner's phone play, 22 Nov 20:27 ("vanity mirror reflection cannot be slower, it is a mirror", "the full mirror reflection was late and thrown off?").
- Probe: desk screenshot of the entry (session box): the image stood centred in the glass, off the floor and smaller than his true image. Code: it was placed by eye (`reflDist` 7.2 m, `reflX` -0.15 m; his true mirror place is 2 x 4.71 - 2.8 = 6.62 m at his own side place) and `handsMeet()` then slid it sideways and lifted it (`NS.reflLift`) until the hands met on screen. The vanity image was placed 0.55 m to the side of his true place, and batch 1 made it rise 0.5 s late and only 40% (panel 22 Nov c).
- Cause: from the room camera behind him a true mirror image stands behind his own head, so the image was moved to be seen; the hands could not meet because he stood 1.9 m from the glass and his fingertips reach only 0.03 m past his ruff and belly (`pressReach`).
- Class: any reflection not at the mirror place of what it reflects, or not doing what he does at the same moment (the big mirror's lag is the GDD's sign and stays: `reflLag`).
- Where: `web/step0/night1.html` (`mirrorSetup`, `handsMeet` deleted, `pressStart`, `pressReach`, `mirrorImage`, `pressMeasure`, `bravPose`), `cube25d/build_cube.py` (chair).
- Fix: every image stands at his true mirror place (vanity: 2 x glass - chair, same side; big mirror: 2 x `mirrorGlassD` - his distance, same side); the chair moved to (3.2, 0.6) and the seat at the big mirror to `mirrorClownX` -0.6 so the image is beside his head, not behind it; the vanity image copies him at once; the press is a cut to a close shot at the glass (`pressShot`): he turns his right side to it (`pressYaw` 65), reaches out (pressR: arm out, forearm straight), stands so his fingertips stop `pressGap` 0.02 m short of the glass, the image is his mirror and its fingertips meet his there, late by `reflLag` 0.35 s.
- Proof: smoke steps "opening at the dressing table" (true mirror place, image's face inside the glass and clear of his head), "false bravado ... the vanity copies him exactly", "mirror entry" (true mirror place at the mark and at the glass, palms within `handMeet` 0.06 m, both faces in frame and turned to the camera within 75 degrees, the image seen through the glass, cracks); mutations `truemirror`, `pressshot`, `press`, `bravrefl`.

## F30: the single-file cold test shows only the logo on itch.io
- Found: owner, 22 Nov 22:10 (session 19), after uploading `clown-mirror-night1-coldtest.html` to itch as an HTML game played in the browser: "i only see logo".
- Probe: FAIL owner on itch 22 Nov 22:10: only the logo shows. Code read: `tools/bundle_single.py` BOOT line `var top = window.parent !== window && window.parent.__PACK ...`. itch runs the file in an iframe from another site (html-classic.itch.zone inside itch.io); reading a property of a cross-origin window throws SecurityError, so BOOT stopped before the pack was unpacked and the page script never got its files. A run in a local cross-origin frame was attempted twice and refused by the session's permission check, so the probe is the owner's itch play.
- Cause: BOOT reads `window.parent.__PACK` to let the cue frame (srcdoc, same site) share the parent's files; on a page embedded by another site that read throws.
- Class: any read of `window.parent` / `window.top` properties in the page, the cue page or the bundle boot.
- Sweep: `grep window.parent|window.top` over `tools/bundle_single.py`, `web/step0/night1.html`, `web/step0/cue_model.html`: one site, the BOOT line. The cue frame keeps working: it is srcdoc, same site as its parent, so the guarded read still succeeds there.
- Where: `tools/bundle_single.py` BOOT.
- Fix: the read is wrapped in try/catch; a parent from another site counts as no parent and the page unpacks its own files.
- Proof: PASS owner on itch 22 Nov 22:57 with `clown-mirror-night1-itch.html` (rebuilt, music in, 27,720 KB): "work". Local: the rebuilt file opens alone from file://, ready, 0 page errors.

## F31: the cost check read the pratfall's spend as the slap's
- Found: CI run 83 (cbe7d0d), job `step0`, desktop only; phone and landscape passed, and all three passed locally.
- Probe: FAIL run 83: `desk FAIL gags show what they cost ... spend not shown {"hud":"Laughs 95 (-1) · Pies 2 · Shards 0","cost":2,...}`. The count showed `(-1)`, the pratfall's cost, where the check wanted the slap's `(-2)`.
- Cause: the step before ends with a pratfall; its spend stays on the count for `spendShow` 0.7 s of game time. The check pressed J and then waited for any `(-n)` text, so on a slow runner it read the pratfall's figure, still on screen, before the slap's replaced it.
- Class: a check that waits for a pattern an earlier step can already satisfy.
- Sweep: every `waitForFunction` added in session 20 batches 1-2 (gnaw level, lamp hits, lamp yaw, spend text, music level): the other waits are on values this step itself changes from a reset start (`M.still = 0`, `hits > k`, yaw against the value just read). One site.
- Where: `web/step0/smoke_night1.cjs`, step "gags show what they cost".
- Fix: the step first waits until no spend is shown, presses J, then waits for the text `(-<slap cost>)`. The game is unchanged.
- Proof: PASS local desk run 23 Nov after the change: `desk OK gags show what they cost`, `RESULT night1 smoke 52 of 52 pass` (to the Light steps). PASS mutation `cost` against the corrected check: caught, `RESULT night1 smoke 49 of 50 pass (MUTATE=cost)`. Not yet seen on CI: the run of the batch 3 commit (run 84).

## F32: the Light real-play check started from whatever size the Light had grown to
- Found: CI run 83 (cbe7d0d), job `step0`, desktop only.
- Probe: FAIL run 83: `desk FAIL Light: running from it at 100% stick escapes it (real play) caught by the Light {"inT":2.1167,"t":8.0331,"r":1.75,"over":"","loses":0}` and the 60% run `{"inT":3.0501,...,"r":1.75,...}`. `r` 1.75 is the Light's cap (`lightCap`); it starts at 1.25. With `loses` 0 in the run, the growth happened before the step.
- Cause: the run step reset `inT` and `loses` but not the Light's radius or escape count, so its start depended on how often earlier steps' teleports had pulled him out of the beam. Batch 2 added a step with waits before it; on the slower runner the spot reached him more often between teleports, the Light reached its cap, and the check then measured a capped Light against a limit set for the start size. The step two below ("he outruns it") already resets `L.r`.
- Class: a real-play check that does not set the state it measures from.
- Sweep: the other real-play steps in the smoke (Whisper trip, Stare pose, Shame cling, bag breaks, the Light's "outruns" step): each sets its foe's position and timers first. One site, used for both stick settings.
- Where: `web/step0/smoke_night1.cjs`, the `Light: running from it at ...% stick` loop.
- Fix: the step sets `L.r = lightStartR()`, `L.leaves = 0`, `L.loseT = 0`, `L.tellT = 0` before the run. The 2 s limit and the 8 s run are unchanged. Not covered by this check, as before: running from a Light already grown to its cap.
- Proof: PASS local desk run 23 Nov after the change: `desk OK Light: running from it at 100% stick escapes it (real play)` and the 60% run, `RESULT night1 smoke 52 of 52 pass`. Not yet seen on CI: the run of the batch 3 commit (run 84).

## F33: the rehearsal's Back button sat under the Full screen button
- Found: session 24 batch 1, headless drive of night 2 (`Try it` on the scale note, then Back).
- Probe: FAIL `node web/step0/probe_cover.cjs` before the change: `FAIL desk rehearse: button tryBack covered by fsBtn` (also phone and land, nights 1 and 3: 6 lines); Playwright on the same click: `<button id="fsBtn"> intercepts pointer events`.
- Cause: `#tryBack` (session 22 batch 3) was placed at top 10px, right 10px, z-index 11; `#fsBtn` sits at top 8px, right 8px, z-index 12, so the Full screen button took every tap meant for Back. Session 22's drive clicked Back by script, which does not test what is on top. Where the browser allows full screen (every real desktop and Android browser), the only way out of a rehearsal after a click inside the cue frame was the Back button (Esc goes to the frame), so the rehearsal could not be left.
- Class: a control covered by another control, or pushed off screen, in a scene where the player needs it.
- Sweep: probe `web/step0/probe_cover.cjs`: every visible enabled button's centre must hit that button (a full-screen card, the curtain or the cue frame over the board is meant and allowed) at title, Dazai card, board, note, rehearsal, shop and end card, nights 1 and 3, desk 1280x720, phone 390x844, landscape 844x390: 192 buttons. Found this and F34, nothing else. Not reached by the probe, checked by the CSS instead: walk (`#verb` bottom right), act (`#actSkipBtn` bottom right), Mirror World (`#pads` bottom right, `#mwTip` no pointer events): none shares a scene with another control in its corner; `#fsBtn` is top right in each.
- Where: `web/step0/night1.html` CSS `#tryBack`.
- Fix: `#tryBack` moved to top 60px (below the Full screen button's 8 + 44 px).
- Proof: PASS `RESULT cover probe 192 of 192 buttons reachable` after the change. Mutation (top 10px put back, copy in /tmp/mut): `FAIL desk rehearse: button tryBack covered by fsBtn` ... `RESULT cover probe 186 of 192 buttons reachable`.

## F34: on a phone held sideways the shop's last items and End the night were off screen
- Found: session 24 batch 1, the F33 sweep (night 3 shop has five items: the acts tried plus the dash).
- Probe: FAIL `node web/step0/probe_cover.cjs` before the change: `FAIL land shop#n=3: button opt:Dash (Mirror)A covered by none (off screen)` and `FAIL land shop#n=3: button endNight covered by none (off screen)`.
- Cause: the shop card at the mirror is a left column of one item per row, centred with `justify-content: center` on a fixed full-screen card with no scrolling; at 390 px high, five items and the End button are taller than the screen, so the column ran off the top and bottom and could not be scrolled. Night 1 has two items and fit; nights 2-3 sell more.
- Class: as F33 (a control pushed off screen in a scene where the player needs it).
- Sweep: as F33 (same probe run). Every card: `.card` now scrolls when taller than the screen and centres with `safe center` (browsers without it keep plain centring), so no card cuts off its top; only the shop at landscape 844x390 was found off screen.
- Where: `web/step0/night1.html` CSS `.card`, `.card.see`, `.card.shopAt`, new `@media (orientation: landscape) and (max-height: 500px)`.
- Fix: cards scroll and centre safely; on short landscape screens the shop's items go two to a row at 24vw, its heading and first line hidden.
- Proof: PASS `RESULT cover probe 192 of 192 buttons reachable`. Mutation (the landscape media rule made unreachable, copy in /tmp/mut): `FAIL land shop#n=3: button endNight covered by none (off screen)` ... `RESULT cover probe 188 of 192 buttons reachable`.

## F35: the shop at the mirror covered the reflection or ran off screen once it sold more than two items
- Found: session 25 batch 1, CI run 98 (a076f44) and the local land smoke: `land FAIL shop at the mirror: the reflection performs each buy back at him (fix 5) shop card covers 52% of the reflection (opts)`; run 98 cover probe `FAIL desk shop#n=3: button endNight covered by none (off screen)`.
- Probe: FAIL `node web/step0/probe_shop.cjs` before the change (new: 8 screens x nights 1-3, every item and End reachable and the card over at most 5% of the reflection, seated and while it performs a buy): `FAIL land 844x390 night 1: shop card covers 60% of the seated reflection (opts)`, `FAIL phone 390x844 night 3: shop card covers 100% of the seated reflection (opts)`, `FAIL tablet 768x1024 night 3: shop card covers 57% of the seated reflection (shards)`, `FAIL desk 1280x720 night 3 after a buy: endNight off screen`, `FAIL small 1024x600 night 3: opt:dash off screen` ... `RESULT shop probe 222 of 240 pass`.
- Cause: the shop panel's place and size came from fixed screen fractions (a 34vw left column on wide screens, bottom-aligned rows in portrait, a 50vw two-to-a-row block on short landscape from F34), not from where the glass is. Night 1 sells two items and fitted; nights 2-3 sell up to five, so the column ran past 720 px on desktop and 600 px on a small laptop, and in portrait and short landscape the rows grew over the glass. F34 fixed the landscape off-screen case by widening the block, which put it over the glass (the smoke's land step caught that; session 24 had no checks run).
- Class: a card whose place is set by screen fractions while the picture it must leave clear (the glass) is placed by the camera.
- Sweep: `probe_shop.cjs`: desk 1280x720, hd 1920x1080, laptop 1366x768, small 1024x600, phone 390x844, land 844x390, tablet 768x1024, ultrawide 2560x1080, nights 1, 2, 3, seated and after one buy (240 checks); 18 FAIL, all the shop. Other cards over the room picture: `.card.see` (Dazai, small win, ending, crowd) sit at the bottom with nothing to keep clear but the clown and passed the smoke on desk, phone and land; the cover probe (195 buttons, run 98) found only this shop line.
- Where: `web/step0/night1.html` CSS `.card.shopAt` (the portrait and short-landscape media rules removed), new `shopFit()`, CONFIG `shopGap`, `shopMinPx`, `.opt` note in its own span.
- Fix: `shopFit()` (on drawing the shop and on resize, never per frame) puts the panel in the largest free part of the screen left of, right of, under or over the glass (from `NS.mrect` and the canvas box), fading toward the glass; if the content does not fit, items go two to a row and the header lines go (`tight`), then the notes and long lines go (`tighter`). Look change: the panel is a bounded block beside the glass instead of a full-height column; the reflection is never covered.
- Proof: PASS `RESULT shop probe 240 of 240 pass` and `RESULT cover probe 195 of 195 buttons reachable` after the change. Mutation (`shopFit()` returning at once, copy in /tmp/mut): `FAIL desk 1280x720 night 3: endNight off screen` ... `RESULT shop probe 123 of 150 pass` (5 screens). `probe_shop.cjs` added to CI job `step0`.

## F36: the Light real-play check failed on slow runners because a clinging Shame slowed him
- Found: session 25 batch 1, CI run 98: `desk FAIL Light: running from it at 100% stick escapes it (real play) caught by the Light {"inT":2.53,...,"loses":0}` (also 60%, and both on phone); the same steps passed locally (inside the spot 1.25 and 0.70 s).
- Probe: FAIL local desk smoke with the page's CPU slowed 6x from the Mirror World on (`THROTTLE=6`, new in `smoke_night1.cjs`) and the run's own diagnostics: `run 1 : inside the spot 2.35 s of 8.0 s ... Shame clung 6.85 s ... nearest other figure 0.45 m` / `desk FAIL Light: running from it at 100% stick escapes it (real play) caught by the Light`; the same run with the ring's other figures down (`probe_light_run.cjs`, frame-steered, at 4 and 7 fps): `PASS ... inside the spot 0.75 s` in 6 of 6 trials, so the Light alone is escaped at any frame rate.
- Cause: since the route mixer (session 23) the ring holds the Light with a group and the corridor's followers (whisper, light, shame in the smoke). The steps before the run wait on wall-clock sleeps (gags step: 600, 700, 900 ms), so on a slow runner less game time passes and Shame is next to him when the run starts; it clings for most of the 8 s and halves his speed (`shame.slow` 0.5). The run step set the Light's state but not the other figures' (the F32 class).
- Class: a real-play check that does not set the state it measures from.
- Sweep: the whole desk smoke at THROTTLE=6 after the change: every Mirror World step (outruns it, gnaw, holding still, three gags on its lamp, others beaten, shards) passed with the other figures present, `RESULT night1 smoke 63 of 63 pass`; `smoke_nights.cjs` cases put down every figure they do not measure.
- Where: `web/step0/smoke_night1.cjs`, the `Light: running from it at ...% stick` loop.
- Fix: for the 8 s run the other standing figures are taken out of play (alive off, cling and reach cleared) and put back after; the step prints how long he was fallen, clung and hurt and the nearest other figure. Not changed: the 2 s limit, the 8 s run, the steering.
- Proof: PASS local desk smoke at THROTTLE=6 after the change: `run 1 : inside the spot 1.35 s of 8.0 s ... Shame clung 0 s` and `run 0.6 : inside the spot 0.60 s`, `RESULT night1 smoke 63 of 63 pass`.

## F37: the vanitylow mutation no longer broke the rule it stands for
- Found: session 25 batch 1, CI run 98 job `n1mut (4)`: `FAIL night1 mutation vanitylow: not caught (smoke passed)` (also run 84).
- Probe: FAIL local `MUTATE=vanitylow UNTIL='dressing table' ONLY=desk node web/step0/smoke_night1.cjs`: `vanity: reflection in the glass true | heads apart 11% of the height` with and without the mutation, `RESULT night1 smoke 6 of 6 pass (MUTATE=vanitylow)`.
- Cause: the mutation puts back the session 18 glass (centre 1.55 m, 1.1 m high, spanning 1.0-2.1 m); with today's seat and framing the reflection's face (head bone to 0.3 m above) lies inside that too, so the check correctly passed. The mutation, not the game or the check, was out of date.
- Class: a mutation that no longer breaks its rule after the game changed on purpose.
- Sweep: every other mutation in run 98: night1 64 of 65 caught (8 shards), games 8 of 8, nights 20 of 20; `test_cue.cjs` 16 of 16, `smoke_walk.cjs` 12 of 12; perf shards all fired.
- Where: `web/step0/smoke_night1.cjs` MUTS `vanitylow`.
- Fix: the mutation lifts the glass clear of his face (centre 1.95 m, 0.7 m high). The check is unchanged.
- Proof: PASS local: `desk FAIL opening at the dressing table, his reflection facing him (22b-6) vanity {..."inGlass":false...}` / `RESULT night1 smoke 5 of 6 pass (MUTATE=vanitylow)`, so the mutation is caught.

## F38: in the shop the shard row drew over the first item (F35's panel shrank its parts)
- Found: session 25 batch 2, CI run 99 (8f4ec42): `FAIL laptop 1366x768 night 3: opt:sweep covered` / `RESULT shop probe 239 of 240 pass`; it passed locally.
- Probe: FAIL local `node web/step0/probe_shop.cjs` with a new check that no two parts of the card overlap (content included): `FAIL laptop 1366x768 night 3: card parts overlap: shards over sweep by 18 px` / `RESULT shop probe 263 of 264 pass`. The screenshot shows three rows of shards over the top of "Spotlight sweep".
- Cause: F35 gave the shop card a fixed height; its parts are flex items of a column, which shrink by default, so the shard row kept its 22 px minimum while its wrapped shards drew over the item below. The fit test then saw no overflow (the parts had shrunk), so `tight` never came on. On CI the item's centre fell under the shards (font metrics), locally just beside them.
- Class: parts of a fixed-height flex card squeezed instead of overflowing.
- Sweep: the overlap check on all 8 screens x nights 1-3 seated and after a buy: only this case. The other fixed-height cards: none (every other card is full screen and scrolls; `.card.see` sits at the bottom with its own height).
- Where: `web/step0/night1.html` CSS `.card.shopAt > *`.
- Fix: the shop card's parts keep their height (`flex-shrink: 0`), so too much content overflows, `shopFit()` sees it and goes tight, then tighter, then the card scrolls.
- Proof: PASS `RESULT shop probe 264 of 264 pass` after the change (overlap check added to the probe, which runs in CI job `step0`).

## F39: the stickfull mutation was caught only some runs; the 60% stick run no longer checked the stick curve
- Found: CI run 99 job `n1mut (5)`: `FAIL night1 mutation stickfull: not caught (smoke passed)` (also run 84; caught in run 98).
- Probe: FAIL local `MUTATE=stickfull ONLY=desk UNTIL='60% stick' node web/step0/smoke_night1.cjs` with the run's speed printed: `run 0.6 : inside the spot 1.95 s of 8.0 s ... speed 1.02 of 1.72 m/s` passed the 2 s limit by 0.05 s, so whether the mutation was caught depended on the run.
- Cause: the step checked the stick curve only through being caught by the Light (F24). Since F24 (the Light loses him, no re-centring) and F36 (the Light alone), a slower thumb still gets away just inside the limit; the curve itself (stickFull 0.35: full speed from 35% of the stick) was not measured.
- Class: a rule checked only through a side effect that other changes have weakened.
- Sweep: the other mutations whose step is a real-play outcome: lightlose (caught, `100% stick` needs the Light to lose him at least once), gnaw, lampgag, lightdark, bag, corwide (caught in runs 98 and 99, each step reads its own value: drain, hits, dark lamp, bag order, corridor width).
- Where: `web/step0/smoke_night1.cjs`, the `Light: running from it at ...% stick` loop.
- Fix: the run measures his average speed while not fallen and fails below 90% of full speed (`S.speed x mwTempo`) at 60% and 100% stick.
- Proof: PASS local desk: `run 0.6 : ... speed 1.66 of 1.72 m/s`, `RESULT night1 smoke 52 of 52 pass`; with the mutation: `desk FAIL Light: running from it at 60% stick escapes it (real play) slower than full speed at 60% stick {..."speed":1.02,"full":1.72}` / `RESULT night1 smoke 51 of 52 pass (MUTATE=stickfull)`.

## F40: the shoplow mutation lost its anchor when F35 changed the shop CSS
- Found: CI run 99 job `n1mut (6)`: `FAIL night1 mutation shoplow: failed on another step` / `Error: mutation anchor not found once: .card.shopAt { background: linear-gradient(...`.
- Probe: FAIL as found (the anchor search in `smoke_night1.cjs` throws before any step); session 25's own anchor scan was run before batch 1 but not after batch 2.
- Cause: batch 2 replaced the `.card.shopAt` rule the mutation searched for, and no check looks at mutation anchors before a push.
- Class: a mutation anchor not found once in the file it breaks (it then fails "on another step" and hides whether its rule is checked).
- Sweep: new `web/step0/check_anchors.cjs` over every mutation in `smoke_night1.cjs` (65), `smoke_games.cjs` (8), `smoke_nights.cjs` (20): only shoplow was missing; in CI job `step0` from now on.
- Where: `web/step0/smoke_night1.cjs` MUTS `shoplow`; new `web/step0/check_anchors.cjs`.
- Fix: shoplow now gives the shop panel the whole screen (`let best = [0, 0, vw, vh, 'b']` in `shopFit()`), over the glass.
- Proof: PASS `RESULT anchors 93 of 93 found once`; local `MUTATE=shoplow UNTIL='fix 5' ONLY=desk`: `desk FAIL shop at the mirror: the reflection performs each buy back at him (fix 5) shop card covers 42% of the reflection (opts)` / `RESULT night1 smoke 60 of 61 pass (MUTATE=shoplow)`.

## F41: the gnaw check read the warning left from the step before
- Found: CI run 101 job `step0`: `land FAIL standing still: they gnaw (edge at once, drain after the warning, any action clears it) (P4) warning stage {"still":0.0167,"d":0,"cls":"","warn":1}`; every passing CI run printed `gnaw: warning after 0.00 s still` (runs 98, 99: desk, phone, land), local runs `0.28-0.30 s`.
- Probe: FAIL `bash web/step0/probe_gnaw_stale.sh` with the old wait (`STALE=1` leaves the warning on from one real game frame before the step's setup, the game's own 0.3 s freeze holds it past the wait): `desk FAIL standing still: they gnaw ... warning stage {"still":0,"d":0,"cls":"warn","warn":1,"after":0.25}`. Not reproduced without it (local desk and land, throttle 1, 4, 8; 0 still resets while standing in a 43-frame trace): the CI readings come from the timing of frames against the check's round trips.
- Cause: the step waits for `gnawLvl === 1` right after its setup resets `M.still`. Playwright checks the predicate at once, so the warning left on from the step before satisfied it before any game frame of this step: the reading was `still 0.00` with the old `warn` class (passed, as the check accepted any still below 1.0 s), or, when one 16.7 ms frame landed before the read, `still 0.0167` with the edge cleared (run 101 FAIL). The game is right: the warning needs `M.still > N1.stillAfter` (0.25 s).
- Class: a check step that waits on game state its own setup changes, where the awaited value can already hold from the step before (stale read at a step boundary), and a check that accepts a reading the game cannot produce.
- Sweep: every `waitForFunction` that follows a state-setting `evaluate` in `web/step0` checks (20 of 71): smoke_night1 175 (brav made by the click), 213 (wait for idle), 360 (`actRoutine()` sets `A.t = 0` in the same evaluate), 412 (S.room false before the walk), 429 (`NS.press` false since the mirror sit), 461 (row counts up), 471 (space was the corridor), 525 (`inPrev` false: the step before ends with him outside the spot), 540 (needs still >= 2 s), 546 (level was 2), 552 (`M.t - __runT0`), 558 (hit count), 563 (yaw change from its own reading); smoke_nights 149 and 242 (trace cleared in the setup), 180 (a stale cling reads no tell from the cleared trace and fails, never passes), 297 (count from 0 in this fight). No other stale read found. No other check reads `gnawLvl` or `M.still`.
- Where: `web/step0/smoke_night1.cjs`, step `standing still: they gnaw`; new `web/step0/probe_gnaw_stale.sh`, in CI job `step0`.
- Fix: the setup records `window.__t0 = M.t` and the wait needs `M.t > __t0` (a game frame after the setup); the warning reading must have `still > N1.stillAfter`. Probe switch `STALE=1` in the step.
- Proof: PASS `bash web/step0/probe_gnaw_stale.sh`: `PASS mutation stalewait caught: desk FAIL standing still ... {"still":0,...}` and `PASS probe_gnaw_stale: warning read from a fresh frame: gnaw: warning after 0.30 s still`; local `ONLY=desk|phone|land UNTIL='standing still: they gnaw'`: warning after 0.30 / 0.28 / 0.30 s, `RESULT night1 smoke 54 of 54 pass` on each.

## F42: the Stare and Whisper scripts never passed the static check; every cast job stopped before building
- Found: CI run 116 (5df7b92), all 11 `cast` jobs: `chars/stare.py:14:1: 'chars.common.cyl' imported but unused`, `chars/whisper.py:15:1: ... cyl imported but unused`, `chars/whisper.py:74:22: local variable 'ty' is assigned to but never used`, `74:36: ... 'hy'`, then exit 1 in `python -m pyflakes chars/*.py`, before any build or gate.
- Probe: FAIL `cd clown_v2 && python3 -m pyflakes chars/*.py *.py || echo FAIL pyflakes` printed the same 4 lines and `FAIL pyflakes`.
- Cause: the two scripts were written in sessions 29 (batches 1 and 2), build-only sessions (requirement 6), so the static check that the cast job runs first never ran on them; the cast job did not build the eight figures until this session's batch 1.
- Class: code committed in build-only sessions that a CI static check covers but that never ran through it.
- Sweep: every file changed since run 101 (ea54f92) that a static check covers: `clown_v2/chars/*.py` (child, light, props_girl, rigger, shame, strongman clean; stare, whisper faulted), `clown_v2/check_glb.py`, `probe_clip_loop.py`, `render_pose.py`, `s3_check.py`, `s3_rig.py`, `sample_sheet.py` (pyflakes clean), `web/step0/night1.html` (`node check-static.cjs step0/night1.html`: `RESULT PASS fails=0 warns=13`).
- Where: `clown_v2/chars/stare.py`, `clown_v2/chars/whisper.py`.
- Fix: unused `cyl` imports removed; `_coat_at` unpacks the unused y values as `_`. No geometry change.
- Proof: PASS `cd clown_v2 && python3 -m pyflakes chars/*.py *.py && echo PASS pyflakes clown_v2 chars and scripts`.

## F44: the shop A/B's earlier page could not load the v2 cast
- Found: CI run 123 (4fe8eba), job `gpu`: all 8 shop A/B rounds `FAIL 1080p desktop shop A/B round 0 night1_prev.html: page ready and timed | {"error":"TimeoutError: Waiting failed: 120000ms exceeded","state":{"night":true,"ready":false,...},"pageErrors":["Error: THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures"]}` (and 1440p), then `FAIL no page or console errors`; `RESULT gpu night1 57 of 66 pass`. The job ran 21 min (8 x 120 s waits), run 122 ran 6 min.
- Probe: new `web/probe_prev_page.mjs` (loads a page copy against the current step0 assets the way the A/B does). Local, software GL, night1.html from b08b829: `FAIL night1_prev_old.html ready with no page errors against the current step0 assets | {"ready":false,"errors":["Error: THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures","not ready: TimeoutError: Waiting failed: 120000ms exceeded"]}`.
- Cause: session 32 batch 2 (a381ce7) made `step0/cube25d/setup.sh` copy the v2 cast as KTX2/meshopt GLBs; the A/B's earlier page (`NIGHT1_PREV_SHA` b08b829, workflow `clown.yml`) has no KTX2Loader, so its cast load throws and the page never reaches ready.
- Class: a page from an older commit served against the current tree's assets in CI.
- Sweep: `clown.yml` has two such pages: `NIGHT1_PREV_SHA` (faulted) and `GPU_CONTROL_SHA` (web/game/index.html at 1356a35 against web/game assets; loads and is timed in run 123: `"controlBefore":17.4,"controlAfter":14.8`; web/game assets unchanged by the v2 cast). No other `git show FETCH_HEAD` in the workflows. New probe for the class: `probe_prev_page.mjs` now runs in the `gpu` job before the A/B and fails the job with its own line.
- Fix: `NIGHT1_PREV_SHA` moved to a381ce7 (session 32 batch 2: the v2 cast, before batch 3's reflection change), so the A/B now compares batch 3 against batch 2.
- Proof: local, software GL, night1.html from a381ce7: `PASS night1_prev_new.html ready with no page errors against the current step0 assets | {"ready":true,"errors":[]}`; Mac proof is this commit's `gpu` job (`PASS night1_prev.html ready ...` and both A/B gates judged).

## F45: a pratfall or a trip could leave him inside an obstacle or a crew member, and no input moved him again
- Found: session 37 cold-play runs (`design/STRANGER-night1-s37-coldplay.md`, logs on the session box `/tmp/coldplay/first-phone`, `/tmp/coldplay/cold-desk`). Phone: after "Pratfall over the cable" at x -2.18 he was at (-2.18, 12.00); 7 drags in every direction, 0 m; the lead reproduced it (6 directions, 0 m). Desktop: "Trip (E)" for the child at (-2.66, 16.48) put him at (-2.66, 17.08), 0.42 m from the child (her circle and his: 0.65 m); 12 commands, 0 m. Both players quit there.
- Probe: new `web/step0/probe_land_free.cjs` (plays night1.html's own route to the corridor, puts him at each case's spot, presses the verb, checks the landing is walkable by the page's own walk rects, obstacles grown by the clown radius and crew circles, and that one of the four arrow keys moves him 0.15 m). On the page before this commit (`PAGE=` a copy of 21fb835's night1.html): `FAIL pratfall at (-1.9, cable): lands on walkable floor | {"x":-1.9,"y":12,"ok":false}`, `FAIL pratfall at (-1.9, cable): he can walk away after it | {"ArrowUp":0,"ArrowDown":0,"ArrowLeft":0,"ArrowRight":0}`; `FAIL trip at (-2.66, 16.48): lands on walkable floor | {"x":-2.66,"y":17.08,"ok":false}`, `FAIL trip at (-2.66, 16.48): he can walk away after it | {"ArrowUp":0,...}`; `PASS pratfall at (0.4, cable)` (open floor).
- Cause: `doVerb` set the pratfall's landing at y `cableY + pratLand` keeping his x, and `tripAcross` fell back to 0.6 m straight along the camera's line when no fall line in `tripAngles` fitted; neither landing was checked with `free()`. A landing inside an obstacle or crew circle makes `free()` false for every step from there (`stepMove` only moves to free spots), so he can never walk again.
- Class: a scripted move that sets the clown's position without the walk's own `free()` check.
- Sweep: every write of the clown's position outside `stepMove`. Walk (`S.x`, `S.y`): the walk start and `backStart` (fixed data, every run starts walking), the pratfall (faulted), the trip's search (checks `fits`, which uses `free`), the trip's fallback (faulted). Act (`A.x`, `A.z`): walk-on and routine moves are fixed lines; the fall act's dive goes 0.6 m in x toward the pool, whose centre is kept at least the pool radius (0.9-1.2 m) inside the area, so the landing stays inside (read, not probed). Mirror World (`M.x`, `M.z`): every space clamps his position each frame after any move (dodge included), so he is never left outside.
- Where: `web/step0/night1.html` `doVerb`, `tripAcross`, `n1Anim`; new `landX`.
- Fix: the pratfall lands on the nearest walkable x on its landing row (`landX`, out to 3 m either side) and slides there during the fall (`x0` to `x1`); the trip's fallback shortens its step until the landing is walkable (0 = he trips in place). `NS.verbs.fall` is set before the landing search, so the cable rule does not block the landing row.
- Proof: `node web/step0/probe_land_free.cjs` on this commit's page (local, software GL; two runs, the route is slow): `PASS pratfall at (-2.18, cable): lands on walkable floor | {"x":-1.53,"y":12,"ok":true}`, `PASS ... he can walk away after it | {"ArrowUp":0.19,"ArrowDown":0.24,"ArrowLeft":0.24,"ArrowRight":0.24}`; `PASS pratfall at (-1.9, cable): lands on walkable floor | {"x":-1.55,"y":12,"ok":true}` and walks away; then `CASE=2,3`: `PASS pratfall at (0.4, cable) ... {"x":0.4,"y":12,"ok":true}`, `PASS trip at (-2.66, 16.48): lands on walkable floor | {"x":-2.66,"y":16.48,"ok":true}`, `PASS ... he can walk away after it | {"ArrowUp":0,"ArrowDown":0.24,"ArrowLeft":0,"ArrowRight":0.24}`, `RESULT land free 6 of 6 pass`. Not in CI yet (checks session 40: add it to job `step0` with a mutation that removes `landX`).

## F46: on the phone the clown could not walk in the live fall act, so every fall was outside the light
- Found: session 39 newbie cold-play run (`design/STRANGER-night1-s39-coldplay.md`, log on the session box `/tmp/coldplay/s39-newbie`). Phone: in the ring, step 25 a drag right left him at (0.6, 0) and step 27 a drag left at (0, 0); both presses were outside pool 1 (1.6, 0.2) r 1.2 and graded "fell in the dark"; the act was cut. The session 38 phone player also pressed from (0, 0).
- Probe: new `web/step0/probe_fall_touch.cjs` (phone 390x844 with touch, the game's own route to the corridor, a jump to 1 m before the walk's end, a finger held up to walk into the act, then in the live fall a CDP touch drag held 1 s of act time and the right arrow key as control). Before (this commit's parent page): `FAIL touch drag walks him in the live fall act (1 s, > 0.5 m) | {"from":[0,0],"to":[0,0],"m":0}`, `PASS key walks him in the live fall act (control, 1 s, > 0.5 m) | {"from":[0,0],"to":[1.76,0],"m":1.76}`, `RESULT fall touch 3 of 4 pass`.
- Cause: the window `pointerdown` handler returns before it starts the stick when `S.ended` is set (`... || S.room || S.ended) return;`); `endWalk` sets `S.ended = true` and the act starts from there, so in the live fall act (`n1Pointer` returns false there to let the stick start) no touch ever set `input.tx`/`input.ty`. Keys go through `readKeys`, which has no such gate, so desktop walked.
- Class: a scene that walks by the touch stick while a walk flag (`S.running`, `S.room`, `S.ended`) still says "cannot walk".
- Sweep: every reader of the stick (`input.tx`): the walk's `moveInput` (gated by `S.ended` itself, correct: the walk's end), the live fall act's `fallStep` (faulted), the Mirror World's two readers (`mwEnter` sets `S.ended = false` and `S.room = false`; the newbie walked there by drag, (0, 35.6) to (0, 31.27)). No other scene reads the stick.
- Where: `web/step0/night1.html` window `pointerdown` handler.
- Fix: the gate lets the stick start after the walk's end while the live fall is playing (`S.ended && !(n1 && fallPlaying())`).
- Proof: `node web/step0/probe_fall_touch.cjs` on this commit's page (local, software GL): `PASS live fall act reached`, `PASS touch drag walks him in the live fall act (1 s, > 0.5 m) | {"from":[0,0],"to":[2.53,0],"m":2.53}`, `PASS key walks him in the live fall act (control, 1 s, > 0.5 m)`, `PASS no page errors`, `RESULT fall touch 4 of 4 pass`. Not in CI yet (checks session 40: add it to job `step0` with a mutation that restores the `S.ended` gate).

## F47: in the live fall act his shoes stood on the lit disc and no roll started
- Found: session 41 kid-reader run kid6 (`design/STRANGER-night1-s41-kidplay.md`, log on the session box `/tmp/coldplay/kid6/log.jsonl`) step 24: he stood at (-0.15, 0), 1.24 m from pool 2 (-1.32, 0.41) r 1.2, stage `wait`; the kid: "I am at the edge of the light now, and the Fall button is still dark". Same shape as kid5's fall 2 in session 40 (not logged then).
- Probe: new `web/step0/probe_light_edge.cjs` (phone 390x844, software GL, the game's own route into the live fall, test-side placement; measures the drawn disc and his shoes' reach past his root from the skinned vertices under 0.12 m). Before (69bc8c3 page + batch 2): `PASS shoe vertices found under 0.12 m | {"reach":0.398,"low":1070,"pool":1.2,"disc":1.2}`, `PASS drawn disc radius equals the pool radius`, `PASS control: shoes off the disc, no roll | {"stage":"wait","d":1.748}`, `FAIL shoes on the disc edge (root outside the radius): the roll starts | {"stage":"wait","d":1.4388,"at":[0.16,0.2],"pool":[1.6,0.2]}`, `RESULT light edge 5 of 6 pass`.
- Cause: `fallInPool` compares his root point (between his feet) with the pool radius, and the drawn disc has the same radius, so with his shoes (0.398 m reach) on the disc's edge and his root up to 0.4 m outside it, the picture shows him in the light and the rule says out; the roll waits and the press grades "Not in the light."
- Class: a test of "is he in the light" made on his root point against a drawn light he is seen standing in.
- Sweep: `fallInPool` (roll start in `fallStep` and the press grade in `fallPress`: faulted, one function); the Mirror World Light's `inSpot` (`f.r` against his root, line ~5321): same rule, but its error is on the player's side (at the edge he is not drained) and the F36 check times his time inside the spot, so changing it changes balance and a check: logged here, not changed (prototype scope: does not block a playtest); the act's follow spot and the sweep act have no position test; the walk's "Walk into the light" ends on the walk's end line (`endY`), not a light test (not this class); `fall_act.html` (box prototype, superseded by the live fall) not changed.
- Where: `web/step0/night1.html` `fallInPool`, CONFIG `N1.fallFootR`.
- Fix: `fallInPool` uses the pool radius plus `N1.fallFootR` 0.4 m (the measured shoe reach), so he is in the light when his shoes are on the disc; the drawn disc is unchanged. `fallNext` (next pool 2.0-3.6 m away) still starts him outside the grown radius (1.6 m on night 1).
- Proof: `node web/step0/probe_light_edge.cjs` on this commit's page (local, software GL): `PASS control: shoes off the disc, no roll | {"stage":"wait","d":1.7479999999999998}`, `PASS shoes on the disc edge (root outside the radius): the roll starts | {"stage":"roll","d":1.4388,"at":[0.16,0.2],"pool":[1.6,0.2]}`, `PASS no page errors`, `RESULT light edge 6 of 6 pass`. Side effects: `node web/step0/probe_fall_beat.cjs` `RESULT fall beat 8 of 8 pass` (perfect on the lit press, "Too early" in the light, "Not in the light." at 3 m). Not in CI (checks session 45).

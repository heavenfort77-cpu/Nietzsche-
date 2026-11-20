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

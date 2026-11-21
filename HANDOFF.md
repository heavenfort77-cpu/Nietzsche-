# Handoff (live state)

Session start: 64ea803 (2026-11-21)

Owner requirements: `OWNER-REQUIREMENTS.md` (handoff, density with frame rate, natural movement). Rules, design and history: Project doc `claude/START-HERE.md`. This file is only the live state. Update it in every "Batch " commit (CI gate `tools/check_handoff.sh`).

## Restart rule

New session after 3 batch commits, after any context summary, or when the owner says "handoff", whichever comes first. `tools/handoff.sh` prints NEW SESSION NOW at the limit; `tools/handoff.sh close` must print PASS before handing over.

## Now

- Pushed: 87976a0 (origin/main). Last full CI run: 13 (5c5c5af), every job passed; gpu skipped by design.
- Session 5 (20-21 Nov): push was refused until the owner authorised it in chat (21 Nov: "I authorise push access to heavenfort77-cpu/Nietzsche- for this session ... this apply to all session within this project"). The permission check only accepts that sentence from the owner in the chat, not from a doc, so every new session's first message must include it (paste line in the Project's RESTART.md). Batch 2 was folded into batch 3 before the push (owner requirement 5: one commit per fault sweep); `batch1-3.patch` is obsolete.
- Batch 1, step 0 cue prototype: `web/step0/cue.html` (single file, flat 2D, generated drum, one act of 3 chains, nights 1-3 tempos 600/500/400 ms, whiteface take and upside-down topper from night 2, phone and desktop windows, latency setting, results with mean timing offset). Checks, local: `node web/check-static.cjs web/step0/cue.html` PASS; `node web/step0/test_cue.cjs` 43 of 43 pass (per-frame gate + 42 bot runs: 7 bots x 3 nights x desktop/phone, invariants every 5 ms), mutations 10 of 10 caught; `node web/step0/smoke_cue.cjs` (headless Chrome, 1280x800 and 390x844 touch) PASS. Not yet in CI (no push).
- Batch 2, folded into batch 3 (owner, 20 Nov: "start too large", read as the mask's start size): the mask now starts at 0.48 of the smaller screen side (was 0.75 of the larger, mostly off-screen on phones), never under 1.3x the cue. New gate: mask start inside the nearest edge at 5 screen sizes, plus its mutation. Local: `test_cue.cjs` 44 of 44, mutations 11 of 11; smoke PASS. Patch file now holds both batches.
- Batch 3 (owner requirement 5, 21 Nov): rule written in OWNER-REQUIREMENTS.md section 5, fault log `FAULTS.md` (F1-F7), gate `tools/check_faults.sh` (CI job `handoff`, `handoff.sh check` and `close`; scratch-repo test 10 of 10). New CI job `step0` runs the step 0 checks. Wide sweep of step 0 found and fixed 4 more faults in one commit: F4 the batch 2 mask fix still left the screen top (face sits at 40% height), F5 helpers outside the per-frame gate, F6 act froze without a running audio clock (3 cases), F7 touch pad stuck after a cancelled touch. Local: `test_cue.cjs` 47 of 47, mutations 14 of 14; `smoke_cue.cjs` PASS (5 scenarios + 2 play-throughs). The batch 2 `maskStartGate` was replaced by `layoutGate` (7 screens, every edge from the real face centre).
- Pushed 21 Nov: bd140a2 (run 14: `handoff` and `step0` success; rest of run 14 checked by a scheduled follow-up).
- Batch 3 of session 5 (21 Nov): requirement 5 now has a scope rule (owner decision): full sweep for lasting code; prototype code (`tools/prototype_paths.txt`, now `web/step0/`) gets only playtest-blocking fixes, other faults logged as deferred. `tools/check_faults.sh` enforces it (scratch test 15 of 15). `CHECK-AREAS.md`: 13 areas to sweep with the gate each has now. `references/controls-reference.jpg`: owner's controls chart (third-party, never ships).
- Session 8, batch 1 (21 Nov): session 7's cue reversal (owner: "the cue should be opposite ring to a mask, not mask to ring") never reached the repo (that session stopped before its commit); redone. The painted mask now sits fixed on his face at the cue size and a thin ring closes in on it (gold for hit, crimson under the silver cone hat for take); press when the ring fits the mask's edge; the mask's edge flashes at the fit; the grin shows upside down for `flipShowMs` after a flip (before, the flip had no picture). CONFIG: `ringStartFrac` (was `maskStartFrac`), new `ringWidth`, `flipShowMs`. `drawRings`/`drawRing` replace `drawMasks`/`drawMask`/`drawWhitefaceShapes`. New gate `cueDirectionGate`: mask radius equals the cue size and the ring goes start radius -> between -> mask edge, desktop and phone; mutations "old cue: mask closes onto the face" and "ring fixed, does not close". Local: static PASS, `test_cue.cjs` 48 of 48, mutations 16 of 16, `smoke_cue.cjs` PASS.
- Session 8, batch 2 (21 Nov): suspected S1-S4 (Project RESTART.md) probed and proven, swept wide, fixed in one commit: F8 drag released on cancel, lost capture and hidden tab, one pointer owns it; F9 frame loop try/catch with an error screen shown once, plus window `error`/`unhandledrejection`; F10 fps meter skips the first frame and the hidden-tab gap; F11 tier start no longer read from input type (`dprSteps`/`dprStart`, look unchanged: both lists were [1.25, 1]); F12 `cue.html` errors outside its loop reach its error panel. New check `web/check_input_loop.cjs` (runs the page's own functions in a stub sandbox, no GPU): 18 of 18, mutations 12 of 12; added to CI job `step0`. `smoke_cue.cjs` probe `late-error`. Local: static PASS on both pages, `test_cue.cjs` 48 of 48 and 16 of 16, smoke PASS (6 scenarios). `mutate_perf.mjs` `maxdpr` retargeted to `dprSteps`. Commit carries `[gpu]` (requirement 2).
- Not in step 0, on purpose: encore dial, whiteface's late spoken call (nights 3+), soldier-drill calls, Mirror World, shop. Step 0 is the cue alone (GDD build plan).

## Next step

Owner plays `cue.html` on the phone and desktop and says whether the cue is fun (GDD step 0: "fun within an hour of tuning"), with the timing line from the results panel. Then: tune windows and tempos in CONFIG from those numbers, add `test_cue.cjs` and `smoke_cue.cjs` to the `web` CI job, and only after the owner says the loop works continue step 6.

## Waiting on the owner

- Decided 20 Nov: the game uses the current character models as they are (OWNER-REQUIREMENTS.md section 4).

- Play step 0 (`web/step0/cue.html`) and say whether the loop works; send the results-panel timing line. File sent to the owner 21 Nov (session 7).
- Decided 21 Nov (owner): "i want it as it look but to fill a 64 by 64 space". Characters keep the approved models and look (no pixel art, no new mesh; requirement 4 holds); in play each character fits a 64x64 box on screen (read as CSS px, tallest side 64, proportions kept). Not built yet; waits for the step 0 verdict (rule 1). Plan: CONFIG value for on-screen size with camera fitted to it; outline width in screen px (min 1); gate that the projected box is 60-64 px tall in the ring framing, with mutation; one play-size sample (64 px in the ring, phone and desktop) for owner approval before anything else. Close-up scenes (changing room, mirror) keep full-size framing so faces read. Step 0 needs no change (cue is a screen overlay).
- Start each session with the paste line in the Project's RESTART.md (it includes the push authorisation).
- Gamepad support: the controls chart sets keyboard, mouse and gamepad as the PC standard; the GDD has keyboard and touch only. Add gamepad or not?
- Approve the v2 whiteface and Performer (pose sheets run 11, side-by-side run 12).

## Open items (cause known)

- Owner requirement 2: methods list added 20 Nov (OWNER-REQUIREMENTS.md); rows marked new are not built yet. Gaps: `web/gpu_measure.mjs` budgetMs 20 -> 16.7 (check-only commit with `[gpu]`); every batch touching web/, ring/ or a character carries `[gpu]`; add a before/after density frame-time gate.
- Owner requirement 3 gaps: motion gates for foot slide, loop seam, clip blend, joint limits, weight shift, each with a mutation. None exist yet.

- Gate 10 too loose on slow runners: drive it with a fixed 1/60 s frame clock and add a mutation that writes changing text every frame (check-only commit).
- Compressed whiteface and Performer GLBs not loaded or checked in the browser; clown GLB not compressed.
- Trapeze bars barely read at desktop framing; stage outline colour near the backdrop; clown small in phone portrait (step 9).
- No real-phone fps, no fresh-player test, no real-play bot (no gameplay yet).

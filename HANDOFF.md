# Handoff (live state)

Session start: 87976a0 (2026-11-20)

Owner requirements: `OWNER-REQUIREMENTS.md` (handoff, density with frame rate, natural movement). Rules, design and history: Project doc `claude/START-HERE.md`. This file is only the live state. Update it in every "Batch " commit (CI gate `tools/check_handoff.sh`).

## Restart rule

New session after 3 batch commits, after any context summary, or when the owner says "handoff", whichever comes first. `tools/handoff.sh` prints NEW SESSION NOW at the limit; `tools/handoff.sh close` must print PASS before handing over.

## Now

- Pushed: 87976a0 (origin/main). Last full CI run: 13 (5c5c5af), every job passed; gpu skipped by design.
- Session 5 (20 Nov): push access was refused by the session's permission check; the repo was attached read-only. Batch 1 (step 0) is committed locally only and was sent to the owner as `cue.html` plus `batch1-step0.patch`. Next session: attach with push, `git am batch1-step0.patch`, push.
- Batch 1, step 0 cue prototype: `web/step0/cue.html` (single file, flat 2D, generated drum, one act of 3 chains, nights 1-3 tempos 600/500/400 ms, whiteface take and upside-down topper from night 2, phone and desktop windows, latency setting, results with mean timing offset). Checks, local: `node web/check-static.cjs web/step0/cue.html` PASS; `node web/step0/test_cue.cjs` 43 of 43 pass (per-frame gate + 42 bot runs: 7 bots x 3 nights x desktop/phone, invariants every 5 ms), mutations 10 of 10 caught; `node web/step0/smoke_cue.cjs` (headless Chrome, 1280x800 and 390x844 touch) PASS. Not yet in CI (no push).
- Not in step 0, on purpose: encore dial, whiteface's late spoken call (nights 3+), soldier-drill calls, Mirror World, shop. Step 0 is the cue alone (GDD build plan).

## Next step

Owner plays `cue.html` on the phone and desktop and says whether the cue is fun (GDD step 0: "fun within an hour of tuning"), with the timing line from the results panel. Then: tune windows and tempos in CONFIG from those numbers, add `test_cue.cjs` and `smoke_cue.cjs` to the `web` CI job, and only after the owner says the loop works continue step 6.

## Waiting on the owner

- Decided 20 Nov: the game uses the current character models as they are (OWNER-REQUIREMENTS.md section 4).

- Play step 0 (`web/step0/cue.html`) and say whether the loop works; send the results-panel timing line.
- Allow push access to the repo in the next session.
- Approve the v2 whiteface and Performer (pose sheets run 11, side-by-side run 12).

## Open items (cause known)

- Owner requirement 2: methods list added 20 Nov (OWNER-REQUIREMENTS.md); rows marked new are not built yet. Gaps: `web/gpu_measure.mjs` budgetMs 20 -> 16.7 (check-only commit with `[gpu]`); every batch touching web/, ring/ or a character carries `[gpu]`; add a before/after density frame-time gate.
- Owner requirement 3 gaps: motion gates for foot slide, loop seam, clip blend, joint limits, weight shift, each with a mutation. None exist yet.

- Gate 10 too loose on slow runners: drive it with a fixed 1/60 s frame clock and add a mutation that writes changing text every frame (check-only commit).
- Compressed whiteface and Performer GLBs not loaded or checked in the browser; clown GLB not compressed.
- Trapeze bars barely read at desktop framing; stage outline colour near the backdrop; clown small in phone portrait (step 9).
- No real-phone fps, no fresh-player test, no real-play bot (no gameplay yet).

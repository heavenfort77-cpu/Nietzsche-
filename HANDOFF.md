# Handoff (live state)

Session start: 0514e06 (2026-11-20)

Owner requirements: `OWNER-REQUIREMENTS.md` (handoff, density with frame rate, natural movement). Rules, design and history: Project doc `claude/START-HERE.md`. This file is only the live state. Update it in every "Batch " commit (CI gate `tools/check_handoff.sh`).

## Restart rule

New session after 3 batch commits, after any context summary, or when the owner says "handoff", whichever comes first. `tools/handoff.sh` prints NEW SESSION NOW at the limit; `tools/handoff.sh close` must print PASS before handing over.

## Now

- Pushed: 0514e06. Last full CI run: 13 (5c5c5af), every job passed; gpu skipped by design.
- Session 4 pushed the handoff tools with [skip ci] (a full run is about 65 min). The CI job `handoff` first runs on the next normal push; check its result there.

## Next step

Step 0: the 2D clown-face cue prototype (flat 2D, drum, one act, phone and desktop), so the owner can play the loop (rule 1). Assumed because the 20 Nov question got no answer; step 6 waits until the owner says the loop works.

## Waiting on the owner

- Decided 20 Nov: the game uses the current character models as they are (OWNER-REQUIREMENTS.md section 4).

- Play step 0 and say whether the loop works.
- Approve the v2 whiteface and Performer (pose sheets run 11, side-by-side run 12).

## Open items (cause known)

- Owner requirement 2: methods list added 20 Nov (OWNER-REQUIREMENTS.md); rows marked new are not built yet. Gaps: `web/gpu_measure.mjs` budgetMs 20 -> 16.7 (check-only commit with `[gpu]`); every batch touching web/, ring/ or a character carries `[gpu]`; add a before/after density frame-time gate.
- Owner requirement 3 gaps: motion gates for foot slide, loop seam, clip blend, joint limits, weight shift, each with a mutation. None exist yet.

- Gate 10 too loose on slow runners: drive it with a fixed 1/60 s frame clock and add a mutation that writes changing text every frame (check-only commit).
- Compressed whiteface and Performer GLBs not loaded or checked in the browser; clown GLB not compressed.
- Trapeze bars barely read at desktop framing; stage outline colour near the backdrop; clown small in phone portrait (step 9).
- No real-phone fps, no fresh-player test, no real-play bot (no gameplay yet).

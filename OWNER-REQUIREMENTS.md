# Owner requirements

Standing requirements from the owner. `tools/handoff.sh start` prints this file at the start of every session. Each one names the check that enforces it; "not enforced yet" means a gate still has to be built, and that gap is listed in HANDOFF.md under Open items.

## 1. Hand over before the chat gets too long (owner, 20 Nov 2026)

- New session after 3 batch commits, after any context summary, or when the owner says "handoff", whichever comes first.
- Enforced by: `tools/handoff.sh` (exits 1 with NEW SESSION NOW at 3 batches), `tools/handoff.sh close` (PASS only when HANDOFF.md is current, committed and pushed), CI job `handoff` (fails a "Batch " commit that does not update HANDOFF.md).
- How-to for owner and Claude: Project doc `claude/RESTART.md`.

## 2. High-density graphics without losing frame rate (owner, 20 Nov 2026)

Density and frame rate are both required; neither is traded for the other.
- Density never goes down to win frame time. When a frame is slow: profile first, then cut cost that does not change the look (draw calls, overdraw, shader cost, resolution of effects).
- Target: 60 fps on a mid-range desktop (frame p95 at most 16.7 ms) with full density. The phone build is dialled down from the desktop build later (step 9).
- Enforced by:
  - `web/check_perf.mjs` gate 1: density floors (crowd 500, scatter 2,000, confetti 2,500, bulbs 250) and triangles at most 500,000; gate 6: the frame governor never cuts density.
  - `web/gpu_measure.mjs` (Mac runner, real GPU): frame p95 at most `budgetMs`.
- Not enforced yet:
  - `budgetMs` is 20 ms (50 fps), not 16.7 ms. Run 10 measured p95 12.0 to 12.4 ms with AO on, so tightening should pass; it needs one `[gpu]` run to prove.
  - The `gpu` job runs only with `[gpu]` in the commit message or on a manual run. Every batch that changes `web/`, `ring/` or a character must include `[gpu]`.
  - No gate yet compares frame time before and after a density increase.

## 3. Characters move naturally (owner, 20 Nov 2026)

- Timing and weight from Muybridge plates (`claude/Muybridge-Movement-Index.md`); poses pushed to the study's stage and off-stage postures.
- Natural means:
  - no foot sliding while a foot is planted;
  - weight shift: hips move over the standing foot;
  - no pops: loops join smoothly, and one clip blends into the next instead of snapping;
  - follow-through on loose parts (hat, sleeves, hair);
  - joints stay inside human limits.
- Enforced now: rig and deformation gates in `clown_v2/` (weights, at most 4 influences, no torn vertices).
- Not enforced yet, to build as gates (each proven by a mutation that breaks it):
  - foot slide: a planted foot's world speed stays under a small limit;
  - loop seam: pose and velocity at the last frame match the first;
  - clip blend: switching clips in the game page crossfades, no frame-to-frame joint jump above a limit;
  - joint limits: every bone stays inside its angle range for the whole clip;
  - weight shift: hip centre over the standing foot during walk.

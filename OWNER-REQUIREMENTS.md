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

### Methods (owner, 20 Nov 2026: use all of them where they apply)

Status: **in use** = in the build per START-HERE (20 Nov build status); **planned** = in the graphics report (`claude/Stylized web 3D graphics upgrade.md`) or the step plan; **new** = not planned yet. Every new dense element must name the methods it uses in its batch commit.

**Draw calls (the first limit)**

| Method | Status |
| --- | --- |
| Instancing: every repeated thing (crowd, confetti, straw, peanut shells, bulbs, sparkles, shards) is one InstancedMesh, one draw | in use |
| Merge static set pieces into one mesh per material (ring set: one mesh, one atlas) | in use |
| One texture atlas per set and per character, so merged meshes keep one material | in use (ring), planned (characters: body + face + hull, 3 draws) |
| No leftover material slots in exported GLBs (each slot splits a draw) | planned |
| Chunked instancing: split big instance sets into spatial chunks so off-screen chunks are culled whole | new |
| Texture arrays for instance variety (one draw, many looks), instead of separate materials | new |
| WEBGL_multi_draw / BatchedMesh only where per-object culling is needed (merged mesh measured faster otherwise) | planned (step 5 open item) |
| Sort draws by material and state; shadow pass draws casters only | new |

**Triangles and geometry**

| Method | Status |
| --- | --- |
| Characters 20 to 30k triangles desktop with the face as texture, not tube meshes | in use |
| Detail as texture (baked AO, curvature, painted ramps) instead of geometry | in use (ring bake), planned (characters) |
| LOD: lighter meshes past a set distance; far props as camera-facing impostor cards. Props and set pieces only, never characters (owner decision 4) | new |
| Painted cards for far layers (back crowd rows, tent depth, Mirror fog reflections) | in use (crowd cards), new (other layers) |
| Delete faces nobody sees (hidden interiors, culled shells) | in use |
| Frustum culling on everything, bounds grown for moving and skinned meshes | in use |
| Fog plus a tight camera far plane | in use (fog) |

**Pixels, fill rate and overdraw**

| Method | Status |
| --- | --- |
| Pixel ratio capped at 1.25, governor steps it down first | in use |
| Alpha cutout (discard) instead of blending for crowd cards and any card prop | in use (crowd shader), new (every new card) |
| Small additive particles only; limit big transparent surfaces (beam is one cone) | in use |
| Draw opaque front to back so hidden pixels are skipped; heavy shaders only on visible pixels | new |
| Cheap shaders for far and small things (unlit or baked), full ramp shader only on characters | in use (sets baked), new (by distance) |
| Dynamic resolution for the main pass, with effects at half resolution | new |

**Light and shadow**

| Method | Status |
| --- | --- |
| Bake set lighting into textures (light baked at 1024 x 64 samples, times colour at 2048) | in use |
| One real light; glow faked with emissive bulbs and bloom | in use |
| Shadows from the main light only, cast by characters only, onto a shadow plane; blob shadows under characters | in use |
| Shadow map re-rendered only when a caster moves | new |
| Lighting in the character shader from uniforms (study key and rim), not from many scene lights | in use |
| Mirror World reuses the same bakes through cold ramps, no new lights | planned |

**Textures and memory**

| Method | Status |
| --- | --- |
| KTX2 (ETC1S) GPU-compressed textures, about 4 to 8x less memory | in use for compressed GLBs (not yet loaded in the page) |
| meshopt-compressed geometry and animation | same as above |
| Texture cap 2048 for set atlases, 1024 body, 512 face on phone; anisotropy at most 4; mipmaps on | in use |
| Upload textures and compile shaders during loading (warm-up) | in use |
| Dispose per scene; GPU memory counts must not grow | planned (gate when scenes change) |

**Motion of dense things on the GPU**

| Method | Status |
| --- | --- |
| Crowd bob, lean and freeze in the vertex shader from one excitement value | in use |
| Confetti, sparkles, dust: motion computed in the vertex shader from per-instance seeds and time, no per-frame CPU updates | in use (confetti, sparkles) |
| Bunting, ropes, cloth sway in the vertex shader | planned |
| Landed confetti freezes into a static layer | planned |
| Scrolling noise in shaders for dust in the beam, fog drift, Mirror shimmer | in use (beam dust), new (others) |

**Post effects**

| Method | Status |
| --- | --- |
| All effects merged into one pass (pmndrs EffectPass) | in use |
| AO half resolution, 8 samples at most; first to switch off when frames are slow | in use |
| Bloom only on HDR values above threshold 1.2, so only bulbs, sparkles and the beam glow | in use |
| SMAA instead of MSAA; tone map, vignette, grain in the same pass | in use |
| Colour grading by LUT (one texture lookup) for the Mirror World | planned |

**CPU per frame**

| Method | Status |
| --- | --- |
| No allocations, traversals, name lookups or DOM reads per frame; HUD written only on change | in use (gated) |
| Static matrices frozen (matrixAutoUpdate off on sets and the scene root) | new (not in `web/game/index.html` on 20 Nov) |
| Pool every spawned object (gags, shards, hit effects); idle pooled items leave the scene graph | planned (with gameplay); confetti and sparkles are GPU instances, no spawning |
| Animate only visible or nearby characters; far ones update at a lower rate | planned |
| Fixed-step logic, interpolated drawing | planned (with gameplay) |

**Keeping density when frames are slow**

| Method | Status |
| --- | --- |
| Frame governor: pixel ratio first, then AO; never density (gate 6) | in use |
| Quality tier chosen from frame time measured while loading | planned |
| Phone gets lighter set models and textures (step 9), not fewer things on desktop; character models only if the owner says so (owner decision 4) | planned |

**Proof**

| Method | Status |
| --- | --- |
| Count gates: draws, triangles, density floors, texture memory (`web/check_perf.mjs`) | in use |
| Real-GPU frame times on the Mac runner (`web/gpu_measure.mjs`) | in use (on `[gpu]` only) |
| Before and after frame time for each density increase, same run | new |
| CPU and GPU time per frame (GPU timer query) so the slow side is named before any fix | new |

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

## 4. The game uses the current character models (owner, 20 Nov 2026)

- The character models stay as they are: no decimation, LOD swap, remesh or replacement to win frame time or memory. Frame time is won from everything else (methods list in requirement 2).
- Allowed: lossless compression of the same mesh (meshopt, KTX2), and animating far characters at a lower rate (the model is unchanged).
- Phone build (step 9): ask the owner before any lighter character model.
- Not enforced yet: a gate that the game's character triangle counts equal the built models' counts.


## 5. Faults: check wide, probe first, one commit (owner, 21 Nov 2026)

Owner's words: "any check of fault is to go wide instead of narrow. If 1 bug is found, check all, no crack should exist, no slip up. If 1 fault is found do probe test and no guess work. Consolidate all fixes and send for 1 commit."

- **Probe first, no guessing.** Before any fix, a test reproduces the fault and prints a FAIL line. The cause is named from that probe, not assumed. A fault that cannot be reproduced is reported as "not proven" and gets a probe, not a fix.
- **Go wide.** One fault means its whole class is suspect. State the class wide (for example "sizes derived from the screen", not "the mask radius"), then check every place in that class across the whole player journey and every target screen and device, and add a probe for each case. A gate that checks an assumption (half the screen) instead of the real geometry or behaviour is itself a fault.
- **Fix the class, not the instance.** All faults found in the sweep are fixed together.
- **One commit.** All fixes from one sweep go in one commit, together with their probes and gates. No fix is pushed before the sweep is finished.
- **Prove it.** The same probe passes after the fix, and a mutation that puts the fault back makes the suite fail.
- **Log it.** Each fault gets an entry in `FAULTS.md` (Found, Probe with its FAIL line, Cause, Class, Sweep, Fix, Proof with its PASS line), in the same commit as the fix. Places checked with no fault are listed in the Sweep, so they are not re-checked.
- Enforced by: `tools/check_faults.sh` in CI job `handoff` and in `tools/handoff.sh check` and `close`:
  - fails a new entry missing a field, a Probe with no FAIL line, or a Proof with no PASS line;
  - fails a commit whose subject says fix, bug or fault, and that changes code, when it adds no entry;
  - fails when new entries are spread over more than one commit in one push (CI) or in one session (`handoff.sh`).
  - Tested 21 Nov in a scratch repo: 10 of 10 cases behaved as intended.
- Not enforced (cannot be checked by a script): whether the Class and Sweep are really wide enough. The entry has to say what was checked, so the owner and the next session can judge it.

### Scope: lasting code and prototype code (owner, 21 Nov 2026)

Owner decision after asking whether probing an incomplete build is worth it: the full rule applies to code that lasts; prototype code gets only what the playtest needs.
- **Lasting code** (everything not listed in `tools/prototype_paths.txt`): the game page `web/game/`, the pipeline scripts, every check, gate and tool, and any game logic that carries into the real game. Full rule: probe, wide sweep, one commit, log.
- **Prototype code** (paths listed in `tools/prototype_paths.txt`, now only `web/step0/`): code whose job is to answer one design question and that may be thrown away. Probe and fix only faults that stop the owner's playtest or would give a wrong answer to the question (a frozen act, wrong timing, a missing button). Any other fault found there is logged in `FAULTS.md` as deferred (fields Found, Probe with its FAIL line, Cause, Class, Where with the file path, Deferred with the reason) and not fixed or swept yet. Prototype code gets no polish sweeps (extra screens, rare devices, edge cases) before the owner says the loop works.
- **When prototype code is kept** (its path is taken out of `tools/prototype_paths.txt`, or its logic is copied into lasting code), every deferred fault for it is swept and fixed in that same commit, and its lasting-code checks are added then.
- Enforced by `tools/check_faults.sh`: a deferred entry is allowed only if its Where path is under a prototype path; once a path leaves the list, any deferred entry still pointing into it fails CI. Not enforced: logic copied out of a prototype into lasting code by hand (the copying commit has to name it).
- Areas to sweep for each fault class: `CHECK-AREAS.md`.

## 6. Checks only every 5th session (owner, 21 Nov 2026)

Owner: "don't any check until every 5th session unless requested. add to repo."
- Sessions are numbered in HANDOFF.md (`Session: <n>`); `tools/handoff.sh start` adds 1.
- Checks run only in sessions 5, 10, 15, ... or when the owner asks for them in the current chat. Checks means every gate, bot sweep, mutation run, perf or GPU measurement and the handoff/fault gates, local or CI.
- Other sessions build and render only. Before handing the owner a build, the session still loads it once and confirms it opens with no page error (requirement: never hand over a half-finished build); that load is not a check run.
- CI: the `clown` workflow runs only when the commit subject starts with `[checks]` (or `[gpu]` for the GPU job), or on a manual run. A tag anywhere else in the message does not count (session 9's first push quoted the tags in its body and started a full run; cancelled). Commits in a checks session, or when the owner asked, start with `[checks]`.
- `tools/handoff.sh check` and `close` skip `check_handoff.sh` and `check_faults.sh` outside a checks session; `CHECKS=1 tools/handoff.sh check` forces them.
- This overrides the per-batch gate rules in requirement 2 and the Settings preferences (perf gate every batch) until the owner says otherwise.

## 7. Two camera framings: zoom in and zoom out (owner, 21 Nov 2026)

Owner, after playing the cue on the 3D clown in the 2.5D room: "cue is ok. this can be use for the act but it is large. this should be consider the zoom in for the nightly act, before going out for act and before going into mirror world. zoom out for showing of performance and other events."
- **Zoom in** (the session 9 cue framing: clown about 3 m from the camera, face at cue size, full body in frame): the nightly act (the cue), the moment before going out to the act (backstage), the moment before going into the Mirror World.
- **Zoom out**: showing the performance and other events. This is where the 64x64 on-screen character size (requirement 4 decision, 21 Nov) applies.
- Both are fixed Myst-style viewpoints (2.5D: Blender-rendered plates, 3D characters). A zoom out with a 64 px clown sees about 20 m of set at his distance, more than the 10 m cube room, so the performance view needs its own wider set and plates (the ring tent), not a wall of the cube.
- Owner, 21 Nov (same evening): "the cube room use only for before going out for performance, before going into mirror world. 3 wall to use and leave one wall use for nightly act." The cube room is the backstage room only: three walls are the before-the-performance and before-the-Mirror-World scenes, the fourth wall is the nightly act (zoom in, the cue). The performance shows and other events are not in the cube; their 2.5D method is the owner's choice from a list of interactive options (asked 21 Nov).
- Owner pick, 21 Nov: fixed-camera rooms (Resident Evil / FF7 style: the 3D clown walks through Blender-rendered shots, the camera cuts at zones) for leaving the cube room, walking to the performance and meeting other performers. Desktop and phone.
- Owner choice, 21 Nov: the Mirror World is real-time 3D with a following camera (immersive action), not plates. Earlier default, replaced: fixed-camera rooms too, but each fight is one arena shot that fits in one view; the camera never cuts during a fight (cuts flip the controls), and the shot can punch in (crop zoom from the same point, valid on plates) and shake. Alternative the owner can choose: real-time 3D for the Mirror World with a follow camera (more immersive, leaves the plate pipeline, GPU budget risk).
- Owner, 21 Nov 23:41: Mirror World goes for the immersive following camera; asked whether it can stay 2.5D with only the characters in 3D. Answer given: a camera that stays in one spot and turns (pans, tilts, zooms) to follow the clown works on pre-rendered art (a 360 render per spot, colour plus depth, so the clown hides behind things); a camera that travels behind him needs a real 3D background. Waiting on the owner: 2.5D turning camera, or real-time 3D Mirror World.
- Owner decision, 21 Nov 23:48: Mirror World is 2.5D with the turning camera. Each arena is one 360 Blender render (colour plus depth) seen from one fixed spot; the camera turns, tilts and zooms to keep the clown in full view; the clown and the enemies are 3D. No first-person or over-the-shoulder third-person camera anywhere in the game.

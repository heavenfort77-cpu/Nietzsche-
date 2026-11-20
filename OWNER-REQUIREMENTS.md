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


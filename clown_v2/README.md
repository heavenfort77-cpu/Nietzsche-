# Clown v2: rigged, textured clown (build plan steps 1–3)

Status: **sample, waiting for approval.** The approved 87-part clown (`renders3d/clown.glb`, `.blend`) is untouched; this is a new file set.

## What changed from the approved clown (needs your OK)

- **Bind pose.** A rig needs the arms and legs free, so the build pose differs from the approved off-stage pose: legs 1.1 units further apart (they overlapped and would have fused), arms in an A-pose with an elbow, hands open instead of clasped. The approved clasped pose is now the `idle` clip.
- **Eyelids** are baked with the palette's SKIN_LID ramp (listed in the study for eyelids). With plain SKIN they disappear once the face is a flat texture.
- **Three new expressions**: smile, startle, wince. They are new art; `sad` is the approved face.
- **Faded smile paint**: the approved two pink cheek dots read as pimples, so they are now one faint painted-smile arc under the real frown (same idea as the approved design note, "faded painted smile over a real frown"). `CONFIG['smile_paint'] = 'dots'` in `s2_build.py` brings the dots back. Before and after: `out/smile_paint_before_after.jpg`; old atlas kept as `out/face_atlas_dots_approved.png`.
- **Route.** The research plan said voxel remesh + decimate. Measured result: 380k → 22k triangles, but the unwrap split into 1,717 UV islands (seams everywhere, much of the atlas wasted). The final route keeps the approved primitives as separate shells inside one mesh, cuts length loops into limbs, deletes 3,094 faces buried inside other parts, and packs the primitives' own UVs (206 islands, no overlaps).

## Numbers

| Item | Value | Budget |
|---|---|---|
| Triangles | 12,688 body + 2,208 head = 14,896 | desktop 20–30k, phone 10–15k |
| Draw calls in three.js | 2 (body, face) | ≤ 3 with the hull (step 4) |
| Textures | body 1024² PNG; face atlas 1024² (2×2 cells of 512) | face 512² in the plan: the atlas holds 4 faces at 512 each |
| Bones | 21 deform bones, ≤ 4 influences per vertex | 20–30 |
| Clips | idle 2.0 s, walk 0.967 s (plate: 12 × 0.083 = 0.996), slap 1.200 s (plate: 11 × 0.112 = 1.232) | walk and slap sample to whole frames at 30 fps, so they land within one frame of the plate |
| GLB | 2,067 KB uncompressed | ≤ 800 KB desktop after KTX2 + meshopt (step 9) |

## Using it in three.js

- Bone names use underscores (`hand_R`), because three.js strips dots from node names.
- Face expression: `faceMaterial.map.offset.set(u, v)`, with sad (0, 0), smile (0.5, 0), startle (0, −0.5), wince (0.5, −0.5).
- Character faces +Z, 1.79 m tall, feet at y = 0. Walk is in place; move the character in code.

## Files

| Path | What |
|---|---|
| `s2_build.py` | Tagged bind-pose source from the approved builder (`build.py` + `render3d.py`). CONFIG at the top. |
| `s2_shell.py` | Join parts, cull hidden faces, UVs, bakes, palette-ramp paint, face atlas. |
| `s3_rig.py` | Armature, weights from part tags, idle/walk/slap clips, GLB export. Pose keys and slap table at the top. |
| `s3_check.py` | Rest = bind, edge stretch, nothing floats free; `--sheet` renders pose sheets and GIFs. |
| `render_check.py` | Renders any .blend with the approved stage lights for side-by-side checks. |
| `probe/probe_bpy.py`, `web/probe.html` | Step 1 toolchain probe. |
| `web/check_clown.html`, `web/run_page.mjs` | three.js r187 load/play/draw-call check, headless Chrome. |
| `out/clown_v2.glb` | The deliverable. |
| `out/rigged.blend`, `low.blend`, `high.blend` | Rigged source, textured unrigged, tagged high source. |
| `out/body_1024.png`, `face_atlas.png` | Painted textures; `body_col/ao/emi.png` are the raw bakes. |
| `out/pose_sheet_*.jpg`, `*.gif` | Clip renders. `chk/compare_sheet.jpg`: approved (top left, top middle) vs v2. |
| `check_model.py`, `check_glb.py` | Standing gates on the rigged .blend and on the GLB (each bug found became a gate). |
| `mut_apply.py`, `mutate_all.py` | Mutation run: breaks each rule in a copy and requires its gate to fail; then re-checks the real build. |
| `CREDITS.md` | Licences; add an entry with every third-party item. |
| `BUILD-LOG.md` | Every check and mutation result. |

Run order (needs `pip install bpy`, Blender 5.3): `python3 -I s2_build.py out`, `python3 -I s2_shell.py out`, `python3 -I s3_rig.py out`, `python3 -I s3_check.py out --sheet`, then `python3 -I mutate_all.py` (all gates plus mutations, under 1 minute). About 4 minutes on 2 CPU cores.

## Open

- Thin seam lines show along some sleeve UV edges in close renders.
- Not checked on a real phone or a real GPU; headless Chrome used software rendering.
- The CDN import map was not testable here (no outside network); the local files load. The release zip bundles them anyway.
- Hull outlines, ramp shader and Mirror lighting are step 4.

# Step 4: shader, outlines, stage and Mirror light

Superseded by the game page `web/game/index.html`, which carries the same shader and outline code. Originally `step4/viewer/index.html`, a single-file page (game-code-clean rules: one style and one script block, MAP, frozen CONFIG with a comment above each value, test hook on `?test`). It loads `out/` copies from `step4/viewer/assets/` and a bundled three.js r187 from `step4/viewer/lib/`. `index_cdn.html` is the same page loading three.js from jsDelivr, for hosting as a page.

- **Shader** (`toonVert` / `toonFrag`): skinned; half-Lambert into two soft bands; the shadow side takes a chosen colour (`shadow`), not grey; fill light; rim from behind (directional, so only edges facing it catch); hard glint only where `_SPEC` = 1 (nose, buttons, shoes).
- **Light values** are the style study's, divided by the stage key strength 3.2. Mirror adds a cold grade (`gradeAmt` 0.6 toward M_PALE), the plan's cold LUT done in the shader: without it a warm-white shirt under cold light stays warm (measured hue 35).
- **Face paint layer**: base cells have no paint; `face_paint.png` holds the paint per expression (eyes cut it). Uniforms `uPaintAmt` (0–1) and `uFlake` (0–1, noise flakes) drive Mask and the final night's flaking.
- **Outline**: body + head merged into one skinned inverted hull, 6 mm, on the body's skeleton: 3 draw calls in all. Stage outline colour (#1E1714) is almost the stage backdrop (#1E1418), so the outer edge only shows against lit things; the inner lines (ruff, hands, hat) show everywhere.
- **Controls**: buttons for world, clip, face; paint and flake sliders; outline toggle; drag to turn; keys 1–3, M, arrows. FPS counter top left.
- Checks: `node check_step4.mjs viewer`, `node mutate_step4.mjs`, `node check-static.cjs viewer/index.html`, `node check-runtime.cjs viewer/index.html out 4` (needs `npm i puppeteer-core playwright-core acorn acorn-walk`; uses /usr/bin/google-chrome). Results in `BUILD-LOG.md`.

# Step 5: the ring (see `ring/s5_ring.py` and `web/game/index.html`)

- **Set:** procedural big top in the approved palette (sawdust ring floor with confetti, crimson and white curb with gold trim, five tiers of benches with aisles, striped tent wall and roof, two king poles, bunting, the entrance drapes in a gold arch, pedestals, ladder, prop cart). One mesh, about 11,000 triangles, one 2048² atlas: light baked at 1024² (spotlight #FBD190, bulb glow, dim tent) and blurred, times colour at 2048².
- **Live:** shadow-only spotlight onto a shadow plane on the ring floor, a soft blob shadow, an additive light cone with drifting dust, fog in the backdrop colour, 411 crowd cards (8 silhouettes from behind, rim lit, bobbing by an excitement value; 0 freezes the house), 2,500 confetti pieces (fall, spin, lie flat when landed, never below the floor), 220 sparkles, 264 bulbs, bloom on HDR only, N8AO, vignette, grain, AgX, SMAA.
- **Camera** behind the back rows on the near side, an aisle on the camera line. The clown's key light dims outside the spotlight pool.
- **Budget (desktop, measured headless):** 46 draw calls per frame all passes (gate 150), about 90,000 triangles.

## Ring density pass (desktop first; the phone tier is dialled down from it in step 9)

- Top layer: the spotlight's lamp, two trapezes (bars at about 5–6 m, in the desktop frame), a rope ladder, three garlands of bunting and bulbs across the ring between the king poles.
- Midground: a hoop stand and striped barrels on the far side.
- Ground: 1,600 straw pieces and 500 peanut shells, instanced, lit to match the baked spotlight pool.
- Crowd: 515 figures (seat spacing 0.44 m), 12 silhouette variants at 256 × 384 (adults, children, bowler, top hat, bun, pigtails, raised arm), each with its own shade.
- Desktop: 48 draw calls per frame, about 136,000 triangles. Gate: crowd ≥ 500, scatter ≥ 2,000, confetti ≥ 2,500, bulbs ≥ 250.

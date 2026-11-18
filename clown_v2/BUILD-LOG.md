# Clown v2 build log (steps 1-3), 18 Nov 2026

Checks: 82 of 82 pass (includes 16 mutation checks, each passing only if its gate fired on the broken copy).

Bugs found this session and the gate that now guards each:
- Head scaled about the origin floated 1.4 m above the body -> "head sits on its bone".
- Bake step left the body hidden from render -> "every mesh visible".
- Idle head tipped back instead of down (sign error) -> "idle: head tipped forward".
- three.js strips dots from node names (hand.R -> handR) -> "bone names have no dots", "node names have no dots".
- Deformation check measured "rest" from a leftover pose -> "rest pose = bind mesh" (resets bones first).
- Probe bake gate compared linear values with an sRGB image (check bug, fixed).
- Voxel remesh route split UVs into 1,717 islands -> route replaced; "body UVs: no overlaps" stays.

## Step 1 toolchain (Blender side)

- PASS bpy version | 5.3.0
- PASS glTF exporter params | 9 present
- PASS export_animation_mode has ACTIONS | ['ACTIONS', 'ACTIVE_ACTIONS', 'BROADCAST', 'NLA_TRACKS', 'SCENE']
- PASS Cycles GPU devices | none (CPU only)
- PASS Cycles DIFFUSE colour bake 512 CPU | 0.3s red_px=155361 white_px=7010
- PASS Cycles AO bake 512 CPU 64spp | 4.8s
- PASS ARMATURE_AUTO weights in background | 2912/2912 weighted
- PASS Scripted keyframes on 5.x actions (NLA stash) | slots_api=False
- PASS GLB export ACTIONS mode: one animation per action | ['bend', 'twist']
- PASS GLB has skin | 1
- PASS Voxel remesh + decimate modifiers | 23154 faces -> 4630 tris in 0.6s

## Step 2 build gates

- PASS body: parts joined, hidden faces removed | 92 parts, 18416 tris before, 3094 hidden faces removed, 12688 tris, 0.8s
- PASS body UVs: no overlaps | 0 overlapping faces, 206 islands
- PASS head UV: one island | 1 islands
- PASS body bakes (colour, AO, edge/top/noise) | 1.4s / 33.9s / 0.5s
- PASS body regions: every part ramp present in the atlas | {'HAT': 233735, 'OCHRE': 163790, 'PAINT': 99998, 'RED': 9136, 'RUST_DARK': 37639, 'RUST_HAIR': 71346, 'SHOE': 44776, 'SKIN': 56350, 'WARM_WHITE': 331806}
- PASS face bake sad | 0.7s, feature texels 50547
- PASS face bake smile | 0.8s, feature texels 47581
- PASS face bake startle | 0.7s, feature texels 48378
- PASS face bake wince | 0.7s, feature texels 48268
- PASS triangles <= 30k (body + head) | 12688 + 2208 = 14896
- PASS materials (= draw calls before hull) <= 2 | ['body', 'face']
- PASS total time | 66s

## Step 3 rig/export gates

- PASS armature | 21 deform bones
- PASS weights: every vertex weighted, <= 4 influences | unweighted 0, max influences 4
- PASS GLB: 3 clips, durations = photographs x interval | {'idle': 2, 'slap': 1.2, 'walk': 0.967} expected {'idle': 2.0, 'walk': 0.996, 'slap': 1.232}
- PASS GLB size | 2067 KB, skins 1, meshes 2

## Model gates (check_model.py)

- PASS bone names have no dots
- PASS every mesh visible
- PASS every vertex weighted (sum 1) | 0 vertices off
- PASS <= 4 influences per vertex | 4
- PASS coordinates finite
- PASS height 1.7-1.9 m | 1.791 m
- PASS feet on the floor (z = 0) | min z -0.0060
- PASS no degenerate faces
- PASS head sits on its bone | 0.0 cm from the head bone
- PASS materials <= 2 | 2
- PASS body UVs: no overlaps | 0 faces
- PASS head UV: one island | 1
- PASS head UVs inside cell 0 (u 0..0.5, v 0.5..1) | u 0.000..0.500 v 0.500..1.000
- PASS the 4 face cells all differ | smallest mean difference 8.8

## GLB gates (check_glb.py)

- PASS clips are idle, walk, slap | ['idle', 'slap', 'walk']
- PASS clip lengths match the plates (within 1 frame) | {'idle': 2, 'slap': 1.2, 'walk': 0.967}
- PASS one skin | 1
- PASS two meshes (body, face) | 2
- PASS node names have no dots
- PASS at most 4 joints per vertex (no JOINTS_1)
- PASS file <= 4096 KB before compression | 2067 KB
- PASS animation channels target real nodes

## Deformation gates (s3_check.py)

- PASS rest pose = bind mesh | max 0.000 mm
- PASS idle: edge stretch p99.9 <= 1.6 | p99.9 1.53, max 1.70 on part [chest,clavicle_R,upper_arm_R,forearm_R]
- PASS idle: head tipped forward (looks down) on every sample | least forward lean y = -0.20
- PASS idle: nothing floats free (part groups stay 4) | max groups 4; parts with no contact: []
- PASS walk: edge stretch p99.9 <= 1.6 | p99.9 1.55, max 1.76 on part [chest,clavicle_R,upper_arm_R,forearm_R]
- PASS walk: nothing floats free (part groups stay 4) | max groups 4; parts with no contact: []
- PASS slap: edge stretch p99.9 <= 1.6 | p99.9 1.46, max 1.71 on part [chest,clavicle_R,upper_arm_R,forearm_R]
- PASS slap: nothing floats free (part groups stay 4) | max groups 4; parts with no contact: []

## Browser, three.js r187 (check_clown.html)

- PASS GLB loads: 2 skinned meshes | skinned 2, triangles 14896
- PASS clips idle, slap, walk | idle 2.000s, slap 1.200s, walk 0.967s
- PASS clip idle plays (right hand moves, no NaN) | hand moved up to 1.1 cm
- PASS clip slap plays (right hand moves, no NaN) | hand moved up to 32.4 cm
- PASS clip walk plays (right hand moves, no NaN) | hand moved up to 41.9 cm
- PASS draw calls <= 3 (body, face; hull not added yet) | calls 2, triangles 14896
- PASS face cell swap changes the face (texture.offset) | sad 0.0, smile 9.2, startle 22.9, wince 10.6

## Mutation run (mutate_all.py): each rule broken on purpose must FAIL its gate

- PASS mutation unweighted -> model gate "every vertex weighted" fires | FAIL every vertex weighted (sum 1) | 50 vertices off
- PASS mutation influence5 -> model gate "influences per vertex" fires | FAIL <= 4 influences per vertex | 5
- PASS mutation uvoverlap -> model gate "body UVs: no overlaps" fires | FAIL body UVs: no overlaps | 2 faces
- PASS mutation headfloat -> model gate "head sits on its bone" fires | FAIL head sits on its bone | 110.6 cm from the head bone
- PASS mutation hidden -> model gate "every mesh visible" fires | FAIL every mesh visible | ['body']
- PASS mutation dotname -> model gate "bone names have no dots" fires | FAIL bone names have no dots | ['hand.R']
- PASS mutation dotname -> glb gate "node names have no dots" fires | FAIL node names have no dots | ['hand.R']
- PASS mutation drawcalls -> model gate "materials <=" fires | FAIL materials <= 2 | 4
- PASS mutation drawcalls -> web gate "draw calls <= 3" fires | FAIL draw calls <= 3 (body, face; hull not added yet) | calls 4, triangles 14896
- PASS mutation faceswap -> model gate "the 4 face cells all differ" fires | FAIL the 4 face cells all differ | smallest mean difference 0.0
- PASS mutation faceswap -> web gate "face cell swap changes the face" fires | FAIL face cell swap changes the face (texture.offset) | sad 0.0, smile 0.0, startle 0.0, wince 0.0
- PASS mutation badbind -> deform:idle gate "rest pose = bind mesh" fires | FAIL rest pose = bind mesh | max 33.290 mm
- PASS mutation floating -> deform:slap gate "slap: nothing floats free" fires | FAIL slap: nothing floats free (part groups stay 4) | max groups 5; parts with no contact: []
- PASS mutation stretch -> deform:walk gate "walk: edge stretch" fires | FAIL walk: edge stretch p99.9 <= 1.6 | p99.9 19.81, max 22.83 on part [hips,thigh_L,shin_L]
- PASS mutation headup -> deform:idle gate "idle: head tipped forward" fires | FAIL idle: head tipped forward (looks down) on every sample | least forward lean y = 0.28
- PASS mutation walklen -> glb gate "clip lengths match the plates" fires | FAIL clip lengths match the plates (within 1 frame) | {'walk': (0.8, 0.996)}
- PASS real build: 37 of 37 gates pass
- PASS real build files unchanged by the mutation run (sha256)

# Step 4: shader, outlines, stage and Mirror light (18 Nov 2026)

## Static code check (game-code-clean check-static)

- RESULT PASS  fails=0 warns=0

## Step 4 gates (check_step4.mjs)

- PASS draw calls <= 3 with the outline | calls 3, triangles 33780
- PASS outline bound to the body skeleton
- PASS blouse found in albedo render | 6273 pixels
- PASS stage: blouse hue 20-70 | hue 32, sat 0.12, value 0.77
- PASS stage: blouse readable (value >= 0.55) | 0.77
- PASS mirror: blouse hue 170-250 | hue 187, sat 0.06, value 0.70
- PASS mirror: blouse readable (value >= 0.55) | 0.70
- PASS shine shows, never on the blouse | 27 pixels shine, 0 on the blouse
- PASS paint amount changes the face | 189 pixels
- PASS flake 0.5 removes 0.25-0.75 of the paint | 0.67
- PASS outline stays on the body: idle 0.5s | 0 of 23951 outline pixels outside
- PASS outline stays on the body: walk 0.25s | 0 of 25890 outline pixels outside
- PASS outline stays on the body: walk 0.75s | 0 of 25885 outline pixels outside
- PASS outline stays on the body: slap 0.45s | 0 of 22951 outline pixels outside
- PASS restart x2 via newRun
- PASS no page or console errors
- RESULT 16 of 16 pass

## Step 4 mutations (mutate_step4.mjs)

- PASS mutation statichull -> "outline stays on the body: walk 0.25s" fires | FAIL outline stays on the body: walk 0.25s | 482 of 26540 outline pixels outside
- PASS mutation unbound -> "outline bound to the body skeleton" fires | FAIL outline bound to the body skeleton
- PASS mutation warmmirror -> "mirror: blouse hue" fires | FAIL mirror: blouse hue 170-250 | hue 161, sat 0.03, value 0.69
- PASS mutation darkmirror -> "mirror: blouse readable" fires | FAIL mirror: blouse readable (value >= 0.55) | 0.41
- PASS mutation speceverywhere -> "shine shows, never on the blouse" fires | FAIL shine shows, never on the blouse | 459 pixels shine, 194 on the blouse
- PASS mutation paintignored -> "paint amount changes the face" fires | FAIL paint amount changes the face | 0 pixels
- PASS mutation noflake -> "flake 0.5 removes" fires | FAIL flake 0.5 removes 0.25-0.75 of the paint | 0.00
- PASS mutation extradraw -> "draw calls <= 3" fires | FAIL draw calls <= 3 with the outline | calls 4, triangles 50670
- PASS real page: RESULT 16 of 16 pass
- RESULT mutations 8 of 8 fired

## Runtime, 4 screen sizes (check-runtime)

- [phone-portrait] 390x844  canvases=[{"w":585,"h":1032,"cw":390,"ch":688}]  headless-fps=12  restart x2 via __game.newRun()  shot=/tmp/rt/phone-portrait.png
- [phone-landscape] 844x390  canvases=[{"w":1266,"h":426,"cw":844,"ch":284}]  headless-fps=14  restart x2 via __game.newRun()  shot=/tmp/rt/phone-landscape.png
- [laptop] 1366x768  canvases=[{"w":1366,"h":712,"cw":1366,"ch":712}]  headless-fps=12  restart x2 via __game.newRun()  shot=/tmp/rt/laptop.png
- [ultrawide] 2560x1080  canvases=[{"w":2560,"h":1024,"cw":2560,"ch":1024}]  headless-fps=9  restart x2 via __game.newRun()  shot=/tmp/rt/ultrawide.png
- RESULT PASS  fails=0

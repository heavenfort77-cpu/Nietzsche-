# The Clown and the Mirror: build and checks

Private build repo for the jam game. GitHub Actions (`.github/workflows/clown.yml`) runs the clown v2 pipeline and every check on each push to `main`, then commits reports, renders and the GLB to branch `ci-out/run-<n>`.

- `art/3_blender_3d/`: the approved art scripts (build.py, render3d.py, palette.py).
- `clown_v2/`: steps 1-3 (Blender: tagged source, textured mesh, rig, clips) and their gates and mutation run. See `clown_v2/README.md`.
- `ring/`: step 5 ring set (Blender: built, lit and baked into one atlas; seat and bulb layout; crowd cards).
- `web/game/index.html`: the game page (clown shader and outline from step 4, the ring scene from step 5, post effects) and the browser checks: `check_step4.mjs`, `check_step5.mjs`, their `mutate_*.mjs`, `check-static.cjs`, `check-runtime.cjs`.

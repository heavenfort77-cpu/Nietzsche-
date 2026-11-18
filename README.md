# The Clown and the Mirror: build and checks

Private build repo for the jam game. GitHub Actions (`.github/workflows/clown.yml`) runs the clown v2 pipeline and every check on each push to `main`, then commits reports, renders and the GLB to branch `ci-out/run-<n>`.

- `art/3_blender_3d/`: the approved art scripts (build.py, render3d.py, palette.py).
- `clown_v2/`: steps 1-3 (Blender: tagged source, textured mesh, rig, clips) and their gates and mutation run. See `clown_v2/README.md`.
- `web/`: step 4 viewer (`web/viewer/index.html`) and the browser checks.

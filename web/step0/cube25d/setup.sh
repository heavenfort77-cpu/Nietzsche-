#!/usr/bin/env bash
# Puts three.js and the clown assets where web/step0/cue_model.html and walk.html load them (lib/ and assets/ are not committed).
# The room plates (cube25d/*.webp, views.json) are committed; rebuild them with build_cube.py then plates.py.
# Usage: bash web/step0/cube25d/setup.sh [ci-out branch with the clown GLB, default ci-out/run-18]
set -euo pipefail
cd "$(dirname "$0")/../../.."
BR=${1:-ci-out/run-18}
S=web/step0
T=$(mktemp -d)
npm install --silent --prefix "$T" three@0.187.0
mkdir -p $S/lib/build $S/lib/examples/jsm/loaders $S/lib/examples/jsm/utils $S/assets
N=$T/node_modules/three
cp $N/build/three.module.js $N/build/three.core.js $S/lib/build/
cp $N/examples/jsm/loaders/GLTFLoader.js $S/lib/examples/jsm/loaders/
cp $N/examples/jsm/utils/BufferGeometryUtils.js $N/examples/jsm/utils/SkeletonUtils.js $S/lib/examples/jsm/utils/
git fetch -q --depth=1 origin "$BR"
for f in clown_v2.glb face_atlas.png face_paint.png; do git show "FETCH_HEAD:out/$f" > $S/assets/$f; done
# walk.html: the v2 whiteface and Performer (waiting on approval) stand in for the performers in the wings
for c in whiteface performer; do
  mkdir -p $S/assets/$c
  for f in clown_v2.glb face_atlas.png face_paint.png; do git show "FETCH_HEAD:cast_$c/$c/$f" > $S/assets/$c/$f; done
done
rm -rf "$T"
echo "ready: serve web/step0/ and open cue_model.html or walk.html"

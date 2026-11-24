#!/usr/bin/env bash
# Puts three.js and the clown assets where web/step0/cue_model.html and walk.html load them (lib/ and assets/ are not committed).
# The room plates (cube25d/*.webp, views.json) are committed; rebuild them with build_cube.py then plates.py.
# Usage: bash web/step0/cube25d/setup.sh [ci-out branch with the clown GLB, default ci-out/run-32 (F17 clips)]
set -euo pipefail
cd "$(dirname "$0")/../../.."
BR=${1:-ci-out/run-32}
S=web/step0
T=$(mktemp -d)
npm install --silent --prefix "$T" three@0.187.0
mkdir -p $S/lib/build $S/lib/examples/jsm/loaders $S/lib/examples/jsm/utils $S/assets
N=$T/node_modules/three
cp $N/build/three.module.js $N/build/three.core.js $S/lib/build/
cp $N/examples/jsm/loaders/GLTFLoader.js $S/lib/examples/jsm/loaders/
cp $N/examples/jsm/utils/BufferGeometryUtils.js $N/examples/jsm/utils/SkeletonUtils.js $S/lib/examples/jsm/utils/
# session 32: compressed cast GLBs (meshopt geometry, KTX2 ETC1S textures): KTX2Loader with its parts, the meshopt decoder, the Basis transcoder
mkdir -p $S/lib/examples/jsm/libs $S/lib/examples/jsm/math $S/assets/basis
cp $N/examples/jsm/loaders/KTX2Loader.js $S/lib/examples/jsm/loaders/
cp $N/examples/jsm/utils/WorkerPool.js $S/lib/examples/jsm/utils/
cp $N/examples/jsm/libs/ktx-parse.module.js $N/examples/jsm/libs/zstddec.module.js $N/examples/jsm/libs/meshopt_decoder.module.js $S/lib/examples/jsm/libs/
cp $N/examples/jsm/math/ColorSpaces.js $S/lib/examples/jsm/math/
cp $N/examples/jsm/libs/basis/basis_transcoder.js $N/examples/jsm/libs/basis/basis_transcoder.wasm $S/assets/basis/
git fetch -q --depth=1 origin "$BR"
for f in clown_v2.glb face_atlas.png face_paint.png; do git show "FETCH_HEAD:out/$f" > $S/assets/$f; done
# walk.html: the v2 whiteface and Performer (waiting on approval) stand in for the performers in the wings
for c in whiteface performer; do
  mkdir -p $S/assets/$c
  for f in clown_v2.glb face_atlas.png face_paint.png; do git show "FETCH_HEAD:cast_$c/$c/$f" > $S/assets/$c/$f; done
done
# night1.html: the night-1 crew and the Mirror constructs, the approved v2 figures compressed for the web (session 32; sources art/cast2/v2/*_v2.glb)
mkdir -p $S/assets/cast2
rm -f $S/assets/cast2/*.glb
cp art/cast2/v2/web/*.glb $S/assets/cast2/
rm -rf "$T"
echo "ready: serve web/step0/ and open night1.html, cue_model.html or walk.html"

#!/usr/bin/env bash
# Put three.js, postprocessing, N8AO and the built assets where the game page loads them (CI jobs web and perf).
set -euo pipefail
cd "$(dirname "$0")"
npm install --silent
L=game/lib
mkdir -p $L/build $L/examples/jsm/loaders $L/examples/jsm/utils $L/examples/jsm/postprocessing $L/postprocessing $L/n8ao game/assets
cp node_modules/three/build/three.module.js node_modules/three/build/three.core.js $L/build/
cp node_modules/three/examples/jsm/loaders/GLTFLoader.js $L/examples/jsm/loaders/
cp node_modules/three/examples/jsm/utils/BufferGeometryUtils.js node_modules/three/examples/jsm/utils/SkeletonUtils.js $L/examples/jsm/utils/
cp node_modules/three/examples/jsm/postprocessing/Pass.js $L/examples/jsm/postprocessing/
cp node_modules/postprocessing/build/index.js $L/postprocessing/
cp node_modules/n8ao/dist/N8AO.js $L/n8ao/
cp ../clown_v2/out/clown_v2.glb ../clown_v2/out/face_atlas.png ../clown_v2/out/face_paint.png game/assets/
cp ../ring_out/ring_set.glb ../ring_out/ring_layout.json ../ring_out/crowd_cards.png game/assets/

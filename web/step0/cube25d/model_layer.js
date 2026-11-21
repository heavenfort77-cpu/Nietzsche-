// 2.5D layer for the cue prototype: the approved clown GLB (3D, toon shader and outline from the game page)
// standing in Blender-rendered 2D plates of the shared cube room (back, mid, front planes; parallax from small camera moves).
// window.__model is read by the cue script: frame(pose, view) renders and writes the face position into view.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ===== CONFIG =====
const CFG = Object.freeze({
  // assets next to the page
  glb: './assets/clown_v2.glb', face: './assets/face_atlas.png', paint: './assets/face_paint.png', views: './cube25d/views.json', plates: './cube25d/',
  // widest horizontal field of view before the vertical one shrinks (render covers 74 deg at 16:9), degrees
  hfovMax: 70,
  // pixel ratio cap (performance rule: 1.25)
  dprMax: 1.25,
  // idle camera drift for parallax, metres (sideways, up)
  driftX: 0.03, driftY: 0.012,
  // extra camera move from the mouse on desktop, metres (sideways, up)
  pointerX: 0.05, pointerY: 0.02,
  // how fast the camera follows the mouse (per second)
  follow: 4,
  // face radius used for the cue target, metres (head mesh is 0.24 half width)
  faceR: 0.2,
  // face centre in the GLB rest pose (three.js axes), metres: the nose, 0.12 under the head mesh middle (head mesh 1.17-1.65)
  faceCentre: [0, 1.29, 0.1],
  // blob shadow radius under the clown, metres, and its darkness
  blobR: 0.45, blobA: 0.45,
  // face paint amount: start, gain per Mask point, max
  paintStart: 0.4, paintPerMask: 0.06, paintMax: 1,
  // turn fade time between views, ms
  fadeMs: 140,
  // toon light values: the game page's stage world (look unchanged)
  keyDir: [-0.55, 0.75, 0.6], key: [1.0, 0.86, 0.66], fillDir: [0.8, 0.2, 0.5], fill: [0.55 * 0.22, 0.45 * 0.22, 0.45 * 0.22],
  rim: [0.69, 0.552, 0.414], rimDir: [0.2, 0.5, -0.9], shadow: [0.46, 0.36, 0.42], outline: '#1E1714', outlineThick: 0.006,
  band1: 0.42, band2: 0.68, soft: 0.04, rimPow: 2.0, specPow: 60.0, specCut: 0.5, flakeScale: 90.0,
  // face cells in the 2x2 atlas, uv offset from the sad cell (atlas rows run down: the game page's -0.5 samples off the atlas)
  faces: { sad: [0, 0], smile: [0.5, 0], startle: [0, 0.5], wince: [0.5, 0.5] },
  // view order when turning (Myst style, right turns clockwise seen from above)
  order: ['ring', 'dressing', 'mirror', 'exit'],
});

const M = window.__model = { parts: null, ready: false, looking: false, viewName: 'ring', error: '', showCrowd() { return this.viewName === 'ring'; } };
const stateEl = document.getElementById('modelState');
function say(t) { if (stateEl) stateEl.textContent = t; }

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1E1418');
const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 30);
camera.rotation.order = 'YXZ';
const base = new THREE.Vector3();
const shared = {
  uKeyDir: { value: new THREE.Vector3() }, uKeyCol: { value: new THREE.Color().fromArray(CFG.key) }, uFillDir: { value: new THREE.Vector3() },
  uFillCol: { value: new THREE.Color().fromArray(CFG.fill) }, uRimCol: { value: new THREE.Color().fromArray(CFG.rim) },
  uShadow: { value: new THREE.Color().fromArray(CFG.shadow) }, uRimDir: { value: new THREE.Vector3() },
  uGradeTint: { value: new THREE.Color(1, 1, 1) }, uGradeAmt: { value: 0 }, uSpecOn: { value: 1 }, uMode: { value: 0 }, uTime: { value: 0 },
};
const keyW = new THREE.Vector3().fromArray(CFG.keyDir).normalize();
const fillW = new THREE.Vector3().fromArray(CFG.fillDir).normalize();
const rimW = new THREE.Vector3().fromArray(CFG.rimDir).normalize();
const parts = { root: null, body: null, face: null, hull: null, mixer: null, idle: null, slap: null, anchor: null, blob: null, rigs: {}, data: null };
// reused every frame (no per-frame allocation)
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
let lastT = 0, px = 0, py = 0, sx = 0, sy = 0, wasSnap = false, sizeW = 0, sizeH = 0, faceNow = '';

function shaderText(id) { return document.getElementById(id).textContent; }
function makeToon(map, paint) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uMap: { value: map }, uPaint: { value: paint || map }, uHasPaint: { value: paint ? 1 : 0 }, uCell: { value: new THREE.Vector2() },
    uPaintAmt: { value: 1 }, uFlake: { value: 0 }, uFlakeScale: { value: CFG.flakeScale }, uBand1: { value: CFG.band1 }, uBand2: { value: CFG.band2 },
    uSoft: { value: CFG.soft }, uRimPow: { value: CFG.rimPow }, uSpecPow: { value: CFG.specPow }, uSpecCut: { value: CFG.specCut },
  }]);
  Object.assign(uniforms, shared);
  return new THREE.ShaderMaterial({ uniforms, vertexShader: shaderText('toonVert'), fragmentShader: shaderText('toonFrag'), fog: true });
}
function makeHull(body, face) {
  const strip = (g) => { const c = g.clone(); for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'skinIndex', 'skinWeight'].includes(k)) c.deleteAttribute(k); return c; };
  const geo = mergeGeometries([strip(body.geometry), strip(face.geometry)], false);
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uThick: { value: CFG.outlineThick }, uColor: { value: new THREE.Color(CFG.outline) } }]),
    vertexShader: shaderText('hullVert'), fragmentShader: shaderText('hullFrag'), side: THREE.BackSide, fog: true,
  });
  const hull = new THREE.SkinnedMesh(geo, mat);
  hull.bind(body.skeleton, body.bindMatrix);
  hull.computeBoundingSphere(); hull.boundingSphere.radius *= 1.3;
  hull.position.copy(body.position); hull.quaternion.copy(body.quaternion); hull.scale.copy(body.scale);
  return hull;
}
function loadTex(loader, url, flipY) {
  return loader.loadAsync(url).then((t) => { t.flipY = flipY; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t; });
}

// one rig per cube view: the render camera's pose, with each layer as a plane that exactly covers the render frustum
function makeRig(name, v, tex, cfg) {
  const rig = new THREE.Group();
  rig.position.set(0, cfg.camZ, 0);
  rig.rotation.order = 'YXZ';
  rig.rotation.set(THREE.MathUtils.degToRad(cfg.pitch), THREE.MathUtils.degToRad(v.yaw), 0);
  const aspect = cfg.res[0] / cfg.res[1], t = Math.tan(THREE.MathUtils.degToRad(cfg.renderFov) / 2);
  ['back', 'mid', 'front'].forEach((layer, i) => {
    const d = cfg.planeDepth[layer], h = 2 * d * t;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h), new THREE.MeshBasicMaterial({
      map: tex[i], transparent: layer !== 'back', depthWrite: layer === 'back', toneMapped: false,
    }));
    m.position.z = -d;
    rig.add(m);
  });
  rig.visible = false;
  scene.add(rig);
  return rig;
}

async function load() {
  say('Loading the clown model and the room plates...');
  const tl = new THREE.TextureLoader();
  const data = await (await fetch(CFG.views)).json();
  const plate = (f) => tl.loadAsync(CFG.plates + f.replace('.png', '.webp')).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
  });
  const names = CFG.order;
  const [gltf, face, paint, ...plates] = await Promise.all([
    new GLTFLoader().loadAsync(CFG.glb), loadTex(tl, CFG.face, false), loadTex(tl, CFG.paint, false),
    ...names.flatMap((n) => ['back', 'mid', 'front'].map((l) => plate(data.views[n].files[l]))),
  ]);
  const cfg = data.config;
  parts.data = cfg;
  names.forEach((n, i) => { parts.rigs[n] = makeRig(n, data.views[n], plates.slice(i * 3, i * 3 + 3), cfg); });

  parts.root = gltf.scene;
  parts.root.traverse((o) => { if (o.isSkinnedMesh) { if (o.material.name === 'face') parts.face = o; else parts.body = o; } });
  parts.body.material = makeToon(parts.body.material.map, null);
  parts.face.material = makeToon(face, paint);
  parts.hull = makeHull(parts.body, parts.face);
  parts.body.parent.add(parts.hull);
  // Blender (x, y) on the floor -> three (x, -y)
  parts.root.position.set(cfg.clownAt[0], 0, -cfg.clownAt[1]);
  scene.add(parts.root);
  parts.mixer = new THREE.AnimationMixer(parts.root);
  const clip = (n) => gltf.animations.find((a) => a.name === n);
  parts.idle = parts.mixer.clipAction(clip('idle')).play();
  parts.slap = parts.mixer.clipAction(clip('slap'));
  parts.slap.setLoop(THREE.LoopOnce, 1); parts.slap.clampWhenFinished = false;
  parts.mixer.addEventListener('finished', (e) => { if (e.action === parts.slap) parts.idle.reset().fadeIn(0.15).play(); });

  // face anchor: an empty under the head bone at the face centre, so the cue follows the head as he moves
  parts.root.updateMatrixWorld(true);
  const head = parts.root.getObjectByName('head');
  parts.anchor = new THREE.Object3D();
  head.add(parts.anchor);
  head.updateMatrixWorld(true);
  parts.anchor.position.copy(head.worldToLocal(tmp.set(CFG.faceCentre[0], CFG.faceCentre[1], CFG.faceCentre[2]).add(parts.root.position)));

  parts.blob = new THREE.Mesh(new THREE.CircleGeometry(CFG.blobR, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: CFG.blobA, depthWrite: false }));
  parts.blob.rotation.x = -Math.PI / 2;
  parts.blob.position.set(parts.root.position.x, 0.004, parts.root.position.z);
  scene.add(parts.blob);

  // warm up: shaders and textures before the first frame
  setView('ring');
  renderer.compile(scene, camera);
  for (const t of [face, paint, ...plates]) renderer.initTexture(t);
  M.parts = parts; M.faces = CFG.faces;
  M.ready = true;
  say('Clown model and room loaded (2.5D: 3D clown, 2D room).');
}

function setView(name) {
  M.viewName = name;
  for (const n of CFG.order) parts.rigs[n].visible = n === name;
  const onRing = name === 'ring';
  parts.root.visible = onRing; parts.blob.visible = onRing;
  const cfg = parts.data, yaw = parts.data && THREE.MathUtils.degToRad(viewYaw(name));
  base.set(0, cfg.camZ, 0);
  camera.rotation.set(THREE.MathUtils.degToRad(cfg.pitch), yaw, 0);
  const el = document.getElementById('lookName');
  if (el) el.textContent = parts.rigs[name] ? titleOf(name) : name;
}
const YAW = { ring: 0, dressing: -90, mirror: 180, exit: 90 };
const TITLE = { ring: 'Ring', dressing: 'Dressing room', mirror: 'Mirror', exit: 'Tent exit' };
function viewYaw(n) { return YAW[n]; }
function titleOf(n) { return TITLE[n]; }

function fitCamera(w, h) {
  const aspect = w / h, cfg = parts.data;
  let fov = cfg.playFov;
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * aspect);
  const max = THREE.MathUtils.degToRad(CFG.hfovMax);
  if (hfov > max) fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(max / 2) / aspect));
  camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
}
M.resize = function (w, h) {
  if (!M.ready || (w === sizeW && h === sizeH)) return;
  sizeW = w; sizeH = h;
  renderer.setPixelRatio(Math.min(CFG.dprMax, window.devicePixelRatio || 1));
  renderer.setSize(w, h, false);
  fitCamera(w, h);
};

// pose: { scene, tilt, flip, miss, snap, mask }; view: cue view object (cx, cy, R, R0 are written here)
M.frame = function (t, pose, view) {
  M.resize(view.w, view.h);
  const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
  lastT = t;
  // parallax camera: idle drift plus mouse, sideways along the view, never rotating (the plates were rendered from one point)
  const k = Math.min(1, dt * CFG.follow);
  sx += (px - sx) * k; sy += (py - sy) * k;
  const ox = Math.sin(t * 0.0004) * CFG.driftX + sx * CFG.pointerX, oy = Math.cos(t * 0.00031) * CFG.driftY + sy * CFG.pointerY;
  const yaw = camera.rotation.y;
  camera.position.set(base.x + Math.cos(yaw) * ox, base.y + oy, base.z - Math.sin(yaw) * ox);
  camera.updateMatrixWorld();
  shared.uKeyDir.value.copy(keyW).transformDirection(camera.matrixWorldInverse);
  shared.uFillDir.value.copy(fillW).transformDirection(camera.matrixWorldInverse);
  shared.uRimDir.value.copy(rimW).transformDirection(camera.matrixWorldInverse);

  if (parts.root.visible) {
    // the 2D clown's moves on the real model: tilt about his feet, face cell, paint, slap on take
    parts.root.rotation.z = -pose.tilt;
    const face = pose.snap ? 'startle' : pose.miss ? 'wince' : pose.flip ? 'sad' : 'smile';
    if (face !== faceNow) { faceNow = face; parts.face.material.uniforms.uCell.value.fromArray(CFG.faces[face]); }
    parts.face.material.uniforms.uPaintAmt.value = Math.min(CFG.paintMax, CFG.paintStart + pose.mask * CFG.paintPerMask);
    if (pose.snap && !wasSnap) { parts.idle.fadeOut(0.1); parts.slap.reset().fadeIn(0.05).play(); }
    wasSnap = pose.snap;
    parts.mixer.update(dt);
    parts.root.updateMatrixWorld(true);
    // face centre on screen and its radius in CSS px: the cue ring closes onto his real face
    parts.anchor.getWorldPosition(tmp);
    tmp2.copy(tmp).applyMatrix4(camera.matrixWorldInverse);
    tmp.project(camera);
    view.cx = (tmp.x + 1) / 2 * view.w; view.cy = (1 - tmp.y) / 2 * view.h;
    const f = view.h / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    view.R = f * CFG.faceR / Math.max(0.1, -tmp2.z);
    view.R0 = Math.max(view.R * 1.3, Math.min(view.cx, view.cy, view.w - view.cx, view.h - view.cy) * 0.96);
  }
  renderer.render(scene, camera);
};

// ===== look around (Myst style fixed views) =====
const ui = { look: document.getElementById('look'), title: document.getElementById('title'), fade: document.getElementById('fade') };
let turning = false;
function turn(step) {
  if (turning || !M.ready) return;
  turning = true;
  ui.fade.style.opacity = 1;
  setTimeout(() => {
    const i = (CFG.order.indexOf(M.viewName) + step + CFG.order.length) % CFG.order.length;
    setView(CFG.order[i]);
    ui.fade.style.opacity = 0;
    setTimeout(() => { turning = false; }, CFG.fadeMs);
  }, CFG.fadeMs);
}
function openLook() { if (!M.ready) return; M.looking = true; ui.title.classList.add('hidden'); ui.look.classList.remove('hidden'); }
function closeLook() { M.looking = false; setView('ring'); ui.look.classList.add('hidden'); ui.title.classList.remove('hidden'); }
document.getElementById('btnLook').addEventListener('click', openLook);
document.getElementById('lookL').addEventListener('click', () => turn(-1));
document.getElementById('lookR').addEventListener('click', () => turn(1));
document.getElementById('lookBack').addEventListener('click', closeLook);
window.addEventListener('keydown', (e) => {
  if (!M.looking) return;
  if (e.key === 'ArrowLeft') turn(-1);
  else if (e.key === 'ArrowRight') turn(1);
  else if (e.key === 'Escape') closeLook();
});
window.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  px = e.clientX / window.innerWidth * 2 - 1; py = 1 - e.clientY / window.innerHeight * 2;
});
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); M.ready = false; say('Graphics paused (context lost); the 2D clown stands in.'); });
canvas.addEventListener('webglcontextrestored', () => { M.ready = true; sizeW = 0; say('Graphics restored.'); });

load().catch((e) => { M.error = String(e && e.message || e); say('Model failed to load, the 2D clown stands in: ' + M.error); console.error(e); });

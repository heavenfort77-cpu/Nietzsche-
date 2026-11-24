// Session 25: real-GPU frame times for the game the owner plays (web/step0/night1.html), on GitHub's Apple-silicon Mac runner (Metal through ANGLE).
// gpu_measure.mjs times web/game/index.html (the earlier ring page); this times night1's heaviest scenes with the same method: each frame is the
// game's own update for 1/60 s plus its draw, waited for on the GPU (one pixel read back), so the time is the frame's real cost (CPU and GPU).
// The pixel-ratio watcher is not called while timing (tier locked at its default, rule 31). Owner requirement 2: p95 at most 16.7 ms.
// Session 30 (rule 28, profile first): each frame is split into CPU (update plus the draw calls' submission, JS) and GPU wait (the pixel read back
// after it); the control page step0/gpu_control.html (an empty WebGL frame at the same size) is timed before and after each setup in the same job,
// so a miss is the page's only when it is slower than the control; frames over the budget are listed; a sampling CPU profile of each scene at
// 1080p prints the top functions by self time.
// Usage: node gpu_night1.mjs <web/step0 dir>; EXTRA_ARGS='--use-angle=swiftshader' for a local dry run (software: correctness and counts only).
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // Chrome on the macOS runner image
  chrome: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // setups timed: [width, height, screen pixel ratio, label]
  setups: [[1920, 1080, 1, '1080p desktop'], [1440, 900, 2, 'retina laptop'], [2560, 1440, 1, '1440p desktop'], [390, 844, 3, 'phone portrait'], [844, 390, 3, 'phone landscape']],
  // frames run before timing (shader and upload settling)
  warm: 30,
  // frames timed per scene and setup
  frames: 240,
  // owner requirement 2 (22 Nov): 60 fps on desktop and phone, frame p95 at most this (ms)
  budgetMs: 16.7,
  // draw-call and triangle budgets for the heaviest scene (rules 32, 24)
  maxCalls: 500, maxTris: 500000,
  // CPU profile: sampling interval (microseconds) and functions printed per scene
  profUs: 200, profTop: 10,
  // frames over the budget listed per scene and setup (the rest are counted)
  longList: 6,
  // probe pass (session 31, rule 28): [setup, scene, part ladder on/off]; the run 118 misses (1440p shop, retina ring) and the act's long frame #26-27
  // session 32: plus the act at phone landscape (run 121 act max 31.0 ms, 5 frames over)
  probes: [['1440p desktop', 'mirror shop', true], ['1080p desktop', 'mirror shop', false], ['retina laptop', 'mirror world ring', true], ['1080p desktop', 'act', false], ['phone landscape', 'act', false]],
  // probe pass: frames listed per probe (over the budget, or something linked, first used, uploaded or first drawn)
  probeList: 12,
  // part ladder: frames settled, then frames timed, with one part of the scene hidden
  ladderWarm: 10, ladderFrames: 60,
  // part ladder: parts printed per level (largest saving first); groups opened one level down
  ladderTop: 12, ladderOpen: 2,
  // reflection ladder in every shop probe: rounds of the variants interleaved (session 32: base, no reflection pass, no second skeleton update, tiny scene, both)
  reflRounds: 5,
  // shop A/B (session 31): this page against the previous one (env NIGHT1_PREV, a file in the step0 dir), alternated in the same job
  abSetups: ['1080p desktop', '1440p desktop'],
  // shop A/B: rounds per page, frames timed per round (after the warm frames)
  abRounds: 4, abFrames: 120,
};
const root = process.argv[2] || 'step0';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({
  executablePath: CONFIG.chrome, headless: 'new', protocolTimeout: 900000,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', ...(process.env.EXTRA_ARGS || '').split(' ').filter(Boolean)],
});
const p = await b.newPage();
p.setDefaultTimeout(300000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
let pass = 0, fail = 0;
function gate(name, ok, info) { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${typeof info === 'string' ? info : JSON.stringify(info)}`); }
const stats = (t) => { const s = [...t].sort((x, y) => x - y); const q = (v) => s[Math.min(s.length - 1, Math.floor(v * s.length))]; return { median: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) }; };
// one timed frame loop in the page: run(k) is the frame, then one pixel is read back; returns total, CPU (until the read) and GPU wait (the read)
const LOOP = `(run, gl, n, warm) => { const px = new Uint8Array(4), tot = [], cpu = [], gpu = [];
  for (let k = 0; k < n + warm; k++) { const t0 = performance.now(); run(k); const t1 = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t2 = performance.now();
    if (k >= warm) { tot.push(t2 - t0); cpu.push(t1 - t0); gpu.push(t2 - t1); } }
  return { tot, cpu, gpu }; }`;
const split = (r) => { const long = []; r.tot.forEach((v, k) => { if (v > CONFIG.budgetMs) long.push({ k, ms: +v.toFixed(1), cpu: +r.cpu[k].toFixed(1), gpu: +r.gpu[k].toFixed(1) }); });
  return { ...stats(r.tot), cpuP95: stats(r.cpu).p95, gpuP95: stats(r.gpu).p95, long: long.length, longCpu: long.filter((f) => f.cpu >= f.gpu).length, list: long.slice(0, CONFIG.longList) }; };
async function control(label) {
  await p.goto(`http://localhost:${srv.address().port}/gpu_control.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__ctl);
  const r = await p.evaluate(`(${LOOP})((k) => window.__ctl.frame(), window.__ctl.gl, ${CONFIG.frames}, ${CONFIG.warm})`);
  const px = await p.evaluate(() => window.__ctl.px());
  return { scene: 'control (empty)', setup: label, px, ...split(r) };
}
// capability lines (lesson: check what the test machine supports first): GPU timer queries, parallel shader compile
async function caps() {
  return p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); return g ? { timerQuery: !!g.getExtension('EXT_disjoint_timer_query_webgl2'), parallelCompile: !!g.getExtension('KHR_parallel_shader_compile') } : null; });
}

// the scenes, each set up on a fresh page: the ring of the Mirror World with its group (the arena), the act at the zoom-out, the shop at the mirror (room plus reflection pass)
const SCENES = {
  'mirror world ring': () => {
    const N = window.__night, NS = N.NS;
    NS.act = 'fall'; NS.actInfo = { scene: 'results', perfects: 2, goods: 3, misses: 1, actLaughs: 40, mask: 2 }; NS.hurt = { falls: 1, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = [];
    N.enterMW(); const M = NS.mw; M.laughs = 1e6;
    M.bag.length = 0; M.brk = null; for (const f of N.foes) f.alive = false; N.mwLeaveLeg(); M.leg = M.route.length - 1; N.mwEnterLeg(M);
  },
  'act': () => {
    const N = window.__night, R = ['perfect', 'perfect', 'perfect', 'good', 'miss', 'good', 'good', 'good', 'good'];
    N.NS.actBeats = R.map((r, k) => ({ fit: 1000 + k * 600, chain: Math.floor(k / 3), result: r }));
    N.NS.actInfo = { scene: 'results', perfects: 3, goods: 5, misses: 1, actLaughs: 45, mask: 2 };
    N.NS.actSeen = false; N.actAfter();
  },
  'mirror shop': () => { const N = window.__night; document.getElementById('curtain').classList.add('hidden'); N.NS.learn = null; N.shopCard(); },
};
const want = { 'mirror world ring': 'mw', 'act': 'act', 'mirror shop': 'room' };
const rows = [];
let routeOk = null, capsLine = null;
for (const [w, h, sf, label] of CONFIG.setups) for (const [scene, setup] of [['control before', null], ...Object.entries(SCENES), ['control after', null]]) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: sf, isMobile: /phone/.test(label), hasTouch: /phone/.test(label) });
  if (!setup) { const c = await control(label); c.scene = scene; rows.push(c); continue; }
  await p.goto(`http://localhost:${srv.address().port}/night1.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame);
  if (routeOk === null) {
    const gl = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'), x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? { renderer: g.getParameter(x.UNMASKED_RENDERER_WEBGL) } : { renderer: 'none' }; });
    routeOk = !/SwiftShader|llvmpipe|software|none/i.test(gl.renderer);
    if (process.env.EXTRA_ARGS) console.log('dry run (EXTRA_ARGS): route and frame-time gates not judged | ' + JSON.stringify(gl));
    else gate('route: Chrome draws WebGL on the GPU, not in software', routeOk, gl);
  }
  await p.evaluate(setup);
  if (!capsLine) { capsLine = await caps(); console.log('capabilities | ' + JSON.stringify(capsLine)); }
  // the game's own loop stops; each timed frame is one update and one draw, then one pixel read back (waits for the GPU);
  // every pass of a frame counted (the mirror's reflection is a second render)
  await p.evaluate(() => { const N = window.__night, R = window.__walkTest.renderer; N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; } window.__cnt = { calls: 0, tris: 0, auto: R.info.autoReset }; R.info.autoReset = false; });
  const lr = await p.evaluate(`(${LOOP})((k) => { const N = window.__night, R = window.__walkTest.renderer; R.info.reset(); N.stepFrame(1 / 60); if (k >= ${CONFIG.warm}) { window.__cnt.calls = Math.max(window.__cnt.calls, R.info.render.calls); window.__cnt.tris = Math.max(window.__cnt.tris, R.info.render.triangles); } }, window.__walkTest.renderer.getContext(), ${CONFIG.frames}, ${CONFIG.warm})`);
  const r = await p.evaluate(() => { const N = window.__night, R = window.__walkTest.renderer, c = R.domElement; R.info.autoReset = window.__cnt.auto; return { calls: window.__cnt.calls, tris: window.__cnt.tris, mode: N.S.mode, room: !!N.S.room, px: `${c.width}x${c.height}`, dpr: R.getPixelRatio() }; });
  const st = split(lr), mode = r.mode === 'mw' || r.mode === 'act' ? r.mode : r.room ? 'room' : r.mode;
  rows.push({ scene, setup: label, ...st, calls: r.calls, tris: r.tris, px: r.px, dpr: r.dpr });
  gate(`${label} ${scene}: still in the scene after ${CONFIG.frames + CONFIG.warm} frames`, mode === want[scene], { mode });
  gate(`${label} ${scene} (${r.px}, pixel ratio ${r.dpr}): draw calls <= ${CONFIG.maxCalls}, triangles <= ${CONFIG.maxTris}`, r.calls <= CONFIG.maxCalls && r.tris <= CONFIG.maxTris, { calls: r.calls, tris: r.tris });
  if (!process.env.EXTRA_ARGS) gate(`${label} ${scene}: frame p95 <= ${CONFIG.budgetMs} ms`, st.p95 <= CONFIG.budgetMs, { median: st.median, p95: st.p95, max: st.max, cpuP95: st.cpuP95, gpuP95: st.gpuP95 });
}
console.log('night1 frame times, ms (update for 1/60 s plus draw, each waited for on the GPU; cpu = until the read back, gpu = the read back):');
for (const r of rows) console.log(`  ${r.setup.padEnd(16)} ${r.scene.padEnd(18)} ${r.px.padEnd(10)} median ${r.median}  p95 ${r.p95}  max ${r.max}  cpu p95 ${r.cpuP95}  gpu p95 ${r.gpuP95}  over ${CONFIG.budgetMs}: ${r.long} (cpu-led ${r.longCpu})${r.calls !== undefined ? `  calls ${r.calls}  tris ${r.tris}` : ''}`);
console.log(`frames over ${CONFIG.budgetMs} ms (first ${CONFIG.longList} per row: frame index, total, cpu, gpu):`);
for (const r of rows) if (r.list.length) console.log(`  ${r.setup} | ${r.scene} | ` + r.list.map((f) => `#${f.k} ${f.ms} (${f.cpu} / ${f.gpu})`).join(', '));
// the control's own noise: a page that is the scene's cost only when slower than the empty frame at the same size, before and after
if (!process.env.EXTRA_ARGS) for (const [, , , label] of CONFIG.setups) {
  const c = rows.filter((r) => r.setup === label && /^control/.test(r.scene)), worst = Math.max(...c.map((r) => r.p95));
  gate(`${label}: control page (empty WebGL frame) p95 <= ${CONFIG.budgetMs} ms, so this runner can show the budget`, worst <= CONFIG.budgetMs, c.map((r) => ({ [r.scene]: { median: r.median, p95: r.p95, max: r.max } })));
}
// Load sweep (session 31): cause of run 119's act frame #27 (17.4 ms) was a shader program used for the first time during play; the class is every
// material of every scene. Each must have a program that was already used (drawn) at load, under the loading card. Own page, so the useProgram
// wrapper does not touch the timed pages. Not covered: pooled objects kept outside every scene at load.
{
  const ps = await b.newPage();
  ps.on('pageerror', (e) => errs.push(String(e)));
  await ps.setViewport({ width: CONFIG.setups[0][0], height: CONFIG.setups[0][1], deviceScaleFactor: CONFIG.setups[0][2] });
  await ps.evaluateOnNewDocument(() => { const u = window.__usedProgs = new Set(), o = WebGL2RenderingContext.prototype.useProgram; WebGL2RenderingContext.prototype.useProgram = function (q) { if (q) u.add(q); return o.call(this, q); }; });
  await ps.goto(`http://localhost:${srv.address().port}/night1.html`, { waitUntil: 'load' });
  await ps.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame);
  const r = await ps.evaluate(() => {
    const R = window.__walkTest.renderer, U = window.__usedProgs, out = { mats: 0, never: [], unused: [] }, seen = new Set();
    for (const [sn, s] of Object.entries(window.__night.scenes)) s.traverse((o) => {
      if (!o.material) return;
      for (const m of [].concat(o.material)) {
        if (seen.has(m)) continue;
        seen.add(m); out.mats++;
        const pr = R.properties.get(m).currentProgram, lab = `${sn}: ${o.name || o.type}${o.isInstancedMesh ? ' x' + o.count : ''} ${m.name || m.type}${o.visible ? '' : ' (hidden)'}`;
        if (!pr) out.never.push(lab); else if (!U.has(pr.program)) out.unused.push(lab);
      }
    });
    return out;
  });
  gate(`load sweep: every material of every scene (${r.mats}) has a program drawn at load, none first used during play`, !r.never.length && !r.unused.length, { neverCompiled: r.never.length, compiledNotDrawn: r.unused.length, byScene: [...r.never, ...r.unused].reduce((a, l) => { const k = l.split(':')[0]; a[k] = (a[k] || 0) + 1; return a; }, {}), first: [...r.never, ...r.unused].slice(0, 6) });
  await ps.close();
}
// Probe pass (session 31, rule 28: name the cause before any fix). A separate pass on a fresh page, so the hooks do not touch the timings above.
// Test-side hooks only, no game change: renderer.render is wrapped (GPU timer query per pass, labelled by scene and camera layers; a part of the
// main scene can be hidden for that render only, so game logic cannot undo it; the reflection pass (layers mask 2) can be skipped); gl calls are
// counted per frame (program links, first useProgram of a program, texture uploads, buffer uploads); Object3D.onBeforeRender marks objects drawn
// for the first time (objects with their own onBeforeRender are hooked when their scene is first rendered).
const PROBE = `(() => {
  const W = window.__walkTest, N = window.__night, R = W.renderer, gl = R.getContext(), X = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const P = window.__probe = { k: 0, ev: [], q: [], timing: true, hide: null, skipL1: false, main: null, seen: new Set(), used: new Set(), hooked: new Set(), cur: null, X: !!X };
  const fresh = () => ({ link: 0, first: 0, tex: 0, texs: [], buf: 0, drawn: [] });
  P.cur = fresh(); P.fresh = fresh;
  // label: name (or first named descendant), geometry type and size (m), material type, transparent / additive / no depth write, texture size
  const named = (o) => { let n = o.name; if (!n) o.traverse((d) => { if (!n && d.name) n = d.name + '..'; }); return n || o.type; };
  const lab = (o) => {
    let s = named(o); const g = o.geometry, m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (g && g.attributes && g.attributes.position) { if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox; s += ' ' + g.type.replace('Geometry', '') + ' ' + [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].map((v) => v.toFixed(1)).join('x'); }
    if (m) { const tx = m.map || (m.uniforms && Object.values(m.uniforms).map((u) => u && u.value).find((v) => v && v.isTexture)), im = tx && tx.image; s += ' ' + (m.name || m.type.replace('Material', '')) + (m.transparent ? ' transp' : '') + (m.blending === 2 ? ' add' : '') + (m.depthWrite === false ? ' noZ' : '') + (im ? ' tex ' + (im.width || '?') + 'x' + (im.height || '?') : ''); }
    if (o.isInstancedMesh) s += ' x' + o.count;
    return s;
  };
  P.lab = lab;
  const mark = (o) => { if (!P.seen.has(o)) { P.seen.add(o); P.cur.drawn.push(lab(o)); } };
  // texture uploads: count, and the source size and kind of the first three per frame
  const src = (fn, a) => { const v = a[a.length - 1]; return v && v.width ? v.width + 'x' + v.height + ' ' + v.constructor.name : fn === 'texSubImage2D' ? a[4] + 'x' + a[5] + ' data' : a[3] + 'x' + a[4] + ' data'; };
  for (const fn of ['texImage2D', 'texSubImage2D', 'compressedTexImage2D', 'compressedTexSubImage2D', 'texStorage2D', 'texImage3D', 'texStorage3D']) { const o = gl[fn].bind(gl); gl[fn] = (...a) => { P.cur.tex++; if (P.cur.texs.length < 3) P.cur.texs.push(fn + ' ' + src(fn, a)); return o(...a); }; }
  for (const fn of ['bufferData', 'bufferSubData']) { const o = gl[fn].bind(gl); gl[fn] = (...a) => { P.cur.buf++; return o(...a); }; }
  { const o = gl.linkProgram.bind(gl); gl.linkProgram = (p) => { P.cur.link++; return o(p); }; }
  { P.used = window.__usedProgs || P.used; const o = gl.useProgram.bind(gl); gl.useProgram = (p) => { if (p && !P.used.has(p)) P.cur.first++; return o(p); }; }
  const O3 = Object.getPrototypeOf(Object.getPrototypeOf(W.scene)), ob = O3.onBeforeRender;
  O3.onBeforeRender = function (...a) { mark(this); return ob.apply(this, a); };
  const hookOwn = (s) => s.traverse((o) => { if (Object.prototype.hasOwnProperty.call(o, 'onBeforeRender') && !o.__probeHook) { const f = o.onBeforeRender; o.__probeHook = 1; o.onBeforeRender = function (...a) { mark(this); return f.apply(this, a); }; } });
  { const o = R.clearDepth.bind(R); R.clearDepth = () => { if (!P.noClearDepth) o(); }; }
  { const o = R.setScissorTest.bind(R); R.setScissorTest = (v) => o(P.noScissor ? false : v); }
  // session 32: the reflection pass is a second render() of the whole roomScene at layers 2; three.js counts it as a new frame, so every skinned mesh it
  // draws updates its skeleton again (the clown is on layers 0 and 1: his bone texture is uploaded again after pass 1 drew with it).
  // P.oneSkel: skeletons already updated by pass 1 are not updated again (their bones have not moved between the passes); P.tiny: the pass draws a scene
  // holding only the layer-1 objects (the reflection and the clown, moved there for that render and put back at the same index), not the whole roomScene
  const T = new W.roomScene.constructor(); T.fog = W.roomScene.fog; T.matrixWorldAutoUpdate = W.roomScene.matrixWorldAutoUpdate;
  const both = () => { const out = []; W.roomScene.traverse((o) => { if (o.isSkinnedMesh && (o.layers.mask & 3) === 3 && !out.includes(o.skeleton)) out.push(o.skeleton); }); return out; };
  const l1 = () => [N.refl.root, N.chars.clown.root].filter((o) => o && o.parent === W.roomScene);
  const orig = R.render.bind(R);
  R.render = (s, c) => {
    const L = c.layers.mask;
    if (!P.hooked.has(s)) { P.hooked.add(s); hookOwn(s); }
    if (!P.main && L === 1) P.main = s;
    if (L === 2 && P.skipL1) return;
    if (L === 2 && (P.oneSkel || P.tiny)) {
      const sk = P.oneSkel ? both() : [], up = sk.map((k) => k.update);
      for (const k of sk) k.update = () => {};
      const mv = P.tiny ? l1().map((o) => [o, W.roomScene.children.indexOf(o)]) : [];
      for (const [o] of mv) T.add(o);
      orig(P.tiny ? T : s, c);
      for (const [o, i] of mv.reverse()) { T.remove(o); W.roomScene.children.splice(i, 0, o); o.parent = W.roomScene; }
      sk.forEach((k, i) => { k.update = up[i]; });
      return;
    }
    const h = s === P.main ? P.hide : null, was = h ? h.visible : false;
    if (h) h.visible = false;
    let q = null;
    if (X && P.timing) { q = gl.createQuery(); gl.beginQuery(X.TIME_ELAPSED_EXT, q); }
    orig(s, c);
    if (q) { gl.endQuery(X.TIME_ELAPSED_EXT); P.q.push([P.k, (s === W.roomScene ? 'room' : N.S.mode) + ' layers ' + L, q]); }
    if (h) h.visible = was;
  };
  // GPU timer results, once available: per label, ms per frame index; disjoint frames dropped and counted
  P.read = async () => {
    const out = {}, t0 = performance.now(); let lost = 0, disjoint = 0;
    while (P.q.length && !gl.getQueryParameter(P.q[P.q.length - 1][2], gl.QUERY_RESULT_AVAILABLE) && performance.now() - t0 < 3000) await new Promise((r) => setTimeout(r, 50));
    if (X && gl.getParameter(X.GPU_DISJOINT_EXT)) disjoint++;
    for (const [k, l, q] of P.q) { if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) (out[l] = out[l] || []).push([k, gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6]); else lost++; gl.deleteQuery(q); }
    P.q.length = 0; return { out, lost, disjoint };
  };
  // parts of a group: label, triangles (instances counted), visible now
  P.parts = (g) => g.children.map((c, i) => { let tris = 0, meshes = 0; c.traverse((o) => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) { meshes++; const n = o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count; tris += Math.round(n / 3) * (o.isInstancedMesh ? o.count : 1); } }); return { i, label: lab(c), tris, meshes, kids: c.children.length, vis: c.visible }; });
})()`;
const pstats = (a) => a.length ? stats(a) : { median: 0, p95: 0, max: 0 };
// one probe page with program use recorded from page load (a program drawn by the load warm-up is not a first use during play)
const pp = await b.newPage();
pp.setDefaultTimeout(300000);
pp.on('pageerror', (e) => errs.push(String(e)));
await pp.evaluateOnNewDocument(() => { const u = window.__usedProgs = new Set(), o = WebGL2RenderingContext.prototype.useProgram; WebGL2RenderingContext.prototype.useProgram = function (q) { if (q) u.add(q); return o.call(this, q); }; });
for (const [label, scene, ladder] of CONFIG.probes) {
  const [w, h, sf] = CONFIG.setups.find((s) => s[3] === label);
  await pp.setViewport({ width: w, height: h, deviceScaleFactor: sf, isMobile: /phone/.test(label), hasTouch: /phone/.test(label) });
  await pp.goto(`http://localhost:${srv.address().port}/night1.html`, { waitUntil: 'load' });
  await pp.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame);
  await pp.evaluate(SCENES[scene]);
  await pp.evaluate(() => { const N = window.__night, R = window.__walkTest.renderer; N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; } R.info.autoReset = false; });
  await pp.evaluate(PROBE);
  const run = `(k) => { const P = window.__probe, R = window.__walkTest.renderer; P.k = k; P.cur = P.fresh(); R.info.reset(); window.__night.stepFrame(1 / 60); P.cur.calls = R.info.render.calls; P.ev[k] = P.cur; }`;
  const lr = await pp.evaluate(`(${LOOP})(${run}, window.__walkTest.renderer.getContext(), ${CONFIG.frames}, ${CONFIG.warm})`);
  const ev = await pp.evaluate(() => window.__probe.ev);
  const tq = await pp.evaluate(() => window.__probe.read());
  const st = split(lr), tag = `probe ${label} ${scene}`;
  gate(`${tag}: every frame logged`, ev.length === CONFIG.frames + CONFIG.warm, { logged: ev.length });
  console.log(`${tag}: median ${st.median} p95 ${st.p95} max ${st.max} cpu p95 ${st.cpuP95} gpu p95 ${st.gpuP95} over ${CONFIG.budgetMs}: ${st.long} | timer query ${await pp.evaluate(() => window.__probe.X)} lost ${tq.lost} disjoint ${tq.disjoint}`);
  for (const [l, a] of Object.entries(tq.out)) { const t = a.filter(([k]) => k >= CONFIG.warm).map(([, ms]) => ms), s = pstats(t); console.log(`  pass ${l.padEnd(18)} GPU ms median ${s.median} p95 ${s.p95} max ${s.max} (${t.length} frames)`); }
  // frames with events, timed frames only (k counted from the first timed frame, as in the lists above)
  const tot = { link: 0, first: 0, tex: 0, drawn: 0 }, listed = [], evList = [];
  for (let k = CONFIG.warm; k < ev.length; k++) {
    const e = ev[k], i = k - CONFIG.warm, ms = lr.tot[i];
    tot.link += e.link; tot.first += e.first; tot.tex += e.tex; tot.drawn += e.drawn.length;
    const hasEv = e.link || e.first || e.drawn.length;
    if (!hasEv && ms <= CONFIG.budgetMs) continue;
    (hasEv ? evList : listed).push(`#${i} ${ms.toFixed(1)} (${lr.cpu[i].toFixed(1)} / ${lr.gpu[i].toFixed(1)}) calls ${e.calls} link ${e.link} firstUse ${e.first} tex ${e.tex}${e.texs.length ? ' [' + e.texs.join('; ') + ']' : ''} buf ${e.buf}${e.drawn.length ? ' drawnFirstSinceProbe ' + e.drawn.slice(0, 5).join(', ') + (e.drawn.length > 5 ? ` +${e.drawn.length - 5}` : '') : ''}`);
  }
  const warmEv = ev.slice(0, CONFIG.warm).reduce((a, e) => ({ link: a.link + e.link, first: a.first + e.first, tex: a.tex + e.tex, drawn: a.drawn + e.drawn.length }), { link: 0, first: 0, tex: 0, drawn: 0 });
  console.log(`  events in the ${CONFIG.warm} settle frames ${JSON.stringify(warmEv)}; in the ${CONFIG.frames} timed frames ${JSON.stringify(tot)}; frame lines are index, total, cpu / gpu:`);
  { const tc = ev.slice(CONFIG.warm).map((e) => e.tex), f = ev[CONFIG.warm]; console.log(`  texture uploads per timed frame: min ${Math.min(...tc)} max ${Math.max(...tc)}; first timed frame: ${f.texs.join('; ') || 'none'}`); }
  for (const [name, list] of [['with events', evList], ['over budget, no events', listed]]) {
    console.log(`  frames ${name}: ${list.length}`);
    for (const l of list.slice(0, CONFIG.probeList)) console.log('    ' + l);
    if (list.length > CONFIG.probeList) console.log(`    +${list.length - CONFIG.probeList} more`);
  }
  // part ladder: same page, timer queries off; baseline before and after (noise band); the reflection pass skipped; each part hidden in turn
  await pp.evaluate(() => { window.__probe.timing = false; });
  const time = async (expr) => { await pp.evaluate(expr); const r = await pp.evaluate(`(${LOOP})((k) => { if (k === ${CONFIG.ladderWarm}) window.__probe.cur = window.__probe.fresh(); window.__night.stepFrame(1 / 60); }, window.__walkTest.renderer.getContext(), ${CONFIG.ladderFrames}, ${CONFIG.ladderWarm})`); const tex = await pp.evaluate(() => window.__probe.cur.tex); return { tot: stats(r.tot), gpu: stats(r.gpu), tex: +(tex / CONFIG.ladderFrames).toFixed(1) }; };
  if (scene === 'mirror shop') {
    // reflection ladder (session 31): which part of the reflection pass costs; variants interleaved per round, so VM drift hits them alike
    // session 32: clearDepth and scissor rungs dropped (run 121: no saving); the split asked by run 121's Next step: skeleton re-update vs scene traversal
    const V = { base: '', 'no reflection pass': 'P.skipL1 = true', 'reflection, no second skeleton update': 'P.oneSkel = true', 'reflection, tiny scene': 'P.tiny = true', 'reflection, tiny scene, one skeleton update': 'P.tiny = P.oneSkel = true' }, res = {}, tex = {};
    for (let r = 0; r < CONFIG.reflRounds; r++) for (const [n, e] of Object.entries(V)) { const t = await time(`{ const P = window.__probe; P.skipL1 = P.noClearDepth = P.noScissor = P.oneSkel = P.tiny = false; ${e}; }`); (res[n] = res[n] || []).push(t.tot.median); (tex[n] = tex[n] || []).push(t.tex); }
    await pp.evaluate(() => { const P = window.__probe; P.skipL1 = P.noClearDepth = P.noScissor = P.oneSkel = P.tiny = false; });
    console.log(`  reflection ladder ${tag} (${CONFIG.reflRounds} rounds x ${CONFIG.ladderFrames} frames, total ms; median of the round medians, then each round; texture uploads per frame):`);
    for (const [n, a] of Object.entries(res)) console.log(`    ${n.padEnd(44)} ${stats(a).median}  [${a.join(', ')}]  tex/frame ${stats(tex[n]).median}`);
  }
  if (!ladder) continue;
  const base0 = await time('window.__probe.hide = null; window.__probe.skipL1 = false');
  const noRefl = await time('window.__probe.skipL1 = true');
  await pp.evaluate(() => { window.__probe.skipL1 = false; });
  const lad = async (path) => {
    const parts = await pp.evaluate(`window.__probe.parts(${path})`), out = [];
    for (const pt of parts) { if (!pt.vis || !pt.meshes) continue; const r = await time(`window.__probe.hide = (${path}).children[${pt.i}]`); out.push({ ...pt, path: `${path}.children[${pt.i}]`, save: +(base0.tot.median - r.tot.median).toFixed(2), saveP95: +(base0.tot.p95 - r.tot.p95).toFixed(2), gpuMed: r.gpu.median }); }
    await pp.evaluate(() => { window.__probe.hide = null; });
    return out.sort((a, b) => b.save - a.save);
  };
  const top = await lad('window.__probe.main');
  const base1 = await time('window.__probe.hide = null');
  console.log(`  ladder ${tag} (${CONFIG.ladderFrames} frames each, total ms): base before median ${base0.tot.median} p95 ${base0.tot.p95}, after median ${base1.tot.median} p95 ${base1.tot.p95}; minus reflection pass median ${noRefl.tot.median} p95 ${noRefl.tot.p95}`);
  for (const r of top.slice(0, CONFIG.ladderTop)) console.log(`    hide ${r.label.padEnd(34)} saves median ${r.save} p95 ${r.saveP95} | tris ${r.tris} meshes ${r.meshes}`);
  for (const g of top.filter((r) => r.kids > 1).slice(0, CONFIG.ladderOpen)) {
    const sub = await lad(g.path);
    console.log(`  inside ${g.label}:`);
    for (const r of sub.slice(0, CONFIG.ladderTop)) console.log(`    hide ${r.label.padEnd(34)} saves median ${r.save} p95 ${r.saveP95} | tris ${r.tris} meshes ${r.meshes}`);
  }
}
await pp.close();
// Shop A/B (session 31): run 120 shop 1080p p95 18.2 vs run 119 8.3 with the same draws (15 calls, 108,068 triangles) on a slower VM. This page and
// the previous one (env NIGHT1_PREV) timed in alternating rounds on fresh pages; gate: this page's median of round p95s is not above the previous
// page's by more than the larger of the two pages' round-to-round spread (noise band).
if (process.env.NIGHT1_PREV) for (const label of CONFIG.abSetups) {
  const [w, h, sf] = CONFIG.setups.find((s) => s[3] === label), res = { now: [], prev: [] };
  for (let r = 0; r < CONFIG.abRounds; r++) for (const [k, file] of [['now', 'night1.html'], ['prev', process.env.NIGHT1_PREV]]) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: sf });
    try {
      await p.goto(`http://localhost:${srv.address().port}/${file}`, { waitUntil: 'load' });
      await p.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame, { timeout: 120000 });
      await p.evaluate(SCENES['mirror shop']);
      await p.evaluate(() => { const N = window.__night; N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; } });
      const lr = await p.evaluate(`(${LOOP})((k) => window.__night.stepFrame(1 / 60), window.__walkTest.renderer.getContext(), ${CONFIG.abFrames}, ${CONFIG.warm})`);
      res[k].push(stats(lr.tot));
    } catch (e) {
      const st = await p.evaluate(() => ({ night: !!window.__night, ready: !!(window.__night && window.__night.S.ready), lost: !!(window.__night && window.__night.S.lost) })).catch(() => null);
      gate(`${label} shop A/B round ${r} ${file}: page ready and timed`, false, { error: String(e).slice(0, 120), state: st, pageErrors: errs.slice(-3) });
    }
  }
  if (res.now.length < CONFIG.abRounds || res.prev.length < CONFIG.abRounds) continue;
  const p95 = (k) => res[k].map((x) => x.p95), med = (k) => stats(p95(k)).median, spread = (k) => +(Math.max(...p95(k)) - Math.min(...p95(k))).toFixed(2);
  console.log(`shop A/B ${label}: now medians [${res.now.map((x) => x.median).join(', ')}] p95s [${p95('now').join(', ')}]; prev (${process.env.NIGHT1_PREV}) medians [${res.prev.map((x) => x.median).join(', ')}] p95s [${p95('prev').join(', ')}]`);
  if (!process.env.EXTRA_ARGS) gate(`${label} mirror shop: this page not slower than the previous page (median of round p95s, noise band)`, med('now') <= med('prev') + Math.max(spread('now'), spread('prev')), { now: med('now'), prev: med('prev'), noise: Math.max(spread('now'), spread('prev')) });
}
// CPU profile per scene at the first setup (a separate pass, so sampling does not touch the timings above): top functions by self time
{
  const [w, h, sf, label] = CONFIG.setups[0];
  for (const [scene, setup] of Object.entries(SCENES)) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: sf });
    await p.goto(`http://localhost:${srv.address().port}/night1.html`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame);
    await p.evaluate(setup);
    await p.evaluate(() => { const N = window.__night; N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; } });
    const cdp = await p.createCDPSession();
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: CONFIG.profUs }); await cdp.send('Profiler.start');
    await p.evaluate(`(${LOOP})((k) => window.__night.stepFrame(1 / 60), window.__walkTest.renderer.getContext(), ${CONFIG.frames}, ${CONFIG.warm})`);
    const { profile } = await cdp.send('Profiler.stop'); await cdp.detach();
    const dt = profile.timeDeltas, cnt = new Map(), byId = new Map(profile.nodes.map((nd) => [nd.id, nd]));
    for (let i = 0; i < profile.samples.length; i++) cnt.set(profile.samples[i], (cnt.get(profile.samples[i]) || 0) + (dt[i] || 0));
    const self = new Map(); let all = 0;
    for (const [id, us] of cnt) { const cf = byId.get(id).callFrame, key = `${cf.functionName || '(anonymous)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + us); all += us; }
    const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, CONFIG.profTop);
    console.log(`profile ${label} ${scene}: ${(all / 1000).toFixed(0)} ms sampled over ${CONFIG.frames + CONFIG.warm} frames; top self time:`);
    for (const [k, us] of top) console.log(`  ${(us / 1000).toFixed(1).padStart(7)} ms  ${(100 * us / all).toFixed(1).padStart(5)}%  ${k}`);
  }
}
gate('no page or console errors', errs.length === 0, errs.slice(0, 3));
console.log(`RESULT gpu night1 ${pass} of ${pass + fail} pass`);
await b.close(); srv.close();
process.exit(fail ? 1 : 0);

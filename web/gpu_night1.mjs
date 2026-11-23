// Session 25: real-GPU frame times for the game the owner plays (web/step0/night1.html), on GitHub's Apple-silicon Mac runner (Metal through ANGLE).
// gpu_measure.mjs times web/game/index.html (the earlier ring page); this times night1's heaviest scenes with the same method: each frame is the
// game's own update for 1/60 s plus its draw, waited for on the GPU (one pixel read back), so the time is the frame's real cost (CPU and GPU).
// The pixel-ratio watcher is not called while timing (tier locked at its default, rule 31). Owner requirement 2: p95 at most 16.7 ms.
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
let routeOk = null;
for (const [w, h, sf, label] of CONFIG.setups) for (const [scene, setup] of Object.entries(SCENES)) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: sf, isMobile: /phone/.test(label), hasTouch: /phone/.test(label) });
  await p.goto(`http://localhost:${srv.address().port}/night1.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.stepFrame);
  if (routeOk === null) {
    const gl = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'), x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? { renderer: g.getParameter(x.UNMASKED_RENDERER_WEBGL) } : { renderer: 'none' }; });
    routeOk = !/SwiftShader|llvmpipe|software|none/i.test(gl.renderer);
    if (process.env.EXTRA_ARGS) console.log('dry run (EXTRA_ARGS): route and frame-time gates not judged | ' + JSON.stringify(gl));
    else gate('route: Chrome draws WebGL on the GPU, not in software', routeOk, gl);
  }
  await p.evaluate(setup);
  const r = await p.evaluate((n, warm) => {
    const N = window.__night, W = window.__walkTest, R = W.renderer, t = [];
    // the game's own loop stops; each timed frame is one update and one draw, then one pixel read back (waits for the GPU)
    N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; }
    // every pass of a frame counted (the mirror's reflection is a second render)
    const gl = R.getContext(), px = new Uint8Array(4), auto = R.info.autoReset; R.info.autoReset = false;
    let calls = 0, tris = 0;
    for (let k = 0; k < n + warm; k++) {
      const t0 = performance.now();
      R.info.reset(); N.stepFrame(1 / 60);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const ms = performance.now() - t0;
      if (k >= warm) { t.push(ms); calls = Math.max(calls, R.info.render.calls); tris = Math.max(tris, R.info.render.triangles); }
    }
    R.info.autoReset = auto;
    const c = R.domElement;
    return { t, calls, tris, mode: N.S.mode, room: !!N.S.room, px: `${c.width}x${c.height}`, dpr: R.getPixelRatio() };
  }, CONFIG.frames, CONFIG.warm);
  const st = stats(r.t), mode = r.mode === 'mw' || r.mode === 'act' ? r.mode : r.room ? 'room' : r.mode;
  rows.push({ scene, setup: label, ...st, calls: r.calls, tris: r.tris, px: r.px, dpr: r.dpr });
  gate(`${label} ${scene}: still in the scene after ${CONFIG.frames + CONFIG.warm} frames`, mode === want[scene], { mode });
  gate(`${label} ${scene} (${r.px}, pixel ratio ${r.dpr}): draw calls <= ${CONFIG.maxCalls}, triangles <= ${CONFIG.maxTris}`, r.calls <= CONFIG.maxCalls && r.tris <= CONFIG.maxTris, { calls: r.calls, tris: r.tris });
  if (!process.env.EXTRA_ARGS) gate(`${label} ${scene}: frame p95 <= ${CONFIG.budgetMs} ms`, st.p95 <= CONFIG.budgetMs, st);
}
console.log('night1 frame times, ms (update for 1/60 s plus draw, each waited for on the GPU):');
for (const r of rows) console.log(`  ${r.setup.padEnd(16)} ${r.scene.padEnd(18)} ${r.px.padEnd(10)} median ${r.median}  p95 ${r.p95}  max ${r.max}  calls ${r.calls}  tris ${r.tris}`);
gate('no page or console errors', errs.length === 0, errs.slice(0, 3));
console.log(`RESULT gpu night1 ${pass} of ${pass + fail} pass`);
await b.close(); srv.close();
process.exit(fail ? 1 : 0);

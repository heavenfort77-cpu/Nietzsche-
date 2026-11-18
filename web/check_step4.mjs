// Step 4 gates for the shader viewer. node check_step4.mjs <dir> [page] [shotPrefix]
// Waits on conditions (the test hook exists), never on wall-clock time.
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // canvas size for the checks
  size: 900,
  // analysis downsample factor
  down: 2,
  // a pixel is part of the clown if any channel differs from the backdrop by more than this
  bgTol: 10,
  // outline pixels may sit this many analysis pixels outside the body silhouette
  dilate: 3,
  // share of outline pixels allowed outside the dilated body (antialiased edges)
  outsideMax: 0.005,
  // blouse hue range under stage light, degrees
  stageHue: [20, 70],
  // blouse hue range under Mirror light, degrees
  mirrorHue: [170, 250],
  // blouse must stay readable: mean value (0..1) at least (measured 0.70 Mirror, 0.77 stage; key light off gives 0.41)
  minValue: 0.55,
  // flake 0.5 must remove between these shares of the paint
  flakeShare: [0.25, 0.75],
  // poses checked for the outline: clip and time in seconds
  poses: [['idle', 0.5], ['walk', 0.25], ['walk', 0.75], ['slap', 0.45]],
};
const [root, page = 'index.html', shot] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) errs.push(`HTTP ${r.status()} ${r.url()}`); });
p.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) errs.push('request failed ' + r.url()); });
await p.setViewport({ width: CONFIG.size, height: CONFIG.size });
await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?test`);
const out = [];
const gate = (n, ok, i = '') => out.push(`${ok ? 'PASS' : 'FAIL'} ${n}${i !== '' ? ' | ' + i : ''}`);
try {
  await p.waitForFunction('window.__game && window.__game.api', { timeout: 240000 });
  await p.evaluate(installHelpers, CONFIG);
  const r = await p.evaluate(runGates, CONFIG);
  for (const [n, ok, i] of r) gate(n, ok, i);
  if (shot) {
    for (const w of ['stage', 'mirror']) {
      await p.evaluate((w) => { const a = window.__game.api; a.show({ body: true, face: true, hull: true }); a.mode(0); a.set({ world: w, face: 'sad', paint: 1, flake: 0, outline: true, yaw: -0.5 }); a.pose('idle', 0.5); a.render(); }, w);
      await p.screenshot({ path: `${shot}_${w}.png` });
    }
  }
} catch (e) { gate('run', false, String(e).slice(0, 300)); }
gate('no page or console errors', errs.length === 0, errs.slice(0, 3).join(' / ').slice(0, 300));
for (const l of out) console.log(l);
console.log(`RESULT ${out.filter((l) => l.startsWith('PASS')).length} of ${out.length} pass`);
await b.close(); srv.close();

// ---------------------------------------------------------------- page-side code
function installHelpers(C) {
  const api = window.__game.api;
  const gl = document.getElementById('view');
  const c2 = document.createElement('canvas'); const g = c2.getContext('2d', { willReadFrequently: true });
  window.__chk = {
    snap() {
      api.render();
      c2.width = Math.floor(gl.width / C.down); c2.height = Math.floor(gl.height / C.down);
      g.drawImage(gl, 0, 0, c2.width, c2.height);
      return { w: c2.width, h: c2.height, d: g.getImageData(0, 0, c2.width, c2.height).data };
    },
    mask(img) {
      const bg = [img.d[0], img.d[1], img.d[2]]; const m = new Uint8Array(img.w * img.h);
      for (let i = 0; i < m.length; i++) for (let k = 0; k < 3; k++) if (Math.abs(img.d[i * 4 + k] - bg[k]) > C.bgTol) { m[i] = 1; break; }
      return m;
    },
    dilate(m, w, h, r) {
      const o = new Uint8Array(m.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!m[y * w + x]) continue;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h) o[Y * w + X] = 1; }
      }
      return o;
    },
    hsv(r, g2, b2) {
      const mx = Math.max(r, g2, b2), mn = Math.min(r, g2, b2), d = mx - mn;
      let h = 0;
      if (d > 0) h = mx === r ? ((g2 - b2) / d) % 6 : mx === g2 ? (b2 - r) / d + 2 : (r - g2) / d + 4;
      return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255];
    },
    diffCount(a, b2) { let n = 0; for (let i = 0; i < a.d.length; i += 4) if (Math.abs(a.d[i] - b2.d[i]) + Math.abs(a.d[i + 1] - b2.d[i + 1]) + Math.abs(a.d[i + 2] - b2.d[i + 2]) > 6) n++; return n; },
  };
}
function runGates(C) {
  const api = window.__game.api, K = window.__chk, R = [];
  // the game page shows the ring too: step 4 gates look at the clown alone, close up, without post
  if (api.isolate) api.isolate(true);
  const all = { body: true, face: true, hull: true };
  api.show(all); api.set({ world: 'stage', face: 'sad', paint: 1, flake: 0, outline: true, yaw: 0 }); api.pose('idle', 0.5);
  const info = api.render();
  R.push(['draw calls <= 3 with the outline', info.calls <= 3, `calls ${info.calls}, triangles ${info.triangles}`]);
  R.push(['outline bound to the body skeleton', api.hullBoundToBody()]);
  // blouse pixels: the shader's mask mode marks texels on the WARM_WHITE ramp green
  api.mode(2); const alb = K.snap(); api.mode(0);
  const blouse = [];
  for (let i = 0; i < alb.w * alb.h; i++) if (alb.d[i * 4 + 1] > alb.d[i * 4] + 40 && alb.d[i * 4 + 1] > alb.d[i * 4 + 2] + 40) blouse.push(i);
  R.push(['blouse found in albedo render', blouse.length > 2000, `${blouse.length} pixels`]);
  for (const [w, rng] of [['stage', C.stageHue], ['mirror', C.mirrorHue]]) {
    api.set({ world: w }); const im = K.snap(); let r = 0, g = 0, b = 0;
    for (const i of blouse) { r += im.d[i * 4]; g += im.d[i * 4 + 1]; b += im.d[i * 4 + 2]; }
    const n = Math.max(blouse.length, 1); const [h, s, v] = K.hsv(r / n, g / n, b / n);
    R.push([`${w}: blouse hue ${rng[0]}-${rng[1]}`, h >= rng[0] && h <= rng[1], `hue ${h.toFixed(0)}, sat ${s.toFixed(2)}, value ${v.toFixed(2)}`]);
    R.push([`${w}: blouse readable (value >= ${C.minValue})`, v >= C.minValue, v.toFixed(2)]);
  }
  api.set({ world: 'stage' });
  // shine only where the mask says (nose, buttons, shoes): never on the blouse
  api.spec(false); const s0 = K.snap(); api.spec(true); const s1 = K.snap();
  let changed = 0, onBlouse = 0; const bset = new Set(blouse);
  for (let i = 0; i < s0.w * s0.h; i++) { const d = Math.abs(s0.d[i * 4] - s1.d[i * 4]) + Math.abs(s0.d[i * 4 + 1] - s1.d[i * 4 + 1]) + Math.abs(s0.d[i * 4 + 2] - s1.d[i * 4 + 2]); if (d > 6) { changed++; if (bset.has(i)) onBlouse++; } }
  R.push(['shine shows, never on the blouse', changed > 0 && onBlouse === 0, `${changed} pixels shine, ${onBlouse} on the blouse`]);
  // face paint: full, none, half flaked
  const pa = K.snap(); api.set({ paint: 0 }); const p0 = K.snap(); api.set({ paint: 1, flake: 0.5 }); const pf = K.snap(); api.set({ flake: 0 });
  const full = K.diffCount(pa, p0), half = K.diffCount(pa, pf), share = half / Math.max(full, 1);
  R.push(['paint amount changes the face', full > 50, `${full} pixels`]);
  R.push([`flake 0.5 removes ${C.flakeShare[0]}-${C.flakeShare[1]} of the paint`, share >= C.flakeShare[0] && share <= C.flakeShare[1], share.toFixed(2)]);
  // outline stays on the body in every checked pose
  for (const [clip, t] of C.poses) {
    api.pose(clip, t); api.bg('#FFFFFF');
    api.show({ body: false, face: false, hull: true }); const hi = K.snap(); const H = K.mask(hi);
    api.show({ body: true, face: true, hull: false }); const bi = K.snap(); const B = K.dilate(K.mask(bi), bi.w, bi.h, C.dilate);
    let hn = 0, out = 0; for (let i = 0; i < H.length; i++) if (H[i]) { hn++; if (!B[i]) out++; }
    R.push([`outline stays on the body: ${clip} ${t}s`, hn > 500 && out / hn <= C.outsideMax, `${out} of ${hn} outline pixels outside`]);
  }
  api.show(all); api.bg(null);
  // restart twice through the hook
  window.__game.newRun(); window.__game.newRun(); api.render();
  R.push(['restart x2 via newRun', true]);
  return R;
}

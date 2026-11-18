// Step 5 gates for the ring scene. node check_step5.mjs <dir> [page] [shotPrefix]
// Waits on conditions (the test hook exists), never on wall-clock time; animation time is set, not waited for.
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // canvas size for the checks
  size: [1280, 800],
  // analysis downsample factor
  down: 2,
  // draw calls per frame on desktop, all passes (build plan step 5 gate)
  maxCalls: 150,
  // triangles per frame on desktop, all passes
  maxTris: 500000,
  // a pixel counts as drawn if any channel differs from the black backdrop by more than this
  tol: 12,
  // the clown must read in the spot: mean value (0..1) of his pixels at least (measured 0.65; key light at 15% gives 0.45)
  clownValue: 0.55,
  // key light on the clown at the ring edge, as a share of the centre value, at most
  edgeKey: 0.6,
  // bloom must grow the bright area around bulbs by at least this factor
  bloomGain: 1.5,
  // beam pixels at least
  beamMin: 1000,
  // shadow: floor pixels that change when the clown casts, at least
  shadowMin: 200,
  // confetti times checked, seconds
  confettiTimes: [0, 2.5, 5, 7.5, 10, 12.5, 13.9],
};
const [root, page = 'index.html', shot] = process.argv.slice(2);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) errs.push(`HTTP ${r.status()} ${r.url()}`); });
await p.setViewport({ width: CONFIG.size[0], height: CONFIG.size[1] });
await p.goto(`http://127.0.0.1:${srv.address().port}/${page}?test`);
const out = [];
try {
  await p.waitForFunction('window.__game && window.__game.api', { timeout: 300000 });
  await p.evaluate(installHelpers, CONFIG);
  for (const [n, ok, i] of await p.evaluate(runGates, CONFIG)) out.push(`${ok ? 'PASS' : 'FAIL'} ${n}${i !== undefined ? ' | ' + i : ''}`);
  if (shot) {
    await p.evaluate(() => { const a = window.__game.api; a.direct(false); a.only(['body', 'face', 'hull', 'set', 'crowd', 'confetti', 'sparkles', 'bulbs', 'beam', 'shadowFloor', 'blob']); a.bg(null); a.place(0, 0); a.time(5); a.pose('idle', 0.5); a.render(); });
    await p.screenshot({ path: `${shot}_ring.png` });
  }
} catch (e) { out.push('FAIL run | ' + String(e).slice(0, 300)); }
  // every control fully on screen at phone sizes (the page hides overflow, so a scroll check cannot see this);
  // switching to a mobile viewport reloads the page, so this runs last
  for (const [w, h] of [[390, 844], [844, 390]]) {
    await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
    await p.waitForSelector('.bar button');
    const off = await p.evaluate(() => [...document.querySelectorAll('.bar button, .bar input, .bar label')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth + 0.5 || r.top < 0 || r.bottom > innerHeight + 0.5; }).map((e) => e.id || e.textContent).slice(0, 5));
    out.push(`${off.length ? 'FAIL' : 'PASS'} controls on screen at ${w}x${h}${off.length ? ' | off screen: ' + off.join(', ') : ''}`);
  }
out.push(`${errs.length ? 'FAIL' : 'PASS'} no page or console errors${errs.length ? ' | ' + errs.slice(0, 3).join(' / ').slice(0, 300) : ''}`);
for (const l of out) console.log(l);
console.log(`RESULT ${out.filter((l) => l.startsWith('PASS')).length} of ${out.length} pass`);
await b.close(); srv.close();

// ---------------------------------------------------------------- page-side code
function installHelpers(C) {
  const api = window.__game.api, gl = document.getElementById('view');
  const c2 = document.createElement('canvas'); const g = c2.getContext('2d', { willReadFrequently: true });
  window.__chk = {
    snap() {
      api.render();
      c2.width = Math.floor(gl.width / C.down); c2.height = Math.floor(gl.height / C.down);
      g.drawImage(gl, 0, 0, c2.width, c2.height);
      return g.getImageData(0, 0, c2.width, c2.height).data;
    },
    drawn(d) { let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > C.tol || d[i + 1] > C.tol || d[i + 2] > C.tol) n++; return n; },
    bright(d, v) { let n = 0; for (let i = 0; i < d.length; i += 4) if ((d[i] + d[i + 1] + d[i + 2]) / 765 > v) n++; return n; },
    diff(a, b) { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 8) n++; return n; },
  };
}
function runGates(C) {
  const api = window.__game.api, K = window.__chk, R = [];
  const ALL = ['body', 'face', 'hull', 'set', 'crowd', 'confetti', 'sparkles', 'bulbs', 'beam', 'shadowFloor', 'blob'];
  api.isolate(false); api.direct(false); api.only(ALL); api.place(0, 0); api.time(5); api.pose('idle', 0.5);
  const info = api.render();
  R.push([`draw calls per frame <= ${C.maxCalls} (all passes)`, info.calls <= C.maxCalls, `${info.calls} calls`]);
  R.push([`triangles per frame <= ${C.maxTris}`, info.triangles <= C.maxTris, `${info.triangles}`]);
  // clown readable in the spot: his pixels found on a black backdrop with nothing else drawn, then read in the full scene
  api.direct(true); api.bg('#000000'); api.only(['body', 'face', 'hull']); const m = K.snap();
  api.only(ALL); api.bg(null); api.direct(false); const full = K.snap();
  let sum = 0, n = 0; for (let i = 0; i < m.length; i += 4) if (m[i] > C.tol || m[i + 1] > C.tol || m[i + 2] > C.tol) { sum += Math.max(full[i], full[i + 1], full[i + 2]) / 255; n++; }
  R.push([`clown readable in the spot (mean value >= ${C.clownValue})`, n > 500 && sum / n >= C.clownValue, `${(sum / Math.max(n, 1)).toFixed(2)} over ${n} pixels`]);
  // key light dims outside the pool
  const k0 = api.keyNow(); api.place(5.6, 0); const k1 = api.keyNow(); api.place(0, 0);
  R.push([`key light dims at the ring edge (<= ${C.edgeKey} of centre)`, k1 <= k0 * C.edgeKey, `${k1.toFixed(2)} vs ${k0.toFixed(2)}`]);
  // api.set re-applies the world (backdrop), so the black backdrop and the 'only' list go after each set
  const quiet = (list) => { api.direct(true); api.bg('#000000'); api.only(list); };
  // crowd: frozen at excitement 0, moving at 1
  api.set({ excite: 0 }); quiet(['crowd']); api.time(3); const c0 = K.snap(); api.time(3.37); const c1 = K.snap();
  api.set({ excite: 1 }); quiet(['crowd']); api.time(3); const c2 = K.snap(); api.time(3.37); const c3 = K.snap();
  api.set({ excite: 0.6 }); quiet(['crowd']);
  const blank = K.drawn((() => { api.only([]); return K.snap(); })());
  R.push(['black backdrop for mask passes (nothing drawn)', blank === 0, `${blank} pixels`]);
  R.push(['crowd freezes at excitement 0', K.diff(c0, c1) === 0, `${K.diff(c0, c1)} pixels moved`]);
  R.push(['crowd moves at excitement 1', K.diff(c2, c3) > 50, `${K.diff(c2, c3)} pixels moved`]);
  // confetti: nothing ever below the floor; some lands
  api.only(['confetti']); api.clipBelowFloor(true); let below = 0;
  for (const t of C.confettiTimes) { api.time(t); below += K.drawn(K.snap()); }
  api.clipBelowFloor(false); api.time(5); const seen = K.drawn(K.snap());
  R.push(['confetti never below the floor', below === 0 && seen > 200, `${below} pixels below, ${seen} visible`]);
  // beam visible
  api.only(['beam']); api.time(5); const beam = K.drawn(K.snap());
  R.push([`light beam visible (>= ${C.beamMin} pixels)`, beam >= C.beamMin, beam]);
  // clown shadow on the ring floor
  api.only(['shadowFloor', 'body', 'face']); api.bg('#FFFFFF');
  api.cast(true); const s1 = K.snap(); api.cast(false); const s0 = K.snap(); api.cast(true);
  R.push([`clown casts a shadow on the floor (>= ${C.shadowMin} pixels)`, K.diff(s0, s1) >= C.shadowMin, K.diff(s0, s1)]);
  // bloom: through the full post chain, bulbs only
  api.bg('#000000'); api.direct(false); api.only(['bulbs']);
  api.bloom(false); const b0 = K.bright(K.snap(), 0.25); api.bloom(true); const b1 = K.bright(K.snap(), 0.25);
  R.push([`bloom glows round the bulbs (x${C.bloomGain} bright area)`, b1 >= b0 * C.bloomGain && b0 > 0, `${b0} -> ${b1} pixels`]);
  api.bg(null); api.only(ALL);
  window.__game.newRun(); window.__game.newRun(); api.render();
  R.push(['restart x2 via newRun', true]);
  return R;
}

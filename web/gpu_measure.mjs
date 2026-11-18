// Real-GPU frame times on GitHub's Apple-silicon Mac runner (Metal through Chrome's ANGLE). node gpu_measure.mjs <dir> [page]
// First proves the route (Chrome reports a hardware WebGL renderer, not SwiftShader), then times frames on the default
// tier through to GPU completion (draw, then read one pixel back), so the time is the frame's real cost.
// (Timing requestAnimationFrame with vsync off measured how fast Chrome accepted frames, not the GPU: AO made no difference.)
// Governor locked during timing; the animation clock still runs.
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // Chrome on the macOS runner image
  chrome: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // setups timed: [width, height, screen pixel ratio, label]
  setups: [[1920, 1080, 1, '1080p desktop'], [1440, 900, 2, 'retina laptop'], [2560, 1440, 1, '1440p desktop']],
  // frames run before timing (shader and upload settling)
  warm: 30,
  // frames timed per setup
  frames: 240,
  // developer rule: frames must stay under this on the default tier, ms (95th percentile)
  budgetMs: 20,
};
const [root, page = 'index.html'] = process.argv.slice(2);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({
  executablePath: CONFIG.chrome, headless: 'new', protocolTimeout: 900000,
  // EXTRA_ARGS: extra Chrome flags for a local dry run (software GPU); the Mac run needs none
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', ...(process.env.EXTRA_ARGS || '').split(' ').filter(Boolean)],
});
const p = await b.newPage();
p.setDefaultTimeout(300000);
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
let pass = 0, fail = 0;
function gate(name, ok, info) { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${typeof info === 'string' ? info : JSON.stringify(info)}`); }
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${srv.address().port}/${page}?test`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game && window.__game.api);
const gl = await p.evaluate(() => {
  const g = document.createElement('canvas').getContext('webgl2'), x = g && g.getExtension('WEBGL_debug_renderer_info');
  return x ? { vendor: g.getParameter(x.UNMASKED_VENDOR_WEBGL), renderer: g.getParameter(x.UNMASKED_RENDERER_WEBGL) } : { renderer: 'none' };
});
gate('route: Chrome draws WebGL on the GPU, not in software', !/SwiftShader|llvmpipe|software|none/i.test(gl.renderer), gl);
// times n frames, each drawn and waited for on the GPU
const timeFrames = (n, warm) => p.evaluate((n, warm) => {
  const api = window.__game.api, t = [];
  for (let k = 0; k < n + warm; k++) {
    api.time(k / 60);
    const ms = api.renderSynced();
    if (k >= warm) t.push(ms);
  }
  return t;
}, n, warm);
const stats = (t) => { const s = [...t].sort((x, y) => x - y); const q = (v) => s[Math.min(s.length - 1, Math.floor(v * s.length))]; return { median: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) }; };
const rows = [];
for (const [w, h, sf, label] of CONFIG.setups) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: sf });
  await p.waitForFunction(() => { const c = document.getElementById('view'); return c.width === Math.round(c.clientWidth * Math.min(devicePixelRatio, 1.25)); });
  await p.evaluate(() => { const a = window.__game.api; a.governor(false); a.resetGovernor(); });
  for (const ao of [true, false]) {
    await p.evaluate((on) => window.__game.api.aoEnabled(on), ao);
    const s = stats(await timeFrames(CONFIG.frames, CONFIG.warm));
    const px = await p.evaluate(() => { const c = document.getElementById('view'); return `${c.width}x${c.height}`; });
    rows.push({ setup: label, pixels: px, ao, ...s });
    if (ao) gate(`${label} (${px}, default tier, AO on): frame p95 <= ${CONFIG.budgetMs} ms`, s.p95 <= CONFIG.budgetMs, s);
  }
}
const aoCost = rows.filter((r) => r.ao).map((r, i) => r.median - rows.filter((x) => !x.ao)[i].median);
gate('timing sees GPU work: AO on costs more than AO off at every setup', aoCost.every((d) => d > 0), aoCost.map((d) => +d.toFixed(2)));
console.log('frame times, ms (each frame waited for on the real GPU):');
for (const r of rows) console.log(`  ${r.setup.padEnd(14)} ${r.pixels.padEnd(10)} AO ${r.ao ? 'on ' : 'off'}  median ${r.median}  p95 ${r.p95}  max ${r.max}`);
gate('no page or console errors', errs.length === 0, errs.slice(0, 3));
console.log(`RESULT gpu ${pass} of ${pass + fail} pass`);
await b.close(); srv.close();
process.exit(fail ? 1 : 0);

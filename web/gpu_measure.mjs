// Real-GPU frame times on GitHub's Apple-silicon Mac runner (Metal through Chrome's ANGLE). node gpu_measure.mjs <dir> [page]
// First proves the route (Chrome reports a hardware WebGL renderer, not SwiftShader), then times frames on the default
// tier through to GPU completion (draw, then read one pixel back), so the time is the frame's real cost.
// (Timing requestAnimationFrame with vsync off measured how fast Chrome accepted frames, not the GPU: AO made no difference.)
// Governor locked during timing; the animation clock still runs.
// Control: node gpu_measure.mjs <dir> <page> <controlPage> times control, page, control in the same job (same VM), so
// the two control runs give the noise band and the page is judged against them, not against an older run on another VM.
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
  // page vs control: p95 may exceed the worse control run by this fraction plus the control noise band
  controlSlack: 0.10,
};
const [root, page = 'index.html', control] = process.argv.slice(2);
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
await p.goto(`http://localhost:${srv.address().port}/${control || page}?test`, { waitUntil: 'load' });
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
// loads a page in test mode and times every setup with AO on and off
async function measure(pg) {
  await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await p.goto(`http://localhost:${srv.address().port}/${pg}?test`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game && window.__game.api);
  const out = [];
  for (const [w, h, sf, label] of CONFIG.setups) {
    await p.setViewport({ width: w, height: h, deviceScaleFactor: sf });
    await p.waitForFunction(() => { const c = document.getElementById('view'); return c.width === Math.round(c.clientWidth * Math.min(devicePixelRatio, 1.25)); });
    await p.evaluate(() => { const a = window.__game.api; a.governor(false); a.resetGovernor(); });
    for (const ao of [true, false]) {
      await p.evaluate((on) => window.__game.api.aoEnabled(on), ao);
      const st = stats(await timeFrames(CONFIG.frames, CONFIG.warm));
      const px = await p.evaluate(() => { const c = document.getElementById('view'); return `${c.width}x${c.height}`; });
      out.push({ page: pg, setup: label, pixels: px, ao, ...st });
    }
  }
  return out;
}
const ctlA = control ? await measure(control) : [];
const rows = await measure(page);
const ctlB = control ? await measure(control) : [];
for (const r of rows) if (r.ao) gate(`${r.setup} (${r.pixels}, default tier, AO on): frame p95 <= ${CONFIG.budgetMs} ms`, r.p95 <= CONFIG.budgetMs, { median: r.median, p95: r.p95, max: r.max });
if (control) {
  rows.forEach((r, i) => {
    const a = ctlA[i].p95, b = ctlB[i].p95, noise = Math.abs(a - b), lim = +(Math.max(a, b) * (1 + CONFIG.controlSlack) + noise).toFixed(2);
    gate(`${r.setup} AO ${r.ao ? 'on' : 'off'}: p95 not worse than the control page in the same job`, r.p95 <= lim,
      { page: r.p95, controlBefore: a, controlAfter: b, noise: +noise.toFixed(2), limit: lim });
  });
}
const aoCost = rows.filter((r) => r.ao).map((r, i) => r.median - rows.filter((x) => !x.ao)[i].median);
gate('timing sees GPU work: AO on costs more than AO off at every setup', aoCost.every((d) => d > 0), aoCost.map((d) => +d.toFixed(2)));
console.log('frame times, ms (each frame waited for on the real GPU):');
for (const r of [...ctlA, ...rows, ...ctlB]) console.log(`  ${r.page.padEnd(12)} ${r.setup.padEnd(14)} ${r.pixels.padEnd(10)} AO ${r.ao ? 'on ' : 'off'}  median ${r.median}  p95 ${r.p95}  max ${r.max}`);
gate('no page or console errors', errs.length === 0, errs.slice(0, 3));
console.log(`RESULT gpu ${pass} of ${pass + fail} pass`);
await b.close(); srv.close();
process.exit(fail ? 1 : 0);

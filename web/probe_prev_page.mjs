// Session 33, F44: the gpu job's shop A/B serves night1.html from an older commit (NIGHT1_PREV_SHA) against the current step0 assets.
// This loads such a copy the way gpu_night1.mjs does and prints PASS when it is ready with no page errors, FAIL otherwise.
// Usage: node probe_prev_page.mjs <web/step0 dir> <html file in that dir>; EXTRA_ARGS='--use-angle=swiftshader' off the Mac runner.
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // Chrome: the runner's by default, CHROME env to override
  chrome: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // how long the page may take to reach ready (the A/B uses the same 120 s), ms
  readyMs: 120000,
};
const [root, file] = [process.argv[2] || 'step0', process.argv[3] || 'night1_prev.html'];
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({ executablePath: CONFIG.chrome, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', ...(process.env.EXTRA_ARGS || '').split(' ').filter(Boolean)] });
const p = await b.newPage(), errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
let ready = false;
try {
  await p.goto(`http://localhost:${srv.address().port}/${file}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__night && window.__night.S.ready, { timeout: CONFIG.readyMs });
  ready = true;
} catch (e) { errs.push('not ready: ' + String(e).split('\n')[0]); }
const ok = ready && errs.length === 0;
console.log(`${ok ? 'PASS' : 'FAIL'} ${file} ready with no page errors against the current ${root} assets | ${JSON.stringify({ ready, errors: errs.slice(0, 3) })}`);
await b.close(); srv.close();
process.exit(ok ? 0 : 1);

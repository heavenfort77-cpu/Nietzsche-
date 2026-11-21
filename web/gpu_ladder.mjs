// Profile ladder for the 1440p GPU miss (rule 28: profile before any cut that changes the look).
// Times one page on the Mac GPU, layer by layer, at 1440p and 1080p, then the pixel-cap candidate (render scale 0.75).
// Same timing as gpu_measure.mjs: each frame drawn and waited for on the GPU (one pixel read back).
// node gpu_ladder.mjs <dir> [page]
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os'; import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // Chrome on the macOS runner image
  chrome: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // setups: [width, height, screen pixel ratio, label]
  setups: [[2560, 1440, 1, '1440p'], [1920, 1080, 1, '1080p']],
  // frames run before timing, frames timed per rung
  warm: +(process.env.WARM || 30), frames: +(process.env.FRAMES || 180),
  // every part the scene can show (game page showOnly names)
  all: ['body', 'face', 'hull', 'set', 'crowd', 'scatter', 'confetti', 'sparkles', 'bulbs', 'beam', 'shadowFloor', 'blob'],
};
// rungs: [label, visible parts ('all' or a list), direct (no post), AO, bloom, render scale or null]
const RUNGS = [
  ['empty canvas, no post', [], true, false, true, null],
  ['scene, no post', 'all', true, false, true, null],
  ['empty canvas + post, AO off', [], false, false, true, null],
  ['scene + post, AO off', 'all', false, false, true, null],
  ['scene + post, AO off, bloom off', 'all', false, false, false, null],
  ['scene + post, AO on (default now)', 'all', false, true, true, null],
  ['scene + post, AO off, scale 0.75', 'all', false, false, true, 0.75],
  ['scene + post, AO on, scale 0.75', 'all', false, true, true, 0.75],
  ['empty canvas, no post (again: drift)', [], true, false, true, null],
];
const [root, page = 'index.html'] = process.argv.slice(2);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({ executablePath: CONFIG.chrome, headless: 'new', protocolTimeout: 900000,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', ...(process.env.EXTRA_ARGS || '').split(' ').filter(Boolean)] });
const sh = (c) => { try { return execSync(c).toString().trim().replace(/\s+/g, ' '); } catch { return '?'; } };
console.log(`ENV chrome ${await b.version()} | os ${sh('sw_vers -productVersion')} ${sh('sw_vers -buildVersion')} | image ${process.env.ImageVersion || '?'} | cpus ${os.cpus().length} | assets ${['clown_v2.glb', 'ring_set.glb', 'crowd_cards.png'].map((f) => { try { return f + ' ' + fs.statSync(path.join(root, 'assets', f)).size; } catch { return f + ' ?'; } }).join(', ')}`);
const p = await b.newPage();
p.setDefaultTimeout(300000);
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${srv.address().port}/${page}?test`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game && window.__game.api);
console.log('GPU', JSON.stringify(await p.evaluate(() => {
  const g = document.createElement('canvas').getContext('webgl2'), x = g && g.getExtension('WEBGL_debug_renderer_info');
  return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'none';
})));
const stats = (t) => { const s = [...t].sort((x, y) => x - y); const q = (v) => s[Math.min(s.length - 1, Math.floor(v * s.length))]; return { median: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) }; };
for (const [w, h, sf, label] of CONFIG.setups) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: sf });
  await p.evaluate(() => { const a = window.__game.api; a.governor(false); a.dprLevel(0); });
  for (const [name, vis, direct, ao, bloom, scale] of RUNGS) {
    const info = await p.evaluate((vis, direct, ao, bloom, scale, all) => {
      const a = window.__game.api;
      a.only(vis === 'all' ? all : vis); a.direct(direct); a.aoEnabled(ao); a.bloom(bloom);
      return a.scale(scale);
    }, vis, direct, ao, bloom, scale, CONFIG.all);
    const t = await p.evaluate((n, warm) => {
      const api = window.__game.api, out = [];
      for (let k = 0; k < n + warm; k++) { api.time(k / 60); const ms = api.renderSynced(); if (k >= warm) out.push(ms); }
      return out;
    }, CONFIG.frames, CONFIG.warm);
    const st = stats(t);
    console.log(`LADDER ${label.padEnd(6)} ${name.padEnd(38)} buffer ${info.w}x${info.h}  median ${st.median}  p95 ${st.p95}  max ${st.max}`);
  }
  await p.evaluate(() => window.__game.api.scale(null));
}
await b.close(); srv.close();

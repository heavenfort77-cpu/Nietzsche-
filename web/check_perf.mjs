// Performance gates: one per finding in the Dawnpunk lag report (Nov 18, 2026), so this game cannot drift into it.
// node check_perf.mjs <dir> [page]. Counts are exact in headless Chrome; frame times there are not real FPS,
// so the frame governor is tested by feeding it frame times, not by timing the software GPU.
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';

// CONFIG ---------------------------------------------------------------
const CONFIG = {
  // desktop sizes checked (the master version); the largest is the worst case
  sizes: [[1366, 768], [1920, 1080]],
  // 1. scene density stays at or above the desktop floors (crowd, scatter, confetti, bulbs) ...
  density: { crowd: 500, scatter: 2000, confetti: 2500, bulbs: 250 },
  // ... while triangles per frame, all passes, stay under this
  maxTris: 500000,
  // 2. ambient occlusion: its triangles at most this share of the scene's (a second scene render would add 100%),
  // and at most this many full-screen passes (Medium quality measured 13; a higher mode adds more)
  aoMaxTriShare: 0.02, aoMaxPasses: 16,
  // 3. draw calls per frame, all passes (Dawnpunk: 1,760)
  maxCalls: 150,
  // 4. meshes that skip frustum culling: none (developer rule; enlarge bounds instead)
  // 5. texture memory on the GPU, MB, mipmaps included (Dawnpunk: about 500 MB)
  maxTexMB: 64,
  // 6. desktop starts at this pixel ratio, and never goes above it (developer rule: 1.25 at most)
  startDpr: 1.25,
  // 5. texture anisotropy at most (developer rule)
  maxAniso: 4,
  // 2. AO samples at most (developer rule: 4 to 8)
  aoMaxSamples: 8,
  // 7. light objects in the scene, at most (the shadow-only spot); lit materials (Standard, Physical, ...) none
  maxLights: 1,
  // 8. shadow map size at most, and triangles that cast shadows at most
  maxShadowMap: 2048, maxCasterTris: 40000,
  // 9. bytes fetched before the first frame, MB, and requests during play: none
  maxLoadMB: 20, maxPageKB: 200,
  // 10. HUD writes per frame at most (twice a second at 60 fps is 0.033), matchMedia calls during play: none
  maxHudPerFrame: 0.1,
  // frames run to measure per-frame work
  frames: 60,
};
const [root, page = 'index.html'] = process.argv.slice(2);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], protocolTimeout: 900000 });
const p = await b.newPage();
p.setDefaultTimeout(300000);
const errs = []; let bytes = 0, playing = false; const lateReq = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) errs.push(`HTTP ${r.status()} ${r.url()}`); });
p.on('requestfinished', async (r) => {
  if (playing) { lateReq.push(r.url()); return; }
  try { bytes += (await r.response().buffer()).length; } catch (e) { /* redirects have no body */ }
});
// count DOM writes to the HUD and matchMedia calls from the page's own code
await p.evaluateOnNewDocument(() => {
  window.__mm = 0; const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => { window.__mm++; return mm(q); };
});
let pass = 0, fail = 0;
function gate(name, ok, info) { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${typeof info === 'string' ? info : JSON.stringify(info)}`); }
const port = srv.address().port;
// the 2x start check uses its own size: emulated pixel-ratio changes fire no events, real size changes do
await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
await p.goto(`http://localhost:${port}/${page}?test`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game && window.__game.api);
const api = (fn, ...a) => p.evaluate((f, args) => window.__game.api[f](...args), fn, a);
const pageKB = fs.statSync(path.join(root, page)).size / 1024;
gate('9. load: bytes before the first frame <= ' + CONFIG.maxLoadMB + ' MB, page <= ' + CONFIG.maxPageKB + ' KB (no inlined base64 assets)',
  bytes / 1048576 <= CONFIG.maxLoadMB && pageKB <= CONFIG.maxPageKB, `${(bytes / 1048576).toFixed(1)} MB fetched, page ${pageKB.toFixed(0)} KB`);
// 6 first: the starting pixel ratio on a desktop with a 2x screen, before any test changes it
let a = await api('audit');
gate('6. desktop starts at a medium pixel ratio, not the maximum', a.dpr === CONFIG.startDpr, `start ${a.dpr} on a 2x screen`);
const before = await api('feedFrames', 16.7, 1);
const up = await api('feedFrames', 16.7, 900);
const down = await api('feedFrames', 33, 130);
const held = await api('feedFrames', 16.7, 600);
let slow = await api('feedFrames', 40, 2000);
const countsSlow = await api('counts');
gate('6. governor: never above ' + CONFIG.startDpr + ', softer on slow frames, never back to a level that was slow, AO off last',
  before.dpr === CONFIG.startDpr && up.dpr <= CONFIG.startDpr && down.dpr < up.dpr && held.dpr <= down.dpr && held.level >= held.cap && slow.dpr === 1 && slow.ao === false,
  { start: before.dpr, afterFast: up.dpr, afterSlow: down.dpr, afterFastAgain: held.dpr, floor: slow.dpr, aoAtFloor: slow.ao });
gate('6. governor never cuts scene density', Object.entries(CONFIG.density).every(([k, v]) => countsSlow[k] >= v), countsSlow);
await api('resetGovernor');
for (const [w, h] of CONFIG.sizes) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.waitForFunction(() => { const c = document.getElementById('view'); return c.width === Math.round(c.clientWidth * Math.min(devicePixelRatio, 1.25)); });
  await api('set', { world: 'stage', confetti: true }); await api('time', 3);
  const r = await api('render');
  const c = await api('counts');
  gate(`1. ${w}x${h}: density held and triangles <= ${CONFIG.maxTris} (all passes)`,
    r.triangles <= CONFIG.maxTris && Object.entries(CONFIG.density).every(([k, v]) => c[k] >= v), { tris: r.triangles, ...c });
  gate(`3. ${w}x${h}: draw calls <= ${CONFIG.maxCalls} (all passes)`, r.calls <= CONFIG.maxCalls, `${r.calls} calls`);
}
// 2. AO cost: calls with AO on minus AO off, at the largest size
const aoOn = await api('render');
await p.evaluate(() => window.__game.api.aoEnabled(false));
const aoOffR = await api('render');
await p.evaluate(() => window.__game.api.aoEnabled(true));
a = await api('audit');
gate('2. ambient occlusion: no second scene render, full-screen passes only, half resolution',
  aoOn.triangles - aoOffR.triangles <= CONFIG.aoMaxTriShare * aoOffR.triangles && aoOn.calls - aoOffR.calls <= CONFIG.aoMaxPasses && a.aoHalf === true && a.aoSamples <= CONFIG.aoMaxSamples,
  { extraCalls: aoOn.calls - aoOffR.calls, extraTris: aoOn.triangles - aoOffR.triangles, halfRes: a.aoHalf, samples: a.aoSamples });
gate('4. frustum culling: no mesh skips it', a.noCull.length === 0, a.noCull);
gate('5. texture memory <= ' + CONFIG.maxTexMB + ' MB, anisotropy <= ' + CONFIG.maxAniso, a.texMB <= CONFIG.maxTexMB && a.maxAniso <= CONFIG.maxAniso,
  `${a.texMB.toFixed(1)} MB, anisotropy ${a.maxAniso}`);
gate('7. lights <= ' + CONFIG.maxLights + ', none at intensity 0, no lit (Standard/Physical/Lambert/Phong) materials',
  a.lights <= CONFIG.maxLights && a.zeroLights === 0 && a.lit.length === 0, { lights: a.lights, zero: a.zeroLights, lit: a.lit });
gate('8. shadow map <= ' + CONFIG.maxShadowMap + ', casters <= ' + CONFIG.maxCasterTris + ' tris', a.shadowMap <= CONFIG.maxShadowMap && a.casterTris <= CONFIG.maxCasterTris,
  { map: a.shadowMap, casterTris: a.casterTris });
// 11. no first-use hitches: cycling every state compiles no new shader and uploads no new texture
const progs0 = a.programs, tex0 = a.textures;
await p.evaluate(() => {
  const api = window.__game.api;
  const confettiButton = document.getElementById('confetti');
  for (const world of ['mirror', 'stage']) for (const face of ['sad', 'smile', 'startle', 'wince']) for (const outline of [false, true])
    for (let k = 0; k < 2; k++) { api.set({ world, face, outline }); confettiButton.click(); api.render(); }
  for (const clip of ['walk', 'slap', 'idle']) { api.pose(clip, 0.3); api.render(); }
});
a = await api('audit');
gate('11. no shader compiles or texture uploads after loading (warm-up covers every state)', a.programs === progs0 && a.textures === tex0,
  { programs: [progs0, a.programs], textures: [tex0, a.textures] });
// 10 and 9b: per-frame work during real play
await p.evaluate(() => {
  window.__hudWrites = 0;
  new MutationObserver((l) => { window.__hudWrites += l.length; }).observe(document.getElementById('hud'), { childList: true, characterData: true, subtree: true });
  window.__mm = 0; window.__game.api.set({ paused: false });
});
playing = true;
const frames = await p.evaluate((n) => new Promise((res) => { let k = 0; const f = () => { if (++k >= n) res(k); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), CONFIG.frames);
playing = false;
const per = await p.evaluate(() => ({ hud: window.__hudWrites, mm: window.__mm }));
gate('10. per frame: HUD written at most ' + CONFIG.maxHudPerFrame + ' times, no matchMedia calls', per.hud / frames <= CONFIG.maxHudPerFrame && per.mm === 0,
  { frames, hudWrites: per.hud, matchMedia: per.mm });
gate('9. no requests during play', lateReq.length === 0, lateReq.slice(0, 3));
// 12. phones drop the WebGL context in the background: the game must wait and come back drawing
await api('loseContext', true);
await p.waitForFunction(() => window.__game.api.lost());
await api('loseContext', false);
await p.waitForFunction(() => !window.__game.api.lost(), { timeout: 60000 }).catch(() => {});
const back = await api('render'), stillLost = await api('lost');
gate('12. WebGL context lost and restored: the game draws again', !stillLost && back.calls > 0 && back.triangles > 0, { lost: stillLost, calls: back.calls, tris: back.triangles });
gate('no page or console errors', errs.length === 0, errs.slice(0, 3));
console.log(`RESULT perf ${pass} of ${pass + fail} pass`);
await b.close(); srv.close();
process.exit(fail ? 1 : 0);

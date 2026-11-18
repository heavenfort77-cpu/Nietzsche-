// Runtime check for a single-file HTML game in headless Chromium.
// Usage: node check-runtime.cjs game.html [outDir] [seconds]
// Opens the game with ?test at four sizes, plays with touch/mouse/keys, restarts twice through
// window.__game.newRun() when present, and fails on page errors, console errors, network after load,
// horizontal scroll, or a blank canvas. Headless frame rate says nothing about phone speed.
const path = require('path');
const fs = require('fs');
function need(name) {
  for (const t of [name, '/opt/npm-tools/node_modules/' + name]) { try { return require(t); } catch (e) {} }
  console.error('Missing ' + name + ' (npm i ' + name + ')'); process.exit(2);
}
const { chromium } = need('playwright-core');
const http = require('http');

const file = path.resolve(process.argv[2] || '');
const out = path.resolve(process.argv[3] || 'check-out');
const secs = Number(process.argv[4] || 10);
if (!fs.existsSync(file)) { console.error('usage: node check-runtime.cjs game.html [outDir] [seconds]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const SIZES = [
  { name: 'phone-portrait', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'phone-landscape', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'laptop', viewport: { width: 1366, height: 768 } },
  { name: 'ultrawide', viewport: { width: 2560, height: 1080 } },
];
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];

(async () => {
  // local http server: ES module imports do not load from file://
  const root = path.dirname(file);
  const srv = http.createServer((q, s) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } const t = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream'; s.writeHead(200, { 'Content-Type': t }); s.end(d); }); }).listen(0);
  const origin = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  let failTotal = 0;
  for (const size of SIZES) {
    const fails = [], notes = [];
    const ctx = await browser.newContext(size);
    const page = await ctx.newPage();
    // software rendering takes seconds per frame: screenshots and waits get a generous cap (skill 4b)
    page.setDefaultTimeout(300000);
    let loaded = false;
    page.on('pageerror', (e) => fails.push('page error: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fails.push('console error: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) fails.push('HTTP ' + r.status() + ' ' + r.url()); });
    page.on('request', (r) => { const u = r.url(); if (loaded && !/^(file|data|blob|about):/.test(u) && !u.startsWith(origin)) fails.push('network after load: ' + u); });
    await page.goto(origin + '/' + path.basename(file) + '?test', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game, null, { timeout: 240000 });
    loaded = true;
    await page.waitForTimeout(500);
    const { w, h } = { w: size.viewport.width, h: size.viewport.height };
    const tap = async (x, y) => { if (size.hasTouch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    await tap(w / 2, h / 2); // audio unlock / start
    const t0 = Date.now(); let i = 0;
    while (Date.now() - t0 < secs * 1000) {
      const k = KEYS[i % KEYS.length];
      await page.keyboard.down(k); await page.waitForTimeout(120); await page.keyboard.up(k);
      if (i % 3 === 0) await tap((0.2 + 0.6 * ((i * 37) % 100) / 100) * w, (0.3 + 0.4 * ((i * 53) % 100) / 100) * h);
      i++;
    }
    const hook = await page.evaluate(() => !!(window.__game && typeof window.__game.newRun === 'function'));
    if (hook) {
      for (let r = 0; r < 2; r++) {
        await page.evaluate(() => window.__game.newRun());
        await tap(w / 2, h / 2);
        for (const k of KEYS.slice(0, 5)) { await page.keyboard.press(k); await page.waitForTimeout(150); }
      }
      notes.push('restart x2 via __game.newRun()');
    } else notes.push('no window.__game.newRun test hook: restart NOT tested');
    const m = await page.evaluate(() => ({
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      canvases: [...document.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: c.width, h: c.height, cw: Math.round(r.width), ch: Math.round(r.height) }; }),
    }));
    if (m.hscroll) fails.push('horizontal page scroll');
    const shot = path.join(out, size.name + '.png');
    await page.screenshot({ path: shot });
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: w, height: h } });
    const px = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 64, 64);
      const d = g.getImageData(0, 0, 64, 64).data; const set = new Set();
      for (let j = 0; j < d.length; j += 4) set.add((d[j] >> 4) + ',' + (d[j + 1] >> 4) + ',' + (d[j + 2] >> 4));
      return set.size;
    }, buf.toString('base64'));
    if (px < 3) fails.push('screen looks blank (' + px + ' colours)');
    const fps = await page.evaluate(() => new Promise(res => { let n = 0; const s = performance.now(); (function f() { n++; if (performance.now() - s < 1000) requestAnimationFrame(f); else res(n); })(); }));
    console.log(`[${size.name}] ${w}x${h}  canvases=${JSON.stringify(m.canvases)}  headless-fps=${fps}  ${notes.join('; ')}  shot=${shot}`);
    [...new Set(fails)].forEach(f => console.log('  FAIL ' + f));
    failTotal += new Set(fails).size;
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log(`RESULT ${failTotal ? 'FAIL' : 'PASS'}  fails=${failTotal}`);
  process.exit(failTotal ? 1 : 0);
})().catch(e => { console.error('runner error: ' + e.message); process.exit(2); });

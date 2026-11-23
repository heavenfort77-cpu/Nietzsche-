// Session 25 probe (F35): the shop at the mirror on every screen and night. For each: every item and End the night must have its centre on screen
// and hit itself (as probe_cover.cjs), and the card's content must cover at most 5% of the reflection's box in the glass (as the smoke's fix 5 step),
// seated and while the reflection performs a buy (learn phase 2). Prints FAIL lines and RESULT shop probe <ok> of <n>.
// Also: no two parts of the card overlap (their content included).
// Usage: node probe_shop.cjs [web/step0 dir]; SHOTS=<dir> saves each shop after its buy; ONLY_SCREEN=<name> one screen; needs cube25d/setup.sh.
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = path.resolve(process.argv[2] || __dirname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const SCREENS = [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'hd', w: 1920, h: 1080, m: false }, { n: 'laptop', w: 1366, h: 768, m: false }, { n: 'small', w: 1024, h: 600, m: false },
  { n: 'phone', w: 390, h: 844, m: true }, { n: 'land', w: 844, h: 390, m: true }, { n: 'tablet', w: 768, h: 1024, m: true }, { n: 'wide', w: 2560, h: 1080, m: false }];
// nights and their shop: night 1 (fall and sweep tried), night 2 (scale tried), night 3 (every act tried, the most items)
const NIGHTS = [['', 'night 1'], ['#n=2&m=3&s=40&b=&t=sweep.scale&lo=0', 'night 2'], ['#n=3&m=6&s=60&b=&t=sweep.scale.drill&lo=1', 'night 3']];
const reach = () => Array.from(document.querySelectorAll('#card_shop .opt, #card_shop #endNight')).map((x) => {
  const q = x.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2, hit = document.elementFromPoint(cx, cy);
  return { id: x.id || 'opt:' + (x.dataset.id || ''), off: cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight, ok: !!hit && (hit === x || x.contains(hit)), h: Math.round(q.height), by: hit ? (hit.id || hit.className || hit.tagName) + (hit.parentElement ? ' in ' + (hit.parentElement.id || hit.parentElement.className || hit.parentElement.tagName) : '') : 'none', at: [Math.round(cx), Math.round(cy)] };
});
// the card's own parts never lie over each other (run 99: the shard row kept 22 px while its three rows of shards drew over the first item)
const overlap = () => {
  const els = Array.from(document.querySelectorAll('#card_shop > *, #card_shop .opts > *')).filter((e) => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && !e.classList.contains('opts'); });
  const box = (e) => { const q = e.getBoundingClientRect(); let r = q.right, bt = q.bottom; for (const c of e.querySelectorAll('*')) { const k = c.getBoundingClientRect(); if (k.width && k.height) { r = Math.max(r, k.right); bt = Math.max(bt, k.bottom); } } return [q.left, q.top, r, bt]; };
  const out = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
    const a = box(els[i]), b = box(els[j]), w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
    if (w > 1 && h > 1) out.push(`${els[i].id || els[i].className || els[i].tagName} over ${els[j].id || els[j].dataset.id || els[j].className || els[j].tagName} by ${Math.round(h)} px`);
  }
  return out;
};
const cover = () => {
  // the reflection's box inside the glass (canvas px, offset by the canvas box), as in smoke_night1.cjs step "shop at the mirror ... (fix 5)"
  const N = window.__night, W = window.__walkTest, w = N.S.w, h = N.S.h, m = N.NS.mrect, cb = W.renderer.domElement.getBoundingClientRect();
  const p = (y) => { const v = N.refl.root.position.clone(); v.y += y; v.project(W.roomCam); return [cb.left + (v.x + 1) / 2 * w, cb.top + (1 - v.y) / 2 * h]; };
  const top = p(1.9), feet = p(0), hw = (feet[1] - top[1]) * 0.25;
  const gx0 = cb.left + m[0], gx1 = gx0 + m[2], gy0 = cb.top + h - m[1] - m[3], gy1 = cb.top + h - m[1];
  const box = [Math.max(gx0, top[0] - hw), Math.max(gy0, top[1]), Math.min(gx1, top[0] + hw), Math.min(gy1, feet[1])];
  const area = Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
  let worst = 0, who = '';
  for (const el of N.NS.card.children) {
    const r = el.getBoundingClientRect();
    const o = Math.max(0, Math.min(box[2], r.right) - Math.max(box[0], r.left)) * Math.max(0, Math.min(box[3], r.bottom) - Math.max(box[1], r.top));
    if (o / Math.max(1, area) > worst) { worst = o / Math.max(1, area); who = el.id || el.className || el.tagName; }
  }
  return { area: Math.round(area), worst, who };
};
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/night1.html`;
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  let n = 0, fails = 0;
  const fail = (s) => { fails++; console.log('FAIL ' + s); };
  for (const sc of SCREENS.filter((s) => !process.env.ONLY_SCREEN || process.env.ONLY_SCREEN.split(',').indexOf(s.n) >= 0)) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    for (const [hash, name] of NIGHTS) {
      const pg = await ctx.newPage();
      await pg.goto(base + hash); if (hash) await pg.reload();
      await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
      await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 30000 });
      await pg.evaluate(() => { const N = window.__night; document.getElementById('curtain').classList.add('hidden'); N.NS.learn = null; N.shopCard(); });
      await pg.waitForSelector('#card_shop'); await pg.waitForTimeout(400);
      const where = `${sc.n} ${sc.w}x${sc.h} ${name}`;
      const r = await pg.evaluate(reach);
      for (const x of r) { n++; if (x.off || !x.ok) fail(`${where}: ${x.id} ${x.off ? 'off screen' : 'covered by ' + x.by} at ${x.at}`); }
      const ov = await pg.evaluate(overlap); n++;
      if (ov.length) fail(`${where}: card parts overlap: ${ov.slice(0, 3).join('; ')}`);
      const c0 = await pg.evaluate(cover); n++;
      if (c0.area < 400) fail(`${where}: reflection not visible in the glass (${c0.area} px2)`); else if (c0.worst > 0.05) fail(`${where}: shop card covers ${(c0.worst * 100).toFixed(0)}% of the seated reflection (${c0.who})`);
      // one buy: the reflection stands, steps closer and performs it
      const can = await pg.$('#card_shop .opt:not([disabled])');
      if (can) {
        await pg.evaluate(() => document.querySelector('#card_shop .opt:not([disabled])').click());
        await pg.waitForFunction(() => { const L = window.__night.NS.learn; return L && L.phase === 2; }, null, { timeout: 60000 });
        const c1 = await pg.evaluate(cover); n++;
        if (c1.area < 400) fail(`${where}: performing reflection not visible in the glass (${c1.area} px2)`); else if (c1.worst > 0.05) fail(`${where}: shop card covers ${(c1.worst * 100).toFixed(0)}% of the performing reflection (${c1.who})`);
        const r2 = await pg.evaluate(reach);
        for (const x of r2) { n++; if (x.off || !x.ok) fail(`${where} after a buy: ${x.id} ${x.off ? 'off screen' : 'covered by ' + x.by} at ${x.at}`); }
      }
      console.log(`  ${where}: ${r.length} buttons, reflection covered ${(c0.worst * 100).toFixed(0)}% seated`);
      if (process.env.SHOTS) await pg.screenshot({ path: `${process.env.SHOTS}/shop_${sc.n}_${name.replace(' ', '')}.png` });
      await pg.close();
    }
    await ctx.close();
  }
  console.log(`RESULT shop probe ${n - fails} of ${n} pass`);
  await b.close(); srv.close();
  process.exitCode = fails ? 1 : 0;
})().catch((e) => { console.log('FAIL shop probe crashed: ' + (e && e.stack || e)); process.exit(1); });

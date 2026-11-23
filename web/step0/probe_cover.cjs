// F33/F34 probe (session 24): controls covering each other or off screen. For each scene state reached (title, Dazai card, board, note, rehearsal, shop,
// end card; nights 1 and 3; desk, phone, landscape), every visible enabled button's centre must hit that button, except where a full-screen card,
// the curtain or the cue frame is meant to sit over it. Run: node probe_cover.cjs [web/step0 dir]
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', '/opt/npm-tools/node_modules/playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = path.resolve(process.argv[2] || __dirname);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.ktx2': 'image/ktx2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0, probes = 0;
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  for (const sc of [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'phone', w: 390, h: 844, m: true }, { n: 'land', w: 844, h: 390, m: true }]) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage();
    // fullscreen is not enabled in headless Chrome: show the button as a real browser would
    await pg.addInitScript(() => { Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => true }); });
    const probe = async (where) => {
      const r = await pg.evaluate(() => Array.from(document.querySelectorAll('button')).filter((x) => { const q = x.getBoundingClientRect(), s = getComputedStyle(x); return q.width > 0 && q.height > 0 && s.visibility !== 'hidden' && s.pointerEvents !== 'none' && !x.closest('.hidden') && !x.disabled; })
        .map((x) => { const q = x.getBoundingClientRect(), cx = q.left + q.width / 2, cy = q.top + q.height / 2, hit = document.elementFromPoint(cx, cy); const modal = !!hit && !!(hit.closest('.card') || hit.closest('#curtain') || hit.id === 'cueFrame') && !(x.closest('.card') || x.closest('#curtain')) && x.id !== 'tryBack'; return { id: x.id || x.className + ':' + x.textContent.slice(0, 14), ok: !!hit && (hit === x || x.contains(hit) || modal), by: hit ? (hit.id || hit.tagName + '.' + hit.className) : 'none', off: cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight }; }));
      for (const x of r) { probes++; if (!x.ok || x.off) { fails++; console.log(`FAIL ${sc.n} ${where}: button ${x.id} covered by ${x.by}${x.off ? ' (off screen)' : ''}`); } }
      console.log(`  ${sc.n} ${where}: ${r.length} buttons checked`);
    };
    const go = async (hash) => { await pg.goto(base + 'night1.html' + hash); if (hash) await pg.reload(); await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 }); };
    for (const hash of ['', '#n=3&m=6&s=30&b=sweep.scale&t=sweep.scale&lo=1']) {
      await go(hash); await sleep(3400);
      await probe('title' + hash.slice(0, 4));
      await pg.click('#start'); await sleep(1500);
      await pg.mouse.click(sc.w / 2, sc.h / 3); await pg.waitForSelector('#card_dazai', { timeout: 30000 });
      await probe('dazai card' + hash.slice(0, 4));
      await pg.click('#goOut');
      await pg.waitForFunction(() => window.__night.S.roomView === 'board' && !document.getElementById('boardActs').classList.contains('hidden'), null, { timeout: 30000 }); await sleep(500);
      await probe('board' + hash.slice(0, 4));
      await pg.evaluate(() => window.__night.pickAct(window.__night.NS.acts[window.__night.NS.acts.length - 1].id)); await sleep(300);
      await probe('note' + hash.slice(0, 4));
      await pg.evaluate(() => document.getElementById('tryAct').click());
      await pg.waitForFunction(() => document.getElementById('tryBack'), null, { timeout: 20000 }); await sleep(800);
      await probe('rehearse' + hash.slice(0, 4));
      await pg.evaluate(() => document.getElementById('tryBack').click()); await sleep(300);
      await pg.evaluate(() => { const N = window.__night; N.NS.learn = null; N.shopCard(); }); await sleep(300);
      await probe('shop' + hash.slice(0, 4));
      await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.actInfo = { perfects: 3, goods: 1, misses: 1, actLaughs: 40 }; NS.act = 'fall'; NS.result = 'win'; NS.met = []; NS.beaten = []; N.endCard(); }); await sleep(300);
      await probe('end card' + hash.slice(0, 4));
    }
    await ctx.close();
  }
  console.log(`RESULT cover probe ${probes - fails} of ${probes} buttons reachable`);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });

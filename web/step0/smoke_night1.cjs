// One pass through night1.html in GDD order (desktop 1280x720, phone 390x844): page errors, each scene reached, a few frames.
// Needs web/step0/cube25d/setup.sh first. Usage: node web/step0/smoke_night1.cjs [out dir]; ONLY=desk|phone; CHROME=<path>; N_AT=out|in|both overrides N1.nietzscheAt.
// Waits are on game state (software GL runs about 9 fps and frame time is capped at 0.05 s, so game time runs slower than wall time).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname, OUT = process.argv[2] || '/tmp/night1';
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const url = `http://127.0.0.1:${srv.address().port}/night1.html`;
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const screens = [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'phone', w: 390, h: 844, m: true }].filter((s) => !process.env.ONLY || s.n === process.env.ONLY);
  for (const sc of screens) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', (e) => errs.push('pageerror ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    const step = async (name, fn) => { try { await fn(); const s = await pg.evaluate(() => window.__night && window.__night.NS.scene); console.log(sc.n, 'OK  ', name, '| scene', s); } catch (e) { console.log(sc.n, 'FAIL', name, String(e.message).split('\n')[0]); } };
    const shot = (n) => pg.screenshot({ path: `${OUT}/${sc.n}_${n}.png` });
    await pg.goto(url);
    await step('loads', async () => { await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 120000 }); });
    const nAt = process.env.N_AT || await pg.evaluate(() => window.__night.N1.nietzscheAt);
    await pg.evaluate((a) => { window.__night.NS.nAt = a; }, nAt);
    await step('logo then title', async () => { await sleep(3400); await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 2000 }); });
    await step('start: at the mirror', async () => { await pg.click('#start'); await sleep(1500); });
    await step('first input finishes the paint', async () => { await pg.mouse.click(sc.w / 2, sc.h / 3); await pg.waitForSelector('#card_dazai', { timeout: 30000 }); await shot('paint'); });
    await step('go out: corridor', async () => { await pg.click('#goOut'); await sleep(900); await pg.waitForFunction(() => window.__night.S.shot === 'corridor'); });
    const tp = (x, y) => pg.evaluate(([x, y]) => { const S = window.__night.S; S.x = x; S.y = y; }, [x, y]);
    const verb = async (x, y, v) => { await tp(x, y); await sleep(500); const vis = await pg.isVisible('#verb'); if (!vis) throw new Error('no verb button for ' + v); await pg.click('#verb'); await sleep(1100); const done = await pg.evaluate((v) => window.__night.NS.verbs[v], v); if (!done) throw new Error(v + ' not done'); };
    await step('cable blocks before the jump', async () => { await tp(0.15, 7.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await sleep(1500); await pg.evaluate(() => { window.__night.input.ty = 0; }); const y = await pg.evaluate(() => window.__night.S.y); if (y > 7.95) throw new Error('walked through the cable, y ' + y); await shot('cable'); });
    await step('jump the cable', () => verb(0.15, 7.4, 'jump'));
    await step('take the pie', () => verb(1.0, 9.0, 'take'));
    await step('honk the horn', () => verb(0.5, 12.2, 'honk'));
    await step('trip for the child', async () => { await verb(-1.3, 17.0, 'trip'); await pg.waitForFunction(() => /on purpose/.test(window.__night.crew[4].lab.textContent), null, { timeout: 8000 }); await shot('child'); });
    await step('ring edge: board', async () => { await tp(-1.3, 18.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await pg.waitForSelector('#card_board', { timeout: 8000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); });
    await step('board: act page opens', async () => { await pg.click('[data-act="fall"]'); await pg.waitForFunction(() => { const f = document.getElementById('cueFrame'); return f && f.contentWindow.__game; }, null, { timeout: 60000 }); await sleep(2000); await shot('act'); });
    await step('crowd card (stand-in act result)', async () => { await pg.evaluate(() => { const N = window.__night; N.NS.actInfo = { scene: 'results', perfects: 2, goods: 4, misses: 1, actLaughs: 45, mask: 2 }; N.crowdCard(); }); await pg.waitForSelector('#card_crowd'); });
    await step('walk back to the room', async () => { await pg.click('#walkBack'); await sleep(800); await tp(0, 2.8); await pg.evaluate(() => { window.__night.input.ty = -1; }); await pg.waitForFunction(() => window.__night.S.room, null, { timeout: 10000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); await sleep(800); });
    await step('turn to the mirror wall, sit button', async () => { for (let i = 0; i < 4; i++) { const v = await pg.evaluate(() => window.__night.S.roomView); if (v === 'mirror') break; await pg.click('#roomR'); await sleep(500); } await pg.waitForSelector('#sit:not(.hidden)', { timeout: 3000 }); });
    await step('mirror entry: sit, reflection late, cracks', async () => { await pg.click('#sit'); await sleep(700); await pg.mouse.click(sc.w / 2, sc.h / 2); await sleep(420); await shot('entry'); await sleep(900); const n = await pg.evaluate(() => window.__night.NS.cracks); if (n < 1) throw new Error('no crack'); });
    if (nAt === 'in' || nAt === 'both') await step('Nietzsche line at the mirror before he goes in', async () => { await pg.waitForSelector('#card_nietzscheIn', { timeout: 10000 }); const t = await pg.textContent('#card_nietzscheIn .quote'); console.log('   in:', t.slice(0, 60)); await shot('nietzsche_in'); await pg.click('#goIn'); });
    await step('fog into the Mirror World', async () => { await pg.waitForFunction(() => window.__night.S.mode === 'mw', null, { timeout: 8000 }); await sleep(1500); await shot('mw'); const k = await pg.evaluate(() => window.__night.foes.map((f) => f.kind).join(',')); console.log('   foes', k); });
    await step('gags: slap, pie, pratfall', async () => { await pg.keyboard.press('KeyJ'); await sleep(600); await pg.keyboard.press('KeyK'); await sleep(700); await pg.keyboard.press('Space'); await sleep(900); const M = await pg.evaluate(() => { const M = window.__night.M; return { l: M.laughs, p: window.__night.NS.pies }; }); console.log('   laughs', M.l.toFixed(1), 'pies', M.p); });
    await step('stand still in the beam beats the Light', async () => { await pg.evaluate(() => { const N = window.__night, L = N.foes[0]; N.M.x = L.spotX; N.M.z = L.spotZ; }); await pg.waitForFunction(() => !window.__night.foes[0].alive, null, { timeout: 20000 }); });
    await step('others beaten, shards, out', async () => { await pg.evaluate(() => { const N = window.__night; for (const f of N.foes) if (f.alive) { f.hp = 0; f.alive = false; f.sink = 0.6; } }); await pg.waitForSelector(nAt === 'in' ? '#card_kept' : '#card_nietzsche', { timeout: 12000 }); });
    if (nAt !== 'in') await step('Nietzsche line leaving the mirror, then shards kept', async () => { const t = await pg.textContent('#card_nietzsche .quote'); console.log('   out:', t.slice(0, 60)); await shot('nietzsche_out'); await pg.waitForSelector('#toKept', { state: 'visible', timeout: 8000 }); await pg.click('#toKept'); await pg.waitForSelector('#card_kept', { timeout: 3000 }); });
    await step('shop and end card', async () => { await pg.click('#toShop'); await sleep(300); const b2 = await pg.$('.opt:not([disabled])'); if (b2) await b2.click(); await sleep(300); await pg.click('#endNight'); await pg.waitForSelector('#card_end'); await shot('end'); });
    console.log(sc.n, errs.length ? 'ERRORS\n  ' + errs.slice(0, 8).join('\n  ') : 'no page errors');
    await ctx.close();
  }
  await b.close(); srv.close();
})();

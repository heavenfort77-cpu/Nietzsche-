// F46 probe (session 39): in the live fall act a touch drag must walk him (found by the newbie cold-play run, 25 Nov: phone drags in the ring
// moved him 0 m, so every press was outside the light and "fell in the dark").
// Phone 390x844 with touch (software GL): the game's own route to the corridor, a jump to the ring entrance, walk in to the act, wait for the
// live fall, then a touch drag (CDP touch events, as a finger) held for 1 s of game time toward pool 1, and the same with the right arrow key
// as the control. PAGE=<file> serves another copy (e.g. the page before the change). Ends with RESULT fall touch n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
async function toCorridor(pg) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.offsetParent), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.offsetParent).click(), re.source); };
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.offsetParent); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && !(await pg.evaluate(() => [...document.querySelectorAll('button')].some((b) => /act board/.test(b.innerText) && b.offsetParent))); i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  await click(/act board/);
  for (let i = 0; i < 40 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.down('KeyW'); await pg.waitForTimeout(400); await pg.keyboard.up('KeyW'); }
  await click(/^The fall$/);
  await click(/^Perform it$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 120000 });
}
// game seconds pass (the act's own clock, NS.A.t), polled each frame
const waitGame = (pg, secs) => pg.evaluate((s) => new Promise((res) => { const A = window.__night.NS.A, t0 = A.t; const f = () => (window.__night.NS.A.t - t0 >= s ? res() : requestAnimationFrame(f)); f(); }), secs);
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(), cdp = await ctx.newCDPSession(pg);
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  await toCorridor(pg);
  // the ring entrance, 1 m before the walk's end, on the newbie's line (x -1.25); then walk in with the up key
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { const N = window.__night; N.NS.verbs.fall = true; N.S.x = -1.25; N.S.y = N.S.data.endY - 1; });
  // walk in with a finger held up (the phone's own input on the walk)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1 }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - i * 12, id: 1 }] });
  await pg.waitForFunction(() => window.__night.S.mode === 'act', null, { timeout: 240000 }).catch(() => {});
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pg.waitForFunction(() => { const A = window.__night.NS.A; return A && A.F && A.phase === 'fall' && A.F.stage === 'wait'; }, null, { timeout: 180000 }).catch(() => {});
  const live = await pg.evaluate(() => { const A = window.__night.NS.A; return !!(A && A.F && A.phase === 'fall'); });
  report(live, 'live fall act reached', await pg.evaluate(() => { const N = window.__night; return { mode: N.S.mode, scene: N.NS.scene, x: +N.S.x.toFixed(2), y: +N.S.y.toFixed(2), endY: N.S.data.endY, belong: N.NS.belong, ended: N.S.ended, phase: N.NS.A && N.NS.A.phase }; }));
  if (live) {
    const at = () => pg.evaluate(() => { const A = window.__night.NS.A; return [+A.x.toFixed(2), +A.z.toFixed(2)]; });
    // a finger lands mid-screen and moves 80 px right (past the stick radius), held 1 s of game time, then lifted
    const p0 = await at();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195 + i * 10, y: 600, id: 1 }] });
    await waitGame(pg, 1);
    const p1 = await at();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const dT = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    report(dT > 0.5, 'touch drag walks him in the live fall act (1 s, > 0.5 m)', { from: p0, to: p1, m: +dT.toFixed(2) });
    // control: the right arrow key held 1 s of game time
    const q0 = await at();
    await pg.keyboard.down('ArrowRight'); await waitGame(pg, 1); await pg.keyboard.up('ArrowRight');
    const q1 = await at(), dK = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
    report(dK > 0.5, 'key walks him in the live fall act (control, 1 s, > 0.5 m)', { from: q0, to: q1, m: +dK.toFixed(2) });
  }
  report(!errs.length, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT fall touch ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

// Session 40 batch 3 probe (owner 25 Nov 09:12, kid-reader record items 1 and 2), phone 390x844, software GL, test-side placement in the pools:
// fall 1 in the light: the gold Fall button is dim before the drum, fills while it rolls, lit ("Fall now!") when to press; a press on the first
// lit frame lands perfect or good; the button is written only on change. Fall 2 pressed in the light before the drum: grade wait, "Too early:
// wait for the drum." Fall 3 pressed 3 m from the light: dark, "Not in the light." PAGE=<file> serves another copy. Ends with RESULT fall beat n of m pass.
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
  await click(/^(Perform it|Do it)$/);
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
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { const N = window.__night; N.NS.verbs.fall = true; N.S.x = -1.25; N.S.y = N.S.data.endY - 1; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1 }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - i * 12, id: 1 }] });
  await pg.waitForFunction(() => window.__night.S.mode === 'act', null, { timeout: 240000 }).catch(() => {});
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pg.waitForFunction(() => { const A = window.__night.NS.A; return A && A.F && A.phase === 'fall' && A.F.stage === 'settle'; }, null, { timeout: 180000 }).catch(() => {});
  const live = await pg.evaluate(() => { const A = window.__night.NS.A; return !!(A && A.F && A.phase === 'fall'); });
  report(live, 'live fall act reached', { live });
  if (live) {
    // fall 1: in pool 1 (test-side placement) from the start; a sampler records the button each frame; on the first lit frame the page presses the button itself
    const r1 = await pg.evaluate(() => new Promise((res) => {
      const N = window.__night, A = N.NS.A, F = A.F, btn = document.getElementById('fallBtn'), seen = [], muts = { n: 0 };
      A.x = F.px; A.z = F.pz;
      new MutationObserver((l) => { if (F.stage === 'roll') muts.n += l.length; }).observe(btn, { attributes: true, childList: true, characterData: true, subtree: true });
      let pressed = false, t0 = performance.now();
      const f = () => {
        const cls = ['dim', 'fill', 'lit'].find((c) => btn.classList.contains(c)) || '-', last = seen[seen.length - 1];
        if (!last || last.cls !== cls || last.text !== btn.textContent) seen.push({ stage: F.stage, cls, text: btn.textContent, fill: btn.style.getPropertyValue('--fill'), r: F.stage === 'roll' ? +((performance.now() - t0) / 1000).toFixed(2) : null });
        if (!pressed && cls === 'lit') { pressed = true; btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
        if (F.stage === 'result') return res({ seen, grade: F.grades[0], cap: F.cap, muts: muts.n, misses: F.misses });
        requestAnimationFrame(f);
      };
      f();
    }));
    const order = r1.seen.map((x) => x.cls).filter((c, i, a) => c !== a[i - 1]).join('>');
    report(/^dim>fill>lit/.test(order), 'button: dim before the drum, fills in the roll, then lit', { order });
    report(r1.seen.some((x) => x.cls === 'lit' && x.text === 'Fall now!'), 'lit button says "Fall now!"', r1.seen.filter((x) => x.cls === 'lit').slice(0, 1));
    report(r1.grade === 'perfect' || r1.grade === 'good', 'a press on the lit button lands on the crash (perfect or good)', { grade: r1.grade, cap: r1.cap });
    report(r1.muts <= 2 * 20 + 6, 'button written only on change in the roll (at most 2 x steps + 6 writes)', { writes: r1.muts });
    // fall 2: in its pool, pressed before the drum (in the settle): wait, with its words
    const r2 = await pg.evaluate(() => new Promise((res) => {
      const N = window.__night, A = N.NS.A, F = A.F, btn = document.getElementById('fallBtn');
      const go = () => { if (F.stage !== 'settle' || F.on || F.up > 0) return requestAnimationFrame(go); A.x = F.px; A.z = F.pz; btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); const w = () => (F.stage === 'result' ? res({ grade: F.grades[F.grades.length - 1], cap: F.cap, inPool: F.inPool }) : requestAnimationFrame(w)); w(); };
      go();
    }));
    report(r2.grade === 'wait' && r2.cap === 'Too early: wait for the drum.', 'pressed in the light before the drum: "Too early: wait for the drum."', r2);
    // fall 3: 3 m from its pool, pressed: dark, "Not in the light."
    const r3 = await pg.evaluate(() => new Promise((res) => {
      const N = window.__night, A = N.NS.A, F = A.F, btn = document.getElementById('fallBtn');
      const go = () => { if (F.stage !== 'settle' || F.on || F.up > 0) return requestAnimationFrame(go); A.x = F.px + (F.px > 0 ? -3 : 3); A.z = F.pz; btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); const w = () => (F.stage === 'result' ? res({ grade: F.grades[F.grades.length - 1], cap: F.cap, inPool: F.inPool }) : requestAnimationFrame(w)); w(); };
      go();
    }));
    report(r3.grade === 'dark' && r3.cap === 'Not in the light.', 'pressed outside the light: "Not in the light."', r3);
  }
  report(!errs.length, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT fall beat ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

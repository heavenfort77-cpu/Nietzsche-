// Session 43 batch 1 probe (owner 25 Nov 13:01, theme panel C2, C10, C11 in design/PANEL-theme-core-message-25nov.md). Runs on CI (tools/probe_ci.sh), software GL.
// Phone 390x844: the fall act; fall 1 placed in the light with a wide Perfect window (test-side) and pressed on the lit button: on the Perfect the roar,
// popcorn and crowd hold for N1.fallHushSecs of game time while the caption is the child's "...on purpose.", then the roar and the Perfect words.
// Fall 2 with no Perfect window: a Good roars at once. Then the end card: no "The shame of living:" heading, the list kept.
// Desktop 1280x720, night 3 hash: the Performer put down, "Perform one last act": a line, no fall until the player acts, a click falls once,
// a second click while he is down does nothing, the crash comes after his landing, Space falls again, three falls then the restart button.
// PAGE=<file> serves another copy. Ends with RESULT s43 theme n of m pass.
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
// one fall placed in its pool; perfect = the night's Perfect window set test-side; the page presses the gold button on its first lit frame and
// samples every frame from the grade until the Perfect or Good words: game time, caption, popcorn flashes, laugh sources, crowd excitement
const fallOnce = (pg, perfect) => pg.evaluate((pw) => new Promise((res) => {
  const N = window.__night, A = N.NS.A, F = A.F, btn = document.getElementById('fallBtn'), T = N.N1.fallText, rows = [];
  let pressed = false, g = -1;
  const go = () => {
    if (F.stage !== 'settle' && F.stage !== 'wait' && F.stage !== 'roll') return requestAnimationFrame(go);
    F.N.perfect = pw; A.x = F.px; A.z = F.pz;
    const f = () => {
      if (!pressed && btn.classList.contains('lit')) { pressed = true; btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
      if (g < 0 && F.stage === 'result') g = F.grades.length - 1;
      if (g >= 0) {
        rows.push({ t: +A.t.toFixed(3), cap: F.cap, flash: A.fxN.flash, srcs: N.actObj.srcs.length, ex: +A.excite.toFixed(2) });
        if (F.cap === T.perfect || F.cap === T.good || F.cap !== T.hush && rows.length > 1 || rows.length > 2000) return res({ grade: F.grades[g], rows, hushSecs: N.N1.fallHushSecs, T: { hush: T.hush, perfect: T.perfect, good: T.good } });
      }
      requestAnimationFrame(f);
    };
    f();
  };
  go();
}), perfect);
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const base = `http://127.0.0.1:${srv.address().port}/${PAGE}`;
  const errs = [];
  // ---- phone: C2 in the fall act, C11 on the end card ----
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage(), cdp = await ctx.newCDPSession(pg);
    pg.on('pageerror', (e) => errs.push('phone ' + String(e)));
    await pg.goto(base);
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
      const p = await fallOnce(pg, 0.3), r0 = p.rows[0], roar = p.rows.find((x) => x.flash > r0.flash), hushRows = p.rows.filter((x) => !roar || x.t < roar.t);
      report(p.grade === 'perfect', 'fall 1 (lit press, wide window) is a Perfect', { grade: p.grade });
      report(r0.cap === p.T.hush, 'C2: on the Perfect the caption is the child\'s "...on purpose."', { cap: r0.cap });
      report(!!roar && roar.t - r0.t >= p.hushSecs - 0.06, 'C2: the roar and popcorn come one beat after the Perfect, not at once', { gradeT: r0.t, roarT: roar && roar.t, beat: p.hushSecs });
      report(hushRows.every((x) => x.ex < 0.05 && x.cap === p.T.hush && x.srcs === r0.srcs), 'C2: in that beat the crowd is still, no laugh starts, only the child\'s line shows', hushRows.filter((x) => !(x.ex < 0.05 && x.cap === p.T.hush && x.srcs === r0.srcs)).slice(0, 2));
      report(!!roar && roar.cap === p.T.perfect && roar.ex > 0.5, 'C2: after the beat the Perfect words and the crowd', roar || null);
      const g = await fallOnce(pg, 0);
      report(g.grade === 'good' && g.rows[0].cap === g.T.good && g.rows[0].flash > (p.rows[p.rows.length - 1].flash), 'a Good roars at once, no held beat', { grade: g.grade, first: g.rows[0] });
      const e = await pg.evaluate(() => { const N = window.__night; N.endCard(); const k = document.querySelector('#card_end .knows'); return { t: k ? k.textContent : null, heading: N.N1.endKnows }; });
      report(e.t !== null && e.t.indexOf(e.heading) < 0, 'C11: the end card has no "The shame of living:" heading, the list stays', e);
    }
    await ctx.close();
  }
  // ---- desktop: C10, the last act on his will ----
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push('desk ' + String(e)));
    await pg.goto(base + '#n=3&m=2&s=0&b=&t=&lo=0');
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
    await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 30000 });
    await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.act = 'sweep'; NS.actInfo = { scene: 'results', perfects: 1, goods: 3, misses: 0, actLaughs: 40, mask: 2 }; NS.hurt = { falls: 0, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = []; N.enterMW(); const M = NS.mw; M.laughs = 90; const leg = M.route.findIndex((l) => l.style === 'ring'); M.bag.length = 0; M.brk = null; for (const f of N.foes) f.alive = false; N.mwLeaveLeg(); M.leg = leg; N.mwEnterLeg(M); });
    const kill = (kinds) => pg.evaluate((k) => { const N = window.__night; for (const f of N.foes) if (f.alive && (!k || k.indexOf(f.kind) >= 0)) N.killFoe(f); }, kinds || null);
    await kill();
    let ok = await pg.waitForFunction(() => { const f = window.__night.foes.find((x) => x.kind === 'performer'); return f && f.alive && !f.show; }, null, { timeout: 240000 }).then(() => true, () => false);
    if (ok) {
      await kill(['performer']);
      ok = await pg.waitForSelector('#toLight:not(.held)', { timeout: 120000 }).then(() => true, () => false);
      if (ok) { await pg.$eval('#toLight', (x) => x.click()); ok = await pg.waitForSelector('#endAgain', { timeout: 180000 }).then(() => true, () => false); }
    }
    report(ok, 'last night: the Performer down, the two ending buttons', { ok });
    if (ok) {
      await pg.$eval('#endAgain', (x) => x.click());
      const E = () => pg.evaluate(() => { const N = window.__night, E = N.NS.end; return { step: E.step, t: +E.t.toFixed(2), falls: E.falls, crashN: E.crashN, fallAt: E.fallAt, prompt: (document.getElementById('prompt') || {}).textContent || '', line: N.N1.endWillLine, crashAfter: N.N1.endCrashAfter, gap: N.N1.endFallGap, btn: !!(document.getElementById('fallBtn') || {}).offsetParent }; });
      const waitT = (s) => pg.waitForFunction((s) => { const E = window.__night.NS.end; window.__e0 = window.__e0 ?? E.t; if (E.t - window.__e0 >= s || E.step === 'done') { window.__e0 = undefined; return true; } return false; }, s, { timeout: 180000 });
      await waitT(0.05);
      const a0 = await E();
      report(a0.prompt === a0.line && !!a0.line, 'C10: the last act opens on its one line', { prompt: a0.prompt });
      await waitT(3.5);
      const a1 = await E();
      report(a1.falls === 0 && a1.step === 'again' && !a1.btn, 'C10: no fall, no drum and no gold button while the player does nothing (3.5 s)', a1);
      await pg.mouse.click(640, 300);
      await waitT(0.1);
      await pg.mouse.click(640, 300);
      const a2 = await E();
      report(a2.falls === 1 && a2.prompt === '', 'C10: a click on the picture falls once; a second click while he is down does nothing; the line goes', a2);
      await waitT(a2.crashAfter + 0.2);
      const a3 = await E();
      report(a3.crashN === 1, 'C10: the crash follows his landing', a3);
      await waitT(a2.gap);
      await pg.keyboard.press('Space');
      await waitT(a2.gap + 0.1);
      await pg.keyboard.press('Space');
      const done = await pg.waitForSelector('#again1', { timeout: 180000 }).then(() => true, () => false);
      const a4 = await E();
      report(done && a4.falls === 3 && a4.crashN === 3, 'C10: Space falls too; three falls, three crashes, then the restart button', { done, falls: a4.falls, crashN: a4.crashN, step: a4.step });
    }
    await ctx.close();
  }
  report(!errs.length, 'no page errors', errs.slice(0, 3));
  console.log(`RESULT s43 theme ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

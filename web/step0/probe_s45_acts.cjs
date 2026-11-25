// Session 45 batch 3 probe (owner 25 Nov 20:04: "first night thought, second night thought and third night thought are all diff." and
// "all act use the same timing game as fall."). Runs on CI (tools/probe_ci.sh), phone 390x844, software GL, test-side placement in the light.
// Nights 1-3, each with that night's tryout act (night 1 the sweep, night 2 the scale, night 3 the drill): the act's note gives its own line for the
// fall's timing game and no "Try it"; after Do it and the walk he is in the live fall act (walk into the light, Fall on the crash); a press on the lit
// gold button lands perfect or good; the act's three falls end it and its result is the fall's (three grades). Before the walk ends, his thought after the
// child is that night's own line, and the three nights' lines all differ. MUT=off serves the page as before (acts on the cue page, night 3 the night-1 line).
// Ends with RESULT s45 acts n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html', MUT = process.env.MUT || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  // MUT=off: night1.html served as before this batch (N1.actsAsFall false, night 3's thought null): the act and night-3 steps must FAIL
  if (MUT === 'off' && path.basename(f) === 'night1.html') {
    let t = fs.readFileSync(f, 'utf8');
    const swap = (a, b) => { if (t.split(a).length !== 2) throw new Error('not found once: ' + a.slice(0, 40)); t = t.replace(a, b); };
    swap('  actsAsFall: true,', '  actsAsFall: false,'); swap(", 'Tonight I fell before the drum.", ", null, 'Tonight I fell before the drum.");
    r.end(t); return;
  }
  r.end(fs.readFileSync(f));
});
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
async function toCorridor(pg, act) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.offsetParent), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.offsetParent).click(), re.source); };
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.offsetParent); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && !(await pg.evaluate(() => [...document.querySelectorAll('button')].some((b) => /act board/.test(b.innerText) && b.offsetParent))); i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  await click(/act board/);
  for (let i = 0; i < 40 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.down('KeyW'); await pg.waitForTimeout(400); await pg.keyboard.up('KeyW'); }
  await click(act);
  await click(/^(Perform it|Do it)$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 120000 });
}

const ACTS = [{ n: 1, re: /^(Light sweep|The sweep)$/, id: 'sweep' }, { n: 2, re: /^(The talking scale|The scale)$/, id: 'scale' }, { n: 3, re: /^(Soldier drill|The drill)$/, id: 'drill' }];
// one fall in the light: on the first lit frame the page presses the gold button; resolves with the grade when its result shows
const oneFall = () => new Promise((res) => {
  const N = window.__night, A = N.NS.A, F = A.F, btn = document.getElementById('fallBtn'), n0 = F.grades.length;
  let pressed = false;
  const f = () => {
    if (F.stage === 'done') return res({ grade: 'done', n: F.grades.length });
    if (!pressed && F.stage !== 'result' && !F.on && F.up <= 0) { A.x = F.px; A.z = F.pz; }
    if (!pressed && F.stage === 'roll' && btn.classList.contains('lit')) { pressed = true; btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
    if (F.grades.length > n0) return res({ grade: F.grades[n0], cap: F.cap, n: F.grades.length });
    requestAnimationFrame(f);
  };
  f();
});
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const thoughts = [];
  for (const a of ACTS) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage(), cdp = await ctx.newCDPSession(pg);
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    const hash = a.n > 1 ? `#n=${a.n}&m=0&s=0` : '';
    await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}${hash}`); if (hash) await pg.reload();
    try {
      // the note: wait on the board, read it before Do it (toCorridor clicks the act, then Do it)
      await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
      await pg.evaluate(() => { window.__noteLog = []; new MutationObserver(() => { const d = document.querySelector('.parchment'); if (d && document.getElementById('perform')) window.__noteLog.push({ h: (d.querySelector('h2') || {}).textContent, text: d.innerText, tryBtn: !!document.getElementById('tryAct') }); }).observe(document.body, { childList: true, subtree: true }); });
      await toCorridor(pg, a.re);
      const note = await pg.evaluate(() => window.__noteLog[window.__noteLog.length - 1] || null);
      const want = await pg.evaluate((id) => window.__night.N1.actFallNote && window.__night.N1.actFallNote[id], a.id);
      report(!!note && !!want && note.text.indexOf(want) >= 0 && !note.tryBtn, `night ${a.n}, ${a.id}: the note gives the act's line for the fall's timing game, no "Try it"`, { note, want });
      // his thought after the child, before the walk ends
      await pg.evaluate(() => { const N = window.__night; N.NS.belong = 1; for (const m of N.crew) if (m.cd.id === 'child') m.saidT = 0; });
      await pg.waitForFunction(() => !document.getElementById('thought').classList.contains('hidden'), null, { timeout: 60000 }).catch(() => {});
      const t = await pg.evaluate(() => ({ night: window.__night.NS.night, text: document.getElementById('thought').textContent }));
      thoughts.push(t);
      report(t.night === a.n && t.text.length > 20, `night ${a.n}: his thought after the child shows`, t);
      // on to the ring: the end of the walk, a touch drag (as probe_fall_beat.cjs)
      await pg.waitForTimeout(3000);
      await pg.evaluate(() => { const N = window.__night; N.NS.verbs.fall = true; N.S.x = -1.25; N.S.y = N.S.data.endY - 1; });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1 }] });
      for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 600 - i * 12, id: 1 }] });
      await pg.waitForFunction(() => window.__night.S.mode === 'act', null, { timeout: 240000 }).catch(() => {});
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await pg.waitForFunction(() => { const A = window.__night.NS.A; return A && ((A.F && A.phase === 'fall') || window.__night.NS.scene === 'cue' || A.phase === 'seg'); }, null, { timeout: 180000 }).catch(() => {});
      const live = await pg.evaluate(() => { const N = window.__night, A = N.NS.A; return { act: N.NS.act, live: !!(A && A.F && A.phase === 'fall'), scene: N.NS.scene, phase: A && A.phase }; });
      report(live.act === a.id && live.live, `night ${a.n}, ${a.id}: played as the live fall (walk into the light, Fall on the crash)`, live);
      if (live.live) {
        const g = [];
        for (let i = 0; i < 4; i++) { const r = await pg.evaluate(oneFall); if (r.grade === 'done') break; g.push(r.grade); }
        report(g.length >= 1 && (g[0] === 'perfect' || g[0] === 'good'), `night ${a.n}, ${a.id}: a press on the lit button lands on the crash`, { grades: g });
        await pg.waitForFunction(() => window.__night.NS.actInfo && window.__night.NS.actInfo.game === 'fall', null, { timeout: 120000 }).catch(() => {});
        const info = await pg.evaluate(() => { const i = window.__night.NS.actInfo; return i && { game: i.game, beats: i.beatCount, perfects: i.perfects, goods: i.goods, misses: i.misses, act: window.__night.NS.act }; });
        report(!!info && info.game === 'fall' && info.beats === 3 && info.act === a.id, `night ${a.n}, ${a.id}: three falls end the act, its result is the fall's`, info);
      }
    } catch (e) { report(false, `night ${a.n}, ${a.id}: run`, String(e).slice(0, 200)); }
    report(!errs.length, `night ${a.n}: no page errors`, errs.slice(0, 3));
    await ctx.close();
  }
  const texts = thoughts.map((t) => t.text);
  report(texts.length === 3 && new Set(texts).size === 3, 'nights 1, 2 and 3: three different thoughts', texts);
  console.log(`RESULT s45 acts ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

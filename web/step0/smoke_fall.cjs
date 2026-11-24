// Smoke for the deliberate-fall box prototype (web/step0/fall_act.html, session 34 batch 3): desktop 1280x720 and phone portrait 390x844.
// Presses go through the page's own handlers (Space keydown on desktop, pointerdown on the gold button on the phone), timed in the page on the
// roll clock (rollNow), so they wait on game time, not wall time. Usage: node web/step0/smoke_fall.cjs; ONLY=desk|phone; CHROME=<path>.
// MUTATE=<name> serves the page with one rule broken (MUTS); its step must FAIL. Ends with RESULT fall smoke <passed> of <steps> pass.
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const PAGE = path.join(__dirname, 'fall_act.html');
const GUARD = 60000;
// mutation name: [text in fall_act.html, replacement, ...more pairs]; the step that checks that rule must FAIL (CI: every mutation, job step0)
const MUTS = {
  window: ['{ pool: 1.2, roll: 1.6, perfect: 0.12,', '{ pool: 1.2, roll: 1.6, perfect: 0.005,'],
  stick: ['stickSecs: 0.5,', 'stickSecs: 0.2,'],
  settle: ['settleSecs: 0.8,', 'settleSecs: 0,'],
  stood: ["const key = kind === 'late' ? (S.fall.on || S.fall.landed ? 'lateFell' : 'lateStood') : kind;", "const key = kind === 'late' ? 'lateFell' : kind;"],
  crashlies: ['if (!S.crashed && r >= R) {', 'if (!S.crashed && r >= R - (N.fakeCall ? CONFIG.fakeLead : 0)) {'],
  misses: ['falls: 3, missesEnd: 2,', 'falls: 3, missesEnd: 3,'],
  // both change guards off (hud's own and setText's): the HUD is written every frame
  hudrepeat: ['function setText(node, s) { if (shown.get(node) === s) return;', 'function setText(node, s) {',
    'if (!S.running || (S.beat === S.hudBeat && S.laughs === S.hudL)) return;', 'if (!S.running) return;'],
};
const MUT = process.env.MUTATE ? MUTS[process.env.MUTATE] : null;
if (process.env.MUTATE && !MUT) { console.error('unknown mutation ' + process.env.MUTATE); process.exit(2); }
const srv = http.createServer((q, r) => {
  let t = fs.readFileSync(PAGE, 'utf8');
  if (MUT) for (let i = 0; i < MUT.length; i += 2) { if (t.split(MUT[i]).length !== 2) { r.statusCode = 500; r.end('mutation anchor not found once'); return; } t = t.replace(MUT[i], MUT[i + 1]); }
  r.setHeader('content-type', 'text/html'); r.end(t);
});
let nOk = 0, nAll = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const url = `http://127.0.0.1:${srv.address().port}/fall_act.html`;
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const screens = [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'phone', w: 390, h: 844, m: true }].filter((s) => !process.env.ONLY || s.n === process.env.ONLY);
  for (const sc of screens) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', (e) => errs.push('pageerror ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    const step = async (name, fn) => { nAll++; try { await fn(); nOk++; console.log(sc.n, 'OK  ', name); } catch (e) { console.log(sc.n, 'FAIL', name, String(e.message).split('\n')[0]); } };
    const S = (f) => pg.evaluate(f);
    // stand him in the pool once it is placed (test-side position only), then wait for the game's own phase
    const intoPool = async () => { await pg.waitForFunction(() => ['settle', 'wait'].includes(window.__fall.S.phase), null, { timeout: GUARD }); await S(() => { const s = window.__fall.S; s.x = s.poolX; s.z = s.poolZ; }); };
    // press through the page's handler when the roll clock reaches (roll - landSecs + offset); offset null: press now (no roll needed)
    const pressAt = (offset, phone) => pg.evaluate(([offset, phone]) => new Promise((done) => {
      const F = window.__fall, s = F.S;
      const press = () => { if (phone) document.getElementById('fallBtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); else window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); };
      if (offset === null) { press(); done(-1); return; }
      const tick = () => { if (s.phase === 'roll' && F.rollNow() >= s.N.roll - F.CONFIG.landSecs + offset) { press(); done(s.fall.pressRoll); } else requestAnimationFrame(tick); };
      tick();
    }), [offset, phone]);
    const graded = (n) => pg.waitForFunction((n) => window.__fall.S.grades.length >= n, n, { timeout: GUARD });
    const cap = () => pg.textContent('#cap');
    await pg.goto(url);
    await step('loads: start card with nights 1-3', async () => { await pg.waitForSelector('#startCard:not(.hidden)', { timeout: GUARD }); const n = await pg.$$eval('[data-night]', (x) => x.length); if (n !== 3) throw new Error(n + ' night buttons'); });
    await step('night 1 starts: the goal line is on screen', async () => {
      await pg.click('[data-night="1"]');
      const r = await S(() => ({ goal: document.getElementById('goal').textContent, want: window.__fall.CONFIG.text.goal, run: window.__fall.S.running }));
      if (!r.run || r.goal !== r.want) throw new Error(JSON.stringify(r));
    });
    await step('place tell: the pool settles before a roll can start, even with him standing in it', async () => {
      await S(() => { const s = window.__fall.S; s.x = s.poolX; s.z = s.poolZ; });
      const r = await S(() => new Promise((done) => { const F = window.__fall, s = F.S; let settle = 0, last = performance.now(); const tick = (t) => { if (s.phase === 'settle') { settle += (t - last) / 1000; last = t; requestAnimationFrame(tick); } else done({ phase: s.phase, settleT: s.t, want: F.CONFIG.settleSecs }); }; requestAnimationFrame((t) => { last = t; tick(t); }); }));
      if (!(r.want >= 0.4)) throw new Error('settle ' + r.want + ' s, the place tell needs at least 0.4 s');
      console.log('    pool settled, then', r.phase);
    });
    await step('time tell: the band leader\'s stick rises only in the last stickSecs, at least 0.4 s every night', async () => {
      await pg.waitForFunction(() => window.__fall.S.phase === 'roll', null, { timeout: GUARD });
      const r = await S(() => new Promise((done) => { const F = window.__fall, s = F.S, o = { first: -1 }; const tick = () => { if (s.phase === 'roll') { if (o.first < 0 && s.stick > 0) o.first = F.rollNow(); if (s.crashed || F.rollNow() >= s.N.roll) { done({ lead: s.N.roll - o.first, cfg: F.CONFIG.stickSecs, nights: F.CONFIG.nights.map((n) => n.roll) }); return; } } requestAnimationFrame(tick); }; tick(); }));
      console.log('    stick up', r.lead.toFixed(2), 's before the crash');
      if (!(r.cfg >= 0.4 && r.lead >= 0.4 - 0.05 && r.lead <= r.cfg + 0.05)) throw new Error(JSON.stringify(r));
      await graded(1);
    });
    await step('night 1: no press, the crash hits a clown still standing (late)', async () => {
      const r = await S(() => ({ g: window.__fall.S.grades[0], want: window.__fall.CONFIG.text.lateStood }));
      const c = await cap();
      if (r.g !== 'late' || c !== r.want) throw new Error(`grade ${r.g}, caption "${c}"`);
    });
    await step('night 1: in the light, landing on the crash, is Perfect (+10 Laughs, +1 Mask)', async () => {
      await intoPool(); const pr = await pressAt(-0.01, sc.m); await graded(2);
      const r = await S(() => { const s = window.__fall.S; return { g: s.grades[1], l: s.laughs, m: s.mask, err: s.fall.pressRoll + window.__fall.CONFIG.landSecs - s.N.roll }; });
      console.log('    press at roll', pr.toFixed(3), 's, landing error', r.err.toFixed(3), 's');
      if (r.g !== 'perfect' || r.l !== 10 || r.m !== 1) throw new Error(JSON.stringify(r));
    });
    await step('night 1: second miss ends the act early (Two misses)', async () => {
      await pg.waitForFunction(() => window.__fall.S.phase === 'settle' || window.__fall.S.phase === 'wait', null, { timeout: GUARD });
      await pressAt(null, sc.m); await graded(3);
      const g = await S(() => window.__fall.S.grades[2]);
      await pg.waitForSelector('#endCard:not(.hidden)', { timeout: GUARD });
      const t = await pg.textContent('#endTitle'), want = await S(() => window.__fall.CONFIG.text.endCut);
      if (g !== 'dark' || t !== want) throw new Error(`grade ${g}, end "${t}"`);
    });
    await step('again: three Perfects, the bow, "The act is over.", Laughs 30 Mask 3', async () => {
      await pg.click('#againBtn');
      for (let i = 0; i < 3; i++) { await intoPool(); await pressAt(-0.01, sc.m); await graded(i + 1); }
      await pg.waitForFunction(() => window.__fall.S.phase === 'bow', null, { timeout: GUARD });
      await pg.waitForSelector('#endCard:not(.hidden)', { timeout: GUARD });
      const r = await S(() => ({ t: document.getElementById('endTitle').textContent, want: window.__fall.CONFIG.text.endOk, g: window.__fall.S.grades.join(','), sum: document.getElementById('endSum').textContent }));
      if (r.t !== r.want || r.g !== 'perfect,perfect,perfect' || !/Laughs 30/.test(r.sum) || !/Mask 3/.test(r.sum)) throw new Error(JSON.stringify(r));
    });
    await step('night 3: a press on the whiteface\'s early "Now!" lands early; the crash keeps its time', async () => {
      await pg.click('#nightBtn'); await pg.click('[data-night="3"]');
      await intoPool();
      const r = await S(() => new Promise((done) => { const F = window.__fall, s = F.S, o = {}; const tick = () => {
        if (s.phase === 'roll' && s.fakeShown && o.at === undefined) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); o.at = s.fall.pressRoll; o.fakeAt = s.fakeAt; o.R = s.N.roll; }
        if (o.at !== undefined && s.crashed) { o.crashAt = F.rollNow(); done(o); return; }
        requestAnimationFrame(tick); }; tick(); }));
      await graded(1);
      const g = await S(() => window.__fall.S.grades[0]);
      console.log('    "Now!" at roll', r.fakeAt.toFixed(3), 's, crash seen at', r.crashAt.toFixed(3), 's, roll', r.R, 's');
      if (g !== 'early') throw new Error('graded ' + g);
      if (r.crashAt < r.R - 0.02) throw new Error(`the crash came at ${r.crashAt.toFixed(3)} s, before the roll's end ${r.R} s`);
    });
    await step('night 3: pressing after the crash, he falls into silence (late)', async () => {
      await intoPool(); await pressAt(CONFIG_LATE, sc.m); await graded(2);
      const g = await S(() => window.__fall.S.grades[1]), c = await cap(), want = await S(() => window.__fall.CONFIG.text.lateFell);
      if (g !== 'late' || c !== want) throw new Error(`grade ${g}, caption "${c}"`);
    });
    await step('text is written only when it changes (HUD, caption, goal)', async () => {
      await pg.waitForSelector('#endCard:not(.hidden)', { timeout: GUARD });
      await pg.click('#nightBtn'); await pg.click('[data-night="1"]');
      await pg.waitForFunction(() => window.__fall.S.phase === 'wait', null, { timeout: GUARD });
      const n = await S(() => new Promise((done) => { let w = 0; const ob = new MutationObserver((l) => { w += l.length; }); for (const id of ['hud', 'cap', 'goal']) ob.observe(document.getElementById(id), { childList: true, characterData: true, subtree: true }); setTimeout(() => { ob.disconnect(); done({ w, phase: window.__fall.S.phase }); }, 1500); }));
      if (n.phase !== 'wait') throw new Error('left the wait phase: ' + n.phase);
      if (n.w > 0) throw new Error(n.w + ' DOM writes in 1.5 s with nothing changed');
    });
    console.log(sc.n, errs.length ? 'ERRORS\n  ' + errs.slice(0, 6).join('\n  ') : 'no page errors');
    nAll++; if (!errs.length) nOk++;
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`RESULT fall smoke ${nOk} of ${nAll} pass${process.env.MUTATE ? ' (MUTATE=' + process.env.MUTATE + ')' : ''}`);
  process.exitCode = nOk === nAll ? 0 : 1;
})();
// a press this far past the landing-on-the-crash point is after the crash on every night (landSecs 0.74 later than the crash)
const CONFIG_LATE = 0.9;

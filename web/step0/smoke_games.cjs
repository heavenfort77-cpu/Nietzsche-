// Session 25 (checks session): the five timing games of cue_model.html in headless Chrome on the page's virtual clock (no waiting, fastest rate).
// Needs web/step0/cube25d/setup.sh first. Usage: node web/step0/smoke_games.cjs; CHROME=<path>.
// MUTATE=<name> serves a page with one rule broken (see MUTS) and runs only the checks named by its 4th field, which must FAIL. MUTATE=all runs every mutation and reports N of N caught.
// Ends with RESULT games <passed> of <checks> pass (or RESULT games mutations <caught> of <n> caught).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
// [file, text found once, replacement, the check that must FAIL]
const MUTS = {
  shortacts: ['cue_model.html', '    shortActs: true,', '    shortActs: false,', 'no presses'],
  shownring: ['cue_model.html', '    shownRing: true,', '    shownRing: false,', 'shown ring'],
  actbyact: ['cue_model.html', '    actByAct: true,', '    actByAct: false,', 'act by act'],
  barnarrow: ['cue_model.html', '    barNarrow: [1, 0.85, 0.7],', '    barNarrow: [1, 1, 1],', 'bar zone narrows'],
  tradestep: ['cue_model.html', '    tradeStep: 0.08,', '    tradeStep: 0,', 'trade speeds up'],
  // no tradeCap mutation: night 3 has 5 exchanges at tradeStep 0.08, peak 1.32x, so the 1.4x cap never binds (checked as a limit in 'trade speeds up')
  holdrel: ['cue_model.html', '    judgeHit(r, HIT, t - r.fit);\n  }', '    judgeHit(r, HIT, r.fit - r.fit);\n  }', 'hold: early release'],
  rehearse: ['cue_model.html', '    S.acts = S.rehearse ? 1 : CONFIG.actsPerShow[n];', '    S.acts = CONFIG.actsPerShow[n];', 'rehearsal'],
  calllate: ['cue_model.html', '    callLateMs: 90,', '    callLateMs: 0,', 'call: late voice'],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// one act run on the virtual clock inside the page: bot = { off: press offset ms, none: no presses, relOff: release offset ms, byAct: call nextAct at actDone }
function play(bot) {
  const G = window.__game, HIT = G.HIT, TAKE = G.TAKE, REL = G.REL;
  G.useVirtual(false); G.setLatency(0);
  G.start(bot.night || 1);
  const pressed = new Set(), dones = [], step = 10;
  let t = 0, holdRel = -1, demoPress = false;
  for (let guard = 0; guard < 20000; guard++) {
    const info = G.info();
    if (info.scene === 'results') break;
    if (info.scene === 'actDone') { dones.push(info.actIndex); if (!bot.byAct) break; G.nextAct(); continue; }
    t += step;
    // a press on the shown ring (bot.demo): must not count
    if (bot.demo && !demoPress && info.demoFit > 0 && t >= info.demoFit) { demoPress = true; G.input(HIT, info.demoFit); }
    if (!bot.none) {
      const bs = G.beats();
      for (let i = 0; i < bs.length; i++) {
        const b = bs[i];
        if (b.kind === REL || pressed.has(i) || b.state !== 0) continue;
        const at = b.fit + (bot.off || 0);
        if (at <= t) { pressed.add(i); G.input(b.kind === TAKE ? TAKE : HIT, at); if (b.pair >= 0) holdRel = b.pair; }
      }
      if (holdRel >= 0) { const r = G.beats()[holdRel], at = r.fit + (bot.relOff || 0); if (at <= t) { holdRel = -1; G.release(at); } }
    }
    G.advance(t);
  }
  const i = G.info(), bs = G.beats();
  return { scene: i.scene, acts: i.acts, perBeats: i.perBeats, beatCount: i.beatCount, misses: i.misses, perfects: i.perfects, goods: i.goods, takes: i.takes, actLaughs: i.actLaughs,
    laughs: i.laughs, rehearse: i.rehearse, demoFit: i.demoFit, dones, judged: bs.map((b) => b.judged), results: bs.map((b) => b.result), kinds: bs.map((b) => b.kind),
    fits: bs.map((b) => b.fit), wins: bs.map((b) => b.win), chains: bs.map((b) => b.chain), calls: G.calls(), cfg: { missesToEnd: G.config.missesToEnd, callLateMs: G.config.callLateMs } };
}

async function suite(b, mut, only) {
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    if (mut && path.basename(f) === mut[0]) { const t = fs.readFileSync(f, 'utf8'); if (t.split(mut[1]).length !== 2) { console.log('FAIL mutation anchor not found once: ' + mut[1].slice(0, 60)); r.end(t); return; } r.end(t.replace(mut[1], mut[2])); return; }
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/cue_model.html`;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  let ok = 0, all = 0; const failed = [];
  const errs = [];
  const run = async (q, bot) => {
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push(q + ' pageerror ' + e.message));
    await pg.goto(base + q);
    await pg.waitForFunction(() => window.__game, null, { timeout: 60000 });
    const r = await pg.evaluate(play, bot);
    await pg.close();
    return r;
  };
  const check = async (name, fn) => {
    if (only && name.indexOf(only) < 0) return;
    all++;
    try { await fn(); ok++; if (!mut) console.log('PASS ' + name); } catch (e) { failed.push(name); console.log('FAIL ' + name + ': ' + String(e.message || e).slice(0, 400)); }
  };
  const games = ['ring', 'hold', 'bar', 'call', 'trade'];
  // a hold ring is a press and its release, scored once at the release by the worse grade
  const rings = (r) => r.kinds.filter((k) => k !== 2).length;
  for (const g of games) {
    await check(`${g}: a perfect player lands every ring, night 1`, async () => {
      const r = await run(`?game=${g}`, { off: 0 });
      if (r.scene !== 'results' || r.misses !== 0 || r.goods !== 0 || r.perfects !== rings(r) || !(r.actLaughs > 0)) throw new Error(JSON.stringify({ scene: r.scene, misses: r.misses, goods: r.goods, perfects: r.perfects, beats: r.beatCount, laughs: r.actLaughs }));
      if (g !== 'hold' && rings(r) !== r.beatCount) throw new Error('release beats outside hold');
    });
    // owner 23 Nov 06:22 (shortActs): two misses end only that act; the next act starts on its own grid; two in the last act end the show
    await check(`${g}: no presses: each act ends at its own second miss (no presses)`, async () => {
      const r = await run(`?game=${g}`, { none: true });
      const want = r.acts * r.cfg.missesToEnd;
      if (r.scene !== 'results' || r.misses !== want || r.perfects + r.goods !== 0) throw new Error(JSON.stringify({ scene: r.scene, misses: r.misses, want, acts: r.acts }));
      const chainsMissed = new Set(r.chains.filter((c, i) => r.results[i] === 'miss')); if (chainsMissed.size !== r.acts) throw new Error('acts reached ' + [...chainsMissed].join(','));
    });
    // owner 09:23: the board's Try it: one act, nothing counted, misses never end it
    await check(`${g}: rehearsal is one act, no Laughs, misses never end it`, async () => {
      const r = await run(`?game=${g}&rehearse=1`, { none: true });
      if (r.scene !== 'results' || r.acts !== 1 || r.actLaughs !== 0 || !r.rehearse || r.misses !== rings(r) - (r.kinds.filter((k) => k === 1).length)) throw new Error(JSON.stringify({ scene: r.scene, acts: r.acts, laughs: r.actLaughs, misses: r.misses, rings: rings(r) }));
    });
    // owner 23 Nov 08:29 (actByAct): hosted with byact=1 the page stops after each act until the host calls nextAct
    await check(`${g}: act by act when hosted: stops after each act, then results`, async () => {
      const r = await run(`?game=${g}&host=night1&byact=1`, { off: 0, byAct: true });
      const want = Array.from({ length: r.acts - 1 }, (x, i) => i).join(',');
      if (r.dones.join(',') !== want || r.scene !== 'results' || r.perfects !== rings(r)) throw new Error(JSON.stringify({ dones: r.dones, want, scene: r.scene, perfects: r.perfects, beats: r.beatCount }));
    });
  }
  // shownRing: ring, hold and bar show one ring before the counted ones; a press on it counts nothing
  await check('shown ring: one ring closes before the first counted ring and a press on it counts nothing', async () => {
    for (const g of ['ring', 'hold', 'bar']) {
      const r = await run(`?game=${g}`, { off: 0, demo: true });
      const first = Math.min(...r.fits.filter((f, i) => r.kinds[i] !== 2));
      if (!(r.demoFit > 0) || !(first > r.demoFit) || r.misses !== 0 || r.perfects !== rings(r) || r.judged.some((j) => j !== 1)) throw new Error(g + ' ' + JSON.stringify({ demoFit: r.demoFit, first, misses: r.misses, perfects: r.perfects, judged: r.judged.join('') }));
    }
  });
  await check('bar: 100 ms late lands Goods, and the narrowed third ring misses (bar zone narrows)', async () => {
    const r = await run('?game=bar', { off: 100 });
    const per = r.beatCount / r.acts, w = r.wins.slice(0, per);
    if (!(w[0] > w[1] && w[1] > w[2])) throw new Error('zone ' + w.join(','));
    if (!(r.goods > 0 && r.misses > 0 && r.perfects === 0)) throw new Error(JSON.stringify({ goods: r.goods, misses: r.misses, perfects: r.perfects }));
  });
  await check('hold: early release misses the sweep (hold: early release)', async () => {
    const r = await run('?game=hold', { off: 0, relOff: -300 });
    if (!(r.misses > 0) || r.perfects === r.beatCount) throw new Error(JSON.stringify({ misses: r.misses, perfects: r.perfects }));
  });
  await check('trade: night 3, each exchange faster, capped at 1.4x (trade speeds up)', async () => {
    const r = await run('?game=trade&night=3', { off: 0, night: 3 });
    const per = r.beatCount / r.acts, f = r.fits.slice(0, per), gaps = f.slice(1).map((x, i) => x - f[i]);
    const nb = r.calls.filter((c) => c.chain === 0).map((c) => c.t);
    if (!gaps.every((g, i) => i === 0 || g < gaps[i - 1])) throw new Error('gaps ' + gaps.map((g) => g.toFixed(0)).join(','));
    const base = 400, minTurn = Math.min(...f.map((x, i) => x - nb[i]));
    if (!(minTurn >= base / 1.4 - 1)) throw new Error('faster than 1.4x: turn ' + minTurn.toFixed(0) + ' ms');
    if (r.misses !== 0) throw new Error('perfect bot missed ' + r.misses);
  });
  await check('call: night 2, perfect answers land; the voice comes late (call: late voice)', async () => {
    const r = await run('?game=call&night=2', { off: 0, night: 2 });
    if (r.misses !== 0 || r.perfects !== r.beatCount || !(r.cfg.callLateMs >= 50)) throw new Error(JSON.stringify({ misses: r.misses, perfects: r.perfects, late: r.cfg.callLateMs }));
  });
  await check('no page errors', async () => { if (errs.length) throw new Error(errs.slice(0, 3).join(' | ')); });
  await ctx.close(); srv.close();
  return { ok, all, failed };
}

(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  let code = 0;
  if (process.env.MUTATE) {
    const names = process.env.MUTATE === 'all' ? Object.keys(MUTS) : [process.env.MUTATE];
    let caught = 0;
    for (const k of names) {
      const m = MUTS[k]; if (!m) { console.log('FAIL unknown mutation ' + k); code = 1; continue; }
      const r = await suite(b, m, m[3]);
      if (r.failed.some((n) => n.indexOf(m[3]) >= 0)) { caught++; console.log(`PASS games mutation ${k}: caught (${m[3]})`); }
      else { code = 1; console.log(`FAIL games mutation ${k}: not caught by '${m[3]}' (failed: ${r.failed.join('; ') || 'none'})`); }
    }
    console.log(`RESULT games mutations ${caught} of ${names.length} caught`);
  } else {
    const r = await suite(b, null);
    console.log(`RESULT games ${r.ok} of ${r.all} pass`);
    if (r.ok !== r.all) code = 1;
  }
  await b.close();
  process.exit(code);
})().catch((e) => { console.log('FAIL games crashed: ' + (e && e.stack || e)); process.exit(1); });

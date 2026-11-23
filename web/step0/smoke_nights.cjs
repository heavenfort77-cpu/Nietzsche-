// Session 25 (checks session): the route mixer, the four rooms, nights 2-3 carried in the address hash, the last night's Performer and the ending,
// in headless Chrome on night1.html (desktop 1280x720; correctness only, no timings). Each case loads a fresh page and starts its Mirror World space
// directly (hooks enterMW, mwLeaveLeg, mwEnterLeg), so it does not replay the night. Waits are on game time.
// Needs web/step0/cube25d/setup.sh first. Usage: node web/step0/smoke_nights.cjs [out dir]; CHROME=<path>; ONLY_CHECK=<text> runs only the checks whose name holds it.
// MUTATE=<name> serves a page with one rule broken (MUTS) and runs only the checks named by its 4th field, which must FAIL. MUTATE=all runs each in turn.
// Ends with RESULT nights <passed> of <checks> pass (or RESULT nights mutations <caught> of <n> caught).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname, OUT = process.argv[2] || '/tmp/nights';
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const MUTS = {
  mixer: ['night1.html', '  mwMixer: true,', '  mwMixer: false,', 'routes'],
  group1: ['night1.html', '  mwGroup: 2,', '  mwGroup: 1,', 'routes'],
  photooff: ['night1.html', 'mwStyles: { corridor: true, photo: true,', 'mwStyles: { corridor: true, photo: false,', 'routes'],
  flashtell: ['night1.html', 'stareFlash: { turn: 70, every: 2.2, cone: 26, tell: 0.6,', 'stareFlash: { turn: 70, every: 2.2, cone: 26, tell: 0,', 'photo room'],
  roomdoor: ['night1.html', '  if (M.open || alive > 0) return;\n  M.open = true;', '  if (M.open || alive >= 0) return;\n  M.open = true;', 'photo room'],
  voidline: ['night1.html', 'function voidLineAdd(x, z) {', 'function voidLineAdd(x, z) { return;', 'void'],
  paper: ['night1.html', "  document.body.classList.toggle('paper', on);", '', 'void'],
  parry: ['night1.html', "if (f.kind === 'sergeant' && Math.min(f.beatT, f.cfg.beat - f.beatT) < f.cfg.onBeat)", "if (f.kind === 'sergeant' && false)", 'parade'],
  sergtell: ['night1.html', 'every: 4, tell: 2, len: 3.2,', 'every: 4, tell: 0, len: 3.2,', 'parade'],
  weighlean: ['night1.html', '  const st = c.speed * (c.lean + w) * dt;', '  const st = c.speed * dt;', 'scale room'],
  tilt: ['night1.html', '  if (M.space === \'tilt\') { tiltRead(M, dt); mwCam.rotateZ(deg(M.roll)); }', '', 'scale room'],
  carry: ['night1.html', "  const h = `n=${N1.night + 1}&m=${NS.mask}&s=${NS.shards}&b=", "  const h = `n=${N1.night + 1}&m=0&s=${NS.shards}&b=", 'night 2'],
  widen: ['night1.html', 'lightClick: 1.4, lightWiden: 0.15,', 'lightClick: 1.4, lightWiden: 0,', 'night 2'],
  perffight: ['night1.html', '  performerFight: true,', '  performerFight: false,', 'Performer'],
  perfhp: ['night1.html', 'hp: 12, hpPerMask: 0.04, hpCap: 1.4,', 'hp: 12, hpPerMask: 0, hpCap: 1.4,', 'Performer'],
  perfshow: ['night1.html', "  if (f.kind === 'performer') { if (f.show) return;", "  if (f.kind === 'performer') {", 'Performer'],
  perftell: ['night1.html', "    dash: { name: 'the dash', kind: 'line', tell: 0.6,", "    dash: { name: 'the dash', kind: 'line', tell: 0.2,", 'Performer'],
  endclap: ['night1.html', '      endObj.crowd.count = E.clapN; clap();', '      clap();', 'ending: quit'],
  endquit: ['night1.html', "  if (E.t < b + 1.6) { setPrompt(N1.endQuitLine); return; }", "  if (E.t < b + 1.6) return;", 'ending: quit'],
  endagain: ['night1.html', '  if (n >= N1.endFalls) {', '  if (n >= 1) {', 'ending: one last act'],
};
const MUT = process.env.MUTATE && process.env.MUTATE !== 'all' ? MUTS[process.env.MUTATE] : null;
if (process.env.MUTATE && process.env.MUTATE !== 'all' && !MUT) { console.error('unknown MUTATE ' + process.env.MUTATE); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// in the page: a per-frame trace of the Mirror World (game time, his Laughs, each figure's phase), read back after a wait (sampling only, nothing written)
const TRACE = () => {
  window.__tr = []; const N = window.__night;
  const tick = () => {
    const M = N.NS.mw;
    if (M) window.__tr.push({ t: M.t, l: M.laughs, h: M.hurtT || 0, x: M.x, z: M.z, sp: M.space, open: M.open, f: N.foes.map((f) => ({ k: f.kind, a: f.alive, ph: f.ph, phT: f.phT, hp: f.hp, x: f.x, z: f.z, reach: f.reach || 0, cling: !!f.cling, so: !!f.strikeOn, bn: f.beatN || 0, show: !!f.show, atk: f.atk || '' })), freeze: M.freezeT || 0, flash: document.getElementById('flash').classList.contains('on') });
    if (window.__tr.length > 4000) window.__tr.shift();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function suite(b, mut, only) {
  const srv = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    if (mut && path.basename(f) === mut[0]) { const t = fs.readFileSync(f, 'utf8'); if (t.split(mut[1]).length !== 2) { console.log('FAIL mutation anchor not found once: ' + mut[1].slice(0, 70)); r.end(t); return; } r.end(t.replace(mut[1], mut[2])); return; }
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/night1.html`;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  let ok = 0, all = 0; const failed = [], errs = [];
  const open = async (hash) => {
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push((hash || 'night 1') + ' pageerror ' + e.message));
    pg.on('console', (m) => { if (m.type() === 'error') errs.push((hash || 'night 1') + ' console ' + m.text()); });
    await pg.goto(base + (hash ? '#' + hash : ''));
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
    // the logo card hides itself; clicks wait for it
    await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 30000 });
    return pg;
  };
  // a button press on the element (these cases skip the title, so its curtain still lies over the page; button coverage is probe_cover.cjs's job)
  const press = async (pg, sel) => { await pg.waitForSelector(sel, { state: 'attached', timeout: 180000 }); await pg.$eval(sel, (b) => b.click()); };
  const check = async (name, fn) => {
    if (only && name.indexOf(only) < 0) return;
    all++;
    try { await fn(); ok++; if (!mut) console.log('PASS ' + name); } catch (e) { failed.push(name); console.log('FAIL ' + name + ': ' + String(e.message || e).slice(0, 500)); }
  };
  // tonight's act result, the route fixed by routeOrder, into the Mirror World and on to `style` (each earlier space's figures put down first)
  const into = async (pg, o) => {
    await pg.evaluate((o) => {
      const N = window.__night, NS = N.NS;
      NS.act = o.act; NS.actInfo = { scene: 'results', perfects: o.perfects || 0, goods: 3, misses: o.misses || 0, actLaughs: 40, mask: 2 };
      NS.hurt = { falls: o.falls || 0, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = o.order || [];
      N.enterMW();
      const M = NS.mw; M.laughs = 90;
      if (o.style && o.style !== 'corridor') {
        const leg = M.route.findIndex((l) => l.style === o.style);
        if (leg < 0) throw new Error('no ' + o.style + ' on the route ' + M.route.map((l) => l.style).join(','));
        M.bag.length = 0; M.brk = null;
        for (const f of N.foes) f.alive = false;
        N.mwLeaveLeg(); M.leg = leg; N.mwEnterLeg(M);
      }
    }, o);
    await pg.evaluate(TRACE);
  };
  const gameWait = (pg, secs) => pg.waitForFunction((s) => { const M = window.__night.NS.mw; window.__w0 = window.__w0 ?? M.t; if (M.t - window.__w0 >= s) { window.__w0 = undefined; return true; } return false; }, secs, { timeout: 180000 });
  const trace = (pg) => pg.evaluate(() => window.__tr.splice(0));
  // phase runs of figure k: [start game time, length] for each run of phase p
  const runs = (tr, k, p) => { const out = []; let s = -1; for (const e of tr) { const f = e.f.find((x) => x.k === k); const on = f && f.ph === p; if (on && s < 0) s = e.t; if (!on && s >= 0) { out.push([s, e.t - s]); s = -1; } } return out; };
  const kill = (pg, kinds) => pg.evaluate((kinds) => { const N = window.__night; for (const f of N.foes) if (f.alive && (!kinds || kinds.indexOf(f.kind) >= 0)) N.killFoe(f); }, kinds || null);
  const toDoor = (pg) => pg.evaluate(() => {
    const N = window.__night, M = N.NS.mw, P = N.boxRoom(M.space);
    if (P) { M.x = P.at[0] + P.doorX; M.z = P.at[1] - P.half[1] + 0.31; } else { const V = N.N1.voidRoom; M.x = V.at[0] + V.door[0]; M.z = V.at[1] + V.door[1] + 0.4; }
  });

  // ---- 1. the route mixer (owner 23 Nov 09:23: "insecurity come together never as 1 type and solo") ----
  await check('routes: corridor first, the arena last with the Light, every space a group of 2 types, no more spaces than the night allows', async () => {
    const pg = await open('');
    const r = await pg.evaluate(() => {
      const N = window.__night, NS = N.NS, out = [];
      const cases = [{ act: 'fall', p: 2, m: 0, f: 1 }, { act: 'fall', p: 0, m: 2, f: 2 }, { act: 'sweep', p: 2, m: 1, f: 0 }, { act: 'sweep', p: 0, m: 0, f: 0 }, { act: 'drill', p: 1, m: 1, f: 0 }, { act: 'scale', p: 0, m: 1, f: 0 }];
      for (const c of cases) for (let k = 0; k < 4; k++) {
        NS.act = c.act; NS.actInfo = { perfects: c.p, misses: c.m }; NS.hurt = { falls: c.f }; NS.routeOrder = null;
        out.push({ c: c.act + c.p + c.m + c.f, route: N.mwBuildRoute().map((l) => ({ s: l.style, g: l.group })), max: N.N1.mwSpaces[0] });
      }
      // each room once on a fixed order (the random draws above may miss one): photo for a Perfect, void for a miss, parade for the drill, tilt for the scale
      for (const [st, act, p, m] of [['photo', 'sweep', 1, 0], ['void', 'sweep', 0, 1], ['parade', 'drill', 0, 0], ['tilt', 'scale', 0, 0]]) {
        NS.act = act; NS.actInfo = { perfects: p, misses: m }; NS.hurt = { falls: 0 }; NS.routeOrder = [st];
        out.push({ c: st, route: N.mwBuildRoute().map((l) => ({ s: l.style, g: l.group })), max: N.N1.mwSpaces[0] });
      }
      NS.routeOrder = null;
      return out;
    });
    const seen = new Set();
    for (const x of r) {
      const st = x.route.map((l) => l.s), bad = [];
      if (st[0] !== 'corridor' || st[st.length - 1] !== 'ring' || st.length > x.max) bad.push('spaces ' + st.join(','));
      for (const l of x.route) { if (!l.g || l.g.length !== 2 || new Set(l.g).size !== 2) bad.push(l.s + ' group ' + JSON.stringify(l.g)); }
      if (x.route[x.route.length - 1].g[0] !== 'light') bad.push('arena without the Light first');
      if (['photo', 'void', 'parade', 'tilt'].indexOf(x.c) >= 0) for (const l of x.route.slice(1, -1)) seen.add(l.s);
      if (bad.length) throw new Error(x.c + ': ' + bad.join('; '));
    }
    for (const s of ['photo', 'void', 'parade', 'tilt']) if (!seen.has(s)) throw new Error('room never on a route: ' + s + ' (seen ' + [...seen].join(',') + ')');
    console.log('    routes checked', r.length, '| rooms seen', [...seen].join(', '));
    await pg.close();
  });

  // ---- 2. the Stare's photograph room ----
  await check('photo room: sepia and border, the lens tells 0.6 s, the flash in the cone costs Laughs and freezes, the door opens when the group is down', async () => {
    const pg = await open('');
    await into(pg, { act: 'sweep', perfects: 2, order: ['photo'], style: 'photo' });
    const g = await pg.evaluate(() => { const N = window.__night, M = N.NS.mw; return { sp: M.space, foes: N.foes.filter((f) => f.alive).map((f) => f.kind), edge: document.getElementById('photoEdge').classList.contains('on') }; });
    if (g.sp !== 'photo' || g.foes.length !== 2 || g.foes.indexOf('stare') < 0 || !g.edge) throw new Error('entry ' + JSON.stringify(g));
    // the partner down; he stands 3 m in front of the Stare
    await kill(pg, g.foes.filter((k) => k !== 'stare'));
    await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, f = N.foes.find((x) => x.kind === 'stare'); M.x = f.x + 3 * Math.sin(Math.atan2(M.x - f.x, M.z - f.z)); M.z = f.z + 3 * Math.cos(Math.atan2(M.x - f.x, M.z - f.z)); window.__tr.length = 0; });
    await pg.waitForFunction(() => window.__tr.some((e) => e.flash), null, { timeout: 120000 });
    await gameWait(pg, 0.3);
    await pg.screenshot({ path: `${OUT}/photo.png` });
    const tr = await trace(pg), tells = runs(tr, 'stare', 1);
    const fi = tr.findIndex((e) => e.flash), drop = tr[Math.max(0, fi - 2)].l - tr[fi].l;
    const tell = tells.length ? tells[0][1] : -1, froze = tr.some((e) => e.freeze > 0);
    console.log('    lens tell', tell.toFixed(2), 's | flash cost', drop.toFixed(1), 'Laughs | froze', froze);
    if (!(tell >= 0.55 && tell <= 0.75) || !(drop >= 7.5) || !froze) throw new Error(JSON.stringify({ tell, drop, froze }));
    await kill(pg, ['stare']);
    await pg.waitForFunction(() => window.__night.NS.mw.open, null, { timeout: 60000 });
    await toDoor(pg);
    await pg.waitForFunction(() => window.__night.NS.mw.space === 'ring', null, { timeout: 60000 });
    const e = await pg.evaluate(() => document.getElementById('photoEdge').classList.contains('on'));
    if (e) throw new Error('print border still on in the ring');
    await pg.close();
  });

  // ---- 3. Shame's pencil void ----
  await check('void: paper and dark text, his walk draws the line, Shame reaches with a tell and clings, the drawn door, the ring after', async () => {
    const pg = await open('');
    await into(pg, { act: 'sweep', misses: 2, order: ['void'], style: 'void' });
    const g = await pg.evaluate(() => { const N = window.__night; return { sp: N.NS.mw.space, foes: N.foes.filter((f) => f.alive).map((f) => f.kind), paper: document.body.classList.contains('paper'), on: N.NS.paperOn, n0: N.NS.voidN }; });
    if (g.sp !== 'void' || g.foes.length !== 2 || g.foes.indexOf('shame') < 0 || !g.paper || !g.on) throw new Error('entry ' + JSON.stringify(g));
    await kill(pg, g.foes.filter((k) => k !== 'shame'));
    await pg.evaluate(() => { window.__night.input.tx = 0.8; });
    await gameWait(pg, 1.5);
    await pg.evaluate(() => { window.__night.input.tx = 0; });
    const n1 = await pg.evaluate(() => window.__night.NS.voidN);
    if (!(n1 >= g.n0 + 5)) throw new Error('line strokes ' + g.n0 + ' -> ' + n1);
    // he stands; Shame comes, reaches (tell), clings
    await pg.evaluate(() => { window.__tr.length = 0; });
    await pg.waitForFunction(() => window.__night.foes.some((f) => f.kind === 'shame' && f.cling), null, { timeout: 120000 });
    await pg.screenshot({ path: `${OUT}/void.png` });
    const tr = await trace(pg); let reach = 0; for (const e of tr) { const f = e.f.find((x) => x.k === 'shame'); if (f) reach = Math.max(reach, f.reach); }
    console.log('    strokes', n1, '| Shame reach before the cling', reach.toFixed(2), 's');
    if (!(reach >= 0.4)) throw new Error('Shame clung with a tell of ' + reach.toFixed(2) + ' s');
    await kill(pg, ['shame']);
    await pg.waitForFunction(() => window.__night.NS.mw.open && window.__night.NS.voidDoorFill.visible, null, { timeout: 60000 });
    await toDoor(pg);
    await pg.waitForFunction(() => window.__night.NS.mw.space === 'ring', null, { timeout: 60000 });
    const p = await pg.evaluate(() => document.body.classList.contains('paper') || window.__night.NS.paperOn);
    if (p) throw new Error('paper still on in the ring');
    await pg.close();
  });

  // ---- 4. the Sergeant's parade ground ----
  await check('parade: the Sergeant strides on the drum beat, marks its line 2 beats before the thrust, parries on the beat, is hit between beats', async () => {
    const pg = await open('');
    await into(pg, { act: 'drill', order: ['parade'], style: 'parade' });
    const g = await pg.evaluate(() => { const N = window.__night; return { sp: N.NS.mw.space, foes: N.foes.filter((f) => f.alive).map((f) => f.kind), s0: N.paradeU.uScroll.value }; });
    if (g.sp !== 'parade' || g.foes.length !== 2 || g.foes.indexOf('sergeant') < 0) throw new Error('entry ' + JSON.stringify(g));
    await kill(pg, g.foes.filter((k) => k !== 'sergeant'));
    await pg.evaluate(() => { window.__tr.length = 0; });
    await gameWait(pg, 4);
    const tr = await trace(pg), s1 = await pg.evaluate(() => window.__night.paradeU.uScroll.value);
    const marks = runs(tr, 'sergeant', 0).length, so = []; let s = -1;
    for (const e of tr) { const f = e.f.find((x) => x.k === 'sergeant'); if (f && f.so && s < 0) s = e.t; if (f && !f.so && s >= 0) { so.push(e.t - s); s = -1; } }
    console.log('    flats scrolled', (s1 - g.s0).toFixed(0), '| line tells', so.map((x) => x.toFixed(2)).join(', '), 's', marks >= 0 ? '' : '');
    // the line shows for 2 drum beats at 0.6 s (session 24 design, N1.sergeant tell 2, beat 0.6); a thrust a beat early would still show 0.6 s (over the GDD 0.4 s),
    // so the check holds the designed 1.2 s, not the config it reads (change both together)
    const want = 1.2;
    if (!(s1 - g.s0 >= 4) || !so.length || !(Math.min(...so) >= Math.max(0.4, want - 0.1))) throw new Error(JSON.stringify({ scroll: s1 - g.s0, tells: so, want }));
    // a gag on the beat is parried; between beats it lands (hits made in the page on the frame the beat clock says)
    const p = await pg.evaluate(() => new Promise((res) => {
      const N = window.__night, f = N.foes.find((x) => x.kind === 'sergeant'), o = { on: null, off: null };
      const tick = () => {
        const near = Math.min(f.beatT, f.cfg.beat - f.beatT);
        if (o.on === null && near < f.cfg.onBeat * 0.5) { const h = f.hp; N.hitFoe(f, 1, f.x + 1, f.z); o.on = h - f.hp; }
        else if (o.on !== null && o.off === null && near > f.cfg.onBeat * 1.5) { const h = f.hp; N.hitFoe(f, 1, f.x + 1, f.z); o.off = h - f.hp; }
        if (o.off !== null) res(o); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    if (p.on !== 0 || p.off !== 1) throw new Error('parry ' + JSON.stringify(p));
    await pg.close();
  });

  // ---- 5. the Weigher's scale room ----
  await check('scale room: the Weigher is faster the more Laughs he holds, rises 0.6 s before it drops, the room leans by his Laughs', async () => {
    const pg = await open('');
    await into(pg, { act: 'scale', order: ['tilt'], style: 'tilt' });
    const g = await pg.evaluate(() => { const N = window.__night; return { sp: N.NS.mw.space, foes: N.foes.filter((f) => f.alive).map((f) => f.kind) }; });
    if (g.sp !== 'tilt' || g.foes.length !== 2 || g.foes.indexOf('weigher') < 0) throw new Error('entry ' + JSON.stringify(g));
    await kill(pg, g.foes.filter((k) => k !== 'weigher'));
    const speed = async (laughs) => {
      await pg.evaluate((l) => { const N = window.__night, M = N.NS.mw, f = N.foes.find((x) => x.kind === 'weigher'), P = N.boxRoom('tilt'); M.laughs = l; M.x = P.at[0] + 3; M.z = P.at[1] + 3; f.x = P.at[0] - 3; f.z = P.at[1] - 3; f.ph = 0; window.__tr.length = 0; }, laughs);
      await gameWait(pg, 0.8);
      const tr = await trace(pg), a = tr[1], z = tr[tr.length - 1], fa = a.f.find((x) => x.k === 'weigher'), fz = z.f.find((x) => x.k === 'weigher');
      return Math.hypot(fz.x - fa.x, fz.z - fa.z) / Math.max(0.01, z.t - a.t);
    };
    const hi = await speed(90), roll = await pg.evaluate(() => window.__night.NS.mw.roll), lo = await speed(6);
    // the weigh-in: it rises (phase 1) for its tell, then drops
    await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, f = N.foes.find((x) => x.kind === 'weigher'); M.laughs = 60; f.x = M.x + 0.5; f.z = M.z; window.__tr.length = 0; });
    await pg.waitForFunction(() => window.__tr.some((e) => e.f.some((f) => f.k === 'weigher' && f.ph === 2)), null, { timeout: 60000 });
    await pg.screenshot({ path: `${OUT}/tilt.png` });
    const tells = runs(await trace(pg), 'weigher', 1);
    console.log('    Weigher', hi.toFixed(2), 'm/s at 90 Laughs,', lo.toFixed(2), 'at 6 | roll', roll.toFixed(1), 'deg | tell', tells.map((x) => x[1].toFixed(2)).join(','));
    if (!(hi > lo * 2) || !(Math.abs(roll) > 1) || !tells.length || !(tells[0][1] >= 0.55)) throw new Error(JSON.stringify({ hi, lo, roll, tells }));
    await pg.close();
  });

  // ---- 6. nights 2-3: the run carried in the address hash ----
  await check('night 2 from the hash: Mask, shards, bought acts and the wider Light carried; tonight\'s board and quote; next night writes the run', async () => {
    const pg = await open('n=2&m=3&s=9&b=dash&t=&lo=1');
    const r = await pg.evaluate(() => { const N = window.__night, NS = N.NS; return { night: NS.night, mask: NS.mask, start: NS.maskStart, shards: NS.shards, bought: NS.bought.join('.'), r: N.lightStartR(), r0: N.N1.light.spotR, wid: N.N1.lightWiden, board: N.boardActs().map((a) => a.id).join(','), dazai: N.quoteFor('dazai'), want: (N.N1.dazaiNights || [])[1] }; });
    console.log('    night', r.night, '| Mask', r.mask, '| shards', r.shards, '| bought', r.bought, '| Light', r.r0, '->', r.r, '| board', r.board);
    if (r.night !== 2 || r.mask !== 3 || r.start !== 3 || r.shards !== 9 || r.bought !== 'dash') throw new Error('carry ' + JSON.stringify(r));
    if (!(r.wid > 0) || Math.abs(r.r - r.r0 * (1 + r.wid)) > 1e-6) throw new Error('Light not wider ' + JSON.stringify(r));
    if (r.board.split(',')[0] !== 'fall' || r.board.split(',').length < 2 || (r.want && r.dazai !== r.want)) throw new Error('board or quote ' + JSON.stringify(r));
    await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.mask = 6; NS.shards = 4; NS.bought = ['sweep', 'scale']; NS.result = 'win'; NS.act = 'scale'; NS.actInfo = { perfects: 1, goods: 1, misses: 1 }; N.endCard(); });
    const t = await pg.textContent('#nextNight');
    if (!/night 3/.test(t)) throw new Error('next button ' + t);
    await Promise.all([pg.waitForNavigation({ timeout: 60000 }).catch(() => null), press(pg, '#nextNight')]);
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
    const n = await pg.evaluate(() => ({ h: location.hash, night: window.__night.NS.night, mask: window.__night.NS.mask, b: window.__night.NS.bought.join('.'), lo: window.__night.NS.lightOuts }));
    console.log('    after Go on:', n.h);
    if (n.night !== 3 || n.mask !== 6 || n.b !== 'sweep.scale' || n.lo !== 1) throw new Error('next night ' + JSON.stringify(n));
    await pg.close();
  });
  await check('night 3 is the last: the drill is tonight\'s tryout, no next night, start again clears the run', async () => {
    const pg = await open('n=3&m=6&s=4&b=sweep.scale&t=sweep.scale&lo=1');
    const r = await pg.evaluate(() => { const N = window.__night; return { board: N.boardActs().map((a) => a.id + (a.tryout ? '*' : '')).join(','), last: N.NS.night === N.N1.nights }; });
    if (!r.last || r.board !== 'fall,sweep,scale,drill*') throw new Error(JSON.stringify(r));
    await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.result = 'lose'; NS.act = 'drill'; NS.actInfo = { perfects: 1, goods: 1, misses: 1 }; N.endCard(); });
    const b = await pg.evaluate(() => ({ next: !!document.getElementById('nextNight'), retry: !!document.getElementById('retryNight') }));
    if (b.next || !b.retry) throw new Error('end card buttons ' + JSON.stringify(b));
    await Promise.all([pg.waitForNavigation({ timeout: 60000 }).catch(() => null), press(pg, '#again1')]);
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
    const n = await pg.evaluate(() => ({ h: location.hash, night: window.__night.NS.night, mask: window.__night.NS.mask }));
    if (n.night !== 1 || n.mask !== 0 || n.h) throw new Error('restart ' + JSON.stringify(n));
    await pg.close();
  });

  // ---- 7. the last night: the Performer, then the ending ----
  const perfFight = async (hash) => {
    const pg = await open(hash);
    await into(pg, { act: 'sweep', perfects: 1, order: [], style: 'ring' });
    await kill(pg);
    await pg.waitForFunction(() => window.__night.foes.some((f) => f.kind === 'performer' && f.alive), null, { timeout: 120000 });
    return pg;
  };
  await check('Performer: HP by Mask, its opening run cannot be hurt, each bought act is an attack with a tell of at least 0.6 s that costs Laughs', async () => {
    const pg = await perfFight('n=3&m=8&s=0&b=sweep.scale.dash&t=sweep.scale&lo=0');
    const a = await pg.evaluate(() => { const N = window.__night, f = N.foes.find((x) => x.kind === 'performer'); const h = f.hp; N.hitFoe(f, 3, f.x + 1, f.z); return { hp: f.hp, before: h, list: f.list.join(','), show: f.show }; });
    console.log('    Performer HP', a.before, '| attacks', a.list);
    if (a.before !== 16 || a.hp !== a.before || !a.show || a.list !== 'fall,sweep,scale,dash') throw new Error(JSON.stringify(a));
    // he stands still where it aims; each attack in turn: its tell, then the hit (Laughs set high so the gnaw never ends the fight; a hit = the frame his wince starts)
    await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, f = N.foes.find((x) => x.kind === 'performer'); M.laughs = 3000; M.x = f.x; M.z = f.z + f.cfg.keep; window.__tr.length = 0; });
    await pg.waitForFunction(() => { const f = window.__night.foes.find((x) => x.kind === 'performer'); return f && !f.show && f.k >= 5; }, null, { timeout: 240000 });
    const tr = await trace(pg), tells = [];
    let s = -1, atk = '';
    for (const e of tr) { const f = e.f.find((x) => x.k === 'performer'); if (!f) continue; if (f.ph === 1 && s < 0) { s = e.t; atk = f.atk; } if (f.ph !== 1 && s >= 0) { tells.push([atk, e.t - s]); s = -1; } }
    const hits = []; for (let i = 1; i < tr.length; i++) if (tr[i].h > tr[i - 1].h + 0.1) hits.push(tr[i - 1].l - tr[i].l);
    console.log('    tells', tells.map((x) => x[0] + ' ' + x[1].toFixed(2)).join(', '), '| Laughs per hit standing', hits.map((x) => x.toFixed(1)).join(', '));
    if (tells.length < 4 || tells.some((x) => x[1] < 0.55) || tells.slice(0, 4).map((x) => x[0]).join(',') !== 'fall,sweep,scale,dash' || hits.length < 4 || hits.some((x) => x < 7)) throw new Error(JSON.stringify({ tells, hits }));
    await pg.close();
  });
  await check('Performer: with nothing bought at Mask 0 it has HP 12 and only the fall', async () => {
    const pg = await perfFight('n=3&m=0&s=0&b=&t=&lo=0');
    const a = await pg.evaluate(() => { const f = window.__night.foes.find((x) => x.kind === 'performer'); return { hp: f.hp, list: f.list.join(',') }; });
    if (a.hp !== 12 || a.list !== 'fall') throw new Error(JSON.stringify(a));
    await pg.close();
  });
  const toChoice = async (pg) => {
    await pg.waitForFunction(() => { const f = window.__night.foes.find((x) => x.kind === 'performer'); return f && !f.show; }, null, { timeout: 120000 });
    await kill(pg, ['performer']);
    await pg.waitForFunction(() => window.__night.S.mode === 'end', null, { timeout: 60000 });
    await pg.waitForSelector('#toLight:not(.held)', { timeout: 60000 });
    const q = await pg.textContent('#card_nietzsche .quote').catch(() => '');
    await press(pg, '#toLight');
    await pg.waitForSelector('#endQuit', { timeout: 180000 });
    return { q, crowd: await pg.evaluate(() => ({ n: window.__night.endObj.crowd.count, want: window.__night.N1.endAudience, paint: window.__night.chars.clown.face.material.uniforms.uPaintAmt.value })) };
  };
  await check('ending: quit: the line, his warm light with the paint off, the audience one by one, two buttons; he bows, says "I quit", walks out; only the restart button', async () => {
    const pg = await perfFight('n=3&m=2&s=0&b=&t=&lo=0');
    const c = await toChoice(pg);
    await pg.screenshot({ path: `${OUT}/ending_choice.png` });
    if (!c.q || c.crowd.n !== c.crowd.want || c.crowd.paint !== 0) throw new Error(JSON.stringify(c));
    await press(pg, '#endQuit');
    await pg.waitForFunction(() => document.getElementById('prompt') && /I quit/.test(document.getElementById('prompt').textContent), null, { timeout: 60000 });
    await pg.waitForSelector('#again1', { timeout: 180000 });
    const e = await pg.evaluate(() => { const N = window.__night, E = N.NS.end; return { step: E.step, d: Math.hypot(E.x - N.N1.endExit[0], E.z - N.N1.endExit[1]), buttons: [...document.querySelectorAll('.card:not(.hidden) button')].map((b) => b.id) }; });
    console.log('    quit: end', e.step, '| from the exit', e.d.toFixed(2), 'm | buttons', e.buttons.join(','));
    if (e.step !== 'done' || !(e.d < 0.25) || e.buttons.join(',') !== 'again1') throw new Error(JSON.stringify(e));
    await pg.close();
  });
  await check('ending: one last act: three falls with no words, then the restart button', async () => {
    const pg = await perfFight('n=3&m=2&s=0&b=&t=&lo=0');
    await toChoice(pg);
    await press(pg, '#endAgain');
    await pg.waitForSelector('#again1', { timeout: 180000 });
    const e = await pg.evaluate(() => ({ falls: window.__night.NS.end.falls, prompt: (document.getElementById('prompt') || {}).textContent || '' }));
    if (e.falls !== 3 || e.prompt.trim()) throw new Error(JSON.stringify(e));
    await pg.close();
  });
  await check('no page errors', async () => { if (errs.length) throw new Error(errs.slice(0, 4).join(' | ')); });
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
      const m = MUTS[k];
      const r = await suite(b, m, m[3]);
      if (r.failed.some((n) => n.indexOf(m[3]) >= 0)) { caught++; console.log(`PASS nights mutation ${k}: caught (${m[3]})`); }
      else { code = 1; console.log(`FAIL nights mutation ${k}: not caught by '${m[3]}' (failed: ${r.failed.join('; ') || 'none'})`); }
    }
    console.log(`RESULT nights mutations ${caught} of ${names.length} caught`);
  } else {
    const r = await suite(b, null, process.env.ONLY_CHECK);
    console.log(`RESULT nights ${r.ok} of ${r.all} pass`);
    if (r.ok !== r.all) code = 1;
  }
  await b.close();
  process.exit(code);
})().catch((e) => { console.log('FAIL nights crashed: ' + (e && e.stack || e)); process.exit(1); });

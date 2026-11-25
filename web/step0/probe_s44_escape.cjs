// Session 44 batch 3 probe (owner 25 Nov 13:52-13:55, panel design/PANEL-mirror-escape-25nov.md: E1, E2, X1a, X2, X3, X4, X5). Runs on CI
// (tools/probe_ci.sh), software GL, desktop 1280x720 (logic only, rule 12). State jumps through window.__night; game time only.
// Night 1 (route fixed to the photograph room): the way out is open on entry, "Get out." shows, one figure guards the way out (X4), a gag knocks a
// figure over and it gets up again (X3, never beaten), out through the door pays, the arena has a pale door with a guard, through it he is out (win).
// Last night: the arena door leads back into the ring with the Performer (E2), nearer each return (X2); standing still starts the Performer's walk up and
// its touch starts the ending, never a loss at 0 Laughs (X1a); the third return starts the walk up while he keeps moving (cap).
// Night 2: his thought after the child is the owner's night-2 line (25 Nov 18:49); night 1 keeps the old one.
// MUT=off runs the same steps with N1.mwEscape and N1.lastNoExit false (the fight): most steps must FAIL. Ends with RESULT s44 escape n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html', MUT = process.env.MUT || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  // MUT=off: night1.html served with both switches off (N1 is frozen: the page's own config is the only way to change it)
  if (MUT === 'off' && path.basename(f) === 'night1.html') { let t = fs.readFileSync(f, 'utf8'); for (const k of ['mwEscape', 'lastNoExit']) { if (t.split(`  ${k}: true,`).length !== 2) throw new Error('switch not found once: ' + k); t = t.replace(`  ${k}: true,`, `  ${k}: false,`); } r.end(t); return; }
  r.end(fs.readFileSync(f));
});
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
async function open(b, hash) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}${hash}`); if (hash) await pg.reload();
  await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
  await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 30000 });
  const gameWait = (secs) => pg.waitForFunction((s) => { const M = window.__night.NS.mw; window.__w0 = window.__w0 ?? M.t; if (M.t - window.__w0 >= s) { window.__w0 = undefined; return true; } return false; }, secs, { timeout: 180000 });
  return { ctx, pg, errs, gameWait };
}
// into the Mirror World and straight to the leg of the given style (as probe_s43_driveoff.cjs)
const into = (style) => {
  const N = window.__night, NS = N.NS;
  NS.act = 'sweep'; NS.actInfo = { scene: 'results', perfects: 1, goods: 3, misses: 0, actLaughs: 40, mask: 2 };
  NS.hurt = { falls: 0, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = ['photo'];
  N.enterMW();
  const M = NS.mw; M.laughs = 900;
  const leg = M.route.findIndex((l) => l.style === style);
  if (leg < 0) return { route: M.route.map((l) => l.style) };
  M.bag.length = 0; M.brk = null;
  for (const f of N.foes) f.alive = false;
  // as the game's cut does (mwCut, F25): the last space's tips go before the next space's
  M.tip = ''; M.tipT = 0; M.tips.length = 0;
  N.mwLeaveLeg(); M.leg = leg; N.mwEnterLeg(M); M.t = 0;
  return { route: M.route.map((l) => l.style), leg };
};
// the way out of the current space (Blender-free ring/room coordinates) and the figure nearest to it
const doorInfo = () => {
  const N = window.__night, M = N.NS.mw, P = N.boxRoom(M.space);
  const d = P ? [P.at[0] + P.doorX, P.at[1] - P.half[1]] : [N.NS.escDoorX, N.NS.escDoorZ];
  let g = null, gd = 1e9;
  for (const f of N.foes) if (f.alive && f.kind !== 'light') { const k = Math.hypot(f.x - d[0], f.z - d[1]); if (k < gd) { gd = k; g = f.kind; } }
  return { space: M.space, open: !!M.open, door: d.map((v) => +v.toFixed(2)), guard: g, guardD: +gd.toFixed(2), want: N.N1.escGuard, doorShown: !!(N.NS.escDoor && N.NS.escDoor.visible), tip: document.getElementById('mwTip').textContent };
};
// the walk out, on the game's own route (as probe_s42_stranger.cjs)
async function toCorridor(pg) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.getClientRects().length > 0), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.getClientRects().length > 0).click(), re.source); };
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.getClientRects().length > 0); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && !(await pg.evaluate(() => window.__night.NS.scene === 'boardwall' || [...document.querySelectorAll('button')].some((b) => /act board/.test(b.innerText) && b.getClientRects().length > 0))); i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); if (process.env.DEBUG && i % 10 === 0) console.log('route', i, await pg.evaluate(() => window.__night.NS.scene + ' ' + [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0).map((b) => b.innerText).join('|'))); }
  if ((await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall') await click(/act board/);
  for (let i = 0; i < 40 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.down('KeyW'); await pg.waitForTimeout(400); await pg.keyboard.up('KeyW'); }
  await click(/^The fall$/);
  await click(/^(Perform it|Do it)$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 120000 });
}
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  // ---- night 1
  {
    const { ctx, pg, errs, gameWait } = await open(b, '');
    const r = await pg.evaluate(into, 'photo');
    report(r.leg >= 0, 'route has the photograph room', r);
    await pg.waitForFunction(() => window.__night.NS.mw.space === 'photo' && window.__night.foes.filter((f) => f.alive).length >= 2, null, { timeout: 120000 }).catch(() => {});
    await gameWait(0.3);
    const d0 = await pg.evaluate(doorInfo);
    report(d0.open && /Get out/.test(d0.tip), 'E1/X5: the way out is open on entry and the line says "Get out"', d0);
    report(d0.guard && d0.guardD < d0.want + 0.6, 'X4: a figure stands in front of the way out', d0);
    // X3: a gag on a figure (not the Light): knocked over, held, never beaten, up again
    const h0 = await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, f = N.foes.find((q) => q.alive && q.kind !== 'light' && q.kind !== 'stare'); if (!f) return null; window.__hk = f.kind; const hp = f.hp; N.hitFoe(f, 99, f.x + Math.sin(f.yaw + Math.PI / 2), f.z + Math.cos(f.yaw + Math.PI / 2)); return { k: f.kind, hp, hpNow: f.hp, alive: f.alive, held: f.escT || 0 }; });
    report(!!h0 && h0.alive && h0.hpNow === h0.hp && h0.held > 0, 'X3/E1: a gag does not beat it: it is held, alive, unhurt', h0);
    await gameWait(0.3);
    const h1 = await pg.evaluate(() => { const f = window.__night.foes.find((q) => q.kind === window.__hk); return { tip: +f.root.rotation.x.toFixed(2), alive: f.alive }; });
    report(h1.tip < -0.6 && h1.alive, 'X3: it is knocked over (tipped back)', h1);
    await gameWait(2.2);
    const h2 = await pg.evaluate(() => { const f = window.__night.foes.find((q) => q.kind === window.__hk); return { tip: +f.root.rotation.x.toFixed(2), alive: f.alive, held: f.escT || 0, inScene: !!f.root.parent }; });
    report(h2.tip === 0 && h2.alive && h2.held === 0 && h2.inScene, 'X3: it gets up and comes again', h2);
    // out through the door: pays, into the ring
    await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, P = N.boxRoom(M.space); M.x = P.at[0] + P.doorX; M.z = P.at[1] - P.half[1] + 0.31; });
    const inRing = await pg.waitForFunction(() => window.__night.NS.mw.space === 'ring', null, { timeout: 60000 }).then(() => true, () => false);
    const pay = await pg.evaluate(() => ({ glass: window.__night.NS.mw.shards, want: window.__night.N1.mwSpacePay }));
    report(inRing && pay.glass === pay.want, 'E1: out of the room with its figures standing, the space pays', pay);
    if (inRing) {
      await gameWait(0.5);
      const d1 = await pg.evaluate(doorInfo);
      report(d1.doorShown && d1.guard && d1.guardD < d1.want + 0.6, 'E1/X4: the arena has a pale door, a figure in front of it', d1);
      const alive = await pg.evaluate(() => window.__night.foes.filter((f) => f.alive && f.kind !== 'light').length);
      await pg.evaluate(() => { const N = window.__night, M = N.NS.mw; M.x = N.NS.escDoorX; M.z = N.NS.escDoorZ + 0.3; });
      const end = await pg.waitForFunction(() => window.__night.NS.mw.over, null, { timeout: 60000 }).then(() => true, () => false);
      const k = await pg.evaluate(() => { const N = window.__night; return { over: N.NS.mw.over, kept: N.NS.mwKept, want: 2 * N.N1.mwSpacePay }; });
      report(end && k.over === 'win' && k.kept === k.want && alive > 0, 'E1: through the arena door with them still standing, he is out and keeps two spaces\' pay', { ...k, alive });
      const card = await pg.evaluate(() => { const N = window.__night; N.endCard(); return ((document.querySelector('#card_end .sum') || {}).textContent || '').replace(/\s+/g, ' '); });
      report(/got out/.test(card) && /followed him out/.test(card), 'E1: the end card says he got out and they followed him', card.slice(card.indexOf('Mirror'), card.indexOf('Mirror') + 160));
    }
    report(!errs.length, 'night 1: no page errors', errs.slice(0, 3));
    await ctx.close();
  }
  // ---- last night: two returns, then he stands (X1a), Laughs run out while he stands: the ending, never a loss
  const LAST = '#n=3&m=6&s=60&b=&t=sweep.scale.drill&lo=1';
  {
    const { ctx, pg, errs, gameWait } = await open(b, LAST);
    const r = await pg.evaluate(into, 'ring');
    report(r.leg >= 0 && (await pg.evaluate(() => window.__night.NS.night === window.__night.N1.nights)), 'last night: in the arena', r);
    const back = [];
    for (let i = 0; i < 2; i++) {
      await gameWait(0.4);
      await pg.evaluate(() => { const N = window.__night, M = N.NS.mw; M.x = N.NS.escDoorX; M.z = N.NS.escDoorZ + 0.3; });
      await pg.waitForFunction((n) => (window.__night.NS.mw.returns || 0) >= n || window.__night.NS.mw.over, i + 1, { timeout: 60000 }).catch(() => {});
      back.push(await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, f = N.foes.find((q) => q.kind === 'performer' && q.alive); return { over: M.over, returns: M.returns || 0, perf: !!f, d: f ? +Math.hypot(f.x - M.x, f.z - M.z).toFixed(2) : null, doorBehind: f ? N.NS.escDoorZ < f.z : null }; }));
    }
    const near = await pg.evaluate(() => window.__night.N1.escNear);
    report(back.length === 2 && back.every((x, i) => x.returns === i + 1 && !x.over && x.perf && Math.abs(x.d - near[i]) < 0.5 && x.doorBehind), 'E2/X2: the door leads back into the ring, the Performer nearer each time, the door behind it', back);
    await gameWait(0.5);
    await pg.evaluate(() => { window.__night.NS.mw.laughs = 3; });
    const ended = await pg.waitForFunction(() => window.__night.NS.mw.over, null, { timeout: 120000 }).then(() => true, () => false);
    const e = await pg.evaluate(() => ({ over: window.__night.NS.mw.over, result: window.__night.NS.result, up: !!window.__night.NS.mw.escUp }));
    report(ended && e.over === 'ending' && e.up, 'X1a: he stands, his Laughs run out, the Performer walks up and its touch starts the ending (not a loss)', e);
    report(!errs.length, 'last night (stand): no page errors', errs.slice(0, 3));
    await ctx.close();
  }
  // ---- last night: three returns while he keeps moving: the cap starts the walk up
  {
    const { ctx, pg, errs, gameWait } = await open(b, LAST);
    await pg.evaluate(into, 'ring');
    for (let i = 0; i < 3; i++) {
      await gameWait(0.4);
      await pg.evaluate(() => { const N = window.__night, M = N.NS.mw; M.x = N.NS.escDoorX; M.z = N.NS.escDoorZ + 0.3; });
      await pg.waitForFunction((n) => (window.__night.NS.mw.returns || 0) >= n || window.__night.NS.mw.over, i + 1, { timeout: 60000 }).catch(() => {});
    }
    await pg.keyboard.down('KeyA');
    await gameWait(0.8);
    const c = await pg.evaluate(() => ({ returns: window.__night.NS.mw.returns || 0, up: !!window.__night.NS.mw.escUp, over: window.__night.NS.mw.over, still: +window.__night.NS.mw.still.toFixed(2) }));
    await pg.keyboard.up('KeyA');
    report(c.returns === 3 && c.up && c.over !== 'lose', 'cap: after the third return the Performer walks up even while he moves', c);
    report(!errs.length, 'last night (cap): no page errors', errs.slice(0, 3));
    await ctx.close();
  }
  // ---- the clown's thought after the child (owner 25 Nov 18:49): night 2 has its own line, night 1 keeps the old one
  for (const [hash, n] of [['#n=2&m=3&s=40&b=&t=sweep.scale&lo=0', 2], ['', 1]]) {
    const { ctx, pg, errs } = await open(b, hash);
    try {
      await toCorridor(pg);
      await pg.evaluate(() => { const N = window.__night; N.NS.belong = 1; for (const m of N.crew) if (m.cd.id === 'child') m.saidT = 0; });
      await pg.waitForFunction(() => !document.getElementById('thought').classList.contains('hidden'), null, { timeout: 60000 });
      const t = await pg.evaluate(() => ({ text: document.getElementById('thought').textContent, night: window.__night.NS.night, want: window.__night.N1.belongNights[window.__night.NS.night - 1] || window.__night.N1.belongText }));
      report(t.night === n && t.text === t.want && (n !== 2 || /Night after night/.test(t.text)), `night ${n}: his thought after the child is the night's own line`, t);
    } catch (e) { report(false, `night ${n}: his thought after the child`, String(e).slice(0, 200)); }
    report(!errs.length, `night ${n} thought: no page errors`, errs.slice(0, 3));
    await ctx.close();
  }
  console.log(`RESULT s44 escape ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

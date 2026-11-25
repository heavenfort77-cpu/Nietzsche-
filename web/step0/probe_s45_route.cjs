// Session 45 probe (owner 25 Nov 19:07: "night [2] and night 3 the mirror world is supposed to be longer or use different platforms").
// Runs on CI (tools/probe_ci.sh), software GL, desktop 1280x720 (logic only, rule 12). State jumps through window.__night; game time only.
// The route is built the game's own way (mwBuildRoute, NS.routeOrder null) 20 times for each act result:
//   fall clean (whisper), fall with a Perfect (whisper, stare), fall with a Perfect and a miss (whisper, stare, shame), the scale (stare, weigher).
// Night 1 (no run hash): at most N1.mwSpaces[0] spaces, middle rooms only from what the act earned (unchanged by design).
// Nights 2 and 3 (run hash with the rooms seen on earlier nights, sp=): exactly N1.mwSpaces[night - 1] spaces, no room twice, the arena last,
// at least one middle room not seen on an earlier night, each middle room holds its own insecurity and two different types.
// Night 3: every space of a real route is entered and its group comes up. Carry: the rooms of night 1's route reach night 2's run hash.
// MUT=nofill serves the page with N1.mwFillNights false: the night 2 and 3 length and unseen-room steps must FAIL. Ends with RESULT s45 route n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html', MUT = process.env.MUT || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  // MUT=nofill: night1.html served with N1.mwFillNights false (the route as before F50): the length and unseen-room steps must FAIL
  if (MUT === 'nofill' && path.basename(f) === 'night1.html') { const t = fs.readFileSync(f, 'utf8'); if (t.split('  mwFillNights: true,').length !== 2) throw new Error('switch not found once'); r.end(t.replace('  mwFillNights: true,', '  mwFillNights: false,')); return; }
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
  return { ctx, pg, errs };
}
const CASES = [
  { name: 'fall clean', act: 'fall', falls: 1, p: 0, m: 0 },
  { name: 'fall with a Perfect', act: 'fall', falls: 1, p: 1, m: 0 },
  { name: 'fall with a Perfect and a miss', act: 'fall', falls: 1, p: 1, m: 1 },
  { name: 'the scale', act: 'scale', falls: 0, p: 1, m: 0 },
];
// 20 routes for one act result: per route its styles and groups
const build = (c) => {
  const N = window.__night, NS = N.NS, out = [];
  NS.act = c.act; NS.actInfo = { scene: 'results', perfects: c.p, goods: 2, misses: c.m, actLaughs: 40, mask: 1 };
  NS.hurt = { falls: c.falls, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = null;
  for (let i = 0; i < 20; i++) out.push(N.mwBuildRoute().map((l) => ({ s: l.style, g: l.group })));
  const own = {}; for (const k in N.N1.mwStyleOf) own[N.N1.mwStyleOf[k]] = k;
  return { routes: out, max: N.N1.mwSpaces[Math.min(NS.night, N.N1.mwSpaces.length) - 1], night: NS.night, seen: (N.RUN.sp || []).slice(), own, styleOf: N.N1.mwStyleOf, on: N.N1.mwStyles };
};
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  // ---- night 1: unchanged
  {
    const { ctx, pg, errs } = await open(b, '');
    for (const c of CASES) {
      const r = await pg.evaluate(build, c);
      const earned = { 'fall clean': ['corridor'], 'fall with a Perfect': ['corridor', 'photo'], 'fall with a Perfect and a miss': ['corridor', 'photo', 'void'], 'the scale': ['photo', 'tilt'] }[c.name];
      const badR = r.routes.filter((rt) => rt.length > r.max || rt[rt.length - 1].s !== 'ring' || rt.slice(0, -1).some((l) => l.s !== 'corridor' && earned.indexOf(l.s) < 0));
      report(r.night === 1 && !badR.length, `night 1, ${c.name}: at most ${r.max} spaces, middle rooms only from what the act earned`, { lens: [...new Set(r.routes.map((x) => x.length))], bad: badR.slice(0, 2).map((x) => x.map((l) => l.s)) });
    }
    // carry: night 1's middle room reaches the next night's run hash
    try {
      const mids = await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.act = 'fall'; NS.actInfo = { scene: 'results', perfects: 1, goods: 2, misses: 0, actLaughs: 40, mask: 1 }; NS.hurt = { falls: 1, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = null; N.enterMW(); return NS.mw.route.map((l) => l.style).filter((s) => s !== 'corridor' && s !== 'ring'); });
      const has = await pg.evaluate(() => typeof window.__night.runNext === 'function');
      let hash = '';
      if (has) { await pg.evaluate(() => { setTimeout(() => window.__night.runNext(), 0); }); await pg.waitForFunction(() => window.__night && window.__night.S.ready && window.__night.NS.night === 2, null, { timeout: 180000 }); hash = await pg.evaluate(() => location.hash + ' RUN.sp=' + JSON.stringify(window.__night.RUN.sp)); }
      const sp = (new URLSearchParams(hash.split(' ')[0].slice(1)).get('sp') || '').split('.').filter(Boolean);
      report(has && mids.length > 0 && mids.every((s) => sp.indexOf(s) >= 0), "carry: night 1's rooms are in night 2's run hash (sp=)", { mids, hash, runNext: has });
    } catch (e) { report(false, "carry: night 1's rooms are in night 2's run hash (sp=)", String(e).slice(0, 200)); }
    report(!errs.length, 'night 1: no page errors', errs.slice(0, 3));
    await ctx.close();
  }
  // ---- nights 2 and 3: longer, rooms not seen before first
  for (const [n, seen] of [[2, ['photo']], [3, ['photo', 'void', 'parade']]]) {
    const { ctx, pg, errs } = await open(b, `#n=${n}&m=1&s=0&sp=${seen.join('.')}`);
    for (const c of CASES) {
      const r = await pg.evaluate(build, c);
      const lens = [...new Set(r.routes.map((x) => x.length))];
      report(r.night === n && lens.length === 1 && lens[0] === r.max, `night ${n}, ${c.name}: every route has ${r.max} spaces (N1.mwSpaces)`, { lens, sample: r.routes[0].map((l) => l.s) });
      const dup = r.routes.filter((rt) => new Set(rt.map((l) => l.s)).size !== rt.length || rt[rt.length - 1].s !== 'ring');
      report(!dup.length, `night ${n}, ${c.name}: no room twice in a route, the arena last`, dup.slice(0, 2).map((x) => x.map((l) => l.s)));
      const unseen = Object.keys(r.on).filter((s) => r.on[s] && s !== 'corridor' && s !== 'ring' && seen.indexOf(s) < 0);
      const stale = r.routes.filter((rt) => !rt.some((l) => l.s !== 'corridor' && l.s !== 'ring' && seen.indexOf(l.s) < 0));
      report(unseen.length > 0 && !stale.length, `night ${n}, ${c.name}: every route has a room not seen on an earlier night (seen ${seen.join(', ')})`, { unseen, stale: stale.slice(0, 2).map((x) => x.map((l) => l.s)) });
      const badG = [];
      for (const rt of r.routes) for (const l of rt) {
        const g = l.g || [];
        if (new Set(g).size < 2 || new Set(g).size !== g.length) badG.push(l);
        else if (l.s !== 'corridor' && l.s !== 'ring' && g[0] !== r.own[l.s]) badG.push(l);
      }
      report(!badG.length, `night ${n}, ${c.name}: each space two different types, each middle room led by its own insecurity`, badG.slice(0, 3));
    }
    if (n === 3) {
      // every space of one real route is entered and its group comes up
      const rt = await pg.evaluate(() => { const N = window.__night, NS = N.NS; NS.act = 'fall'; NS.actInfo = { scene: 'results', perfects: 0, goods: 2, misses: 0, actLaughs: 40, mask: 1 }; NS.hurt = { falls: 1, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = null; N.enterMW(); NS.mw.laughs = 900; return NS.mw.route.map((l) => ({ s: l.style, g: l.group })); });
      for (let i = 1; i < rt.length; i++) {
        await pg.evaluate((leg) => { const N = window.__night, M = N.NS.mw; M.bag.length = 0; M.brk = null; for (const f of N.foes) f.alive = false; M.tip = ''; M.tipT = 0; M.tips.length = 0; N.mwLeaveLeg(); M.leg = leg; N.mwEnterLeg(M); M.t = 0; }, i);
        const want = rt[i].g.filter((k) => k !== 'performer');
        await pg.waitForFunction((w) => { const N = window.__night, up = N.foes.filter((f) => f.alive).map((f) => f.kind); return w.every((k) => up.indexOf(k) >= 0); }, want, { timeout: 60000 }).catch(() => {});
        const got = await pg.evaluate(() => { const N = window.__night; return { space: N.NS.mw.space, up: N.foes.filter((f) => f.alive).map((f) => f.kind) }; });
        report(got.space === rt[i].s && want.every((k) => got.up.indexOf(k) >= 0), `night 3, space ${i + 1} of ${rt.length} (${rt[i].s}): entered and its group is up`, { want, got });
      }
    }
    report(!errs.length, `night ${n}: no page errors`, errs.slice(0, 3));
    await ctx.close();
  }
  console.log(`RESULT s45 route ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

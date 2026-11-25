// Session 43 batch 2 probe (owner 25 Nov ~13:00, theme panel C1 in design/PANEL-theme-core-message-25nov.md). Runs on CI (tools/probe_ci.sh), software GL, desktop 1280x720.
// Night 1, act sweep, route fixed to the photograph room. The room's figures put down (killFoe, test-side): none sinks, each walks away from him and leaves;
// no glass on the floor (Glass stays 0 after the room opens); out through its door the space pays N1.mwSpacePay with its tip; the arena's figures put down,
// he comes out (win) and keeps two spaces' pay; the end card says "driven off". PAGE=<file> serves another copy. Ends with RESULT s43 driveoff n of m pass.
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
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
  await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 30000 });
  const gameWait = (secs) => pg.waitForFunction((s) => { const M = window.__night.NS.mw; window.__w0 = window.__w0 ?? M.t; if (M.t - window.__w0 >= s) { window.__w0 = undefined; return true; } return false; }, secs, { timeout: 180000 });
  const into = await pg.evaluate(() => {
    const N = window.__night, NS = N.NS;
    NS.act = 'sweep'; NS.actInfo = { scene: 'results', perfects: 1, goods: 3, misses: 0, actLaughs: 40, mask: 2 };
    NS.hurt = { falls: 0, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = ['photo'];
    N.enterMW();
    const M = NS.mw; M.laughs = 900;
    const leg = M.route.findIndex((l) => l.style === 'photo');
    if (leg < 0) return { route: M.route.map((l) => l.style) };
    M.bag.length = 0; M.brk = null;
    for (const f of N.foes) f.alive = false;
    N.mwLeaveLeg(); M.leg = leg; N.mwEnterLeg(M);
    return { route: M.route.map((l) => l.style), leg };
  });
  report(into.leg >= 0, 'route has the photograph room', into);
  const ok = await pg.waitForFunction(() => window.__night.NS.mw.space === 'photo' && window.__night.foes.filter((f) => f.alive).length >= 2, null, { timeout: 120000 }).then(() => true, () => false);
  report(ok, 'in the photograph room with its group', { ok });
  if (ok) {
    const before = await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, out = []; for (const f of N.foes) if (f.alive && f.kind !== 'light') { out.push({ k: f.kind, d: Math.hypot(f.x - M.x, f.z - M.z) }); N.killFoe(f); } return { out, now: N.foes.filter((f) => out.some((o) => o.k === f.kind)).map((f) => ({ k: f.kind, sink: f.sink, off: f.off })) }; });
    report(before.now.every((x) => !(x.sink > 0)), 'C1: a figure put down does not sink into the floor', before.now);
    await gameWait(0.6);
    const mid = await pg.evaluate((ks) => { const N = window.__night, M = N.NS.mw; return N.foes.filter((f) => ks.indexOf(f.kind) >= 0).map((f) => ({ k: f.kind, d: +Math.hypot(f.x - M.x, f.z - M.z).toFixed(2), y: +f.root.position.y.toFixed(3) })); }, before.out.map((o) => o.k));
    report(mid.length > 0 && mid.every((x) => x.y > -0.01 && x.d >= before.out.find((o) => o.k === x.k).d + 0.5), 'C1: it walks away from him, on its feet', { before: before.out, mid });
    await pg.waitForFunction(() => window.__night.NS.mw.open, null, { timeout: 60000 }).catch(() => {});
    await gameWait(2.5);
    const st = await pg.evaluate((ks) => { const N = window.__night, M = N.NS.mw; return { glass: M.shards, open: M.open, gone: N.foes.filter((f) => ks.indexOf(f.kind) >= 0).map((f) => ({ k: f.kind, inScene: !!f.root.parent })) }; }, before.out.map((o) => o.k));
    report(st.glass === 0, 'C1: no glass for putting them down (Glass 0 after the room opens)', st);
    report(st.gone.every((x) => !x.inScene), 'C1: driven off figures have left the space', st.gone);
    await pg.evaluate(() => { const N = window.__night, M = N.NS.mw, P = N.boxRoom(M.space); M.x = P.at[0] + P.doorX; M.z = P.at[1] - P.half[1] + 0.31; });
    const inRing = await pg.waitForFunction(() => window.__night.NS.mw.space === 'ring', null, { timeout: 60000 }).then(() => true, () => false);
    const pay = await pg.evaluate(() => { const N = window.__night, M = N.NS.mw; return { glass: M.shards, want: N.N1.mwSpacePay, tip: M.tip + ' / ' + M.tips.join(' / '), tipWant: (N.N1.mwSpacePayTip || '').replace('{n}', N.N1.mwSpacePay) }; });
    report(inRing && pay.want > 0 && pay.glass === pay.want && pay.tip.indexOf(pay.tipWant) >= 0, 'C1: getting out of the room pays its glass, with the tip', pay);
    if (inRing) {
      await pg.waitForFunction(() => window.__night.foes.some((f) => f.alive), null, { timeout: 120000 }).catch(() => {});
      for (let i = 0; i < 6 && !(await pg.evaluate(() => window.__night.NS.mw.over)); i++) {
        await pg.evaluate(() => { const N = window.__night; N.NS.mw.bag.length = 0; for (const f of N.foes) if (f.alive) N.killFoe(f); });
        await gameWait(1.0).catch(() => {});
      }
      const end = await pg.waitForFunction(() => window.__night.NS.mw.over, null, { timeout: 120000 }).then(() => true, () => false);
      const k = await pg.evaluate(() => { const N = window.__night; return { over: N.NS.mw.over, kept: N.NS.mwKept, want: 2 * N.N1.mwSpacePay }; });
      report(end && k.over === 'win' && k.kept === k.want, 'C1: he comes out of the night and keeps two spaces\' pay', k);
      const card = await pg.evaluate(() => { const N = window.__night; N.endCard(); return ((document.querySelector('#card_end .sum') || {}).textContent || '').replace(/\s+/g, ' '); });
      report(/driven off /.test(card) && !/ beaten /.test(card), 'C1: the end card says "driven off", not "beaten"', card.slice(card.indexOf('Mirror'), card.indexOf('Mirror') + 160));
    }
  }
  report(!errs.length, 'no page errors', errs.slice(0, 3));
  console.log(`RESULT s43 driveoff ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

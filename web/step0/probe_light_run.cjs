// Session 25 probe (F36): the smoke's "Light: running from it ... escapes it" steps failed on CI run 98 (inside the spot 2.5-3.0 s, limit 2) and passed locally.
// This runs the same steering bot in the ring for 8 s of game time, per trial on a fresh page, with the ring's other figures standing (as in the journey)
// and with them put down, and prints per trial: time inside the spot, how long Shame clung, how often the Light lost him. FAIL when inside > 2 s.
// Usage: node probe_light_run.cjs [trials]; THROTTLE=<n> slows the page's CPU n times (a slow CI runner); needs cube25d/setup.sh. Correctness only (no timings).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname, TRIALS = +(process.argv[2] || 3);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  let fails = 0, runs = 0;
  for (const others of ['standing', 'down']) for (let k = 0; k < TRIALS; k++) {
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${srv.address().port}/night1.html`);
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
    if (+process.env.THROTTLE > 1) { const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE }); }
    const fps0 = await pg.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { if (++n === 20) res(20000 / (performance.now() - t0)); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
    const r = await pg.evaluate((others) => new Promise((res) => {
      const N = window.__night, NS = N.NS;
      // the journey's act: the fall with a Perfect and a miss (whisper, stare, shame earned); corridor, then the ring with its group
      NS.act = 'fall'; NS.actInfo = { perfects: 2, goods: 3, misses: 1 }; NS.hurt = { falls: 1, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = [];
      N.enterMW(); const M = NS.mw; M.laughs = 300;
      M.bag.length = 0; M.brk = null; for (const f of N.foes) f.alive = false; N.mwLeaveLeg(); M.leg = M.route.length - 1; N.mwEnterLeg(M);
      const L = N.foes.find((f) => f.kind === 'light'), kinds = N.foes.map((f) => f.kind).join(',');
      if (others === 'down') for (const f of N.foes) if (f !== L) N.killFoe(f);
      M.x = L.spotX; M.z = L.spotZ + 0.3; L.r = N.lightStartR(); L.leaves = 0; L.loseT = 0; L.tellT = 0; L.inT = 0; L.loses = 0;
      const t0 = M.t, w0 = performance.now(); let cling = 0, last = M.t, frames = 0;
      const tick = () => {
        const dx = M.x - L.spotX, dz = M.z - L.spotZ, d = Math.hypot(dx, dz) || 1, rr = Math.hypot(M.x, M.z) || 1;
        let ax = dx / d * 0.6 - M.z / rr * 0.8, az = dz / d * 0.6 + M.x / rr * 0.8; const n = Math.hypot(ax, az) || 1; N.input.tx = ax / n; N.input.ty = -az / n;
        frames++; if (N.foes.some((f) => f.kind === 'shame' && f.alive && f.cling)) cling += M.t - last; last = M.t;
        if (M.t - t0 >= 8 || M.over) { N.input.tx = 0; N.input.ty = 0; res({ frames, wall: (performance.now() - w0) / 1000, kinds, inT: L.inT, cling, loses: L.loses, r: L.r, t: M.t - t0, over: M.over }); } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), others);
    runs++;
    const bad = r.over || r.inT > 2;
    if (bad) fails++;
    console.log(`${bad ? 'FAIL' : 'PASS'} others ${others} trial ${k + 1}: inside the spot ${r.inT.toFixed(2)} s of ${r.t.toFixed(1)} | Shame clung ${r.cling.toFixed(2)} s | Light lost him ${r.loses} | spot r ${r.r.toFixed(2)} | ring ${r.kinds} | ${r.frames} frames for 8 s of game time, ${(r.frames / r.wall).toFixed(1)} fps`);
    await pg.close();
  }
  console.log(`RESULT light run probe ${runs - fails} of ${runs} pass`);
  await b.close(); srv.close();
  process.exitCode = fails ? 1 : 0;
})().catch((e) => { console.log('FAIL probe crashed: ' + (e && e.stack || e)); process.exit(1); });

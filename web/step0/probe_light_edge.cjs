// Session 41 batch 3 probe (kid6 record, design/STRANGER-night1-s41-kidplay.md step 24): in the live fall act the roll starts only when his root point
// is inside the pool's radius, while the picture shows his feet on the lit disc. Phone 390x844, software GL, the game's own route, test-side placement.
// Measures the drawn disc's radius and how far his shoes reach past his root on the floor (skinned vertices under 0.12 m), then:
// edge case: root at pool + 0.6 x shoe reach (shoes on the disc) must start the roll; control: root at pool + shoe reach + 0.15 (shoes off) must not.
// PAGE=<file> serves another copy. Ends with RESULT light edge n of m pass.
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
    // the drawn disc and his shoes, measured in the page (probe-side traversal, once)
    const m = await pg.evaluate(() => {
      const N = window.__night, A = N.NS.A, c = N.chars.clown, root = c.root, V = root.position.constructor, v = new V(), rp = new V();
      root.updateMatrixWorld(true); root.getWorldPosition(rp);
      let reach = 0, low = 0;
      root.traverse((o) => {
        if (!o.isSkinnedMesh || !o.visible) return;
        const p = o.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); if (v.y - rp.y < 0.12) { low++; reach = Math.max(reach, Math.hypot(v.x - rp.x, v.z - rp.z)); } }
      });
      const spot = N.actObj && N.actObj.spot, g = spot && spot.geometry.parameters;
      return { reach: +reach.toFixed(3), low, pool: A.F.N.pool, disc: spot ? +((g.radius || 1) * spot.scale.x).toFixed(3) : null };
    });
    report(m.low > 0 && m.reach > 0, 'shoe vertices found under 0.12 m', m);
    report(m.disc !== null && Math.abs(m.disc - m.pool) < 0.01, 'drawn disc radius equals the pool radius', m);
    // place him on the line from the pool's centre toward the act's middle side, d m out, hold still 0.5 s of act time in the wait stage, read the stage
    const at = (d) => pg.evaluate((dist) => new Promise((res) => {
      const N = window.__night, A = N.NS.A, F = A.F;
      const go = () => {
        if (F.stage !== 'wait' || F.on || F.up > 0) { if (F.stage === 'roll') { A.x = 9; } return requestAnimationFrame(go); }
        const ux = F.px > 0 ? -1 : 1; A.x = F.px + ux * dist; A.z = F.pz; const t0 = A.t;
        const w = () => { A.x = F.px + ux * dist; A.z = F.pz; if (F.stage !== 'wait' || A.t - t0 >= 0.5) return res({ stage: F.stage, d: dist, at: [+A.x.toFixed(2), +A.z.toFixed(2)], pool: [F.px, F.pz] }); requestAnimationFrame(w); };
        w();
      };
      go();
    }), d);
    const ctl = await at(m.pool + m.reach + 0.15);
    report(ctl.stage === 'wait', 'control: shoes off the disc, no roll', ctl);
    const edge = await at(m.pool + 0.6 * m.reach);
    report(edge.stage === 'roll', 'shoes on the disc edge (root outside the radius): the roll starts', edge);
  }
  report(!errs.length, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT light edge ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

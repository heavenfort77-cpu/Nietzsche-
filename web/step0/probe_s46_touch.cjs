// Touch probe (session 46, owner 27 Nov 06:37, a player's screenshot: the clown's ruff and arm inside a crew member's coat by the crates:
// "this is not clipping?"). Night1.html through its own route (software GL). The clown is put at the closest spot the walk allows to each
// crew member and wings performer (8 directions, contact distance clownR + crewR or performerR, plus 0.02 m), facing it, the others
// turned to him by the game (1.5 s). The surfaces of both bodies as drawn (skinned, posed, the shown LOD level) are sampled every 0.02 m
// into 0.025 m cells; a cell holding both bodies is the two meshes touching or passing into each other. FAIL when any direction shares a
// cell. Also each walk obstacle (crates, pole, racks): the clown at each side's closest spot, facing it; FAIL when any of his surface below
// 0.5 m lies inside the obstacle's floor rectangle.
// BUNDLE=1: the single-file build. Ends with RESULT s46 touch n of m pass.
const path = require('path'), http = require('http'), fs = require('fs'), zlib = require('zlib'), cp = require('child_process');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname;
let PAGE = 'night1.html';
if (process.env.BUNDLE === '1') {
  PAGE = '_s46_bundle.html';
  cp.execFileSync('python3', [path.join(ROOT, '..', '..', 'tools', 'bundle_single.py'), path.join(ROOT, PAGE)], { stdio: 'inherit' });
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };

async function toCorridor(pg) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 300000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.offsetParent), re.source, { timeout: 180000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.offsetParent).click(), re.source); };
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.offsetParent); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  await pg.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.innerText === 'The fall' && b.offsetParent), null, { timeout: 180000 });
  await click(/^The fall$/);
  await click(/^(Perform it|Do it)$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 180000 });
}

const TOUCH = async () => {
  const N = window.__night, W = window.__walkTest, THREE = await import('three');
  const S = N.S, CELL = 0.025, STEP = 0.02;
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q = new THREE.Vector3();
  const cells = (root) => { root.updateMatrixWorld(true); const set = new Set(), pts = [];
    root.traverse((m) => { if (!m.isMesh || !shown(m) || !m.geometry.attributes.position) return;
      if (m.material && (m.material.side === THREE.BackSide)) return;
      const g = m.geometry, idx = g.index, n = idx ? idx.count : g.attributes.position.count;
      const P = (i, out) => { m.getVertexPosition(idx ? idx.getX(i) : i, out); return out.applyMatrix4(m.matrixWorld); };
      for (let t = 0; t + 2 < n; t += 3) { P(t, v0); P(t + 1, v1); P(t + 2, v2);
        const k = Math.min(12, Math.max(1, Math.ceil(Math.max(v0.distanceTo(v1), v1.distanceTo(v2), v2.distanceTo(v0)) / STEP)));
        for (let a = 0; a <= k; a++) for (let b = 0; a + b <= k; b++) { const c = k - a - b;
          q.set(0, 0, 0).addScaledVector(v0, a / k).addScaledVector(v1, b / k).addScaledVector(v2, c / k);
          set.add(Math.floor(q.x / CELL) + ',' + Math.floor(q.y / CELL) + ',' + Math.floor(q.z / CELL)); pts.push(q.x, q.y, q.z); } } });
    return { set, pts }; };
  const settle = (ms) => new Promise((r) => setTimeout(r, ms));
  const clown = N.chars.clown.root;
  const res = [];
  const others = N.crew.map((m) => ({ name: m.cd.id, root: m.root, x: m.x, y: m.y, r: N.N1 ? N.N1.crewR : 0.35 }))
    .concat(W.performers.map((p) => ({ name: 'performer ' + p.c.name, root: p.c.root, x: p.x, y: p.y, r: W.CONFIG.performerR })));
  const cR = W.CONFIG.clownR;
  for (const o of others) {
    const row = { name: o.name, at: [o.x, o.y], dirs: [] };
    for (let d = 0; d < 8; d++) {
      const a = d * Math.PI / 4, dist = cR + o.r + 0.02, x = o.x + Math.cos(a) * dist, y = o.y + Math.sin(a) * dist;
      if (!W.free(x, y)) { row.dirs.push({ d, skip: 'not walkable' }); continue; }
      S.x = x; S.y = y; S.yaw = Math.atan2(o.x - x, -(o.y - y)); await settle(1500); S.x = x; S.y = y; S.yaw = Math.atan2(o.x - x, -(o.y - y)); await settle(300);
      W.renderFrame();
      const A = cells(clown), B = cells(o.root); let shared = 0, cx = 0, cy = 0, cz = 0;
      for (const c of A.set) if (B.set.has(c)) { shared++; const [i, j, k] = c.split(',').map(Number); cx += i; cy += j; cz += k; }
      row.dirs.push({ d, shared, where: shared ? [+(cx / shared * CELL).toFixed(2), +(cy / shared * CELL).toFixed(2), +(-cz / shared * CELL).toFixed(2)] : null, shown: shown(o.root) });
    }
    // how far apart they must stand to touch nowhere: per direction, the distance from 0 to 1 m past contact in 0.05 m steps (walkable or not)
    row.need = 0;
    for (let d = 0; d < 8; d++) {
      const a = d * Math.PI / 4;
      for (let dist = cR + o.r + 0.02; dist < cR + o.r + 1.05; dist += 0.05) {
        const x = o.x + Math.cos(a) * dist, y = o.y + Math.sin(a) * dist;
        S.x = x; S.y = y; S.yaw = Math.atan2(o.x - x, -(o.y - y)); await settle(700); S.x = x; S.y = y; S.yaw = Math.atan2(o.x - x, -(o.y - y)); await settle(150);
        W.renderFrame();
        const A = cells(clown), B = cells(o.root); let shared = 0; for (const c of A.set) if (B.set.has(c)) { shared++; break; }
        if (!shared) { row.need = Math.max(row.need, dist); break; }
      }
    }
    row.need = +row.need.toFixed(2);
    res.push(row);
  }
  // obstacles: his surface below 0.5 m inside the rectangle, standing at each side's middle as close as the walk allows
  const obs = [];
  for (const [oi, r] of S.data.obstacles.entries()) {
    const mx = (r[0] + r[2]) / 2, my = (r[1] + r[3]) / 2, sides = [[r[0] - cR - 0.02, my], [r[2] + cR + 0.02, my], [mx, r[1] - cR - 0.02], [mx, r[3] + cR + 0.02]];
    const row = { i: oi, rect: r, sides: [] };
    for (const [x, y] of sides) {
      if (!W.free(x, y)) { row.sides.push({ skip: true }); continue; }
      S.x = x; S.y = y; S.yaw = Math.atan2(mx - x, -(my - y)); await settle(600); S.x = x; S.y = y; S.yaw = Math.atan2(mx - x, -(my - y)); await settle(200);
      W.renderFrame();
      const A = cells(clown); let inside = 0;
      for (let i = 0; i < A.pts.length; i += 3) { const px = A.pts[i], py = A.pts[i + 1], pyFloor = -A.pts[i + 2];
        if (py < 0.5 && px > r[0] && px < r[2] && pyFloor > r[1] && pyFloor < r[3]) inside++; }
      row.sides.push({ at: [+x.toFixed(2), +y.toFixed(2)], inside });
    }
    obs.push(row);
  }
  return { res, obs };
};
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  await toCorridor(pg);
  const t = await pg.evaluate(TOUCH);
  for (const r of t.res) {
    const hit = r.dirs.filter((d) => d.shared > 0);
    report(hit.length === 0, `the clown at the closest walkable spot to ${r.name} does not pass into it (8 directions)`, { at: r.at, hits: hit, walkable: r.dirs.filter((d) => !d.skip).length, apartNeeded: r.need });
  }
  for (const o of t.obs) {
    const hit = o.sides.filter((s) => s.inside > 0);
    report(hit.length === 0, `the clown at the closest walkable spot to obstacle ${o.i} has nothing below 0.5 m inside it`, { rect: o.rect, hits: hit, walkable: o.sides.filter((s) => !s.skip).length });
  }
  report(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT s46 touch ${pass} of ${all} pass`);
  await b.close(); srv.close();
  if (PAGE !== 'night1.html') fs.unlinkSync(path.join(ROOT, PAGE));
})().catch((e) => { console.log('FAIL probe error | ' + String(e && e.stack || e).slice(0, 400)); process.exit(1); });

// Mirror World touch probe (session 47, F53: the sweep session 46's F52 left open). Night1.html, software GL, game time only.
// Each Mirror World figure kind (whisper, stare, shame, sergeant, weigher, performer; the Light is a lamp overhead and is not walked into) is put in
// the open ring space, the loop stopped; the clown is put 0.05 m from it in 8 directions (as if he had walked straight into it), one game step is run,
// and the surfaces of both bodies as drawn (skinned, posed, shown) are sampled every 0.02 m into 0.025 m cells. FAIL when any direction shares a cell
// after the step (the game's own movement code decides where he ends up). Also the distance each direction needs before the bodies touch nowhere.
// The Shame clinging on his back is the game's own contact (cling, 0.45 m behind him): not walked into here (f.cling held false).
// Side effects (the same batch): with the clown standing still 1.4 m away, the Shame still grabs (cling) and the Weigher still rises (ph 1) within 4 s of game
// time; MUT=oldreach serves the page with the old grab 0.8 and reach 1.1 (both steps must FAIL: the stand-off then holds them out of range).
// BUNDLE=1: the single-file build. Ends with RESULT s47 mwtouch n of m pass.
const path = require('path'), http = require('http'), fs = require('fs'), cp = require('child_process');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname;
let PAGE = 'night1.html';
if (process.env.BUNDLE === '1') {
  PAGE = '_s47_bundle.html';
  cp.execFileSync('python3', [path.join(ROOT, '..', '..', 'tools', 'bundle_single.py'), path.join(ROOT, PAGE)], { stdio: 'inherit' });
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  if (process.env.MUT === 'oldreach' && path.basename(f) === 'night1.html') {
    let h = fs.readFileSync(f, 'utf8');
    for (const [a, b] of [['grab: 0.87,', 'grab: 0.8,'], ['reach: 1.17,', 'reach: 1.1,']]) { if (h.split(a).length !== 2) throw new Error('not found once: ' + a); h = h.replace(a, b); }
    r.end(h); return;
  }
  r.end(fs.readFileSync(f));
});
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };

const TOUCH = async (kinds) => {
  const N = window.__night, NS = N.NS, S = N.S, THREE = await import('three');
  const CELL = 0.025, STEP = 0.02;
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q = new THREE.Vector3();
  const cells = (root) => { root.updateMatrixWorld(true); const set = new Set();
    root.traverse((m) => { if (!m.isMesh || !shown(m) || !m.geometry.attributes.position) return;
      if (m.material && (m.material.side === THREE.BackSide)) return;
      const g = m.geometry, idx = g.index, n = idx ? idx.count : g.attributes.position.count;
      const P = (i, out) => { m.getVertexPosition(idx ? idx.getX(i) : i, out); return out.applyMatrix4(m.matrixWorld); };
      for (let t = 0; t + 2 < n; t += 3) { P(t, v0); P(t + 1, v1); P(t + 2, v2);
        const k = Math.min(12, Math.max(1, Math.ceil(Math.max(v0.distanceTo(v1), v1.distanceTo(v2), v2.distanceTo(v0)) / STEP)));
        for (let a = 0; a <= k; a++) for (let b = 0; a + b <= k; b++) { const c = k - a - b;
          q.set(0, 0, 0).addScaledVector(v0, a / k).addScaledVector(v1, b / k).addScaledVector(v2, c / k);
          set.add(Math.floor(q.x / CELL) + ',' + Math.floor(q.y / CELL) + ',' + Math.floor(q.z / CELL)); } } });
    return set; };
  const clown = N.chars.clown.root;
  const out = [];
  for (const kind of kinds) {
    const row = { kind, dirs: [] };
    try {
      NS.act = 'sweep'; NS.actInfo = { scene: 'results', perfects: 1, goods: 3, misses: 0, actLaughs: 40, mask: 2 };
      NS.hurt = { falls: 0, total: 0, rows: [], best: '', bestN: 0 }; NS.routeOrder = ['photo'];
      N.enterMW();
      S.running = false; if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
      const M = NS.mw;
      for (const f of N.foes) { f.alive = false; f.root.visible = false; }
      N.foes.length = 0;
      M.space = 'ring'; M.cutting = false; M.over = ''; M.fall = null; M.tip = ''; M.tips.length = 0;
      if (kind === 'performer') N.cast.performer = N.chars.performer.root;
      N.addFoe(kind);
      const f = N.foes[N.foes.length - 1];
      const hold = (x, z) => { M.laughs = 900; M.over = ''; M.x = x; M.z = z; M.yaw = Math.atan2(f.x - x, -(f.z - z)); f.x = 0; f.z = 0; f.cling = false; f.reach = 0; f.stun = 0; f.hold = ''; f.holdT = 0; f.ph = 0; f.phT = 0; f.alive = true; };
      for (let i = 0; i < 8; i++) { hold(2, 0); N.stepFrame(0.05); }
      const measure = (dist, a) => {
        hold(Math.cos(a) * dist, Math.sin(a) * dist); N.stepFrame(0.001);
        const A = cells(clown), B = cells(f.root); let shared = 0; for (const c of A) if (B.has(c)) shared++;
        return { shared, apart: +Math.hypot(M.x - f.x, M.z - f.z).toFixed(2) };
      };
      row.need = 0;
      for (let d = 0; d < 8; d++) {
        const a = d * Math.PI / 4, walked = measure(0.05, a);
        let need = walked.apart; let r = walked;
        for (let dist = 0.3; r.shared > 0 && dist < 2.0; dist += 0.1) { r = measure(dist, a); need = r.apart; }
        row.dirs.push({ d, walkedInShared: walked.shared, stoppedAt: walked.apart, apartNeeded: r.shared > 0 ? null : need });
        row.need = Math.max(row.need, need);
      }
      row.need = +row.need.toFixed(2);
      if (kind === 'shame' || kind === 'weigher') {
        hold(1.4, 0); f.x = 0; f.z = 0; let secs = 0, hit = false;
        for (let i = 0; i < 250 && !hit; i++) { M.laughs = 900; M.over = ''; N.stepFrame(1 / 60); secs += 1 / 60; hit = kind === 'shame' ? !!f.cling : f.ph === 1; }
        row.engage = { hit, secs: +secs.toFixed(2), apart: +Math.hypot(M.x - f.x, M.z - f.z).toFixed(2) };
      }
    } catch (e) { row.error = String(e && e.stack || e).slice(0, 300); }
    out.push(row);
  }
  return out;
};
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  // the Performer is loaded only on the last night (the run hash of probe_s44_escape.cjs)
  const LAST = '#n=3&m=6&s=60&b=&t=sweep.scale.drill&lo=1';
  for (const [hash, kinds] of [['', ['whisper', 'stare', 'shame', 'sergeant', 'weigher']], [LAST, ['performer']]]) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}${hash}`); if (hash) await pg.reload();
    await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 300000 });
    const rows = await pg.evaluate(TOUCH, kinds);
    for (const r of rows) {
      if (r.error) { report(false, `the clown walked into the ${r.kind} does not pass into it`, { error: r.error }); continue; }
      const hit = r.dirs.filter((d) => d.walkedInShared > 0);
      if (r.engage) report(r.engage.hit, `the ${r.kind} still ${r.kind === 'shame' ? 'grabs' : 'rises'} on a clown standing still 1.4 m away`, r.engage);
      report(hit.length === 0, `the clown walked into the ${r.kind} does not pass into it (8 directions)`, { hits: hit.map((d) => ({ d: d.d, shared: d.walkedInShared, stoppedAt: d.stoppedAt })), apartNeeded: r.need });
    }
    await pg.close();
  }
  report(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT s47 mwtouch ${pass} of ${all} pass`);
  await b.close(); srv.close();
  if (PAGE !== 'night1.html') fs.unlinkSync(path.join(ROOT, PAGE));
})().catch((e) => { console.log('FAIL probe error | ' + String(e && e.stack || e).slice(0, 400)); process.exit(1); });

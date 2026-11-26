// Clipping sweep (session 46, owner 27 Nov 06:23: "check the game only and fix only clipping issue"). Night1.html through its own route
// (software GL). In each walk shot (corridor = Hall, wings, entrance), with the clown at three spots in the shot's zone: every figure
// drawn (clown, crew, wings performers), per height band (8 bands, feet to head), pixels it changes when drawn in flat magenta
// (scene.overrideMaterial, so dark shoes on a dark floor still count), against what that shot's depth plate says shows (plate depth at
// the band's centre column, decoded here from the PNG, farther than the figure by more than 0.1 m, and within 1.5 plate pixels).
// FAIL when the plate says a band shows and the figure changes no pixel there (clipped), or a figure is cut where the plate says hidden
// by less than 0.1 m both ways (left out). Crew and performers are measured at the shot's first spot.
// SCREEN=desk (1280x720) or land (866x400, dpr 2.7), default both. BUNDLE=1: the single-file build. Ends with RESULT s46 clip n of m pass.
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

// 8-bit RGBA PNG, not interlaced (the plates' format): raw bytes, no colour management
function readPng(file) {
  const b = fs.readFileSync(file); let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < b.length) { const n = b.readUInt32BE(o), t = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('png format'); }
    if (t === 'IDAT') idat.push(d); o += 12 + n; }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error('png colour type ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * bpp), st = w * bpp;
  for (let y = 0; y < h; y++) { const f = raw[y * (st + 1)], s = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) { const a = x >= bpp ? out[y * st + x - bpp] : 0, u = y ? out[(y - 1) * st + x] : 0, c = y && x >= bpp ? out[(y - 1) * st + x - bpp] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      out[y * st + x] = v & 255; } }
  return { w, h, bpp, px: out };
}
const shots = JSON.parse(fs.readFileSync(path.join(ROOT, 'walk', 'plates', 'shots.json'), 'utf8'));
const plates = {};
for (const [n, s] of Object.entries(shots.shots)) plates[n] = readPng(path.join(ROOT, 'walk', 'plates', s.depth));
// plate depth at uv (v from the top), m: the same decode as night1.html plateFrag; the nearest within 1.5 plate pixels
const plateZ = (dp, u, v) => { let m = 1e9; for (const dy of [-1.5, 0, 1.5]) for (const dx of [-1.5, 0, 1.5]) {
  const x = Math.min(dp.w - 1, Math.max(0, Math.floor(u * dp.w + dx))), y = Math.min(dp.h - 1, Math.max(0, Math.floor(v * dp.h + dy))), i = (y * dp.w + x) * dp.bpp;
  m = Math.min(m, (dp.px[i] * 256 + dp.px[i + 1]) / 65535 * shots.depthFar); } return m; };

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

const MEASURE = async (shot) => {
  const N = window.__night, W = window.__walkTest, r = W.renderer, gl = r.getContext(), cam = W.camera;
  const THREE = await import('three');
  if (N.S.shot !== shot) W.cutTo(shot);
  const bw = gl.drawingBufferWidth, bh = gl.drawingBufferHeight, read = () => { W.renderFrame(); const a = new Uint8Array(bw * bh * 4); gl.readPixels(0, 0, bw, bh, gl.RGBA, gl.UNSIGNED_BYTE, a); return a; };
  const V = cam.position.constructor, figs = [{ name: 'clown', root: N.chars.clown.root, x: N.S.x, y: N.S.y, h: N.NS.clownH }]
    .concat(N.crew.map((m) => ({ name: m.cd.id, root: m.root, x: m.x, y: m.y, h: m.root.userData.h })))
    .concat(W.performers.map((p) => { const b = new THREE.Box3().setFromObject(p.c.root); return { name: 'performer ' + p.c.name, root: p.c.root, x: p.x, y: p.y, h: b.max.y - b.min.y }; }));
  const props = [N.NS.cable, N.NS.tape].filter(Boolean); props.forEach((o) => { o.visible = false; });
  const flat = new THREE.MeshBasicMaterial({ color: 0xff00ff }); W.scene.overrideMaterial = flat;
  cam.updateMatrixWorld();
  const out = [];
  for (const f of figs) {
    if (!f.root.visible) { out.push({ name: f.name, hidden: true }); continue; }
    const A = read(); f.root.visible = false; const B = read(); f.root.visible = true;
    const pj = (hh, dx) => { const p = new V(f.x + (dx || 0), hh, -f.y); const vz = -p.clone().applyMatrix4(cam.matrixWorldInverse).z; p.project(cam); return { u: p.x * 0.5 + 0.5, v: 0.5 - p.y * 0.5, vz }; };
    const bands = [];
    for (let k = 0; k < 8; k++) {
      const h0 = f.h * k / 8, h1 = f.h * (k + 1) / 8, lo = pj(h0), hi = pj(h1), mid = pj((h0 + h1) / 2), side = pj((h0 + h1) / 2, 0.35);
      const half = Math.max(2, Math.abs(side.u - mid.u) * bw), cx = mid.u * bw;
      const r0 = Math.max(0, Math.floor(hi.v * bh)), r1 = Math.min(bh - 1, Math.ceil(lo.v * bh)), c0 = Math.max(0, Math.floor(cx - half)), c1 = Math.min(bw - 1, Math.ceil(cx + half));
      let n = 0;
      for (let y = r0; y <= r1; y++) { const ry = bh - 1 - y; for (let x = c0; x <= c1; x++) { const i = (ry * bw + x) * 4;
        if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 12) n++; } }
      bands.push({ k, n, u: +mid.u.toFixed(4), v: +((hi.v + lo.v) / 2).toFixed(4), vz: +mid.vz.toFixed(2), onScreen: mid.u > 0.01 && mid.u < 0.99 && mid.v > 0.01 && mid.v < 0.99 });
    }
    out.push({ name: f.name, x: +f.x.toFixed(2), y: +f.y.toFixed(2), h: +f.h.toFixed(2), bands });
  }
  W.scene.overrideMaterial = null; flat.dispose();
  props.forEach((o) => { o.visible = true; });
  W.renderFrame();
  return { buf: [bw, bh], shot: N.S.shot, figs: out };
};

// clown spots per shot (Blender floor x, y), inside each zone and clear of crew and performers
const SPOTS = { corridor: [[0.3, 7.6], [-0.2, 6.0], [-0.6, 2.6]], wings: [[-0.5, 9.0], [0.3, 11.5], [-1.0, 13.2]], entrance: [[-1.3, 14.8], [-0.8, 16.6], [-1.8, 18.0]] };
const SCREENS = { desk: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }, land: { viewport: { width: 866, height: 400 }, deviceScaleFactor: 2.7 } };
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const list = process.env.SCREEN ? [process.env.SCREEN] : Object.keys(SCREENS);
  console.log(`page ${PAGE}`);
  for (const sc of list) {
    const pg = await b.newPage(SCREENS[sc]);
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
    await toCorridor(pg);
    for (const [shot, spots] of Object.entries(SPOTS)) {
      const dp = plates[shot];
      for (const [si, s] of spots.entries()) {
        await pg.evaluate((s) => { const N = window.__night; N.S.x = s[0]; N.S.y = s[1]; }, s);
        await pg.waitForTimeout(2500);
        await pg.evaluate((s) => { const N = window.__night; N.S.x = s[0]; N.S.y = s[1]; }, s);
        await pg.waitForTimeout(800);
        const m = await pg.evaluate(MEASURE, shot);
        if (m.shot !== shot) { report(false, `${sc} ${shot}: the shot is on with the clown at ${s}`, { shot: m.shot }); continue; }
        for (const f of m.figs) {
          if (f.hidden) { if (si === 0) console.log(`INFO ${sc} ${shot} ${f.name} not drawn in this shot`); continue; }
          if (f.name !== 'clown' && si !== 0) continue;
          const pz = f.bands.map((bd) => plateZ(dp, bd.u, bd.v));
          const want = f.bands.map((bd, i) => bd.onScreen && pz[i] > bd.vz + 0.1);
          const lost = f.bands.filter((bd, i) => want[i] && bd.n === 0).map((bd) => bd.k);
          const info = { at: [f.x, f.y], lost, px: f.bands.map((bd) => bd.n), want: want.map((w) => (w ? 1 : 0)).join(''), plateZ: pz.map((z) => +z.toFixed(2)), figZ: f.bands.map((bd) => bd.vz) };
          if (!want.some((w) => w)) { console.log(`INFO ${sc} ${shot} ${f.name} hidden by the set in this shot | ${JSON.stringify(info)}`); continue; }
          report(lost.length === 0, `${sc} ${shot} ${f.name}${f.name === 'clown' ? ' at ' + s : ''}: no band the plate shows is clipped (band 0 = feet)`, info);
        }
      }
    }
    report(errs.length === 0, `${sc} no page errors`, errs.slice(0, 2));
    await pg.close();
  }
  console.log(`RESULT s46 clip ${pass} of ${all} pass`);
  await b.close(); srv.close();
  if (PAGE !== 'night1.html') fs.unlinkSync(path.join(ROOT, PAGE));
})().catch((e) => { console.log('FAIL probe error | ' + String(e && e.stack || e).slice(0, 400)); process.exit(1); });

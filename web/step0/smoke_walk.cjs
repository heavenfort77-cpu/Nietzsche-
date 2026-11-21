// Browser checks for walk.html (fixed-camera walk sample) in headless Chrome. Usage: node smoke_walk.cjs
// Needs web/step0/cube25d/setup.sh run first (lib/ and assets/). Serves web/step0 over http (module scripts and fetch).
// Per screen: loads with no page error; walk speed measured from planted feet; a bot walks the route (corridor, meets both
// performers, wings, ring entrance) to the end with the stick held across cuts; 3 shots; the clown never leaves the frame.
// Once: depth occlusion probe (clown behind the costume rack is partly hidden by the plate depth, in the open he is not).
'use strict';
const path = require('path');
const http = require('http');
const fs = require('fs');
function need(names) {
  for (const n of names) { try { return require(n); } catch (e) { /* next */ } }
  console.error('Missing playwright'); process.exit(2);
}
const pw = need(['playwright-core', '/opt/npm-tools/node_modules/playwright']);
const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
const SCREENS = [
  { name: 'desktop 1280x720', width: 1280, height: 720, mobile: false },
  { name: 'phone portrait 390x844', width: 390, height: 844, mobile: true },
  { name: 'phone landscape 844x390', width: 844, height: 390, mobile: true },
];
// Blender floor waypoints: up the corridor, past the Performer, past the Whiteface, through the curtain gap, to the ring edge
const ROUTE = [[0, 8.0], [0.4, 9.4], [1.5, 11.3], [-0.5, 11.2], [-1.3, 13.0], [-1.3, 15.0], [-1.3, 18.8]];

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((q, r) => {
      const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    });
    srv.listen(0, () => res(srv));
  });
}

// in-page bot: steers toward each waypoint through the game's own input, using the basis the game is holding
function botWalk(route) {
  const T = window.__walkTest, S = window.__walk;
  return new Promise((done) => {
    let i = 0, out = 0, ticks = 0, met = new Set(), shots = new Set([S.shot]);
    const t0 = performance.now();
    function inFrame(y) {
      const v = T.camera.position.clone().set(S.x, y, -S.y).project(T.camera);
      return Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1;
    }
    function tick() {
      ticks++;
      shots.add(S.shot);
      T.performers.forEach((p, k) => { if (p.shown) met.add(k); });
      if (!(inFrame(0.05) && inFrame(1.8))) out++;
      if (S.ended || i >= route.length || performance.now() - t0 > 150000) {
        T.input.tx = 0; T.input.ty = 0;
        done({ ended: S.ended, waypoint: i, ticks, out, met: met.size, shots: [...shots], cuts: S.cuts, pos: [S.x, S.y] });
        return;
      }
      const [wx, wy] = route[i];
      if (Math.hypot(wx - S.x, wy - S.y) < 0.35) { i++; requestAnimationFrame(tick); return; }
      let bx = S.basisX, bz = S.basisZ;
      if (!S.hold) { const d = T.camera.getWorldDirection(T.camera.position.clone()); const l = Math.hypot(d.x, d.z); bx = d.x / l; bz = d.z / l; }
      const l = Math.hypot(wx - S.x, wy - S.y), dx = (wx - S.x) / l, dz = -(wy - S.y) / l;
      T.input.ty = dx * bx + dz * bz; T.input.tx = -dx * bz + dz * bx;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// share of clown pixels left after the plate depth test, at a Blender floor spot in a shot
function occlusion(spot) {
  const T = window.__walkTest, S = window.__walk;
  S.running = false;
  T.cutTo(spot.shot);
  S.x = spot.x; S.y = spot.y;
  const c = T.chars.clown;
  c.root.position.set(S.x, 0, -S.y); c.root.rotation.y = 0; c.root.updateMatrixWorld(true);
  const gl = T.renderer.getContext();
  const keep = T.scene.overrideMaterial;
  const mask = T.scene.userData.mask || (T.scene.userData.mask = new (Object.getPrototypeOf(T.plateMat).constructor)({
    vertexShader: '#include <common>\n#include <skinning_pars_vertex>\nvoid main() {\n#include <skinbase_vertex>\n#include <begin_vertex>\n#include <skinning_vertex>\n#include <project_vertex>\n}',
    fragmentShader: 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }',
  }));
  const hide = [];
  T.performers.forEach((p) => { hide.push(p.c.root, p.c.blob); });
  hide.push(c.blob);
  hide.forEach((o) => { o.visible = false; });
  T.scene.overrideMaterial = mask;
  const count = (depthOn) => {
    T.plateMat.depthWrite = depthOn;
    T.renderFrame();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let n = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] > 200 && px[i + 1] < 40 && px[i + 2] < 40) n++;
    return n;
  };
  const all = count(false), seen = count(true);
  T.plateMat.depthWrite = true;
  T.scene.overrideMaterial = keep;
  hide.forEach((o) => { o.visible = true; });
  return { all, seen, hidden: all ? 1 - seen / all : 0 };
}

async function run() {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/walk.html`;
  const browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let pass = 0, total = 0;
  const report = (ok, what) => { total++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); };
  for (const vp of SCREENS) {
    const errs = [];
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
    page.on('pageerror', (e) => errs.push('page error ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console error ' + m.text()); });
    await page.goto(base);
    const ready = await page.waitForFunction(() => window.__walk.ready || window.__walk.error, null, { timeout: 90000 }).then(() => true, () => false);
    const st = await page.evaluate(() => ({ ready: window.__walk.ready, error: window.__walk.error, m: window.__walk.walkMeasure }));
    report(ready && st.ready && !errs.length, `${vp.name}: loads, no page error ${errs.join('; ')}${st.error || ''}`);
    if (!st.ready) { await page.close(); continue; }
    report(st.m.planted > 0 && st.m.speed === st.m.measured, `${vp.name}: walk speed from planted feet ${st.m.measured.toFixed(3)} m/s (${st.m.planted} planted steps)`);
    await page.click('#go');
    const r = await page.evaluate(botWalk, ROUTE);
    report(r.ended, `${vp.name}: bot reaches the ring edge (waypoint ${r.waypoint} of ${ROUTE.length}, at ${r.pos.map((v) => v.toFixed(2))})`);
    report(r.shots.length === 3 && r.cuts === 3, `${vp.name}: shots ${r.shots.join(' > ')}, cuts ${r.cuts}`);
    report(r.met === 2, `${vp.name}: performers met ${r.met} of 2`);
    report(r.out === 0, `${vp.name}: clown feet and head in frame every tick (${r.out} of ${r.ticks} out)`);
    report(!errs.length, `${vp.name}: no page error after the walk ${errs.join('; ')}`);
    if (vp === SCREENS[0]) {
      await page.screenshot({ path: '/tmp/walk_end.png' });
      const behind = await page.evaluate(occlusion, { shot: 'wings', x: 2.6, y: 10.2 });
      const open = await page.evaluate(occlusion, { shot: 'wings', x: -0.5, y: 11.6 });
      report(behind.hidden > 0.2 && open.hidden < 0.05 && open.all > 500,
        `depth: behind the rack ${(behind.hidden * 100).toFixed(1)}% hidden, in the open ${(open.hidden * 100).toFixed(1)}% hidden (${open.all} px)`);
    }
    await page.close();
  }
  await browser.close();
  srv.close();
  console.log(`RESULT walk smoke ${pass} of ${total} pass`);
  process.exit(pass === total ? 0 : 1);
}
run().catch((e) => { console.error(e); process.exit(1); });

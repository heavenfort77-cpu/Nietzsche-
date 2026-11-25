// Browser checks for walk.html (fixed-camera walk sample) in headless Chrome. Usage: node smoke_walk.cjs
// Needs web/step0/cube25d/setup.sh run first (lib/ and assets/). Serves web/step0 over http (module scripts and fetch).
// Per screen: loads with no page error; walk speed measured from planted feet; a bot walks the route (corridor, meets both
// performers, wings, ring entrance) to the end with the stick held across cuts; 3 shots; the clown never leaves the frame.
// Walk back per screen: 3 shots in reverse, gloom rises, the cube room (gains paid, four walls, dressing table off or its layout and buys,
// HUD written on change only, no touch stick in the room), 'Walk back again'. Desktop: a flop's payout and a walk out from the room.
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
const ALL_SCREENS = [
  { name: 'desktop 1280x720', width: 1280, height: 720, mobile: false },
  { name: 'phone portrait 390x844', width: 390, height: 844, mobile: true },
  { name: 'phone landscape 844x390', width: 844, height: 390, mobile: true },
];
// WALK_SCREENS=portrait runs only the screens whose name contains it (quick probes); the full check runs all
const SCREENS = ALL_SCREENS.filter((v) => !process.env.WALK_SCREENS || v.name.includes(process.env.WALK_SCREENS));
// Blender floor waypoints: up the corridor, past the Performer, past the Whiteface, through the curtain gap, to the ring edge
const ROUTE = [[0, 8.0], [0.4, 9.4], [1.5, 11.3], [-0.5, 11.2], [-1.3, 13.0], [-1.3, 15.0], [-1.3, 18.8]];
// walk back after the act: the same route reversed, from the ring edge to past the cube room's flap
const BACK_ROUTE = [[-1.3, 15.0], [-1.3, 13.0], [-0.5, 11.2], [1.5, 11.3], [0.4, 9.4], [0, 8.0], [0, 2.0]];

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
    let i = 0, out = 0, ticks = 0, met = new Set(), shots = new Set([S.shot]), gMax = S.gloom, gDrop = 0, gPrev = S.gloom, outAt = [];
    const t0 = performance.now();
    function inFrame(y) {
      const v = T.camera.position.clone().set(S.x, y, -S.y).project(T.camera);
      return Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1;
    }
    function tick() {
      ticks++;
      shots.add(S.shot);
      T.performers.forEach((p, k) => { if (p.shown) met.add(k); });
      if (!(inFrame(0.05) && inFrame(1.8))) { out++; if (outAt.length < 4) outAt.push(`${S.shot} ${S.x.toFixed(2)},${S.y.toFixed(2)} feet ${inFrame(0.05)} head ${inFrame(1.8)}`); }
      gDrop = Math.max(gDrop, gPrev - S.gloom); gPrev = S.gloom; gMax = Math.max(gMax, S.gloom);
      if (S.ended || i >= route.length || performance.now() - t0 > 150000) {
        T.input.tx = 0; T.input.ty = 0;
        done({ ended: S.ended, waypoint: i, ticks, out, met: met.size, shots: [...shots], cuts: S.cuts, pos: [S.x, S.y], gMax, gDrop, gEnd: S.gloom, outAt });
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

// stick held near the dead zone (a thumb wobbling on a phone): the walk must not restart again and again (F18)
function stickDip() {
  const T = window.__walkTest, S = window.__walk;
  return new Promise((done) => {
    const start = S.walkStarts;
    let n = 0;
    T.input.tx = 0; T.input.ty = 0.6;
    function tick() {
      n++;
      T.input.ty = n % 2 ? 0.21 : 0.19;
      if (n < 60) { requestAnimationFrame(tick); return; }
      T.input.ty = 0;
      done({ restarts: S.walkStarts - start, frames: n });
    }
    requestAnimationFrame(tick);
  });
}

// watches the room HUD and the touch stick from before the walk back: HUD text writes that repeat the shown text, and
// every time the stick is shown while he is in the room (there is nothing to walk there)
function watchRoom() {
  const S = window.__walk, W = window.__roomWatch = { writes: 0, repeats: 0, stickInRoom: 0, last: {}, what: [] };
  for (const id of ['laughsN', 'maskN', 'carry']) {
    const n = document.getElementById(id);
    W.last[id] = n.textContent;
    new MutationObserver(() => { W.writes++; if (n.textContent === W.last[id]) { W.repeats++; if (W.what.length < 4) W.what.push(`${id} '${n.textContent}'`); } W.last[id] = n.textContent; })
      .observe(n, { childList: true, characterData: true, subtree: true });
  }
  const st = document.getElementById('stick');
  new MutationObserver(() => { if (S.room && !st.classList.contains('hidden')) W.stickInRoom++; }).observe(st, { attributes: true });
}

// room state the checks read: view, gloom, face, mood, HUD text, paint, prep panel and buttons, layout boxes in CSS px
function roomState() {
  const S = window.__walk, T = window.__walkTest, C = T.CONFIG, c = T.chars.clown;
  const box = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const shown = (id) => { const e = document.getElementById(id); return !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; };
  // clown on screen: feet, head and his width projected through the room camera
  const cv = box(document.getElementById('gl'));
  // his width along the room camera's right axis (the camera turns with the wall)
  const p = c.root.position, v = p.clone(), right = p.clone().setFromMatrixColumn(T.roomCam.matrixWorld, 0);
  const sx = (k, y) => { v.copy(p).addScaledVector(right, k); v.y = y; v.project(T.roomCam); return [cv.l + (v.x + 1) / 2 * cv.w, cv.t + (1 - v.y) / 2 * cv.h]; };
  const a = sx(-0.45, 0), b = sx(0.45, 1.85);
  const clown = { l: Math.min(a[0], b[0]), r: Math.max(a[0], b[0]), t: Math.min(a[1], b[1]), b: Math.max(a[1], b[1]) };
  const btns = [...document.querySelectorAll('#prep button')].map((e) => ({ text: e.textContent, disabled: e.disabled, ...box(e) }));
  return {
    room: S.room, view: S.roomView, gloom: S.gloom, face: c.faceNow, tempo: S.mood.tempo, inRoomScene: c.root.parent === T.roomScene,
    inWalkScene: c.root.parent === T.scene, gainDone: S.gainT >= C.gainSecs, laughs: S.laughs, mask: S.mask, carry: S.carry.slice(),
    hudLaughs: document.getElementById('laughsN').textContent, hudMask: document.getElementById('maskN').textContent,
    hudCarry: document.getElementById('carry').textContent,
    paint: c.face.material.uniforms.uPaintAmt.value, paintWant: Math.min(C.paintMax, C.paint + C.paintPerMask * Math.max(0, S.mask)),
    paintBase: C.paint, prepWall: C.prepWall, prepShown: shown('prep'), gainsShown: shown('gains'), barShown: shown('roomBar'),
    prep: box(document.getElementById('prep')), bar: box(document.getElementById('roomBar')), btns, clown,
    vw: window.innerWidth, vh: window.innerHeight, order: C.roomOrder, roomStart: C.roomStart, results: C.actResults,
    prepCfg: C.prep, prepOn: C.prepOn, gloomWalk: C.gloomWalk, moodBack: C.moodBack.tempo, moodRoom: C.moodRoom.tempo, moodOut: C.moodOut.tempo,
    faceBack: C.faceBack, faceOut: C.faceOut, back: S.back, cuts: S.cuts, watch: window.__roomWatch,
  };
}
const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const inside = (a, vw, vh) => a.l >= 0 && a.t >= 0 && a.r <= vw && a.b <= vh;
// waits on the game's own state, not the clock (the fade and turn timers are the page's)
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 120000 }).then(() => true, () => false);

// walk back after the act through 3 shots into the cube room, then the room: gains, the four walls, the dressing table
async function walkBack(page, vp, report) {
  await page.evaluate(watchRoom);
  await page.click('#back');
  const c0 = await page.evaluate(() => window.__walk.cuts);
  report(c0 === 1, `${vp.name}: walk back starts with its first shot only (cuts ${c0}, want 1)`);
  const r = await page.evaluate(botWalk, BACK_ROUTE);
  const s0 = await page.evaluate(roomState);
  report(r.ended && s0.back, `${vp.name}: walk back reaches the cube room flap (waypoint ${r.waypoint} of ${BACK_ROUTE.length}, at ${r.pos.map((v) => v.toFixed(2))})`);
  report(r.shots.join(' > ') === 'entrance > wings > corridor' && r.cuts === 3, `${vp.name}: walk back shots ${r.shots.join(' > ')}, cuts ${r.cuts}`);
  report(r.out === 0, `${vp.name}: walk back, clown feet and head in frame every tick (${r.out} of ${r.ticks} out) ${r.outAt.join('; ')}`);
  report(r.gDrop < 0.005 && r.gEnd > s0.gloomWalk * 0.9 && r.gMax <= s0.gloomWalk + 1e-6,
    `${vp.name}: gloom rises to the flap and never falls (end ${r.gEnd.toFixed(3)}, max ${r.gMax.toFixed(3)}, want ${s0.gloomWalk}; largest drop ${r.gDrop.toFixed(4)})`);
  const inRoom = await until(page, () => window.__walk.room && window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
  let s = await page.evaluate(roomState);
  const good = s.results.good;
  report(inRoom && s.inRoomScene && s.view === s.roomStart && s.gloom === 1 && s.face === s.faceBack && s.tempo === s.moodRoom,
    `${vp.name}: in the cube room (view ${s.view}, gloom ${s.gloom}, face ${s.face}, tempo ${s.tempo})`);
  report(s.hudLaughs === String(good.laughs) && s.hudMask === String(good.mask) && Math.abs(s.paint - s.paintWant) < 1e-6 && s.gainsShown,
    `${vp.name}: good act pays out: HUD Laughs ${s.hudLaughs} Mask ${s.hudMask} (want ${good.laughs} / ${good.mask}), paint ${s.paint.toFixed(3)} (want ${s.paintWant.toFixed(3)})`);
  // turn right all the way round: the dressing table shows on its wall only
  const seen = [];
  let prepOk = true;
  for (let k = 0; k < s.order.length; k++) {
    await page.click('#roomR');
    await until(page, () => !window.__walk.turning);
    s = await page.evaluate(roomState);
    seen.push(s.view);
    if (s.prepShown !== (s.prepOn && s.view === s.prepWall)) prepOk = false;
  }
  report(new Set(seen).size === s.order.length && seen[seen.length - 1] === s.roomStart && prepOk,
    `${vp.name}: turning shows all ${s.order.length} walls (${seen.join(', ')}), dressing table ${s.prepOn ? `only on '${s.prepWall}'` : 'on none (prepOn off)'}`);
  if (!s.prepOn) {
    // switched off (owner, 22 Nov: GDD, Laughs are spent only in the Mirror): a buy cannot happen even from script
    await page.evaluate(() => document.querySelectorAll('#prep button').forEach((b) => b.click()));
    await until(page, () => window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
    s = await page.evaluate(roomState);
    report(s.laughs === good.laughs && s.mask === good.mask && !s.carry.length && s.hudCarry === `Into the Mirror: ${good.laughs} Laughs`,
      `${vp.name}: no dressing table: all ${good.laughs} Laughs go into the Mirror (Laughs ${s.laughs}, Mask ${s.mask}, "${s.hudCarry}")`);
  } else await dressingTable(page, vp, report, good);
  report(s.watch.repeats === 0 && s.watch.writes > 0, `${vp.name}: room HUD written only on change (${s.watch.writes} writes, ${s.watch.repeats} repeats ${s.watch.what.join(', ')})`);
  if (vp.mobile) report(s.watch.stickInRoom === 0, `${vp.name}: touch stick never shown in the room (shown ${s.watch.stickInRoom} times)`);
  // walk back again from the room
  if (vp.mobile) await page.tap('#again'); else await page.click('#again');
  s = await page.evaluate(roomState);
  report(!s.room && s.inWalkScene && s.back && !s.gainsShown && !s.prepShown && !s.barShown && s.gloom === 0 && s.cuts === 1 && Math.abs(s.paint - s.paintBase) < 1e-6,
    `${vp.name}: 'Walk back again' leaves the room clean (room ${s.room}, HUD ${s.gainsShown}, table ${s.prepShown}, gloom ${s.gloom}, paint ${s.paint.toFixed(3)}, cuts ${s.cuts})`);
}

// the dressing table when prepOn: layout on this screen, each item bought once, a rebuy ignored
async function dressingTable(page, vp, report, good) {
  let s = await page.evaluate(roomState);
  // to the dressing table wall: layout on this screen
  for (let k = 0; k < s.order.length && s.view !== s.prepWall; k++) {
    await page.click('#roomR');
    await until(page, () => !window.__walk.turning);
    s = await page.evaluate(roomState);
  }
  const small = s.btns.filter((b) => b.h < 44);
  report(s.prepShown && inside(s.prep, s.vw, s.vh) && !small.length && !overlap(s.prep, s.clown) && !overlap(s.prep, s.bar),
    `${vp.name}: dressing table on screen, buttons at least 44 px (${s.btns.map((b) => Math.round(b.h)).join(', ')}), clear of the clown and the room buttons | table ${JSON.stringify(s.prep, (k, v) => (typeof v === 'number' ? Math.round(v) : v))} clown ${JSON.stringify(s.clown, (k, v) => (typeof v === 'number' ? Math.round(v) : v))} bar top ${Math.round(s.bar.t)} screen ${s.vw}x${s.vh}`);
  // buy every item once, then the first one again (ignored)
  for (let k = 0; k < s.btns.length; k++) {
    if (vp.mobile) await page.tap(`#prep button:nth-of-type(${k + 1})`); else await page.click(`#prep button:nth-of-type(${k + 1})`);
    await until(page, () => window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
  }
  await page.evaluate(() => document.querySelector('#prep button').click());
  await until(page, () => window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
  s = await page.evaluate(roomState);
  const spent = s.prepCfg.reduce((n, it) => n + it.cost, 0);
  const maskWant = Math.max(0, good.mask + s.prepCfg.reduce((n, it) => n + (it.mask || 0), 0));
  const carryWant = s.prepCfg.filter((it) => it.carry).map((it) => it.carry);
  report(s.laughs === good.laughs - spent && s.hudLaughs === String(s.laughs) && s.mask === maskWant && s.hudMask === String(maskWant)
    && s.btns.every((b) => b.disabled) && carryWant.every((n) => s.hudCarry.includes(n)) && Math.abs(s.paint - s.paintWant) < 1e-6,
    `${vp.name}: dressing table buys each item once: Laughs ${s.laughs} (want ${good.laughs - spent}), Mask ${s.mask} (want ${maskWant}), all greyed ${s.btns.every((b) => b.disabled)}, carry "${s.hudCarry}"`);
}

// desktop only: a flop pays little (with prepOn the table greys what he cannot afford); then a walk out straight from the room
async function flopAndOut(page, report) {
  await page.evaluate(() => { const T = window.__walkTest, S = window.__walk; T.begin(true, 'flop'); S.x = 0; S.y = T.CONFIG.backEndY - 0.05; });
  await until(page, () => window.__walk.room && window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
  let s = await page.evaluate(roomState);
  const flop = s.results.flop;
  if (!s.prepOn) {
    report(s.hudLaughs === String(flop.laughs) && s.hudMask === String(flop.mask) && s.hudCarry === `Into the Mirror: ${flop.laughs} Laughs`,
      `flop pays ${s.hudLaughs} Laughs, Mask ${s.hudMask} (want ${flop.laughs} / ${flop.mask}), "${s.hudCarry}"`);
  } else {
    for (let k = 0; k < s.order.length && s.view !== s.prepWall; k++) {
      await page.click('#roomR');
      await until(page, () => !window.__walk.turning);
      s = await page.evaluate(roomState);
    }
    const offWant = s.prepCfg.map((it) => it.cost > flop.laughs);
    report(s.hudLaughs === String(flop.laughs) && s.btns.every((b, k) => b.disabled === offWant[k]),
      `flop pays ${s.hudLaughs} Laughs (want ${flop.laughs}); greyed ${s.btns.map((b) => b.disabled).join(', ')} (want ${offWant.join(', ')})`);
    // buy the cheapest he can afford, then everything left must be greyed if it costs more than what is left
    const cheap = s.prepCfg.map((it, k) => [it.cost, k]).filter(([c]) => c <= flop.laughs).sort((x, y) => x[0] - y[0])[0];
    await page.click(`#prep button:nth-of-type(${cheap[1] + 1})`);
    await until(page, () => window.__walk.gainT >= window.__walkTest.CONFIG.gainSecs);
    s = await page.evaluate(roomState);
    const left = flop.laughs - cheap[0];
    report(s.laughs === left && s.btns.every((b, k) => b.disabled === (k === cheap[1] || s.prepCfg[k].cost > left)),
      `flop: after one buy ${s.laughs} Laughs left (want ${left}), greyed ${s.btns.map((b) => b.disabled).join(', ')}`);
  }
  await page.evaluate(() => window.__walkTest.begin(false));
  s = await page.evaluate(roomState);
  report(!s.room && s.inWalkScene && !s.back && s.gloom === 0 && s.face === s.faceOut && s.tempo === s.moodOut && !s.gainsShown && !s.prepShown
    && !s.barShown && Math.abs(s.paint - s.paintBase) < 1e-6 && s.cuts === 1,
    `walk out from the room: walk scene, gloom ${s.gloom}, face ${s.face}, tempo ${s.tempo}, HUD ${s.gainsShown}, paint ${s.paint.toFixed(3)}, cuts ${s.cuts}`);
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
    const c0 = await page.evaluate(() => window.__walk.cuts);
    report(c0 === 1, `${vp.name}: walk out starts with its first shot only (cuts ${c0}, want 1)`);
    const r = await page.evaluate(botWalk, ROUTE);
    report(r.ended, `${vp.name}: bot reaches the ring edge (waypoint ${r.waypoint} of ${ROUTE.length}, at ${r.pos.map((v) => v.toFixed(2))})`);
    report(r.shots.length === 3 && r.cuts === 3, `${vp.name}: shots ${r.shots.join(' > ')}, cuts ${r.cuts}`);
    report(r.met === 2, `${vp.name}: performers met ${r.met} of 2`);
    report(r.out === 0, `${vp.name}: clown feet and head in frame every tick (${r.out} of ${r.ticks} out)`);
    report(!errs.length, `${vp.name}: no page error after the walk ${errs.join('; ')}`);
    await walkBack(page, vp, report);
    if (vp === SCREENS[0]) await flopAndOut(page, report);
    report(!errs.length, `${vp.name}: no page error after the walk back and the room ${errs.join('; ')}`);
    if (vp === SCREENS[0]) {
      await page.screenshot({ path: '/tmp/walk_end.png' });
      await page.evaluate(() => { const S = window.__walk; window.__walkTest.begin(false); S.x = 0; S.y = 4; });
      const dip = await page.evaluate(stickDip);
      report(dip.restarts <= 1, `stick wobbling at the dead zone for ${dip.frames} frames: walk restarts ${dip.restarts} (max 1)`);
      // owner 25 Nov 19:05 ("Put the rack back"): the near rack is back, so the depth step is back on it as before session 44
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

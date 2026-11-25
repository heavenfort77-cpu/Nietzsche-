// Session 42 probe (stranger record design/STRANGER-night1-s42-coldplay.md, steps 21, 32-33, 57-58). Software GL, the game's own route.
// A shop notes: an act on sale at a price must not say it is free, and must not say he tried or did it unless he did tonight (NS.act).
// B walk text: no two shown text lines overlap on screen (#goal, #hint, #verbCap, #thought, crew labels), sampled every frame from the
//   child's trip until his thought ends, in the Ring door shot.
// C walk shots: a crew member standing outside a shot's zone must not be drawn cut by the frame edge (a body part with no body), per shot.
// Screens as smoke_night1.cjs: desk 1280x720, phone 390x844, land 844x390 (ONLY=<name> for one). PAGE=<file> serves another copy.
// Ends with RESULT s42 stranger n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
const SCREENS = [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'phone', w: 390, h: 844, m: true }, { n: 'land', w: 844, h: 390, m: true }].filter((s) => !process.env.ONLY || s.n === process.env.ONLY);
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
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
// C: per shot, each crew member drawn alone against the same frame (as the smoke's crew-pixel step); the changed pixels' box
function shotCrew() {
  const N = window.__night, W = window.__walkTest, R = W.renderer, gl = R.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const read = () => { W.renderFrame(); const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  const was = N.S.shot, out = [];
  window.__keepFreed = true;
  for (const name of ['corridor', 'wings', 'entrance']) {
    N.S.shot = ''; W.cutTo(name);
    const z = N.S.data.shots[name].zone;
    // the crew (night 1) and the two performers waiting in the wings (shots.json performers), each with its root and floor place
    const figs = N.crew.map((m) => ({ id: m.cd.id, root: m.root, x: m.x, y: m.y })).concat(W.performers.map((p, i) => ({ id: 'performer:' + N.S.data.performers[i].name, root: p.c.root, x: p.x, y: p.y })));
    const vis = figs.map((m) => m.root.visible);
    for (const m of figs) m.root.visible = true;
    const base = read();
    for (const m of figs) {
      m.root.visible = false; const b = read(); m.root.visible = true;
      let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let i = 0; i < b.length; i += 4) if (b[i] !== base[i] || b[i + 1] !== base[i + 1] || b[i + 2] !== base[i + 2]) { n++; const p = i / 4, x = p % w, y = (p - x) / w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const inZone = m.x >= z[0] && m.x <= z[2] && m.y >= z[1] && m.y <= z[3];
      // cut: his whole body's box (world box, 8 corners through the shot's camera) is not inside the frame while some of him is drawn
      const B = new (W.camera.position.constructor)(), box = { min: null, max: null };
      m.root.updateMatrixWorld(true);
      let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      m.root.traverse((o) => { if (!o.isMesh || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const g = o.geometry.boundingBox;
        for (let k = 0; k < 8; k++) { B.set(k & 1 ? g.max.x : g.min.x, k & 2 ? g.max.y : g.min.y, k & 4 ? g.max.z : g.min.z).applyMatrix4(o.matrixWorld); lo = [Math.min(lo[0], B.x), Math.min(lo[1], B.y), Math.min(lo[2], B.z)]; hi = [Math.max(hi[0], B.x), Math.max(hi[1], B.y), Math.max(hi[2], B.z)]; } });
      let inside = true;
      for (let k = 0; k < 8; k++) { B.set(k & 1 ? hi[0] : lo[0], k & 2 ? hi[1] : lo[1], k & 4 ? hi[2] : lo[2]).project(W.camera); if (B.z > 1 || Math.abs(B.x) > 1 || Math.abs(B.y) > 1) inside = false; }
      out.push({ shot: name, id: m.id, px: n, inZone, edge: n > 0 && !inside, box: n ? [x0, h - 1 - y1, x1, h - 1 - y0] : null });
    }
    figs.forEach((m, i) => { m.root.visible = vis[i]; });
  }
  N.S.shot = ''; W.cutTo(was);
  return out;
}
// B: shown text boxes (text rects, not element boxes) and their worst pairwise overlap
function textOverlap() {
  const ids = ['goal', 'hint', 'verbCap', 'thought', 'verb'], els = ids.map((i) => document.getElementById(i)).filter(Boolean);
  for (const m of window.__night.crew) if (m.lab) els.push(m.lab);
  const boxes = [];
  for (const e of els) {
    if (e.classList.contains('hidden') || e.getClientRects().length === 0 || !e.textContent.trim()) continue;
    const r = document.createRange(); r.selectNodeContents(e);
    for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) boxes.push({ who: e.id || 'label:' + e.textContent.slice(0, 16), b });
  }
  let worst = 0, pair = '';
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    if (boxes[i].who === boxes[j].who) continue;
    const a = boxes[i].b, c = boxes[j].b, o = Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)) * Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top));
    if (o > worst) { worst = o; pair = boxes[i].who + ' / ' + boxes[j].who; }
  }
  const th = document.getElementById('thought');
  return { worst: Math.round(worst), pair, thought: !!(th && !th.classList.contains('hidden')), belong: window.__night.NS.belong };
}
// C, for one walk direction (back: the crew turn their backs, updateCrew's own turn, measured once turned)
async function crewCheck(pg, sc, dir) {
  if (dir === 'back') { await pg.evaluate(() => { window.__night.S.back = true; }); await pg.waitForTimeout(6000); }
  // the probe draws every member to measure; the game's own hide lists (crewHide, crewCut) then say what the player sees
  const c = await pg.evaluate(shotCrew);
  const hid = await pg.evaluate(() => { const N = window.__night, out = {}; for (const s of ['corridor', 'wings', 'entrance']) out[s] = (N.N1.crewHide[s] || []).concat((N.N1.crewCut || {})[s] || []); return out; });
  for (const x of c) if (!x.inZone && x.px > 0) report(!x.edge || hid[x.shot].includes(x.id), `${sc.n} ${dir} ${x.shot}: ${x.id} (outside the shot's zone) is not shown cut by the frame edge`, { px: x.px, cut: x.edge, box: x.box, hidden: hid[x.shot].includes(x.id) });
}
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const base = `http://127.0.0.1:${srv.address().port}/${PAGE}`;
  const errs = [];
  // A: shop notes, night 1 (tryout sweep) and night 2 (tryout scale, sweep from night 1), after playing the fall, 0 shards
  if (!process.env.ONLY || process.env.ONLY === 'desk') {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    for (const [hash, night] of [['', 1], ['#n=2&m=0&s=0&b=&t=sweep.scale&lo=0', 2]]) {
      const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
      await pg.goto(base + hash); if (hash) await pg.reload();
      await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
      const r = await pg.evaluate(() => {
        const N = window.__night; document.getElementById('curtain').classList.add('hidden');
        N.NS.act = 'fall'; N.NS.shards = 0; N.NS.learn = null; N.shopCard();
        return [...document.querySelectorAll('#card_shop .opt')].map((o) => ({ id: o.dataset.id, note: (o.querySelector('.note') || {}).textContent || '', priced: !!o.querySelector('.price'), owned: /bought/.test(o.innerText) }));
      });
      for (const x of r) {
        if (!x.priced || x.owned) continue;
        report(!/\bfree\b/i.test(x.note), `night ${night} shop: ${x.id} on sale is not called free`, { note: x.note });
        report(!/(^|[^r] )(tried|did it)\b|^(You tried|Tried)/i.test(x.note.replace(/Never tried/gi, '')), `night ${night} shop: ${x.id} does not say he tried it (tonight's act was the fall)`, { note: x.note });
      }
      await pg.close();
    }
    await ctx.close();
  }
  for (const sc of SCREENS) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, deviceScaleFactor: 1, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(base);
    await toCorridor(pg);
    await pg.waitForTimeout(2000);
    // C
    await crewCheck(pg, sc, 'out');
    // B: stand by the child in the Ring door shot, press the trip, sample every frame until his thought has ended
    await pg.evaluate(() => { const N = window.__night; N.S.x = -2.6; N.S.y = 16.4; });
    await pg.waitForFunction(() => window.__night.S.shot === 'entrance', null, { timeout: 60000 }).catch(() => {});
    await pg.waitForFunction(() => /Trip/.test(document.getElementById('verb').innerText) && !document.getElementById('verb').classList.contains('hidden'), null, { timeout: 60000 }).catch(() => {});
    await pg.click('#verb').catch(() => {});
    if (process.env.DEBUG) console.log('B', await pg.evaluate(() => { const N = window.__night; return [N.S.shot, N.S.x, N.S.y, N.NS.belong, N.NS.verbM && N.NS.verbM.cd.id, N.S.ended, N.S.back, !!N.NS.anim, N.S.mode, N.S.running, document.getElementById('verbBtn') && document.getElementById('verbBtn').outerHTML.slice(0,120), [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0).map((b) => b.innerText).join('|'), N.crew.find((m) => m.cd.id === 'child').done]; }));
    const t = await pg.evaluate((fn) => new Promise((res) => {
      const f = new Function('return (' + fn + ')')(); let worst = { worst: 0 }, sawThought = false, n = 0;
      const tick = () => {
        const r = f(); n++; if (r.thought) sawThought = true; if (r.worst > worst.worst) worst = r;
        if ((sawThought && window.__night.NS.belong === 3) || n > 3000) res({ worst, sawThought, frames: n }); else requestAnimationFrame(tick);
      };
      tick();
    }), textOverlap.toString());
    report(t.sawThought, `${sc.n}: his thought shows after the child's trip`, { frames: t.frames });
    report(t.worst.worst === 0, `${sc.n}: no two shown text lines overlap from the trip to the thought's end`, { px2: t.worst.worst, pair: t.worst.pair });
    await crewCheck(pg, sc, 'back');
    await ctx.close();
  }
  report(errs.length === 0, 'no page errors', errs.slice(0, 3));
  console.log(`RESULT s42 stranger ${pass} of ${all} pass`);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });

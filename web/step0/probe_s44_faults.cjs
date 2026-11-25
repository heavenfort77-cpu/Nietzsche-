// Session 44 probe (owner 25 Nov 13:46-13:59, phone screenshots; stranger s42 steps 12-14). Software GL; screens as smoke_night1.cjs.
// A mirror scenes (paint at the vanity, entry, after, shop, and the press shot): nothing of the glass is drawn over the clown. Per scene:
//   his pixels = what changes in the room pass when he is hidden (interior only: edge pixels blend with the glass behind him); inside the glass box none of them may change when the mirror's own
//   layers are added (the reflection pass in WebGL, the glass tint and cracks on the #cracks canvas over the page).
// C text: no two shown pieces of text overlap on screen (text boxes from Range rects, any element, different elements, not nested):
//   at the act board wall and in each mirror scene above.
// Ends with RESULT s44 faults n of m pass. ONLY=<screen> for one screen; DEBUG=1 prints state on failures.
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

// C: every shown text box (one per line of each text node), and the pairs from different, not nested elements that overlap by more than 2 px both ways
function textOverlaps() {
  const boxes = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const name = (e) => (e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName) + (e.parentElement && e.parentElement.id ? ' in #' + e.parentElement.id : '');
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const t = n.textContent.trim(), e = n.parentElement;
    if (!t || !e || e.closest('script,style,noscript')) continue;
    if (e.checkVisibility && !e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1 && q.right > 0 && q.bottom > 0 && q.left < innerWidth && q.top < innerHeight) boxes.push({ e, t: t.slice(0, 30), r: [q.left, q.top, q.right, q.bottom] });
  }
  const out = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.e === b.e || a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const ox = Math.min(a.r[2], b.r[2]) - Math.max(a.r[0], b.r[0]), oy = Math.min(a.r[3], b.r[3]) - Math.max(a.r[1], b.r[1]);
    if (ox > 2 && oy > 2) out.push(`${name(a.e)} "${a.t}" x ${name(b.e)} "${b.t}" (${Math.round(ox)}x${Math.round(oy)} px)`);
  }
  return out;
}

// A: in the current mirror scene, his pixels inside the glass box that change when the mirror's layers are drawn
function glassOverClown() {
  const N = window.__night, W = window.__walkTest, R = W.renderer, gl = R.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, S = N.S, NS = N.NS;
  const read = () => { const b = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b); return b; };
  const c = N.chars.clown, kind = S.mirror;
  const press = !!NS.press;
  // full frame as the game draws it
  W.renderFrame(); const full = read();
  // the room pass alone (no reflection pass), with and without him; the press shot has no separate pass: its glass layers are its glass mesh and #cracks
  S.mirror = press ? kind : null; W.renderFrame(); const base = read();
  c.root.visible = false; W.renderFrame(); const noHim = read(); c.root.visible = true;
  S.mirror = kind; W.renderFrame();
  // the glass box in drawing-buffer pixels (NS.mrect is CSS px, bottom-up), and the page canvas over it
  const dpr = R.getPixelRatio(), m = NS.mrect, x0 = Math.floor(m[0] * dpr), y0 = Math.floor(m[1] * dpr), x1 = Math.ceil((m[0] + m[2]) * dpr), y1 = Math.ceil((m[1] + m[3]) * dpr);
  const cv = document.getElementById('cracks'), cs = getComputedStyle(cv), shown = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0;
  const cx = cv.getContext('2d'), cimg = shown && cv.width && cv.height ? cx.getImageData(0, 0, cv.width, cv.height).data : null;
  // his interior only: a pixel of his whose four neighbours are his too (an edge pixel mixes him with what is truly behind him: the glass)
  const isHim = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; const i = (y * w + x) * 4; return base[i] !== noHim[i] || base[i + 1] !== noHim[i + 1] || base[i + 2] !== noHim[i + 2]; };
  let him = 0, webgl = 0, page = 0;
  for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
    const i = (y * w + x) * 4;
    if (!isHim(x, y) || !isHim(x - 1, y) || !isHim(x + 1, y) || !isHim(x, y - 1) || !isHim(x, y + 1)) continue;
    him++;
    if (Math.abs(full[i] - base[i]) + Math.abs(full[i + 1] - base[i + 1]) + Math.abs(full[i + 2] - base[i + 2]) > 6) webgl++;
    if (cimg) { const cxp = Math.round(x * cv.width / w), cyp = Math.round((h - 1 - y) * cv.height / h), k = (Math.min(cv.height - 1, cyp) * cv.width + Math.min(cv.width - 1, cxp)) * 4; if (cimg[k + 3] > 8) page++; }
  }
  return { kind, press, him, webgl, page, rect: [x0, y0, x1, y1] };
}

async function toBoard(pg) {
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.getClientRects().length > 0), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.getClientRects().length > 0).click(), re.source); };
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.getClientRects().length > 0); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && !(await pg.evaluate(() => window.__night.NS.scene === 'boardwall' || [...document.querySelectorAll('button')].some((b) => /act board/.test(b.innerText) && b.getClientRects().length > 0))); i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  if ((await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall') await click(/act board/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'boardwall' && [...document.querySelectorAll('#boardActs .note')].some((b) => b.getClientRects().length > 0), null, { timeout: 120000 });
  await pg.waitForTimeout(1200);
}

(async () => {
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}/${PAGE}`;
  const br = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  for (const sc of SCREENS) {
    const ctx = await br.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
    try {
      // C at the board wall of nights 3, 2 and 1 (stored-run hashes as probe_shop.cjs; the owner's screenshot was a later night's board), on the game's own route
      for (const [hash, night] of [['#n=3&m=6&s=60&b=&t=sweep.scale.drill&lo=1', 'night 3'], ['#n=2&m=3&s=40&b=&t=sweep.scale&lo=0', 'night 2'], ['', 'night 1']]) {
      await pg.goto(base + hash); if (hash) await pg.reload();
      await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 180000 });
      await toBoard(pg);
      const ov = await pg.evaluate(textOverlaps);
      const where = await pg.evaluate(() => { const r = (e) => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; };
        const g = document.getElementById('goal'); return { goal: g.textContent ? r(g) : null, goalShown: !g.classList.contains('hidden'), notes: [...document.querySelectorAll('#boardActs .note')].filter((b) => b.getClientRects().length).map((b) => [b.innerText, r(b)]) }; });
      report(ov.length === 0, `${sc.n} ${night} board wall: no text over other text`, { overlaps: ov.slice(0, 6), where });
      }
      // A and C in each mirror scene (state jump through the test hook; the loop keeps running)
      for (const kind of ['paint', 'entry', 'after', 'shop', 'press']) {
        await pg.evaluate((k) => { const N = window.__night; document.getElementById('curtain').classList.add('hidden'); N.NS.learn = null; N.mirrorSetup(k === 'press' ? 'entry' : k); if (k === 'shop') N.shopCard(); }, kind);
        await pg.waitForTimeout(900);
        if (kind === 'press') {
          await pg.keyboard.press('KeyE');
          await pg.waitForFunction(() => window.__night.NS.press, null, { timeout: 30000 }).catch(() => {});
          await pg.waitForTimeout(1500);
        }
        const g = await pg.evaluate(glassOverClown);
        report(g.him > 50 && g.webgl === 0 && g.page === 0, `${sc.n} mirror ${kind}: nothing of the glass drawn over him`, g);
        const o2 = await pg.evaluate(textOverlaps);
        report(o2.length === 0, `${sc.n} mirror ${kind}: no text over other text`, o2.slice(0, 6));
        if (process.env.DEBUG && (g.webgl || g.page)) console.log('state', await pg.evaluate(() => ({ scene: window.__night.NS.scene, mirror: window.__night.S.mirror, press: window.__night.NS.press })));
      }
      report(errs.length === 0, `${sc.n} no page errors`, errs.slice(0, 3));
    } catch (e) { report(false, `${sc.n} route`, String(e).slice(0, 200)); }
    await ctx.close();
  }
  await br.close(); srv.close();
  console.log(`RESULT s44 faults ${pass} of ${all} pass`);
  process.exit(pass === all ? 0 : 1);
})();

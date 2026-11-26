// F45 probe (session 37): a scripted move must never leave the clown where he cannot walk (found by the cold-play phone run, 24 Nov:
// "Pratfall over the cable" landed him inside a prop box in the wings, and no input moved him again).
// Plays night1.html through its own route to the corridor (desk 1280x720, software GL), puts him in front of the cable at each test x,
// presses the pratfall, then checks (PAGE=<file> serves another copy, e.g. the page before the fix): the landing spot is walkable (inside a walk rect, outside every obstacle grown by the clown radius)
// and holding each arrow key moves him. Usage: node web/step0/probe_land_free.cjs (needs cube25d/setup.sh). Ends with RESULT land free n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html';
// the cases: the pratfall over the cable at three x (the phone run's spot -2.18), and the trip for the child at the desktop run's spot
// (-2.66, 16.48: no fall line fitted, so the old trip went 0.6 m straight on into the child's circle). y null = 1.1 m before the cable
const CASES = [{ verb: 'Pratfall', x: -2.18, y: null }, { verb: 'Pratfall', x: -1.9, y: null }, { verb: 'Pratfall', x: 0.4, y: null }, { verb: 'Trip', x: -2.66, y: 16.48 }].filter((c, i) => (!process.env.ONLY || c.verb === process.env.ONLY) && (!process.env.CASE || process.env.CASE.split(',').includes(String(i))));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
});
// the clown's collision radius, m (night1.html CONFIG.clownR; CONFIG is not on the test hook)
const CLOWN_R = 0.3;
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
// is (x, y) walkable by the game's own data (walk rects; obstacles grown by the clown radius; crew circles)
const WALKABLE = `(x, y) => { const S = window.__night.S, r = ${CLOWN_R}, ins = (q, m) => x >= q[0] + m && x <= q[2] - m && y >= q[1] + m && y <= q[3] - m;
  return S.data.walk.some((q) => ins(q, 0)) && !S.data.obstacles.some((q) => ins(q, -r)) && !window.__night.crew.some((c) => Math.hypot(x - c.x, y - c.y) < r + (window.__night.N1.crewRs[c.cd.id] ?? window.__night.N1.crewR)); }`;
async function toCorridor(pg) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.offsetParent), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.offsetParent).click(), re.source); };
  // Start can be pressed under the logo before the game takes it: press again until the paint scene starts
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.offsetParent); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && !(await pg.evaluate(() => [...document.querySelectorAll('button')].some((b) => /act board/.test(b.innerText) && b.offsetParent))); i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  await click(/act board/);
  for (let i = 0; i < 40 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.down('KeyW'); await pg.waitForTimeout(400); await pg.keyboard.up('KeyW'); }
  await click(/^The fall$/);
  await click(/^(Perform it|Do it)$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 120000 });
}
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  for (const cs of CASES) {
    const x = cs.x, name = `${cs.verb.toLowerCase()} at (${x}, ${cs.y === null ? 'cable' : cs.y})`;
    const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
    await toCorridor(pg);
    // in front of the cable at x (the cold player's spot was x -2.18, y 10.16); the rigger's pratfall prompt shows there
    const y = await pg.evaluate((c) => { const N = window.__night; N.S.x = c.x; N.S.y = c.y === null ? N.N1.cableY - 0.9 : c.y; return N.S.y; }, cs);
    // a short step so the walk cuts to this spot's shot (crew unseen in the old shot are hidden and offer no prompt), then back to the spot
    for (let i = 0; i < 6 && (await pg.evaluate(() => document.getElementById('verb').classList.contains('hidden'))); i++) {
      await pg.keyboard.down('ArrowLeft'); await pg.waitForFunction(() => true, null, { polling: 'raf' }); await pg.keyboard.up('ArrowLeft');
      await pg.evaluate((c) => { const N = window.__night; N.S.x = c.x; N.S.y = c.y === null ? N.N1.cableY - 0.9 : c.y; }, cs);
      await pg.waitForTimeout(1500);
    }
    await pg.waitForFunction((v) => new RegExp(v).test((document.getElementById('verb') || {}).textContent || '') && !document.getElementById('verb').classList.contains('hidden'), cs.verb, { timeout: 60000 }).catch(() => {});
    const shown = await pg.evaluate(() => !document.getElementById('verb').classList.contains('hidden') && document.getElementById('verb').textContent);
    if (!shown) { report(false, `${name}: prompt shown`, { x, y, shown }); await pg.close(); continue; }
    await pg.keyboard.press('KeyE');
    await pg.waitForFunction(() => window.__night.NS.anim && /prat|trip/.test(window.__night.NS.anim.kind), null, { timeout: 30000 });
    await pg.waitForFunction(() => !window.__night.NS.anim, null, { timeout: 120000 });
    const land = await pg.evaluate(`(() => { const S = window.__night.S; return { x: +S.x.toFixed(2), y: +S.y.toFixed(2), ok: (${WALKABLE})(S.x, S.y) }; })()`);
    report(land.ok, `${name}: lands on walkable floor`, land);
    // each arrow key held until he has moved 0.15 m or 1.5 s of game time went by (game time from S.lastT frames, not the wall clock)
    const moved = {};
    for (const k of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      const p0 = await pg.evaluate(() => [window.__night.S.x, window.__night.S.y]);
      await pg.evaluate(() => { window.__mv = 0; });
      await pg.keyboard.down(k);
      await pg.waitForFunction((p0) => { const S = window.__night.S; window.__mv = (window.__mv || 0) + 1; return Math.hypot(S.x - p0[0], S.y - p0[1]) > 0.15; }, p0, { timeout: 60000, polling: 'raf' }).catch(() => {});
      await pg.keyboard.up(k);
      moved[k] = await pg.evaluate((p0) => +Math.hypot(window.__night.S.x - p0[0], window.__night.S.y - p0[1]).toFixed(2), p0);
    }
    report(Object.values(moved).some((d) => d > 0.15), `${name}: he can walk away after it`, moved);
    report(!errs.length, `${name}: no page errors`, errs.slice(0, 2));
    await pg.close();
  }
  console.log(`RESULT land free ${pass} of ${all} pass`);
  await b.close(); srv.close(); process.exit(pass === all ? 0 : 1);
})();

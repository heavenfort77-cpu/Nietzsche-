// Walk-turn probe (session 38): a held walk key from each spot where the session 37-38 cold players stood still (design/STRANGER-night1-s38-coldplay.md)
// must carry the clown on: straight up the corridor past the stagehand and the pole into the wings; from the pocket between the child and the left wall
// at the ring entrance to the ring; from the wings crates toward the corridor (screen left). Night1.html through its own route to the corridor
// (desk 1280x720, software GL); positions set through the test hook; frames counted (at most 400). PAGE=<file> serves another copy (the page before).
// Usage: node web/step0/probe_walk_turn.cjs (needs cube25d/setup.sh). Ends with RESULT walk turn n of m pass. Session 38: before 1 of 4, after 4 of 4.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname, PAGE = process.env.PAGE || 'night1.html';
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
  return S.data.walk.some((q) => ins(q, 0)) && !S.data.obstacles.some((q) => ins(q, -r)) && !window.__night.crew.some((c) => Math.hypot(x - c.x, y - c.y) < r + window.__night.N1.crewR); }`;
async function toCorridor(pg) {
  await pg.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  const click = async (re) => { await pg.waitForFunction((s) => [...document.querySelectorAll('button')].some((b) => new RegExp(s).test(b.innerText) && b.offsetParent), re.source, { timeout: 120000 }); await pg.evaluate((s) => [...document.querySelectorAll('button')].find((b) => new RegExp(s).test(b.innerText) && b.offsetParent).click(), re.source); };
  // Start can be pressed under the logo before the game takes it: press again until the paint scene starts
  for (let i = 0; i < 60 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'paint'; i++) { await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText === 'Start' && x.offsetParent); if (b) b.click(); }); await pg.waitForTimeout(2000); }
  for (let i = 0; i < 150 && (await pg.evaluate(() => window.__night.NS.scene)) !== 'boardwall'; i++) { await pg.keyboard.press('Space'); await pg.waitForTimeout(800); }
  await pg.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.innerText === 'The fall' && b.offsetParent), null, { timeout: 120000 });
  await click(/^The fall$/);
  await click(/^Perform it$/);
  await pg.waitForFunction(() => window.__night.NS.scene === 'walk' && window.__night.S.running, null, { timeout: 120000 });
}

// the spots (Blender floor x, y), the held key, and where he must get to
const SPOTS = [{ n: 'corridor straight', x: 0, y: 2.4, key: 'KeyW', goal: (p) => p.y > 8.7 }, { n: 'pole', x: -0.89, y: 6.23, key: 'KeyW', goal: (p) => p.y > 8.7 },
  { n: 'entrance pocket', x: -2.69, y: 16.51, key: 'KeyW', goal: (p) => p.y > 17.9 || p.scene !== 'walk' }, { n: 'wings crates A (screen left, to the corridor)', x: 2.98, y: 9.97, key: 'KeyA', fall: true, goal: (p) => Math.hypot(p.x - 2.98, p.y - 9.97) > 0.8 }];
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  await toCorridor(pg);
  for (const s of SPOTS) {
    await pg.evaluate((s) => { const N = window.__night; N.S.x = s.x; N.S.y = s.y; if (s.fall) N.NS.verbs.fall = true; }, { x: s.x, y: s.y, fall: !!s.fall });
    await pg.waitForTimeout(1500);
    await pg.evaluate((s) => { const N = window.__night; N.S.x = s.x; N.S.y = s.y; window.__f = 0; }, { x: s.x, y: s.y });
    await pg.keyboard.down(s.key);
    const goal = s.goal.toString();
    const r = await pg.waitForFunction((g) => { window.__f++; const N = window.__night, p = { x: N.S.x, y: N.S.y, scene: N.NS.scene }; return eval(g)(p) || window.__f > 400; }, goal, { timeout: 600000, polling: 'raf' }).then(() => true);
    await pg.keyboard.up(s.key);
    const p = await pg.evaluate((g) => { const N = window.__night, p = { x: +N.S.x.toFixed(2), y: +N.S.y.toFixed(2), scene: N.NS.scene, frames: window.__f, shot: N.S.shot }; p.ok = eval(g)(p); return p; }, goal);
    report(p.ok, s.n, p);
    if (p.scene !== 'walk') break;
  }
  console.log('errors', errs.length, errs.slice(0, 2));
  console.log(`RESULT walk turn ${pass} of ${all} pass`);
  await b.close(); srv.close();
})();

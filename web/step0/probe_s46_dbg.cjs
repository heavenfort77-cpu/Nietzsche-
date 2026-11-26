// debug (session 46): free() at the pocket spots and the crew circles there
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

(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await pg.goto(`http://127.0.0.1:${srv.address().port}/${PAGE}`);
  await toCorridor(pg);
  const r = await pg.evaluate(() => { const N = window.__night, W = window.__walkTest;
    return { free1: W.free(-2.69, 16.51), free2: W.free(-2.66, 16.48), clownR: W.CONFIG.clownR, rs: N.N1.crewRs, crew: N.crew.map((m) => [m.cd.id, m.x, m.y]), src: W.free.toString().slice(0, 900) }; });
  console.log('RESULT debug ' + JSON.stringify(r));
  await b.close(); srv.close();
})().catch((e) => { console.log('FAIL probe error | ' + String(e).slice(0, 300)); process.exit(1); });

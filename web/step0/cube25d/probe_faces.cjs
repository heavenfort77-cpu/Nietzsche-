// F13/F14 probe (prototype): on cue_model.html, every face cell shows features, and the cue centre sits on the nose.
// Serve web/step0 on 127.0.0.1:8765 first. OLD=1 forces the game page's old offsets (the probe before the fix).
// Run: NODE_PATH=<node_modules with puppeteer-core> node web/step0/cube25d/probe_faces.cjs
const puppeteer = require('puppeteer-core');
const OLD = { sad: [0, 0], smile: [0.5, 0], startle: [0, -0.5], wince: [0.5, -0.5] };
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:8765/cue_model.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game.info().model, { timeout: 120000 });
  await page.click('#btnLook');
  await new Promise((r) => setTimeout(r, 500));
  // freeze the pose so every reading is from the same frame of the idle clip
  await page.evaluate(() => { window.__model.parts.mixer.timeScale = 0; });
  const cells = process.env.OLD ? OLD : await page.evaluate(() => window.__model.faces);
  let fail = 0;
  // pixels from a screenshot (the WebGL canvas keeps no drawing buffer), measured in Python (Pillow)
  const measure = async (b) => {
    const f = require('os').tmpdir() + '/probe_face.png';
    await page.screenshot({ path: f, clip: { x: b.x, y: b.y, width: b.w, height: b.h } });
    const py = `from PIL import Image
im = Image.open('${f}').convert('RGB'); w, h = im.size; d = im.load()
dark = n = nx = ny = nn = 0
for y in range(h):
    for x in range(w):
        r, g, bl = d[x, y]; l = 0.2126 * r + 0.7152 * g + 0.0722 * bl; n += 1; dark += l < 60
        if r > 170 and g < 120 and bl < 110 and r - g > 90: nx += x; ny += y; nn += 1
print(dark / n, nx / nn if nn else -1, ny / nn if nn else -1)`;
    const [dark, x, y] = require('child_process').execFileSync('python3', ['-c', py]).toString().trim().split(' ').map(Number);
    return { dark, nose: x < 0 ? null : [b.x + x, b.y + y] };
  };
  const i = await page.evaluate(() => window.__game.info());
  // nose first: it fixes where the eyes are, whatever the cue anchor says
  const nb = { x: Math.round(i.cx - i.R), y: Math.round(i.cy - i.R), w: Math.round(i.R * 2), h: Math.round(i.R * 2) };
  const n = await measure(nb);
  const off = n.nose ? Math.hypot(n.nose[0] - i.cx, n.nose[1] - i.cy) / i.R : 9;
  if (!(off <= 0.3)) fail++;
  console.log(`${off <= 0.3 ? 'PASS' : 'FAIL'}  cue centre to nose: ${off.toFixed(2)} R (max 0.3 R), R ${i.R.toFixed(0)} px`);
  // eye band: between the nose and the hat brim, inside the face skin
  const nx = n.nose ? n.nose[0] : i.cx, ny = n.nose ? n.nose[1] : i.cy;
  const box = { x: Math.round(nx - i.R * 0.6), y: Math.round(ny - i.R * 0.8), w: Math.round(i.R * 1.2), h: Math.round(i.R * 0.6) };
  for (const [name, c] of Object.entries(cells)) {
    await page.evaluate((c) => { window.__model.parts.face.material.uniforms.uCell.value.set(c[0], c[1]); }, c);
    await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
    const r = await measure(box);
    const ok = r.dark > 0.01;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  face ${name} [${c}]: dark eye and brow pixels in the eye band ${(r.dark * 100).toFixed(1)}% (min 1%)`);
  }
  console.log(fail ? `RESULT FAIL ${fail}` : 'RESULT PASS');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();

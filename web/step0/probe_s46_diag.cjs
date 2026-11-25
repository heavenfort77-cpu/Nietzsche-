// Runs web/step0/diag_depth.html (session 46 phone depth check) in headless Chrome and prints its verdict and table (software GL: the page itself is checked, not a phone).
// Usage: node step0/probe_s46_diag.cjs (from web/). Ends with RESULT s46 diag n of m pass.
const path = require('path'), http = require('http'), fs = require('fs');
const pw = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
const ROOT = __dirname;
const srv = http.createServer((q, r) => { const f = path.join(ROOT, 'diag_depth.html'); r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(fs.readFileSync(f)); });
let pass = 0, all = 0;
const report = (ok, name, info) => { all++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name} | ${JSON.stringify(info)}`); };
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 866, height: 400 }, deviceScaleFactor: 2.7 });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/`);
  await pg.click('#go');
  await pg.waitForFunction(() => document.getElementById('v').textContent.length > 0, null, { timeout: 120000 });
  const r = await pg.evaluate(() => ({ v: document.getElementById('v').textContent, rows: [...document.querySelectorAll('#t tr')].map((t) => t.innerText.replace(/\s+/g, ' ')), info: document.getElementById('info').textContent }));
  console.log(r.info); r.rows.forEach((x) => console.log('row ' + x));
  report(/^PASS/.test(r.v), 'verdict on software GL', r.v);
  report(/same as the file/.test(r.rows[0] || ''), 'texture bytes', r.rows[0]);
  report(r.rows.length === 5, 'all four cases ran', r.rows.length);
  report(errs.length === 0, 'no page errors', errs.slice(0, 2));
  console.log(`RESULT s46 diag ${pass} of ${all} pass`);
  await b.close(); srv.close();
})().catch((e) => { console.log('FAIL probe error | ' + String(e).slice(0, 300)); process.exit(1); });

// Headless page runner: serves a folder, opens a page, waits for window.<VAR>, prints PASS/FAIL lines.
// node run_page.mjs <root> <page> <var> [screenshot.png]
import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';
const [root, page, varName = 'PROBE', shot] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.png': 'image/png', '.ktx2': 'image/ktx2', '.json': 'application/json' };
const srv = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.setViewport({ width: 900, height: 900 });
await p.goto(`http://127.0.0.1:${port}/${page}`);
let res = null;
try { await p.waitForFunction(`window.${varName}`, { timeout: 180000 }); res = await p.evaluate(`window.${varName}`); }
catch (e) { res = [{ name: 'page timeout', ok: false, info: errs.join(' | ').slice(0, 600) }]; }
for (const r of res) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.info ? ' | ' + r.info : ''));
if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 5).join(' | ').slice(0, 800));
if (shot) await p.screenshot({ path: shot });
await b.close(); srv.close();

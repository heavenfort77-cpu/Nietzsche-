// Cold-play harness (session 37, owner 24 Nov: "cold player and first timer to play and where they get lost").
// A fresh agent plays web/step0/night1.html through the game's own route, seeing only screenshots and on-screen text.
// Between the agent's turns the game is frozen (loop stopped, audio clock suspended), so thinking time costs nothing in play.
// Usage: node tools/coldplay/server.cjs <name> <desk|phone> [port]; then tools/coldplay/play <cmd> ... (PORT env, default 8790).
// Writes /tmp/coldplay/<name>/shots/NNN.jpg and log.jsonl (each step: the command, the agent's words, the hidden game state for the report).
const path = require('path'), http = require('http'), fs = require('fs'), { execFileSync } = require('child_process');
const REPO = path.join(__dirname, '..', '..');
const pw = require(path.join(REPO, 'web', 'node_modules', 'playwright-core'));
const NAME = process.argv[2] || 'player', DEV = process.argv[3] || 'desk', PORT = Number(process.argv[4] || 8790);
const ROOT = path.join(REPO, 'web', 'step0'), OUT = path.join('/tmp/coldplay', NAME), SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const LOG = fs.createWriteStream(path.join(OUT, 'log.jsonl'), { flags: 'a' });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.jpg': 'image/jpeg' };
// serve-side only (the game file is not changed): a hold hook for the freeze, and a game-time counter for the log
const HOOK_A = 'window.__night = { pressCam,';
const HOOK_B = 'window.__hold = { frame, startLoop, gt: 0, frames: 0 };\n' + HOOK_A;
const STEP_A = '  stepFrame(dt);\n  tierWatch(ms, dt);';
const STEP_B = '  stepFrame(dt); window.__hold.gt += dt; window.__hold.frames++;\n  tierWatch(ms, dt);';
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0].split('#')[0]);
  const f = path.join(ROOT, u === '/' ? 'night1.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  let body = fs.readFileSync(f);
  if (u.endsWith('night1.html')) {
    let s = body.toString();
    if (s.split(HOOK_A).length !== 2 || s.split(STEP_A).length !== 2) { console.error('hook anchors not found'); process.exit(2); }
    body = s.replace(HOOK_A, HOOK_B).replace(STEP_A, STEP_B);
  }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(body);
});
const DEVICES = {
  desk: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};
let page, cdp, step = 0, errors = [], frozen = false, lastFrames = 0, runStart = 0, runMs = 0, lastRunMs = 0;
// stop the loop and the audio clock (only if the game itself has the loop running); thaw undoes exactly that
async function freeze() {
  if (frozen) return;
  if (runStart) { runMs += Date.now() - runStart; runStart = 0; }
  frozen = await page.evaluate(() => {
    const N = window.__night, H = window.__hold;
    if (!N || !H) return false;
    if (!N.S.running || N.NS.paused) return false;
    N.S.running = false; if (N.S.raf) { cancelAnimationFrame(N.S.raf); N.S.raf = 0; }
    H.audio = N.NS.audio && N.NS.audio.state === 'running'; if (H.audio) N.NS.audio.suspend();
    return true;
  });
}
async function thaw() {
  if (!runStart) runStart = Date.now();
  if (!frozen) return;
  await page.evaluate(() => {
    const N = window.__night, H = window.__hold;
    if (H.audio) N.NS.audio.resume();
    N.S.running = true; H.startLoop();
  });
  frozen = false;
}
// what a player can see: text that is drawn (not hidden, not faded out, inside the screen) and the buttons with their centres
async function seen() {
  return page.evaluate(() => {
    const W = innerWidth, Hh = innerHeight;
    const faded = (e) => { for (let p = e; p && p.nodeType === 1; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.08) return true; } return false; };
    // pointer-events off for overlays would hide them from elementsFromPoint: on for the check only
    const pe = document.createElement('style'); pe.textContent = '* { pointer-events: auto !important; }'; document.head.appendChild(pe);
    const vis = (e) => {
      for (let p = e; p && p.nodeType === 1; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.08) return false; }
      const r = e.getBoundingClientRect();
      if (!(r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < Hh)) return false;
      // covered by something drawn over it (a card on top): not seen
      const all = document.elementsFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(Hh - 1, Math.max(0, r.top + r.height / 2)));
      for (const t of all) {
        if (t === e || e.contains(t) || t.contains(e)) return true;
        if (!faded(t) && t.closest('.card, #pauseCard') && !t.closest('.card, #pauseCard').contains(e)) return false;
      }
      return true;
    };
    const text = [], seenT = new Set();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (!t || !n.parentElement || /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName) || !vis(n.parentElement)) continue;
      if (n.parentElement.closest('button')) continue;
      // session 38: a closed fold (details) draws only its summary
      const fold = n.parentElement.closest('details');
      if (fold && !fold.open && !n.parentElement.closest('summary')) continue;
      if (n.parentElement.closest('summary')) continue;
      if (!seenT.has(t)) { seenT.add(t); text.push(t); }
    }
    const buttons = [];
    for (const b of document.querySelectorAll('button, [role=button], summary')) {
      if (!vis(b)) continue;
      const r = b.getBoundingClientRect();
      buttons.push({ label: (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim() || '(no label)', x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), dim: b.disabled || b.classList.contains('held') });
    }
    pe.remove();
    return { text, buttons };
  });
}
// the hidden state, for the report only (never returned to the player)
async function hidden() {
  return page.evaluate(() => {
    const N = window.__night, H = window.__hold;
    if (!N) return { loaded: false };
    const M = N.NS.mw;
    const cp = N.chars.clown && N.chars.clown.root.position; return { pos: cp ? [+cp.x.toFixed(2), +cp.z.toFixed(2)] : null, touch: N.input ? N.input.touchId : null, scene: N.NS.scene, mode: N.S.mode, night: N.N1.night, laughs: N.S.laughs, mask: N.NS.mask, mwLaughs: M ? Math.round(M.laughs) : null, foes: N.foes.filter((f) => f.alive).map((f) => f.kind), gt: +H.gt.toFixed(1), frames: H.frames, result: N.NS.result || '', act: N.NS.act || '' };
  }).catch((e) => ({ err: String(e) }));
}
// session 40 (owner 25 Nov: "the bot to have an elementary student understanding of language"): with KID=1 every word outside the
// Dale-Chall list (about 3,000 words known by 4th graders, from the textstat package, not copied into the repo) is drawn as ???
// in the page text and button labels while a picture is taken and the text is read; the real text is put back before the game runs.
const KID = process.env.KID === '1';
let lastOrig = null;
async function kidMask(on) { if (KID) await page.evaluate((v) => (v ? window.__kidMask() : window.__kidUnmask()), on); }
async function snap(file) { await kidMask(true); await page.screenshot({ path: file, type: 'jpeg', quality: 70 }); await kidMask(false); }
async function look(extra) {
  await freeze();
  const n = String(step).padStart(3, '0'), shot = path.join(SHOTS, n + '.jpg');
  lastOrig = KID ? await seen() : null;
  await snap(shot);
  await kidMask(true);
  const s = await seen();
  await kidMask(false);
  return Object.assign({ step, shot }, extra || {}, s);
}
// in the page: easy words as a Set; a word passes if it, or its stem (-s, -es, -ies, -ed, -ing, -er, -est, -ly, 's, n't), is on the list
const KID_PAGE = (words) => {
  const E = new Set(words);
  const has = (w) => E.has(w) || E.has(w + 'e');
  const stem = (w) => {
    if (has(w)) return true;
    const c = { "won't": 'will', "can't": 'can', "i'm": 'i' }[w]; if (c) return true;
    const ap = w.match(/^(.+?)('s|'re|'ll|'ve|'d|n't|s')$/); if (ap) return has(ap[1]);
    for (const [suf, add] of [['ies', 'y'], ['ied', 'y'], ['ier', 'y'], ['iest', 'y'], ['ily', 'y'], ['es', ''], ['s', ''], ['ed', ''], ['ing', ''], ['er', ''], ['est', ''], ['ly', '']]) {
      if (!w.endsWith(suf) || w.length - suf.length < 2) continue;
      const b = w.slice(0, -suf.length) + add;
      if (has(b)) return true;
      if (/([b-df-hj-np-tv-z])\1$/.test(b) && has(b.slice(0, -1))) return true;
    }
    return false;
  };
  const fix = (t) => t.replace(/[A-Za-z][A-Za-z']*/g, (w) => (stem(w.toLowerCase().replace(/'+$/, '')) ? w : '???'));
  window.__kidSaved = [];
  window.__kidMask = () => {
    const saved = (window.__kidSaved = []);
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.parentElement || /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) continue;
      const t = n.textContent, m = fix(t);
      if (m !== t) { saved.push([n, 'text', t]); n.textContent = m; }
    }
    for (const b of document.querySelectorAll('[aria-label]')) { const t = b.getAttribute('aria-label'), m = fix(t); if (m !== t) { saved.push([b, 'aria', t]); b.setAttribute('aria-label', m); } }
  };
  window.__kidUnmask = () => { for (const [n, k, t] of window.__kidSaved) { if (k === 'text') n.textContent = t; else n.setAttribute('aria-label', t); } window.__kidSaved = []; };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// run the game for secs of GAME time (software GL draws 1-15 fps, and the loop clamps each step to 0.05 s, so wall time would be slow motion).
// Stops early when the game stops its own loop (a card), or after WALL_CAP ms of wall time.
const WALL_CAP = 90000;
const gt = () => page.evaluate(() => (window.__hold ? window.__hold.gt : 0));
const loopOn = () => page.evaluate(() => !!(window.__night && window.__night.S.running && !window.__night.NS.paused));
async function runGame(secs) {
  await thaw();
  const g0 = await gt(), w0 = Date.now();
  let last = g0, lastMove = Date.now();
  while (Date.now() - w0 < WALL_CAP) {
    await sleep(80);
    const g = await gt();
    if (g - g0 >= secs) return;
    if (g !== last) { last = g; lastMove = Date.now(); }
    else if (Date.now() - lastMove > 1200 && !(await loopOn())) { await sleep(Math.max(0, secs * 1000 - (Date.now() - w0))); return; }
  }
}
async function run(ms) { await runGame(ms / 1000); }
async function touch(type, x, y) { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); }
const KEYS = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', space: 'Space', enter: 'Enter', esc: 'Escape', escape: 'Escape' };
const keyName = (k) => KEYS[String(k).toLowerCase()] || (String(k).length === 1 ? (/[a-z]/i.test(k) ? 'Key' + k.toUpperCase() : /[0-9]/.test(k) ? 'Digit' + k : k) : k);
async function act(c) {
  const settle = Math.max(200, Math.min(3000, (c.settle || 0.8) * 1000)), settleS = settle / 1000;
  const phone = DEV === 'phone';
  switch (c.a) {
    case 'look': return look();
    case 'note': return { step, noted: true };
    case 'wait': await run(Math.min(10, Math.max(0.2, +c.s || 1)) * 1000); return look();
    case 'click': case 'tap': {
      await thaw();
      if (phone) { await touch('touchStart', +c.x, +c.y); await sleep(60); await touch('touchEnd', +c.x, +c.y); } else await page.mouse.click(+c.x, +c.y);
      await runGame(settleS); return look();
    }
    case 'button': {
      await freeze(); await kidMask(true); const s = await seen(), want = String(c.label || '').toLowerCase(); await kidMask(false);
      const b = s.buttons.find((x) => x.label.toLowerCase() === want) || s.buttons.find((x) => x.label.toLowerCase().includes(want));
      if (!b) return look({ error: 'no button with that label on screen' });
      return act({ a: 'click', x: b.x, y: b.y, settle: c.settle });
    }
    case 'key': case 'hold': {
      if (phone) return look({ error: 'this phone has no keyboard: tap or drag on the screen' });
      const k = keyName(c.key), secs = c.a === 'hold' ? Math.min(8, Math.max(0.05, +c.s || 1)) : 0.08;
      await thaw(); await page.keyboard.down(k); if (c.a === 'hold') await runGame(secs); else await sleep(80); await page.keyboard.up(k); await runGame(settleS); return look();
    }
    case 'hold2': {
      // two keys held together (for example walk up-left), s seconds
      if (phone) return look({ error: 'this phone has no keyboard: tap or drag on the screen' });
      const k1 = keyName(c.key), k2 = keyName(c.key2), secs = Math.min(8, Math.max(0.05, +c.s || 1));
      await thaw(); await page.keyboard.down(k1); await page.keyboard.down(k2); await runGame(secs); await page.keyboard.up(k2); await page.keyboard.up(k1); await runGame(settleS); return look();
    }
    case 'drag': {
      // press at x1 y1, move to x2 y2, keep holding s seconds, let go (a thumb on a stick, or a mouse drag)
      const secs = Math.min(8, Math.max(0.05, +c.s || 1)), x1 = +c.x1, y1 = +c.y1, x2 = +c.x2, y2 = +c.y2;
      await thaw();
      if (phone) { await touch('touchStart', x1, y1); for (let i = 1; i <= 5; i++) { await sleep(30); await touch('touchMove', x1 + (x2 - x1) * i / 5, y1 + (y2 - y1) * i / 5); } await runGame(secs); await touch('touchEnd', x2, y2); }
      else { await page.mouse.move(x1, y1); await page.mouse.down(); for (let i = 1; i <= 5; i++) { await sleep(30); await page.mouse.move(x1 + (x2 - x1) * i / 5, y1 + (y2 - y1) * i / 5); } await runGame(secs); await page.mouse.up(); }
      await runGame(settleS); return look();
    }
    case 'watch': {
      // let it run s seconds (at most 4) and see 6 pictures taken at even times, in one sheet
      const secs = Math.min(4, Math.max(0.6, +c.s || 2)), n = 6, files = [];
      await thaw();
      for (let i = 0; i < n; i++) { await runGame(secs / n); await freeze(); const f = path.join(SHOTS, `${String(step).padStart(3, '0')}_w${i}.jpg`); await snap(f); files.push(f); }
      const sheet = path.join(SHOTS, `${String(step).padStart(3, '0')}_sheet.jpg`);
      execFileSync('python3', [path.join(__dirname, 'sheet.py'), sheet].concat(files));
      for (const f of files) fs.unlinkSync(f);
      const r = await look(); r.sheet = sheet; r.sheetNote = `6 pictures, left to right then top to bottom, ${(secs / n).toFixed(2)} s apart`; return r;
    }
    case 'pressafter': {
      // the game runs; after s seconds the key (desk) or a tap at x y (phone) happens; then it keeps running settle s
      const secs = Math.min(6, Math.max(0, +c.s || 0));
      await runGame(secs);
      if (phone || c.x !== undefined) { if (phone) { await touch('touchStart', +c.x, +c.y); await sleep(60); await touch('touchEnd', +c.x, +c.y); } else await page.mouse.click(+c.x, +c.y); }
      else await page.keyboard.press(keyName(c.key));
      await runGame(settleS); return look();
    }
    case 'quit': return { step, quit: true };
    // the lead's own probe (never given to a player): evaluate an expression in the page
    case 'eval': return { step, value: await page.evaluate(c.expr) };
    case 'debug': return { step, debug: await page.evaluate(() => { const N = window.__night; const c = N.chars.clown; return { room: N.S.room, ended: N.S.ended, gp: c && c.gp ? c.gp.kind : null, belong: N.NS.belong, walkEnd: N.S.endY, running: N.S.running, raf: N.S.raf, paused: N.NS.paused, hidden: document.hidden, lost: N.S.lost, mode: N.S.mode, scene: N.NS.scene, audio: N.NS.audio && N.NS.audio.state }; }), frozen };
    default: return look({ error: 'unknown command' });
  }
}
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext(DEVICES[DEV]);
  page = await ctx.newPage();
  cdp = await ctx.newCDPSession(page);
  page.on('pageerror', (e) => errors.push(String(e)));
  // the mask goes in as an init script, so it is in every load: the next night is a page reload (run 1 of session 40 lost it there)
  if (KID) {
    const list = execFileSync('python3', ['-c', 'import textstat,os;print(os.path.join(os.path.dirname(textstat.__file__),"resources","en","easy_words.txt"))']).toString().trim();
    const words = fs.readFileSync(list, 'utf8').split(/\s+/).map((w) => w.trim().toLowerCase()).filter(Boolean);
    await page.addInitScript(`(${KID_PAGE.toString()})(${JSON.stringify(words)})`);
    console.log(`kid reader: ${words.length} easy words`);
  }
  // START='n=2&m=0&s=0' opens that night with that run (the game's own run hash, as "Go on to night 2" writes it)
  await page.goto(`http://127.0.0.1:${srv.address().port}/night1.html?tester${process.env.START ? '#' + process.env.START : ''}`);
  await page.waitForFunction(() => !!window.__night, null, { timeout: 180000 });
  await sleep(2000);
  const api = http.createServer((q, r) => {
    let d = ''; q.on('data', (x) => (d += x));
    q.on('end', async () => {
      let c = {}; try { c = JSON.parse(d || '{}'); } catch (e) { c = { a: 'bad' }; }
      const t0 = Date.now();
      let res;
      lastOrig = null;
      try { res = await act(c); } catch (e) { res = { error: String(e).slice(0, 200) }; }
      const h = await hidden();
      h.fps = runMs > lastRunMs ? +(((h.frames - lastFrames) * 1000) / (runMs - lastRunMs)).toFixed(1) : null;
      LOG.write(JSON.stringify({ step, t: new Date(t0).toISOString(), cmd: c, says: c.says || '', error: res.error || '', text: res.text, buttons: res.buttons ? res.buttons.map((x) => x.label) : undefined, orig: lastOrig ? { text: lastOrig.text, buttons: lastOrig.buttons.map((x) => x.label) } : undefined, hidden: h, pageErrors: errors.splice(0) }) + '\n');
      lastFrames = h.frames || 0; lastRunMs = runMs;
      step++;
      r.writeHead(200, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(res));
      if (res.quit) setTimeout(async () => { await b.close(); process.exit(0); }, 200);
    });
  });
  api.listen(PORT, '127.0.0.1', () => console.log(`coldplay ${NAME} ${DEV} ready on ${PORT}`));
})();

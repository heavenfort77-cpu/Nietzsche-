// Probes for input release, frame errors, the fps meter and the tier start in the game page (faults F8-F11).
// Usage: node check_input_loop.cjs [game/index.html]. Runs the page's own functions in a stubbed sandbox
// (no GPU, no assets), so it runs on any runner in seconds. Needs acorn (NODE_PATH).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const acorn = require('acorn');

const FILE = process.argv[2] || path.join(__dirname, 'game', 'index.html');
const HTML = fs.readFileSync(FILE, 'utf8');
// top-level state the probed functions use; a declaration is taken whole if it declares any of these names
const STATE = ['CONFIG', 'dragX', 'dragId', 'fpsAcc', 'fpsN', 'gov', 'last', 'loopError'];

function extract(code) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  const out = [];
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration') out.push(code.slice(n.start, n.end));
    if (n.type === 'VariableDeclaration' && n.declarations.some((d) => d.id.type === 'Identifier' && STATE.includes(d.id.name))) {
      out.push(code.slice(n.start, n.end).replace(/^(const|let)\b/, 'var'));
    }
  }
  return out.join('\n');
}

function target() {
  const h = {};
  return {
    h,
    addEventListener(type, fn) { (h[type] = h[type] || []).push(fn); },
    fire(type, e) { for (const fn of h[type] || []) fn(Object.assign({ type, pointerId: 1, clientX: 0, isPrimary: true }, e)); }
  };
}

function sandbox(code) {
  const win = target(), doc = target(), canvas = target();
  const els = {};
  const counts = { matchMedia: 0, raf: 0, draw: 0, hud: 0 };
  canvas.setPointerCapture = () => {};
  canvas.releasePointerCapture = () => {};
  canvas.hasPointerCapture = () => false;
  doc.hidden = false;
  doc.getElementById = (id) => (els[id] = els[id] || Object.assign(target(), { id, textContent: '', hidden: true, value: '0' }));
  doc.querySelector = () => target();
  const ctx = {
    console, Math, Number, Object, Array, Set, Map, JSON, Error, String, URLSearchParams,
    addEventListener: win.addEventListener, document: doc, canvas,
    location: { search: '?test' }, isTest: true,
    matchMedia: () => { counts.matchMedia++; return { matches: true, addEventListener() {} }; },
    requestAnimationFrame: () => { counts.raf++; },
    view: { yaw: 0, paused: false, lost: false, fps: 0 },
    parts: { mixer: null, ao: { enabled: true } },
    hud: doc.getElementById('hud'),
    THREE: new Proxy({}, { get: () => function () { return {}; } })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  // stubs for page functions outside the probed code (rendering, effects, UI), set after the page's own declarations
  Object.assign(ctx, {
    tickEffects: () => {}, draw: () => { counts.draw++; }, drawHud: () => { counts.hud++; },
    resize: () => {}, onKey: () => {}, applyFace: () => {}, playClip: () => {}, markActive: () => {}, applyWorld: () => {}
  });
  return { ctx, win, doc, canvas, els, counts };
}

const fails = [];
let checks = 0;
function check(name, ok, detail) {
  checks++;
  if (!ok) fails.push(`${name}: ${detail}`);
}

function inputProbes(code) {
  const turn = (s) => s.ctx.view.yaw / s.ctx.CONFIG.turnPerPx;
  const fresh = () => { const s = sandbox(code); s.ctx.bindInput(); return s; };
  // interruptions that end a drag: after each, a hover move (mouse, no button) must not turn the camera
  const ends = [
    ['pointercancel', (s) => s.canvas.fire('pointercancel', {}) || s.win.fire('pointercancel', {})],
    ['lostpointercapture', (s) => s.canvas.fire('lostpointercapture', {})],
    ['tab hidden', (s) => { s.doc.hidden = true; s.doc.fire('visibilitychange', {}); s.doc.hidden = false; s.doc.fire('visibilitychange', {}); }],
    ['window blur', (s) => s.win.fire('blur', {})],
    ['pointerup', (s) => s.win.fire('pointerup', {}) || s.canvas.fire('pointerup', {})]
  ];
  for (const [name, end] of ends) {
    const s = fresh();
    s.canvas.fire('pointerdown', { clientX: 100 });
    end(s);
    s.canvas.fire('pointermove', { clientX: 300 });
    check(`S1 drag released by ${name}`, turn(s) === 0, `camera turned ${turn(s).toFixed(0)} px after the drag ended`);
  }
  // a second finger must not move the first finger's drag origin, and its moves must not turn the camera
  {
    const s = fresh();
    s.canvas.fire('pointerdown', { pointerId: 1, clientX: 100 });
    s.canvas.fire('pointerdown', { pointerId: 2, clientX: 300, isPrimary: false });
    s.canvas.fire('pointermove', { pointerId: 1, clientX: 101 });
    check('S1 second finger down keeps the first drag', turn(s) === 1, `first finger moved 1 px, camera turned ${turn(s).toFixed(0)} px`);
    const before = turn(s);
    s.canvas.fire('pointermove', { pointerId: 2, clientX: 350, isPrimary: false });
    check('S1 second finger move ignored', turn(s) === before, `second finger turned the camera ${(turn(s) - before).toFixed(0)} px`);
    s.win.fire('pointerup', { pointerId: 2, isPrimary: false }); s.canvas.fire('pointerup', { pointerId: 2, isPrimary: false });
    s.canvas.fire('pointermove', { pointerId: 1, clientX: 111 });
    check('S1 second finger up keeps the first drag', turn(s) === before + 10, `first finger moved 10 px after the second lifted, camera turned ${(turn(s) - before).toFixed(0)} px`);
  }
}

function loopProbes(code) {
  // an error inside the frame body: caught, shown once, loop still scheduled, body not re-run every frame
  {
    const s = sandbox(code);
    let thrown = 0;
    s.ctx.tickEffects = () => { thrown++; throw new Error('probe boom'); };
    let escaped = null;
    for (let i = 1; i <= 5; i++) { try { s.ctx.frame(i * 16); } catch (e) { escaped = e; } }
    check('S2 frame error does not escape the loop', !escaped, `frame() threw "${escaped && escaped.message}"`);
    check('S2 frame error schedules the next frame first', s.counts.raf === 5, `requestAnimationFrame called ${s.counts.raf} of 5 times`);
    const shown = Object.values(s.els).some((e) => /probe boom/.test(e.textContent) && e.hidden === false);
    check('S2 frame error shown on screen', shown, 'no visible element shows the error');
    check('S2 frame error not repeated every frame', thrown === 1, `the failing body ran ${thrown} times in 5 frames`);
  }
  // errors outside the frame (resize, context restore, the load promise): shown on screen too
  for (const [type, e] of [['error', { error: new Error('probe late') }], ['unhandledrejection', { reason: new Error('probe late') }]]) {
    const s = sandbox(code);
    if (typeof s.ctx.bindErrors === 'function') s.ctx.bindErrors();
    s.win.fire(type, e);
    const shown = Object.values(s.els).some((el) => /probe late/.test(el.textContent) && el.hidden === false);
    check(`S2 ${type} outside the frame shown on screen`, shown, 'no visible element shows the error');
  }
  // fps meter: the first frame and the first frame after a hidden tab must not count their gap
  const runFps = (s, t0, n) => { for (let i = 0; i < n; i++) s.ctx.frame(t0 + i * 1000 / 60); return t0 + n * 1000 / 60; };
  {
    const s = sandbox(code);
    runFps(s, 2000, 1);
    const first = s.ctx.view.fps;
    runFps(s, 2000 + 1000 / 60, 40);
    check('S4 first frame not counted', first === 0 || (first > 50 && first < 70), `first reading ${first.toFixed(2)} fps (page open 2 s before the loop)`);
    check('S4 steady reading', s.ctx.view.fps > 50 && s.ctx.view.fps < 70, `reading ${s.ctx.view.fps.toFixed(2)} fps at a steady 60`);
  }
  {
    const s = sandbox(code);
    s.ctx.bindInput();
    let t = runFps(s, 1000, 45);
    s.doc.hidden = true; s.doc.fire('visibilitychange', {});
    t += 5000;
    s.doc.hidden = false; s.doc.fire('visibilitychange', {});
    runFps(s, t, 31);
    check('S4 hidden-tab gap not counted', s.ctx.view.fps > 50 && s.ctx.view.fps < 70, `reading ${s.ctx.view.fps.toFixed(2)} fps after a 5 s hidden tab at a steady 60`);
  }
}

function tierProbe(code) {
  // rule 31: the tier is picked by measured frame time (the governor), never by input type
  const s = sandbox(code);
  s.counts.matchMedia = 0;
  s.ctx.govInit();
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  const gi = ast.body.find((n) => n.type === 'FunctionDeclaration' && n.id.name === 'govInit');
  const src = gi ? code.slice(gi.start, gi.end) : '';
  check('S3 tier start not picked by input type', s.counts.matchMedia === 0 && !/pointer|touch|hover/i.test(src),
    `govInit calls matchMedia ${s.counts.matchMedia} time(s) and reads the input type`);
}

function suite(html) {
  fails.length = 0; checks = 0;
  const code = extract(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]);
  inputProbes(code);
  loopProbes(code);
  tierProbe(code);
  return fails.slice();
}

// each mutation puts one fault back; the suite must fail on it
const MUTATIONS = [
  ['S1 cancelled touch keeps the drag', "  addEventListener('pointercancel', endDragOf);\n", ''],
  ['S1 lost capture keeps the drag', "  canvas.addEventListener('lostpointercapture', endDragOf);\n", ''],
  ['S1 hidden tab keeps the drag', '  if (document.hidden) endDrag(); else last = 0;', '  if (!document.hidden) last = 0;'],
  ['S1 second finger takes over the drag', 'if (dragId !== -1) return; dragId = e.pointerId;', 'dragId = e.pointerId;'],
  ['S1 moves of any pointer turn the camera', 'if (e.pointerId !== dragId) return; view.yaw', 'if (dragX === null) return; view.yaw'],
  ['S2 no catch in the frame', '  try { frameBody(now); } catch (e) { showError(e); }', '  frameBody(now);'],
  ['S2 failing body re-run every frame', '  if (loopError) return;\n  try', '  try'],
  ['S2 no listener for errors outside the frame', "  addEventListener('error', (e) => showError(e.error || e.message));\n", ''],
  ['S2 no listener for rejected promises', "  addEventListener('unhandledrejection', (e) => showError(e.reason));\n", ''],
  ['S4 first frame counts the page-open time', '  const raw = last ? (now - last) / 1000 : 0;', '  const raw = (now - last) / 1000 || 0;'],
  ['S4 hidden-tab gap counted', '  if (document.hidden) endDrag(); else last = 0;', '  if (document.hidden) endDrag();'],
  ['S3 tier start by input type', '  gov.level = CONFIG.dprStart; gov.cap = 0;', "  gov.level = matchMedia('(pointer: coarse)').matches ? 1 : CONFIG.dprStart; gov.cap = 0;"]
];

const base = suite(HTML);
const baseChecks = checks;
for (const f of base) console.log('FAIL  ' + f);
console.log(`CHECKS ${baseChecks - base.length} of ${baseChecks} pass`);
let fired = 0;
for (const [name, a, b] of MUTATIONS) {
  if (!HTML.includes(a)) { console.log(`FAIL  mutation "${name}": target text not found`); continue; }
  let r;
  try { r = suite(HTML.replace(a, b)); } catch (e) { r = ['crashed ' + e.message]; }
  if (r.length) fired++; else console.log(`FAIL  mutation "${name}" did not make the suite fail`);
}
console.log(`MUTATIONS ${fired} of ${MUTATIONS.length} caught`);
const pass = base.length === 0 && fired === MUTATIONS.length;
console.log('RESULT ' + (pass ? 'PASS' : 'FAIL'));
process.exit(pass ? 0 : 1);

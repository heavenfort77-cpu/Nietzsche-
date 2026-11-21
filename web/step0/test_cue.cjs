// Step 0 checks for web/step0/cue.html. Usage: node test_cue.cjs [cue.html]
// Runs the game script in a node vm with a stub DOM and a virtual clock (no waiting, fastest speed).
// 1. Per-frame/per-event gate: no allocation, DOM lookups or unguarded DOM writes in hot functions.
// 2. Bot sweep: nights 1-3, desktop and phone windows, seven bots, invariants checked every 5 ms.
// 3. Mutations: each breaks one rule in a copy of the game; the suite must FAIL on every one.
// Prints PASS/FAIL lines only for failures, then a coverage line N of N. Exit 1 on any failure.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
function need(name) {
  const tries = [name, '/opt/npm-tools/node_modules/' + name, path.join(__dirname, '..', 'node_modules', name)];
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error('Missing ' + name); process.exit(2);
}
const acorn = need('acorn');
const walk = need('acorn-walk');

const FILE = process.argv[2] || path.join(__dirname, 'cue.html');
const SRC = fs.readFileSync(FILE, 'utf8');
const scriptOf = (html) => html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---------- 1. per-frame gate ----------
const HOT = ['loop', 'frame', 'syncClock', 'updateAct', 'expireBeats', 'updateConfetti', 'render', 'drawClown', 'clownTilt',
  'drawCue', 'drawRings', 'drawRing', 'drawMaskShapes', 'diamond', 'drawConfetti', 'drawCrowd',
  'drawFeedback', 'writeHud', 'actNow', 'onKeyDown', 'onPadDown', 'onPadUp', 'eventActTime', 'pressAt', 'nearestBeat',
  'judgeTake', 'judgeHit', 'flipGrin', 'missBeat', 'addLaughs', 'feedback', 'burstConfetti', 'endAct', 'stopScheduled',
  'winGood', 'winPerfect', 'rand', 'usePageClock'];
function hotGate(code) {
  const fails = [];
  const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
  const found = new Set();
  walk.ancestor(ast, {
    FunctionDeclaration(fn) {
      const name = fn.id.name;
      if (!HOT.includes(name)) return;
      found.add(name);
      walk.ancestor(fn.body, {
        NewExpression(n) { fails.push(`new ${n.callee.name || '?'} in ${name} line ${n.loc.start.line}`); },
        ObjectExpression(n) { fails.push(`object literal in ${name} line ${n.loc.start.line}`); },
        ArrayExpression(n) { fails.push(`array literal in ${name} line ${n.loc.start.line}`); },
        ArrowFunctionExpression(n) { fails.push(`closure in ${name} line ${n.loc.start.line}`); },
        FunctionExpression(n) { fails.push(`closure in ${name} line ${n.loc.start.line}`); },
        TemplateLiteral(n) { fails.push(`template string in ${name} line ${n.loc.start.line}`); },
        CallExpression(n) {
          const p = n.callee.property && n.callee.property.name;
          if (/^(getElementById|querySelector|querySelectorAll|getElementsBy\w+|matchMedia|getComputedStyle|getBoundingClientRect)$/.test(p)) fails.push(`lookup ${p} in ${name} line ${n.loc.start.line}`);
          if (/^create\w+$/.test(p) || /^(map|filter|concat|slice|splice|sort|forEach|reduce)$/.test(p)) fails.push(`${p}() in ${name} line ${n.loc.start.line}`);
        },
        BinaryExpression(n) {
          const isStr = (x) => x.type === 'Literal' && typeof x.value === 'string';
          if (n.operator === '+' && (isStr(n.left) || isStr(n.right))) fails.push(`string building in ${name} line ${n.loc.start.line}`);
        },
        AssignmentExpression(n, anc) {
          const t = n.left;
          const prop = t.type === 'MemberExpression' && t.property && t.property.name;
          if (/^(textContent|innerHTML|innerText|className)$/.test(prop) && !anc.some((a) => a.type === 'IfStatement')) fails.push(`unguarded DOM write ${prop} in ${name} line ${n.loc.start.line}`);
        }
      });
    }
  });
  for (const h of HOT) if (!found.has(h)) fails.push(`hot function ${h} not found (update the HOT list)`);
  return fails;
}

// ---------- stub DOM ----------
function stubEl(id) {
  const cls = new Set(['hidden']);
  return {
    id, width: 0, height: 0, children: [], dataset: {}, style: {}, writes: 0, _t: '',
    get textContent() { return this._t; }, set textContent(v) { this._t = v; this.writes++; },
    classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, on) => (on === undefined ? (cls.has(c) ? cls.delete(c) : cls.add(c)) : on ? cls.add(c) : cls.delete(c)), contains: (c) => cls.has(c) },
    addEventListener() {},
    getContext() {
      const grad = { addColorStop() {} };
      return new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => grad : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
    }
  };
}
function makeGame(code, size) {
  const els = {}, handlers = {}, clock = { now: 0, raf: null };
  const on = (k, f) => { handlers[k] = f; };
  const document = { hidden: false, activeElement: null, getElementById: (id) => (els[id] = els[id] || stubEl(id)), addEventListener: on };
  const window = {
    innerWidth: size ? size[0] : 1280, innerHeight: size ? size[1] : 800, devicePixelRatio: 1, addEventListener: on,
    matchMedia: () => ({ matches: false })
  };
  const ctx = { window, document, navigator: {}, performance: { now: () => clock.now }, requestAnimationFrame: (f) => { clock.raf = f; return 1; }, Math, Number, String, Object, Float32Array, Uint8Array, console };
  window.window = window;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'cue.js' });
  return { G: window.__game, els, handlers, clock, document };
}

// ---------- 2. bots ----------
const STEP = 5;
function pressPlan(beats, bot, G, phone) {
  const plan = [];
  const lastPerChain = {};
  beats.forEach((b, i) => { lastPerChain[b.chain] = i; });
  beats.forEach((b, i) => {
    const kindBtn = b.kind === G.TAKE ? G.TAKE : G.HIT;
    if (bot === 'perfect') plan.push([b.fit, kindBtn]);
    if (bot === 'good') plan.push([b.fit + (phone ? 140 : 100), kindBtn]);
    if (bot === 'late') plan.push([b.fit + 220, kindBtn]);
    if (bot === 'flip') plan.push([b.fit, b.topper ? G.TAKE : kindBtn]);
    if (bot === 'latency') plan.push([b.fit + 50, kindBtn]);
    if (bot === 'takeonly') plan.push([b.fit, G.TAKE]);
  });
  if (bot === 'masher') for (let t = 0; t < beats[beats.length - 1].fit + 500; t += 30) plan.push([t, G.HIT]);
  return plan.sort((a, b) => a[0] - b[0]);
}
function runBot(code, night, phone, bot) {
  const { G } = makeGame(code);
  const C = G.config;
  G.useVirtual(phone);
  if (bot === 'latency') G.setLatency(50);
  G.start(night);
  const beats0 = G.beats();
  const plan = pressPlan(beats0, bot, G, phone);
  const inv = [];
  let pi = 0, endedAt = -1;
  const tEnd = G.info().lastFit + 4000;
  for (let t = 0; t <= tEnd; t += STEP) {
    while (pi < plan.length && plan[pi][0] <= t) { G.input(plan[pi][1], plan[pi][0]); pi++; }
    G.advance(t);
    const bs = G.beats(), info = G.info();
    const visible = bs.filter((b) => b.spawn <= t && b.state === 0).length;
    if (visible > 2) inv.push(`t=${t} rings on screen ${visible} (max 2)`);
    bs.forEach((b, i) => { if (b.judged > 1) inv.push(`t=${t} beat ${i} judged ${b.judged} times`); });
    if (info.laughs < 0) inv.push(`t=${t} laughs ${info.laughs}`);
    if (info.misses > C.missesToEnd) inv.push(`t=${t} misses ${info.misses} > ${C.missesToEnd}`);
    if (info.ended && endedAt < 0) endedAt = t;
    if (inv.length) break;
  }
  return { info: G.info(), beats: G.beats(), inv, C };
}
function expect(name, r, night, phone, bot) {
  const i = r.info, C = r.C, fails = [];
  const timing = i.beatCount - i.takeBeats;
  const toppers = r.beats.filter((b) => b.topper).length;
  const ok = (cond, msg) => { if (!cond) fails.push(msg); };
  ok(i.scene === 'results', `results panel not shown (scene ${i.scene})`);
  if (bot === 'perfect' || bot === 'latency') {
    ok(i.endReason === 'complete', `end ${i.endReason}`);
    ok(i.perfects === timing && i.misses === 0, `perfects ${i.perfects}/${timing} misses ${i.misses}`);
    ok(i.takes === i.takeBeats, `takes ${i.takes}/${i.takeBeats}`);
    ok(i.actLaughs === timing * C.laughsPerfect + i.takeBeats * C.laughsTake, `laughs ${i.actLaughs}`);
    ok(i.mask === timing * C.paintPerPerfect, `mask ${i.mask}`);
  }
  if (bot === 'good') {
    ok(i.endReason === 'complete', `end ${i.endReason}`);
    ok(i.goods === timing && i.perfects === 0, `goods ${i.goods}/${timing} perfects ${i.perfects}`);
  }
  if (bot === 'late' || bot === 'masher') {
    ok(i.endReason === 'two misses' || (night >= C.secondButtonFromNight && i.endReason === 'the slap landed'), `end ${i.endReason}`);
    ok(i.perfects === 0 && i.goods === 0, `hits ${i.perfects + i.goods}`);
    ok(i.actLaughs === C.laughsFloor, `floor laughs ${i.actLaughs} (want ${C.laughsFloor})`);
  }
  if (bot === 'idle') {
    ok(i.endReason === 'two misses' || (night >= C.secondButtonFromNight && i.endReason === 'the slap landed'), `end ${i.endReason}`);
    ok(i.actLaughs === C.laughsFloor, `floor laughs ${i.actLaughs}`);
  }
  if (bot === 'flip') {
    ok(i.endReason === 'complete', `end ${i.endReason}`);
    ok(i.flips === toppers, `flips ${i.flips}/${toppers}`);
    const want = timing * C.laughsPerfect + i.takeBeats * C.laughsTake + C.laughsFlipFirst + (toppers - 1) * C.laughsFlipRepeat;
    ok(i.actLaughs === want, `laughs ${i.actLaughs} (want ${want})`);
  }
  if (bot === 'takeonly') {
    ok(i.perfects === 0 && i.goods === 0 && i.endReason === 'two misses', `end ${i.endReason}`);
    const good = C.goodMs[phone ? 1 : 0];
    ok(i.endAt >= r.beats[1].fit + good, `night 1 take was judged: act ended at ${i.endAt}, timeout is ${r.beats[1].fit + good}`);
  }
  if (night >= C.secondButtonFromNight) ok(i.takeBeats === C.interruptsPerAct[Math.min(night, 3) - 1], `interrupts ${i.takeBeats}`);
  return r.inv.concat(fails).map((f) => `${name}: ${f}`);
}
// ---------- wide probes (owner requirement 5) ----------
// Layout at every target screen: ring start inside the screen, cue clear of HUD and pads, whiteface hat on screen.
const SIZES = [[1280, 800, false], [1920, 1080, false], [2560, 1080, false], [390, 844, true], [844, 390, true], [360, 640, true], [768, 1024, true]];
function layoutGate(code) {
  const fails = [];
  for (const [w, h, phone] of SIZES) {
    const { G } = makeGame(code, [w, h]);
    G.useVirtual(phone);
    const i = G.info(), tag = `layout ${w}x${h}`;
    const padW = Math.min(180, Math.max(96, 0.3 * w)), padTop = h - 18 - 96;
    const pads = [[18, 18 + padW], [w - 18 - padW, w - 18]];
    const hitsPad = (x0, x1, y0, y1) => pads.some(([a, b]) => x0 < b && x1 > a && y1 > padTop && y0 < h - 18);
    if (i.cx - i.R0 < -1 || i.cy - i.R0 < -1 || i.cx + i.R0 > w + 1 || i.cy + i.R0 > h + 1) fails.push(`${tag}: ring start r ${i.R0.toFixed(0)} at (${i.cx.toFixed(0)},${i.cy.toFixed(0)}) leaves the screen`);
    if (i.R0 < i.R * 1.3) fails.push(`${tag}: ring start r ${i.R0.toFixed(0)} < 1.3 x cue ${i.R.toFixed(0)}`);
    if (i.cy - i.R < 40) fails.push(`${tag}: cue top ${(i.cy - i.R).toFixed(0)} under the HUD (40)`);
    if (i.cy - 2 * i.R < 0) fails.push(`${tag}: whiteface hat top ${(i.cy - 2 * i.R).toFixed(0)} off screen at fit`);
    if (hitsPad(i.cx - i.R, i.cx + i.R, i.cy - i.R, i.cy + i.R)) fails.push(`${tag}: cue overlaps a pad`);
    if (hitsPad(i.cx - 0.9 * i.R, i.cx + 0.9 * i.R, i.cy + 1.15 * i.R, i.cy + 1.5 * i.R)) fails.push(`${tag}: result word overlaps a pad`);
  }
  return fails;
}
// Cue direction (owner, 21 Nov: "ring to a mask, not mask to ring"): the mask stays fixed at the cue size on his face,
// the ring starts at the ring start radius and closes onto the mask's edge at the fit moment. Desktop and phone.
function cueDirectionGate(code) {
  const fails = [];
  for (const [w, h, phone] of [[1280, 800, false], [390, 844, true]]) {
    const { G } = makeGame(code, [w, h]);
    G.useVirtual(phone);
    G.start(1);
    const b = G.beats()[0], tag = `cue ${w}x${h}`;
    for (const [frac, want] of [[0, 'R0'], [0.5, 'mid'], [1, 'R']]) {
      G.advance(Math.round(b.spawn + (b.fit - b.spawn) * frac) + (frac === 0 ? 1 : 0));
      const i = G.info();
      if (Math.abs(i.maskR - i.R) > 0.5) fails.push(`${tag} ${want}: mask r ${i.maskR.toFixed(1)} != cue ${i.R.toFixed(1)}`);
      if (want === 'R0' && Math.abs(i.ringR - i.R0) > i.R0 * 0.02) fails.push(`${tag}: ring at spawn r ${i.ringR.toFixed(1)}, want start ${i.R0.toFixed(1)}`);
      if (want === 'mid' && !(i.ringR > i.R + 1 && i.ringR < i.R0 - 1)) fails.push(`${tag}: ring half-way r ${i.ringR.toFixed(1)} not between ${i.R.toFixed(1)} and ${i.R0.toFixed(1)}`);
      if (want === 'R' && Math.abs(i.ringR - i.R) > 1) fails.push(`${tag}: ring at fit r ${i.ringR.toFixed(1)}, want mask edge ${i.R.toFixed(1)}`);
    }
  }
  return fails;
}
// Every function a hot function calls is hot-checked too, or listed cold with a reason.
const COLD_OK = { playSound: 'one-shot source, allowed', showResults: 'once per act', resultsText: 'once per act', showError: 'error path', stopScheduled: 'hot-checked' };
function callGraphGate(code) {
  const fails = [];
  const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
  const declared = new Set();
  walk.simple(ast, { FunctionDeclaration(f) { declared.add(f.id.name); } });
  walk.simple(ast, {
    FunctionDeclaration(fn) {
      if (!HOT.includes(fn.id.name)) return;
      walk.simple(fn.body, { CallExpression(c) {
        const nm = c.callee.type === 'Identifier' && c.callee.name;
        if (nm && declared.has(nm) && !HOT.includes(nm) && !(nm in COLD_OK)) fails.push(`hot ${fn.id.name} calls ${nm}, which is not hot-checked`);
      } });
    }
  });
  return fails;
}
// A second act in the same page plays exactly like a fresh page; nothing moves after an act ends.
function sameRunProbe(code) {
  const fails = [];
  for (const night of [1, 2, 3]) {
    const fresh = runBot(code, night, false, 'perfect').info;
    const { G } = makeGame(code);
    G.useVirtual(false);
    G.start(night);
    let t = 0;
    for (; t < 20000 && !G.info().ended; t += STEP) { if (t === 2400) burstThenFail(G, t); G.advance(t); }
    const frozen = JSON.stringify([G.info().laughs, G.info().misses, G.beats().map((b) => b.state + b.result)]);
    for (let k = 0; k < 40; k++) { G.input(k % 2, t + k * 37); G.advance(t + k * 37); }
    const after = JSON.stringify([G.info().laughs, G.info().misses, G.beats().map((b) => b.state + b.result)]);
    if (frozen !== after) fails.push(`night ${night}: state changed after the act ended`);
    while (G.info().scene !== 'results' && t < 40000) { t += STEP; G.advance(t); }
    const laughs0 = G.info().laughs, mask0 = G.info().mask;
    G.start(night);
    G.advance(0);
    if (G.info().confettiAlive) fails.push(`night ${night}: ${G.info().confettiAlive} confetti still alive at the start of the next act`);
    const plan = pressPlan(G.beats(), 'perfect', G, false);
    let pi = 0;
    for (t = 0; t <= G.info().lastFit + 4000; t += STEP) {
      while (pi < plan.length && plan[pi][0] <= t) { G.input(plan[pi][1], plan[pi][0]); pi++; }
      G.advance(t);
    }
    const i = G.info();
    const same = i.endReason === fresh.endReason && i.perfects === fresh.perfects && i.actLaughs === fresh.actLaughs &&
      i.laughs - laughs0 === fresh.laughs && i.mask - mask0 === fresh.mask && i.takes === fresh.takes;
    if (!same) fails.push(`night ${night}: second act differs from a fresh page (${i.endReason} ${i.perfects}p ${i.actLaughs}L vs ${fresh.endReason} ${fresh.perfects}p ${fresh.actLaughs}L)`);
  }
  return fails;
}
function burstThenFail(G, t) { G.input(G.HIT, G.beats()[0].fit); }
// Without an audio clock (no Web Audio, or a context that never runs) the act still runs, and pauses while hidden.
function noAudioClockProbe(code) {
  const fails = [];
  const { G, handlers, clock, document } = makeGame(code);
  const frameAt = (ms) => { clock.now = ms; clock.raf(ms); };
  handlers.resize && handlers.resize();
  G.start(1);
  frameAt(16);
  const firstFit = G.beats()[0].fit;
  frameAt(firstFit - 300);
  document.hidden = true; handlers.visibilitychange();
  for (let k = 1; k <= 30; k++) frameAt(firstFit - 300 + k * 2000);
  document.hidden = false; handlers.visibilitychange();
  const back = clock.now;
  frameAt(back + 16);
  if (G.info().misses !== 0) fails.push(`no audio: ${G.info().misses} misses counted while the tab was hidden 60 s`);
  for (let ms = back + 32; ms < back + 40000 && G.info().scene !== 'results'; ms += 16) frameAt(ms);
  if (G.info().scene !== 'results') fails.push(`no audio: act never reached results (act clock frozen at ${G.info().misses} misses)`);
  return fails;
}
function suite(html) {
  const code = scriptOf(html);
  const out = { checks: 0, fails: [] };
  const add = (list) => { out.checks++; out.fails.push(...list); };
  add(hotGate(code));
  add(layoutGate(code));
  add(cueDirectionGate(code));
  add(callGraphGate(code));
  add(sameRunProbe(code));
  add(noAudioClockProbe(code));
  for (const night of [1, 2, 3]) {
    for (const phone of [false, true]) {
      const bots = ['perfect', 'good', 'late', 'idle', 'masher', 'latency'];
      if (night >= 2) bots.push('flip'); else bots.push('takeonly');
      for (const bot of bots) {
        const name = `night ${night} ${phone ? 'phone' : 'desktop'} ${bot}`;
        let r;
        try { r = runBot(code, night, phone, bot); } catch (e) { add([`${name}: crashed ${e.message}`]); continue; }
        add(expect(name, r, night, phone, bot));
      }
    }
  }
  return out;
}

// ---------- 3. mutations ----------
const MUTATIONS = [
  ['used-up ring rule removed', '    if (b.state !== PENDING) return;\n    b.state = DONE; b.judged++;', '    b.state = DONE; b.judged++;'],
  ['perfect window widened', 'perfectMs: [60, 80]', 'perfectMs: [200, 200]'],
  ['two-miss rule removed', 'if (S.misses >= CONFIG.missesToEnd) endAct', 'if (false) endAct'],
  ['late rings linger', 'const limit = b.kind === TAKE ? CONFIG.takeMs : winGood();', 'const limit = winGood() * 4;'],
  ['flip groan removed', 'if (!S.flipUsed[S.night]) {', 'if (true) {'],
  ['laughs floor removed', 'if (S.actLaughs < CONFIG.laughsFloor)', 'if (false)'],
  ['night 1 take not ignored', 'if (btn === TAKE && S.night < CONFIG.secondButtonFromNight) return;', ''],
  ['ring start sized from the screen, not the face position (batch 2 fault)', 'Math.min(view.cx, view.cy, w - view.cx, h - view.cy) * CONFIG.ringStartFrac', 'Math.min(w, h) * 0.48'],
  ['old cue: mask closes onto the face', '      drawRing(view.cx, view.cy, r, first ? 1 : 0.35, b.kind);', '      drawRing(view.cx, view.cy, view.R, first ? 1 : 0.35, b.kind); view.maskR = r;'],
  ['ring fixed, does not close', 'const r = view.R + (view.R0 - view.R) * (1 - p) - Math.min(view.R * 0.2, over * 0.6);', 'const r = view.R0;'],
  ['no page clock without audio', 'return performance.now() - S.actStartPerf;', 'return S.vclock;'],
  ['hidden time counted', 'if (!document.hidden && S.paused) S.actStartPerf += now - S.hiddenAt;', ''],
  ['new helper called per frame but not hot-checked', '  function drawCrowd(t) {\n', '  function crowdHelper() { return { a: 1 }; }\n  function drawCrowd(t) {\n    crowdHelper();\n'],
  ['allocation in draw', '  function drawCrowd(t) {\n', '  function drawCrowd(t) {\n    const tmp = { t: t };\n'],
  ['DOM lookup per frame', '  function writeHud() {\n', '  function writeHud() {\n    document.getElementById(\'hudMask\');\n'],
  ['unguarded HUD write', '  function writeHud() {\n', '  function writeHud() {\n    el.hudMask.textContent = S.mask;\n']
];

const base = suite(SRC);
for (const f of base.fails) console.log('FAIL  ' + f);
console.log(`CHECKS ${base.checks - new Set(base.fails.map((f) => f.split(':')[0])).size} of ${base.checks} pass`);
let mutFired = 0;
for (const [name, a, b] of MUTATIONS) {
  if (!SRC.includes(a)) { console.log(`FAIL  mutation "${name}": target text not found`); continue; }
  const r = suite(SRC.replace(a, b));
  if (r.fails.length) mutFired++; else console.log(`FAIL  mutation "${name}" did not make the suite fail`);
}
console.log(`MUTATIONS ${mutFired} of ${MUTATIONS.length} caught`);
const pass = base.fails.length === 0 && mutFired === MUTATIONS.length;
console.log('RESULT ' + (pass ? 'PASS' : 'FAIL'));
process.exit(pass ? 0 : 1);

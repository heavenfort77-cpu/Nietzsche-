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
  'drawCue', 'drawMasks', 'drawMask', 'drawMaskShapes', 'drawWhitefaceShapes', 'diamond', 'drawConfetti', 'drawCrowd',
  'drawFeedback', 'writeHud', 'actNow', 'onKeyDown', 'onPadDown', 'onPadUp', 'eventActTime', 'pressAt', 'nearestBeat',
  'judgeTake', 'judgeHit', 'flipGrin', 'missBeat', 'addLaughs', 'feedback', 'burstConfetti', 'endAct', 'stopScheduled'];
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
function makeGame(code) {
  const els = {};
  const document = { hidden: false, getElementById: (id) => (els[id] = els[id] || stubEl(id)), addEventListener() {} };
  const window = {
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener() {},
    matchMedia: () => ({ matches: false })
  };
  const ctx = { window, document, navigator: {}, performance: { now: () => 0 }, requestAnimationFrame: () => 0, Math, Number, String, Object, Float32Array, Uint8Array, console };
  window.window = window;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'cue.js' });
  return { G: window.__game, els };
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
    if (visible > 2) inv.push(`t=${t} masks on screen ${visible} (max 2)`);
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
function suite(html) {
  const code = scriptOf(html);
  const out = { checks: 0, fails: [] };
  const add = (list) => { out.checks++; out.fails.push(...list); };
  add(hotGate(code));
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
  ['used-up mask rule removed', '    if (b.state !== PENDING) return;\n    b.state = DONE; b.judged++;', '    b.state = DONE; b.judged++;'],
  ['perfect window widened', 'perfectMs: [60, 80]', 'perfectMs: [200, 200]'],
  ['two-miss rule removed', 'if (S.misses >= CONFIG.missesToEnd) endAct', 'if (false) endAct'],
  ['late masks linger', 'const limit = b.kind === TAKE ? CONFIG.takeMs : winGood();', 'const limit = winGood() * 4;'],
  ['flip groan removed', 'if (!S.flipUsed[S.night]) {', 'if (true) {'],
  ['laughs floor removed', 'if (S.actLaughs < CONFIG.laughsFloor)', 'if (false)'],
  ['night 1 take not ignored', 'if (btn === TAKE && S.night < CONFIG.secondButtonFromNight) return;', ''],
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

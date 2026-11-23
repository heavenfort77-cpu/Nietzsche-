// One pass through night1.html in GDD order (desktop 1280x720, phone 390x844): page errors, each scene reached, a few frames.
// Needs web/step0/cube25d/setup.sh first. Usage: node web/step0/smoke_night1.cjs [out dir]; ONLY=desk|phone; CHROME=<path>; N_AT=out|in|both overrides N1.nietzscheAt.
// MUTATE=<name> serves a page with one feature broken (see MUTS); the matching step must FAIL.
// UNTIL=<text> (mutation runs only): stop each screen after the first step whose name contains <text>; the full smoke never sets it.
// Screens: desk 1280x720, phone 390x844, land 844x390 (land plays the Mirror World as a loss to cover the small win's loss branch).
// Ends with RESULT night1 smoke <passed> of <steps> pass.
// Waits are on game state (software GL runs about 9 fps and frame time is capped at 0.05 s, so game time runs slower than wall time).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname, OUT = process.argv[2] || '/tmp/night1';
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg' };
const MUTS = {
  hurt: ['night1.html', 'hurtPays: true,', 'hurtPays: false,'],
  learn: ['night1.html', 'performerLearns: true,', 'performerLearns: false,'],
  endtext: ['night1.html', "endKnows: 'The shame of living:',", "endKnows: 'The Performer now knows:',"],
  fallsound: ['night1.html', 'if (!NS.cue.contentWindow.__cueOpts) NS.cue.contentWindow.__cueOpts = { hurt: N1.hurtPays };', ''],
  lean: ['model_layer.js', 'parts.root.rotation.x = -pose.tilt * CFG.leanBack;', 'parts.root.rotation.z = -pose.tilt;'],
  smallwin: ['night1.html', 'smallWin: true,', 'smallWin: false,'],
  climb: ['night1.html', "if (b.result === 'miss') c.push(Math.min(1, sc / N1.climbBeats));", "if (b.result === 'miss') c.push(1);"],
  triplabel: ['night1.html', "verbText: 'Trip',", "verbText: 'Trip (on purpose)',"],
  laughreal: ['night1.html', 'laughReal: true,', 'laughReal: false,'],
  whisperfeed: ['night1.html', "if (f.kind === 'whisper') { f.hp += falls * N1.whisperFeed.hp;", "if (f.kind === 'whisper') {"],
  host: ['night1.html', "NS.cue.src = 'cue_model.html?host=night1' + (N1.actShow ? '&byact=1' : '')", "NS.cue.src = 'cue_model.html?x=1' + (N1.actShow ? '&byact=1' : '')"],
  jokes: ['night1.html', 'corridorJokes: true,', 'corridorJokes: false,'],
  mergekept: ['night1.html', 'mergeKept: true,', 'mergeKept: false,'],
  endbrief: ['night1.html', 'endBrief: true,', 'endBrief: false,'],
  // the act at the zoom-out (session 17, PANEL-act-price.md): each mutation must FAIL its own act step
  actshow: ['night1.html', 'actShow: true,', 'actShow: false,'],
  actpx: ['night1.html', 'actPx: 62,', 'actPx: 90,'],
  actcalls: ['night1.html', '  actScene.add(actObj.crowd);', '  actScene.add(actObj.crowd); for (let i = 0; i < 160; i++) actScene.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), actObj.lit[0].m));'],
  actloop: ['night1.html', '  S.running = false;\n  openCue();', '  openCue();'],
  actsegs: ['night1.html', "  for (const g of by) if (g) segs.push(g.m ? 'miss' : g.g ? 'good' : 'perfect');", ''],
  actexcite: ['night1.html', 'exciteMiss: 1.0,', 'exciteMiss: 0.5,'],
  acthold: ['night1.html', "  A.face = 'sad'; A.excite = 0; A.clip = 'idle';", "  A.excite = 0; A.clip = 'idle';"],
  actskip: ['night1.html', "  setScene('act'); S.mode = 'act';\n  el.actSkip.classList.toggle('hidden', !NS.actSeen);", "  setScene('act'); S.mode = 'act';\n  el.actSkip.classList.add('hidden');"],
  tapskip: ['night1.html', "  if (NS.scene === 'small') { smallPress(); return true; }\n  if (S.mode === 'act') return true;", "  if (NS.scene === 'small') { smallPress(); return true; }\n  if (S.mode === 'act') { actSkip(); return true; }"],
  actslump: ['night1.html', 'slumpMax: { tempo: 0.78, chest: 15,', 'slumpMax: { tempo: 0.78, chest: 6,'],
  // owner's answers 22 Nov 15:58 (panel B, C, D, E; session 17 batch 2)
  mwtempo: ['night1.html', 'mwTempo: 2.3,', 'mwTempo: 1.6,'],
  lightgrow: ['night1.html', 'lightGrow: 0.15,', 'lightGrow: 0,'],
  lighttell: ['night1.html', 'lightTell: 0.4,', 'lightTell: 0,'],
  oneb: ['night1.html', 'oneBubble: true,', 'oneBubble: false,'],
  walkout: ['night1.html', 'moodOut: { tempo: 1.6,', 'moodOut: { tempo: 1.18,'],
  cablewings: ['night1.html', 'cableY: 11.3,', 'cableY: 7.95,'],
  backend: ['night1.html', 'backEndY: 8.4,', 'backEndY: 2.5,'],
  boardwall: ['night1.html', 'boardWall: true,', 'boardWall: false,'],
  mwroute: ['night1.html', 'mwRoute: true,', 'mwRoute: false,'],
  unworld: ['night1.html', 'warpMask: 0.32,', 'warpMask: 0,'],
  // owner's phone play 22 Nov 17:58 (panel 22 Nov b)
  notes: ['night1.html', "  setScene('note'); NS.noteAct = id;", "  setScene('note'); NS.noteAct = id; performAct(id); return;"],
  bag: ['night1.html', '  bagBlanks: 2, breakTell: 0.4, corRows: 6,', '  bagBlanks: 2, breakTell: 0, corRows: 6,'],
  corwide: ['night1.html', '  mwRoute: true, mwCorX: 2.2,', '  mwRoute: true, mwCorX: 1.2,'],
  stickfull: ['night1.html', '  stickFull: 0.35,', '  stickFull: 1,'],
  lightlose: ['night1.html', 'lightChase: 2.5, lightLose: 1.5,', 'lightChase: 99, lightLose: 1.5,'],
  falls: ['night1.html', "else if (once(A, 'fall')) { A.falls++; gpStart(c, 'prat');", "else if (once(A, 'fall')) { A.falls++;"],
  intense: ['night1.html', "  if (once(A, 'roll')) { drum(actObj.roll); A.fxN.roll++; }", ''],
  vanity: ['night1.html', "  const vanity = kind === 'paint';", '  const vanity = false;'],
  pale: ['night1.html', 'reflPale: 0.85,\n', 'reflPale: 0,\n'],
  press: ['night1.html', '  if (press && NS.press) pressMeasure();', ''],
  // owner's phone play 22 Nov 19:38 (panel 22 Nov c, session 18)
  // F37: the session 18 values (glass 1.55 m, 1.1 m high) now still hold his face (seat and framing changed since), so the mutation lifts the glass clear above it
  vanitylow: ['night1.html', 'vanityGlass: [4.83, 0, 1.20], vanitySize: [1.3, 0.9],', 'vanityGlass: [4.83, 0, 1.95], vanitySize: [1.3, 0.7],'],
  bravado: ['night1.html', '  bravado: true,', '  bravado: false,'],
  bravrefl: ['night1.html', "  const lag = S.mirror === 'entry' ? N1.reflLag : 0, want", '  const lag = N1.reflLag, want'],
  // owner 22 Nov 20:27 (session 18 batch 2): the big mirror is a true mirror, the press a close shot where the palms meet
  pressshot: ['night1.html', 'pressShot: true,', 'pressShot: false,'],
  // owner 22 Nov 21:30 (session 18 batch 3): the controls chart in references/ is the standard
  bindclash: ['night1.html', "    pie: { keys: ['KeyK'], mouse: [2], label: 'Throw a pie' },", "    pie: { keys: ['KeyJ'], mouse: [2], label: 'Throw a pie' },"],
  pause: ['night1.html', "  if (bound('pause', e.code) && !e.repeat && NS.scene !== 'note' && NS.scene !== 'logo' && NS.scene !== 'title') { pauseGame(); return true; }", ''],
  truemirror: ['night1.html', '    rb.x = fx * dm + rx * x; rb.z = fz * dm + rz * x;', '    rb.x = fx * 7.2 + rx * -0.15; rb.z = fz * 7.2 + rz * -0.15;'],
  gprestore: ['night1.html', 'function moodRestore(c) { gpRestore(c);', 'function moodRestore(c) {'],
  fallfloor: ['night1.html', '  fallFloor: true,', '  fallFloor: false,'],
  tripacross: ['night1.html', 'tripAngles: [90, 75, 60, 45],', 'tripAngles: [],'],
  missyaw: ['night1.html', 'missYaw: 1.5708, bowYaw: 0.9,', 'missYaw: 0, bowYaw: 0,'],
  // owner 22 Nov (session 19): his three tracks follow the scenes; each mutation must FAIL a music step
  musicmap: ['night1.html', "walk: 'waltz', board: 'waltz', act: 'waltz', back: 'weight'", "walk: 'cold', board: 'cold', act: 'cold', back: 'weight'"],
  musicpause: ['night1.html', '  musicHold(true);\n  const sc = bindScene()', '  const sc = bindScene()'],
  // session 20 batch 2 (owner 22 Nov 23:41, 23:59): each must FAIL its own step
  gnaw: ['night1.html', 'gnaw: { on: true,', 'gnaw: { on: false,'],
  lampgag: ['night1.html', "if (f.kind === 'light') { hitLamp(f); return; }", "if (f.kind === 'light') return;"],
  lightdark: ['night1.html', 'if (f.dark) mwLampDark(M, f, dt); else if (f.sink > 0) mwSink(f, dt);', 'if (f.sink > 0) mwSink(f, dt);'],
  hints: ['night1.html', "Gags cost Laughs. Stand still and they gnaw.'", "SLAP, PIE, FALL. Lift your thumbs to stand still.'"],
  cost: ['night1.html', 'M.spent = n; M.spentT = N1.spendShow;', 'M.spent = n;'],
  musicsoft: ['night1.html', 'N1.musicVol * musicSoft() * M.duck', 'N1.musicVol * M.duck'],
  musicduck: ['night1.html', 'function openCue() {\n  musicDuck(true);', 'function openCue() {'],
  // F35 (session 25): the shop panel placed by shopFit(); the mutation gives it the whole screen, over the glass
  shoplow: ['night1.html', '  let best = null;\n  for (const r of regs)', '  let best = [0, 0, vw, vh, \'b\'];\n  for (const r of regs)'],
};
const MUT = MUTS[process.env.MUTATE || ''];
if (process.env.MUTATE && !MUT) { console.error('unknown MUTATE ' + process.env.MUTATE); process.exit(2); }
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  if (MUT && path.basename(f) === MUT[0]) { const t = fs.readFileSync(f, 'utf8'); if (t.split(MUT[1]).length !== 2) throw new Error('mutation anchor not found once: ' + MUT[1]); r.end(t.replace(MUT[1], MUT[2])); return; }
  fs.createReadStream(f).pipe(r);
});
let nOk = 0, nAll = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// music state: the scene's track, which elements play, each gain (fades are on the audio clock: read after they settle)
const musicState = () => { const N = window.__night, M = N.NS.music; if (!M) return null; const o = { key: M.key, want: N.N1.musicScene[N.NS.scene], trail: M.trail.join(' '), duck: M.duck, playing: [], gain: {} };
  for (const k in M.el) { if (!M.el[k].paused) o.playing.push(k); o.gain[k] = M.g[k] ? +M.g[k].gain.value.toFixed(3) : M.el[k].volume; } return o; };
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const url = `http://127.0.0.1:${srv.address().port}/night1.html`;
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const screens = [{ n: 'desk', w: 1280, h: 720, m: false }, { n: 'phone', w: 390, h: 844, m: true }, { n: 'land', w: 844, h: 390, m: true }].filter((s) => !process.env.ONLY || s.n === process.env.ONLY);
  for (const sc of screens) {
    const ctx = await b.newContext({ viewport: { width: sc.w, height: sc.h }, isMobile: sc.m, hasTouch: sc.m });
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', (e) => errs.push('pageerror ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
    // TRANSCRIPT=<file>: after each step, append the text a player can see (page and cue frame) for the stranger cold read
    const seen = async (name) => {
      if (!process.env.TRANSCRIPT) return;
      let t = await pg.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').trim());
      const fr = pg.frames().find((f) => /cue_model/.test(f.url()));
      if (fr) t += '\n[act screen] ' + await fr.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').trim()).catch(() => '');
      fs.appendFileSync(process.env.TRANSCRIPT, `\n=== ${sc.n} after: ${name}\n${t}\n`);
    };
    let until = false;
    // THROTTLE=<n> (probe use): from the step whose name holds THROTTLE_AT (default 'fog into the Mirror World') the page's CPU runs n times slower, as on a slow CI runner
    const step = async (name, fn) => { if (until) return; if (+process.env.THROTTLE > 1 && name.indexOf(process.env.THROTTLE_AT || 'fog into the Mirror World') >= 0) { const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE }); } if (process.env.UNTIL && name.indexOf(process.env.UNTIL) >= 0) until = true; nAll++; try { await fn(); const s = await pg.evaluate(() => window.__night && window.__night.NS.scene); nOk++; console.log(sc.n, 'OK  ', name, '| scene', s); } catch (e) { console.log(sc.n, 'FAIL', name, String(e.message).split('\n')[0]); if (/Timeout/.test(e.message)) console.log('    why: ' + String(e.message).split('\n').slice(1, 9).join(' | ').slice(0, 700)); } await seen(name).catch(() => {}); };
    const shot = (n) => pg.screenshot({ path: `${OUT}/${sc.n}_${n}.png` });
    await pg.goto(url);
    // session 25: this journey keeps the corridor-then-ring route (route mixer with no rooms); smoke_nights.cjs checks the rooms, nights 2-3 and the ending
    await step('loads', async () => { await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 120000 }); await pg.evaluate(() => { window.__night.NS.routeOrder = []; }); });
    const nAt = process.env.N_AT || await pg.evaluate(() => window.__night.N1.nietzscheAt);
    await pg.evaluate((a) => { window.__night.NS.nAt = a; }, nAt);
    // fault F27 (owner 22 Nov 19:38 "what that fall he squashed"): every page pose gives the same result twice and never sinks under the floor
    await step('falls: same pose every time, nothing under the floor (F27, 22c-3)', async () => {
      const r = await pg.evaluate(() => { const N = window.__night, o = [];
        for (const k of ['prat', 'trip', 'dive', 'kneel']) for (const m of ['', 'moodOut', 'moodBack']) { const a = N.gpProbe(k, m), b = N.gpProbe(k, m); o.push({ k, m, low: Math.min(...a.map((x) => x[1])), same: JSON.stringify(a) === JSON.stringify(b), h0: a[0][2] }); }
        return o; });
      const bad = r.filter((x) => !x.same || x.low < -0.03 || x.h0 < 1.65);
      console.log('    lowest point per pose', r.map((x) => x.k + (x.m ? '/' + x.m : '') + ' ' + x.low.toFixed(3)).join(', '));
      if (bad.length) throw new Error('poses ' + JSON.stringify(bad));
    });
    // owner 22 Nov 21:30 (references/controls-reference.jpg, CHECK-AREAS.md 1): one bindings table, every action bound, no clash in a scene,
    // no key literal outside it, hints written from it
    await step('controls: one bindings table, every action bound, no clash in a scene (chart)', async () => {
      const src = fs.readFileSync(path.join(ROOT, 'night1.html'), 'utf8'), lit = (src.match(/e\.code === '/g) || []).length;
      const r = await pg.evaluate(() => { const C = window.__walkTest.CONFIG, out = { missing: [], clash: [] };
        for (const [sc, acts] of Object.entries(C.bindScenes)) { const seen = {}; for (const a of acts) { const b = C.binds[a]; if (!b || (!b.keys.length && !b.mouse.length)) out.missing.push(sc + ':' + a); else for (const k of b.keys) { if (seen[k] && seen[k] !== a) out.clash.push(sc + ':' + k + ' ' + seen[k] + '/' + a); seen[k] = a; } } }
        return out; });
      console.log('    bindings: missing', r.missing.length, '| clashes', r.clash.length, '| key literals outside the table', lit - 1);
      if (r.missing.length || r.clash.length || lit !== 1) throw new Error('bindings ' + JSON.stringify(r) + ' literals ' + lit);
    });
    await step('logo then title', async () => { await sleep(3400); await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 2000 }); });
    await step('start: at the mirror', async () => { await pg.click('#start'); await sleep(1500); });
    await step('opening at the dressing table, his reflection facing him (22b-6)', async () => {
      const r = await pg.evaluate(() => { const N = window.__night, W = window.__walkTest, m = N.NS.mrect, P = (o, y) => { const v = o.getWorldPosition(new W.camera.position.constructor()); v.y += y; v.project(W.roomCam); return [(v.x + 1) / 2 * N.S.w, (1 - v.y) / 2 * N.S.h]; };
        // session 18 (owner 22 Nov 19:38): the reflection's face, head bone to 0.3 m above it, must be inside the glass; batch 3 measured a fixed 1.3 m and passed a cut-off face
        const H = (c, up) => { const v = new W.camera.position.constructor(); c.pb.head.getWorldPosition(v); v.y += up; v.project(W.roomCam); return [(v.x + 1) / 2 * N.S.w, (1 - v.y) / 2 * N.S.h]; };
        const IN = (q) => q[0] >= m[0] && q[0] <= m[0] + m[2] && N.S.h - q[1] >= m[1] && N.S.h - q[1] <= m[1] + m[3];
        const rh = H(N.refl, 0.15), ch = H(N.chars.clown, 0.15), inGlass = IN(H(N.refl, 0)) && IN(H(N.refl, 0.3)) && IN(rh);
        const g = N.N1.vanityGlass, cp = N.chars.clown.root.position, rp = N.refl.root.position, mirr = Math.abs(rp.x - (2 * g[0] - cp.x)) < 1e-3 && Math.abs(rp.z - cp.z) < 1e-3;
        // the image's face is not behind his head: screen distance at least both heads' half widths (0.18 m each, projected at their depths)
        const half = (c) => { const V = W.camera.position.constructor, q = new V(); c.pb.head.getWorldPosition(q); const s = q.clone(); s.z += 0.18; q.project(W.roomCam); s.project(W.roomCam); return Math.abs((s.x - q.x) / 2 * N.S.w); };
        const clear = Math.abs(rh[0] - ch[0]) - half(N.refl) - half(N.chars.clown);
        return { view: N.S.roomView, mirror: N.S.mirror, sit: N.NS.sit, inGlass, mirr, clear: Math.round(clear), apart: Math.abs(rh[0] - ch[0]) / N.S.h, faces: Math.cos(N.chars.clown.root.rotation.y - N.refl.root.rotation.y) }; });
      console.log('    vanity: reflection in the glass', r.inGlass, '| heads apart', (r.apart * 100).toFixed(0) + '% of the height | clear of his head', r.clear, 'px');
      if (r.view !== 'dressing' || r.mirror !== 'paint' || r.sit !== 1 || !r.inGlass || !r.mirr || r.clear < 0 || r.faces > -0.99) throw new Error('vanity ' + JSON.stringify(r));
    });
    await step('first input finishes the paint', async () => { await pg.mouse.click(sc.w / 2, sc.h / 3); await pg.waitForSelector('#card_dazai', { timeout: 30000 }); await shot('paint'); });
    const boardWall = await pg.evaluate(() => window.__night.N1.boardWall);
    // panel F (owner 22 Nov 15:58): the act board is the room's wall; its two acts are 44 px buttons over their cards (land picks the sweep)
    const actPick = sc.n === 'land' ? 'sweep' : 'fall';
    // panel 22 Nov c fix 2: after the Dazai line he stands and straightens (false bravado); owner 22 Nov 20:27: the vanity image copies him at once
    // (it is a mirror) and no tap skips the beat
    await step('false bravado after the Dazai line, the vanity copies him exactly, no tap skip (22c-2)', async () => {
      await pg.click('#goOut');
      const box = await pg.evaluate(() => { const r = document.getElementById('gl').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await pg.waitForFunction(() => window.__night.NS.brav && window.__night.NS.brav.t > 0.3, null, { timeout: 20000 });
      await pg.mouse.click(box[0], box[1]); await pg.keyboard.press('Space');
      const diff = { chest: 0, sit: 0 };
      for (let i = 0; i < 8; i++) {
        const m = await pg.evaluate(() => { const N = window.__night, B = N.NS.brav; if (!B) return null; const rf = N.refl.face.material.uniforms.uCell.value, cf = N.chars.clown.face.material.uniforms.uCell.value; return { chest: Math.abs(B.chest - B.reflChest), sit: Math.abs(B.sit - B.reflSit), face: rf.x === cf.x && rf.y === cf.y, t: B.t }; });
        if (!m) break;
        diff.chest = Math.max(diff.chest, m.chest); diff.sit = Math.max(diff.sit, m.sit); if (!m.face) diff.face = false;
        if (i === 3) await shot('bravado');
        await sleep(150);
      }
      await pg.waitForFunction(() => window.__night.NS.bravLast, null, { timeout: 20000 });
      const r = Object.assign(diff, await pg.evaluate(() => Object.assign({ sitEnd: window.__night.NS.sit, face: window.__night.chars.clown.faceNow }, window.__night.NS.bravLast)));
      console.log('    bravado', JSON.stringify(r));
      if (!(r.peak >= 0.99 && r.chest < 0.01 && r.sit < 0.001 && r.face !== false && r.face === 'smile' && !r.skipped)) throw new Error('bravado ' + JSON.stringify(r));
    });
    await step('act board on the room wall, no board card (F)', async () => {
      if (!boardWall) throw new Error('N1.boardWall is off: the act is chosen on a card at the ring edge');
      if (await pg.isVisible('#goOut')) await pg.click('#goOut');
      await pg.waitForFunction(() => window.__night.S.roomView === 'board' && !document.getElementById('boardActs').classList.contains('hidden'), null, { timeout: 20000 });
      await sleep(400); await shot('board');
      // 22 Nov b item 1: one note per act, at least 44 px, inside the picture, never overlapping; a tap opens a readable parchment; Back returns
      const r = await pg.evaluate(() => { const c = document.getElementById('gl').getBoundingClientRect(); return Array.from(document.querySelectorAll('#boardActs .note')).map((b) => { const q = b.getBoundingClientRect(); return { l: q.left, r: q.right, t: q.top, b: q.bottom, h: q.height, w: q.width, inside: q.left >= c.left - 1 && q.right <= c.right + 1 && q.top >= c.top - 1 && q.bottom <= c.bottom + 1 }; }); });
      const over = r.some((a, i) => r.some((b, j) => j > i && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b));
      if (r.length !== 2 || over || r.some((b) => b.h < 44 || b.w < 44 || !b.inside)) throw new Error('board notes ' + JSON.stringify({ over, r }));
      await pg.click(`#boardActs [data-act="${actPick}"]`);
      await pg.waitForSelector('#card_note .parchment', { timeout: 3000 });
      const pc = await pg.evaluate(() => { const p = document.querySelector('#card_note .parchment'), q = p.getBoundingClientRect(), f = parseFloat(getComputedStyle(p.querySelector('p')).fontSize); return { f, inside: q.left >= 0 && q.right <= innerWidth && q.top >= 0 && q.bottom <= innerHeight, run: window.__night.S.running }; });
      if (pc.f < 14 || !pc.inside || pc.run) throw new Error('parchment ' + JSON.stringify(pc));
      await shot('note');
      await pg.click('#noteBack'); await pg.waitForFunction(() => window.__night.NS.scene === 'boardwall' && !document.getElementById('card_note'), null, { timeout: 3000 });
      await pg.click(`#boardActs [data-act="${actPick}"]`); await pg.waitForSelector('#perform', { timeout: 3000 }); await pg.click('#perform');
      const act = await pg.evaluate(() => window.__night.NS.act);
      if (act !== actPick) throw new Error('act ' + act);
    });
    await step('go out: corridor', async () => { if (!boardWall) await pg.click('#goOut'); await sleep(900); await pg.waitForFunction(() => window.__night.S.shot === 'corridor', null, { timeout: 15000 }); });
    // panel C: count the text bubbles on screen through the walk out (test-only sampler in the page)
    await pg.evaluate(() => { window.__bubbles = 0; window.__bubbleT = setInterval(() => { const n = document.querySelectorAll('.label:not(.hidden)').length; if (n > window.__bubbles) window.__bubbles = n; }, 50); });
    const tp = (x, y) => pg.evaluate(([x, y]) => { const S = window.__night.S; S.x = x; S.y = y; }, [x, y]);
    const verb = async (x, y, v) => { await pg.waitForFunction(() => !window.__night.NS.anim, null, { timeout: 15000 }); await tp(x, y); await sleep(500); const vis = await pg.isVisible('#verb'); if (!vis) throw new Error('no verb button for ' + v); await pg.click('#verb'); await sleep(1100); const done = await pg.evaluate((v) => window.__night.NS.verbs[v], v); if (!done) throw new Error(v + ' not done'); };
    await step('take the pie', () => verb(1.0, 9.0, 'take'));
    // chart: Esc pauses; the loop stops, held keys are let go, game time stands still, the card lists this scene's controls from the table
    await step('Esc pauses with the controls list, Esc resumes (chart)', async () => {
      await pg.waitForFunction(() => !window.__night.NS.anim, null, { timeout: 15000 });
      const m0 = await pg.evaluate(musicState);
      await pg.keyboard.down('KeyW'); await sleep(200); await pg.keyboard.press('Escape'); await sleep(150);
      const mp = await pg.evaluate(musicState);
      const a = await pg.evaluate(() => { const N = window.__night, C = window.__walkTest.CONFIG; return { paused: N.NS.paused, raf: N.S.raf, ky: window.__walkTest.input.ky, y: N.S.y, rows: document.querySelectorAll('#pauseList tr').length, want: C.bindScenes.walk.length, text: document.getElementById('pauseList').textContent, card: !document.getElementById('pauseCard').classList.contains('hidden') }; });
      await sleep(600);
      const y2 = await pg.evaluate(() => window.__night.S.y);
      await pg.keyboard.up('KeyW'); await pg.keyboard.press('Escape'); await sleep(300);
      const b = await pg.evaluate(() => ({ paused: window.__night.NS.paused, card: !document.getElementById('pauseCard').classList.contains('hidden') }));
      const m1 = await pg.evaluate(musicState);
      console.log('    music: before', m0 && m0.playing.join(','), '| paused', mp && mp.playing.length, 'playing | after', m1 && m1.playing.join(','));
      if (!m0 || m0.playing.join() !== m0.want || mp.playing.length || m1.playing.join() !== m1.want) throw new Error('music at pause ' + JSON.stringify({ m0, mp, m1 }));
      console.log('    pause: rows', a.rows, 'of', a.want, '| held W let go', a.ky === 0, '| moved while paused', +(y2 - a.y).toFixed(3), 'm');
      if (!a.paused || a.raf || a.ky !== 0 || !a.card || a.rows !== a.want || !/E \/ Space \/ Enter/.test(a.text) || Math.abs(y2 - a.y) > 1e-6 || b.paused || b.card) throw new Error('pause ' + JSON.stringify({ a, y2, b }));
    });
    // panel D (owner 22 Nov 15:58: in the corridor shot "the player sees nothing"): the cable lies across the wings, filmed side-on
    await step('cable: blocks before the pratfall (D)', async () => {
      await pg.waitForFunction(() => !window.__night.NS.anim, null, { timeout: 15000 }); await tp(0.4, 10.6);
      await pg.waitForFunction(() => window.__night.S.shot === 'wings', null, { timeout: 10000 });
      // the walk check itself: across the cable line is closed before the pratfall, the floor before it is open
      const r = await pg.evaluate(() => { const N = window.__night, W = window.__walkTest, c = N.N1.cableY; return { across: W.free(0.4, c + 0.05), before: W.free(0.4, c - N.N1.cableGap - 0.2), fall: N.NS.verbs.fall }; });
      if (r.across || !r.before || r.fall) throw new Error('cable block ' + JSON.stringify(r));
      await shot('cable');
    });
    await step('cable: Space pratfall over it, seen side-on in the wings (D)', async () => {
      await tp(0.4, 10.6); await sleep(500);
      const t0 = await pg.textContent('#verb');
      if (!(await pg.isVisible('#verb')) || !/^Pratfall over the cable/.test(t0)) throw new Error('verb "' + t0 + '"');
      const at = () => pg.evaluate(() => { const N = window.__night, W = window.__walkTest, v = new W.camera.position.constructor(N.S.x, 0.9, -N.S.y).project(W.camera); return { x: (v.x + 1) / 2 * N.S.w, y: (1 - v.y) / 2 * N.S.h, h: N.S.h, shot: N.S.shot, sy: N.S.y }; });
      const a = await at();
      await pg.keyboard.press('Space');
      await pg.waitForFunction(() => window.__night.NS.verbs.fall && !window.__night.NS.anim, null, { timeout: 15000 });
      const b = await at(), r = await pg.evaluate(() => ({ peak: window.__night.NS.pratPeak, c: window.__night.N1.cableY }));
      const travel = Math.hypot(b.x - a.x, b.y - a.y);
      console.log('    pratfall: shot', a.shot, '| screen travel', travel.toFixed(0), 'px of', a.h, '| landed y', b.sy.toFixed(2), '| pitch', r.peak.toFixed(2));
      if (a.shot !== 'wings' || b.sy <= r.c || !(r.peak > 0.5) || travel < 0.08 * a.h) throw new Error('pratfall ' + JSON.stringify({ shot: a.shot, landed: b.sy, peak: r.peak, travel }));
    });
    await step('honk the horn', () => verb(0.5, 12.2, 'honk'));
    // harsh panel H2: the button must not tell the player it is on purpose before the child does
    // owner's item 5 (H7): one physical joke per verb: the horn honks back late, the rigger trips on the cable, he sniffs the pie
    await step('corridor: one physical joke per verb (item 5)', async () => { await pg.waitForFunction(() => { const j = window.__night.NS.jokes; return j.echo && j.rigger && j.sniff; }, null, { timeout: 20000 }).catch(async () => { throw new Error('jokes ' + JSON.stringify(await pg.evaluate(() => window.__night.NS.jokes))); }); });
    await step('trip button does not say "on purpose" (H2)', async () => { await tp(-1.3, 17.0); await sleep(500); const t = await pg.textContent('#verb'); if (!/^Trip\b/.test(t) || /purpose/i.test(t)) throw new Error('verb reads "' + t + '"'); });
    await step('trip for the child', async () => { await verb(-1.3, 17.0, 'trip'); await pg.waitForFunction(() => /on purpose/.test(window.__night.crew[4].lab.textContent), null, { timeout: 8000 }); await shot('child'); });
    // panel 22 Nov c 3d: the trip is played across the camera, at least 45 degrees off its line
    await step('trip for the child is seen across the camera (22c-3)', async () => {
      const a = await pg.evaluate(() => window.__night.NS.fallAxes.filter((f) => f.scene === 'walk'));
      console.log('    walk falls off the camera line (deg)', a.map((f) => f.off).join(' '));
      const last = a[a.length - 1];
      if (!last || last.off < 45) throw new Error('trip axis ' + JSON.stringify(a));
    });
    await step('walk out: brisk, one bubble at a time (C)', async () => {
      // panel C promised about 13 s of walking (start to the ring edge, shots.json), from the clip's measured speed x moodOut tempo
      const r = await pg.evaluate(() => { clearInterval(window.__bubbleT); const N = window.__night, d = N.S.data; return { max: window.__bubbles, v: N.S.speed * window.__walkTest.CONFIG.moodOut.tempo, m: d.endY - d.start.at[1] }; });
      r.secs = r.m / r.v;
      console.log('    walk out', r.v.toFixed(2), 'm/s,', r.m.toFixed(1), 'm in', r.secs.toFixed(1), 's (computed); most bubbles at once', r.max);
      if (r.max > 1 || !(r.secs <= 14)) throw new Error('walk out ' + JSON.stringify(r));
    });
    if (boardWall) await step('ring edge: the act starts with no board card (F)', async () => { await tp(-1.3, 18.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await pg.waitForFunction(() => window.__night.NS.scene === 'act', null, { timeout: 8000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); if (await pg.$('#card_board')) throw new Error('board card shown'); });
    else await step('ring edge: board', async () => { await tp(-1.3, 18.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await pg.waitForSelector('#card_board', { timeout: 8000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); });
    const actShow = await pg.evaluate(() => window.__night.N1.actShow);
    // the act at the zoom-out: he walks on into the spot, the house quiets, then the cue page (FAIL here when N1.actShow is off)
    // the land screen plays the spotlight sweep, the others the deliberate fall (both routines run every pass)
    await step('act: walk-on into the spot (scene reached)', async () => { if (!actShow) throw new Error('N1.actShow is off: the act is a text card'); if (!boardWall) await pg.click(`.card [data-act="${actPick}"]`); await pg.waitForFunction(() => { const A = window.__night.NS.A; return A && (A.phase === 'walkon' || A.phase === 'cue'); }, null, { timeout: 8000 }); await sleep(600); await shot('walkon'); });
    if (actShow) {
      await step('act: clown 60-64 px at the spot', async () => { const r = await pg.evaluate(() => { const N = window.__night, s = N.N1.actSpotAt; return { px: N.actPxAt(s[0], s[1]), want: N.N1.actPx }; }); if (!(r.px >= 60 && r.px <= 64)) throw new Error('clown ' + r.px.toFixed(1) + ' px tall'); console.log('    clown', r.px.toFixed(1), 'px'); });
      await step('act: draw calls under 150', async () => { const n = await pg.evaluate(() => window.__walkTest.renderer.info.render.calls); if (!(n > 0 && n < 150)) throw new Error('draw calls ' + n); console.log('    draw calls', n); });
      await step('act: loop stopped behind the cue page', async () => { await pg.waitForFunction(() => { const f = document.getElementById('cueFrame'); return f && f.contentWindow.__game; }, null, { timeout: 60000 }); await sleep(1500); const r = await pg.evaluate(() => ({ run: window.__night.S.running, raf: window.__night.S.raf, phase: window.__night.NS.A.phase })); if (r.run || r.raf || r.phase !== 'cue') throw new Error('behind the cue ' + JSON.stringify(r)); await shot('act');
        const m = await pg.evaluate(musicState), want = await pg.evaluate(() => window.__night.N1.musicVol * window.__night.N1.musicCueDuck);
        console.log('    music under the cue:', m && m.key, 'gain', m && m.gain[m.key], 'want', +want.toFixed(3));
        if (!m || m.key !== 'waltz' || Math.abs(m.gain[m.key] - want) > 0.02) throw new Error('music not ducked under the cue ' + JSON.stringify(m)); });
    } else await step('board: act page opens', async () => { if (!boardWall) await pg.click('.card [data-act="fall"]'); await pg.waitForFunction(() => { const f = document.getElementById('cueFrame'); return f && f.contentWindow.__game; }, null, { timeout: 60000 }); await sleep(2000); await shot('act'); });
    // owner's item 4 (stranger cold read): hosted, the act screen shows one line and its start button, none of the cue page's own notes or settings
    await step('act screen: one line, no developer notes (item 4)', async () => {
      const fr = pg.frames().find((f) => /cue_model/.test(f.url()));
      const r = await fr.evaluate(() => { const vis = (id) => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; }; const t = document.getElementById('title').innerText; return { line: vis('hostLine') && document.getElementById('hostLine').textContent, nights: vis('nightRow'), look: vis('btnLook'), start: vis('btnStart'), notes: /Blender|plates|Latency|Timing windows|approved/i.test(t) }; });
      if (!r.line || r.nights || r.look || !r.start || r.notes) throw new Error('act screen ' + JSON.stringify(r));
      console.log('    act line:', r.line);
    });
    // panel item 1: night 1 tells the cue page that a fall gets the big laugh; one forced early press is a miss
    await step('a fall in the act gets the big laugh, not the cough (item 1)', async () => {
      const fr = pg.frames().find((f) => /cue_model/.test(f.url()));
      await fr.waitForFunction(() => !!window.__cueOpts, null, { timeout: 5000 });
      const r = await fr.evaluate(() => { const g = window.__game; g.useVirtual(false); g.start(1); const f0 = g.beats()[0].fit; g.input(g.HIT, f0 + 2 * g.config.goodMs[0]); const i = g.info(); return { misses: i.misses, sound: i.fallSound, scene: i.scene }; });
      if (r.misses !== 1) throw new Error('forced press was not one miss: ' + JSON.stringify(r));
      if (r.sound !== 'laughBig') throw new Error('fall sound ' + r.sound);
    });
    // owner item 8: the cue's tilt is a lean backwards: his face moves away from the camera, not sideways (camera space, metres)
    await step('cue: he leans backwards, not sideways (item 8)', async () => {
      const fr = pg.frames().find((f) => /cue_model/.test(f.url()));
      await fr.waitForFunction(() => window.__model && window.__model.ready, null, { timeout: 60000 });
      const r = await fr.evaluate(() => {
        const M = window.__model, view = { w: 800, h: 600 }, at = (tilt) => {
          M.frame(1000, { scene: 'act', tilt, flip: false, miss: false, snap: false, mask: 0 }, view);
          const e = M.parts.anchor.matrixWorld.elements, c = M.camera.matrixWorldInverse.elements, x = e[12], y = e[13], z = e[14];
          return [c[0] * x + c[4] * y + c[8] * z + c[12], c[1] * x + c[5] * y + c[9] * z + c[13], c[2] * x + c[6] * y + c[10] * z + c[14]];
        };
        const a = at(0), b = at(1.1); at(0);
        return { side: b[0] - a[0], back: a[2] - b[2] };
      });
      if (!(r.back > 0.1)) throw new Error('face not moved away from the camera: ' + r.back.toFixed(3) + ' m');
      if (Math.abs(r.side) > 0.05) throw new Error('face moved sideways ' + r.side.toFixed(3) + ' m');
      console.log('    lean: back', r.back.toFixed(2), 'm, side', r.side.toFixed(3), 'm');
    });
    if (!actShow) await step('crowd card (stand-in act result)', async () => { await pg.evaluate(() => { const N = window.__night; N.NS.actInfo = { scene: 'results', perfects: 2, goods: 4, misses: 1, actLaughs: 45, mask: 2 }; N.crowdCard(); }); await pg.waitForSelector('#card_crowd'); });
    else {
      // stand-in act: chain 1 all Perfect, chain 2 with one miss, chain 3 Good; game time x3 (logic checked at the fast rate)
      await step('act: one routine segment per cue chain', async () => {
        await pg.evaluate(() => {
          const N = window.__night, R = ['perfect', 'perfect', 'perfect', 'good', 'miss', 'good', 'good', 'good', 'good'];
          N.NS.actBeats = R.map((r, k) => ({ fit: 1000 + k * 600, chain: Math.floor(k / 3), result: r }));
          N.NS.actInfo = { scene: 'results', perfects: 3, goods: 5, misses: 1, actLaughs: 45, mask: 2 };
          N.NS.actSeen = false; N.NS.actRate = 3; N.actAfter();
        });
        await pg.waitForFunction(() => { const A = window.__night.NS.A; return A && A.phase === 'seg' && A.seg >= 1; }, null, { timeout: 60000 });
        await shot('routine');
        await pg.waitForSelector('#card_crowd', { timeout: 120000 });
        const s = await pg.evaluate(() => window.__night.NS.A.segs.join(','));
        if (s !== 'perfect,miss,good') throw new Error('segments ' + s);
      });
      await step('act: falls are clown poses, not a plank (22b-4)', async () => {
        const used = await pg.evaluate(() => ({ prat: (window.__night.NS.gpUsed || {}).prat || 0, falls: window.__night.NS.A.falls }));
        if (!(used.falls >= 1 && used.prat === used.falls)) throw new Error('falls without the pratfall pose ' + JSON.stringify(used));
        const r = await pg.evaluate(() => { const N = window.__night, c = N.chars.clown; N.gpStart(c, 'prat'); c.gp.t = 0.45; N.gpEval(c, 0); const v = Array.from(c.gp.now); N.gpStop(c); return { hy: v[0], hr: v[1], thigh: v[4], armOut: v[9], root: c.root.rotation.x }; });
        if (!(r.hy < -0.5 && r.hr < -30 && r.thigh < -30 && r.armOut > 45 && Math.abs(r.root) < 1e-6)) throw new Error('pratfall at impact ' + JSON.stringify(r));
        console.log('    falls', used.falls, 'pratfall poses', used.prat);
      });
      // panel 22 Nov c 3d: every act fall is played at least 45 degrees off the low-seat camera's line
      await step('act: falls seen across the camera (22c-3)', async () => {
        const a = await pg.evaluate(() => window.__night.NS.fallAxes.filter((f) => f.scene === 'act'));
        console.log('    act falls off the camera line (deg)', a.map((f) => f.off).join(' '));
        if (!a.length || a.some((f) => f.off < 45)) throw new Error('act fall axes ' + JSON.stringify(a));
      });
      await step('act: the crowd rocks hardest at the miss, then a Perfect, then a Good', async () => { const p = await pg.evaluate(() => window.__night.NS.A.peaks); console.log('    crowd peaks', p.map((x) => x.toFixed(2)).join(' ')); if (!(p[1] > p[0] && p[0] > p[2])) throw new Error('peaks ' + p.map((x) => x.toFixed(2))); });
      await step('act: intensity: drum roll per gag, crash and shake on falls, flash and popcorn on peaks (22b-5)', async () => {
        const f = await pg.evaluate(() => { const A = window.__night.NS.A; return Object.assign({ segs: A.segs.length }, A.fxN); });
        console.log('    act fx', JSON.stringify(f));
        if (f.roll < f.segs || f.crash < 1 || f.shake < 1 || f.flash < 1 || f.burst < 2) throw new Error('fx ' + JSON.stringify(f));
      });
      await step('act: the beat after (sad face, house silent)', async () => { const h = await pg.evaluate(() => window.__night.NS.A.hold); if (!h || h.face !== 'sad' || !(h.excite < 0.02)) throw new Error('hold ' + JSON.stringify(h)); });
      await step('act: caption and the bow with the dented hat', async () => { await shot('caption'); const r = await pg.evaluate(() => { const c = document.getElementById('card_crowd'); return { lines: c.querySelectorAll('p').length, knows: !!c.querySelector('.knows'), laughs: /Laughs \+\d+/.test(c.textContent), hat: window.__night.NS.A.hat, see: c.classList.contains('see'), cut: window.__night.chars.clown.body.material.uniforms.uHatCut.value.w }; }); if (r.lines > 2 || !r.knows || !r.laughs || r.hat !== 'dent' || !r.see || r.cut !== 1) throw new Error('caption ' + JSON.stringify(r)); });
      await step('act: only the Skip button skips, after the first full play (owner 22 Nov 20:27)', async () => {
        // the replay is a check-only path (a player sees the caption once): the card count it adds is taken back after
        const cards = await pg.evaluate(() => { const N = window.__night, n = N.NS.contCount; N.NS.actRate = 1; N.actRoutine(); return n; });
        await pg.waitForFunction(() => { const A = window.__night.NS.A; return A.phase === 'seg' && A.t > 0.1; }, null, { timeout: 10000 });
        const box = await pg.evaluate(() => { const r = document.getElementById('gl').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        await pg.mouse.click(box[0], box[1]); await pg.keyboard.press('Space'); await pg.keyboard.press('Enter'); await sleep(300);
        const tap = await pg.evaluate(() => ({ skipped: !!window.__night.NS.A.skipped, card: !!document.getElementById('card_crowd') }));
        const btn = await pg.isVisible('#actSkipBtn');
        if (btn) await pg.click('#actSkipBtn');
        await pg.waitForSelector('#card_crowd', { timeout: 3000 }).catch(() => {});
        const r = await pg.evaluate(() => ({ skipped: window.__night.NS.A.skipped, seg: window.__night.NS.A.seg, btnAfter: !document.getElementById('actSkipBtn').classList.contains('hidden') }));
        await pg.evaluate((n) => { window.__night.NS.contCount = n; }, cards);
        if (tap.skipped || tap.card || !btn || !r.skipped || r.seg > 0 || r.btnAfter) throw new Error('skip ' + JSON.stringify({ tap, btn, r }));
      });
    }
    // panel fix 2: with 1 fall, a pie in hand and the trip done, each hurt pays more than a clean Perfect (10, cue_model.html) and the card says so
    await step('crowd pays most for what hurts him (fix 2)', async () => {
      const r = await pg.evaluate(() => { const N = window.__night, n = N.N1; return { laughs: N.NS.laughs, pies: N.NS.pies, want: 45 + n.hurtFall + n.hurtPie + n.hurtTrip, each: [n.hurtFall, n.hurtPie, n.hurtTrip], head: (document.querySelector('#card_crowd .knows') || {}).textContent || '' }; });
      if (r.each.some((x) => !(x > 10))) throw new Error('a hurt pays no more than a clean beat: ' + r.each);
      if (r.laughs !== r.want) throw new Error(`laughs ${r.laughs}, want ${r.want}`);
      if (r.pies !== 2) throw new Error('the pie in his face should cost one of 3 pies, pies ' + r.pies);
      // "hardest" only when one hurt alone beats the whole act (stranger cold read, 22 Nov); stand-in: act 45, best single hurt 25
      const hard = Math.max(...r.each) > 45;
      if (!(hard ? /laughed hardest at/ : /got a bigger laugh than a clean beat/).test(r.head)) throw new Error('crowd card headline: "' + r.head + '"');
      console.log('   ', r.head, 'laughs', r.laughs);
    });
    // harsh panel H1: a fall pays by how high he had climbed (falling at once pays nothing extra), the second fall pays fallRepeat, the pie scales with the first
    await step('falls pay by the climb before them (H1)', async () => {
      const r = await pg.evaluate(() => {
        const N = window.__night, n = N.N1, NS = N.NS, keep = { pies: NS.pies, trip: NS.verbs.trip, beats: NS.actBeats };
        NS.verbs.trip = false;
        const B = (list) => list.map((res, k) => ({ fit: 1000 + k * 600, result: res }));
        const run = (list, info) => { NS.pies = 3; NS.actBeats = B(list); return N.hurtLaughs(info); };
        const early = run(['miss', 'miss'], { actLaughs: 15, misses: 2, perfects: 0, goods: 0 });
        const late = run(['perfect', 'perfect', 'perfect', 'perfect', 'perfect', 'perfect', 'perfect', 'miss', 'miss'], { actLaughs: 70, misses: 2, perfects: 7, goods: 0 });
        const clean = run(Array(9).fill('perfect'), { actLaughs: 90, misses: 0, perfects: 9, goods: 0 });
        Object.assign(NS, { pies: keep.pies, actBeats: keep.beats }); NS.verbs.trip = keep.trip;
        return { early: early.total, late: late.total, lateFalls: late.falls, clean: clean.total, want: Math.round(n.hurtFall) + Math.round(n.hurtFall * n.fallRepeat) + n.hurtPie };
      });
      if (r.early !== 0) throw new Error('falling at once still pays ' + r.early);
      if (r.late !== r.want || r.lateFalls !== 2) throw new Error(`clean then two falls pays ${r.late}, want ${r.want}`);
      if (r.clean !== 0) throw new Error('a clean act pays hurt ' + r.clean);
      console.log('    hurt pay: fall at once', r.early, '| 7 Perfect then 2 falls', r.late, '| clean', r.clean);
    });
    if (actShow) await step('walk back: slump set by the act\'s Laughs, dented hat on', async () => {
      await pg.click('#walkBack'); await sleep(300);
      const r = await pg.evaluate(() => { const N = window.__night, lo = N.slumpFor(30), hi = N.slumpFor(140), m = N.S.mood, w = N.slumpFor(N.NS.laughs); return { lo: lo.chest, hi: hi.chest, tempo: [lo.tempo, hi.tempo], same: m.chest === w.chest && m.head === w.head && m.tempo === w.tempo, dent: N.actObj.dent.visible, mode: N.S.mode || '' }; });
      if (!(r.hi > r.lo) || !r.same || r.tempo[0] !== r.tempo[1] || !r.dent || r.mode) throw new Error('walk back ' + JSON.stringify(r));
    });
    // panel E, owner's version (22 Nov 15:58): slow tempo kept, the corridor shot cut: the walk back ends as he leaves the wings
    await step('walk back: wings, then the room, no corridor shot (E)', async () => {
      if (await pg.$('#walkBack')) await pg.click('#walkBack');
      await sleep(800);
      await pg.evaluate(() => { window.__shots = {}; window.__shotT = setInterval(() => { const s = window.__night.S; if (!s.room) window.__shots[s.shot] = 1; }, 40); });
      await tp(0, 8.7); await pg.evaluate(() => { window.__night.input.ty = -1; });
      await pg.waitForFunction(() => window.__night.S.room, null, { timeout: 15000 }).catch(() => {});
      await pg.evaluate(() => { window.__night.input.ty = 0; });
      const r = await pg.evaluate(() => { clearInterval(window.__shotT); const N = window.__night, C = window.__walkTest.CONFIG; return { room: N.S.room, shots: Object.keys(window.__shots).join(','), secs: (C.backStart[1] - C.backEndY) / (N.S.speed * C.moodBack.tempo), tempo: (N.NS.slump || C.moodBack).tempo }; });
      console.log('    walk back shots', r.shots, '| computed walk', r.secs.toFixed(1), 's at tempo', r.tempo);
      if (!r.room || /corridor/.test(r.shots) || r.tempo !== 0.78 || r.secs > 18) throw new Error('walk back ' + JSON.stringify(r));
      await sleep(800);
    });
    await step('turn to the mirror wall, sit button', async () => { for (let i = 0; i < 4; i++) { const v = await pg.evaluate(() => window.__night.S.roomView); if (v === 'mirror') break; await pg.click('#roomR'); await sleep(500); } await pg.waitForSelector('#sit:not(.hidden)', { timeout: 3000 }); });
    await step('mirror entry: a pale form of him, hands meet on the glass, reflection late, cracks (22b-7)', async () => {
      await pg.click('#sit'); await sleep(700);
      const pale = await pg.evaluate(() => { const N = window.__night; return { amt: N.refl.gAmt.value, want: N.N1.reflPale, tint: N.refl.gTint.value.r, night1: N.N1.reflShade[0], last: N.N1.reflShade[N.N1.reflShade.length - 1] }; });
      if (!(pale.amt === pale.want && pale.amt > 0.5 && pale.tint === pale.night1 && pale.last < pale.night1)) throw new Error('reflection not pale or not darker by night ' + JSON.stringify(pale));
      // owner 22 Nov 20:27 ("it is a mirror"): standing at the mark, the image is at his true mirror place (no lift, no slide)
      const plate = await pg.evaluate(() => { const N = window.__night, D = N.N1.mirrorGlassD, c = N.chars.clown.root.position, p = N.refl.root.position, fz = N.NS.reflBase.fz, fx = N.NS.reflBase.fx;
        const dc = c.x * fx + c.z * fz, dr = p.x * fx + p.z * fz, rx = N.NS.reflBase.rx, rz = N.NS.reflBase.rz; return { depth: +(dr - (2 * D - dc)).toFixed(4), side: +((p.x * rx + p.z * rz) - (c.x * rx + c.z * rz)).toFixed(4), y: p.y }; });
      await pg.evaluate(() => { window.__night.NS.handGapMin = -1; });
      await pg.mouse.click(sc.w / 2, sc.h / 2);
      await pg.waitForFunction(() => window.__night.NS.press, null, { timeout: 8000 }).catch(() => {});
      await pg.waitForFunction(() => { const N = window.__night; return N.NS.handGapMin >= 0 && N.NS.handGapMin <= N.N1.handMeet || N.S.mode === 'mw'; }, null, { timeout: 20000 }).catch(() => {});
      const r = await pg.evaluate(() => { const N = window.__night, W = window.__walkTest, V = W.camera.position.constructor, D = N.N1.mirrorGlassD, c = N.chars.clown.root.position, p = N.refl.root.position;
        const cam = N.pressCam, inF = (o) => { const v = new V(); o.pb.head.getWorldPosition(v); v.y += 0.15; v.project(cam); return Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95 && v.z < 1; };
        // each face turned to the camera within 75 degrees (facing = (sin yaw, cos yaw) on the floor)
        const turned = (o) => { const y = o.root.rotation.y, v = new V(); o.pb.head.getWorldPosition(v); const dx = cam.position.x - v.x, dz = cam.position.z - v.z, h = Math.hypot(dx, dz); return Math.round(Math.acos((Math.sin(y) * dx + Math.cos(y) * dz) / h) * 180 / Math.PI); };
        // the image is seen through the glass, not hidden by the wall: the camera's ray to its head crosses the glass plane at least 0.1 m inside the glass
        const through = (() => { const v = new V(); N.refl.pb.head.getWorldPosition(v); v.y += 0.15; const k = (D - cam.position.z) / (v.z - cam.position.z), x = cam.position.x + (v.x - cam.position.x) * k, y = cam.position.y + (v.y - cam.position.y) * k; return Math.abs(x) <= 0.625 && y >= 0.325 && y <= 2.875; })();
        return { through, press: N.NS.press, gap: N.NS.handGapMin, want: N.N1.handMeet, cracks: N.NS.cracks, mirr: Math.abs(p.x - c.x) < 1e-3 && Math.abs(p.z - (2 * D - c.z)) < 1e-3, feet: p.y, heads: inF(N.chars.clown) && inF(N.refl), turnHim: turned(N.chars.clown), turnImg: turned(N.refl) }; });
      await shot('entry');
      console.log('    mirror: at the mark depth/side error', plate.depth, plate.side, '| press shot', r.press, '| palms apart', r.gap.toFixed(3), 'm (at most', r.want + ') | both faces in frame', r.heads, '| faces turned to the camera', r.turnHim, r.turnImg, 'deg | image seen through the glass', r.through);
      if (Math.abs(plate.depth) > 1e-3 || Math.abs(plate.side) > 1e-3 || Math.abs(plate.y) > 1e-3) throw new Error('reflection not at the mirror place ' + JSON.stringify(plate));
      if (!r.press || !(r.gap >= 0 && r.gap <= r.want) || r.cracks < 1 || !r.mirr || Math.abs(r.feet) > 1e-3 || !r.heads || !r.through || r.turnHim > 75 || r.turnImg > 75) throw new Error('entry ' + JSON.stringify(r));
    });
    if (nAt === 'in' || nAt === 'both') await step('Nietzsche line at the mirror before he goes in', async () => { await pg.waitForSelector('#card_nietzscheIn', { timeout: 10000 }); const t = await pg.textContent('#card_nietzscheIn .quote'); console.log('   in:', t.slice(0, 60)); await shot('nietzsche_in'); await pg.click('#goIn'); });
    await step('fog into the Mirror World', async () => { await pg.waitForFunction(() => window.__night.S.mode === 'mw', null, { timeout: 8000 }); await sleep(1500); });
    // panel G (owner 22 Nov 11:22 items 2 and 4): night 1 starts in the mirror corridor, one cut at the door, then the ring with its constructs
    await step('Mirror World: the mirror corridor, then one cut to the ring (G)', async () => {
      const pads = await pg.evaluate(() => { const h = document.getElementById('hint'), p = document.getElementById('pads'); if (p.classList.contains('hidden')) return true; const a = h.getBoundingClientRect(), b = p.getBoundingClientRect(); return !(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) || !h.textContent; });
      if (!pads) throw new Error('F26: the hint is under the pads');
      const a = await pg.evaluate(() => {
        const N = window.__night, M = N.M, cam = N.mwCam, V = cam.position.constructor, inF = (x, y, z) => { const v = new V(x, y, z).project(cam); return Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1; };
        return { space: M.space, foes: N.foes.length, calls: window.__walkTest.renderer.info.render.calls, him: inF(M.x, 0, M.z) && inF(M.x, 1.8, M.z), door: inF(0, 1.2, N.N1.mwCorZ[1] - 0.48) };
      });
      await shot('mw_corridor');
      if (a.space !== 'corridor' || a.foes !== 0 || !a.him || !a.door) throw new Error('start ' + JSON.stringify(a));
    });
    // 22 Nov b item 2: twice as wide, a construct drawn from the bag breaks a mirror (blank first, then the Whisper), after a 0.4 s tell
    await step('corridor: twice as wide, a construct breaks a mirror (bag of marbles) (22b-2)', async () => {
      await pg.evaluate(() => { const M = window.__night.M; M.bag = ['whisper', '']; });
      for (let r = 1; r <= 3; r++) {
        await pg.evaluate((r) => { const N = window.__night; N.M.x = 0; N.M.z = N.NS.corPanels[r].z - 0.1; }, r);
        await pg.waitForFunction((r) => window.__night.M.row > r, r, { timeout: 10000 });
      }
      await pg.waitForFunction(() => window.__night.M.broke, null, { timeout: 15000 });
      await sleep(500); await shot('mw_break');
      const b = await pg.evaluate(() => { const N = window.__night, M = N.M; return { broke: M.broke, tell: M.breakTell, drawn: M.drawn.join(','), foes: N.foes.map((f) => f.kind).join(','), w: N.N1.mwCorX }; });
      console.log('    bag drew', b.drawn, '| broke out', b.broke, 'after', b.tell.toFixed(2), 's');
      if (b.broke !== 'whisper' || b.drawn !== 'blank,whisper' || !(b.tell >= 0.38) || b.foes !== 'whisper' || b.w < 2.2) throw new Error('bag ' + JSON.stringify(b));
    });
    await step('Mirror World: the cut at the door, constructs in the ring (G)', async () => {
      await pg.evaluate(() => { const N = window.__night; N.M.x = 0; N.M.z = N.N1.mwCorDoor + 0.6; N.input.ty = 1; });
      await pg.waitForFunction(() => window.__night.M.space === 'ring', null, { timeout: 15000 });
      await pg.evaluate(() => { window.__night.input.ty = 0; });
      await sleep(1500); await shot('mw');
      const b = await pg.evaluate(() => { const N = window.__night, k = N.foes.map((f) => f.kind); return { cuts: N.M.cuts, foes: k.join(','), dup: k.length !== new Set(k).size, light: k.includes('light'), tip: document.getElementById('mwTip').textContent, calls: window.__walkTest.renderer.info.render.calls }; });
      console.log('    ring draw calls', b.calls, '| foes', b.foes);
      if (b.cuts !== 1 || b.dup || !b.light || b.calls >= 150) throw new Error('route ' + JSON.stringify(b));
      if (/corridor|pale door/.test(b.tip)) throw new Error('F25: corridor tip in the ring: ' + b.tip);
    });
    await step('Mirror World: unworldly backdrop scaled by Mask (G)', async () => {
      const r = await pg.evaluate(() => { const N = window.__night, lo = N.mwUnworld(0), hi = N.mwUnworld(6), now = N.mwUnworld(N.NS.mask); return { lo, hi, now, u: { warp: N.mwU.uWarp.value, amt: N.mwU.uAmt.value, glass: N.mwU.uGlass.value } }; });
      if (!(r.hi.warp > r.lo.warp && r.hi.amt > r.lo.amt && r.hi.glass > r.lo.glass)) throw new Error('not scaled by Mask ' + JSON.stringify(r));
      if (Math.abs(r.u.warp - r.now.warp) > 1e-6 || Math.abs(r.u.amt - r.now.amt) > 1e-6) throw new Error('uniforms not from this Mask ' + JSON.stringify(r));
    });
    // H1: each fall in the act feeds the Whisper (stand-in act: 1 miss)
    await step('the Whisper is fed by each fall (H1)', async () => { const r = await pg.evaluate(() => { const N = window.__night, w = N.foes.find((f) => f.kind === 'whisper'); return w ? { hp: w.hp, base: N.N1.whisper.hp, per: N.N1.whisperFeed.hp, falls: N.NS.hurt.falls, mul: w.speedMul } : null; }); if (!r) throw new Error('no Whisper after a fall'); if (r.hp !== r.base + r.falls * r.per || !(r.mul > 1)) throw new Error('Whisper not fed ' + JSON.stringify(r)); });
    await step('gags: slap, pie, pratfall', async () => { await pg.keyboard.press('KeyJ'); await sleep(600); await pg.keyboard.press('KeyK'); await sleep(700); await pg.keyboard.press('Space'); await sleep(900); const M = await pg.evaluate(() => { const M = window.__night.M; return { l: M.laughs, p: window.__night.NS.pies }; }); console.log('   laughs', M.l.toFixed(1), 'pies', M.p); });
    // owner 23 Nov 00:32: "player must know laugh is limited else they will spam"
    await step('gags show what they cost: buttons, the Laughs count, one tip (owner 23 Nov)', async () => {
      await pg.waitForFunction(() => window.__night.M.cd <= 0 && window.__night.M.slapT <= 0 && !window.__night.M.fall, null, { timeout: 20000 });
      const l0 = await pg.evaluate(() => window.__night.M.laughs);
      // F31: the count may still show the pratfall's spend from the step before; wait until that is gone, then for this slap's own figure
      await pg.waitForFunction(() => !/\(-\d+\)/.test(document.getElementById('mwHud').textContent), null, { timeout: 20000 });
      await pg.keyboard.press('KeyJ');
      await pg.waitForFunction(() => document.getElementById('mwHud').textContent.indexOf('(-' + window.__night.N1.slap.cost + ')') >= 0, null, { timeout: 15000 });
      const r = await pg.evaluate(() => { const N = window.__night, c = N.N1; return { hud: document.getElementById('mwHud').textContent, cost: c.slap.cost, told: N.M.costTold, pads: ['padSlap', 'padPie', 'padFall'].map((id) => document.getElementById(id).textContent), want: [c.slap.cost, c.pie.cost, c.fall.cost], hint: document.getElementById('hint').textContent, touch: N.NS.touch }; });
      console.log('    HUD after a slap:', r.hud, '| pads', r.pads.join(', '));
      if (r.hud.indexOf('(-' + r.cost + ')') < 0 || !r.told) throw new Error('spend not shown ' + JSON.stringify(r));
      if (r.pads.some((x, i) => x.indexOf('-' + r.want[i]) < 0)) throw new Error('button without its cost: ' + r.pads.join(', '));
      if (!(l0 > 0) || !/Laughs/.test(r.hint)) throw new Error('hint does not name Laughs: ' + r.hint);
      await pg.waitForFunction(() => !/\(-\d+\)/.test(document.getElementById('mwHud').textContent), null, { timeout: 20000 });
    });
    // owner 22 Nov 17:58 on his phone: "the ring still unable to avoid the light". Real play: a bot drags the stick to `drag` of its radius (a phone thumb),
    // steering away from the spot and round the ring, for 8 s of game time; it may spend at most 2 s of it inside the spot
    for (const drag of [1, 0.6]) await step(`Light: running from it at ${drag * 100}% stick escapes it (real play)`, async () => {
      await pg.evaluate((drag) => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.M.x = L.spotX; N.M.z = L.spotZ + 0.3; L.r = N.lightStartR(); L.leaves = 0; L.loseT = 0; L.tellT = 0; L.inT = 0; L.loses = 0; window.__runT0 = N.M.t; N.M.laughs = Math.max(N.M.laughs, 300);
        // F36: the run measures the Light alone; the ring's other figures (route mixer: a group, plus followers from the corridor) are taken out of play for it and put back after,
        // so a Shame that the steps before left clinging (wall-clock sleeps leave different game time on a slow runner) cannot slow him
        window.__parked = N.foes.filter((f) => f.alive && f !== L); for (const f of window.__parked) { f.alive = false; f.cling = false; f.reach = 0; }
        window.__runDiag = { fallT: 0, cling: 0, hurts: 0, lastT: N.M.t, lastH: 0, near: 9, dist: 0, moveT: 0, lx: N.M.x, lz: N.M.z };
        window.__runBot = setInterval(() => { const D = window.__runDiag, gt = N.M.t - D.lastT; D.lastT = N.M.t; if (N.M.fall) D.fallT += gt; else { D.dist += Math.hypot(N.M.x - D.lx, N.M.z - D.lz); D.moveT += gt; } D.lx = N.M.x; D.lz = N.M.z; if (N.foes.some((f) => f.kind === 'shame' && f.alive && f.cling)) D.cling += gt; if ((N.M.hurtT || 0) > D.lastH + 0.1) D.hurts++; D.lastH = N.M.hurtT || 0; for (const f of N.foes) if (f.alive && f !== L) D.near = Math.min(D.near, Math.hypot(f.x - N.M.x, f.z - N.M.z));
          const M = N.M, dx = M.x - L.spotX, dz = M.z - L.spotZ, d = Math.hypot(dx, dz) || 1, r = Math.hypot(M.x, M.z) || 1;
          let ax = dx / d * 0.6 - M.z / r * 0.8, az = dz / d * 0.6 + M.x / r * 0.8; const n = Math.hypot(ax, az) || 1; N.input.tx = ax / n * drag; N.input.ty = -az / n * drag; }, 30); }, drag);
      await pg.waitForFunction(() => window.__night.M.t - window.__runT0 >= 8 || window.__night.M.over, null, { timeout: 120000 });
      const r = await pg.evaluate(() => { clearInterval(window.__runBot); const N = window.__night; for (const f of window.__parked || []) f.alive = true; window.__parked = null; N.input.tx = 0; N.input.ty = 0; const L = N.foes.find((f) => f.kind === 'light'); const D = window.__runDiag; return { inT: L.inT, t: N.M.t - window.__runT0, r: L.r, over: N.M.over, loses: L.loses, fallT: +D.fallT.toFixed(2), cling: +D.cling.toFixed(2), hurts: D.hurts, near: +D.near.toFixed(2), speed: +(D.dist / Math.max(0.01, D.moveT)).toFixed(2), full: +(N.S.speed * N.N1.mwTempo).toFixed(2) }; });
      console.log('    run', drag, ': inside the spot', r.inT.toFixed(2), 's of', r.t.toFixed(1), 's, spot r', r.r, '| fallen', r.fallT, 's, Shame clung', r.cling, 's, hurt', r.hurts, 'x, nearest other figure', r.near, 'm | speed', r.speed, 'of', r.full, 'm/s');
      if (r.over || r.inT > 2) throw new Error('caught by the Light ' + JSON.stringify(r));
      // F39 (owner 22 Nov, F24 stick curve): a thumb at 60% of the stick runs at full speed (stickFull 0.35); the Light alone no longer proves it
      if (r.speed < 0.9 * r.full) throw new Error('slower than full speed at ' + drag * 100 + '% stick ' + JSON.stringify(r));
      // F24: running at full stick the Light chases, then loses him (lightChase), at least once in 8 s
      if (drag === 1 && r.loses < 1) throw new Error('the Light never lost him ' + JSON.stringify(r));
    });
    // panel B (owner 22 Nov 15:58): he is faster than the Light; leaving it flares it (tell, game time) and grows it
    await step('Light: he outruns it, each escape grows it after a 0.4 s flare (B)', async () => {
      const r0 = await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.M.laughs = Math.max(N.M.laughs, 300); L.r = L.cfg.spotR; L.loseT = 0; L.chaseT = 0; N.M.x = L.spotX; N.M.z = L.spotZ; return { r: L.r, n: L.leaves }; });
      await pg.waitForFunction(() => window.__night.foes.find((f) => f.kind === 'light').inPrev, null, { timeout: 10000 });
      await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.M.x = L.spotX + L.r + 2.5; });
      await pg.waitForFunction((n) => { const L = window.__night.foes.find((f) => f.kind === 'light'); return L.leaves > n && L.moveT >= 0; }, r0.n, { timeout: 20000 });
      const r = await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); return { r: L.r, tell: L.moveT - L.leftT, v: N.S.speed * N.N1.mwTempo, follow: L.cfg.follow, cap: N.N1.lightCap, grow: N.N1.lightGrow }; });
      console.log('    Light: he', r.v.toFixed(2), 'm/s vs', r.follow, '| tell', r.tell.toFixed(2), 's | spot', r0.r, '->', r.r);
      if (!(r.v >= 1.4 * r.follow)) throw new Error('not faster than the Light ' + JSON.stringify(r));
      if (!(r.tell >= 0.38)) throw new Error('chased after ' + r.tell.toFixed(2) + ' s, tell 0.4');
      if (!(Math.abs(r.r - Math.min(r.cap, r0.r + r.grow)) < 1e-6 && r.r > r0.r)) throw new Error('spot did not grow ' + r0.r + ' -> ' + r.r);
    });
    // owner 22 Nov 23:41 "standing still is not taking action and no action insecure will alway gnaw" (design/PANEL-action-22nov.md P4): game changed on purpose
    await step('standing still: they gnaw (edge at once, drain after the warning, any action clears it) (P4)', async () => {
      await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.input.tx = 0; N.input.ty = 0; N.M.laughs = Math.max(N.M.laughs, 300); N.M.x = -L.spotX; N.M.z = 5.5; N.M.still = 0; window.__g0 = N.M.gnawed; });
      await pg.waitForFunction(() => window.__night.M.gnawLvl === 1, null, { timeout: 20000 });
      const a = await pg.evaluate(() => { const N = window.__night; return { still: N.M.still, d: N.M.gnawed - window.__g0, cls: document.getElementById('gnaw').className, warn: N.N1.gnaw.warn }; });
      if (a.d !== 0 || a.still >= a.warn || a.cls !== 'warn') throw new Error('warning stage ' + JSON.stringify(a));
      await pg.waitForFunction(() => { const N = window.__night; return N.M.gnawLvl === 2 && N.M.still >= N.N1.gnaw.warn + 1; }, null, { timeout: 40000 });
      const b = await pg.evaluate(() => { const N = window.__night, g = N.N1.gnaw, o = N.M.still - g.warn; return { d: N.M.gnawed - window.__g0, want: g.drain * o + g.climb * o * o / 2, cls: document.getElementById('gnaw').className, over: N.M.over }; });
      console.log('    gnaw: warning after', a.still.toFixed(2), 's still, then drained', b.d.toFixed(2), 'Laughs (want about', b.want.toFixed(2) + ')');
      await shot('mw_gnaw');
      if (b.over || !(b.d > 0.6 * b.want && b.d < 1.4 * b.want) || b.cls !== 'drain') throw new Error('drain stage ' + JSON.stringify(b));
      await pg.evaluate(() => { window.__night.input.tx = 1; });
      await pg.waitForFunction(() => window.__night.M.gnawLvl === 0, null, { timeout: 20000 });
      const c = await pg.evaluate(() => { const N = window.__night; N.input.tx = 0; return document.getElementById('gnaw').className; });
      if (c !== '') throw new Error('edge still dark after he moved: ' + c);
    });
    await step('Light: holding still in its beam no longer puts it out (owner 22 Nov 23:41)', async () => {
      await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.M.laughs = Math.max(N.M.laughs, 300); N.M.x = L.spotX; N.M.z = L.spotZ; window.__runT0 = N.M.t; });
      await pg.waitForFunction(() => window.__night.M.t - window.__runT0 >= 4 || window.__night.M.over, null, { timeout: 90000 });
      const r = await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); return { alive: L.alive, dark: L.dark, over: N.M.over, hits: L.hits }; });
      if (!r.alive || r.dark || r.over) throw new Error('after 4 s still in the beam ' + JSON.stringify(r));
    });
    await step('Light: three gags on its lamp put it out for the night; the dark lamp stays and follows him (P5, A4)', async () => {
      const n = await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); N.M.laughs = Math.max(N.M.laughs, 300); for (const f of N.foes) if (f !== L) { f.x = 0; f.z = 6; f.cling = false; } N.M.x = L.x; N.M.z = L.z + 0.9; N.M.yaw = Math.PI; return L.cfg.gags; });
      for (let k = 0; k < n; k++) { await pg.keyboard.press('KeyJ'); await pg.waitForFunction((k) => window.__night.foes.find((f) => f.kind === 'light').hits > k, k, { timeout: 20000 }); await pg.waitForFunction(() => window.__night.M.cd <= 0 && window.__night.M.slapT <= 0, null, { timeout: 20000 }); }
      const r = await pg.evaluate(() => { const N = window.__night, L = N.foes.find((f) => f.kind === 'light'); return { alive: L.alive, dark: L.dark, inScene: !!L.root.parent, outs: N.NS.lightOuts, r1: N.lightStartR(), r0: N.N1.light.spotR, widen: N.N1.lightWiden, yaw: L.yaw, over: N.M.over }; });
      if (r.alive || !r.dark || !r.inScene || r.over) throw new Error('after ' + n + ' gags ' + JSON.stringify(r));
      if (r.outs !== 1 || Math.abs(r.r1 - r.r0 * (1 + r.widen)) > 1e-6) throw new Error('next night beam not ' + r.widen + ' wider ' + JSON.stringify(r));
      await pg.evaluate(() => { const N = window.__night; N.M.x = 5.5; N.M.z = -2; });
      await pg.waitForFunction((y) => Math.abs(window.__night.foes.find((f) => f.kind === 'light').yaw - y) > 0.3, r.yaw, { timeout: 40000 });
      await shot('mw_lamp_dark');
      console.log('    Light put out after', n, 'gags; dark lamp in the scene and turning; next night beam', r.r0, '->', r.r1.toFixed(3));
    });
    await step('hints say act, not stand still (owner 22 Nov 23:41)', async () => {
      const r = await pg.evaluate(() => ({ hint: document.getElementById('hint').textContent, src: Array.from(document.scripts).map((s) => s.textContent).join('\n') }));
      if (!/they gnaw/.test(r.hint) || !/Laughs/.test(r.hint)) throw new Error('control hint: ' + r.hint);
      const old = ['Lift your thumbs to stand still', 'Let go of everything: stand still', 'Hold still in'].filter((x) => r.src.indexOf(x) >= 0);
      if (old.length) throw new Error('old stillness hints left in the page: ' + old.join(' | '));
    });
    const lose = sc.n === 'land';
    await step(lose ? 'lost in the Mirror (land screen: loss branch), out' : 'others beaten, shards, out', async () => { await pg.evaluate((lose) => { const N = window.__night; if (lose) { N.endMW('lose'); return; } for (const f of N.foes) if (f.alive) { f.hp = 0; f.alive = false; f.sink = 0.6; } }, lose); await pg.waitForSelector(nAt === 'in' ? '#card_small' : '#card_nietzsche', { timeout: 12000 }); });
    if (nAt !== 'in') await step('Nietzsche line leaving the mirror, then shards kept', async () => { const t = await pg.textContent('#card_nietzsche .quote'); console.log('   out:', t.slice(0, 60)); await shot('nietzsche_out'); await pg.waitForSelector('#toKept', { state: 'visible', timeout: 8000 }); await pg.click('#toKept'); await pg.waitForSelector('#card_small', { timeout: 3000 }); });
    // small win (owner pitch, panel 11 of 12): win wipes one line of paint (Mask -1, floor the night's start) and one laugh answers; loss stands up by himself
    await step(lose ? 'small win, loss: he stands up by himself' : 'small win, win: he wipes one line of paint, one laugh answers', async () => {
      const a = await pg.evaluate(() => { const N = window.__night; return { mirror: N.S.mirror, run: N.S.running, text: document.querySelector('#smallGo').textContent, mask: N.NS.mask, start: N.NS.maskStart, paint: N.chars.clown.face.material.uniforms.uPaintAmt.value, want: N.NS.result === 'win' ? N.N1.winText : N.N1.loseText }; });
      if (a.mirror !== 'after' || !a.run || a.text !== a.want) throw new Error('not at the mirror with the prompt ' + JSON.stringify(a));
      await pg.click('#smallGo');
      if (!lose) {
        await pg.waitForFunction(() => window.__night.NS.laughed, null, { timeout: 30000 }).catch(async (e) => { const d = await pg.evaluate(() => { const N = window.__night; return { wipe: N.NS.wipe, run: N.S.running, raf: N.S.raf, mirror: N.S.mirror, mode: N.S.mode, room: N.S.room, scene: N.NS.scene, done: N.NS.smallDone, lost: N.S.lost }; }); throw new Error('no laugh ' + JSON.stringify(d)); });
        const b = await pg.evaluate(() => { const N = window.__night; return { mask: N.NS.mask, paint: N.chars.clown.face.material.uniforms.uPaintAmt.value, done: N.NS.smallDone, want: N.N1.winDone }; });
        if (b.mask !== Math.max(a.start, a.mask - 1)) throw new Error(`Mask ${a.mask} -> ${b.mask}, start ${a.start}`);
        if (!(b.paint < a.paint - 0.01) || b.done !== b.want) throw new Error('paint not wiped ' + JSON.stringify(b));
        // harsh panel H8: the laugh after the wipe is a rendered voice, not the four tones
        const L = await pg.evaluate(() => { const N = window.__night, buf = N.NS.laughBuf, d = buf && buf.one.getChannelData(0); let pk = 0; if (d) for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); return { last: N.NS.lastLaugh, secs: buf ? buf.one.duration : 0, crowd: buf ? buf.crowd.duration : 0, pk }; });
        if (L.last !== 'one' || !(L.secs > 0.5) || !(L.crowd > 1) || !(L.pk > 0.05)) throw new Error('laugh not the rendered voice ' + JSON.stringify(L));
      } else {
        await pg.waitForFunction(() => window.__night.NS.sit <= 0, null, { timeout: 30000 });
        const b = await pg.evaluate(() => { const N = window.__night; return { mask: N.NS.mask, laughed: N.NS.laughed, done: N.NS.smallDone, want: N.N1.loseDone }; });
        if (b.mask !== a.mask || b.laughed || b.done !== b.want) throw new Error('loss branch ' + JSON.stringify(b));
      }
      // owner's item 4: with mergeKept the shards he kept show on the shop card (no shards card)
      const merged = await pg.evaluate(() => window.__night.N1.mergeKept);
      await pg.waitForSelector(merged ? '#card_shop #keptLine' : '#card_kept', { state: 'attached', timeout: 30000 });
      if (!merged && await pg.evaluate(() => window.__night.S.running)) throw new Error('loop still running behind the shards card');
    });
    // panel fix 5: the shop is at the mirror; each purchase: the reflection stands (he stays seated), steps toward him by learnStep, performs, and a crack shows
    await step('shop at the mirror: the reflection performs each buy back at him (fix 5)', async () => {
      if (await pg.$('#toShop')) { await pg.evaluate(() => { window.__night.NS.shards = 11; }); await pg.click('#toShop'); } else await pg.evaluate(() => { const N = window.__night; N.NS.shards = 11; N.shopCard(); });
      await pg.waitForSelector('#card_shop');
      const at = await pg.evaluate(() => { const N = window.__night; return { mirror: N.S.mirror, run: N.S.running, see: N.NS.card.classList.contains('shopAt') }; });
      if (at.mirror !== 'shop' || !at.run || !at.see) throw new Error('shop not at the mirror ' + JSON.stringify(at));
      for (let k = 1; k <= 2; k++) {
        await pg.click('.opt:not([disabled])');
        await pg.waitForFunction(() => { const L = window.__night.NS.learn; return L && L.phase === 2; }, null, { timeout: 30000 });
        if (k === 1) await shot('shop_learn');
        // panel item 5: the shop card's content never covers the performing reflection inside the glass (more than 5% of its visible box)
        const ov = await pg.evaluate(() => {
          // the room picture can be letterboxed (phone portrait): project into the canvas (S.w x S.h, where NS.mrect lives), then offset by the canvas box
          const N = window.__night, W = window.__walkTest, w = N.S.w, h = N.S.h, m = N.NS.mrect, cb = W.renderer.domElement.getBoundingClientRect();
          const p = (y) => { const v = N.refl.root.position.clone(); v.y += y; v.project(W.roomCam); return [cb.left + (v.x + 1) / 2 * w, cb.top + (1 - v.y) / 2 * h]; };
          const top = p(1.9), feet = p(0), hw = (feet[1] - top[1]) * 0.25;
          const gx0 = cb.left + m[0], gx1 = gx0 + m[2], gy0 = cb.top + h - m[1] - m[3], gy1 = cb.top + h - m[1];
          const box = [Math.max(gx0, top[0] - hw), Math.max(gy0, top[1]), Math.min(gx1, top[0] + hw), Math.min(gy1, feet[1])];
          const area = Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
          let worst = 0, who = '';
          for (const el of N.NS.card.children) {
            const r = el.getBoundingClientRect();
            const o = Math.max(0, Math.min(box[2], r.right) - Math.max(box[0], r.left)) * Math.max(0, Math.min(box[3], r.bottom) - Math.max(box[1], r.top));
            if (o / Math.max(1, area) > worst) { worst = o / Math.max(1, area); who = el.id || el.className || el.tagName; }
          }
          return { area: Math.round(area), worst, who };
        });
        if (ov.area < 400) throw new Error('reflection not visible in the glass: ' + ov.area + ' px2');
        if (ov.worst > 0.05) throw new Error(`shop card covers ${(ov.worst * 100).toFixed(0)}% of the reflection (${ov.who})`);
        console.log('    reflection box', ov.area, 'px2, covered', (ov.worst * 100).toFixed(1) + '%');
        await pg.waitForFunction((k) => window.__night.NS.learnDone === k, k, { timeout: 30000 });
        const r = await pg.evaluate(() => { const N = window.__night, b = N.NS.reflBase, p = N.refl.root.position; return { off: Math.hypot(p.x - b.x, p.z - b.z), up: N.NS.reflUp, sit: N.NS.sit, step: N.N1.learnStep, cracks: N.NS.cracks }; });
        if (Math.abs(r.off - k * r.step) > 0.05) throw new Error(`buy ${k}: reflection ${r.off.toFixed(2)} m closer, want ${k * r.step}`);
        if (r.up !== 1 || r.sit !== 1) throw new Error(`buy ${k}: reflection standing ${r.up}, he seated ${r.sit}`);
        if (r.cracks < 1) throw new Error('no crack when the reflection stood');
      }
    });
    await step('end card: "' + 'the shame of living" over every purchase, nothing renders behind it', async () => {
      if (!(await pg.$('#card_shop'))) { await pg.evaluate(() => { window.__night.NS.shards = 11; }); await pg.click('#toShop'); }
      await pg.click('#endNight'); await pg.waitForSelector('#card_end'); await shot('end');
      const r = await pg.evaluate(() => { const N = window.__night; return { t: (document.querySelector('#card_end .knows') || {}).textContent || '', want: N.N1.endKnows, titles: N.NS.bought.map((id) => N.N1.shop.find((x) => x.id === id).title), run: N.S.running, mirror: N.S.mirror }; });
      if (r.want !== 'The shame of living:' || r.t.indexOf(r.want) !== 0) throw new Error('heading "' + r.t.slice(0, 40) + '", owner asked "The shame of living:"');
      if (!r.titles.length || r.titles.some((x) => r.t.indexOf(x) < 0)) throw new Error('purchases not all listed: ' + r.titles);
      const learned = await pg.evaluate(() => window.__night.N1.endLearned);
      if (r.t.indexOf(learned) < 0) throw new Error('missing the line "' + learned + '" (item 4)');
      if (r.run || r.mirror) throw new Error('loop still running behind the end card');
      // owner's item 4: at most maxContinue continue-only cards this night; the end card says three facts, the log sits behind Details
      const e = await pg.evaluate(() => { const N = window.__night, f = (document.querySelector('#card_end .facts') || {}).textContent || '', d = document.querySelector('#card_end details#endLog'); return { n: N.NS.contCount, max: N.N1.maxContinue, facts: /Laughs earned/.test(f) && /laughed hardest at/.test(f) && /Mask/.test(f), log: !!d && !d.open && !!d.querySelector('.sum') }; });
      if (e.n > e.max) throw new Error(`${e.n} continue-only cards, at most ${e.max}`);
      if (!e.facts || !e.log) throw new Error('end card brief ' + JSON.stringify(e));
      console.log('    continue-only cards', e.n, 'of at most', e.max);
    });
    await step('music: backstage, ring and after each get their track, one sounds at a time (owner 22 Nov)', async () => {
      await sleep(2500);
      const m = await pg.evaluate(musicState), vol = await pg.evaluate(() => { const N = window.__night, s = N.N1.musicSoft[N.NS.scene]; return N.N1.musicVol * (s === undefined ? 1 : s); }), full = await pg.evaluate(() => window.__night.N1.musicVol);
      if (!(vol < full - 0.05)) throw new Error('the end card is a room scene: its music must be softer than the walk, got ' + vol + ' of ' + full);
      console.log('    music trail', m && m.trail, '| playing', m && m.playing.join(','), '| gains', m && JSON.stringify(m.gain));
      if (!m || m.trail !== 'cold waltz weight' || m.playing.join() !== m.want || m.key !== m.want) throw new Error('music ' + JSON.stringify(m));
      for (const k in m.gain) if (Math.abs(m.gain[k] - (k === m.key ? vol : 0)) > 0.02) throw new Error('gain ' + k + ' ' + m.gain[k]);
    });
    console.log(sc.n, errs.length ? 'ERRORS\n  ' + errs.slice(0, 8).join('\n  ') : 'no page errors');
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`RESULT night1 smoke ${nOk} of ${nAll} pass${process.env.MUTATE ? ' (MUTATE=' + process.env.MUTATE + ')' : ''}`);
  process.exitCode = nOk === nAll ? 0 : 1;
})();

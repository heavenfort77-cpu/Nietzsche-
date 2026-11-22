// One pass through night1.html in GDD order (desktop 1280x720, phone 390x844): page errors, each scene reached, a few frames.
// Needs web/step0/cube25d/setup.sh first. Usage: node web/step0/smoke_night1.cjs [out dir]; ONLY=desk|phone; CHROME=<path>; N_AT=out|in|both overrides N1.nietzscheAt.
// MUTATE=<name> serves a page with one feature broken (see MUTS); the matching step must FAIL.
// Screens: desk 1280x720, phone 390x844, land 844x390 (land plays the Mirror World as a loss to cover the small win's loss branch).
// Ends with RESULT night1 smoke <passed> of <steps> pass.
// Waits are on game state (software GL runs about 9 fps and frame time is capped at 0.05 s, so game time runs slower than wall time).
const path = require('path'), http = require('http'), fs = require('fs');
function need(names) { for (const n of names) { try { return require(n); } catch (e) { /* next */ } } console.error('Missing playwright'); process.exit(2); }
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core')]);
const ROOT = __dirname, OUT = process.argv[2] || '/tmp/night1';
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
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
  whisperfeed: ['night1.html', 'w.hp += falls * N1.whisperFeed.hp;', ''],
  host: ['night1.html', "NS.cue.src = 'cue_model.html?host=night1';", "NS.cue.src = 'cue_model.html';"],
  jokes: ['night1.html', 'corridorJokes: true,', 'corridorJokes: false,'],
  mergekept: ['night1.html', 'mergeKept: true,', 'mergeKept: false,'],
  endbrief: ['night1.html', 'endBrief: true,', 'endBrief: false,'],
  shoplow: ['night1.html', '.card.shopAt { background: linear-gradient(90deg, #0c0809e6 0, #0c0809cc 32%, #0c080900 42%); align-items: flex-start; justify-content: center; text-align: left; gap: 8px; padding: 16px 0 16px 3%; }', '.card.shopAt { justify-content: center; }'],
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
    const step = async (name, fn) => { nAll++; try { await fn(); const s = await pg.evaluate(() => window.__night && window.__night.NS.scene); nOk++; console.log(sc.n, 'OK  ', name, '| scene', s); } catch (e) { console.log(sc.n, 'FAIL', name, String(e.message).split('\n')[0]); } await seen(name).catch(() => {}); };
    const shot = (n) => pg.screenshot({ path: `${OUT}/${sc.n}_${n}.png` });
    await pg.goto(url);
    await step('loads', async () => { await pg.waitForFunction(() => window.__night && window.__night.S.ready, null, { timeout: 120000 }); });
    const nAt = process.env.N_AT || await pg.evaluate(() => window.__night.N1.nietzscheAt);
    await pg.evaluate((a) => { window.__night.NS.nAt = a; }, nAt);
    await step('logo then title', async () => { await sleep(3400); await pg.waitForSelector('#logo.hidden', { state: 'attached', timeout: 2000 }); });
    await step('start: at the mirror', async () => { await pg.click('#start'); await sleep(1500); });
    await step('first input finishes the paint', async () => { await pg.mouse.click(sc.w / 2, sc.h / 3); await pg.waitForSelector('#card_dazai', { timeout: 30000 }); await shot('paint'); });
    await step('go out: corridor', async () => { await pg.click('#goOut'); await sleep(900); await pg.waitForFunction(() => window.__night.S.shot === 'corridor'); });
    const tp = (x, y) => pg.evaluate(([x, y]) => { const S = window.__night.S; S.x = x; S.y = y; }, [x, y]);
    const verb = async (x, y, v) => { await pg.waitForFunction(() => !window.__night.NS.anim, null, { timeout: 15000 }); await tp(x, y); await sleep(500); const vis = await pg.isVisible('#verb'); if (!vis) throw new Error('no verb button for ' + v); await pg.click('#verb'); await sleep(1100); const done = await pg.evaluate((v) => window.__night.NS.verbs[v], v); if (!done) throw new Error(v + ' not done'); };
    await step('cable blocks before the jump', async () => { await tp(0.15, 7.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await sleep(1500); await pg.evaluate(() => { window.__night.input.ty = 0; }); const y = await pg.evaluate(() => window.__night.S.y); if (y > 7.95) throw new Error('walked through the cable, y ' + y); await shot('cable'); });
    await step('jump the cable', () => verb(0.15, 7.4, 'jump'));
    await step('take the pie', () => verb(1.0, 9.0, 'take'));
    await step('honk the horn', () => verb(0.5, 12.2, 'honk'));
    // harsh panel H2: the button must not tell the player it is on purpose before the child does
    // owner's item 5 (H7): one physical joke per verb: the horn honks back late, the rigger trips on the cable, he sniffs the pie
    await step('corridor: one physical joke per verb (item 5)', async () => { await pg.waitForFunction(() => { const j = window.__night.NS.jokes; return j.echo && j.rigger && j.sniff; }, null, { timeout: 20000 }).catch(async () => { throw new Error('jokes ' + JSON.stringify(await pg.evaluate(() => window.__night.NS.jokes))); }); });
    await step('trip button does not say "on purpose" (H2)', async () => { await tp(-1.3, 17.0); await sleep(500); const t = await pg.textContent('#verb'); if (!/^Trip\b/.test(t) || /purpose/i.test(t)) throw new Error('verb reads "' + t + '"'); });
    await step('trip for the child', async () => { await verb(-1.3, 17.0, 'trip'); await pg.waitForFunction(() => /on purpose/.test(window.__night.crew[4].lab.textContent), null, { timeout: 8000 }); await shot('child'); });
    await step('ring edge: board', async () => { await tp(-1.3, 18.3); await pg.evaluate(() => { window.__night.input.ty = 1; }); await pg.waitForSelector('#card_board', { timeout: 8000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); });
    await step('board: act page opens', async () => { await pg.click('[data-act="fall"]'); await pg.waitForFunction(() => { const f = document.getElementById('cueFrame'); return f && f.contentWindow.__game; }, null, { timeout: 60000 }); await sleep(2000); await shot('act'); });
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
    await step('crowd card (stand-in act result)', async () => { await pg.evaluate(() => { const N = window.__night; N.NS.actInfo = { scene: 'results', perfects: 2, goods: 4, misses: 1, actLaughs: 45, mask: 2 }; N.crowdCard(); }); await pg.waitForSelector('#card_crowd'); });
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
    await step('walk back to the room', async () => { await pg.click('#walkBack'); await sleep(800); await tp(0, 2.8); await pg.evaluate(() => { window.__night.input.ty = -1; }); await pg.waitForFunction(() => window.__night.S.room, null, { timeout: 10000 }); await pg.evaluate(() => { window.__night.input.ty = 0; }); await sleep(800); });
    await step('turn to the mirror wall, sit button', async () => { for (let i = 0; i < 4; i++) { const v = await pg.evaluate(() => window.__night.S.roomView); if (v === 'mirror') break; await pg.click('#roomR'); await sleep(500); } await pg.waitForSelector('#sit:not(.hidden)', { timeout: 3000 }); });
    await step('mirror entry: sit, reflection late, cracks', async () => { await pg.click('#sit'); await sleep(700); await pg.mouse.click(sc.w / 2, sc.h / 2); await sleep(420); await shot('entry'); await sleep(900); const n = await pg.evaluate(() => window.__night.NS.cracks); if (n < 1) throw new Error('no crack'); });
    if (nAt === 'in' || nAt === 'both') await step('Nietzsche line at the mirror before he goes in', async () => { await pg.waitForSelector('#card_nietzscheIn', { timeout: 10000 }); const t = await pg.textContent('#card_nietzscheIn .quote'); console.log('   in:', t.slice(0, 60)); await shot('nietzsche_in'); await pg.click('#goIn'); });
    await step('fog into the Mirror World', async () => { await pg.waitForFunction(() => window.__night.S.mode === 'mw', null, { timeout: 8000 }); await sleep(1500); await shot('mw'); const k = await pg.evaluate(() => window.__night.foes.map((f) => f.kind).join(',')); console.log('   foes', k); });
    // H1: each fall in the act feeds the Whisper (stand-in act: 1 miss)
    await step('the Whisper is fed by each fall (H1)', async () => { const r = await pg.evaluate(() => { const N = window.__night, w = N.foes.find((f) => f.kind === 'whisper'); return w ? { hp: w.hp, base: N.N1.whisper.hp, per: N.N1.whisperFeed.hp, falls: N.NS.hurt.falls, mul: w.speedMul } : null; }); if (!r) throw new Error('no Whisper after a fall'); if (r.hp !== r.base + r.falls * r.per || !(r.mul > 1)) throw new Error('Whisper not fed ' + JSON.stringify(r)); });
    await step('gags: slap, pie, pratfall', async () => { await pg.keyboard.press('KeyJ'); await sleep(600); await pg.keyboard.press('KeyK'); await sleep(700); await pg.keyboard.press('Space'); await sleep(900); const M = await pg.evaluate(() => { const M = window.__night.M; return { l: M.laughs, p: window.__night.NS.pies }; }); console.log('   laughs', M.l.toFixed(1), 'pies', M.p); });
    await step('stand still in the beam beats the Light', async () => { await pg.evaluate(() => { const N = window.__night, L = N.foes[0]; N.M.x = L.spotX; N.M.z = L.spotZ; }); await pg.waitForFunction(() => !window.__night.foes[0].alive, null, { timeout: 20000 }); });
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
    console.log(sc.n, errs.length ? 'ERRORS\n  ' + errs.slice(0, 8).join('\n  ') : 'no page errors');
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`RESULT night1 smoke ${nOk} of ${nAll} pass${process.env.MUTATE ? ' (MUTATE=' + process.env.MUTATE + ')' : ''}`);
  process.exitCode = nOk === nAll ? 0 : 1;
})();

// Browser checks for cue.html in headless Chrome. Usage: node smoke_cue.cjs
// 1. Boots and plays a night-3 act to the results panel at desktop and phone sizes, no page errors.
// 2. Probes: no Web Audio; an audio clock that never runs; Space on a focused panel button during an act;
//    a pad touch cancelled by the browser must release the pad.
'use strict';
const path = require('path');
function need(names) {
  for (const n of names) { try { return require(n); } catch (e) { /* next */ } }
  console.error('Missing playwright'); process.exit(2);
}
const pw = need(['playwright-core', path.join(__dirname, '..', 'node_modules', 'playwright-core'), '/opt/npm-tools/node_modules/playwright']);
const URL = 'file://' + path.join(__dirname, 'cue.html');
const NO_AUDIO = 'delete window.AudioContext; delete window.webkitAudioContext;';
const FROZEN_AUDIO = 'Object.defineProperty(BaseAudioContext.prototype, "currentTime", { get() { return 0; } });' +
  'Object.defineProperty(BaseAudioContext.prototype, "state", { get() { return "suspended"; } });' +
  'AudioContext.prototype.resume = function () { return Promise.resolve(); };';

async function newPage(browser, vp, init, fails) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  if (init) await page.addInitScript(init);
  page.on('pageerror', (e) => fails.push(`${vp.name}: page error ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') fails.push(`${vp.name}: console error ${m.text()}`); });
  await page.goto(URL);
  return page;
}
async function playToResults(page, vp, night, fails) {
  await page.click(`[data-night="${night}"]`);
  await page.click('#btnStart');
  if (!(await page.isVisible('#padHit'))) fails.push(`${vp.name}: hit pad not shown during act`);
  const ok = await page.waitForFunction(() => window.__game.info().scene === 'results', null, { timeout: 30000 }).then(() => true, () => false);
  if (!ok) fails.push(`${vp.name}: results not reached in 30 s (act clock frozen?)`);
  return ok;
}
async function spaceOnFocusedButton(browser, fails) {
  const vp = { name: 'space-focus', width: 1280, height: 800, mobile: false };
  const page = await newPage(browser, vp, null, fails);
  await page.focus('#btnStart');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const before = (await page.evaluate(() => window.__game.info())).actCount;
  for (let k = 0; k < 4; k++) { await page.keyboard.press('Space'); await page.waitForTimeout(120); }
  const after = (await page.evaluate(() => window.__game.info())).actCount;
  if (after !== before) fails.push(`space-focus: Space during the act restarted it ${after - before} times (focused panel button)`);
  await page.close();
}
async function padCancel(browser, fails) {
  const vp = { name: 'pad-cancel', width: 390, height: 844, mobile: true };
  const page = await newPage(browser, vp, null, fails);
  await page.click('#btnStart');
  await page.dispatchEvent('#padHit', 'pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true });
  await page.dispatchEvent('#padHit', 'pointercancel', { pointerId: 1, pointerType: 'touch', isPrimary: true });
  const stuck = await page.evaluate(() => document.getElementById('padHit').classList.contains('down'));
  if (stuck) fails.push('pad-cancel: hit pad stays pressed after the browser cancels the touch');
  await page.close();
}
(async () => {
  const browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const fails = [];
  const vps = [{ name: 'desktop 1280x800', width: 1280, height: 800, mobile: false }, { name: 'phone 390x844', width: 390, height: 844, mobile: true }];
  for (const vp of vps) {
    const page = await newPage(browser, vp, null, fails);
    if (await playToResults(page, vp, 3, fails)) {
      const res = await page.textContent('#resText');
      if (!/Night 3/.test(res)) fails.push(`${vp.name}: results text missing`);
    }
    await page.close();
  }
  const STUCK_RUNNING = 'Object.defineProperty(BaseAudioContext.prototype, "currentTime", { get() { return 0; } });';
  for (const [name, init] of [['no Web Audio', NO_AUDIO], ['audio clock never runs', FROZEN_AUDIO], ['audio clock stuck while running', STUCK_RUNNING]]) {
    const vp = { name, width: 1280, height: 800, mobile: false };
    const page = await newPage(browser, vp, init, fails);
    await playToResults(page, vp, 1, fails);
    await page.close();
  }
  await spaceOnFocusedButton(browser, fails);
  await padCancel(browser, fails);
  await browser.close();
  fails.forEach((f) => console.log('FAIL  ' + f));
  console.log(`BROWSER CHECKS ${fails.length ? 'FAIL' : 'PASS'} (5 scenarios + 2 play-throughs)`);
  console.log('RESULT ' + (fails.length ? 'FAIL' : 'PASS'));
  process.exit(fails.length ? 1 : 0);
})();

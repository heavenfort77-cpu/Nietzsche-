// Browser smoke check for cue.html in headless Chrome: boots, starts a night-3 act with real audio clock,
// presses on the drum grid, reaches the results panel, no page errors. Usage: node smoke_cue.cjs
'use strict';
const path = require('path');
const pw = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await pw.chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const fails = [];
  for (const vp of [{ width: 1280, height: 800, mobile: false }, { width: 390, height: 844, mobile: true }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
    page.on('pageerror', (e) => fails.push(`${vp.width}: page error ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') fails.push(`${vp.width}: console error ${m.text()}`); });
    await page.goto('file://' + path.join(__dirname, 'cue.html'));
    await page.click('[data-night="3"]');
    await page.click('#btnStart');
    const pads = await page.isVisible('#padHit');
    if (!pads) fails.push(`${vp.width}: hit pad not shown during act`);
    await page.waitForFunction(() => window.__game.info().scene === 'results', null, { timeout: 30000 }).catch(() => fails.push(`${vp.width}: results not reached in 30 s`));
    const info = await page.evaluate(() => window.__game.info());
    const res = await page.textContent('#resText');
    if (!/Night 3/.test(res)) fails.push(`${vp.width}: results text missing`);
    console.log(`INFO ${vp.width}x${vp.height}: phone windows ${info.phone}, end "${info.endReason}", beats ${info.beatCount}`);
    await page.close();
  }
  await browser.close();
  fails.forEach((f) => console.log('FAIL  ' + f));
  console.log('RESULT ' + (fails.length ? 'FAIL' : 'PASS'));
  process.exit(fails.length ? 1 : 0);
})();

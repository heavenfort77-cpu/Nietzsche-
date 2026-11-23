// Session 25: every mutation's anchor text is found exactly once in the file it breaks (smoke_night1, smoke_games, smoke_nights).
// A missing anchor makes that mutation fail "on another step" and hides whether its rule is still checked (run 99: shoplow after F35).
// Usage: node check_anchors.cjs [web/step0 dir]; prints FAIL lines and RESULT anchors <ok> of <n>; exit 1 on any FAIL. Static, no browser.
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || __dirname);
let ok = 0, n = 0;
for (const f of ['smoke_night1.cjs', 'smoke_games.cjs', 'smoke_nights.cjs']) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8'), a = t.indexOf('const MUTS = {'), b = t.indexOf('\n};', a);
  const MUTS = eval('(' + t.slice(a + 13, b + 2) + ')');
  for (const [k, m] of Object.entries(MUTS)) {
    n++;
    let p = path.join(dir, m[0]); if (!fs.existsSync(p)) p = path.join(dir, 'cube25d', m[0]);
    const c = fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split(m[1]).length - 1 : -1;
    if (c === 1) ok++; else console.log(`FAIL ${f} mutation ${k}: anchor found ${c < 0 ? 'no file' : c + ' times'} in ${m[0]}`);
  }
}
console.log(`RESULT anchors ${ok} of ${n} found once`);
process.exitCode = ok === n ? 0 : 1;

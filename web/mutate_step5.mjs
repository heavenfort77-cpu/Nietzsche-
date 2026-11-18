// Break each step 5 rule in a copy of the game page and require its gate to FAIL; then the real page must pass.
// node mutate_step5.mjs
import fs from 'fs'; import { execFileSync } from 'child_process';
const DIR = 'game';
const SRC = fs.readFileSync(`${DIR}/index.html`, 'utf8');
// name -> [old text, new text, gate that must fail]
const CASES = {
  crowdnofreeze: ['p.y += beat * uBob * uExcite;', 'p.y += beat * uBob;', 'crowd freezes at excitement 0'],
  confettifalls: ['  c.y = mix(max(c.y, uFloor + uExt), uFloor, landed);', '  c.y = mix(c.y - 0.2, uFloor, landed);', 'confetti never below the floor'],
  drawblowup: ['scene.add(parts.set);', 'scene.add(parts.set); for (let i = 0; i < 200; i++) scene.add(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshBasicMaterial()));', 'draw calls per frame'],
  nobloom: ['luminanceThreshold: p.bloomThreshold', 'luminanceThreshold: 100.0', 'bloom glows round the bulbs'],
  noshadow: ['spot.castShadow = true;', 'spot.castShadow = false;', 'clown casts a shadow'],
  nobeam: ['uStrength: { value: CONFIG.ring.beamStrength }', 'uStrength: { value: 0.0 }', 'light beam visible'],
  keynodim: ['multiplyScalar(r.poolMin + (1 - r.poolMin) * inPool)', 'multiplyScalar(1.0)', 'key light dims at the ring edge'],
  darkclown: ['    keyS: 1.0,', '    keyS: 0.15,', 'clown readable in the spot'],
  noscatter: ['    straw: 1600,', '    straw: 0,', 'desktop density'],
  nowrap: ['.bar__group { display: flex; flex-wrap: wrap;', '.bar__group { display: flex; flex-wrap: nowrap;', 'controls on screen at 390x844'],
};
let fired = 0;
const run = (page) => { try { return execFileSync('node', ['check_step5.mjs', DIR, page], { encoding: 'utf8', timeout: 900000 }); } catch (e) { return String(e.stdout || ''); } };
for (const [name, [a, b, gate]] of Object.entries(CASES)) {
  if (!SRC.includes(a)) { console.log(`FAIL mutation ${name}: text not found (page changed?)`); continue; }
  const page = `mut_${name}.html`;
  fs.writeFileSync(`${DIR}/${page}`, SRC.replace(a, b));
  const line = run(page).split('\n').find((l) => l.includes(gate)) || 'gate line not found';
  fs.unlinkSync(`${DIR}/${page}`);
  const ok = line.startsWith('FAIL'); fired += ok;
  console.log(`${ok ? 'PASS' : 'FAIL'} mutation ${name} -> "${gate}" fires | ${line.slice(0, 120)}`);
}
const last = run('index.html').trim().split('\n').pop();
console.log(`${/RESULT (\d+) of \1 pass/.test(last) ? 'PASS' : 'FAIL'} real page: ${last}`);
console.log(`RESULT mutations ${fired} of ${Object.keys(CASES).length} fired`);

// Break each step 4 rule in a copy of the viewer page and require its gate to FAIL; then the real page must pass.
// node mutate_step4.mjs
import fs from 'fs'; import { execFileSync } from 'child_process';
const DIR = 'game';
const SRC = fs.readFileSync(`${DIR}/index.html`, 'utf8');
// name -> [old text, new text, gate that must fail]
const CASES = {
  statichull: ['const hull = new THREE.SkinnedMesh(hullGeo, hullMat);\n  hull.bind(body.skeleton, body.bindMatrix);\n  // culled like the body: bounds from the posed mesh, grown so the outline and swinging limbs stay inside\n  hull.computeBoundingSphere(); hull.boundingSphere.radius *= CONFIG.hullBoundsGrow;', 'const hull = new THREE.Mesh(hullGeo, hullMat);', 'outline stays on the body: walk 0.25s'],
  unbound: ['const hull = new THREE.SkinnedMesh(hullGeo, hullMat);\n  hull.bind(body.skeleton, body.bindMatrix);\n  // culled like the body: bounds from the posed mesh, grown so the outline and swinging limbs stay inside\n  hull.computeBoundingSphere(); hull.boundingSphere.radius *= CONFIG.hullBoundsGrow;', 'const hull = new THREE.Mesh(hullGeo, hullMat);', 'outline bound to the body skeleton'],
  warmmirror: ['      gradeAmt: 0.6,', '      gradeAmt: 0.0,', 'mirror: blouse hue'],
  darkmirror: ['      keyS: 0.75,', '      keyS: 0.05,', 'mirror: blouse readable'],
  speceverywhere: ['col += uKeyCol * glint * vSpec * uSpecOn;', 'col += uKeyCol * glint * uSpecOn;', 'shine shows, never on the blouse'],
  paintignored: ['p.a * uPaintAmt * keep', 'p.a * keep', 'paint amount changes the face'],
  noflake: ['float keep = step(uFlake, vnoise(vUv * uFlakeScale));', 'float keep = 1.0;', 'flake 0.5 removes'],
  extradraw: ['parts.body.parent.add(parts.hull);', 'parts.body.parent.add(parts.hull, parts.hull.clone());', 'draw calls <= 3'],
};
let fired = 0;
const run = (page) => { try { return execFileSync('node', ['check_step4.mjs', DIR, page], { encoding: 'utf8', timeout: 600000 }); } catch (e) { return String(e.stdout || ''); } };
for (const [name, [a, b, gate]] of Object.entries(CASES)) {
  if (!SRC.includes(a)) { console.log(`FAIL mutation ${name}: text not found (page changed?)`); continue; }
  const page = `mut_${name}.html`;
  fs.writeFileSync(`${DIR}/${page}`, SRC.replace(a, b));
  const line = run(page).split('\n').find((l) => l.includes(gate)) || 'gate line not found';
  fs.unlinkSync(`${DIR}/${page}`);
  const ok = line.startsWith('FAIL'); fired += ok;
  console.log(`${ok ? 'PASS' : 'FAIL'} mutation ${name} -> "${gate}" fires | ${line.slice(0, 120)}`);
}
const real = run('index.html');
const last = real.trim().split('\n').pop();
console.log(`${/RESULT (\d+) of \1 pass/.test(last) ? 'PASS' : 'FAIL'} real page: ${last}`);
console.log(`RESULT mutations ${fired} of ${Object.keys(CASES).length} fired`);

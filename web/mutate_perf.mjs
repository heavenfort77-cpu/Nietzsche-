// Put each Dawnpunk lag-report mistake back into a copy of the game page and require its perf gate to FAIL;
// then the real page must pass. node mutate_perf.mjs [case,case,...] (no list: all cases; CI splits them in shards)
import fs from 'fs'; import { execFileSync } from 'child_process';
const DIR = 'game';
const SRC = fs.readFileSync(`${DIR}/index.html`, 'utf8');
// name -> [[old text, new text], ...], gate that must fail
const CASES = {
  dense: [[['    confetti: 2500,', '    confetti: 300000,']], '1. 1920x1080: density held and triangles'],
  aofullres: [[['ao.configuration.halfRes = true;', 'ao.configuration.halfRes = false;']], '2. ambient occlusion'],
  nocull: [[['  hull.computeBoundingSphere(); hull.boundingSphere.radius *= CONFIG.hullBoundsGrow;', '  hull.frustumCulled = false;']], '4. frustum culling'],
  bigtex: [[['  scene.add(parts.set);', '  scene.add(parts.set);\n  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), new THREE.MeshBasicMaterial({ map: new THREE.DataTexture(new Uint8Array(4096 * 4096 * 4), 4096, 4096) })));']], '5. texture memory'],
  maxdpr: [[['dprStepsDesktop: Object.freeze([1.25, 1]),', 'dprStepsDesktop: Object.freeze([2, 1.25, 1]),']], '6. desktop starts'],
  aosamples: [[["ao.setQualityMode('Performance');", "ao.setQualityMode('Medium');"]], '2. ambient occlusion'],
  aniso: [[['t.anisotropy = CONFIG.maxAniso;', 't.anisotropy = 16;']], '5. texture memory'],
  zerolight: [[['  const spot = new THREE.SpotLight(s.color, 1, 0,', '  const spot = new THREE.SpotLight(s.color, 0, 0,']], '7. lights'],
  crowdnocull: [[['  mesh.computeBoundingSphere(); mesh.boundingSphere.radius += r.cardH + CONFIG.boundsPad;', '  mesh.frustumCulled = false;']], '4. frustum culling'],
  noctx: [[["canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); view.lost = true; });", "canvas.addEventListener('webglcontextlost', () => { view.lost = true; });"]], '12. WebGL context'],
  govstuck: [[['  gov.fastFor = 0;\n  if (gov.level < gov.steps.length - 1) {', '  gov.fastFor = 0;\n  if (gov.level < 0) {']], '6. governor: steps'],
  sixlights: [[['  scene.add(spot, spot.target); parts.spot = spot;', '  scene.add(spot, spot.target); parts.spot = spot;\n  for (let k = 0; k < 6; k++) scene.add(new THREE.PointLight(0xffffff, 0));']], '7. lights'],
  litset: [[['o.material = new THREE.MeshBasicMaterial({ map: o.material.map, fog: true, side: THREE.DoubleSide });', 'o.material = new THREE.MeshStandardMaterial({ map: o.material.map, side: THREE.DoubleSide });']], '7. lights'],
  bigshadow: [[['    shadowMap: 2048,', '    shadowMap: 4096,']], '8. shadow map'],
  inlined: [[['</html>', `<!-- ${'A'.repeat(300000)} -->\n</html>`]], '9. load'],
  latefetch: [[['  if (fpsChanged) drawHud();', "  if (fpsChanged) { drawHud(); fetch('./assets/ring_layout.json'); }"]], '9. no requests during play'],
  hudevery: [[['  if (t === hudText) return;\n', ''], ['  if (fpsChanged) drawHud();', '  drawHud();']], '10. per frame'],
  mmframe: [[['  const fpsChanged = stepFps(raw);', "  const fpsChanged = stepFps(raw);\n  matchMedia('(pointer: coarse)');"]], '10. per frame'],
  nowarm: [[['makePost(); warmUp();', 'makePost();'], ['applyWorld(); applyFace(); setConfetti(true); playClip', 'applyWorld(); applyFace(); setConfetti(false); playClip']], '11. no shader compiles'],
};
const pick = process.argv[2] ? process.argv[2].split(',') : Object.keys(CASES);
let fired = 0;
const run = (page) => { try { return execFileSync('node', ['check_perf.mjs', DIR, page], { encoding: 'utf8', timeout: 1500000 }); } catch (e) { return String(e.stdout || ''); } };
for (const name of pick) {
  const [edits, gate] = CASES[name];
  let src = SRC, found = true;
  for (const [a, b] of edits) { if (src.split(a).length !== 2) found = false; src = src.replace(a, b); }
  if (!found) { console.log(`FAIL mutation ${name}: text not found once (page changed?)`); continue; }
  const page = `mut_${name}.html`;
  fs.writeFileSync(`${DIR}/${page}`, src);
  const line = run(page).split('\n').find((l) => l.includes(gate)) || 'gate line not found';
  fs.unlinkSync(`${DIR}/${page}`);
  const ok = line.startsWith('FAIL'); fired += ok;
  console.log(`${ok ? 'PASS' : 'FAIL'} mutation ${name} -> "${gate}" fires | ${line.slice(0, 140)}`);
}
console.log(`RESULT perf mutations ${fired} of ${pick.length} fired`);

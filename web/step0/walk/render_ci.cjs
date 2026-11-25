// Session 44: renders the walk plates on a GitHub runner (OWNER-REQUIREMENTS 10: no renders on the session box) through the probe workflow.
// Runs build_walk.py (Blender bpy 5.3.0, Python 3.13 from the workflow), converts the colour plates to WebP (quality 82, as cube25d/plates.py),
// runs tools/check_walk_visible.py on the result, and prints every output file as base64 between "BEGIN FILE <name>" and "END FILE" lines
// (the job's log is committed to ci-out/probe-<run>-<i>; the session decodes it from there). Usage: node step0/walk/render_ci.cjs [samples]
const { execSync } = require('child_process'), fs = require('fs'), path = require('path');
const SAMPLES = process.argv[2] || '32', OUT = '/tmp/walk_out', REPO = path.resolve(__dirname, '..', '..', '..');
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28 }).toString();
sh('python3 -m pip install -q bpy==5.3.0 numpy pillow');
const log = sh(`python3 -I ${path.join(__dirname, 'build_walk.py')} -- ${OUT} ${SAMPLES} 100`);
console.log(log.split('\n').filter((l) => /^(RENDERED|DONE)/.test(l)).join('\n'));
sh(`python3 -I -c "
from PIL import Image
for n in ('corridor','wings','entrance'):
    Image.open('${OUT}/'+n+'_color.png').convert('RGB').save('${OUT}/'+n+'_color.webp','WEBP',quality=82,method=6,exact=True)
"`);
let rc = 0;
try { console.log(sh(`python3 -I ${path.join(REPO, 'tools', 'check_walk_visible.py')} ${OUT}`)); } catch (e) { rc = 1; console.log(String(e.stdout || e)); }
for (const f of ['corridor_color.webp', 'wings_color.webp', 'entrance_color.webp', 'corridor_depth.png', 'wings_depth.png', 'entrance_depth.png', 'shots.json']) {
  const b = fs.readFileSync(path.join(OUT, f));
  console.log(`BEGIN FILE ${f} ${b.length}`); console.log(b.toString('base64').replace(/(.{1000})/g, '$1\n')); console.log('END FILE');
}
process.exit(rc);

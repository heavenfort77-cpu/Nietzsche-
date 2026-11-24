"""One self-contained HTML of the night-1 build for a human cold tester (owner 22 Nov 19:38: "give a html file as well i pass to cold tester").
Opens offline from a file (phone or desktop): every asset is packed inside as base64 and served to the page from blob URLs.
The cue page (iframe) is packed as text and shown through srcdoc, so it shares the parent's blobs.
Not the game build: owner rule 43 (no big inlined base64) is for the shipped game; this copy only carries one test.

Usage: python3 tools/bundle_single.py OUT.html   (needs web/step0/cube25d/setup.sh first for lib/ and assets/)
"""
import base64, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'step0')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'night1_single.html'
MIME = {'.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm'}
# packed folders (night1.html and cue_model.html load from these at run time)
DIRS = ['assets', 'cube25d', 'walk/plates', 'music']
SKIP = ('.py', '.sh', '.cjs', '.blend')


def read(p):
    with open(os.path.join(ROOT, p), 'r', encoding='utf-8') as f:
        return f.read()


def b64(p):
    with open(os.path.join(ROOT, p), 'rb') as f:
        return base64.b64encode(f.read()).decode('ascii')


# ES modules: relative imports become bare names the import map resolves (blob URLs cannot resolve relative paths)
MODS = {
    'three': 'lib/build/three.module.js',
    'three/core': 'lib/build/three.core.js',
    'three/addons/loaders/GLTFLoader.js': 'lib/examples/jsm/loaders/GLTFLoader.js',
    'three/addons/utils/BufferGeometryUtils.js': 'lib/examples/jsm/utils/BufferGeometryUtils.js',
    'three/addons/utils/SkeletonUtils.js': 'lib/examples/jsm/utils/SkeletonUtils.js',
    # session 32: compressed cast GLBs
    'three/addons/loaders/KTX2Loader.js': 'lib/examples/jsm/loaders/KTX2Loader.js',
    'three/addons/utils/WorkerPool.js': 'lib/examples/jsm/utils/WorkerPool.js',
    'three/addons/libs/ktx-parse.module.js': 'lib/examples/jsm/libs/ktx-parse.module.js',
    'three/addons/libs/zstddec.module.js': 'lib/examples/jsm/libs/zstddec.module.js',
    'three/addons/libs/meshopt_decoder.module.js': 'lib/examples/jsm/libs/meshopt_decoder.module.js',
    'three/addons/math/ColorSpaces.js': 'lib/examples/jsm/math/ColorSpaces.js',
}
mods = {}
for name, p in MODS.items():
    s = read(p)
    s = s.replace("from './three.core.js'", "from 'three/core'")
    s = s.replace("from '../utils/BufferGeometryUtils.js'", "from 'three/addons/utils/BufferGeometryUtils.js'")
    s = s.replace("from '../utils/SkeletonUtils.js'", "from 'three/addons/utils/SkeletonUtils.js'")
    s = s.replace("from '../utils/WorkerPool.js'", "from 'three/addons/utils/WorkerPool.js'")
    s = re.sub(r"from '\.\./(libs|math)/([^']+)'", r"from 'three/addons/\1/\2'", s)
    # KTX2Loader's default transcoder URLs resolve against import.meta.url, which a blob module cannot do; the page sets its own path (N1.basisDir)
    s = s.replace("new URL( '../libs/basis/basis_transcoder.wasm', import.meta.url ).toString()", "'basis_transcoder.wasm'")
    s = s.replace("new URL( '../libs/basis/basis_transcoder.js', import.meta.url ).toString()", "'basis_transcoder.js'")
    left = re.findall(r"from '\.{1,2}/[^']+'", s) + re.findall(r"new URL\( '\.{1,2}/", s)
    if left:
        raise SystemExit(f'relative import left in {p}: {left[:3]}')
    mods[name] = base64.b64encode(s.encode('utf-8')).decode('ascii')

files = {}
for d in DIRS:
    for dp, _, fs in os.walk(os.path.join(ROOT, d)):
        for f in sorted(fs):
            if f.endswith(SKIP):
                continue
            rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/')
            files[rel] = [MIME.get(os.path.splitext(f)[1], 'application/octet-stream'), b64(rel)]

laugh = read('laugh.js')
IMAPS = re.compile(r'<script type="importmap">.*?</script>\s*', re.S)

# cue page: its laugh.js and model_layer.js inline; the host flag read from the parent (srcdoc has no query string)
cue = read('cue_model.html')
cue = cue.replace('<script src="./laugh.js"></script>', '<script>\n' + laugh + '\n</script>', 1)
cue = cue.replace('<script type="module" src="./cube25d/model_layer.js"></script>', '<script type="module">\n' + read('cube25d/model_layer.js') + '\n</script>', 1)
cue = cue.replace('/[?&]host=/.test(location.search)', '/[?&]host=/.test(window.__cueSearch || location.search)', 1)
if cue.count('window.__cueSearch') != 1:
    raise SystemExit('cue host check not found once')
cue = IMAPS.sub('', cue)
files['cue_model.html'] = ['text/html', base64.b64encode(cue.encode('utf-8')).decode('ascii')]

# boot: runs first in the page (and, from the parent's pack, in the cue frame): blob URLs, fetch / img / iframe mapping, the import map
BOOT = r"""<script>
(function () {
  // the parent is another site when the page is embedded (itch.io): reading it throws, so only a same-site parent (the cue frame's host) is used
  var top = null; try { top = window.parent !== window && window.parent.__PACK ? window.parent.__PACK : null; } catch (e) { top = null; }
  var P = top;
  if (!P) {
    var raw = JSON.parse(document.getElementById('pack').textContent), url = {}, text = {};
    var blob = function (mime, b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], { type: mime }); };
    for (var k in raw.files) { url[k] = URL.createObjectURL(blob(raw.files[k][0], raw.files[k][1])); if (raw.files[k][0] === 'text/html') text[k] = new TextDecoder().decode(new Uint8Array(atob(raw.files[k][1]).split('').map(function (c) { return c.charCodeAt(0); }))); }
    var mods = {}; for (var m in raw.mods) mods[m] = URL.createObjectURL(blob('text/javascript', raw.mods[m]));
    P = window.__PACK = { url: url, text: text, mods: mods, base: location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''), cueSearch: '' };
    document.getElementById('pack').remove();
  } else window.__cueSearch = P.cueSearch;
  var key = function (u) {
    u = String(u); if (/^(blob|data):/.test(u)) return null;
    if (u.indexOf(P.base) === 0) u = u.slice(P.base.length);
    u = u.replace(/^\.\//, '').split('?')[0].split('#')[0];
    return P.url[u] ? u : null;
  };
  var f0 = window.fetch;
  window.fetch = function (input, init) { var k = key(typeof input === 'string' ? input : input.url); return f0.call(window, k ? P.url[k] : input, init); };
  var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { get: d.get, set: function (v) { var k = key(v); d.set.call(this, k ? P.url[k] : v); }, configurable: true });
  var md = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  Object.defineProperty(HTMLMediaElement.prototype, 'src', { get: md.get, set: function (v) { var k = key(v); md.set.call(this, k ? P.url[k] : v); }, configurable: true });
  var fd = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
  Object.defineProperty(HTMLIFrameElement.prototype, 'src', { get: fd.get, set: function (v) {
    var s = String(v), k = s.replace(/^\.\//, '').split('?')[0];
    if (P.text[k]) { P.cueSearch = s.indexOf('?') >= 0 ? s.slice(s.indexOf('?')) : ''; this.srcdoc = P.text[k]; return; }
    fd.set.call(this, v); }, configurable: true });
  var map = { imports: {} }; for (var n in P.mods) map.imports[n] = P.mods[n];
  document.write('<script type="importmap">' + JSON.stringify(map) + '<\/script>');
})();
</script>
"""

page = read('night1.html')
page = page.replace('<script src="./laugh.js"></script>', '<script>\n' + laugh + '\n</script>', 1)
page = IMAPS.sub('', page)
# the cue page gets the boot too (it reads the parent's pack)
files['cue_model.html'][1] = base64.b64encode(re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + BOOT, cue, count=1).encode('utf-8')).decode('ascii')
pack = json.dumps({'files': files, 'mods': mods}, separators=(',', ':'))
head = '<script type="application/json" id="pack">' + pack + '</script>\n' + BOOT
page, n = re.subn(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + head, page, count=1)
if n != 1:
    raise SystemExit('no <head> in night1.html')
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(page)
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB,', len(files), 'files packed')

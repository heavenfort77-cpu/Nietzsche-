"""Probe (owner requirement 5): every face cell in the game page CONFIG.faces samples inside the face atlas
and its area holds drawn features (eyes, brows, mouth), for the face mesh's real UV area.
Same atlas rule as F13: loaded with flipY false, so rows run down and the lower cells are at v + 0.5.
Usage: python3 -I probe_face_cells.py PAGE GLB ATLAS   (OLD=1 uses the offsets before the fix)"""
import json, os, re, struct, sys
import numpy as np
from PIL import Image

page, glb, atlas = sys.argv[1:4]
# offsets before the session 10 fix, for the before/after probe
OLD = {'sad': [0, 0], 'smile': [0.5, 0], 'startle': [0, -0.5], 'wince': [0.5, -0.5]}
# share of dark feature pixels a cell's face area must hold
MIN_DARK = 0.01
# luma under this counts as a feature pixel (eyes, brows, mouth lines)
DARK_LUMA = 60

if os.environ.get('OLD'):
    cells = OLD
else:
    m = re.search(r"faces: Object\.freeze\((\{[^}]*\})\)", open(page).read())
    cells = json.loads(re.sub(r'(\w+):', r'"\1":', m.group(1)))

b = open(glb, 'rb').read()
n = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + n])
binoff = 20 + n + 8
face_mat = next(i for i, mt in enumerate(j['materials']) if mt.get('name') == 'face')
uv = None
for mesh in j['meshes']:
    for p in mesh['primitives']:
        if p.get('material') == face_mat:
            a = j['accessors'][p['attributes']['TEXCOORD_0']]
            bv = j['bufferViews'][a['bufferView']]
            uv = np.frombuffer(b, np.float32, a['count'] * 2, binoff + bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, 2)
im = np.asarray(Image.open(atlas).convert('RGB'), dtype=np.float32)
h, w = im.shape[:2]
luma = im @ np.array([0.2126, 0.7152, 0.0722], np.float32)
fail = 0
# the atlas area the face mesh's UVs span (its bounding box), moved by each cell offset
u0, v0 = uv.min(0)
u1, v1 = uv.max(0)
for name, c in cells.items():
    a0, a1, b0, b1 = u0 + c[0], u1 + c[0], v0 + c[1], v1 + c[1]
    inside = a0 >= 0 and a1 <= 1 and b0 >= 0 and b1 <= 1
    # flipY false: texture v = 0 is the image's first row
    x0, x1 = int(max(0, a0) * w), int(min(1, a1) * w)
    y0, y1 = int(max(0, b0) * h), int(min(1, b1) * h)
    region = luma[y0:y1, x0:x1]
    dark = float((region < DARK_LUMA).mean()) if region.size else 0.0
    ok = inside and dark >= MIN_DARK
    fail += not ok
    print(f"{'PASS' if ok else 'FAIL'}  face {name} [{c[0]},{c[1]}]: face UV area u {a0:.2f}-{a1:.2f} v {b0:.2f}-{b1:.2f} inside the atlas {'yes' if inside else 'no'}, feature pixels {dark * 100:.1f}% (min {MIN_DARK * 100:.0f}%)")
print('RESULT PASS' if not fail else f'RESULT FAIL {fail}')
sys.exit(1 if fail else 0)

"""Side-by-side of the approved render and the v2 render of one character, same camera, lights and scale.
python3 -I side_by_side.py <char> <approved dir> <v2 prefix> <out jpg>
Prints one line per view (figure height, width, feet row, centre x, both renders) and a PASS/FAIL gate on height.
Width is printed, not gated: the v2 bind pose (A-pose arms) differs from the approved pose on purpose."""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import render3d

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # views compared, in sheet row order
    views=('front', 'three_quarter', 'side', 'back'),
    # a pixel is figure when its RGB differs from the backdrop by more than this (sum of channels)
    mask_diff=24,
    # floor shadow, not figure: darker than the backdrop by at most this ratio in every channel...
    shadow_max=1.04,
    # ...with the channel ratios this close together (a shadow keeps the backdrop's hue)
    shadow_spread=0.12,
    # gate: v2 figure height within this fraction of the approved height, front view
    height_tol=0.03,
    # gate: v2 feet row within this many pixels of the approved feet row, front view (1024 px render)
    feet_tol=12,
    # sheet: size of each image in the sheet (pixels)
    cell=512,
)

def backdrop(name, W, H):
    """The same soft pool render3d.backdrop composites under the figure, without a figure."""
    w = render3d.CONFIG[render3d.CONFIG['world'][name]]
    bg = np.array([int(w['bg'][i:i + 2], 16) for i in (1, 3, 5)], float)
    glow = np.array(w['key']) * 255 * 0.22 + bg * 0.78
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.42)) ** 2 + ((yy - H * 0.62) / (H * 0.55)) ** 2)
    t = np.clip(1 - d, 0, 1)[..., None] ** 1.6
    return (bg * (1 - t) + glow * t).astype(np.uint8).astype(float)

def measure(path, name):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    b = backdrop(name, a.shape[1], a.shape[0])
    k = a / np.maximum(b, 1)
    shadow = (k.max(2) <= CONFIG['shadow_max']) & (k.max(2) - k.min(2) < CONFIG['shadow_spread'])
    m = (np.abs(a - b).sum(2) > CONFIG['mask_diff']) & ~shadow
    ys, xs = np.nonzero(m)
    if len(ys) == 0: return None
    return dict(top=int(ys.min()), feet=int(ys.max()), height=int(ys.max() - ys.min() + 1),
                width=int(xs.max() - xs.min() + 1), cx=round(float(xs.mean()), 1))

def main(char, adir, v2, out):
    c = CONFIG['cell']; rows = []; ok = True
    for v in CONFIG['views']:
        pa, pb = os.path.join(adir, f'{char}_{v}.png'), f'{v2}_{v}.png'
        ma, mb = measure(pa, char), measure(pb, char)
        print(f'INFO {char} {v}: approved {ma} | v2 {mb}')
        if v == 'front':
            if not ma or not mb:
                print(f'FAIL side-by-side {char}: empty render'); ok = False
            else:
                r = mb['height'] / ma['height']
                g = abs(r - 1) <= CONFIG['height_tol']
                print(f"{'PASS' if g else 'FAIL'} side-by-side {char}: v2 height / approved = {r:.3f} (limit 1 +/- {CONFIG['height_tol']})")
                f = abs(mb['feet'] - ma['feet']) <= CONFIG['feet_tol']
                print(f"{'PASS' if f else 'FAIL'} side-by-side {char}: feet row {mb['feet']} vs {ma['feet']} (limit {CONFIG['feet_tol']} px)")
                ok = ok and g and f
        ia = Image.open(pa).convert('RGB').resize((c, c), Image.LANCZOS)
        ib = Image.open(pb).convert('RGB').resize((c, c), Image.LANCZOS)
        row = Image.new('RGB', (2 * c, c)); row.paste(ia, (0, 0)); row.paste(ib, (c, 0))
        d = ImageDraw.Draw(row)
        d.text((8, 8), f'approved {v}', fill=(255, 255, 255)); d.text((c + 8, 8), f'v2 {v}', fill=(255, 255, 255))
        rows.append(row)
    sheet = Image.new('RGB', (2 * c, c * len(rows)))
    for i, r in enumerate(rows): sheet.paste(r, (0, i * c))
    sheet.save(out, quality=90)
    print('WROTE', out)
    return ok

if __name__ == '__main__':
    main(*sys.argv[1:5])

# crew v2 sample: three characters (default clown v2, stagehand v2, rigger v2; argv 3 = comma list) in front / three-quarter / back, same camera and light;
# play-size row (clown 64 px tall, same scale) at 1x and 4x nearest. Usage: sample_sheet.py <render dir> <out.jpg> [a,b,c]
import sys, numpy as np
from PIL import Image, ImageDraw
R, OUT = sys.argv[1], sys.argv[2]
CH = sys.argv[3].split(',') if len(sys.argv) > 3 else ['clown', 'stagehand', 'rigger']
# crop width per figure, px (wide enough for A-pose arms at 45 degrees)
CW = 380
VIEWS = ['front', 'three_quarter', 'back']
im = {(c, v): Image.open(f'{R}/{c}_{v}.png').convert('RGB') for c in CH for v in VIEWS}
def box(a):
    x = np.asarray(a).astype(int); bg = x[2, 2]; m = np.abs(x - bg).sum(2) > 40
    ys, xs = np.nonzero(m); return xs.min(), ys.min(), xs.max(), ys.max()
b = {k: box(v) for k, v in im.items()}
top = min(v[1] for v in b.values()) - 12; bot = max(v[3] for v in b.values()) + 12
cols = []
for v in VIEWS:
    for c in CH:
        x0, _, x1, _ = b[(c, v)]; cx = (x0 + x1) // 2; w = CW
        cols.append(im[(c, v)].crop((cx - w // 2, top, cx + w // 2, bot)))
H = bot - top; W = CW * 9 + 2 * 24
sheet = Image.new('RGB', (W, H + 330), (24, 22, 20)); d = ImageDraw.Draw(sheet)
x = 0
for i, col in enumerate(cols):
    sheet.paste(col, (x, 0)); x += CW + (24 if i % 3 == 2 else 0)
# play size: clown front 64 px tall
cb = b[('clown', 'front')]; k = 64 / (cb[3] - cb[1] + 1)
px = 20
for c in CH:
    x0, y0, x1, y1 = b[(c, 'front')]; f = im[(c, 'front')].crop((x0 - 4, y0 - 4, x1 + 4, y1 + 4))
    s = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
    sheet.paste(s, (px, H + 300 - s.height)); big = s.resize((s.width * 4, s.height * 4), Image.NEAREST)
    sheet.paste(big, (px + 60, H + 300 - big.height)); px += 60 + big.width + 60
    print(c, 'play size', s.size, 'px')
d.text((10, H + 308), 'play size: clown 64 px tall (1x, then 4x nearest); same scale for all three', fill=(220, 210, 190))
d.text((10, 6), 'front: ' + ' | '.join(CH) + '   -   three-quarter   -   back (v2, same camera, light and scale)', fill=(220, 210, 190))
sheet.save(OUT, quality=88); print('wrote', OUT, sheet.size)

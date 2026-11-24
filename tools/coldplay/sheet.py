# Contact sheet for the cold-play harness: sheet.py OUT.jpg in1.jpg ... in6.jpg (3 across, each scaled to a third of its width)
import sys
from PIL import Image
out, ins = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in ins]
w, h = ims[0].size
tw, th = w // 3, h // 3 if w > h else h // 3
th = round(h * tw / w)
cols = 3
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols + 2 * (cols - 1), th * rows + 2 * (rows - 1)), (255, 255, 255))
for i, im in enumerate(ims):
    sheet.paste(im.resize((tw, th)), ((i % cols) * (tw + 2), (i // cols) * (th + 2)))
sheet.save(out, quality=75)

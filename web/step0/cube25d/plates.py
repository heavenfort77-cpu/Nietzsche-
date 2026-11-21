"""Blender PNG layers -> WebP plates for the page (back lossy, alpha layers lossy with exact alpha).
Usage: python3 plates.py RENDER_DIR OUT_DIR"""
import json, os, shutil, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
# WebP quality (0-100)
QUALITY = 82
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if f.endswith('.png'):
        im = Image.open(os.path.join(src, f))
        if f.endswith('_back.png'):
            im = im.convert('RGB')
        im.save(os.path.join(dst, f[:-4] + '.webp'), 'WEBP', quality=QUALITY, method=6, exact=True)
        print(f, os.path.getsize(os.path.join(dst, f[:-4] + '.webp')) // 1024, 'KB')
shutil.copy(os.path.join(src, 'views.json'), os.path.join(dst, 'views.json'))

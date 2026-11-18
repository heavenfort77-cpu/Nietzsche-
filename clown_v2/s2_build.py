"""Step 2a driver: build the chosen character (CHAR, default clown) in its rig-ready bind pose, every part
tagged with its ramp and bones; face features per expression kept apart for baking. The character itself
(body, face, bones, poses) lives in chars/<name>.py.
Run: CHAR=clown python3 -I s2_build.py <outdir>   -> high.blend"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from chars.common import build, res, current
C = current()

def main(out):
    os.makedirs(out, exist_ok=True)
    build.ROOT = build.reset()
    C.body()
    bpy.context.view_layer.update()
    res(32, 16)
    for e in C.EXPR:
        coll = bpy.data.collections.new('face_' + e); bpy.context.scene.collection.children.link(coll)
        before = set(bpy.data.objects)
        C.face(e)
        for o in set(bpy.data.objects) - before:
            for c in list(o.users_collection): c.objects.unlink(o)
            coll.objects.link(o); o['group'] = 'face_' + e
        coll.hide_render = True
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'high.blend'))
    n = sum(1 for o in bpy.data.objects if o.get('group') in ('body', 'head'))
    untagged = [o.name for o in bpy.data.objects if o.type == 'MESH' and not o.get('group')]
    print(('PASS' if not untagged else 'FAIL'), f'{C.__name__}: {n} parts tagged; untagged meshes: {untagged}')

if __name__ == '__main__':
    main(sys.argv[1])

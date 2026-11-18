"""Render a .blend with the approved stage lights/camera (render3d.stage) for side-by-side checks.
python3 -I render_check.py <blend> <outprefix> <res> <samples> <views comma: front,three_quarter,side,back> [hide_group]"""
import sys, math, os
# approved art scripts (build.py, render3d.py, palette.py); set APPROVED to override
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import bpy
import render3d

blend, prefix, res, spp, views = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5].split(',')
hide = sys.argv[6] if len(sys.argv) > 6 else ''
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
for o in sc.objects:
    o.hide_render = False
    if o.type in ('LIGHT',) or (o.type == 'MESH' and o.get('group', '') .startswith('face_')):
        o.hide_render = True
    if hide and o.get('group') == hide: o.hide_render = True
# pivot: everything without a parent gets parented to a turn empty
piv = bpy.data.objects.new('pivot', None); sc.collection.objects.link(piv)
for o in list(sc.objects):
    if o.type in ('MESH', 'ARMATURE', 'EMPTY') and o.parent is None and o is not piv and not o.hide_render:
        o.parent = piv
if not sc.camera:
    cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
scale = float(os.environ.get('UNIT', '1'))          # model units per approved unit (0.03 after conversion)
piv.scale = (1 / scale,) * 3
render3d.stage('clown')
sc.cycles.samples = spp; sc.render.resolution_x = sc.render.resolution_y = res
sc.cycles.device = 'CPU'
for v in views:
    piv.rotation_euler = (0, 0, math.radians(render3d.CONFIG['views'][v]))
    sc.render.filepath = f'{prefix}_{v}.png'
    bpy.ops.render.render(write_still=True)
    render3d.backdrop(sc.render.filepath, 'clown')
    print('WROTE', sc.render.filepath)

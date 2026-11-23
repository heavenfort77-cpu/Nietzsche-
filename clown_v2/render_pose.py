# render one frame of a clip from rigged.blend with the approved stage light (as s3_check --sheet), several yaws
import sys, os, math, bpy
sys.path.insert(0, os.environ['APPROVED']); import render3d
D, CLIP, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; yaws = [float(y) for y in sys.argv[4].split(',')]; RES = int(sys.argv[5])
bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'rigged.blend'))
sc = bpy.context.scene; arm = bpy.data.objects['clown_rig']
for o in list(sc.objects):
    if o.type == 'LIGHT': bpy.data.objects.remove(o)
for tr in arm.animation_data.nla_tracks: tr.mute = True
piv = bpy.data.objects.new('pivot', None); sc.collection.objects.link(piv); arm.parent = piv; piv.scale = (1 / 0.03,) * 3
cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
render3d.stage('clown')
sc.cycles.samples = 32; sc.render.resolution_x = sc.render.resolution_y = RES; sc.cycles.device = 'CPU'
arm.animation_data.action = bpy.data.actions[CLIP]; sc.frame_set(1)
for y in yaws:
    piv.rotation_euler = (0, 0, math.radians(y)); p = f'{OUT}_{int(y)}.png'; sc.render.filepath = p
    bpy.ops.render.render(write_still=True); render3d.backdrop(p, 'clown'); print('wrote', p)

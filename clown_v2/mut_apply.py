"""Apply one deliberate break to a copy of rigged.blend, save it and export its GLB, so the mutation run
can prove each gate fires. Never touches the real build.
Run: python3 -I mut_apply.py <in rigged.blend> <out dir> <mutation> [face_atlas.png]"""
import os, sys, shutil
src, out, mut = sys.argv[1], sys.argv[2], sys.argv[3]
atlas = sys.argv[4] if len(sys.argv) > 4 else None
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
sys.argv = [sys.argv[0], out]
import numpy as np
import bpy
import s3_rig

bpy.ops.wm.open_mainfile(filepath=src)
arm = bpy.data.objects['clown_rig']; body = bpy.data.objects['body']; head = bpy.data.objects['head']
V = body.data.vertices

def verts_in(group, minw=0.5):
    gi = body.vertex_groups[group].index
    return [v.index for v in V if any(g.group == gi and g.weight >= minw for g in v.groups)]

def reweight(ids, to):
    for g in list(body.vertex_groups): g.remove(ids)
    body.vertex_groups[to].add(ids, 1.0, 'REPLACE')

if mut == 'unweighted':
    for g in body.vertex_groups: g.remove(list(range(50)))
elif mut == 'influence5':
    # a vertex that already has 4 influences gets a fifth
    v = next(v for v in V if sum(1 for g in v.groups if g.weight > 0) == 4)
    have = {g.group for g in v.groups}
    extra = next(g for g in body.vertex_groups if g.index not in have)
    extra.add([v.index], 0.05, 'ADD')
elif mut == 'badbind':
    # a bone constraint moves the hand even with every pose value at rest
    c = arm.pose.bones['hand_R'].constraints.new('LIMIT_LOCATION')
    c.use_min_z = True; c.min_z = 0.05; c.owner_space = 'LOCAL'
elif mut == 'floating':
    # the whole right hand (palm, fingers, thumb parts) rides the head bone, so it stays behind when the arm swings
    import json
    pb = json.loads(body['part_bones'])
    hand_parts = {i for i, b in enumerate(pb) if b in ('forearm_R,hand_R', 'hand_R,fingers_R', 'hand_R')}
    fp = np.zeros(len(body.data.polygons), np.int32); body.data.attributes['part'].data.foreach_get('value', fp)
    ids = sorted({v for p in body.data.polygons if fp[p.index] in hand_parts for v in p.vertices})
    reweight(ids, 'head')
elif mut == 'stretch':
    reweight(verts_in('thigh_L')[:30], 'hand_R')
elif mut == 'uvoverlap':
    uvl = body.data.uv_layers.active.data
    for a, b in zip(body.data.polygons[0].loop_indices, body.data.polygons[500].loop_indices): uvl[b].uv = uvl[a].uv
elif mut == 'headfloat':
    for v in head.data.vertices: v.co.z += 1.4
elif mut == 'hidden':
    body.hide_render = True
elif mut == 'dotname':
    arm.data.bones['hand_R'].name = 'hand.R'
elif mut == 'drawcalls':
    for k in range(2):
        m = body.data.materials[0].copy(); body.data.materials.append(m)
        for p in body.data.polygons[k * 100:(k + 1) * 100]: p.material_index = k + 1
elif mut == 'faceswap':
    from PIL import Image
    a = np.asarray(Image.open(atlas).convert('RGB')); s = a.shape[0] // 2
    t = np.tile(a[:s, :s], (2, 2, 1)); p = os.path.join(out, 'face_atlas.png'); Image.fromarray(t).save(p)
    m = head.data.materials[0]
    for n in m.node_tree.nodes:
        if n.type == 'TEX_IMAGE': n.image = bpy.data.images.load(p)
elif mut == 'vcolor':
    ca = body.data.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT'); body.data.color_attributes.active_color = ca
else:
    raise SystemExit('unknown mutation ' + mut)

os.makedirs(out, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'rigged.blend'))
if atlas and mut != 'faceswap': shutil.copy(atlas, os.path.join(out, 'face_atlas.png'))
if mut == 'vcolor':
    bpy.ops.object.select_all(action='DESELECT')
    for n in ('clown_rig', 'body', 'head'): bpy.data.objects[n].select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, 'clown_v2.glb'), export_format='GLB', use_selection=True,
                              export_animation_mode='ACTIONS', export_vertex_color='ACTIVE', export_attributes=True)
else:
    s3_rig.export_glb(os.path.join(out, 'clown_v2.glb'))
print('MUTATED', mut)

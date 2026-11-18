"""Step 1 toolchain probe (Blender side). Prints PASS/FAIL lines with timings.
Run: python3 -I probe_bpy.py <outdir>"""
import sys, time, os, json
import bpy

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
R = []
def rep(name, ok, info=''):
    R.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

# 1 version
rep('bpy version', True, bpy.app.version_string)

# 2 glTF exporter params we rely on
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
need = ['export_animation_mode', 'export_influence_nb', 'export_force_sampling', 'export_reset_pose_bones',
        'export_anim_slide_to_zero', 'export_def_bones', 'export_texcoords', 'export_skins', 'export_apply']
miss = [p for p in need if p not in props]
rep('glTF exporter params', not miss, 'missing: ' + ','.join(miss) if miss else f'{len(need)} present')
if 'export_animation_mode' in props:
    enum = bpy.ops.export_scene.gltf.get_rna_type().properties['export_animation_mode'].enum_items.keys()
    rep('export_animation_mode has ACTIONS', 'ACTIONS' in enum, list(enum))

# 3 Cycles devices
bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    found = []
    for t in ('CUDA', 'OPTIX', 'HIP', 'ONEAPI', 'METAL'):
        try:
            prefs.compute_device_type = t; prefs.get_devices()
            found += [f'{t}:{d.name}' for d in prefs.devices if d.type != 'CPU']
        except Exception:
            pass
    rep('Cycles GPU devices', True, found or 'none (CPU only)')
except Exception as e:
    rep('Cycles GPU devices', False, e)

# 4 test bake: high = sphere with bumps (joined), low = smooth sphere; DIFFUSE color selected-to-active, then AO
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
hi = bpy.context.active_object; hi.name = 'hi'
m1 = bpy.data.materials.new('red'); m1.use_nodes = True
m1.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.8, 0.1, 0.05, 1)
hi.data.materials.append(m1)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.4, location=(0, -0.9, 0.3))
b = bpy.context.active_object
m2 = bpy.data.materials.new('white'); m2.use_nodes = True
m2.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1)
b.data.materials.append(m2)
bpy.ops.object.select_all(action='DESELECT'); hi.select_set(True); b.select_set(True)
bpy.context.view_layer.objects.active = hi; bpy.ops.object.join()
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1.1)
lo = bpy.context.active_object; lo.name = 'lo'
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(island_margin=0.02); bpy.ops.object.mode_set(mode='OBJECT')
img = bpy.data.images.new('bake', 512, 512)
ml = bpy.data.materials.new('lo'); ml.use_nodes = True
tn = ml.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img; ml.node_tree.nodes.active = tn
lo.data.materials.append(ml)
sc.cycles.samples = 1
sc.render.bake.use_selected_to_active = True; sc.render.bake.cage_extrusion = 0.3
sc.render.bake.use_pass_direct = False; sc.render.bake.use_pass_indirect = False; sc.render.bake.use_pass_color = True
sc.render.bake.margin = 8
bpy.ops.object.select_all(action='DESELECT'); hi.select_set(True); lo.select_set(True)
bpy.context.view_layer.objects.active = lo
t = time.time()
try:
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
    import numpy as np
    px = np.empty(512 * 512 * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    # byte image stores sRGB: linear (0.8,0.1,0.05) -> about (0.906,0.349,0.248)
    reds = int((np.abs(px[:, :3] - (0.906, 0.349, 0.248)).max(1) < 0.03).sum()); whites = int((px[:, :3].min(1) > 0.85).sum())
    img.filepath_raw = os.path.join(OUT, 'bake_diffuse.png'); img.file_format = 'PNG'; img.save()
    rep('Cycles DIFFUSE colour bake 512 CPU', reds > 1000 and whites > 100, f'{time.time()-t:.1f}s red_px={reds} white_px={whites}')
except Exception as e:
    rep('Cycles DIFFUSE colour bake 512 CPU', False, e)
sc.render.bake.use_selected_to_active = False; sc.cycles.samples = 64
bpy.ops.object.select_all(action='DESELECT'); lo.select_set(True)
t = time.time()
try:
    bpy.ops.object.bake(type='AO')
    img.filepath_raw = os.path.join(OUT, 'bake_ao.png'); img.save()
    rep('Cycles AO bake 512 CPU 64spp', True, f'{time.time()-t:.1f}s')
except Exception as e:
    rep('Cycles AO bake 512 CPU 64spp', False, e)

# 5 armature + auto weights + 5.x scripted action + ACTIONS export
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.15, depth=1.7, location=(0, 0, 0.85))
cylo = bpy.context.active_object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=12); bpy.ops.object.mode_set(mode='OBJECT')
arm = bpy.data.armatures.new('arm'); ao = bpy.data.objects.new('rig', arm); sc = bpy.context.scene
sc.collection.objects.link(ao); bpy.context.view_layer.objects.active = ao
bpy.ops.object.mode_set(mode='EDIT')
b1 = arm.edit_bones.new('lower'); b1.head = (0, 0, 0); b1.tail = (0, 0, 0.85)
b2 = arm.edit_bones.new('upper'); b2.head = (0, 0, 0.85); b2.tail = (0, 0, 1.7); b2.parent = b1; b2.use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); cylo.select_set(True); ao.select_set(True)
bpy.context.view_layer.objects.active = ao
try:
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    nz = sum(1 for v in cylo.data.vertices if v.groups)
    rep('ARMATURE_AUTO weights in background', nz == len(cylo.data.vertices), f'{nz}/{len(cylo.data.vertices)} weighted')
except Exception as e:
    rep('ARMATURE_AUTO weights in background', False, e)
names = []
try:
    ao.animation_data_create()
    for nm, ang in (('bend', 0.8), ('twist', 0.4)):
        act = bpy.data.actions.new(nm); act.use_fake_user = True
        ao.animation_data.action = act
        pb = ao.pose.bones['upper']; pb.rotation_mode = 'XYZ'
        for f, a in ((1, 0), (10, ang), (20, 0)):
            pb.rotation_euler = (a, 0, 0) if nm == 'bend' else (0, 0, a)
            pb.keyframe_insert('rotation_euler', frame=f)
        tr = ao.animation_data.nla_tracks.new(); tr.name = nm
        tr.strips.new(nm, 1, act)
        ao.animation_data.action = None
        names.append(nm)
    has_slots = hasattr(bpy.types.Action, 'slots')
    rep('Scripted keyframes on 5.x actions (NLA stash)', True, f'slots_api={has_slots}')
    p = os.path.join(OUT, 'anim_test.glb')
    bpy.ops.export_scene.gltf(filepath=p, export_format='GLB', export_animation_mode='ACTIONS', export_influence_nb=4)
    import struct
    with open(p, 'rb') as f:
        f.read(12); ln, _ = struct.unpack('<II', f.read(8)); j = json.loads(f.read(ln))
    anims = [a['name'] for a in j.get('animations', [])]
    rep('GLB export ACTIONS mode: one animation per action', sorted(anims) == sorted(names), anims)
    rep('GLB has skin', bool(j.get('skins')), len(j.get('skins', [])))
except Exception as e:
    rep('Scripted actions / export', False, e)

# 6 voxel remesh + decimate via modifiers in background
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_uv_sphere_add(radius=1); a = bpy.context.active_object
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, location=(0.9, 0, 0))
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = a; bpy.ops.object.join()
t = time.time()
md = a.modifiers.new('r', 'REMESH'); md.mode = 'VOXEL'; md.voxel_size = 0.03
bpy.ops.object.modifier_apply(modifier='r')
n1 = len(a.data.polygons)
md = a.modifiers.new('d', 'DECIMATE'); md.ratio = 0.1; bpy.ops.object.modifier_apply(modifier='d')
tris = sum(len(p.vertices) - 2 for p in a.data.polygons)
rep('Voxel remesh + decimate modifiers', tris > 0 and tris < n1 * 2, f'{n1} faces -> {tris} tris in {time.time()-t:.1f}s')

json.dump(R, open(os.path.join(OUT, 'probe_bpy.json'), 'w'), indent=1)

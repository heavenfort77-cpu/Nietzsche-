"""Render the four characters as real 3D models (no pixel conversion).
Reuses the character builders in build.py but swaps in PBR materials (Principled BSDF,
base colour from each palette ramp), smooth curve tubes for brows and mouths, perspective
camera, three sun lights (warm for stage characters, cold for Mirror ones) and a floor.
Outputs per character: 4 stills (front, three-quarter, side, back), a turntable GIF, a GLB.
Run: python3 -I render3d.py <name> [--turntable]"""
import math, os, sys
import numpy as np
from PIL import Image
import bpy
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build
from palette import RAMPS

CONFIG = dict(
    res=1024, samples=48, turn_res=480, turn_frames=24, turn_samples=24,
    lens=85, cam_dist=158, cam_z=31,
    views=dict(front=0, three_quarter=-35, side=-90, back=180),
    stage=dict(bg='#1E1418', key=(1.0, 0.86, 0.66), key_s=3.2, fill=(0.55, 0.45, 0.45), fill_s=0.7, rim=(1.0, 0.8, 0.6), rim_s=2.2),
    mirror=dict(bg='#11272B', key=(0.72, 0.86, 0.95), key_s=2.4, fill=(0.35, 0.5, 0.55), fill_s=0.6, rim=(0.75, 0.92, 1.0), rim_s=2.6),
    world=dict(clown='stage', whiteface='stage', performer='mirror', clinger='mirror'),
)
SPECIAL = dict(GOLD=dict(metallic=0.85, rough=0.32), SILVER=dict(metallic=0.6, rough=0.3),
               PAINT=dict(rough=0.35), BLACK=dict(rough=0.4), CRIMSON=dict(rough=0.5, sheen=0.4),
               WARM_WHITE=dict(rough=0.75, sheen=0.5), OCHRE=dict(rough=0.8, sheen=0.4),
               M_PALE=dict(rough=0.7, sheen=0.4), M_MID=dict(rough=0.6), M_DARK=dict(rough=0.5),
               SKIN=dict(rough=0.5, sss=0.15), RED=dict(rough=0.3))

_m = {}
def principled(key, hexcol, metallic=0.0, rough=0.55, sheen=0.0, sss=0.0):
    if key in _m: return _m[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = build.hex_lin(hexcol)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if sheen: b.inputs['Sheen Weight'].default_value = sheen
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.2)
        b.inputs['Subsurface Scale'].default_value = 0.4
    _m[key] = m
    return m

def pbr(ramp):
    return principled('pbr_' + ramp, RAMPS[ramp][1], **SPECIAL.get(ramp, {}))

def pbr_flat(hexcol):
    return principled('flat_' + hexcol, hexcol, rough=0.35)

def tube(mat, pts, size):
    """Smooth tube through the points (brows, mouths, grins) instead of a chain of beads."""
    cu = bpy.data.curves.new('tube', 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, (x, y, z) in zip(sp.points, pts): p.co = (x, y, z, 1)
    sp.use_smooth = True
    cu.bevel_depth = min(size[0], size[2]) * 0.85; cu.bevel_resolution = 4
    cu.use_fill_caps = True
    o = bpy.data.objects.new('tube', cu); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)
    o.parent = build.ROOT
    return o

build.toon, build.flat, build.arc = pbr, pbr_flat, tube

def sun(name, direction, color, strength):
    d = bpy.data.lights.new(name, 'SUN'); d.color = color; d.energy = strength; d.angle = math.radians(8)
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (-Vector(direction)).to_track_quat('-Z', 'Y').to_euler()
    return o

def stage(name):
    sc = bpy.context.scene
    w = CONFIG[CONFIG['world'][name]]
    sc.cycles.samples = CONFIG['samples']; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4; sc.render.filter_size = 1.5
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    sc.render.resolution_x = sc.render.resolution_y = CONFIG['res']
    world = bpy.data.worlds.new('w'); world.use_nodes = True; sc.world = world
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = build.hex_lin(w['bg']); bg.inputs['Strength'].default_value = 0.6
    cam = sc.camera; cam.data.type = 'PERSP'; cam.data.lens = CONFIG['lens']
    cam.location = (0, -CONFIG['cam_dist'], CONFIG['cam_z']); cam.rotation_euler = (math.radians(90), 0, 0)
    sun('key', (-0.55, -0.6, 0.75), w['key'], w['key_s'])          # top-left, in front
    sun('fill', (0.8, -0.5, 0.2), w['fill'], w['fill_s'])          # low, from the right
    sun('rim', (0.2, 0.9, 0.5), w['rim'], w['rim_s'])              # from behind
    sc.render.film_transparent = True                              # floor only catches shadows; the backdrop is composited
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=120, fill_type='NGON', location=(0, 0, -0.05))
    bpy.context.active_object.is_shadow_catcher = True

def backdrop(path, name):
    """Composite the render over a soft pool of light: warm stage spot or cold Mirror glow."""
    w = CONFIG[CONFIG['world'][name]]
    im = Image.open(path).convert('RGBA'); W, H = im.size
    bg = np.array([int(w['bg'][i:i + 2], 16) for i in (1, 3, 5)], float)
    glow = np.array(w['key']) * 255 * 0.22 + bg * 0.78
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.42)) ** 2 + ((yy - H * 0.62) / (H * 0.55)) ** 2)
    t = np.clip(1 - d, 0, 1)[..., None] ** 1.6
    base = Image.fromarray((bg * (1 - t) + glow * t).astype(np.uint8), 'RGB').convert('RGBA')
    base.alpha_composite(im)
    base.convert('RGB').save(path)

def main(name, turntable):
    build.ROOT = build.reset()
    build.CHARS[name]()
    build.ROOT.scale = (build.SCALE.get(name, 1.0),) * 3
    build.ROOT.location.z = build.LIFT.get(name, 0.0)
    out = os.path.join(HERE, 'renders3d'); os.makedirs(out, exist_ok=True)
    # export the model alone (no floor, lights or camera) with PBR materials
    for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, f'{name}.glb'), export_format='GLB', use_selection=True,
                              export_apply=True)
    stage(name)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f'{name}.blend'))
    sc = bpy.context.scene
    for view, yaw in ({} if '--turn-only' in sys.argv else CONFIG['views']).items():
        build.ROOT.rotation_euler = (0, 0, math.radians(yaw))
        sc.render.filepath = os.path.join(out, f'{name}_{view}.png')
        bpy.ops.render.render(write_still=True)
        backdrop(sc.render.filepath, name)
    if turntable:
        sc.cycles.samples = CONFIG['turn_samples']
        sc.render.resolution_x = sc.render.resolution_y = CONFIG['turn_res']
        tdir = os.path.join(out, f'{name}_turn'); os.makedirs(tdir, exist_ok=True)
        for i in range(CONFIG['turn_frames']):
            build.ROOT.rotation_euler = (0, 0, 2 * math.pi * i / CONFIG['turn_frames'])
            sc.render.filepath = os.path.join(tdir, f'{i:02d}.png')
            bpy.ops.render.render(write_still=True)
            backdrop(sc.render.filepath, name)
        frames = [Image.open(os.path.join(tdir, f'{i:02d}.png')).convert('RGB') for i in range(CONFIG['turn_frames'])]
        frames[0].save(os.path.join(out, f'{name}_turntable.gif'), save_all=True, append_images=frames[1:], duration=110, loop=0, optimize=True)

if __name__ == '__main__':
    main(sys.argv[1], '--turntable' in sys.argv)

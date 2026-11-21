"""Fixed-camera walk sample (owner requirement 7, 22 Nov): the clown leaves the cube room by
its exit wall and walks through 3 Resident Evil / FF7 style shots (corridor, wings with two
performers, ring entrance with the audience). Each shot is one fixed Blender camera, rendered
as a colour plate plus a per-pixel depth plate (planar view depth, metres), so the 3D clown
is depth-tested against the 2D background wherever he walks. Box-and-shape only (prototype).

Writes OUT/<shot>_color.png, OUT/<shot>_depth.png (depth packed in R and G, 16 bit) and
OUT/shots.json (cameras in three.js axes, zones, walk areas, obstacles, performers).

Run: python3 -I build_walk.py -- OUT_DIR [samples] [percent]   (percent 0: print framing only)
"""
import bpy, json, math, os, sys
import numpy as np
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else 'walk_out')
SAMPLES = int(ARGS[1]) if len(ARGS) > 1 else 32
PCT = int(ARGS[2]) if len(ARGS) > 2 else 100

# ===== CONFIG =====
CONFIG = dict(
    # plate size in pixels, 16:9 (texture rule: 1024 max)
    res=(1024, 576),
    # far distance encoded in the depth plate, metres (background and anything further reads as far)
    depthFar=40.0,
    # largest vertical field of view a shot may use, degrees
    fovMax=58.0,
    # margin added around the must-see points when fitting a shot's field of view, degrees
    fovPad=2.0,
    # character height used for must-see points, metres
    charH=1.9,
)

# palette (art/3_blender_3d/palette.py ramps, base or light value; same as the cube room)
P = dict(
    floor='#3D332D', wall='#2A221E', canvas='#B3A68C', curtain='#962E3A', curtainDk='#6A1D29',
    gold='#CFAA4E', ring='#C9604A', sawdust='#B68C45', wood='#7E3F28', woodDk='#58291A',
    paint='#E2E3E3', silver='#C3C7CF', black='#24212A', ochre='#D7B06A', rug='#933C30', hat='#5A4C43',
    crowdA='#6A4A5C', crowdB='#4E5A6E', crowdC='#7A5A3A', skin='#C9A088',
)

# Blender floor rects (x0, y0, x1, y1), metres. Walk areas are where the clown's centre may go
# (already inset from the walls by his radius); zones decide which shot is live.
WALK = [
    (-0.9, 2.0, 0.9, 8.6),
    (-2.2, 8.3, 3.0, 13.7),
    (-1.9, 13.5, -0.7, 14.6),
    (-2.7, 14.4, 0.2, 18.8),
]
ZONES = dict(
    corridor=(-1.2, 1.6, 1.2, 8.2),
    wings=(-2.6, 8.2, 3.4, 14.0),
    entrance=(-3.0, 14.0, 0.6, 19.2),
)
# where the clown starts (just through the cube room's exit flap), Blender (x, y), and facing
START = dict(at=(0.0, 2.4), yaw=0.0)
# the clown reaching this Blender y ends the walk (he is at the ring edge: the act starts)
END_Y = 18.4
# the performers waiting in the wings: GLB stand-ins, Blender (x, y), resting facing in degrees (0 faces Blender -Y, the camera side)
PERFORMERS = [
    dict(name='whiteface', title='Whiteface', at=(-1.7, 10.6), yaw=-60.0),
    dict(name='performer', title='Performer', at=(2.6, 12.4), yaw=150.0),
]

# shot cameras: Blender location, the point it looks at, name prefixes of objects hidden from this camera only
SHOTS = dict(
    corridor=dict(title='Corridor', cam=(0.0, -0.9, 2.7), look=(0.0, 5.0, 0.7), hide=['cor_wall_s', 'entb_']),
    wings=dict(title='Wings', cam=(6.4, 8.2, 3.3), look=(0.2, 11.4, 0.7), hide=['entb_']),
    entrance=dict(title='Ring entrance', cam=(-1.3, 10.6, 2.9), look=(-1.3, 20.0, 0.8), hide=['wing_', 'rack_']),
)


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1.0,)


MATS = {}


def mat(name, col, rough=0.8, metal=0.0, emit=0.0):
    key = (name, col, rough, metal, emit)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(col)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = srgb(col)
        b.inputs['Emission Strength'].default_value = emit
    MATS[key] = m
    return m


def box(name, loc, size, m, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=(0, 0, math.radians(rot_z)))
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.data.materials.append(m)
    return o


def cyl(name, loc, r, h, m, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(m)
    return o


def sphere(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(m)
    return o


def wall_x(name, x0, x1, y, h, m, t=0.12):
    return box(name, ((x0 + x1) / 2, y, h / 2), (x1 - x0 + 0.2, t, h + 0.2), m)


def wall_y(name, y0, y1, x, h, m, t=0.12):
    return box(name, (x, (y0 + y1) / 2, h / 2), (t, y1 - y0 + 0.2, h + 0.2), m)


def area(name, loc, size, power, col, target):
    bpy.ops.object.light_add(type='AREA', location=loc)
    o = bpy.context.object
    o.name = name
    o.data.size = size
    o.data.energy = power
    o.data.color = srgb(col)[:3]
    d = Vector(target) - Vector(loc)
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o


def point(name, loc, power, col, r=0.1):
    bpy.ops.object.light_add(type='POINT', location=loc)
    o = bpy.context.object
    o.name = name
    o.data.energy = power
    o.data.shadow_soft_size = r
    o.data.color = srgb(col)[:3]
    return o


def build_corridor():
    wood, canvas, wall = mat('wood', P['wood']), mat('canvas', P['canvas'], 0.95), mat('wall', P['wall'])
    box('cor_floor', (0, 4.2, -0.05), (2.6, 8.6, 0.1), mat('floor', P['floor'], 0.9))
    wall_y('cor_wall_w', 0, 8.0, -1.3, 3.0, canvas)
    wall_y('cor_wall_e', 0, 8.0, 1.3, 3.0, canvas)
    wall_x('cor_wall_s', -1.3, 1.3, 0.0, 3.0, wall)
    box('cor_ceiling', (0, 4.0, 3.05), (2.6, 8.0, 0.1), wall)
    # tent ribs every 1.6 m
    for i in range(5):
        y = 1.6 + i * 1.6
        box(f'cor_rib_w{i}', (-1.2, y, 1.5), (0.12, 0.12, 3.0), mat('woodDk', P['woodDk']))
        box(f'cor_rib_e{i}', (1.2, y, 1.5), (0.12, 0.12, 3.0), mat('woodDk', P['woodDk']))
        box(f'cor_beam{i}', (0, y, 2.9), (2.5, 0.12, 0.12), mat('woodDk', P['woodDk']))
    # crates and a poster board along the walls (out of the walk area)
    box('cor_crate_a', (-1.05, 3.4, 0.3), (0.42, 0.6, 0.6), wood, 4)
    box('cor_crate_b', (-1.05, 3.9, 0.22), (0.4, 0.44, 0.44), wood, -6)
    box('cor_crate_c', (1.05, 6.2, 0.35), (0.42, 0.7, 0.7), wood)
    box('cor_poster', (1.22, 4.6, 1.6), (0.04, 1.0, 1.3), mat('rug', P['rug']))
    box('cor_poster_star', (1.19, 4.6, 1.7), (0.02, 0.4, 0.4), mat('gold', P['gold'], 0.4, 0.6), 45)
    cyl('cor_rope', (-1.0, 6.8, 0.08), 0.22, 0.16, mat('ochre', P['ochre']))
    # bulbs on the beams (emissive)
    for i in range(3):
        sphere(f'cor_bulb{i}', (0, 4.0 + i * 1.6, 2.7), 0.07, mat('bulb', '#FFE2A8', 0.5, 0, 6))


def build_wings():
    curtain, curtainDk = mat('curtain', P['curtain']), mat('curtainDk', P['curtainDk'])
    canvas, wood, woodDk = mat('canvas', P['canvas'], 0.95), mat('wood', P['wood']), mat('woodDk', P['woodDk'])
    box('wing_floor', (2.0, 11.0, -0.05), (9.4, 6.4, 0.1), mat('floor', P['floor'], 0.9))
    box('wing_rug', (0.9, 11.0, 0.005), (3.0, 2.0, 0.01), mat('rug', P['rug'], 0.95))
    # walls: south (with the corridor mouth), west, east, north (curtain, with the gap to the ring entrance)
    wall_x('wing_wall_s_a', -2.7, -1.3, 8.0, 3.4, canvas)
    wall_x('wing_wall_s_b', 1.3, 6.7, 8.0, 3.4, canvas)
    wall_y('wing_wall_w', 8.0, 14.0, -2.7, 3.4, canvas)
    wall_y('wing_wall_e', 8.0, 14.0, 6.7, 3.4, canvas)
    # north wall: curtain left and right of the gap (x -2.0 to -0.6) and a lintel over it
    wall_x('wing_wall_n_a', -2.7, -2.0, 14.0, 3.4, curtain, 0.2)
    wall_x('wing_wall_n_b', -0.6, 6.7, 14.0, 3.4, curtain, 0.2)
    box('wing_lintel', (-1.3, 14.0, 2.9), (1.4, 0.2, 1.0), curtainDk)
    for i in range(10):
        box(f'wing_fold{i}', (-0.2 + i * 0.68, 13.88, 1.6), (0.16, 0.1, 3.2), curtainDk)
    box('wing_ceiling', (2.0, 11.0, 3.45), (9.4, 6.0, 0.1), mat('wall', P['wall']))
    # costume rack near the camera (the clown walks behind it), with hanging costumes
    box('rack_a', (3.3, 9.5, 0.9), (1.6, 0.08, 0.06), mat('silver', P['silver'], 0.3, 0.8))
    for i, c in enumerate(['curtain', 'gold', 'paint', 'rug']):
        box(f'rack_a_coat{i}', (2.7 + i * 0.4, 9.5, 1.15), (0.3, 0.32, 0.95), mat(c, P[c], 0.9))
    box('rack_a_leg_l', (2.5, 9.5, 0.9), (0.05, 0.05, 1.8), mat('silver', P['silver'], 0.3, 0.8))
    box('rack_a_leg_r', (4.1, 9.5, 0.9), (0.05, 0.05, 1.8), mat('silver', P['silver'], 0.3, 0.8))
    # second rack by the north curtain (hidden from the entrance camera)
    box('rack_b', (4.6, 13.2, 1.0), (0.5, 1.4, 1.4), mat('ochre', P['ochre'], 0.9))
    box('rack_b_rail', (4.6, 13.2, 1.8), (0.05, 1.6, 0.05), mat('silver', P['silver'], 0.3, 0.8))
    # props: mirror table, trunk, ladder, juggling clubs, stool
    box('wing_table', (-2.2, 12.6, 0.4), (0.7, 1.4, 0.8), woodDk)
    box('wing_mirror', (-2.55, 12.6, 1.35), (0.06, 1.0, 1.0), mat('mirror', '#6E8D94', 0.15, 0.7))
    box('wing_trunk', (5.6, 9.0, 0.35), (1.2, 0.7, 0.7), wood)
    box('wing_trunk_band', (5.6, 9.0, 0.5), (1.24, 0.74, 0.08), mat('gold', P['gold'], 0.4, 0.6))
    for i in range(6):
        box(f'ladder_rung{i}', (6.4, 10.6, 0.3 + i * 0.5), (0.1, 0.6, 0.05), wood)
    box('ladder_l', (6.4, 10.3, 1.5), (0.08, 0.06, 3.0), wood)
    box('ladder_r', (6.4, 10.9, 1.5), (0.08, 0.06, 3.0), wood)
    for i in range(3):
        cyl(f'club{i}', (-0.9 + i * 0.2, 9.0, 0.25), 0.05, 0.5, mat('paint', P['paint'], 0.5))
    cyl('stool', (1.0, 13.0, 0.3), 0.25, 0.6, woodDk)
    # warm bulbs over the mirror table
    for i in range(3):
        sphere(f'wing_bulb{i}', (-2.5, 12.1 + i * 0.5, 1.95), 0.06, mat('bulb', '#FFE2A8', 0.5, 0, 6))


def build_entrance():
    curtain, curtainDk = mat('curtain', P['curtain']), mat('curtainDk', P['curtainDk'])
    sawdust, ringM, gold = mat('sawdust', P['sawdust'], 0.95), mat('ring', P['ring']), mat('gold', P['gold'], 0.4, 0.6)
    box('ent_floor', (-1.3, 21.0, -0.05), (26.0, 14.0, 0.1), mat('floor', P['floor'], 0.9))
    # entrance passage walls (dark curtain), then the ring opens out
    wall_y('ent_wall_w', 14.0, 17.4, -3.2, 3.4, curtainDk, 0.2)
    wall_y('ent_wall_e', 14.0, 17.4, 0.7, 3.4, curtainDk, 0.2)
    box('ent_ceiling', (-1.25, 15.7, 3.45), (4.2, 3.6, 0.1), curtainDk)
    # the same passage carried back to the entrance camera (seen by that camera only: entb_ is hidden from the others)
    wall_y('entb_wall_w', 10.0, 14.0, -3.2, 3.4, curtainDk, 0.2)
    wall_y('entb_wall_e', 10.0, 14.0, 0.7, 3.4, curtainDk, 0.2)
    box('entb_ceiling', (-1.25, 12.0, 3.45), (4.2, 4.2, 0.1), curtainDk)
    box('ent_arch', (-1.25, 17.4, 3.2), (4.2, 0.3, 0.6), gold)
    box('ent_arch_w', (-3.2, 17.4, 1.6), (0.3, 0.3, 3.2), gold)
    box('ent_arch_e', (0.7, 17.4, 1.6), (0.3, 0.3, 3.2), gold)
    # the ring: sawdust disc and its curb, centre (-1.3, 25.5)
    cx, cy, R = -1.3, 25.5, 6.5
    cyl('ring_sawdust', (cx, cy, 0.01), R, 0.02, sawdust, 64)
    for i in range(40):
        a = i / 40 * 2 * math.pi
        box(f'ring_curb{i}', (cx + math.cos(a) * R, cy + math.sin(a) * R, 0.2), (0.3, R * 2 * math.pi / 40 + 0.02, 0.4),
            ringM, math.degrees(a))
    # audience: 4 stepped tiers around the far side of the ring, people as box bodies and ball heads
    cols = [mat('crowdA', P['crowdA']), mat('crowdB', P['crowdB']), mat('crowdC', P['crowdC'])]
    skin = mat('skin', P['skin'], 0.7)
    n = 0
    for t in range(4):
        r = R + 1.6 + t * 1.0
        z = 0.25 + t * 0.55
        box_count = 26 + t * 4
        for i in range(box_count):
            a = math.radians(-20 + 220 * i / (box_count - 1))
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
            # skip the seats in front of the entrance gap (south side of the ring)
            if y < 19.5:
                continue
            box(f'tier{t}_{i}', (x, y, z / 2), (0.9, 0.9, z), mat('woodDk', P['woodDk']), math.degrees(a))
            box(f'aud{n}', (x, y, z + 0.3), (0.42, 0.3, 0.6), cols[(i + t) % 3], math.degrees(a))
            sphere(f'aud{n}_head', (x, y, z + 0.75), 0.15, skin)
            n += 1
    # the big top behind the audience: canvas wall and two king poles
    # canvas panels on the far arc only (a closed cylinder would reach back into the wings and the passage)
    TR = R + 6.5
    for i in range(48):
        a = math.radians(-25 + 230 * i / 47)
        box(f'tent_wall{i}', (cx + math.cos(a) * TR, cy + math.sin(a) * TR, 4.0), (0.2, TR * math.radians(230 / 47) + 0.05, 8.0),
            mat('canvas', P['canvas'], 0.95), math.degrees(a))
    cyl('pole_l', (cx - 3.0, cy, 5.0), 0.15, 10.0, mat('silver', P['silver'], 0.3, 0.8))
    cyl('pole_r', (cx + 3.0, cy, 5.0), 0.15, 10.0, mat('silver', P['silver'], 0.3, 0.8))
    # near-side audience flanking the passage exit (foreground, partly in front of the ring)
    for side, x0 in (('w', -4.6), ('e', 2.1)):
        for i in range(3):
            x = x0 + (0.0 if side == 'w' else 0.0) + i * 0.0
            y = 18.2 + i * 0.9
            box(f'near_{side}_seat{i}', (x, y, 0.25), (1.6, 0.8, 0.5), mat('woodDk', P['woodDk']))
            for k in range(2):
                xx = x - 0.4 + k * 0.8
                box(f'near_{side}_aud{i}_{k}', (xx, y, 0.8), (0.42, 0.3, 0.6), cols[(i + k) % 3])
                sphere(f'near_{side}_head{i}_{k}', (xx, y, 1.25), 0.15, skin)


def build_lights():
    # corridor: warm bulbs, cool spill from the cube room behind
    area('cor_key', (0, 4.0, 2.8), 1.6, 120, '#FFD9A0', (0, 4.0, 0))
    area('cor_key2', (0, 7.0, 2.8), 1.2, 80, '#FFD9A0', (0, 7.0, 0))
    area('cor_spill', (0, 0.4, 1.6), 1.2, 30, '#BFC8E0', (0, 4, 0.6))
    # wings: warm key from the mirror bulbs side, fill from the corridor mouth, red bounce off the curtain
    area('wing_key', (-1.0, 11.5, 3.2), 3.0, 380, '#FFD8A0', (1.0, 11.0, 0))
    area('wing_fill', (4.0, 9.0, 3.0), 2.5, 140, '#D8C8B8', (2.0, 12.0, 0))
    point('wing_bulbs', (-2.3, 12.6, 1.9), 60, '#FFD49A', 0.2)
    area('wing_bounce', (2.0, 13.6, 1.5), 4.0, 60, '#E88A72', (2.0, 10.0, 1.0))
    # ring: strong top spot on the ring, warm wash over the audience, dim passage
    area('ring_spot', (-1.3, 25.5, 9.0), 4.0, 4000, '#FFF0D0', (-1.3, 25.5, 0))
    area('crowd_wash', (-1.3, 22.0, 7.0), 10.0, 1500, '#FFC890', (-1.3, 29.0, 1.0))
    area('passage', (-1.3, 15.8, 3.1), 2.0, 260, '#E8B080', (-1.3, 15.5, 0))


def fit_shot(cam_loc, look, zone):
    """Vertical field of view (degrees) that keeps the zone's floor corners and a character's head
    over each corner in a 16:9 frame from cam_loc looking at look."""
    fwd = (Vector(look) - Vector(cam_loc)).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(fwd)
    aspect = CONFIG['res'][0] / CONFIG['res'][1]
    x0, y0, x1, y1 = zone
    need = 0.0
    for x in (x0, x1):
        for y in (y0, y1):
            for z in (0.0, CONFIG['charH']):
                d = Vector((x, y, z)) - Vector(cam_loc)
                f = d.dot(fwd)
                if f <= 0.1:
                    need = 999
                    continue
                ty = abs(d.dot(up)) / f
                tx = abs(d.dot(right)) / f / aspect
                need = max(need, math.degrees(2 * math.atan(max(tx, ty))))
    return need


def coverage(cam_loc, look, fov, zone):
    """Share of walk-area points in the zone (grid 0.25 m) whose feet and head are both inside the frame."""
    fwd = (Vector(look) - Vector(cam_loc)).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(fwd)
    t = math.tan(math.radians(fov) / 2) * 0.98
    aspect = CONFIG['res'][0] / CONFIG['res'][1]
    zx0, zy0, zx1, zy1 = zone
    seen = total = 0
    for (x0, y0, x1, y1) in WALK:
        xa, ya, xb, yb = max(x0, zx0), max(y0, zy0), min(x1, zx1), min(y1, zy1)
        if xa >= xb or ya >= yb:
            continue
        nx, ny = int((xb - xa) / 0.25) + 1, int((yb - ya) / 0.25) + 1
        for i in range(nx):
            for j in range(ny):
                p = Vector((xa + (xb - xa) * i / max(1, nx - 1), ya + (yb - ya) * j / max(1, ny - 1), 0))
                ok = True
                for z in (0.0, CONFIG['charH']):
                    d = p + Vector((0, 0, z)) - Vector(cam_loc)
                    f = d.dot(fwd)
                    ok = ok and f > 0.1 and abs(d.dot(up)) / f <= t and abs(d.dot(right)) / f <= t * aspect
                seen += ok
                total += 1
    return seen / max(1, total)


def depth_material():
    # emits the planar view depth / far, linear (Raw view transform), so the render is the depth plate
    m = bpy.data.materials.new('depth_out')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    cam = nt.nodes.new('ShaderNodeCameraData')
    div = nt.nodes.new('ShaderNodeMath')
    div.operation = 'DIVIDE'
    div.inputs[1].default_value = CONFIG['depthFar']
    em = nt.nodes.new('ShaderNodeEmission')
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(cam.outputs['View Z Depth'], div.inputs[0])
    nt.links.new(div.outputs[0], em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m


def world(col, strength):
    w = bpy.context.scene.world or bpy.data.worlds.new('world')
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = col
    bg.inputs['Strength'].default_value = strength


def pack_depth(exr_path, png_path):
    img = bpy.data.images.load(exr_path)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, 0]
    bpy.data.images.remove(img)
    q = np.clip(np.round(a * 65535.0), 0, 65535).astype(np.uint32)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., 0] = q >> 8
    rgba[..., 1] = q & 255
    rgba[..., 3] = 255
    out = bpy.data.images.new('depth_png', w, h, alpha=True)
    out.pixels.foreach_set((rgba[::-1].astype(np.float32) / 255.0).ravel())
    out.filepath_raw = png_path
    out.file_format = 'PNG'
    out.save()
    bpy.data.images.remove(out)
    return float(a.min() * CONFIG['depthFar']), float(a.max() * CONFIG['depthFar'])


def to_three(v):
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]


def main():
    if PCT == 0:
        # framing only: field of view and how much of each zone's walk area stays in frame, no render
        for name, s in SHOTS.items():
            need = fit_shot(s['cam'], s['look'], ZONES[name])
            fov = min(CONFIG['fovMax'], need + CONFIG['fovPad'])
            print('FRAMING', name, 'fov', round(fov, 1), 'needs', round(need, 1), 'in frame', round(coverage(s['cam'], s['look'], fov, ZONES[name]) * 100, 1), '%')
        return
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = CONFIG['res']
    sc.render.resolution_percentage = PCT
    build_corridor()
    build_wings()
    build_entrance()
    build_lights()
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    sc.camera = cam
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.clip_start = 0.05
    cam.data.clip_end = 200
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    depth_mat = depth_material()
    vl = sc.view_layers[0]

    shots = {}
    for name, s in SHOTS.items():
        fov = min(CONFIG['fovMax'], fit_shot(s['cam'], s['look'], ZONES[name]) + CONFIG['fovPad'])
        cam.location = s['cam']
        cam.rotation_euler = (Vector(s['look']) - Vector(s['cam'])).to_track_quat('-Z', 'Y').to_euler()
        cam.data.angle_y = math.radians(fov)
        for o in meshes:
            o.visible_camera = not any(o.name.startswith(p) for p in s['hide'])
        # colour plate
        vl.material_override = None
        world(srgb('#140E10'), 1.0)
        sc.cycles.samples = SAMPLES
        sc.cycles.use_denoising = True
        sc.cycles.max_bounces = 4
        sc.cycles.filter_width = 1.5
        sc.view_settings.view_transform = 'Standard'
        sc.render.film_transparent = False
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGB'
        sc.render.image_settings.color_depth = '8'
        sc.render.filepath = os.path.join(OUT, f'{name}_color.png')
        bpy.ops.render.render(write_still=True)
        # depth plate: every surface emits its depth, one sharp sample per pixel, background = far
        vl.material_override = depth_mat
        world((1.0, 1.0, 1.0, 1.0), 1.0)
        sc.cycles.samples = 1
        sc.cycles.use_denoising = False
        sc.cycles.max_bounces = 0
        sc.cycles.filter_width = 0.01
        sc.view_settings.view_transform = 'Raw'
        sc.render.image_settings.file_format = 'OPEN_EXR'
        sc.render.image_settings.color_mode = 'RGB'
        sc.render.image_settings.color_depth = '32'
        exr = os.path.join(OUT, f'{name}_depth.exr')
        sc.render.filepath = exr
        bpy.ops.render.render(write_still=True)
        dmin, dmax = pack_depth(exr, os.path.join(OUT, f'{name}_depth.png'))
        os.remove(exr)
        cov = coverage(s['cam'], s['look'], fov, ZONES[name])
        print('RENDERED', name, 'fov', round(fov, 2), 'needs', round(fit_shot(s['cam'], s['look'], ZONES[name]), 1), 'in frame', round(cov * 100, 1), '%', 'depth', round(dmin, 2), round(dmax, 2), flush=True)
        shots[name] = dict(title=s['title'], pos=to_three(s['cam']), look=to_three(s['look']), fov=round(fov, 3),
                           color=f'{name}_color.webp', depth=f'{name}_depth.png', zone=ZONES[name], inFrame=round(cov, 3))

    # obstacles: footprints of props inside the walk areas, Blender (x0, y0, x1, y1)
    obstacles = []
    for o in meshes:
        if not any(o.name.startswith(p) for p in ('rack_a_coat', 'rack_a_leg', 'wing_table', 'wing_trunk', 'stool', 'club',
                                                     'cor_crate', 'cor_rope', 'rack_b', 'ladder')):
            continue
        pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
        obstacles.append([round(min(p.x for p in pts), 3), round(min(p.y for p in pts), 3),
                          round(max(p.x for p in pts), 3), round(max(p.y for p in pts), 3)])
    data = dict(
        coords='Blender Z-up; three.js (x, y, z) = Blender (x, z, -y). Rects are Blender (x0, y0, x1, y1).',
        res=list(CONFIG['res']), depthFar=CONFIG['depthFar'], shots=shots, walk=WALK, start=START, endY=END_Y,
        performers=PERFORMERS, obstacles=obstacles,
    )
    with open(os.path.join(OUT, 'shots.json'), 'w') as f:
        json.dump(data, f, indent=1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'walk_shots.blend'))
    print('DONE', OUT)


main()

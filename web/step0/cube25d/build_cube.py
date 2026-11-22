"""2.5D feasibility (owner, 21 Nov): one shared cube room, camera fixed at its centre,
each wall is one Myst-style scene. Renders every view as 3 depth layers (back opaque,
mid and front with alpha) plus views.json so three.js can rebuild the same camera and
stand the 3D clown in it. Box-and-shape only (prototype, no final art).

Run: python3 build_cube.py -- OUT_DIR [samples] [percent] [views, comma list; default all]
Session 17 (owner 22 Nov, panel F): the 'board' view is the same +Y wall with the backstage act board
in place of the ring; the 'ring' view stays for the cue page. Render one view alone with the 4th argument.
"""
import bpy, json, math, os, sys
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else 'cube_out')
SAMPLES = int(ARGS[1]) if len(ARGS) > 1 else 32
# render size percent (25 for a quick framing preview)
PCT = int(ARGS[2]) if len(ARGS) > 2 else 100
# views to render (others skipped, so their approved plates are not re-rendered)
ONLY = ARGS[3].split(',') if len(ARGS) > 3 else None

# ===== CONFIG =====
CONFIG = dict(
    # cube half size in metres (room is 2x this on every side; floor at z 0)
    half=5.0,
    # camera height at the cube centre, metres
    camZ=1.5,
    # camera pitch, degrees (negative looks down): puts the clown's face at 40% screen height at 3 m
    pitch=-6.1,
    # render vertical field of view, degrees: play camera is 42, the rest is parallax margin
    renderFov=46.0,
    # play camera vertical field of view, degrees (three.js)
    playFov=42.0,
    # render size in pixels (16:9)
    res=(1600, 900),
    # layer split by depth along the view axis, metres: under front -> front, under mid -> mid, else back
    frontMax=2.4,
    midMax=4.3,
    # depth of each layer's plane in three.js, metres
    planeDepth=dict(back=5.0, mid=3.6, front=1.8),
    # where the clown stands in the ring view (Blender x, y), metres from the camera
    clownAt=(0.0, 3.0),
    # dressing table top height, metres (owner 22 Nov 19:38: "too high, does not show his face"; was 0.80)
    vanityTop=0.72,
    # vanity glass centre height and height, metres (was 1.55 and 1.1): his seated reflection's face sits inside it
    vanityGlassZ=1.20,
    vanityGlassH=0.90,
    # bulb ring around the glass: horizontal and vertical radius, metres (was 0.78 and 0.66)
    vanityBulbR=(0.78, 0.55),
)

# view name -> (scene title, camera yaw in degrees; 0 looks +Y)
VIEWS = dict(
    ring=('Ring', 0.0),
    board=('Act board', 0.0),
    dressing=('Dressing room', -90.0),
    mirror=('Mirror', 180.0),
    exit=('Tent exit', 90.0),
)

# palette (art/3_blender_3d/palette.py ramps, base or light value)
P = dict(
    floor='#3D332D', wall='#2A221E', canvas='#B3A68C', curtain='#962E3A', curtainDk='#6A1D29',
    gold='#CFAA4E', ring='#C9604A', sawdust='#B68C45', wood='#7E3F28', woodDk='#58291A',
    paint='#E2E3E3', silver='#C3C7CF', mirror='#6E8D94', mirrorDk='#1C353B', black='#24212A',
    ochre='#D7B06A', rug='#933C30', hat='#5A4C43',
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


def cyl(name, loc, r, h, m, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(m)
    return o


def sphere(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(m)
    return o


def build_room():
    H = CONFIG['half']
    # shell: floor, ceiling, 4 walls (each wall is the backdrop of one view)
    box('floor', (0, 0, -0.05), (2 * H, 2 * H, 0.1), mat('floor', P['floor'], 0.9))
    box('ceiling', (0, 0, 2 * H), (2 * H, 2 * H, 0.1), mat('wall', P['wall']))
    box('wall_ring', (0, H, H), (2 * H, 0.1, 2 * H), mat('wall', P['wall']))
    box('wall_mirror', (0, -H, H), (2 * H, 0.1, 2 * H), mat('canvas', P['canvas'], 0.95))
    box('wall_dressing', (H, 0, H), (0.1, 2 * H, 2 * H), mat('canvas', P['canvas'], 0.95))
    box('wall_exit', (-H, 0, H), (0.1, 2 * H, 2 * H), mat('canvas', P['canvas'], 0.95))

    # ---- ring view (+Y): curtains, valance, the ring, posts in front
    for i in range(14):
        x = -4.4 + i * 0.68
        if abs(x) < 0.9:
            continue
        box(f'curtain_{i}', (x, H - 0.3 - (i % 2) * 0.12, 2.6), (0.62, 0.18, 5.2),
            mat('curtain', P['curtain'] if i % 2 else P['curtainDk'], 0.7))
    box('valance', (0, H - 0.45, 5.0), (9.6, 0.25, 0.6), mat('gold', P['gold'], 0.35, 0.7))
    box('backcloth', (0, H - 0.15, 2.6), (1.9, 0.05, 5.2), mat('black', P['black'], 0.9))
    rc = (0.0, 3.2)
    cyl('sawdust', (rc[0], rc[1], 0.01), 2.1, 0.02, mat('sawdust', P['sawdust'], 1.0), 48)
    bpy.ops.mesh.primitive_torus_add(location=(rc[0], rc[1], 0.18), major_radius=2.2, minor_radius=0.16,
                                     major_segments=64, minor_segments=12)
    t = bpy.context.object
    t.name = 'ring_curb'
    t.scale.z = 1.15
    t.data.materials.append(mat('ring', P['ring'], 0.5))
    cyl('stool', (1.5, 4.0, 0.3), 0.32, 0.6, mat('gold', P['gold'], 0.35, 0.7))
    cyl('stool_top', (1.5, 4.0, 0.62), 0.36, 0.06, mat('ring', P['ring'], 0.5))
    for sx in (-1, 1):
        cyl(f'post_{sx}', (sx * 1.25, 1.75, 0.55), 0.05, 1.1, mat('wood', P['wood'], 0.6))
        sphere(f'post_ball_{sx}', (sx * 1.25, 1.75, 1.14), 0.09, mat('gold', P['gold'], 0.3, 0.8))
    box('rope', (0, 1.75, 1.0), (2.5, 0.03, 0.03), mat('ring', P['ring'], 0.6))

    # ---- act board view (+Y, panel F): the night's acts pinned on a backstage board, props either side
    box('board_frame', (0, 4.86, 1.95), (3.4, 0.08, 2.05), mat('wood', P['wood'], 0.6))
    box('board_face', (0, 4.81, 1.95), (3.1, 0.04, 1.8), mat('black', P['black'], 0.9))
    box('board_header', (0, 4.78, 3.02), (3.3, 0.07, 0.34), mat('gold', P['gold'], 0.35, 0.7))
    # card 1, the deliberate fall (white with a red band); card 2, the spotlight sweep (ochre with a pale spot)
    box('board_card_fall', (-0.95, 4.77, 1.85), (0.86, 0.02, 1.12), mat('paint', P['paint'], 0.8))
    box('board_card_fall_band', (-0.95, 4.758, 2.2), (0.86, 0.02, 0.22), mat('ring', P['ring'], 0.6))
    box('board_card_sweep', (0.95, 4.77, 1.85), (0.86, 0.02, 1.12), mat('ochre', P['ochre'], 0.8))
    d = cyl('board_card_sweep_spot', (0.95, 4.755, 1.75), 0.28, 0.02, mat('paint', P['paint'], 0.7))
    d.rotation_euler = (math.radians(90), 0, 0)
    for i, x in enumerate((-0.95, 0.95)):
        sphere(f'board_pin_{i}', (x, 4.74, 2.36), 0.035, mat('ring', P['ring'], 0.4))
    for i, z in enumerate((0.35, 1.0)):
        box(f'board_crate_{i}', (-2.6, 4.2, z), (0.7 - 0.1 * i, 0.7 - 0.1 * i, 0.65 - 0.05 * i), mat('wood', P['wood'], 0.7))
    cyl('board_hatstand', (2.6, 4.3, 0.9), 0.04, 1.8, mat('woodDk', P['woodDk'], 0.6))
    sphere('board_hatstand_hat', (2.6, 4.3, 1.86), 0.17, mat('hat', P['hat'], 0.6))
    cyl('board_bucket', (2.0, 3.95, 0.2), 0.22, 0.4, mat('silver', P['silver'], 0.3, 1.0))
    b = cyl('board_broom', (1.65, 4.6, 0.8), 0.025, 1.6, mat('wood', P['wood'], 0.6))
    b.rotation_euler = (math.radians(-14), 0, 0)
    sphere('board_lamp', (0, 4.55, 3.4), 0.07, mat('bulb', P['ochre'], 0.4, 0.0, 8.0))

    # ---- dressing room view (+X): vanity with bulb frame, chair, rack, trunk
    vt, gz, gh, br = CONFIG['vanityTop'], CONFIG['vanityGlassZ'], CONFIG['vanityGlassH'], CONFIG['vanityBulbR']
    box('vanity', (4.45, 0, vt / 2), (0.8, 2.0, vt), mat('wood', P['wood'], 0.6))
    box('vanity_mirror', (4.85, 0, gz), (0.04, 1.3, gh), mat('mirror', P['mirror'], 0.05, 1.0))
    for i in range(10):
        a = i / 10 * 2 * math.pi
        sphere(f'bulb_{i}', (4.8, math.cos(a) * br[0], gz + math.sin(a) * br[1]), 0.05,
               mat('bulb', P['ochre'], 0.4, 0.0, 6.0))
    box('chair_seat', (3.5, 0.2, 0.45), (0.5, 0.5, 0.06), mat('woodDk', P['woodDk'], 0.6))
    box('chair_back', (3.25, 0.2, 0.8), (0.06, 0.5, 0.7), mat('woodDk', P['woodDk'], 0.6))
    for dx in (-0.2, 0.2):
        for dy in (-0.2, 0.2):
            box(f'chair_leg_{dx}_{dy}', (3.5 + dx, 0.2 + dy, 0.22), (0.05, 0.05, 0.44), mat('woodDk', P['woodDk']))
    box('rack_bar', (4.2, -2.2, 1.8), (0.05, 1.6, 0.05), mat('silver', P['silver'], 0.3, 1.0))
    for i, c in enumerate(['curtain', 'ochre', 'rug', 'hat']):
        box(f'costume_{i}', (4.2, -2.85 + i * 0.42, 1.25), (0.25, 0.32, 1.0), mat(c, P[c], 0.8))
    box('trunk', (3.0, 2.6, 0.3), (0.7, 1.1, 0.6), mat('hat', P['hat'], 0.6))
    box('trunk_band', (3.0, 2.6, 0.45), (0.72, 1.12, 0.06), mat('gold', P['gold'], 0.35, 0.7))

    # ---- mirror view (-Y): tall mirror, drapes, rug, candle stands
    box('big_mirror_frame', (0, -4.8, 1.6), (1.7, 0.12, 3.0), mat('gold', P['gold'], 0.35, 0.7))
    box('big_mirror', (0, -4.73, 1.6), (1.45, 0.04, 2.75), mat('mirrorDk', P['mirrorDk'], 0.03, 1.0))
    for sx in (-1, 1):
        box(f'drape_{sx}', (sx * 1.5, -4.6, 2.2), (0.7, 0.25, 4.4), mat('curtainDk', P['curtainDk'], 0.75))
        cyl(f'candle_stand_{sx}', (sx * 1.6, -3.0, 0.6), 0.04, 1.2, mat('silver', P['silver'], 0.3, 1.0))
        cyl(f'candle_{sx}', (sx * 1.6, -3.0, 1.3), 0.05, 0.2, mat('paint', P['paint'], 0.6))
        sphere(f'flame_{sx}', (sx * 1.6, -3.0, 1.45), 0.035, mat('flame', P['ochre'], 0.4, 0.0, 12.0))
    cyl('rug', (0, -3.4, 0.01), 1.3, 0.02, mat('rug', P['rug'], 1.0), 40)

    # ---- tent exit view (-X): canvas flaps, crates, poster board, lantern
    box('door_dark', (-4.9, 0, 1.4), (0.05, 1.6, 2.8), mat('black', P['black'], 0.9))
    for sy in (-1, 1):
        box(f'flap_{sy}', (-4.8, sy * 0.75, 1.5), (0.06, 0.5, 3.0), mat('canvas', P['ochre'], 0.95), rot_z=sy * 12)
    for i, (y, z) in enumerate([(-2.2, 0.35), (-2.9, 0.35), (-2.55, 1.05)]):
        box(f'crate_{i}', (-4.2, y, z), (0.7, 0.7, 0.7), mat('wood', P['wood'], 0.7))
    box('poster', (-4.92, 2.4, 1.7), (0.03, 1.1, 1.5), mat('paint', P['paint'], 0.8))
    box('poster_band', (-4.9, 2.4, 2.05), (0.03, 1.0, 0.3), mat('ring', P['ring'], 0.6))
    cyl('lantern', (-3.6, 1.6, 0.25), 0.12, 0.3, mat('lantern', P['ochre'], 0.4, 0.0, 5.0))


def build_lights():
    world = bpy.data.worlds.new('dark')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#1E1418')
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    bpy.context.scene.world = world

    def area(name, loc, size, power, col, aim):
        bpy.ops.object.light_add(type='AREA', location=loc)
        l = bpy.context.object
        l.name = name
        l.data.size = size
        l.data.energy = power
        l.data.color = srgb(col)[:3]
        d = Vector(aim) - Vector(loc)
        l.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    # warm key over the ring from top-left front (stage world key direction), plus one per zone
    area('key_ring', (-2.0, 1.6, 6.5), 2.5, 1300, '#FFDBA8', (0, 3.2, 0))
    area('zone_dressing', (3.0, 0, 4.0), 2.0, 350, '#FFDBA8', (4.6, 0, 1))
    area('zone_mirror', (0, -2.2, 4.0), 2.0, 300, '#C9D5D7', (0, -4.6, 1.2))
    area('zone_exit', (-2.8, 0.5, 4.0), 2.0, 300, '#FFDBA8', (-4.6, 0, 1))
    area('fill_low', (0, 0, 1.2), 3.0, 120, '#E88A72', (0, 0, 3))


def depth_along(o, cam_loc, fwd):
    # bounding-box centre along the horizontal view axis (nearest corner put big pieces like the ring curb in front)
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return (sum(pts, Vector()) / 8 - cam_loc).dot(fwd)


def is_flat(o):
    # floor decals (sawdust, rug) stay with the floor: hidden from the camera they would still shade it black
    zs = [(o.matrix_world @ Vector(c)).z for c in o.bound_box]
    return max(zs) < 0.06


# ring-view props that the act board view leaves out (same +Y wall)
RING_ONLY = ('curtain_', 'valance', 'backcloth', 'sawdust', 'ring_curb', 'stool', 'post_', 'rope')
# the wall each view looks at (the board hangs on the ring wall)
WALL_OF = dict(board='ring')


def excluded(o, view):
    if view == 'board':
        return o.name.startswith(RING_ONLY)
    return o.name.startswith('board_')


def layer_of(o, view, cam_loc, fwd):
    n = o.name
    if excluded(o, view):
        return None
    if n == 'floor' or is_flat(o):
        return 'mid'
    if n.startswith('wall_'):
        return 'back' if n == 'wall_' + WALL_OF.get(view, view) else None
    if n == 'ceiling':
        return None
    d = depth_along(o, cam_loc, fwd)
    if d < 0.2:
        return None
    if d < CONFIG['frontMax']:
        return 'front'
    if d < CONFIG['midMax']:
        return 'mid'
    return 'back'


def main():
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4
    sc.render.resolution_x, sc.render.resolution_y = CONFIG['res']
    sc.render.resolution_percentage = PCT
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    build_room()
    build_lights()

    bpy.ops.object.camera_add()
    cam = bpy.context.object
    sc.camera = cam
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.angle_y = math.radians(CONFIG['renderFov'])
    cam.data.clip_start = 0.05
    cam.location = (0, 0, CONFIG['camZ'])

    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    out = dict(config={k: CONFIG[k] for k in ('half', 'camZ', 'pitch', 'renderFov', 'playFov', 'res', 'planeDepth', 'clownAt')},
               coords='Blender Z-up; three.js (x, y, z) = Blender (x, z, -y); yaw 0 looks Blender +Y (three -Z)', views={})
    for view, (title, yaw) in VIEWS.items():
        if ONLY and view not in ONLY:
            continue
        # props that belong to another view on the same wall are left out of the render (no shadow, no bounce)
        for o in meshes:
            o.hide_render = excluded(o, view)
        cam.rotation_euler = (math.radians(90 + CONFIG['pitch']), 0, math.radians(yaw))
        fwd = Vector((-math.sin(math.radians(yaw)), math.cos(math.radians(yaw)), 0))
        cam_loc = Vector(cam.location)
        assign = {o.name: layer_of(o, view, cam_loc, fwd) for o in meshes}
        files = {}
        for layer in ('back', 'mid', 'front'):
            # other layers stay in the scene (shadows, bounce light) but are hidden from the camera
            for o in meshes:
                o.visible_camera = assign[o.name] == layer
            sc.render.film_transparent = layer != 'back'
            path = os.path.join(OUT, f'{view}_{layer}.png')
            sc.render.filepath = path
            bpy.ops.render.render(write_still=True)
            files[layer] = os.path.basename(path)
            print('RENDERED', path, flush=True)
        out['views'][view] = dict(title=title, yaw=yaw, files=files,
                                  layers={k: sorted(n for n, v in assign.items() if v == k) for k in ('back', 'mid', 'front')})
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'cube_room.blend'))
    with open(os.path.join(OUT, 'views.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print('DONE', OUT)


main()

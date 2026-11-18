"""The Clown and the Mirror: procedural 3D characters in Blender (bpy 5.2.3, headless).
1 Blender unit = 1 target pixel at 64 px. Toon emission materials (normal . fixed light,
4 constant bands from the character's palette ramps), orthographic camera, four views by
rotating the root: front 0, left -90, back 180, right 90. Renders 256x256 (4 px per unit).
Run: python3 -I build.py <character>  -> renders/<character>_<view>.png, <character>.blend, .glb"""
import math, os, sys
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from palette import RAMPS

CONFIG = dict(
    res=256, ortho=64, cam=(0, -100, 30),
    light=(-0.45, -0.72, 0.53),             # toward the light: top-left, mostly frontal
    bands=(0.0, 0.30, 0.55, 0.82),          # deep, shadow, base, light (deep only on surfaces facing well away)
    views=dict(front=0, left=-90, back=180, right=90),
    segs=32, rings=16,
)

def srgb_to_lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_lin(h):
    h = h.lstrip('#')
    return tuple(srgb_to_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4)) + (1.0,)

# ---------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 1
    sc.cycles.max_bounces = 0
    sc.cycles.use_denoising = False
    sc.render.filter_size = 0.01
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = CONFIG['res']
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = CONFIG['ortho']
    co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co)
    co.location = CONFIG['cam']; co.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = co
    root = bpy.data.objects.new('root', None); sc.collection.objects.link(root)
    return root

_mats = {}
def toon(ramp_name):
    if ramp_name in _mats: return _mats[ramp_name]
    light, base, shadow, deep = RAMPS[ramp_name]
    m = bpy.data.materials.new(ramp_name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    vec = nt.nodes.new('ShaderNodeCombineXYZ')
    L = Vector(CONFIG['light']).normalized()
    vec.inputs[0].default_value, vec.inputs[1].default_value, vec.inputs[2].default_value = L
    dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    nt.links.new(geo.outputs['Normal'], dot.inputs[0]); nt.links.new(vec.outputs[0], dot.inputs[1])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1; mr.inputs['From Max'].default_value = 1
    nt.links.new(dot.outputs['Value'], mr.inputs['Value'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'
    els = cr.color_ramp.elements
    while len(els) < 4: els.new(0.5)
    for el, pos, col in zip(els, CONFIG['bands'], (deep, shadow, base, light)):
        el.position = pos; el.color = hex_lin(col)
    nt.links.new(mr.outputs['Result'], cr.inputs['Fac'])
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(cr.outputs['Color'], em.inputs['Color'])
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs['Surface'])
    _mats[ramp_name] = m
    return m

def flat(hexcol):
    """Unshaded single colour (eyes, mouth): the same colour from every angle."""
    key = 'flat' + hexcol
    if key in _mats: return _mats[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = hex_lin(hexcol)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs['Surface'])
    _mats[key] = m
    return m

# ---------------------------------------------------------------- primitives (all parented to root)
ROOT = None
def _finish(o, mat):
    o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth = True
    o.parent = ROOT
    return o

def ell(mat, loc, scale, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=CONFIG['segs'], ring_count=CONFIG['rings'], radius=1, location=loc)
    o = bpy.context.active_object; o.scale = scale
    o.rotation_euler = tuple(math.radians(a) for a in rot)
    return _finish(o, mat)

def cone(mat, p1, p2, r1, r2, yscale=1.0):
    p1, p2 = Vector(p1), Vector(p2); d = p2 - p1
    bpy.ops.mesh.primitive_cone_add(vertices=CONFIG['segs'], radius1=r1, radius2=r2, depth=d.length, location=(p1 + p2) / 2)
    o = bpy.context.active_object
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    if yscale != 1.0:
        bpy.context.view_layer.update()
        o.scale = (1, yscale, 1) if abs(d.normalized().z) > 0.9 else (1, 1, 1)
    return _finish(o, mat)

def cyl(mat, loc, r, depth, scale=(1, 1, 1), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=CONFIG['segs'], radius=r, depth=depth, location=loc)
    o = bpy.context.active_object; o.scale = scale
    o.rotation_euler = tuple(math.radians(a) for a in rot)
    return _finish(o, mat)

def capsule(mat, p, q, r):
    cone(mat, p, q, r, r)
    ell(mat, p, (r, r, r)); ell(mat, q, (r, r, r))

def torus(mat, loc, R, r, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=CONFIG['segs'], minor_segments=12, location=loc)
    o = bpy.context.active_object; o.scale = scale
    return _finish(o, mat)

def on_surface(c, r, x, z, push=0.0):
    """y of the front (-y) surface of an ellipsoid centred c with radii r, at (x, z)."""
    t = 1 - ((x - c[0]) / r[0]) ** 2 - ((z - c[2]) / r[2]) ** 2
    return c[1] - r[1] * math.sqrt(max(t, 0.0)) - push

# ---------------------------------------------------------------- characters
def clown():
    """Auguste clown, off-stage: feet together, hands clasped low, shoulders dropped,
    faded painted smile over a real frown, heavy drooping lids, brows climbing to the centre."""
    for s in (-1, 1):
        ell(toon('SHOE'), (s * 5.6, -2.4, 1.8), (3.6, 6.2, 2.0), rot=(0, 0, s * 18))   # big shoes, toes out
        cyl(toon('HAT'), (s * 4.3, 0, 4.4), 2.1, 3.0)
        cyl(toon('OCHRE'), (s * 4.9, 0, 13.0), 5.6, 17.0, scale=(1, 0.9, 1))           # baggy legs
    ell(toon('OCHRE'), (0, 0, 20.5), (11.0, 7.4, 4.0))
    cone(toon('WARM_WHITE'), (0, 0, 21.5), (0, 0, 37.6), 13.6, 7.4)                    # smock
    blouse = bpy.context.active_object; blouse.scale = (1, 0.72, 1)
    for s in (-1, 1):
        cone(toon('WARM_WHITE'), (s * 8.0, 0.6, 36.0), (s * 2.6, -8.4, 29.4), 3.6, 4.3)
        ell(toon('SKIN'), (s * 1.5, -9.4, 28.8), (2.2, 1.5, 2.3), rot=(0, 0, s * 20))     # palms
    for k in range(4):                                                                  # fingers folded over the other hand
        z = 30.0 - k * 1.0
        capsule(toon('SKIN'), (2.2, -10.6, z), (-1.9, -10.9, z - 0.2), 0.5)
    capsule(toon('SKIN'), (-1.4, -10.0, 31.0), (0.4, -10.6, 31.3), 0.55)                # thumb on top
    for z in (34.6,):
        r = 7.4 + (37.6 - z) / 16.1 * 6.2
        ell(toon('RED'), (0, -r * 0.72 - 0.3, z), (1.5, 1.0, 1.5))
    torus(toon('PAINT'), (0, 0, 38.6), 8.0, 2.0, scale=(1, 0.85, 1))                    # pleated ruff, wider than the shoulders
    for i in range(20):
        a = 2 * math.pi * i / 20
        ell(toon('PAINT' if i % 2 else 'WARM_WHITE'), (9.6 * math.cos(a), 9.6 * 0.85 * math.sin(a), 38.6), (2.0, 2.0, 2.3))
    HC, HR = (0, 0, 47.2), (8.0, 7.4, 8.0)                                              # head raised clear of the ruff
    ell(toon('SKIN'), HC, HR)
    for s in (-1, 1):
        ell(toon('SKIN'), (s * 8.0, 0.2, 46.7), (1.2, 1.6, 2.0))
        ell(toon('RUST_HAIR'), (s * 7.4, 1.2, 49.8), (2.7, 4.6, 3.3))
        for k, ang in enumerate(range(-30, 60, 28)):
            a = math.radians(ang)
            ell(toon('RUST_HAIR' if k % 2 else 'RUST_DARK'), (s * (7.9 + math.sin(a)), 1.2 + 3.6 * math.cos(a), 49.5 + 1.6 * math.sin(a)), (1.1, 1.6, 2.4))
    for k, ang in enumerate(range(-70, 71, 20)):                                       # fringe of hair round the back
        t = math.radians(ang)
        ell(toon('RUST_HAIR' if k % 2 else 'RUST_DARK'), (7.0 * math.sin(t), 5.6 * math.cos(t) + 0.6, 47.6), (2.0, 1.6, 2.6))
    for s in (-1, 1):
        x = s * 3.1
        ell(flat('#F4F4F2'), (x, on_surface(HC, HR, x, 45.9, -0.15), 45.9), (1.7, 0.6, 1.2))           # paint under the eye
        ell(flat('#1E1714'), (x, on_surface(HC, HR, x, 47.0, 0.25), 47.0), (1.0, 0.4, 1.1))            # eye
        ell(toon('SKIN'), (x, on_surface(HC, HR, x, 47.9, 0.5), 47.9), (1.6, 0.6, 0.85), rot=(0, s * 15, 0))   # lid droops outward
        ell(flat('#F4F4F2'), (x - s * 0.4, on_surface(HC, HR, x, 46.7, 0.45), 46.7), (0.45, 0.3, 0.45))  # small highlight
        bx, bz = s * 3.3, 50.0                                                          # brow, inner end higher
        ell(flat('#3D332D'), (bx, on_surface(HC, HR, bx, bz, 0.25), bz), (2.4, 0.9, 0.6), rot=(0, s * 25, 0))
        ell(flat('#E88A72'), (s * 3.4, on_surface(HC, HR, s * 3.4, 43.2, 0.15), 43.2), (0.7, 0.35, 0.6))  # faded smile corner
    ell(toon('RED'), (0, on_surface(HC, HR, 0, 45.0, 0.9), 45.0), (1.8, 1.7, 1.7))
    arc(flat('#7A2E26'), [(x, on_surface(HC, HR, x, z, 0.2), z)                                       # real mouth: frown on bare skin
                          for x, z in ((-2.2, 41.9), (-1.1, 42.6), (0, 42.8), (1.1, 42.6), (2.2, 41.9))], (0.6, 0.4, 0.45))
    cyl(toon('HAT'), (0, 0, 53.8), 9.4, 1.0, rot=(4, 0, 0))                                            # crumpled bowler
    ell(toon('HAT'), (0, 0.4, 56.2), (6.1, 5.6, 3.3))
    cyl(toon('HAT'), (0, 0.3, 54.6), 6.3, 0.8)

def arc(mat, pts, size):
    """A run of small flat ellipsoids along points (brows, mouths, claws)."""
    for (x, y, z) in pts: ell(mat, (x, y, z), size)

def whiteface():
    """Whiteface partner: upright, fitted crimson and gold, tall silver cone, full white face,
    high arched brows, small neat mouth, heels together, right hand on hip."""
    for s in (-1, 1):
        ell(toon('BLACK'), (s * 3.4, -1.6, 1.2), (1.9, 3.6, 1.3), rot=(0, 0, s * 25))      # slippers, heels together
        cyl(toon('PAINT'), (s * 3.0, 0, 8.0), 1.9, 12.0)                                  # white stockings
        ell(toon('CRIMSON'), (s * 3.6, 0, 16.6), (4.2, 4.0, 4.4))                         # puffed breeches
        ell(toon('CRIMSON'), (s * 8.6, 0, 34.4), (3.0, 3.0, 2.8))                         # shoulder puffs
    ell(toon('CRIMSON'), (0, 0, 20.4), (8.0, 5.6, 3.6))
    ell(toon('CRIMSON'), (0, 0, 28.6), (8.0, 5.6, 9.0))                                   # fitted tunic
    torus(toon('GOLD'), (0, 0, 20.8), 7.7, 0.9, scale=(1, 0.72, 1))                       # gold belt
    cone(toon('CRIMSON'), (-9.0, 0, 33.0), (-9.6, 0, 22.4), 1.9, 1.7)                    # arm hanging straight
    ell(toon('PAINT'), (-9.7, 0, 21.0), (1.9, 1.8, 2.0))                                 # glove
    cone(toon('CRIMSON'), (9.0, 0, 33.0), (13.4, 1.0, 27.4), 1.9, 1.8)                   # akimbo: upper arm out
    cone(toon('CRIMSON'), (13.4, 1.0, 27.4), (8.2, -1.0, 23.6), 1.8, 1.6)                # forearm back to the hip
    ell(toon('PAINT'), (7.7, -1.6, 23.3), (1.9, 1.8, 1.9))
    for z in (31.0, 26.0):
        ell(toon('GOLD'), (0, on_surface((0, 0, 28.6), (8.0, 5.6, 9.0), 0, z, 0.4), z), (1.3, 0.9, 1.3))
    torus(toon('PAINT'), (0, 0, 36.6), 5.6, 1.5, scale=(1, 0.85, 1))                     # ruff
    for i in range(16):
        a = 2 * math.pi * i / 16
        ell(toon('PAINT' if i % 2 else 'SILVER'), (6.6 * math.cos(a), 6.6 * 0.85 * math.sin(a), 36.8), (1.5, 1.5, 1.8))
    HC, HR = (0, 0, 44.6), (7.4, 6.9, 7.8)
    ell(toon('PAINT'), HC, HR)
    for s in (-1, 1):
        ell(toon('PAINT'), (s * 7.4, 0.2, 44.2), (1.1, 1.5, 1.9))                        # ears
        x = s * 2.9
        ell(flat('#1E1714'), (x, on_surface(HC, HR, x, 45.0, 0.25), 45.0), (0.95, 0.4, 1.4))          # level eyes
        ell(flat('#F4F4F2'), (x - s * 0.35, on_surface(HC, HR, x, 45.6, 0.45), 45.6), (0.45, 0.3, 0.45))
        arc(flat('#24212A'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.25), zz)
                              for xx, zz in ((1.1, 48.6), (1.9, 49.8), (3.0, 50.3), (4.1, 49.8), (4.8, 48.8))], (0.42, 0.35, 0.42))   # high, thin arches well above the eyes
    ell(flat('#962E3A'), (0, on_surface(HC, HR, 0, 40.6, 0.2), 40.6), (1.5, 0.4, 0.75))             # small neat mouth
    ell(flat('#24212A'), (4.2, on_surface(HC, HR, 4.2, 42.2, 0.2), 42.2), (0.45, 0.3, 0.45))         # beauty mark
    torus(toon('GOLD'), (0, 0, 50.6), 5.4, 0.7)                                          # hat band
    cone(toon('SILVER'), (0, 0, 50.4), (0, 0, 59.2), 5.4, 0.3)                             # tall cone hat
    ell(toon('GOLD'), (0, 0, 59.0), (1.0, 1.0, 1.0))
    for (x, z) in ((-1.6, 53.0), (1.9, 54.8), (-0.6, 56.6), (2.6, 52.0)):                # sequins
        r = 5.4 * (59.2 - z) / 8.8
        ell(flat('#F0D27A'), (x, -math.sqrt(max(r * r - x * x, 0.1)) - 0.15, z), (0.45, 0.3, 0.45))

def performer():
    """The Performer: the clown's own costume in Mirror colours, wide open stance,
    arms flung up, wide eyes, high brows and a red grin (the only warm colour)."""
    for s in (-1, 1):
        ell(toon('M_DARK'), (s * 14.4, -2.2, 1.8), (3.4, 6.0, 2.0), rot=(0, 0, s * 25))
        cone(toon('M_MID'), (s * 4.2, 0, 20.0), (s * 13.2, 0, 4.0), 5.2, 4.2)             # legs spread wide
    ell(toon('M_MID'), (0, 0, 20.5), (10.6, 7.2, 4.0))
    cone(toon('M_PALE'), (0, 0, 21.5), (0, 0, 37.6), 13.6, 7.4)
    bpy.context.active_object.scale = (1, 0.72, 1)
    for s in (-1, 1):
        cone(toon('M_PALE'), (s * 8.0, 0.6, 35.6), (s * 21.4, -2.0, 49.6), 3.6, 4.3)     # arms flung up: ta-da
        ell(toon('M_PALE'), (s * 23.0, -2.4, 51.4), (2.4, 2.0, 2.4))                      # open hands
    for z in (33.6, 29.0, 24.4):
        r = 7.4 + (37.6 - z) / 16.1 * 6.2
        ell(toon('M_MID'), (0, -r * 0.72 - 0.3, z), (1.5, 1.0, 1.5))
    torus(toon('M_PALE'), (0, 0, 38.6), 8.0, 2.0, scale=(1, 0.85, 1))
    for i in range(20):
        a = 2 * math.pi * i / 20
        ell(toon('M_PALE' if i % 2 else 'M_MID'), (9.6 * math.cos(a), 9.6 * 0.85 * math.sin(a), 38.6), (2.0, 2.0, 2.3))
    HC, HR = (0, 0, 47.2), (8.0, 7.4, 8.0)
    ell(toon('PAINT'), HC, HR)                                                            # full white face
    for s in (-1, 1):
        ell(toon('PAINT'), (s * 8.0, 0.2, 46.7), (1.2, 1.6, 2.0))
        ell(toon('M_DARK'), (s * 7.4, 1.2, 49.8), (2.7, 4.6, 3.3))
        x = s * 3.1
        ell(flat('#1E1714'), (x, on_surface(HC, HR, x, 47.4, 0.05), 47.4), (2.0, 0.5, 2.1))          # dark ring round the eye
        ell(flat('#F4F4F2'), (x, on_surface(HC, HR, x, 47.4, 0.3), 47.4), (1.4, 0.5, 1.5))           # wide-open eye
        ell(flat('#1E1714'), (x, on_surface(HC, HR, x, 47.4, 0.6), 47.4), (0.7, 0.4, 0.75))          # small pupil
        arc(flat('#24212A'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.25), zz)
                              for xx, zz in ((1.2, 50.0), (2.2, 51.1), (3.3, 51.4), (4.4, 51.0), (5.2, 50.0))], (0.55, 0.4, 0.5))   # brows raised high
    for k in range(-1, 2, 2): pass
    ell(toon('RED'), (0, on_surface(HC, HR, 0, 45.0, 0.9), 45.0), (1.7, 1.6, 1.6))
    grin = [(-4.6, 43.6), (-3.8, 42.4), (-2.6, 41.6), (-1.3, 41.2), (0, 41.1), (1.3, 41.2), (2.6, 41.6), (3.8, 42.4), (4.6, 43.6)]
    arc(flat('#45201C'), [(x, on_surface(HC, HR, x, z, 0.1), z) for x, z in grin], (1.35, 0.4, 1.3))    # grin outline
    arc(flat('#C9604A'), [(x, on_surface(HC, HR, x, z, 0.3), z) for x, z in grin], (1.0, 0.4, 0.95))    # red grin to the cheeks
    arc(flat('#F4F4F2'), [(x, on_surface(HC, HR, x, z + 0.6, 0.5), z + 0.6) for x, z in grin[2:-2]], (0.75, 0.3, 0.5))   # teeth
    cyl(toon('M_DARK'), (0, 0, 53.8), 9.4, 1.0, rot=(4, 0, 0))
    ell(toon('M_DARK'), (0, 0.4, 56.2), (6.1, 5.6, 3.3))

def clinger():
    """Clinger (self-loathing): hunched, head sunk between raised shoulders, thick arms wrapped
    round itself, big bone-white claws digging into its own sides, the clown's paint smeared
    over its eyes and dripping, a pale puddle spreading under it."""
    ell(toon('M_PALE'), (0, -2.0, 1.3), (21.0, 13.0, 1.3))                                # puddle, resting on the floor
    for x, y in ((-15.0, -8.0), (13.0, -9.5), (17.0, 2.0)):
        ell(toon('M_PALE'), (x, y, 1.2), (2.2, 2.0, 1.2))                                 # drops round the puddle
    ell(toon('M_MID'), (0, 0.5, 13.0), (14.0, 11.0, 14.5))                                # body mound
    for s in (-1, 1):
        ell(toon('M_MID'), (s * 8.4, -1.0, 21.5), (6.8, 6.4, 5.4))                        # hunched shoulders, merged into the mound
    HC, HR = (0, -6.5, 22.5), (8.0, 7.2, 7.0)
    ell(toon('M_MID'), HC, HR)                                                            # head sunk low and forward
    ell(flat('#E2E3E3'), (0.6, on_surface(HC, HR, 0.6, 24.0, -0.1), 24.0), (6.0, 0.9, 2.2), rot=(0, 8, 0))   # smeared paint
    for x, z0, ln in ((-3.4, 22.2, 3.0), (0.6, 22.0, 2.2), (4.2, 22.4, 3.6)):            # drips down the face
        for k in range(int(ln * 2)):
            z = z0 - k * 0.5
            ell(flat('#F4F4F2'), (x, on_surface(HC, HR, x, z, 0.1), z), (0.6, 0.35, 0.6))
    for s in (-1, 1):
        arc(flat('#071315'), [(s * xx, on_surface(HC, HR, s * xx, zz, 1.1), zz)
                              for xx, zz in ((1.4, 24.6), (2.4, 24.3), (3.4, 23.8), (4.2, 23.2))], (0.8, 0.4, 0.7))   # eyes droop out
    arc(flat('#071315'), [(x, on_surface(HC, HR, x, z, 0.25), z)
                          for x, z in ((-2.4, 17.6), (-1.2, 18.3), (0, 18.5), (1.2, 18.3), (2.4, 17.6))], (0.75, 0.4, 0.55))   # mouth down
    a1 = [(-13.0, -2.0, 18.0), (-7.0, -10.0, 13.0), (2.0, -11.6, 10.6), (8.4, -10.0, 9.4)]
    a2 = [(13.0, -2.0, 15.0), (7.0, -10.4, 8.0), (-2.0, -11.6, 5.6), (-8.4, -10.0, 4.6)]
    for arm in (a1, a2):
        for p, q in zip(arm, arm[1:]):
            cone(toon('M_DARK'), p, q, 2.7, 2.6)
            ell(toon('M_DARK'), q, (2.6, 2.6, 2.6))
        hx_, hy, hz = arm[-1]; s = 1 if hx_ > 0 else -1
        for dz in (1.6, 0.0, -1.6):                                                       # three big claws
            cone(toon('PAINT'), (hx_ + s * 1.4, hy - 0.6, hz + dz * 0.7), (hx_ + s * 6.0, hy + 1.0, hz + dz * 1.4), 0.95, 0.25)

CHARS = dict(clown=clown, whiteface=whiteface, performer=performer, clinger=clinger)
SCALE = dict(clinger=1.35)   # whole-model scale about the feet
LIFT = dict(clinger=2.0)     # raise so the lowest part rests on the same ground row as the cast

def main(name):
    global ROOT
    ROOT = reset()
    CHARS[name]()
    ROOT.scale = (SCALE.get(name, 1.0),) * 3
    ROOT.location.z = LIFT.get(name, 0.0)
    out = os.path.join(HERE, 'renders'); os.makedirs(out, exist_ok=True)
    sc = bpy.context.scene
    for view, yaw in CONFIG['views'].items():
        ROOT.rotation_euler = (0, 0, math.radians(yaw))
        sc.render.filepath = os.path.join(out, f'{name}_{view}.png')
        bpy.ops.render.render(write_still=True)
    ROOT.rotation_euler = (0, 0, 0)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f'{name}.blend'))
    try:
        bpy.ops.export_scene.gltf(filepath=os.path.join(out, f'{name}.glb'), export_format='GLB')
    except Exception as e:
        print('GLB export failed:', e)

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'clown')

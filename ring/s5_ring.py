"""Step 5a: the circus ring set, built from soft primitives in the approved palette, joined into one mesh,
lit by the warm spotlight and bulb glow and baked (Cycles, COMBINED) into one atlas. Also writes the seat,
bulb and pole positions for instancing in three.js, and the crowd silhouette cards.
Run: python3 -I s5_ring.py <outdir> [--preview]   (--preview: small, fast bake for geometry checks)
Coordinates: Blender z-up, the camera side is -y (three.js +z). Units are metres."""
import os, sys, math, json, time
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import numpy as np
import bpy, bmesh
from mathutils import Vector
from palette import RAMPS

OUT = sys.argv[1]
PREVIEW = '--preview' in sys.argv
# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # ring floor radius (a standard circus ring is 13 m across)
    ring_r=6.5,
    # ring curb: centre radius, width, height, segments
    curb_r=6.7,
    curb_w=0.35,
    curb_h=0.45,
    curb_n=32,
    # seating tiers: count, first radius, step out per tier, step up per tier
    tiers=5,
    tier_r0=7.6,
    tier_dr=0.9,
    tier_dh=0.45,
    # bench segment arc in degrees
    seg_deg=10,
    # gaps in the seating (degrees, centre and half-width): camera aisle, entrance, two pole aisles
    gaps=((-90, 6), (90, 26), (0, 5), (180, 5)),
    # crowd seat spacing along a bench, metres
    seat_gap=0.55,
    # tent wall radius and height, roof peak height, stripes round the tent
    tent_r=14.5,
    wall_h=5.0,
    peak_h=14.0,
    stripes=24,
    # king poles: positions (x, y) and height
    poles=((-9.2, 0.0), (9.2, 0.0)),
    pole_h=12.5,
    # bunting and bulb strings per pole, flags per string, bulbs per string
    strings=6,
    flags=14,
    bulbs=22,
    # spotlight: height, cone angle (degrees), blend, power (W)
    spot_z=13.0,
    spot_deg=30.0,
    spot_blend=0.6,
    spot_w=9000.0,
    # world light: backdrop colour and strength (dark tent)
    world_strength=0.35,
    # bulb glow strength for the bake
    bulb_glow=25.0,
    # atlas size (colour detail), pixels
    tex=256 if PREVIEW else 2048,
    # light bake size: lighting is smooth, so half the atlas size, then blurred and scaled up
    light_tex=128 if PREVIEW else 1024,
    # light bake samples per texel
    samples=8 if PREVIEW else 64,
    # blur of the light bake (pixels at light_tex), removes sampling noise
    light_blur=1.5,
    # UV emphasis before packing: floor and curb get more texels, roof fewer
    uv_gain=dict(floor=2.2, curb=1.6, roof=0.45, wall=0.7, boards=0.4),
    # crowd card atlas: cells across, cell size in pixels
    card_cells=8,
    card_w=128,
    card_h=192,
)
COL = dict(stage_spot='#FBD190', stage_wood='#DA9F69', backdrop='#1E1418')
G = []
def gate(name, ok, info=''):
    G.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

# ---------------------------------------------------------------- materials
_M = {}
def mat(key, hexcol, rough=0.7, emit=0.0):
    if key in _M: return _M[key]
    m = bpy.data.materials.new(key); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(hexcol); b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = lin(hexcol); b.inputs['Emission Strength'].default_value = emit
    _M[key] = m; return m

def ramp(name, k=1): return mat(f'{name}{k}', RAMPS[name][k])

def stripes_mat(key, a, b, n):
    """Vertical stripes round the tent: angle of the object position, n stripes."""
    if key in _M: return _M[key]
    m = bpy.data.materials.new(key); m.use_nodes = True; nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.85
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    at = nt.nodes.new('ShaderNodeMath'); at.operation = 'ARCTAN2'
    nt.links.new(sep.outputs['Y'], at.inputs[0]); nt.links.new(sep.outputs['X'], at.inputs[1])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = n / (2 * math.pi)
    nt.links.new(at.outputs[0], mul.inputs[0])
    fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'; nt.links.new(mul.outputs[0], fr.inputs[0])
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.5
    nt.links.new(fr.outputs[0], gt.inputs[0])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = lin(a); mix.inputs['B'].default_value = lin(b)
    nt.links.new(gt.outputs[0], mix.inputs['Factor']); nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    _M[key] = m; return m

def floor_mat():
    """Sawdust (two ochre tones in noise), wear darker towards the curb, sparse confetti and straw."""
    m = bpy.data.materials.new('floor'); m.use_nodes = True; nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.95
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 9.0; nz.inputs['Detail'].default_value = 8.0
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    saw = nt.nodes.new('ShaderNodeValToRGB'); el = saw.color_ramp.elements
    el[0].color = lin(RAMPS['OCHRE'][1]); el[1].color = lin(RAMPS['OCHRE'][0]); el[0].position = 0.35; el[1].position = 0.65
    nt.links.new(nz.outputs['Fac'], saw.inputs['Fac'])
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 60.0
    nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
    dist = nt.nodes.new('ShaderNodeMath'); dist.operation = 'LESS_THAN'; dist.inputs[1].default_value = 0.09
    nt.links.new(vor.outputs['Distance'], dist.inputs[0])
    pick = nt.nodes.new('ShaderNodeMath'); pick.operation = 'GREATER_THAN'; pick.inputs[1].default_value = 0.82
    nt.links.new(vor.outputs['Color'], pick.inputs[0])
    both = nt.nodes.new('ShaderNodeMath'); both.operation = 'MULTIPLY'
    nt.links.new(dist.outputs[0], both.inputs[0]); nt.links.new(pick.outputs[0], both.inputs[1])
    conf = nt.nodes.new('ShaderNodeValToRGB'); ce = conf.color_ramp.elements; conf.color_ramp.interpolation = 'CONSTANT'
    ce[0].color = lin(RAMPS['CRIMSON'][0]); ce[1].color = lin(RAMPS['GOLD'][0]); ce[1].position = 0.5
    e3 = ce.new(0.75); e3.color = lin(RAMPS['M_PALE'][0])
    nt.links.new(vor.outputs['Color'], conf.inputs['Fac'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    nt.links.new(both.outputs[0], mix.inputs['Factor']); nt.links.new(saw.outputs['Color'], mix.inputs['A']); nt.links.new(conf.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    return m

# ---------------------------------------------------------------- geometry helpers
PARTS = []
def keep(o, mat_, part):
    o.data.materials.clear(); o.data.materials.append(mat_)
    o['part'] = part; PARTS.append(o)
    return o

def cyl(r, depth, loc, n=32, caps=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=depth, location=loc, end_fill_type='NGON' if caps else 'NOTHING')
    return bpy.context.active_object

def box(size, loc, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot_z))
    o = bpy.context.active_object; o.scale = size
    return o

def flip(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()

def in_gap(deg):
    for c, w in CONFIG['gaps']:
        d = (deg - c + 180) % 360 - 180
        if abs(d) < w: return True
    return False

# ---------------------------------------------------------------- the set
def build_floor():
    c = CONFIG
    keep(cyl(c['ring_r'], 0.1, (0, 0, -0.05), 96), floor_mat(), 'floor')
    keep(cyl(c['tent_r'], 0.1, (0, 0, -0.12), 96), ramp('HAT', 2), 'boards')

def build_curb():
    c = CONFIG; n = c['curb_n']
    for i in range(n):
        a = 2 * math.pi * (i + 0.5) / n
        ln = 2 * math.pi * c['curb_r'] / n * 1.02
        o = box((c['curb_w'], ln, c['curb_h']), (c['curb_r'] * math.cos(a), c['curb_r'] * math.sin(a), c['curb_h'] / 2), a)
        keep(o, ramp('CRIMSON') if i % 2 else ramp('WARM_WHITE'), 'curb')
        t = box((c['curb_w'] + 0.06, ln, 0.06), (c['curb_r'] * math.cos(a), c['curb_r'] * math.sin(a), c['curb_h'] + 0.03), a)
        keep(t, ramp('GOLD'), 'curb')

def build_tiers():
    """Stepped benches round the ring with gaps for the aisles and the entrance; returns crowd seats."""
    c = CONFIG; seats = []
    for k in range(c['tiers']):
        r = c['tier_r0'] + c['tier_dr'] * k; h = c['tier_dh'] * (k + 1)
        for s in range(0, 360, c['seg_deg']):
            mid = s + c['seg_deg'] / 2
            if in_gap(mid): continue
            a = math.radians(mid); ln = 2 * math.pi * r * c['seg_deg'] / 360 * 1.01
            keep(box((c['tier_dr'], ln, h), (r * math.cos(a), r * math.sin(a), h / 2), a), mat('wood', COL['stage_wood']), 'tiers')
        n = int(2 * math.pi * r / c['seat_gap'])
        for j in range(n):
            deg = 360 * j / n
            if in_gap(deg): continue
            a = math.radians(deg); rr = r + 0.15
            seats.append(dict(x=rr * math.cos(a), y=rr * math.sin(a), z=h, tier=k))
    return seats

def build_tent():
    c = CONFIG
    w = cyl(c['tent_r'], c['wall_h'], (0, 0, c['wall_h'] / 2), 96, caps=False); flip(w)
    keep(w, stripes_mat('stripes', RAMPS['CRIMSON'][1], RAMPS['WARM_WHITE'][1], c['stripes']), 'wall')
    bpy.ops.mesh.primitive_cone_add(vertices=96, radius1=c['tent_r'], radius2=0.6, depth=c['peak_h'] - c['wall_h'],
                                    location=(0, 0, (c['peak_h'] + c['wall_h']) / 2), end_fill_type='NOTHING')
    roof = bpy.context.active_object; flip(roof)
    keep(roof, stripes_mat('stripes', RAMPS['CRIMSON'][1], RAMPS['WARM_WHITE'][1], c['stripes']), 'roof')
    for (x, y) in c['poles']:
        keep(cyl(0.16, c['pole_h'], (x, y, c['pole_h'] / 2), 16), ramp('WARM_WHITE', 2), 'poles')
        keep(cyl(0.3, 0.25, (x, y, 0.12), 16), ramp('GOLD'), 'poles')

def catenary(p, q, sag, n):
    pts = []
    for i in range(n):
        t = (i + 0.5) / n
        v = p.lerp(q, t); v.z -= sag * 4 * t * (1 - t)
        pts.append(v)
    return pts

def build_strings():
    """Bunting and bulb strings from each pole top out to the tent wall. Returns bulb positions."""
    c = CONFIG; bulbs = []; flag_cols = ['CRIMSON', 'GOLD', 'WARM_WHITE', 'OCHRE']
    for (x, y) in c['poles']:
        top = Vector((x, y, c['pole_h'] - 0.3))
        for s in range(c['strings']):
            a = math.pi * (s + 0.5) / c['strings'] + (math.pi / 2 if x < 0 else -math.pi / 2)
            end = Vector((c['tent_r'] * 0.98 * math.cos(a), c['tent_r'] * 0.98 * math.sin(a), c['wall_h'] - 0.2))
            for i, p in enumerate(catenary(top, end, 1.4, c['flags'])):
                d = (end - top).normalized()
                v0 = p - d * 0.22; v1 = p + d * 0.22; v2 = p + Vector((0, 0, -0.45))
                me = bpy.data.meshes.new('flag'); me.from_pydata([v0, v1, v2], [], [(0, 1, 2)])
                o = bpy.data.objects.new('flag', me); bpy.context.scene.collection.objects.link(o)
                keep(o, ramp(flag_cols[i % 4], 0), 'flags')
            sa = a + math.pi / c['strings'] / 2
            end2 = Vector((c['tent_r'] * 0.98 * math.cos(sa), c['tent_r'] * 0.98 * math.sin(sa), c['wall_h'] + 0.3))
            bulbs += [list(p) for p in catenary(top + Vector((0, 0, 0.2)), end2, 1.0, c['bulbs'])]
    return bulbs

def build_entrance():
    """Crimson drapes in a gold arch on the far side (+y): the performers' entrance."""
    y0 = CONFIG['tent_r'] - 0.6
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=16, y_subdivisions=24, size=1, location=(sx * 1.05, y0, 2.0), rotation=(math.pi / 2, 0, 0))
        o = bpy.context.active_object; o.scale = (1.9, 4.0, 1)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        for v in o.data.vertices: v.co.y += 0.12 * math.sin(v.co.x * 9.0)
        keep(o, ramp('CRIMSON'), 'entrance')
    bpy.ops.mesh.primitive_torus_add(major_radius=2.1, minor_radius=0.14, location=(0, y0 - 0.15, 4.0), rotation=(math.pi / 2, 0, 0))
    keep(bpy.context.active_object, ramp('GOLD'), 'entrance')
    for sx in (-1, 1):
        keep(cyl(0.14, 4.0, (sx * 2.1, y0 - 0.15, 2.0), 12), ramp('GOLD'), 'entrance')

def build_props():
    """Pedestals, a ladder and a prop cart at the ring edge, away from the camera line."""
    for i, (x, y) in enumerate(((-4.4, 2.6), (4.6, 2.2))):
        keep(cyl(0.48, 0.7, (x, y, 0.35), 24), ramp('CRIMSON'), 'props')
        keep(cyl(0.5, 0.08, (x, y, 0.72), 24), ramp('GOLD'), 'props')
        keep(cyl(0.5, 0.08, (x, y, 0.06), 24), ramp('GOLD'), 'props')
    lx, ly = -5.6, 3.9
    for sx in (-0.25, 0.25):
        r = box((0.06, 0.06, 3.2), (lx + sx, ly, 1.55)); r.rotation_euler = (0.25, 0, 0); keep(r, ramp('WARM_WHITE', 2), 'props')
    for k in range(9):
        z = 0.3 + k * 0.33; rr = box((0.5, 0.05, 0.05), (lx, ly + math.tan(0.25) * (z - 1.55), z)); keep(rr, ramp('WARM_WHITE', 2), 'props')
    cx, cy = 5.4, 3.8
    keep(box((1.1, 0.7, 0.55), (cx, cy, 0.62)), ramp('CRIMSON'), 'props')
    keep(box((1.16, 0.76, 0.06), (cx, cy, 0.92)), ramp('GOLD'), 'props')
    for wx in (-0.42, 0.42):
        for wy in (-0.38, 0.38):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.2, minor_radius=0.05, location=(cx + wx, cy + wy, 0.22), rotation=(math.pi / 2, 0, 0))
            keep(bpy.context.active_object, ramp('GOLD', 2), 'props')

def bake_lights(bulbs):
    c = CONFIG; sc = bpy.context.scene
    sp = bpy.data.lights.new('spot', 'SPOT'); sp.energy = c['spot_w']; sp.color = lin(COL['stage_spot'])[:3]
    sp.spot_size = math.radians(c['spot_deg']); sp.spot_blend = c['spot_blend']; sp.shadow_soft_size = 0.4
    so = bpy.data.objects.new('spot', sp); sc.collection.objects.link(so); so.location = (0, 0, c['spot_z'])
    w = bpy.data.worlds.new('w'); w.use_nodes = True; sc.world = w
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = lin(COL['backdrop']); bg.inputs['Strength'].default_value = c['world_strength']
    glow = mat('bulb', COL['stage_spot'], emit=c['bulb_glow']); out = []
    for p in bulbs:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.07, location=p)
        o = bpy.context.active_object; o.data.materials.append(glow); out.append(o)
    return out

# ---------------------------------------------------------------- join, UVs, bake
def join_and_uv():
    sel = PARTS
    for i, o in enumerate(sel):
        a = o.data.attributes.new('setpart', 'INT', 'FACE')
        a.data.foreach_set('value', [i] * len(o.data.polygons))
        if not o.data.uv_layers: o.data.uv_layers.new()
    names = [o['part'] for o in sel]
    bpy.ops.object.select_all(action='DESELECT')
    for o in sel: o.select_set(True)
    bpy.context.view_layer.objects.active = sel[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join(); S = bpy.context.active_object; S.name = 'ring_set'
    # faces resting on the ground point down and are never seen: drop them so they take no atlas space
    bm = bmesh.new(); bm.from_mesh(S.data); bm.faces.ensure_lookup_table()
    down = [f for f in bm.faces if f.normal.z < -0.95 and f.calc_center_median().z < 0.05]
    bmesh.ops.delete(bm, geom=down, context='FACES'); bm.to_mesh(S.data); bm.free()
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(50), island_margin=0.002)
    bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.average_islands_scale()
    bpy.ops.object.mode_set(mode='OBJECT')
    sp = np.zeros(len(S.data.polygons), np.int32); S.data.attributes['setpart'].data.foreach_get('value', sp)
    uvl = S.data.uv_layers.active.data
    for p in S.data.polygons:
        g = CONFIG['uv_gain'].get(names[sp[p.index]], 1.0)
        if g == 1.0: continue
        for li in p.loop_indices: uvl[li].uv = uvl[li].uv * g
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(margin=0.003, rotate=True)
    bpy.ops.uv.select_all(action='DESELECT'); bpy.ops.uv.select_overlap(); bpy.ops.object.mode_set(mode='OBJECT')
    ov = sum(1 for p in S.data.polygons if p.select)
    for p in S.data.polygons: p.use_smooth = False
    return S, names, sp, ov

def bake_pass(S, size, kind, filt, samples, float_buf):
    sc = bpy.context.scene; sc.cycles.samples = samples
    img = bpy.data.images.new(f'bake_{kind}_{size}', size, size, alpha=False, float_buffer=float_buf)
    for m in S.data.materials:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n
    b = sc.render.bake; b.use_selected_to_active = False; b.margin = 6; b.margin_type = 'EXTEND'
    bpy.ops.object.select_all(action='DESELECT'); S.select_set(True); bpy.context.view_layer.objects.active = S
    bpy.ops.object.bake(type=kind, pass_filter=filt)
    a = np.empty(size * size * 4, np.float32); img.pixels.foreach_get(a)
    return a.reshape(size, size, 4)[..., :3]

def blur(a, sigma):
    r = int(3 * sigma); k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    for ax in (0, 1):
        a = np.apply_along_axis(lambda v: np.convolve(np.pad(v, r, mode='edge'), k, mode='valid'), ax, a)
    return a

def bake_set(S, glow_objs):
    """Light (direct + indirect, no colour) at light_tex, blurred and scaled up, times colour at tex (one sample, crisp)."""
    c = CONFIG; sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    t = time.time()
    light = bake_pass(S, c['light_tex'], 'DIFFUSE', {'DIRECT', 'INDIRECT'}, c['samples'], True)
    dt_light = time.time() - t
    emit = bake_pass(S, c['light_tex'], 'EMIT', set(), 1, True)
    col = bake_pass(S, c['tex'], 'DIFFUSE', {'COLOR'}, 1, False)
    col_lin = np.where(col <= 0.04045, col / 12.92, ((col + 0.055) / 1.055) ** 2.4)
    light = blur(light, c['light_blur']) + emit
    k = c['tex'] // c['light_tex']
    light = np.repeat(np.repeat(light, k, 0), k, 1)
    light = blur(light, k * 0.5) if k > 1 else light
    lin = np.clip(col_lin * light, 0, 1)
    srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    img = bpy.data.images.new('ring_bake', c['tex'], c['tex'], alpha=False)
    img.pixels.foreach_set(np.concatenate([srgb, np.ones(srgb.shape[:2] + (1,), np.float32)], -1).astype(np.float32).ravel())
    img.filepath_raw = os.path.join(OUT, 'ring_bake.png'); img.file_format = 'PNG'; img.save()
    return img, dt_light

# ---------------------------------------------------------------- crowd cards
def crowd_cards(path):
    """8 seated figures seen from behind (the camera is behind the back rows): head, hair or hat, shoulders.
    RGBA: R = body shade, G = rim (top edges, lit from the ring), A = coverage."""
    c = CONFIG; W, H, n = c['card_w'], c['card_h'], c['card_cells']
    rng = np.random.default_rng(7)
    img = np.zeros((H, W * n, 4), np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for k in range(n):
        s = 0.8 + 0.25 * rng.random() if k % 4 else 0.62
        cx = W / 2 + rng.uniform(-6, 6)
        sh_w = W * 0.42 * s; sh_top = H * (1 - 0.48 * s)
        body = ((np.abs(xx - cx) < sh_w * (0.75 + 0.25 * (yy - sh_top) / max(H - sh_top, 1))) & (yy > sh_top)).astype(np.float32)
        hr = W * 0.16 * s; hy = sh_top - hr * 0.7
        head = (((xx - cx) / hr) ** 2 + ((yy - hy) / (hr * 1.15)) ** 2 < 1).astype(np.float32)
        hat = np.zeros_like(head)
        kind = k % 4
        if kind == 1:
            hat = ((np.abs(xx - cx) < hr * 1.5) & (np.abs(yy - (hy - hr * 0.7)) < 2.5)) | ((np.abs(xx - cx) < hr * 0.9) & (yy > hy - hr * 1.6) & (yy < hy - hr * 0.6))
        elif kind == 2:
            hat = ((xx - cx) / (hr * 0.6)) ** 2 + ((yy - (hy - hr * 1.1)) / (hr * 0.5)) ** 2 < 1
        elif kind == 3:
            hat = ((xx - cx) / (hr * 1.25)) ** 2 + ((yy - (hy + hr * 0.2)) / (hr * 1.1)) ** 2 < 1
        a = np.clip(body + head + hat.astype(np.float32), 0, 1)
        sh = np.roll(a, 4, axis=0); sh[:4] = 0
        rim = np.clip(a - sh, 0, 1)
        cell = np.stack([0.75 + 0.25 * rng.random() * a, rim, np.zeros_like(a), a], -1)
        img[:, k * W:(k + 1) * W] = cell
    im = bpy.data.images.new('cards', W * n, H, alpha=True)
    im.pixels.foreach_set(np.flipud(img).ravel())
    im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    return img

def to_three(p): return [round(p[0], 4), round(p[2], 4), round(-p[1], 4)]

def main():
    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_floor(); build_curb(); seats = build_tiers(); build_tent(); bulbs = build_strings(); build_entrance(); build_props()
    glow = bake_lights(bulbs)
    S, names, sp, ov = join_and_uv()
    tris = sum(len(p.vertices) - 2 for p in S.data.polygons)
    gate('set: one mesh, triangles <= 60k', tris <= 60000, f'{tris} triangles from {len(names)} parts')
    gate('set UVs: no overlaps', ov == 0, f'{ov} faces')
    img, dt = bake_set(S, glow)
    px = np.empty(img.size[0] * img.size[1] * 4, np.float32); img.pixels.foreach_get(px)
    gate('bake finite and not black', np.isfinite(px).all() and px.reshape(-1, 4)[:, :3].mean() > 0.02, f'mean {px.reshape(-1, 4)[:, :3].mean():.3f}, light bake {dt:.0f}s at {CONFIG["light_tex"]}px x {CONFIG["samples"]} samples')
    # the spot pool: floor texels near the centre must be brighter than floor texels near the curb
    bright_ok, info = spot_pool_check(S, names, sp, px.reshape(img.size[1], img.size[0], 4))
    gate('spot pool: ring centre brighter than its edge', bright_ok, info)
    for o in glow: bpy.data.objects.remove(o)
    final = bpy.data.materials.new('ring_set'); final.use_nodes = True
    bsdf = final.node_tree.nodes['Principled BSDF']; tn = final.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img
    final.node_tree.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    S.data.materials.clear(); S.data.materials.append(final)
    for o in list(bpy.context.scene.objects):
        if o is not S: bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='DESELECT'); S.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'ring_set.glb'), export_format='GLB', use_selection=True, export_attributes=False)
    cards = crowd_cards(os.path.join(OUT, 'crowd_cards.png'))
    gate('crowd cards: 8 figures, each covers 15-60% of its cell', all(0.15 < cards[:, k * CONFIG['card_w']:(k + 1) * CONFIG['card_w'], 3].mean() < 0.6 for k in range(CONFIG['card_cells'])))
    lay = dict(
        seats=[dict(p=to_three((s['x'], s['y'], s['z'])), tier=s['tier']) for s in seats],
        bulbs=[to_three(b) for b in bulbs],
        spot=dict(pos=to_three((0, 0, CONFIG['spot_z'])), angle_deg=CONFIG['spot_deg'], penumbra=CONFIG['spot_blend'], color=COL['stage_spot']),
        ring_r=CONFIG['ring_r'], tent_r=CONFIG['tent_r'], fog=COL['backdrop'],
    )
    json.dump(lay, open(os.path.join(OUT, 'ring_layout.json'), 'w'))
    gate('layout: seats and bulbs', len(lay['seats']) >= 300 and len(lay['bulbs']) >= 100, f'{len(lay["seats"])} seats, {len(lay["bulbs"])} bulbs')
    json.dump(G, open(os.path.join(OUT, 'gates_ring.json'), 'w'), indent=1)

def spot_pool_check(S, names, sp, px):
    """Sample the floor cap's texels: its UV centre (ring centre) against points 85% of the way to its rim."""
    uvl = S.data.uv_layers.active.data; H, W = px.shape[:2]
    def at(u, v): return float(px[min(int(v * H), H - 1), min(int(u * W), W - 1), :3].mean())
    for p in S.data.polygons:
        if names[sp[p.index]] != 'floor' or p.normal.z < 0.9 or len(p.vertices) < 16: continue
        uv = [Vector(uvl[li].uv) for li in p.loop_indices]; c = sum(uv, Vector((0, 0))) / len(uv)
        inner = at(*c); outer = float(np.mean([at(*(c.lerp(q, 0.85))) for q in uv]))
        return inner > outer * 1.3, f'centre {inner:.3f}, edge {outer:.3f}'
    return False, 'floor cap not found'

if __name__ == '__main__':
    main()

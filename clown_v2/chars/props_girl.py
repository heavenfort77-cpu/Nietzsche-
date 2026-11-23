"""The props girl (night-1 crew, proposal): same figure as art/cast2 props_girl(), rebuilt for the pipeline with the
clowns' level of modelled detail: lace-up heeled boots with soles, laces and cuffs; a knee-length skirt with pleats and
a hem band; a canvas apron with a pocket (scissors, a tape measure) and a bow at the back; a laced vest with eyelets
over a blouse with a round collar, puffed sleeves and elbow cuffs; hair over the back and top with a fringe and side
locks, a bun with a pencil through it, gold ear studs; a cream pie in a crimped tin with dollops and a cherry, held
in the right hand. Bind pose upright with A-pose arms (the pie stands on edge against the right palm); holding the
pie out level, left hand on the hip, is the idle clip. No face paint: crew are not clowns (PAINT_MIN None)."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, capsule, arm_points, humanoid_bones
import posekit as K
from palette import RAMPS

# crew ramps from art/cast2/build_cast2.py (EXTRA), [light, base, shadow, deep]
RAMPS.update(dict(
    CANVAS=['#D9CDB4', '#BBAE92', '#8F8269', '#463C2E'],
    SKIRT=['#B97F66', '#96604B', '#6C4234', '#33201A'],
))

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (cast2 boots at 2.6)
    leg_x=2.6,
    # arm angle from vertical in the bind pose, degrees (45, not 30: the pie against the palm must clear the skirt)
    arm_out=45.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length
    upper_len=6.2,
    # forearm length
    fore_len=6.0,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units
    shoulder=(6.6, 0.0, 31.0),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(1.8, 0.0, 30.6),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(13.5, 19.0, 25.0, 33.2, 35.8, 46.0),
    # leg joints: hip, knee, ankle (z)
    leg_z=(14.5, 8.6, 2.4),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.1, -3.4, 0.6),
    # hand bone length
    hand_len=2.2,
    # finger bone length
    finger_len=1.6,
    # whole figure scaled about the feet after building (owner 22 Nov: crew not shorter than the clown, 1.791 m)
    size=1.27,
    # pie: radius of the tin, its depth, gap from the palm (approved units; below 0 the tin sinks into the palm so they touch)
    pie_R=3.6, pie_d=1.1, pie_gap=-0.4,
    # idle: how far the pie arm reaches forward and how high the pie sits (forearm aim, z part)
    hold_lift=0.12,
)
# head centre and radii as built (cast2)
H0, R0 = (0, -0.2, 39.6), (5.6, 5.2, 6.0)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: bare skin
HEAD_RAMPS = ['SKIN', 'SKIN_LID']
# eyes, auburn brows and lashes, mouth, eye glint, freckles
FACE_FLATS = ['#1E1714', '#6A3A26', '#933C30', '#F4F4F2', '#A86E54']
# no face paint on the crew; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the pie tin, the scissors and the ear studs
SPEC_RAMPS = ('SILVER', 'GOLD')
# checks: height range in metres (not shorter than the clown's 1.791 m)
CHECK = dict(height=(1.80, 1.95))
# walk style: a quick, light step, arms close
WALK = dict(thigh=18.0, knee=30.0, arm=12.0, bob=0.35, arm_out=16, sway=3)
# smile is the default (cast2 small smile); wink for "Don't eat it this time."
EXPR = ['smile', 'wink', 'startle', 'frown']

def _grow(before):
    """Scale every object made since `before` about the origin (feet) by CONFIG size: uniform, so rotations hold."""
    import bpy
    k = CONFIG['size']
    for o in set(bpy.data.objects) - before:
        o.location = o.location * k; o.scale = o.scale * k

def _align(o, d):
    """Turn an object made along z so its z axis runs along d."""
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(d))
    return o

def body():
    import bpy
    before = set(bpy.data.objects)
    _body()
    _grow(before)

def _legs(c):
    for s in (-1, 1):
        S = side(s)
        x = s * c['leg_x']
        B = f'foot_{S},shin_{S}'
        # lace-up boot: shaft, foot, sole, heel, toe, cuff, laces crossing up the front
        res(18, 8)
        tag(cyl(T('HAT'), (x, 0, 5.0), 1.9, 6.8), 'HAT', B, cuts=3)
        res(18, 10)
        tag(ell(T('HAT'), (x, -1.6, 1.5), (1.9, 3.2, 1.3)), 'HAT', B)
        tag(ell(T('BLACK'), (x, -1.6, 0.45), (2.0, 3.3, 0.5)), 'BLACK', B)
        res(12, 6)
        tag(cyl(T('BLACK'), (x, 1.0, 0.7), 0.9, 1.4), 'BLACK', B)
        res(18, 6)
        tag(torus(T('HAT_BAND'), (x, 0, 8.3), 1.95, 0.45), 'HAT_BAND', f'shin_{S},foot_{S}')
        res(8, 6)
        for k in range(4):
            z = 3.4 + 1.2 * k
            tag(ell(T('CANVAS'), (x, -1.85, z), (1.0, 0.25, 0.22), rot=(0, 28, 0)), 'CANVAS', B)
            tag(ell(T('CANVAS'), (x, -1.85, z), (1.0, 0.25, 0.22), rot=(0, -28, 0)), 'CANVAS', B)
        # bare leg from the boot to under the skirt, knee in the middle
        res(16, 8)
        tag(cyl(T('SKIN'), (x, 0, 11.6), 1.6, 8.0), 'SKIN', f'thigh_{S},shin_{S}', cuts=5)
        tag(cyl(T('SKIN'), (x, 0, 15.2), 2.0, 3.0), 'SKIN', f'hips,thigh_{S}')
    res(22, 10)
    tag(ell(T('SKIRT'), (0, 0, 16.0), (5.6, 4.4, 3.2)), 'SKIRT', 'hips')

def _skirt():
    # knee-length skirt: bell with loop cuts, pleat ridges, hem band; waistband
    res(30, 10)
    tag(cone(T('SKIRT'), (0, 0, 24.0), (0, 0, 12.6), 5.4, 8.4), 'SKIRT', 'hips,thigh_L,thigh_R', cuts=5)
    res(8, 6)
    for a in range(0, 360, 30):
        t = math.radians(a)
        p = Vector((math.sin(t), math.cos(t), 0))
        capsule(T('SKIRT'), p * 5.3 + Vector((0, 0, 23.0)), p * 8.15 + Vector((0, 0, 13.4)), 0.3,
                'hips,thigh_L,thigh_R', ramp='SKIRT')
    res(32, 6)
    tag(torus(T('HAT_BAND'), (0, 0, 12.8), 8.4, 0.45), 'HAT_BAND', 'hips,thigh_L,thigh_R')
    tag(torus(T('SKIRT'), (0, 0, 23.6), 5.5, 0.6), 'SKIRT', 'hips,spine')

def _apron():
    # canvas apron over the skirt front, waist ties and a bow at the back, pocket with scissors and a tape measure
    res(24, 8)
    o = cone(T('CANVAS'), (0, -5.3, 23.4), (0, -8.0, 13.6), 4.2, 5.8); o.scale = (1, 0.16, 1)
    tag(o, 'CANVAS', 'hips,thigh_L,thigh_R', cuts=4)
    res(24, 6)
    tag(torus(T('CANVAS'), (0, 0, 23.0), 5.7, 0.4, scale=(1, 0.85, 1)), 'CANVAS', 'hips,spine')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('CANVAS'), (s * 1.3, 5.2, 23.0), (1.5, 0.6, 0.9), rot=(0, s * 20, 0)), 'CANVAS', 'hips,spine')
        capsule(T('CANVAS'), (s * 0.6, 5.2, 22.6), (s * 1.4, 5.6, 19.8), 0.32, 'hips', ramp='CANVAS')
    tag(ell(T('CANVAS'), (0, 5.2, 23.0), (0.6, 0.6, 0.6)), 'CANVAS', 'hips,spine')
    res(14, 8)
    tag(ell(T('CANVAS'), (1.6, -7.1, 17.6), (2.6, 0.45, 1.9)), 'CANVAS', 'hips,thigh_L,thigh_R')
    res(12, 6)
    for dx in (-0.45, 0.45):
        tag(torus(T('SILVER'), (2.6 + dx, -7.25, 19.8), 0.45, 0.16, scale=(1, 0.6, 1)), 'SILVER', 'hips,thigh_L,thigh_R')
    capsule(T('SILVER'), (2.6, -7.25, 19.4), (2.6, -7.2, 18.0), 0.18, 'hips,thigh_L,thigh_R', ramp='SILVER')
    res(16, 6)
    tag(_align(torus(T('OCHRE'), (0.4, -7.35, 18.6), 0.9, 0.35), (0, 1, 0)), 'OCHRE', 'hips,thigh_L,thigh_R')

def _top():
    # blouse body, laced vest with eyelets, round collar, puffed sleeves with elbow cuffs
    res(26, 12)
    tag(cone(T('WARM_WHITE'), (0, 0, 22.6), (0, 0, 32.6), 5.2, 6.0, yscale=0.74), 'WARM_WHITE', 'hips,spine,chest', cuts=5)
    res(26, 10)
    tag(cone(T('SKIRT'), (0, 0, 22.4), (0, 0, 29.4), 5.5, 6.0, yscale=0.76), 'SKIRT', 'hips,spine,chest', cuts=4)
    res(24, 6)
    tag(torus(T('SKIRT'), (0, 0, 29.4), 5.9, 0.4, scale=(1, 0.76, 1)), 'SKIRT', 'chest')
    res(8, 6)
    for k in range(4):
        z = 23.6 + 1.5 * k
        y = -4.25 - 0.05 * k
        for s in (-1, 1):
            tag(ell(T('BLACK'), (s * 0.9, y - 0.1, z), (0.25, 0.2, 0.25)), 'BLACK', 'spine,chest')
        if k < 3:
            capsule(T('WARM_WHITE'), (-0.9, y - 0.15, z), (0.9, y - 0.15, z + 1.5), 0.14, 'spine,chest', ramp='WARM_WHITE')
            capsule(T('WARM_WHITE'), (0.9, y - 0.15, z), (-0.9, y - 0.15, z + 1.5), 0.14, 'spine,chest', ramp='WARM_WHITE')
    res(10, 6)
    tag(ell(T('WARM_WHITE'), (0.5, -4.6, 28.2), (0.5, 0.3, 0.7)), 'WARM_WHITE', 'chest')
    res(20, 6)
    tag(torus(T('WARM_WHITE'), (0, -0.3, 33.0), 2.8, 0.7, scale=(1, 0.92, 1)), 'WARM_WHITE', 'chest,neck')
    res(12, 6)
    for s in (-1, 1):
        tag(ell(T('WARM_WHITE'), (s * 1.6, -3.5, 32.6), (1.6, 0.5, 0.9), rot=(0, s * 25, 0)), 'WARM_WHITE', 'chest,neck')

def _arms(c):
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        # puffed sleeve over the shoulder and upper arm, cuff band at the elbow
        res(16, 10)
        tag(ell(T('WARM_WHITE'), sh + d1 * 1.8, (2.6, 2.6, 3.0)), 'WARM_WHITE', f'chest,clavicle_{S},upper_arm_{S}')
        res(16, 8)
        tag(cone(T('WARM_WHITE'), sh, el, 2.2, 1.9), 'WARM_WHITE', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        res(16, 6)
        tag(_align(torus(T('WARM_WHITE'), el, 1.75, 0.5), d1), 'WARM_WHITE', f'upper_arm_{S},forearm_{S}')
        # bare forearm and hand
        res(14, 8)
        tag(ell(T('SKIN'), el, (1.5, 1.5, 1.5)), 'SKIN', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('SKIN'), el, wr, 1.45, 1.15), 'SKIN', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        pc = wr + d2 * 1.2
        p = ell(T('SKIN'), pc, (1.05, 1.55, 1.7))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'SKIN', f'forearm_{S},hand_{S}')
        base = pc + d2 * 1.15
        res(10, 6)
        for dy in (-1.0, -0.33, 0.33, 1.0):
            q0 = base + Vector((0, dy * 0.85, 0))
            capsule(T('SKIN'), q0, q0 + d2 * (1.8 - abs(dy) * 0.3), 0.4, f'hand_{S},fingers_{S}')
        t0 = pc + Vector((0, -1.1, 0.3)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 1.4
        capsule(T('SKIN'), t0, t1, 0.42, f'hand_{S}')
        if s < 0:
            _pie(c, pc, d2)

def _pie(c, pc, d2):
    """Cream pie against the right palm (palm faces the body, +x): tin, crimped rim, cream, dollops, cherry, stem."""
    n = Vector((1, 0, 0))
    ctr = pc + n * (1.05 + c['pie_gap'] + c['pie_d'] / 2)
    R, dd = c['pie_R'], c['pie_d']
    res(28, 6)
    o = cyl(T('SILVER'), ctr, R, dd); _align(o, n); tag(o, 'SILVER', 'hand_R')
    res(28, 6)
    o = torus(T('SILVER'), ctr + n * (dd / 2), R, 0.35); _align(o, n); tag(o, 'SILVER', 'hand_R')
    res(10, 6)
    for a in range(0, 360, 30):
        t = math.radians(a)
        q = ctr + n * (dd / 2 + 0.1) + Vector((0, math.cos(t), math.sin(t))) * R
        tag(ell(T('SILVER'), q, (0.3, 0.42, 0.42)), 'SILVER', 'hand_R')
    # a peg from the palm into the tin so the pie touches the hand
    res(12, 6)
    capsule(T('SILVER'), pc + n * 0.6, ctr, 0.6, 'hand_R', ramp='SILVER')
    res(24, 10)
    o = ell(T('PAINT'), ctr + n * (dd / 2 + 0.5), (R * 0.92, R * 0.92, 1.3)); _align(o, n); tag(o, 'PAINT', 'hand_R')
    res(10, 6)
    for a in range(0, 360, 45):
        t = math.radians(a)
        q = ctr + n * (dd / 2 + 1.5) + Vector((0, math.cos(t), math.sin(t))) * R * 0.62
        o = ell(T('PAINT'), q, (0.7, 0.7, 0.8)); _align(o, n); tag(o, 'PAINT', 'hand_R')
    res(14, 8)
    tag(ell(T('RED'), ctr + n * (dd / 2 + 2.3), (0.85, 0.85, 0.85)), 'RED', 'hand_R')
    res(6, 4)
    capsule(T('SHOE'), ctr + n * (dd / 2 + 2.9), ctr + n * (dd / 2 + 3.9) + Vector((0, 0.3, 0.4)), 0.12, 'hand_R', ramp='SHOE')

def _head():
    # neck, ears with gold studs, nose, hair over the back and top, fringe, side locks, bun, pencil through the bun
    res(16, 10)
    tag(ell(T('SKIN'), (0, -0.2, 34.4), (2.1, 2.1, 1.9)), 'SKIN', 'neck,head')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN'), (s * 5.5, -0.2, 39.2), (0.9, 1.2, 1.5)), 'SKIN', 'head')
        res(8, 6)
        tag(ell(T('GOLD'), (s * 5.85, -0.6, 38.0), (0.35, 0.35, 0.35)), 'GOLD', 'head')
        res(12, 8)
        # side lock in front of the ear
        tag(ell(T('RUST_HAIR'), (s * 4.9, -2.0, 39.4), (0.9, 1.0, 2.8), rot=(0, s * 8, 0)), 'RUST_HAIR', 'head')
    res(16, 10)
    tag(ell(T('SKIN'), (0, on_surface(H0, R0, 0, 38.4, 0.55), 38.4), (0.8, 0.8, 1.0)), 'SKIN', 'head')
    res(28, 14)
    tag(ell(T('RUST_HAIR'), (0, 0.9, 41.4), (6.0, 5.6, 5.4)), 'RUST_HAIR', 'head')
    # fringe: strands across the brow
    res(10, 6)
    for k, xx in enumerate((-3.6, -2.2, -0.8, 0.6, 2.0, 3.4)):
        z = 44.0 - 0.25 * abs(xx)
        tag(ell(T('RUST_HAIR'), (xx, on_surface(H0, R0, xx, z, 0.5), z), (1.0, 0.7, 1.5), rot=(0, -12 + 5 * k, 0)), 'RUST_HAIR', 'head')
    # bun with wrapped strands and the pencil through it
    res(20, 12)
    tag(ell(T('RUST_HAIR'), (0, 3.2, 45.6), (3.0, 3.0, 2.8)), 'RUST_HAIR', 'head')
    res(20, 6)
    for k in range(2):
        o = torus(T('RUST_HAIR'), (0, 3.2, 45.6 + 0.6 * (k - 0.5)), 2.6 - 0.4 * k, 0.45); o.rotation_euler = (math.radians(-35), 0, 0)
        tag(o, 'RUST_HAIR', 'head')
    res(8, 6)
    capsule(T('OCHRE'), (-4.2, 3.6, 44.4), (4.4, 2.8, 47.6), 0.38, 'head', ramp='OCHRE')
    tag(ell(T('PAINT'), (4.55, 2.78, 47.66), (0.3, 0.3, 0.3)), 'PAINT', 'head')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN'), H0, R0), 'SKIN', 'head', group='head')

def _body():
    c = CONFIG
    _legs(c); _skirt(); _apron(); _top(); _arms(c); _head()

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Smile: open eyes with lashes, small smile (cast2). Wink: right eye shut as an arc, smile tilted.
    Startle: round eyes, brows up, small open mouth. Frown: brows down and in, mouth down. Freckles on every face."""
    brow = dict(smile=0.2, wink=0.45, startle=1.0, frown=-0.45)[expr]
    knit = dict(smile=0.0, wink=0.0, startle=0.0, frown=0.45)[expr]
    for s in (-1, 1):
        x = s * 2.1
        shut = expr == 'wink' and s < 0
        if shut:
            build.arc(F('#1E1714'), [(x + dx, on_surface(H0, R0, x + dx, 39.6 + 0.35 * (1 - (dx / 0.8) ** 2), 0.25), 39.6 + 0.35 * (1 - (dx / 0.8) ** 2))
                                     for dx in (-0.8, -0.4, 0.0, 0.4, 0.8)], (0.3, 0.25, 0.22))
        else:
            ez = 1.1 if expr == 'startle' else 0.95
            ell(F('#1E1714'), (x, on_surface(H0, R0, x, 39.8, 0.25), 39.8), (0.7, 0.4, ez))
            ell(F('#F4F4F2'), (x - s * 0.25, on_surface(H0, R0, x, 40.2, 0.42), 40.2), (0.26, 0.26, 0.26))
            # two lashes at the outer corner
            for k in range(2):
                z = 40.6 - 0.35 * k
                ell(F('#6A3A26'), (x + s * (0.85 + 0.15 * k), on_surface(H0, R0, x + s * (0.85 + 0.15 * k), z, 0.3), z), (0.35, 0.2, 0.12))
        pts = [(1.0, 41.8), (1.9, 42.1), (2.8, 42.0), (3.4, 41.7)]
        build.arc(F('#6A3A26'), [(s * xx, on_surface(H0, R0, s * xx, zz + brow - knit * (2.3 - xx) * 0.5, 0.3), zz + brow - knit * (2.3 - xx) * 0.5)
                                 for xx, zz in pts], (0.5, 0.35, 0.3))
    for xx, zz in ((-3.0, 38.6), (-3.6, 37.8), (-2.5, 37.9), (3.0, 38.6), (3.6, 37.8), (2.5, 37.9), (-1.0, 38.9), (1.0, 38.9)):
        ell(F('#A86E54'), (xx, on_surface(H0, R0, xx, zz, 0.1), zz), (0.3, 0.2, 0.3))
    if expr == 'startle':
        ell(F('#933C30'), (0, on_surface(H0, R0, 0, 36.2, 0.2), 36.2), (0.7, 0.4, 0.65))
    else:
        bend = dict(smile=0.35, wink=0.45, frown=-0.35)[expr]
        tilt = 0.25 if expr == 'wink' else 0.0
        build.arc(F('#933C30'), [(xx, on_surface(H0, R0, xx, 36.3 + bend * (abs(xx) / 1.4) ** 2 + tilt * xx / 1.4, 0.15),
                                  36.3 + bend * (abs(xx) / 1.4) ** 2 + tilt * xx / 1.4)
                                 for xx in (-1.4, -0.7, 0.0, 0.7, 1.4)], (0.5, 0.3, 0.32))

def bones(U): return humanoid_bones(CONFIG, U * CONFIG['size'])

def _level_pie():
    """Turn the right hand so the pie's axis (+x in the bind pose, rigid on hand_R) points straight up."""
    from mathutils import Matrix
    K.upd(); pb = K.P('hand_R')
    rot = (pb.matrix @ pb.bone.matrix_local.inverted()).to_3x3()
    q = (rot @ Vector((1, 0, 0))).normalized().rotation_difference(Vector((0, 0, 1)))
    M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M

def idle(t, length):
    """Holding the pie out to the clown: right forearm forward, palm turned up so the pie sits level; left hand on
    the hip; weight on the left leg; a slow breath and a small nod."""
    c = CONFIG; p = 2 * math.pi * t / length
    K.move('hips', (0.3 * c['size'], 0, -0.05 * (1 - math.cos(p))))
    K.rotw('hips', (0, 1, 0), -3)
    K.rotw('chest', (0, 1, 0), 3 + 0.6 * math.sin(p))
    K.aim('upper_arm_R', (-0.15, -0.45, -1.0)); K.aim('forearm_R', (0.15, -1.0, c['hold_lift'] + 0.03 * math.sin(p)))
    K.aim('hand_R', (0.1, -1.0, 0.05))
    _level_pie()
    K.aim('upper_arm_L', (0.75, 0.25, -0.75)); K.aim('forearm_L', (-0.6, -0.35, -0.55))
    K.rotw('head', (1, 0, 0), 3 + 2.0 * math.sin(p + 0.5))
    K.rotw('head', (0, 1, 0), -6)

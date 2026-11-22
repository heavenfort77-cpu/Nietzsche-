"""The old stagehand (night-1 crew, proposal): same figure as art/cast2 stagehand(), rebuilt for the pipeline
with the clowns' level of modelled detail: boot soles, laces and toe caps, trouser turn-ups and knee patches,
belt and buckle, collar, buttons, sleeve rolls, open hands, a canvas apron with neck straps, waist ties,
a pocket and a hammer, a three-turn rope coil with a hanging tail, grey hair masses, sideburns and moustache,
a flat cap with band, peak and button, a pencil behind the ear. Bind pose upright with A-pose arms;
the slouch is the idle clip. No face paint: crew are not clowns (PAINT_MIN None: the paint layer must stay empty)."""
import math
from mathutils import Vector, Quaternion
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, capsule, arm_points, humanoid_bones
import posekit as K
from palette import RAMPS

# crew ramps from art/cast2/build_cast2.py (EXTRA), [light, base, shadow, deep]
RAMPS.update(dict(
    WOOL=['#B8A77E', '#958459', '#6C5F3E', '#33291A'],
    CANVAS=['#D9CDB4', '#BBAE92', '#8F8269', '#463C2E'],
))

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (cast2 stagehand trousers at 3.4)
    leg_x=3.4,
    # arm angle from vertical in the bind pose, degrees
    arm_out=30.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length (shoulder 32 to the sleeve roll at 25 in cast2)
    upper_len=6.8,
    # forearm length
    fore_len=6.6,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units
    shoulder=(7.8, 0.0, 32.0),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(2.0, 0.0, 31.5),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(16, 21, 27, 34.5, 37.4, 49),
    # leg joints: hip, knee, ankle (z)
    leg_z=(17.0, 9.6, 2.6),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.2, -4.0, 0.8),
    # hand bone length
    hand_len=2.4,
    # finger bone length
    finger_len=1.8,
    # whole figure scaled about the feet after building (owner 22 Nov: approved with the condition he is not shorter
    # than the clown; clown 1.791 m, stagehand at size 1 was 1.482 m)
    size=1.22,
    # rope coil: centre over the left shoulder (x, y, z), turn radius, rope radius, number of turns
    coil=(7.4, 0.6, 31.2), coil_R=4.4, coil_r=0.62, coil_turns=3,
)
# head centre and radii as built (cast2: (0, -2.4, 41.0) slouched; upright for the bind pose)
H0, R0 = (0, -0.6, 41.2), (6.2, 5.8, 6.6)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: bare skin, tired lids
HEAD_RAMPS = ['SKIN', 'SKIN_LID']
# eyes, grey brows, mouth, eye glint
FACE_FLATS = ['#1E1714', '#8E877C', '#4A2A24', '#F4F4F2']
# no face paint on the crew; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the brass buckle and the hammer head (ochre rope is matte, but shares the ramp: keep OCHRE off)
SPEC_RAMPS = ('GOLD',)
# checks: height range in metres; the minimum is above the clown's 1.791 m (owner condition 22 Nov); idle looks down at the floor
CHECK = dict(height=(1.80, 1.95), idle_head_down=True)
# walk style: a slow shuffle, arms close
WALK = dict(thigh=16.0, knee=28.0, arm=9.0, bob=0.3, arm_out=20, sway=2)
EXPR = ['tired', 'smile', 'startle', 'frown']

def _grow(before):
    """Scale every object made since `before` about the origin (feet) by CONFIG size: uniform, so rotations hold."""
    import bpy
    k = CONFIG['size']
    for o in set(bpy.data.objects) - before:
        o.location = o.location * k; o.scale = o.scale * k

def _align(o, d):
    """Turn a torus (axis z) so its axis runs along d."""
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    return o

def body():
    import bpy
    before = set(bpy.data.objects)
    _body()
    _grow(before)

def _body():
    c = CONFIG
    for s in (-1, 1):
        S = side(s)
        x = s * c['leg_x']
        res(20, 10)
        # boot, sole, toe cap, two laces
        tag(ell(T('SHOE'), (x, -1.8, 1.7), (2.6, 4.4, 1.5)), 'SHOE', f'foot_{S},shin_{S}')
        tag(ell(T('BLACK'), (x, -1.8, 0.45), (2.8, 4.6, 0.55)), 'BLACK', f'foot_{S},shin_{S}')
        res(14, 8)
        tag(ell(T('SHOE'), (x, -5.0, 1.5), (2.0, 1.6, 1.15)), 'SHOE', f'foot_{S},shin_{S}')
        for k, yy in enumerate((-2.6, -1.2)):
            tag(ell(T('CANVAS'), (x, yy, 3.05), (1.4, 0.35, 0.3)), 'CANVAS', f'foot_{S},shin_{S}')
        # trouser leg with a turn-up and a knee patch
        res(18, 8)
        tag(cyl(T('HAT'), (x, 0, 10.2), 2.6, 14.4), 'HAT', f'thigh_{S},shin_{S},foot_{S}', cuts=7)
        res(18, 6)
        tag(torus(T('HAT_BAND'), (x, 0, 3.6), 2.6, 0.7), 'HAT_BAND', f'shin_{S},foot_{S}')
        res(12, 8)
        tag(ell(T('CANVAS'), (x, -2.35, 9.8), (1.7, 0.55, 2.0)), 'CANVAS', f'thigh_{S},shin_{S},foot_{S}')
    res(24, 12)
    tag(ell(T('HAT'), (0, 0, 17.6), (7.0, 5.0, 3.6)), 'HAT', 'hips')
    # belt and brass buckle
    res(28, 6)
    tag(torus(T('SHOE'), (0, 0, 20.0), 6.4, 0.8, scale=(1, 0.76, 1)), 'SHOE', 'hips')
    res(10, 6)
    tag(ell(T('GOLD'), (0, -5.0, 20.0), (1.2, 0.45, 1.0)), 'GOLD', 'hips')
    # shirt: tapered body with loop cuts so it bends at the waist, shoulder caps, neck band, collar points, two buttons
    res(28, 12)
    tag(cone(T('WOOL'), (0, 0, 19.0), (0, 0, 33.6), 6.6, 7.2, yscale=0.74), 'WOOL', 'hips,spine,chest', cuts=6)
    res(16, 8)
    for s in (-1, 1):
        tag(ell(T('WOOL'), (s * 7.4, 0, 32.2), (2.8, 2.8, 2.6)), 'WOOL', f'chest,clavicle_{side(s)},upper_arm_{side(s)}')
        tag(ell(T('WOOL'), (s * 1.9, -4.6, 34.2), (2.0, 0.5, 1.3), rot=(0, s * 32, 0)), 'WOOL', 'chest,neck')
    res(20, 6)
    tag(torus(T('WOOL'), (0, -0.4, 34.4), 3.0, 0.8, scale=(1, 0.9, 1)), 'WOOL', 'chest,neck')
    res(8, 6)
    for z in (32.6, 30.8):
        tag(ell(T('HAT_BAND'), (0, -5.25, z), (0.5, 0.3, 0.5)), 'HAT_BAND', 'chest')
    # canvas apron: bib to knee, neck straps, waist ties, pocket with a hammer in it
    res(24, 8)
    o = cone(T('CANVAS'), (0, -5.3, 29.6), (0, -6.2, 11.2), 4.4, 6.4); o.scale = (1, 0.18, 1)
    tag(o, 'CANVAS', 'chest,spine,hips,thigh_L,thigh_R', cuts=5)
    res(10, 6)
    for s in (-1, 1):
        capsule(T('CANVAS'), (s * 3.8, -5.2, 29.4), (s * 2.9, -3.0, 34.6), 0.45, 'chest,neck', ramp='CANVAS')
        capsule(T('CANVAS'), (s * 6.0, -3.4, 21.0), (s * 5.2, -5.6, 17.4), 0.4, 'hips', ramp='CANVAS')
    res(24, 6)
    tag(torus(T('CANVAS'), (0, 0, 21.2), 6.6, 0.45, scale=(1, 0.8, 1)), 'CANVAS', 'hips')
    res(14, 8)
    tag(ell(T('CANVAS'), (-1.2, -6.9, 17.6), (3.4, 0.5, 2.2)), 'CANVAS', 'chest,spine,hips,thigh_L,thigh_R')
    res(10, 6)
    capsule(T('OCHRE'), (1.2, -7.2, 18.2), (1.8, -7.0, 23.0), 0.45, 'chest,spine,hips,thigh_L,thigh_R', ramp='OCHRE')
    tag(ell(T('GOLD'), (1.85, -7.05, 23.5), (1.5, 0.6, 0.6)), 'GOLD', 'chest,spine,hips,thigh_L,thigh_R')
    # arms: wool upper arm, a fat sleeve roll at the elbow, bare forearm, open hand
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        res(16, 8)
        tag(cone(T('WOOL'), sh, el, 2.3, 2.1), 'WOOL', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        res(18, 8)
        tag(_align(torus(T('WOOL'), el, 2.1, 0.8), d1), 'WOOL', f'upper_arm_{S},forearm_{S}')
        res(14, 8)
        tag(ell(T('SKIN'), el, (1.8, 1.8, 1.8)), 'SKIN', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('SKIN'), el, wr, 1.75, 1.45), 'SKIN', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        pc = wr + d2 * 1.3
        p = ell(T('SKIN'), pc, (1.25, 1.8, 1.9))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'SKIN', f'forearm_{S},hand_{S}')
        base = pc + d2 * 1.3
        res(10, 6)
        for dy in (-1.2, -0.4, 0.4, 1.2):
            q0 = base + Vector((0, dy * 0.95, 0))
            capsule(T('SKIN'), q0, q0 + d2 * (2.0 - abs(dy) * 0.3), 0.48, f'hand_{S},fingers_{S}')
        t0 = pc + Vector((0, -1.3, 0.3)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 1.6
        capsule(T('SKIN'), t0, t1, 0.5, f'hand_{S}')
    # rope coil slung over the left shoulder: three turns hanging over the shoulder top, a tail down the back
    cx, cy, cz = c['coil']
    axis = Quaternion((0, 1, 0), math.radians(-18)) @ Vector((1, 0, 0))
    res(28, 6)
    for k in range(c['coil_turns']):
        off = (k - (c['coil_turns'] - 1) / 2) * 1.1
        o = torus(T('OCHRE'), (cx + off, cy, cz - 0.3 * k), c['coil_R'] - 0.2 * k, c['coil_r'])
        tag(_align(o, axis), 'OCHRE', 'chest,clavicle_L')
    res(10, 6)
    capsule(T('OCHRE'), (cx - 0.4, cy + c['coil_R'] - 0.4, cz - 2.6), (cx - 1.4, cy + 5.0, cz - 9.0), 0.55, 'chest,spine', ramp='OCHRE')
    # neck, ears, nose, moustache, grey hair, cap, pencil: geometry in the body shell
    res(16, 10)
    tag(ell(T('SKIN'), (0, -0.4, 35.6), (2.6, 2.6, 2.4)), 'SKIN', 'neck,head')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN'), (s * 6.2, -0.4, 40.8), (1.1, 1.4, 1.8)), 'SKIN', 'head')
        # sideburn and the grey hair mass over the ear
        tag(ell(T('WARM_WHITE'), (s * 5.7, 0.4, 42.6), (1.0, 1.9, 2.0)), 'WARM_WHITE', 'head')
        for k, ang in enumerate((60, 100, 140)):
            a = math.radians(ang)
            tag(ell(T('WARM_WHITE'), (s * 5.4 * math.sin(a), 5.0 * -math.cos(a) - 0.2, 42.8 - 0.4 * k), (1.6, 1.4, 1.5)), 'WARM_WHITE', 'head')
    # back of the head: rows of grey curls from under the cap down to the nape (rows narrow toward the neck)
    for r, (z, rad) in enumerate(((43.0, 5.4), (41.3, 5.5), (39.6, 5.0), (38.0, 3.9))):
        for k, ang in enumerate(range(-75 + 12 * (r % 2), 76, 25)):
            t = math.radians(ang)
            tag(ell(T('WARM_WHITE'), (rad * math.sin(t), rad * 0.95 * math.cos(t) - 0.4, z), (1.6, 1.2, 1.3)), 'WARM_WHITE', 'head')
    res(16, 10)
    tag(ell(T('SKIN'), (0, on_surface(H0, R0, 0, 40.0, 0.9), 40.0), (1.3, 1.3, 1.6)), 'SKIN', 'head')
    res(10, 6)
    for xx in (-2.3, -1.2, 1.2, 2.3):
        tag(ell(T('WARM_WHITE'), (xx, on_surface(H0, R0, xx, 38.0, 0.35), 38.0 - 0.12 * abs(xx)), (1.0, 0.6, 0.65)), 'WARM_WHITE', 'head')
    tag(ell(T('WARM_WHITE'), (0, on_surface(H0, R0, 0, 38.3, 0.4), 38.3), (0.8, 0.55, 0.55)), 'WARM_WHITE', 'head')
    res(28, 10)
    tag(ell(T('HAT_BAND'), (0, -0.6, 46.6), (6.7, 6.4, 2.3)), 'HAT_BAND', 'head')
    tag(ell(T('HAT_BAND'), (0, -5.8, 45.5), (5.0, 2.8, 0.7)), 'HAT_BAND', 'head')
    res(28, 6)
    tag(torus(T('HAT'), (0, -0.6, 45.4), 6.2, 0.55, scale=(1, 0.97, 1)), 'HAT', 'head')
    res(10, 6)
    tag(ell(T('HAT'), (0, -1.6, 48.8), (0.8, 0.8, 0.5)), 'HAT', 'head')
    capsule(T('OCHRE'), (-6.0, -1.8, 42.4), (-6.6, 2.0, 41.2), 0.32, 'head', ramp='OCHRE')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN'), H0, R0), 'SKIN', 'head', group='head')

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Tired: heavy lids, level grey brows, flat mouth. Smile: lids lift, mouth curves (the corridor greeting).
    Startle: round eyes, brows up, small open mouth. Frown: brows down and in, mouth turned down."""
    lid = dict(tired=0.55, smile=0.35, startle=0.0, frown=0.45)[expr]
    brow = dict(tired=0.0, smile=0.4, startle=1.1, frown=-0.5)[expr]
    tilt = dict(tired=0.15, smile=0.0, startle=0.0, frown=-0.45)[expr]
    for s in (-1, 1):
        x = s * 2.5
        ez = 0.95 if expr == 'startle' else 0.72
        ell(F('#1E1714'), (x, on_surface(H0, R0, x, 41.6, 0.25), 41.6), (0.78, 0.4, ez))
        if expr != 'tired':
            ell(F('#F4F4F2'), (x - s * 0.3, on_surface(H0, R0, x, 42.0, 0.42), 42.0), (0.3, 0.3, 0.3))
        if lid > 0:
            ell(T('SKIN_LID'), (x, on_surface(H0, R0, x, 42.25, 0.32), 42.25 - 0.1 * (1 - lid)), (1.35, 0.5, 0.35 + 0.35 * lid))
        pts = [(1.2, 43.4), (2.2, 43.7), (3.3, 43.6), (4.1, 43.2)]
        build.arc(F('#8E877C'), [(s * xx, on_surface(H0, R0, s * xx, zz + brow + tilt * (2.6 - xx) * 0.6, 0.3), zz + brow + tilt * (2.6 - xx) * 0.6)
                                 for xx, zz in pts], (0.62, 0.4, 0.45))
    if expr == 'startle':
        ell(F('#4A2A24'), (0, on_surface(H0, R0, 0, 36.7, 0.2), 36.7), (0.9, 0.4, 0.8))
    else:
        bend = dict(tired=0.0, smile=0.45, frown=-0.4)[expr]
        build.arc(F('#4A2A24'), [(xx, on_surface(H0, R0, xx, 36.9 + bend * (abs(xx) / 1.6) ** 2, 0.15), 36.9 + bend * (abs(xx) / 1.6) ** 2)
                                 for xx in (-1.6, -0.8, 0.0, 0.8, 1.6)], (0.55, 0.3, 0.3))

def bones(U): return humanoid_bones(CONFIG, U * CONFIG['size'])

def idle(t, length):
    """The cast2 slouch: chest forward, head down to the floor, arms hanging a little in front, slow breath."""
    p = 2 * math.pi * t / length
    K.move('hips', (0, 0, -0.06 * (1 - math.cos(p))))
    K.rotw('spine', (1, 0, 0), 4.0)
    K.rotw('chest', (1, 0, 0), 6.0 + 1.0 * math.sin(p))
    for S, x in (('L', 0.1), ('R', -0.1)):
        K.aim(f'upper_arm_{S}', (x, -0.18, -1.0)); K.aim(f'forearm_{S}', (x * 0.5, -0.3, -1.0))
    K.rotw('head', (1, 0, 0), 12 + 1.0 * math.sin(p + 0.5))

"""The rigger (night-1 crew, proposal): same figure as art/cast2 rigger(), rebuilt for the pipeline with the
clowns' level of modelled detail: work boots with soles, toe caps, laces and collars; work trousers with knee pads
on straps and cargo pockets; an olive work jacket with collar, zip, chest pocket with flap, hem band, elbow
patches and cuffs; tan leather work gloves; a tool belt with a pouch (spanner, pliers) and a roll of pale gaffer
tape; a three-turn floor cable coiled on his back on a strap across the chest, with a tail; a radio on the strap;
a ribbed beanie, dark hair at the nape and sideburns. Bind pose upright with A-pose arms; the kneel (one knee
down, laying the cable) is the idle clip. No face paint: crew are not clowns (PAINT_MIN None)."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, capsule, arm_points, humanoid_bones
import posekit as K
from palette import RAMPS

# crew ramps from art/cast2/build_cast2.py (EXTRA), [light, base, shadow, deep]
RAMPS.update(dict(
    JACKET=['#8C8257', '#6D653F', '#4C462B', '#252114'],
    CANVAS=['#D9CDB4', '#BBAE92', '#8F8269', '#463C2E'],
))

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (broader stance than the stagehand's 3.4)
    leg_x=3.6,
    # arm angle from vertical in the bind pose, degrees
    arm_out=30.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length
    upper_len=7.0,
    # forearm length
    fore_len=6.6,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units (broad shoulders)
    shoulder=(8.4, 0.0, 32.0),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(2.0, 0.0, 31.5),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(16, 21, 27, 34.5, 37.4, 49),
    # leg joints: hip, knee, ankle (z)
    leg_z=(17.0, 9.6, 2.6),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.2, -4.2, 0.8),
    # hand bone length
    hand_len=2.4,
    # finger bone length
    finger_len=1.8,
    # whole figure scaled about the feet after building (owner 22 Nov: crew not shorter than the clown, 1.791 m)
    size=1.24,
    # cable coil on his back: centre (x, y, z), turn radius, cable radius, number of turns
    coil=(0.0, 6.2, 27.0), coil_R=4.6, coil_r=1.0, coil_turns=3,
    # idle kneel: hips drop (approved units before size), torso lean forward and head down (degrees)
    kneel_drop=7.4, kneel_lean=38.0, kneel_head=14.0,
)
# head centre and radii as built (cast2 (0, -8.2, 34.4) leaning in; upright for the bind pose)
H0, R0 = (0, -0.6, 41.2), (5.8, 5.4, 6.2)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: bare skin
HEAD_RAMPS = ['SKIN', 'SKIN_LID']
# eyes, dark brows, mouth, eye glint, stubble
FACE_FLATS = ['#1E1714', '#3A2A20', '#4A2A24', '#F4F4F2', '#8C5844']
# no face paint on the crew; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the steel spanner, zip and radio aerial
SPEC_RAMPS = ('SILVER',)
# checks: height range in metres (not shorter than the clown's 1.791 m); idle looks down at the cable
CHECK = dict(height=(1.80, 1.95), idle_head_down=True)
# walk style: a working stride, arms a little out from the tool belt
WALK = dict(thigh=20.0, knee=30.0, arm=14.0, bob=0.4, arm_out=22, sway=1)
# focus is the default (eyes on the work); grin for "Fall over it, they love that"
EXPR = ['focus', 'grin', 'startle', 'frown']

def _grow(before):
    """Scale every object made since `before` about the origin (feet) by CONFIG size: uniform, so rotations hold."""
    import bpy
    k = CONFIG['size']
    for o in set(bpy.data.objects) - before:
        o.location = o.location * k; o.scale = o.scale * k

def _align(o, d):
    """Turn a torus (axis z) so its axis runs along d."""
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
        # work boot: upper, thick sole, steel toe cap, boot collar, three laces
        res(20, 10)
        tag(ell(T('SHOE'), (x, -1.9, 1.9), (2.8, 4.6, 1.7)), 'SHOE', B)
        tag(ell(T('BLACK'), (x, -1.9, 0.5), (3.0, 4.8, 0.6)), 'BLACK', B)
        res(14, 8)
        tag(ell(T('SHOE'), (x, -5.3, 1.6), (2.2, 1.7, 1.25)), 'SHOE', B)
        res(18, 6)
        tag(torus(T('SHOE'), (x, 0, 3.9), 2.6, 0.8), 'SHOE', B)
        res(10, 6)
        for yy, zz in ((-3.0, 3.0), (-1.9, 3.5), (-0.8, 3.9)):
            tag(ell(T('CANVAS'), (x, yy, zz), (1.4, 0.32, 0.28)), 'CANVAS', B)
        # trouser leg tucked into the boot
        res(18, 8)
        tag(cyl(T('HAT'), (x, 0, 10.4), 2.75, 13.8), 'HAT', f'thigh_{S},shin_{S},foot_{S}', cuts=7)
        # knee pad on a strap (he kneels all night)
        res(14, 8)
        tag(ell(T('BLACK'), (x, -2.6, 9.6), (2.1, 0.9, 2.3)), 'BLACK', f'thigh_{S},shin_{S}')
        res(18, 6)
        tag(torus(T('HAT_BAND'), (x, 0, 9.0), 2.85, 0.4), 'HAT_BAND', f'thigh_{S},shin_{S}')
        # cargo pocket on the outer thigh, with its flap
        res(10, 6)
        tag(ell(T('HAT'), (s * (c['leg_x'] + 2.55), 0, 13.2), (0.6, 1.9, 2.1)), 'HAT', f'thigh_{S}')
        tag(ell(T('HAT_BAND'), (s * (c['leg_x'] + 2.7), 0, 15.0), (0.45, 2.0, 0.5)), 'HAT_BAND', f'thigh_{S}')
    res(24, 12)
    tag(ell(T('HAT'), (0, 0, 17.6), (7.4, 5.2, 3.6)), 'HAT', 'hips')

def _jacket():
    # olive work jacket: tapered body with loop cuts, hem band, shoulder caps, collar, zip, chest pocket
    res(28, 12)
    tag(cone(T('JACKET'), (0, 0, 16.4), (0, 0, 33.8), 7.5, 8.0, yscale=0.75), 'JACKET', 'hips,spine,chest', cuts=6)
    res(28, 6)
    tag(torus(T('JACKET'), (0, 0, 16.6), 7.6, 0.75, scale=(1, 0.76, 1)), 'JACKET', 'hips')
    res(16, 8)
    for s in (-1, 1):
        tag(ell(T('JACKET'), (s * 8.0, 0, 32.2), (3.0, 3.0, 2.7)), 'JACKET', f'chest,clavicle_{side(s)},upper_arm_{side(s)}')
        # turned-down collar points
        tag(ell(T('JACKET'), (s * 2.4, -4.8, 34.0), (2.3, 0.55, 1.5), rot=(0, s * 30, 0)), 'JACKET', 'chest,neck')
    res(20, 6)
    tag(torus(T('JACKET'), (0, -0.3, 34.6), 3.2, 0.9, scale=(1, 0.9, 1)), 'JACKET', 'chest,neck')
    res(8, 6)
    capsule(T('SILVER'), (0, -5.75, 18.6), (0, -6.0, 33.4), 0.22, 'hips,spine,chest', ramp='SILVER')
    res(12, 6)
    tag(ell(T('JACKET'), (3.4, -5.5, 28.6), (1.7, 0.45, 1.8)), 'JACKET', 'chest')
    tag(ell(T('HAT_BAND'), (3.4, -5.75, 30.0), (1.8, 0.4, 0.55)), 'HAT_BAND', 'chest')
    res(8, 6)
    tag(ell(T('BLACK'), (3.4, -6.1, 29.9), (0.35, 0.25, 0.35)), 'BLACK', 'chest')

def _belt():
    # tool belt, buckle, pouch with a spanner and pliers on the left hip, gaffer tape roll on the right hip
    res(28, 6)
    tag(torus(T('HAT_BAND'), (0, 0, 17.6), 7.4, 0.85, scale=(1, 0.75, 1)), 'HAT_BAND', 'hips')
    res(10, 6)
    tag(ell(T('SILVER'), (0, -5.7, 17.6), (1.1, 0.4, 0.9)), 'SILVER', 'hips')
    res(14, 8)
    tag(ell(T('HAT_BAND'), (6.4, -2.4, 16.0), (1.7, 1.9, 2.4)), 'HAT_BAND', 'hips')
    res(8, 6)
    capsule(T('SILVER'), (6.4, -3.4, 17.2), (6.9, -3.8, 21.2), 0.35, 'hips', ramp='SILVER')
    tag(torus(T('SILVER'), (6.9, -3.8, 21.3), 0.6, 0.3), 'SILVER', 'hips')
    for dx in (-0.35, 0.35):
        capsule(T('RED'), (7.0 + dx, -1.8, 17.2), (7.3 + dx, -1.6, 20.0), 0.3, 'hips', ramp='RED')
    res(18, 6)
    tag(_align(torus(T('WARM_WHITE'), (-7.0, -1.2, 15.4), 1.5, 0.7), (1, 0, 0)), 'WARM_WHITE', 'hips,thigh_R')
    res(8, 6)
    tag(ell(T('SHOE'), (-6.6, -1.2, 17.0), (0.4, 0.5, 1.0)), 'SHOE', 'hips,thigh_R')

def _arms(c):
    # jacket sleeves to the wrist, elbow patches, cuffs, tan leather work gloves
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        res(16, 8)
        tag(cone(T('JACKET'), sh, el, 2.5, 2.3), 'JACKET', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        tag(ell(T('JACKET'), el, (2.3, 2.3, 2.3)), 'JACKET', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('JACKET'), el, wr, 2.3, 1.9), 'JACKET', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        res(12, 6)
        back = el + Vector((0, 1.9, 0))
        tag(ell(T('HAT_BAND'), back, (1.3, 0.6, 1.5)), 'HAT_BAND', f'upper_arm_{S},forearm_{S}')
        res(18, 6)
        tag(_align(torus(T('JACKET'), wr - d2 * 0.4, 1.9, 0.5), d2), 'JACKET', f'forearm_{S},hand_{S}')
        # glove: cuff, palm, four fingers, thumb
        res(16, 6)
        tag(_align(torus(T('OCHRE'), wr + d2 * 0.3, 1.55, 0.45), d2), 'OCHRE', f'forearm_{S},hand_{S}')
        pc = wr + d2 * 1.4
        res(14, 8)
        p = ell(T('OCHRE'), pc, (1.4, 1.9, 2.0))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'OCHRE', f'forearm_{S},hand_{S}')
        base = pc + d2 * 1.4
        res(10, 6)
        for dy in (-1.2, -0.4, 0.4, 1.2):
            q0 = base + Vector((0, dy * 1.0, 0))
            capsule(T('OCHRE'), q0, q0 + d2 * (2.0 - abs(dy) * 0.3), 0.56, f'hand_{S},fingers_{S}', ramp='OCHRE')
        t0 = pc + Vector((0, -1.4, 0.3)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 1.7
        capsule(T('OCHRE'), t0, t1, 0.58, f'hand_{S}', ramp='OCHRE')

def _coil(c):
    # three-turn floor cable on his back, a strap from the left shoulder across the chest, a radio on it, the tail
    cx, cy, cz = c['coil']
    res(30, 8)
    for k in range(c['coil_turns']):
        o = torus(T('BLACK'), (cx + 0.35 * (k - 1), cy + 0.9 * k, cz - 0.25 * k), c['coil_R'] - 0.15 * k, c['coil_r'])
        tag(_align(o, (0, 1, 0)), 'BLACK', 'chest,spine')
    res(10, 6)
    capsule(T('BLACK'), (cx - 2.6, cy + 1.0, cz - 3.8), (-3.6, 5.8, 18.6), 0.9, 'spine,hips', ramp='BLACK')
    capsule(T('BLACK'), (-3.6, 5.8, 18.6), (-4.4, 4.2, 14.8), 0.9, 'hips', ramp='BLACK')
    # strap: over the left shoulder, front diagonal to the right hip, back down to the coil
    res(10, 6)
    front = [(4.6, -1.6, 35.0), (3.2, -5.4, 31.0), (-1.0, -6.1, 25.0), (-5.6, -5.4, 19.6)]
    for p, q in zip(front, front[1:]):
        capsule(T('HAT_BAND'), p, q, 0.5, 'chest,spine,hips', ramp='HAT_BAND')
    capsule(T('HAT_BAND'), (4.6, 1.6, 35.0), (2.6, 5.9, 30.6), 0.5, 'chest', ramp='HAT_BAND')
    # radio clipped to the strap, with its aerial
    res(12, 6)
    tag(ell(T('BLACK'), (0.9, -6.2, 27.8), (1.1, 0.7, 1.6)), 'BLACK', 'chest,spine')
    res(8, 6)
    capsule(T('SILVER'), (1.3, -6.4, 28.6), (1.7, -6.5, 32.2), 0.16, 'chest,spine', ramp='SILVER')

def _head():
    # neck, ears, nose, dark hair at the nape and sideburns, ribbed beanie with a turn-up
    res(16, 10)
    tag(ell(T('SKIN'), (0, -0.4, 35.6), (2.8, 2.8, 2.4)), 'SKIN', 'neck,head')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN'), (s * 5.8, -0.4, 40.6), (1.1, 1.4, 1.7)), 'SKIN', 'head')
        tag(ell(T('SHOE'), (s * 5.3, -0.9, 41.4), (0.7, 1.2, 1.7)), 'SHOE', 'head')
    for k, ang in enumerate(range(-60, 61, 30)):
        t = math.radians(ang)
        tag(ell(T('SHOE'), (4.9 * math.sin(t), 4.6 * math.cos(t) - 0.3, 38.9), (1.6, 1.1, 1.3)), 'SHOE', 'head')
    res(16, 10)
    tag(ell(T('SKIN'), (0, on_surface(H0, R0, 0, 40.0, 0.95), 40.0), (1.2, 1.3, 1.5)), 'SKIN', 'head')
    res(28, 12)
    tag(ell(T('RUST_DARK'), (0, -0.4, 45.4), (6.1, 5.7, 4.4)), 'RUST_DARK', 'head')
    res(28, 8)
    tag(torus(T('RUST_HAIR'), (0, -0.5, 43.6), 6.0, 1.15, scale=(1, 0.94, 1)), 'RUST_HAIR', 'head')
    # ribs on the turn-up
    res(8, 6)
    for a in range(0, 360, 20):
        t = math.radians(a)
        tag(ell(T('RUST_DARK'), (7.0 * math.sin(t), 6.6 * math.cos(t) - 0.5, 43.6), (0.28, 0.28, 1.0)), 'RUST_DARK', 'head')
    res(10, 6)
    tag(ell(T('RUST_DARK'), (0, -0.4, 49.6), (1.2, 1.0, 0.7)), 'RUST_DARK', 'head')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN'), H0, R0), 'SKIN', 'head', group='head')

def _body():
    c = CONFIG
    _legs(c); _jacket(); _belt(); _arms(c); _coil(c); _head()

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Focus: lids half down, brows knit, mouth flat (eyes on the work). Grin: one-sided grin, brows up on one side.
    Startle: round eyes, brows up, small open mouth. Frown: brows down and in, mouth down. Stubble on every face."""
    lid = dict(focus=0.4, grin=0.25, startle=0.0, frown=0.4)[expr]
    brow = dict(focus=-0.2, grin=0.3, startle=1.0, frown=-0.5)[expr]
    knit = dict(focus=0.35, grin=0.0, startle=0.0, frown=0.5)[expr]
    for s in (-1, 1):
        x = s * 2.3
        ez = 0.9 if expr == 'startle' else 0.68
        ell(F('#1E1714'), (x, on_surface(H0, R0, x, 41.4, 0.25), 41.4), (0.72, 0.4, ez))
        if expr != 'focus':
            ell(F('#F4F4F2'), (x - s * 0.3, on_surface(H0, R0, x, 41.8, 0.42), 41.8), (0.28, 0.28, 0.28))
        if lid > 0:
            ell(T('SKIN_LID'), (x, on_surface(H0, R0, x, 42.05, 0.32), 42.05 - 0.1 * (1 - lid)), (1.3, 0.5, 0.35 + 0.35 * lid))
        lift = brow + (0.35 if expr == 'grin' and s < 0 else 0.0)
        pts = [(1.0, 43.0), (2.0, 43.3), (3.1, 43.25), (3.9, 42.9)]
        build.arc(F('#3A2A20'), [(s * xx, on_surface(H0, R0, s * xx, zz + lift - knit * (2.5 - xx) * 0.5, 0.3), zz + lift - knit * (2.5 - xx) * 0.5)
                                 for xx, zz in pts], (0.7, 0.45, 0.5))
    # stubble along the jaw and chin
    for xx, zz in ((-3.6, 37.6), (-2.6, 36.4), (-1.4, 35.7), (0.0, 35.5), (1.4, 35.7), (2.6, 36.4), (3.6, 37.6),
                   (-2.0, 37.4), (2.0, 37.4), (-0.7, 36.6), (0.7, 36.6)):
        ell(F('#8C5844'), (xx, on_surface(H0, R0, xx, zz, 0.08), zz), (0.32, 0.2, 0.32))
    if expr == 'startle':
        ell(F('#4A2A24'), (0, on_surface(H0, R0, 0, 37.6, 0.2), 37.6), (0.8, 0.4, 0.7))
    else:
        bend = dict(focus=0.0, grin=0.5, frown=-0.4)[expr]
        tilt = 0.35 if expr == 'grin' else 0.0
        build.arc(F('#4A2A24'), [(xx, on_surface(H0, R0, xx, 37.9 + bend * (abs(xx) / 1.6) ** 2 + tilt * xx / 1.6, 0.15),
                                  37.9 + bend * (abs(xx) / 1.6) ** 2 + tilt * xx / 1.6)
                                 for xx in (-1.6, -0.8, 0.0, 0.8, 1.6)], (0.55, 0.3, 0.3))

def bones(U): return humanoid_bones(CONFIG, U * CONFIG['size'])

def idle(t, length):
    """The cast2 kneel: right knee down on its pad, left foot planted forward, leaning in over the cable,
    right glove on the floor laying it, left glove on the left knee, head down; slow breath."""
    c = CONFIG; k = c['size']; p = 2 * math.pi * t / length
    K.move('hips', (0, 0.6 * k, -c['kneel_drop'] * k - 0.08 * k * (1 - math.cos(p))))
    # right leg: thigh straight down, shin back along the floor, toes tucked under
    K.rotw('thigh_R', (1, 0, 0), 4)
    K.rotw('shin_R', (1, 0, 0), 88)
    K.aim('foot_R', (0, 1.0, -0.45))
    # left leg: thigh forward level, shin straight down, foot flat
    K.rotw('thigh_L', (1, 0, 0), -86)
    K.rotw('shin_L', (1, 0, 0), 86)
    K.aim('foot_L', (0, -1.0, -0.2))
    K.rotw('spine', (1, 0, 0), c['kneel_lean'] * 0.5)
    K.rotw('chest', (1, 0, 0), c['kneel_lean'] * 0.5 + 1.2 * math.sin(p))
    K.aim('upper_arm_R', (-0.2, -0.75, -1.0)); K.aim('forearm_R', (0.05, -0.55, -1.0))
    K.aim('hand_R', (0.0, -1.0, -0.6))
    K.aim('upper_arm_L', (0.3, -0.7, -1.0)); K.aim('forearm_L', (-0.1, -0.6, -1.0))
    K.rotw('head', (1, 0, 0), c['kneel_head'] + 1.5 * math.sin(p + 0.5))

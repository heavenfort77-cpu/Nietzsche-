"""The child (night-1 crew, the one who sees; proposal): same figure as art/cast2 child(), rebuilt for the pipeline
with the clowns' level of modelled detail: strap shoes with soles, toe caps and brass buckles; ankle socks with a
turned-down top (the right one slumped in folds); bare legs with knees and a sticking plaster on the left knee; dark
short trousers under the hem; a wool smock with a yoke seam, a round white collar,
three brass buttons down the back and a patch pocket with a stub of chalk; sleeves with rolled cuffs; short dark hair
showing under his father's flat cap, far too big for him (band, seam, peak, button). Bind pose upright with A-pose
arms; hands clasped behind the back, head turned to his left, is the idle clip. No face paint: crew are not clowns.
Not shorter than the clown does not apply to him (owner, 22 Nov)."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, capsule, arm_points, humanoid_bones
import posekit as K
from palette import RAMPS

# crew ramps from art/cast2/build_cast2.py (EXTRA), [light, base, shadow, deep]
RAMPS.update(dict(
    WOOL=['#B8A77E', '#958459', '#6C5F3E', '#33291A'],
    CANVAS=['#D9CDB4', '#BBAE92', '#8F8269', '#463C2E'],
    # the child's dark brown hair (RUST_DARK read as the clown's orange on the first render)
    HAIR_DARK=['#6E5444', '#4B3829', '#30231A', '#170F0B'],
))

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (cast2 shoes at 2.2)
    leg_x=2.1,
    # arm angle from vertical in the bind pose, degrees (the smock flares to 6.6 at the hem)
    arm_out=32.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length
    upper_len=4.4,
    # forearm length
    fore_len=3.9,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units
    shoulder=(4.4, 0.0, 19.8),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(1.4, 0.0, 19.6),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(9.8, 13.6, 17.2, 21.2, 22.8, 34.5),
    # leg joints: hip, knee, ankle (z)
    leg_z=(10.4, 6.0, 1.9),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.1, -2.6, 0.5),
    # hand bone length
    hand_len=1.4,
    # finger bone length
    finger_len=1.0,
    # whole figure scaled about the feet after building (his father the stagehand's factor; cast2 child at 1 is about 1.04 m)
    size=1.22,
    # smock: top and hem height, top and hem radius, front-to-back squash
    smock_z=(21.2, 9.0), smock_R=(4.7, 6.6), smock_y=0.8,
    # father's cap: centre, radii (the stagehand's cap, wider than his head by about 1 unit)
    cap=(0.0, 0.2, 32.2), cap_R=(6.7, 6.4, 2.3),
    # idle: how far the head turns to his left, degrees (his eyes look the same way)
    look_turn=10.0,
)
# head centre and radii as built (cast2)
H0, R0 = (0, 0, 27.6), (5.6, 5.2, 5.8)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: bare skin
HEAD_RAMPS = ['SKIN', 'SKIN_LID']
# eye dark, eye white, mouth, brows, cheek flush
FACE_FLATS = ['#1E1714', '#F4F4F2', '#8C5844', '#4A3426', '#D49A84']
# no face paint on the crew; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the shoe buckles and the back buttons
SPEC_RAMPS = ('GOLD',)
# checks: height range in metres (a child of about eight; the crew's not-shorter rule does not apply)
CHECK = dict(height=(1.15, 1.40))
# walk style: short quick steps, arms swinging, a little bounce
WALK = dict(thigh=20.0, knee=32.0, arm=16.0, bob=0.3, arm_out=18, sway=3)
# watch is the default (cast2: round eyes looking sideways, straight mouth); say for "...on purpose."
EXPR = ['watch', 'say', 'startle', 'frown']

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

def _smock_r(z):
    """Smock radius at height z (straight cone between top and hem)."""
    c = CONFIG; (zt, zh), (rt, rh) = c['smock_z'], c['smock_R']
    return rt + (rh - rt) * (zt - z) / (zt - zh)

def _legs(c):
    for s in (-1, 1):
        S = side(s)
        x = s * c['leg_x']
        B = f'foot_{S},shin_{S}'
        # strap shoe: upper, sole, round toe cap, strap over the instep, brass buckle on the outside
        res(18, 10)
        tag(ell(T('SHOE'), (x, -0.9, 1.0), (1.6, 2.6, 1.0)), 'SHOE', B)
        tag(ell(T('BLACK'), (x, -0.9, 0.35), (1.7, 2.7, 0.38)), 'BLACK', B)
        res(14, 8)
        tag(ell(T('SHOE'), (x, -2.6, 0.95), (1.3, 1.1, 0.8)), 'SHOE', B)
        res(10, 6)
        capsule(T('BLACK'), (x - 1.35, -1.3, 1.45), (x + 1.35, -1.3, 1.45), 0.3, B, ramp='BLACK')
        res(12, 6)
        tag(_align(torus(T('GOLD'), (x + s * 1.45, -1.3, 1.45), 0.38, 0.13), (1, 0, 0)), 'GOLD', B)
        # ankle sock with a turned-down top; the right one has slumped into folds
        res(16, 6)
        tag(cyl(T('WARM_WHITE'), (x, 0, 3.0), 1.35, 2.4), 'WARM_WHITE', B, cuts=2)
        if s > 0:
            tag(torus(T('WARM_WHITE'), (x, 0, 4.2), 1.35, 0.4), 'WARM_WHITE', B)
        else:
            for z in (2.4, 3.1, 3.8):
                tag(torus(T('WARM_WHITE'), (x, 0, z), 1.38, 0.3), 'WARM_WHITE', B)
        # bare leg from the sock to under the shorts, knee in the middle
        res(16, 8)
        tag(cyl(T('SKIN'), (x, 0, 6.6), 1.2, 4.8), 'SKIN', f'thigh_{S},shin_{S}', cuts=4)
        res(12, 8)
        tag(ell(T('SKIN'), (x, -0.15, 6.0), (1.32, 1.3, 1.15)), 'SKIN', f'thigh_{S},shin_{S}')
        # short trouser leg, showing under the smock hem
        res(18, 6)
        tag(cyl(T('HAT'), (x, 0, 9.6), 1.75, 2.6), 'HAT', f'hips,thigh_{S}', cuts=1)
        tag(torus(T('HAT'), (x, 0, 8.35), 1.75, 0.3), 'HAT', f'thigh_{S}')
    # sticking plaster on the left knee
    res(10, 6)
    tag(ell(T('CANVAS'), (c['leg_x'], -1.38, 6.15), (0.75, 0.22, 0.5), rot=(0, 15, 0)), 'CANVAS', 'thigh_L,shin_L')
    res(20, 8)
    tag(ell(T('HAT'), (0, 0, 10.6), (3.9, 3.0, 1.6)), 'HAT', 'hips')

def _smock(c):
    zt, zh = c['smock_z']; rt, rh = c['smock_R']; ys = c['smock_y']
    # body of the smock with loop cuts so it bends at the waist and the thighs
    res(28, 12)
    tag(cone(T('WOOL'), (0, 0, zt), (0, 0, zh), rt, rh, yscale=ys), 'WOOL', 'hips,spine,chest,thigh_L,thigh_R', cuts=6)
    # yoke seam across the chest (a hem band and smocking lines read as a hoop and straps on the first render, removed)
    res(26, 6)
    tag(torus(T('WOOL'), (0, 0, 18.6), _smock_r(18.6), 0.32, scale=(1, ys, 1)), 'WOOL', 'chest,spine')
    # patch pocket on his right with a stub of chalk
    px, pz = -2.3, 12.8
    py = -ys * math.sqrt(_smock_r(pz) ** 2 - px ** 2)
    res(14, 8)
    tag(ell(T('CANVAS'), (px, py - 0.05, pz), (1.5, 0.35, 1.3), rot=(0, 0, -18)), 'CANVAS', 'hips,thigh_R')
    res(8, 6)
    capsule(T('WARM_WHITE'), (px - 0.4, py - 0.15, pz + 0.6), (px - 0.2, py - 0.2, pz + 1.9), 0.26, 'hips', ramp='WARM_WHITE')
    # three brass buttons down the back of the yoke
    res(10, 6)
    for z in (20.2, 19.0, 17.8):
        tag(ell(T('GOLD'), (0, ys * _smock_r(z) + 0.05, z), (0.36, 0.25, 0.36)), 'GOLD', 'chest')
    # round white collar: a band round the neck and two lobes over the front
    res(20, 6)
    tag(torus(T('WARM_WHITE'), (0, 0, 21.2), 2.3, 0.5, scale=(1, 0.9, 1)), 'WARM_WHITE', 'chest,neck')
    res(14, 8)
    for s in (-1, 1):
        tag(ell(T('WARM_WHITE'), (s * 1.55, -3.3, 20.9), (1.75, 0.42, 1.15), rot=(0, s * 22, s * 18)), 'WARM_WHITE', 'chest,neck')

def _arms(c):
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        # wool sleeve: shoulder cap, upper sleeve, elbow, forearm sleeve, rolled cuff
        res(14, 8)
        tag(ell(T('WOOL'), sh, (1.7, 1.7, 1.7)), 'WOOL', f'chest,clavicle_{S},upper_arm_{S}')
        res(14, 8)
        tag(cone(T('WOOL'), sh, el, 1.5, 1.35), 'WOOL', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        tag(ell(T('WOOL'), el, (1.35, 1.35, 1.35)), 'WOOL', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('WOOL'), el, wr, 1.35, 1.2), 'WOOL', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        res(16, 6)
        tag(_align(torus(T('WOOL'), wr - d2 * 0.4, 1.25, 0.4), d2), 'WOOL', f'forearm_{S},hand_{S}')
        # small hand: palm, three fingers, thumb
        res(12, 8)
        pc = wr + d2 * 0.9
        p = ell(T('SKIN'), pc, (0.75, 1.05, 1.1))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'SKIN', f'forearm_{S},hand_{S}')
        base = pc + d2 * 0.8
        res(8, 6)
        for dy in (-0.6, 0.0, 0.6):
            q0 = base + Vector((0, dy * 0.85, 0))
            capsule(T('SKIN'), q0, q0 + d2 * (1.1 - abs(dy) * 0.25), 0.3, f'hand_{S},fingers_{S}')
        t0 = pc + Vector((0, -0.8, 0.2)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 0.95
        capsule(T('SKIN'), t0, t1, 0.3, f'hand_{S}')

def _head(c):
    # neck, ears, button nose, short dark hair under the cap, the father's flat cap (too big)
    res(14, 8)
    tag(ell(T('SKIN'), (0, 0, 21.9), (1.9, 1.9, 1.4)), 'SKIN', 'neck,head')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN'), (s * 5.55, 0.2, 27.2), (0.95, 1.3, 1.6)), 'SKIN', 'head')
        # hair over the temple, in front of and above the ear
        res(10, 6)
        for k, (yy, zz) in enumerate(((-1.6, 29.6), (0.2, 29.9), (1.9, 29.5))):
            tag(ell(T('HAIR_DARK'), (s * 5.15, yy, zz), (0.95, 1.1, 1.3)), 'HAIR_DARK', 'head')
    res(14, 8)
    tag(ell(T('SKIN'), (0, on_surface(H0, R0, 0, 26.2, 0.45), 26.2), (0.62, 0.62, 0.72)), 'SKIN', 'head')
    # back of the head: two rows of short tufts from under the cap down to the nape
    res(8, 6)
    for r, (z, rad) in enumerate(((29.6, 5.2), (27.9, 4.9))):
        for ang in range(-80 + 10 * r, 81, 20):
            t = math.radians(ang)
            tag(ell(T('HAIR_DARK'), (rad * math.sin(t), rad * 0.94 * math.cos(t), z), (1.15, 0.85, 1.0)), 'HAIR_DARK', 'head')
    # three tufts poking out under the peak
    for xx in (-1.8, 0.2, 1.9):
        tag(ell(T('HAIR_DARK'), (xx, on_surface(H0, R0, xx, 30.6, 0.3), 30.6), (0.9, 0.55, 0.75), rot=(0, 10 * xx, 0)), 'HAIR_DARK', 'head')
    # father's flat cap: crown, seam, peak, button on top
    cx, cy, cz = c['cap']
    res(28, 10)
    tag(ell(T('HAT_BAND'), (cx, cy, cz), c['cap_R']), 'HAT_BAND', 'head')
    res(28, 6)
    tag(torus(T('HAT'), (cx, cy, cz - 1.05), c['cap_R'][0] - 0.5, 0.5, scale=(1, 0.96, 1)), 'HAT', 'head')
    res(20, 8)
    tag(ell(T('HAT_BAND'), (cx, cy - 5.9, cz - 0.95), (5.0, 2.8, 0.6), rot=(-8, 0, 0)), 'HAT_BAND', 'head')
    res(10, 6)
    tag(ell(T('HAT'), (cx, cy - 0.6, cz + c['cap_R'][2] - 0.1), (0.75, 0.75, 0.45)), 'HAT', 'head')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN'), H0, R0), 'SKIN', 'head', group='head')

def _body():
    c = CONFIG
    _legs(c); _smock(c); _arms(c); _head(c)

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Watch: big round eyes looking to his left, level brows, straight mouth (cast2: he knows). Say ("...on purpose."):
    eyes on the clown under lowered lids, a small round mouth. Startle: eyes wider, brows up, mouth open.
    Frown: brows down and in, eyes to his right, mouth turned down. A faint flush on the cheeks on every face."""
    look = dict(watch=0.55, say=0.0, startle=0.0, frown=-0.4)[expr]
    brow = dict(watch=0.0, say=-0.15, startle=0.8, frown=-0.35)[expr]
    knit = dict(watch=0.0, say=0.0, startle=0.0, frown=0.4)[expr]
    grow = 1.12 if expr == 'startle' else 1.0
    for s in (-1, 1):
        x = s * 2.3
        ell(F('#F4F4F2'), (x, on_surface(H0, R0, x, 27.8, 0.2), 27.8), (1.25 * grow, 0.4, 1.35 * grow))
        ell(F('#1E1714'), (x + look, on_surface(H0, R0, x + look, 27.7, 0.45), 27.7), (0.75, 0.35, 0.85))
        ell(F('#F4F4F2'), (x + look - 0.25, on_surface(H0, R0, x + look - 0.25, 28.05, 0.6), 28.05), (0.24, 0.2, 0.24))
        if expr == 'say':
            ell(T('SKIN_LID'), (x, on_surface(H0, R0, x, 28.85, 0.32), 28.85), (1.45, 0.5, 0.75))
        pts = [(1.2, 29.55), (2.2, 29.8), (3.2, 29.7)]
        build.arc(F('#4A3426'), [(s * xx, on_surface(H0, R0, s * xx, zz + brow - knit * (2.4 - xx) * 0.5, 0.3), zz + brow - knit * (2.4 - xx) * 0.5)
                                 for xx, zz in pts], (0.45, 0.3, 0.28))
        ell(F('#D49A84'), (s * 3.5, on_surface(H0, R0, s * 3.5, 25.9, 0.1), 25.9), (0.9, 0.25, 0.55))
    if expr == 'say':
        ell(F('#8C5844'), (0, on_surface(H0, R0, 0, 24.6, 0.15), 24.6), (0.45, 0.3, 0.5))
    elif expr == 'startle':
        ell(F('#8C5844'), (0, on_surface(H0, R0, 0, 24.5, 0.15), 24.5), (0.7, 0.35, 0.8))
    else:
        bend = dict(watch=0.0, frown=-0.3)[expr]
        build.arc(F('#8C5844'), [(xx, on_surface(H0, R0, xx, 24.6 + bend * (abs(xx) / 1.1) ** 2, 0.12), 24.6 + bend * (abs(xx) / 1.1) ** 2)
                                 for xx in (-1.1, -0.55, 0.0, 0.55, 1.1)], (0.4, 0.28, 0.26))

def bones(U): return humanoid_bones(CONFIG, U * CONFIG['size'])

def idle(t, length):
    """Hands clasped behind the back, standing straight, head turned to his left (where his eyes look); a slow
    breath and a small rock on the heels."""
    c = CONFIG; p = 2 * math.pi * t / length
    K.move('hips', (0, 0.05 * c['size'] * math.sin(p), -0.04 * c['size'] * (1 - math.cos(p))))
    K.rotw('chest', (1, 0, 0), -2.0 + 0.8 * math.sin(p))
    for S, s in (('L', 1), ('R', -1)):
        K.aim(f'upper_arm_{S}', (s * 0.3, 0.55, -1.0)); K.aim(f'forearm_{S}', (-s * 0.85, 0.5, -0.12))
        K.aim(f'hand_{S}', (-s * 1.0, 0.25, -0.25))
    K.rotw('head', (0, 0, 1), c['look_turn'])
    K.rotw('head', (1, 0, 0), -2.0 + 1.0 * math.sin(p + 0.5))

"""The child (night-1 crew, the one who sees; proposal): a girl (owner 23 Nov 22:40), the cast2 child's figure rebuilt
for the pipeline with the clowns' level of modelled detail: strap shoes with soles, toe caps and brass buckles; a
knee sock on the left with a turned-down top, the right sock slumped to the ankle in folds; bare legs with knees and
a crossed sticking plaster on the left knee; a wool smock dress with a round white collar, three brass buttons down
the back and a patch pocket with a stub of chalk; sleeves with rolled cuffs; dark hair with a fringe, covering the
ears to the jaw, two plaits down the back tied with red ribbons, under her father's flat cap, far too big for her
(band, seam, peak, button). Bind pose upright with A-pose arms; hands clasped behind the back, head turned to her
left, is the idle clip. No face paint: crew are not clowns. Not shorter than the clown does not apply to her
(owner, 22 Nov)."""
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
    # whole figure scaled about the feet after building (her father the stagehand's factor; cast2 child at 1 is about 1.04 m)
    size=1.22,
    # smock: top and hem height, top and hem radius, front-to-back squash
    smock_z=(21.2, 9.0), smock_R=(4.7, 6.6), smock_y=0.8,
    # father's cap: centre, radii (the stagehand's cap, wider than her head by about 1 unit)
    cap=(0.0, 0.2, 32.2), cap_R=(6.7, 6.4, 2.3),
    # idle: how far the head turns to her left, degrees (her eyes look the same way)
    look_turn=10.0,
    # idle arms behind the back: upper arm and forearm directions for the left arm (x mirrored for the right)
    back_upper=(0.1, 1.0, -0.9), back_fore=(-0.85, 0.5, 0.05),
    # elbow sphere radius, just outside both sleeve ends (1.35): equal radii baked as a jagged seam (as the strongman's);
    # 1.22 inside them lost contact with the upper sleeve when the elbow bent (floats-free gate, idle and slap)
    elbow_R=1.45,
    # left knee sock top height; plaster strip half length
    sock_top=5.0, plaster=0.95,
    # plaits: start and end of each plait down the back (x is mirrored; pressed into the smock back so they stay on when the head turns), links per plait
    plait_top=(3.3, 3.3, 24.0), plait_end=(3.4, 3.2, 18.6), plait_n=5,
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
# checks: height range in metres (a girl of about eight; the crew's not-shorter rule does not apply)
CHECK = dict(height=(1.15, 1.40))
# walk style: short quick steps, arms swinging, a little bounce
WALK = dict(thigh=20.0, knee=32.0, arm=16.0, bob=0.3, arm_out=18, sway=3)
# watch is the default (eyes to the side, straight mouth); say for "...on purpose."
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
        # left: knee sock with a turned-down top; right: slumped to the ankle in folds (the two heights read at play size)
        res(16, 6)
        if s > 0:
            tag(cyl(T('WARM_WHITE'), (x, 0, 3.3), 1.35, 3.0), 'WARM_WHITE', B, cuts=2)
            tag(cyl(T('WARM_WHITE'), (x, 0, 4.7), 1.3, c['sock_top'] - 4.4), 'WARM_WHITE', f'shin_{S}', cuts=2)
            tag(torus(T('WARM_WHITE'), (x, 0, c['sock_top']), 1.32, 0.42), 'WARM_WHITE', f'shin_{S}')
        else:
            tag(cyl(T('WARM_WHITE'), (x, 0, 3.0), 1.35, 2.4), 'WARM_WHITE', B, cuts=2)
            for z in (2.4, 3.1, 3.8):
                tag(torus(T('WARM_WHITE'), (x, 0, z), 1.38, 0.3), 'WARM_WHITE', B)
        # bare leg from the sock to under the shorts, knee in the middle
        res(16, 8)
        tag(cyl(T('SKIN'), (x, 0, 6.6), 1.2, 4.8), 'SKIN', f'thigh_{S},shin_{S}', cuts=4)
        res(12, 8)
        tag(ell(T('SKIN'), (x, -0.15, 6.0), (1.32, 1.3, 1.15)), 'SKIN', f'thigh_{S},shin_{S}')
    # sticking plaster on the left knee: two crossed strips, pale against the skin
    res(10, 6)
    for a in (35, -35):
        tag(ell(T('WARM_WHITE'), (c['leg_x'], -1.3, 6.1), (c['plaster'], 0.24, 0.42), rot=(0, a, 0)), 'WARM_WHITE', 'thigh_L,shin_L')

def _smock(c):
    zt, zh = c['smock_z']; rt, rh = c['smock_R']; ys = c['smock_y']
    # body of the smock with loop cuts so it bends at the waist and the thighs
    res(28, 12)
    tag(cone(T('WOOL'), (0, 0, zt), (0, 0, zh), rt, rh, yscale=ys), 'WOOL', 'hips,spine,chest,thigh_L,thigh_R', cuts=6)
    # patch pocket on her right with a stub of chalk
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
        tag(ell(T('WOOL'), el, (c['elbow_R'],) * 3), 'WOOL', f'upper_arm_{S},forearm_{S}')
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
    # neck, button nose, dark hair: a mass over the back and sides covering the ears to the jaw, a fringe under the
    # peak, two plaits down the back with red ribbons; the father's flat cap (too big)
    res(14, 8)
    tag(ell(T('SKIN'), (0, 0, 21.9), (1.9, 1.9, 1.4)), 'SKIN', 'neck,head')
    tag(ell(T('SKIN'), (0, on_surface(H0, R0, 0, 26.2, 0.45), 26.2), (0.62, 0.62, 0.72)), 'SKIN', 'head')
    res(28, 14)
    tag(ell(T('HAIR_DARK'), (0, 1.2, 27.4), (5.95, 5.4, 5.1)), 'HAIR_DARK', 'head')
    res(10, 6)
    for k, xx in enumerate((-3.4, -2.0, -0.6, 0.8, 2.2, 3.5)):
        z = 30.5 - 0.15 * abs(xx)
        tag(ell(T('HAIR_DARK'), (xx, on_surface(H0, R0, xx, z, 0.35), z), (0.95, 0.6, 1.0), rot=(0, -12 + 5 * k, 0)), 'HAIR_DARK', 'head')
    (tx, ty, tz), (ex, ey, ez), n = c['plait_top'], c['plait_end'], c['plait_n']
    for s in (-1, 1):
        res(10, 8)
        for k in range(n):
            f = k / (n - 1)
            q = (s * (tx + (ex - tx) * f + 0.22 * (-1) ** k), ty + (ey - ty) * f, tz + (ez - tz) * f)
            tag(ell(T('HAIR_DARK'), q, (0.95 - 0.12 * f, 0.85, 1.0), rot=(0, 25 * (-1) ** k, 0)), 'HAIR_DARK', 'neck,chest')
        # red ribbon bow at the end: two loops and a knot
        res(10, 6)
        for a in (1, -1):
            tag(ell(T('RED'), (s * ex + a * 0.75, ey + 0.35, ez - 0.7), (0.75, 0.3, 0.45), rot=(0, a * 25, 0)), 'RED', 'chest')
        tag(ell(T('RED'), (s * ex, ey + 0.45, ez - 0.7), (0.35, 0.35, 0.35)), 'RED', 'chest')
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
    """Dark oval eyes with a glint and two lashes, as the rest of the cast (owner 23 Nov 22:40: the round white eyes
    went). Watch: eyes set a little to her left, level brows, straight mouth (cast2: she knows). Say ("...on
    purpose."): eyes on the clown under lowered lids, a small round mouth. Startle: eyes taller, brows up, mouth open.
    Frown: brows down and in, eyes a little to her right, mouth turned down. A faint flush on the cheeks on every face."""
    look = dict(watch=0.3, say=0.0, startle=0.0, frown=-0.25)[expr]
    brow = dict(watch=0.0, say=-0.15, startle=0.8, frown=-0.35)[expr]
    knit = dict(watch=0.0, say=0.0, startle=0.0, frown=0.4)[expr]
    ez = 1.25 if expr == 'startle' else 1.05
    for s in (-1, 1):
        x = s * 2.3 + look
        ell(F('#1E1714'), (x, on_surface(H0, R0, x, 27.6, 0.25), 27.6), (0.82, 0.4, ez))
        ell(F('#F4F4F2'), (x - s * 0.28, on_surface(H0, R0, x - s * 0.28, 28.05, 0.45), 28.05), (0.3, 0.28, 0.3))
        for k in range(2):
            z = 28.45 - 0.4 * k
            ell(F('#1E1714'), (x + s * (0.85 + 0.15 * k), on_surface(H0, R0, x + s * (0.85 + 0.15 * k), z, 0.3), z), (0.38, 0.2, 0.13))
        if expr == 'say':
            ell(T('SKIN_LID'), (x, on_surface(H0, R0, x, 28.6, 0.32), 28.6), (1.15, 0.5, 0.6))
        pts = [(1.2, 29.4), (2.2, 29.65), (3.2, 29.55)]
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
    """Hands clasped behind the back, standing straight, head turned to her left (where her eyes look); a slow
    breath and a small rock on the heels."""
    c = CONFIG; p = 2 * math.pi * t / length
    K.move('hips', (0, 0.05 * c['size'] * math.sin(p), -0.04 * c['size'] * (1 - math.cos(p))))
    K.rotw('chest', (1, 0, 0), -2.0 + 0.8 * math.sin(p))
    for S, s in (('L', 1), ('R', -1)):
        (ux, uy, uz), (fx, fy, fz) = c['back_upper'], c['back_fore']
        K.aim(f'upper_arm_{S}', (s * ux, uy, uz)); K.aim(f'forearm_{S}', (s * fx, fy, fz))
        K.aim(f'hand_{S}', (-s * 1.0, 0.1, -0.2))
    K.rotw('head', (0, 0, 1), c['look_turn'])
    K.rotw('head', (1, 0, 0), -2.0 + 1.0 * math.sin(p + 0.5))

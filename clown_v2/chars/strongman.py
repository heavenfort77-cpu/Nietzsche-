"""The strongman (night-1 crew, proposal): same figure as art/cast2 strongman(), rebuilt for the pipeline with the
clowns' level of modelled detail: laced wrestling boots with soles, toe caps and cuffs; dark tights with knee loop
cuts; black trunks with leg bands; a striped singlet over the barrel chest with crimson shoulder straps and a scoop
neck; a wide leather belt with rivets and a gold buckle; bare arms with deltoids,
biceps and triceps, leather wrist cuffs with silver studs; a bald head with a horseshoe of short dark hair round
the back, ears, a broad nose and a handlebar moustache with curled tips; a bulb horn (red rubber bulb, brass tube, bell)
gripped in the left hand. Bind pose upright with A-pose arms; the cast2 pose (right arm flexed, horn held out to
the clown) is the idle clip. No face paint: crew are not clowns (PAINT_MIN None)."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, capsule, arm_points, humanoid_bones
import posekit as K
from palette import RAMPS

# crew ramp from art/cast2/build_cast2.py (EXTRA), [light, base, shadow, deep]
RAMPS.update(dict(
    SKIN_TAN=['#C89270', '#A87252', '#7E5038', '#3C2219'],
))

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (cast2 legs at 4.2; short thick legs)
    leg_x=4.2,
    # arm angle from vertical in the bind pose, degrees (40: the thick arms must clear the barrel chest)
    arm_out=40.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length
    upper_len=7.6,
    # forearm length
    fore_len=6.8,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units (cast2 shoulders at 10.8)
    shoulder=(11.2, 0.0, 35.0),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(2.4, 0.0, 34.4),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(14.0, 20.0, 27.0, 37.6, 39.8, 51.0),
    # leg joints: hip, knee, ankle (z)
    leg_z=(14.5, 8.4, 2.4),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.2, -4.4, 0.8),
    # hand bone length
    hand_len=2.6,
    # finger bone length
    finger_len=2.0,
    # whole figure scaled about the feet after building (owner 22 Nov: crew not shorter than the clown, 1.791 m)
    size=1.25,
    # barrel chest: centre z and radii (x, y, z) as cast2
    chest_z=27.0, chest_R=(11.0, 8.0, 11.0),
    # horn: tube radius, bulb radius, bell mouth radius, bell length (approved units)
    horn_r=0.45, bulb_R=2.0, bell_R=2.6, bell_len=4.2,
    # idle: where the bulb end of the horn points (armature space; up and toward the clown)
    horn_aim=(0.0, -0.35, 1.0),
)
# head centre and radii (cast2 head at y -1.2, moved back 0.8 so it sits on the head bone)
H0, R0 = (0, -0.4, 44.2), (6.0, 5.6, 6.4)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: bare tanned skin only (every other candidate counts as a feature)
HEAD_RAMPS = ['SKIN_TAN']
# eyes, brows, mouth, eye glint and teeth
FACE_FLATS = ['#1E1714', '#17151B', '#5A2A22', '#F4F4F2']
# no face paint on the crew; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the brass horn, the buckle and the cuff studs
SPEC_RAMPS = ('GOLD', 'SILVER')
# checks: height range in metres (not shorter than the clown's 1.791 m)
CHECK = dict(height=(1.80, 1.95))
# walk style: a heavy rolling stride, arms held out from the chest
WALK = dict(thigh=16.0, knee=26.0, arm=12.0, bob=0.45, arm_out=34, sway=4)
# grin is the default ("For luck! Give it a honk."); laugh for "HA! Now go get them."
EXPR = ['grin', 'laugh', 'startle', 'frown']

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
        # laced wrestling boot: shaft, foot, sole, toe cap, cuff, laces crossing up the front
        res(18, 8)
        tag(cyl(T('SHOE'), (x, 0, 4.6), 2.7, 6.4), 'SHOE', B, cuts=3)
        res(18, 10)
        tag(ell(T('SHOE'), (x, -1.8, 1.6), (2.7, 3.9, 1.5)), 'SHOE', B)
        tag(ell(T('BLACK'), (x, -1.8, 0.5), (2.8, 4.0, 0.55)), 'BLACK', B)
        res(14, 8)
        tag(ell(T('BLACK'), (x, -4.2, 1.4), (2.0, 1.4, 1.2)), 'BLACK', B)
        res(18, 6)
        tag(torus(T('SHOE'), (x, 0, 7.8), 2.75, 0.5), 'SHOE', f'shin_{S},foot_{S}')
        res(8, 6)
        for k in range(4):
            z = 3.0 + 1.2 * k
            tag(ell(T('WARM_WHITE'), (x, -2.65, z), (1.2, 0.25, 0.22), rot=(0, 28, 0)), 'WARM_WHITE', B)
            tag(ell(T('WARM_WHITE'), (x, -2.65, z), (1.2, 0.25, 0.22), rot=(0, -28, 0)), 'WARM_WHITE', B)
        # dark tights from the boot to under the trunks, knee in the middle
        res(18, 8)
        tag(cone(T('HAT'), (x, 0, 7.4), (x, 0, 14.4), 2.7, 3.4), 'HAT', f'thigh_{S},shin_{S}', cuts=5)
        # trunk leg band
        res(18, 6)
        tag(torus(T('BLACK'), (x, 0, 12.6), 3.35, 0.45), 'BLACK', f'hips,thigh_{S}')

def _trunks():
    res(26, 12)
    tag(ell(T('BLACK'), (0, 0, 15.6), (8.6, 6.4, 4.4)), 'BLACK', 'hips,thigh_L,thigh_R')

def _torso(c):
    TC, TR = (0, 0, c['chest_z']), c['chest_R']
    # barrel chest in the singlet
    res(32, 16)
    tag(ell(T('WARM_WHITE'), TC, TR), 'WARM_WHITE', 'hips,spine,chest')
    # singlet stripes (cast2), skinned by height
    res(32, 6)
    for z, bones in ((19.8, 'hips,spine'), (23.4, 'spine'), (27.0, 'spine,chest'), (30.6, 'chest')):
        R = TR[0] * math.sqrt(max(1 - ((z - TC[2]) / TR[2]) ** 2, 0.05))
        tag(torus(T('CRIMSON'), (0, 0, z), R + 0.1, 0.95, scale=(1, TR[1] / TR[0], 1)), 'CRIMSON', bones)
    # scoop neck: bare chest showing above the singlet
    res(20, 10)
    tag(ell(T('SKIN_TAN'), (0, on_surface(TC, TR, 0, 34.4, -1.9), 34.4), (4.6, 2.2, 3.0)), 'SKIN_TAN', 'chest')
    # crimson shoulder straps over the top of the chest, front to back
    res(10, 6)
    for s in (-1, 1):
        f = (s * 5.0, on_surface(TC, TR, s * 5.0, 33.0, 0.3), 33.0)
        t = (s * 5.6, 0.0, 37.0)
        b = (s * 5.0, -f[1], 33.0)
        capsule(T('CRIMSON'), f, t, 0.9, 'chest', ramp='CRIMSON')
        capsule(T('CRIMSON'), t, b, 0.9, 'chest', ramp='CRIMSON')
    # wide leather belt with rivets, gold buckle frame and prong
    res(32, 6)
    tag(torus(T('SHOE'), (0, 0, 17.6), 8.6, 1.0, scale=(1, 0.74, 1)), 'SHOE', 'hips,spine')
    res(6, 4)
    for a in range(30, 360, 30):
        t = math.radians(a)
        tag(ell(T('SILVER'), (math.sin(t) * 9.55, -math.cos(t) * 9.55 * 0.74 - 0.05, 17.6), (0.3, 0.3, 0.3)), 'SILVER', 'hips,spine')
    res(14, 8)
    tag(ell(T('GOLD'), (0, -7.5, 17.6), (1.8, 0.6, 1.3)), 'GOLD', 'hips,spine')
    res(10, 6)
    tag(_align(torus(T('GOLD'), (0, -7.9, 17.6), 1.6, 0.3, scale=(1, 0.8, 1)), (0, 1, 0)), 'GOLD', 'hips,spine')
    res(8, 6)
    capsule(T('SILVER'), (-0.9, -8.0, 17.6), (0.9, -8.0, 17.6), 0.2, 'hips,spine', ramp='SILVER')
    # neck (thick)
    res(16, 10)
    tag(ell(T('SKIN_TAN'), (0, -0.2, 38.8), (4.0, 3.8, 2.8)), 'SKIN_TAN', 'chest,neck,head')

def _arms(c):
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        # deltoid over the shoulder joint
        res(20, 12)
        tag(ell(T('SKIN_TAN'), sh + Vector((0, 0, 0.4)), (4.6, 4.4, 4.2)), 'SKIN_TAN', f'chest,clavicle_{S},upper_arm_{S}')
        # upper arm with biceps (front) and triceps (back) along it
        res(18, 10)
        tag(cone(T('SKIN_TAN'), sh, el, 3.4, 2.8), 'SKIN_TAN', f'clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        res(16, 10)
        tag(_align(ell(T('SKIN_TAN'), sh + d1 * (c['upper_len'] * 0.55) + Vector((0, -1.3, 0)), (2.4, 2.4, 3.2)), d1),
            'SKIN_TAN', f'upper_arm_{S}')
        tag(_align(ell(T('SKIN_TAN'), sh + d1 * (c['upper_len'] * 0.45) + Vector((0, 1.2, 0)), (2.3, 2.3, 3.0)), d1),
            'SKIN_TAN', f'upper_arm_{S}')
        tag(ell(T('SKIN_TAN'), el, (2.8, 2.8, 2.8)), 'SKIN_TAN', f'upper_arm_{S},forearm_{S}')
        # forearm, thick at the elbow
        res(16, 8)
        tag(cone(T('SKIN_TAN'), el, wr, 2.8, 2.1), 'SKIN_TAN', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        # leather wrist cuff with silver studs
        cc = wr - d2 * 1.3
        res(18, 6)
        tag(_align(cyl(T('SHOE'), cc, 2.35, 2.2), d2), 'SHOE', f'forearm_{S}')
        ax = d2.orthogonal().normalized(); ay = d2.cross(ax).normalized()
        res(6, 4)
        for a in range(0, 360, 60):
            t = math.radians(a)
            tag(ell(T('SILVER'), cc + (ax * math.cos(t) + ay * math.sin(t)) * 2.4, (0.35, 0.35, 0.35)), 'SILVER', f'forearm_{S}')
        # palm (thin across x, so it faces the body), four fingers across y, thumb forward
        pc = wr + d2 * 1.4
        res(14, 8)
        p = ell(T('SKIN_TAN'), pc, (1.5, 2.0, 2.2))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'SKIN_TAN', f'forearm_{S},hand_{S}')
        base = pc + d2 * 1.5
        res(10, 6)
        for dy in (-1.0, -0.33, 0.33, 1.0):
            q0 = base + Vector((0, dy * 1.1, 0))
            capsule(T('SKIN_TAN'), q0, q0 + d2 * (2.2 - abs(dy) * 0.35), 0.55, f'hand_{S},fingers_{S}', ramp='SKIN_TAN')
        t0 = pc + Vector((0, -1.5, 0.3)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 1.8
        capsule(T('SKIN_TAN'), t0, t1, 0.6, f'hand_{S}', ramp='SKIN_TAN')
        if s > 0:
            _horn(c, pc, d2, s)

def _horn(c, pc, d2, s):
    """Bulb horn gripped across the left palm (axis along y, the width of the hand): red rubber bulb behind the hand
    with a brass collar, brass tube through the grip, a bend, and a flared bell in front."""
    n = Vector((-s, 0, 0))
    # the tube runs through the middle of the palm and under the fingers, so the grip holds when the wrist turns
    a = pc + n * 0.4
    r = c['horn_r']
    res(12, 6)
    capsule(T('GOLD'), a + Vector((0, 2.2, 0)), a + Vector((0, -3.0, 0)), r, 'hand_L', ramp='GOLD')
    res(20, 12)
    tag(ell(T('RED'), a + Vector((0, 2.2 + c['bulb_R'] * 0.95, 0)), (c['bulb_R'] * 0.9, c['bulb_R'], c['bulb_R'] * 0.9)), 'RED', 'hand_L')
    res(10, 6)
    tag(_align(torus(T('GOLD'), a + Vector((0, 2.3, 0)), 0.8, 0.3), (0, 1, 0)), 'GOLD', 'hand_L')
    # bend: the bell turns up and out from the hand
    bend = a + Vector((0, -3.0, 0))
    dirb = Vector((s * 0.35, -1.0, 0.45)).normalized()
    res(16, 6)
    tag(cone(T('GOLD'), bend, bend + dirb * c['bell_len'], r * 1.1, c['bell_R']), 'GOLD', 'hand_L')
    tag(ell(T('GOLD'), bend, (r * 1.2, r * 1.2, r * 1.2)), 'GOLD', 'hand_L')
    res(14, 6)
    tag(_align(torus(T('GOLD'), bend + dirb * c['bell_len'], c['bell_R'], 0.3), dirb), 'GOLD', 'hand_L')
    res(16, 8)
    tag(_align(cyl(T('BLACK'), bend + dirb * (c['bell_len'] - 0.35), c['bell_R'] * 0.8, 0.3), dirb), 'BLACK', 'hand_L')

def _head():
    # ears, broad nose, horseshoe of dark hair at the back, handlebar moustache with curled tips
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN_TAN'), (s * 5.9, -0.1, 44.0), (1.0, 1.3, 1.7)), 'SKIN_TAN', 'head')
        # side hair above the ear, running back
        res(12, 8)
        tag(ell(T('BLACK'), (s * 5.3, 1.7, 45.6), (0.9, 2.6, 1.5)), 'BLACK', 'head')
    # horseshoe of short dark hair round the back, two rows of small tufts hugging the skull
    res(10, 8)
    for z, k in ((42.8, 1.0), (44.2, 0.9)):
        q = math.sqrt(max(1 - ((z - H0[2]) / R0[2]) ** 2, 0.0))
        for a in range(-95, 100, 19):
            t = math.radians(a)
            p = (R0[0] * q * math.sin(t) * 0.98, H0[1] + R0[1] * q * math.cos(t) * 0.98, z)
            tag(ell(T('BLACK'), p, (1.15 * k, 1.15 * k, 1.0 * k)), 'BLACK', 'head')
    res(16, 10)
    tag(ell(T('SKIN_TAN'), (0, on_surface(H0, R0, 0, 43.0, 0.8), 43.0), (1.5, 1.3, 1.6)), 'SKIN_TAN', 'head')
    for s in (-1, 1):
        tag(ell(T('SKIN_TAN'), (s * 0.9, on_surface(H0, R0, s * 0.9, 42.2, 0.6), 42.2), (0.8, 0.8, 0.7)), 'SKIN_TAN', 'head')
    # handlebar moustache: one smooth tapered tube per side from the middle out to a curled tip
    res(12, 6)
    for s in (-1, 1):
        pts = [(0.0, 41.7, 0.85), (1.2, 41.5, 0.9), (2.4, 41.1, 0.85), (3.6, 41.1, 0.75), (4.6, 41.5, 0.6),
               (5.2, 42.3, 0.48), (5.2, 43.1, 0.4), (4.7, 43.5, 0.34)]
        P = [(Vector((s * x, on_surface(H0, R0, s * x, z, 0.45), z)), r) for x, z, r in pts]
        for (pa, ra), (pb, rb) in zip(P, P[1:]):
            tag(cone(T('BLACK'), pa, pb, ra, rb), 'BLACK', 'head')
            tag(ell(T('BLACK'), pb, (rb, rb, rb)), 'BLACK', 'head')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN_TAN'), H0, R0), 'SKIN_TAN', 'head', group='head')

def _body():
    c = CONFIG
    _legs(c); _trunks(); _torso(c); _arms(c); _head()

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Grin: small dark eyes, thick brows, wide smile showing teeth under the moustache (cast2 eyes and brows).
    Laugh: eyes squeezed shut as arcs, mouth wide open. Startle: round eyes, brows up, small open mouth.
    Frown: brows down and in, mouth turned down."""
    brow = dict(grin=0.1, laugh=0.35, startle=1.0, frown=-0.5)[expr]
    knit = dict(grin=0.0, laugh=0.0, startle=0.0, frown=0.5)[expr]
    for s in (-1, 1):
        x = s * 2.3
        if expr == 'laugh':
            build.arc(F('#1E1714'), [(x + dx, on_surface(H0, R0, x + dx, 44.6 + 0.4 * (1 - (dx / 0.8) ** 2), 0.25),
                                      44.6 + 0.4 * (1 - (dx / 0.8) ** 2)) for dx in (-0.8, -0.4, 0.0, 0.4, 0.8)], (0.32, 0.25, 0.24))
        else:
            ez = 0.9 if expr == 'startle' else 0.6
            ell(F('#1E1714'), (x, on_surface(H0, R0, x, 44.8, 0.25), 44.8), (0.65, 0.4, ez))
            ell(F('#F4F4F2'), (x - s * 0.22, on_surface(H0, R0, x, 45.1, 0.42), 45.1), (0.22, 0.22, 0.22))
        pts = [(1.2, 46.6), (2.4, 47.0), (3.6, 46.6)]
        build.arc(F('#17151B'), [(s * xx, on_surface(H0, R0, s * xx, zz + brow - knit * (2.4 - xx) * 0.5, 0.25),
                                  zz + brow - knit * (2.4 - xx) * 0.5) for xx, zz in pts], (0.8, 0.45, 0.6))
    mz = 39.7
    if expr == 'startle':
        ell(F('#5A2A22'), (0, on_surface(H0, R0, 0, mz - 0.2, 0.2), mz - 0.2), (0.8, 0.4, 0.75))
    elif expr == 'frown':
        build.arc(F('#5A2A22'), [(xx, on_surface(H0, R0, xx, mz - 0.4 * (abs(xx) / 1.8) ** 2, 0.15), mz - 0.4 * (abs(xx) / 1.8) ** 2)
                                 for xx in (-1.8, -0.9, 0.0, 0.9, 1.8)], (0.5, 0.3, 0.32))
    else:
        h = 0.75 if expr == 'laugh' else 0.45
        ell(F('#5A2A22'), (0, on_surface(H0, R0, 0, mz - h * 0.6, 0.2), mz - h * 0.6), (2.0, 0.4, h))
        ell(F('#F4F4F2'), (0, on_surface(H0, R0, 0, mz + 0.05, 0.3), mz + 0.05), (1.6, 0.35, 0.22))

def bones(U): return humanoid_bones(CONFIG, U * CONFIG['size'])

def _turn_hand(name, local, target):
    """Turn a hand bone so the direction `local` (bind armature space, rigid on that hand) points along `target`."""
    from mathutils import Matrix
    K.upd(); pb = K.P(name)
    rot = (pb.matrix @ pb.bone.matrix_local.inverted()).to_3x3()
    q = (rot @ Vector(local)).normalized().rotation_difference(Vector(target).normalized())
    M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M

def idle(t, length):
    """The cast2 pose: right arm flexed (upper arm out level, forearm up, fist by the head) with a slow biceps pump;
    left arm holding the horn out to the clown, bulb up; chest out, weight even, a small proud nod."""
    c = CONFIG; p = 2 * math.pi * t / length
    K.move('hips', (0, 0, -0.06 * (1 - math.cos(p))))
    K.rotw('chest', (1, 0, 0), -4 + 0.8 * math.sin(p))
    K.aim('upper_arm_R', (-1.0, 0.05, 0.12)); K.aim('forearm_R', (0.12, -0.15, 1.0))
    K.rotw('forearm_R', (0, 1, 0), 6 * math.sin(p))
    K.aim('hand_R', (0.1, -0.2, 1.0))
    # fingers curled over into a fist (palm faces the body, +x on the right hand)
    K.aim('fingers_R', (0.8, -0.1, -0.6))
    K.aim('upper_arm_L', (0.35, -0.55, -0.75)); K.aim('forearm_L', (0.05, -1.0, 0.2 + 0.03 * math.sin(p)))
    K.aim('hand_L', (0.0, -1.0, 0.1))
    _turn_hand('hand_L', (0, 1, 0), c['horn_aim'])
    K.rotw('head', (1, 0, 0), -3 + 1.5 * math.sin(p + 0.5))
    K.rotw('head', (0, 0, 1), -8)

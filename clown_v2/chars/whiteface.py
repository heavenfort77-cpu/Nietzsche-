"""The whiteface partner: bind-pose body, four faces, bones, idle pose and walk style.
Same parts, colours and face as the approved whiteface (build.whiteface); changed only for the rig: both arms
in an A-pose with an elbow (approved: one hanging, one on the hip, which is now the idle clip)."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, arm_points, humanoid_bones
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (approved stockings at 3.0)
    leg_x=3.0,
    # arm angle from vertical in the bind pose, degrees (slim tunic, so less than the clown)
    arm_out=35.0,
    # arm angle forward, degrees
    arm_fwd=6.0,
    # upper arm length (approved arm was 10.6 in all)
    upper_len=5.6,
    # forearm length
    fore_len=5.0,
    # elbow bend in the bind pose, degrees
    elbow_bend=10.0,
    # shoulder joint (x, y, z) in approved units
    shoulder=(9.0, 0.0, 33.0),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(2.0, 0.0, 32.5),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(16, 22, 28, 35, 38, 60),
    # leg joints: hip, knee, ankle (z)
    leg_z=(19.5, 10.0, 2.4),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.4, -3.4, 0.8),
    # hand bone length
    hand_len=2.6,
    # finger bone length (gloved hand: one mitten)
    finger_len=1.2,
)
# approved head centre and radii
HC, HR = (0, 0, 44.6), (7.4, 6.9, 7.8)
# face bake: the head is white paint all over
HEAD_RAMPS = ['PAINT']
FACE_FLATS = ['#1E1714', '#F4F4F2', '#24212A', '#45201C']
PAINT_FLATS = ['#962E3A', '#24212A']
# glints: gold trim, hat ball, band and sequins (slippers are matte satin)
SPEC_RAMPS = ('GOLD',)
# smallest share of a face cell the paint layer must cover (lips and beauty mark only)
PAINT_MIN = 0.002
# checks: height range in metres; no off-stage head-down idle for the whiteface
CHECK = dict(height=(1.70, 1.90), idle_head_down=False)
# walk style: upright and stiff
WALK = dict(thigh=18.0, knee=30.0, arm=10.0, bob=0.3, arm_out=25, sway=0)
EXPR = ['neutral', 'stern', 'call', 'sigh']

def body():
    c = CONFIG
    for s in (-1, 1):
        S = side(s)
        res(16, 8)
        tag(ell(T('BLACK'), (s * 3.4, -1.6, 1.2), (1.9, 3.6, 1.3), rot=(0, 0, s * 25)), 'BLACK', f'foot_{S},shin_{S}')
        res(16, 8)
        tag(cyl(T('PAINT'), (s * c['leg_x'], 0, 8.0), 1.9, 12.0), 'PAINT', f'thigh_{S},shin_{S},foot_{S}', cuts=7)
        res(20, 10)
        tag(ell(T('CRIMSON'), (s * 3.6, 0, 16.6), (4.2, 4.0, 4.4)), 'CRIMSON', f'hips,thigh_{S}')
        tag(ell(T('CRIMSON'), (s * 8.6, 0, 34.4), (3.0, 3.0, 2.8)), 'CRIMSON', f'chest,clavicle_{S},upper_arm_{S}')
    res(24, 12)
    tag(ell(T('CRIMSON'), (0, 0, 20.4), (8.0, 5.6, 3.6)), 'CRIMSON', 'hips')
    tag(ell(T('CRIMSON'), (0, 0, 28.6), (8.0, 5.6, 9.0)), 'CRIMSON', 'hips,spine,chest')
    res(20, 6)
    tag(torus(T('GOLD'), (0, 0, 20.8), 7.7, 0.9, scale=(1, 0.72, 1)), 'GOLD', 'hips')
    res(8, 6)
    for z in (31.0, 26.0):
        tag(ell(T('GOLD'), (0, on_surface((0, 0, 28.6), (8.0, 5.6, 9.0), 0, z, 0.4), z), (1.3, 0.9, 1.3)), 'GOLD', 'spine,chest')
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        res(16, 8)
        tag(cone(T('CRIMSON'), sh, el, 1.9, 1.8), 'CRIMSON', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        tag(ell(T('CRIMSON'), el, (1.8, 1.8, 1.8)), 'CRIMSON', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('CRIMSON'), el, wr, 1.8, 1.6), 'CRIMSON', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        g = ell(T('PAINT'), wr + d2 * 1.6, (1.9, 1.8, 2.0))
        g.rotation_mode = 'QUATERNION'; g.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(g, 'PAINT', f'forearm_{S},hand_{S}')
    res(16, 10)
    tag(torus(T('PAINT'), (0, 0, 36.6), 5.6, 1.5, scale=(1, 0.85, 1)), 'PAINT', 'chest,neck')
    for i in range(16):
        a = 2 * math.pi * i / 16; rp = 'PAINT' if i % 2 else 'SILVER'
        tag(ell(T(rp), (6.6 * math.cos(a), 6.6 * 0.85 * math.sin(a), 36.8), (1.5, 1.5, 1.8)), rp, 'chest,neck')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('PAINT'), (s * 7.4, 0.2, 44.2), (1.1, 1.5, 1.9)), 'PAINT', 'head')
    res(24, 6)
    tag(torus(T('GOLD'), (0, 0, 50.6), 5.4, 0.7), 'GOLD', 'head')
    res(32, 10)
    tag(cone(T('SILVER'), (0, 0, 50.4), (0, 0, 59.2), 5.4, 0.3), 'SILVER', 'head')
    res(8, 6)
    tag(ell(T('GOLD'), (0, 0, 59.0), (1.0, 1.0, 1.0)), 'GOLD', 'head')
    for (x, z) in ((-1.6, 53.0), (1.9, 54.8), (-0.6, 56.6), (2.6, 52.0)):
        r = 5.4 * (59.2 - z) / 8.8
        tag(ell(F('#F0D27A'), (x, -math.sqrt(max(r * r - x * x, 0.1)) - 0.15, z), (0.45, 0.3, 0.45)), 'GOLD', 'head')
    res(32, 16)
    tag(ell(T('PAINT'), HC, HR), 'PAINT', 'head', group='head')

def face(expr):
    """Approved face for 'neutral': level eyes, high thin arched brows, small neat red mouth, beauty mark.
    The lips and the beauty mark are paint (their own layer); eyes, brows and the open mouth are not."""
    brow_dz = dict(neutral=0.0, stern=-1.0, call=0.7, sigh=-0.2)[expr]
    for s in (-1, 1):
        x = s * 2.9
        if expr == 'sigh':
            ell(F('#1E1714'), (x, on_surface(HC, HR, x, 44.8, 0.25), 44.8), (0.95, 0.4, 0.7))
            build.arc(F('#1E1714'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.3), zz) for xx, zz in ((2.0, 45.4), (2.9, 45.6), (3.8, 45.4))], (0.5, 0.35, 0.3))
        else:
            ez = 1.6 if expr == 'call' else (1.1 if expr == 'stern' else 1.4)
            ell(F('#1E1714'), (x, on_surface(HC, HR, x, 45.0, 0.25), 45.0), (0.95, 0.4, ez))
            ell(F('#F4F4F2'), (x - s * 0.35, on_surface(HC, HR, x, 45.6, 0.45), 45.6), (0.45, 0.3, 0.45))
        pts = ((1.1, 48.6), (1.9, 49.8), (3.0, 50.3), (4.1, 49.8), (4.8, 48.8))
        tilt = dict(neutral=0.0, stern=-0.5, call=0.0, sigh=0.45)[expr]
        build.arc(F('#24212A'), [(s * xx, on_surface(HC, HR, s * xx, zz + brow_dz + tilt * (3.0 - xx) * 0.5, 0.25), zz + brow_dz + tilt * (3.0 - xx) * 0.5)
                                 for xx, zz in pts], (0.42, 0.35, 0.42))
    if expr == 'call':
        ell(F('#962E3A'), (0, on_surface(HC, HR, 0, 40.4, 0.15), 40.4), (1.6, 0.4, 1.4))['paint'] = True
        ell(F('#45201C'), (0, on_surface(HC, HR, 0, 40.4, 0.3), 40.4), (1.0, 0.4, 0.95))
    else:
        w = dict(neutral=1.5, stern=1.2, sigh=1.3)[expr]
        ell(F('#962E3A'), (0, on_surface(HC, HR, 0, 40.6, 0.2), 40.6), (w, 0.4, 0.75 if expr != 'stern' else 0.55))['paint'] = True
    ell(F('#24212A'), (4.2, on_surface(HC, HR, 4.2, 42.2, 0.2), 42.2), (0.45, 0.3, 0.45))['paint'] = True

def bones(U): return humanoid_bones(CONFIG, U)

def idle(t, length):
    """Upright, left hand on the hip (the approved pose), right arm hanging straight, chin a touch up."""
    p = 2 * math.pi * t / length
    K.move('hips', (0, 0, -0.08 * (1 - math.cos(p))))
    K.rotw('chest', (1, 0, 0), 1.0 * math.sin(p))
    K.aim('upper_arm_L', (0.61, 0.14, -0.78)); K.aim('forearm_L', (-0.78, -0.30, -0.57)); K.aim('hand_L', (-0.78, -0.30, -0.57))
    K.aim('upper_arm_R', (-0.08, 0.0, -1.0)); K.aim('forearm_R', (-0.02, -0.05, -1.0))
    K.rotw('head', (1, 0, 0), -4 + 0.8 * math.sin(p + 0.5))

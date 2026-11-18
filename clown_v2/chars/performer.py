"""The Performer: the clown's own costume in Mirror colours (build.performer). Bind pose like the clown (straight
legs, A-pose arms); the approved wide stance with arms flung up is now the idle clip. The back of the head gets
the same curls the developer asked for on the clown (he is the clown's double), in M_DARK. The painted grin and
the dark rings round the eyes are the paint layer, so they flake on the final night."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, side, arm_points, humanoid_bones
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (as the clown: legs apart so they do not fuse)
    leg_x=6.0,
    # shoe centre x
    shoe_x=6.6,
    # arm angle from vertical in the bind pose, degrees
    arm_out=50.0,
    # arm angle forward, degrees
    arm_fwd=8.0,
    # upper arm length
    upper_len=6.4,
    # forearm length
    fore_len=6.0,
    # elbow bend in the bind pose, degrees
    elbow_bend=12.0,
    # shoulder joint (x, y, z) in approved units
    shoulder=(8.0, 0.6, 35.6),
    # clavicle start (x, y, z), mirrored for the right side
    clavicle=(2.0, 0.3, 35.1),
    # spine bone joints: hips start, spine, chest, neck, head, head top (z)
    spine_z=(17, 23, 30, 37, 40, 57),
    # leg joints: hip, knee, ankle (z)
    leg_z=(19, 10.5, 3.4),
    # toe tip offset from the ankle (x out, y forward, z)
    toe=(0.8, -6.5, 1.2),
    # hand bone length
    hand_len=3.2,
    # finger bone length (gloved hand: one mitten)
    finger_len=1.6,
    # heights of the back-of-head curl rows (as the clown)
    back_rows=(43.2, 45.4, 47.6, 50.0, 52.2),
    # curl angles round the back of the head, degrees (0 = straight back)
    back_angles=(-80, -60, -40, -20, 0, 20, 40, 60, 80),
)
# approved head centre and radii (the clown's)
HC, HR = (0, 0, 47.2), (8.0, 7.4, 8.0)
# face bake: full white face
HEAD_RAMPS = ['PAINT']
FACE_FLATS = ['#1E1714', '#F4F4F2', '#24212A']
PAINT_FLATS = ['#1E1714', '#45201C', '#C9604A', '#F4F4F2']
# glint: the red nose (the only warm colour)
SPEC_RAMPS = ('RED',)
# smallest share of a face cell the paint layer must cover
PAINT_MIN = 0.01
# checks: height range in metres
CHECK = dict(height=(1.70, 1.90), idle_head_down=False)
# walk style: big and bouncy, a showman's strut
WALK = dict(thigh=26.0, knee=48.0, arm=22.0, bob=0.8, arm_out=55, sway=4)
EXPR = ['grin', 'mock', 'rage', 'sad']

def body():
    c = CONFIG
    for s in (-1, 1):
        S = side(s)
        res(20, 10)
        tag(ell(T('M_DARK'), (s * c['shoe_x'], -2.2, 1.8), (3.4, 6.0, 2.0), rot=(0, 0, s * 18)), 'M_DARK', f'foot_{S},shin_{S}')
        res(24, 12)
        tag(cone(T('M_MID'), (s * c['leg_x'], 0, 21.0), (s * c['leg_x'], 0, 3.6), 5.2, 4.2), 'M_MID', f'hips,thigh_{S},shin_{S},foot_{S}', cuts=9)
    res(28, 14)
    tag(ell(T('M_MID'), (0, 0, 20.5), (11.8, 7.2, 4.0)), 'M_MID', 'hips')
    res(32, 16)
    o = cone(T('M_PALE'), (0, 0, 21.5), (0, 0, 37.6), 13.6, 7.4); o.scale = (1, 0.72, 1)
    tag(o, 'M_PALE', 'hips,spine,chest', cuts=8)
    res(10, 6)
    for z in (33.6, 29.0, 24.4):
        r = 7.4 + (37.6 - z) / 16.1 * 6.2
        tag(ell(T('M_MID'), (0, -r * 0.72 - 0.3, z), (1.5, 1.0, 1.5)), 'M_MID', 'spine,chest')
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(c, s)
        res(20, 10)
        tag(cone(T('M_PALE'), sh, el, 3.6, 3.9), 'M_PALE', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        tag(ell(T('M_PALE'), el, (3.9, 3.9, 3.9)), 'M_PALE', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('M_PALE'), el, wr, 3.9, 4.3), 'M_PALE', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        res(14, 8)
        g = ell(T('M_PALE'), wr + d2 * 1.9, (2.4, 2.0, 2.4))
        g.rotation_mode = 'QUATERNION'; g.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(g, 'M_PALE', f'forearm_{S},hand_{S}')
    res(16, 10)
    tag(torus(T('M_PALE'), (0, 0, 38.6), 8.0, 2.0, scale=(1, 0.85, 1)), 'M_PALE', 'chest,neck')
    for i in range(20):
        a = 2 * math.pi * i / 20; rp = 'M_PALE' if i % 2 else 'M_MID'
        tag(ell(T(rp), (9.6 * math.cos(a), 9.6 * 0.85 * math.sin(a), 38.6), (2.0, 2.0, 2.3)), rp, 'chest,neck')
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('PAINT'), (s * 8.0, 0.2, 46.7), (1.2, 1.6, 2.0)), 'PAINT', 'head')
        tag(ell(T('M_DARK'), (s * 7.4, 1.2, 49.8), (2.7, 4.6, 3.3)), 'M_DARK', 'head')
    back_hair()
    res(16, 10)
    tag(ell(T('RED'), (0, on_surface(HC, HR, 0, 45.0, 0.9), 45.0), (1.7, 1.6, 1.6)), 'RED', 'head')
    res(32, 12)
    tag(cyl(T('M_DARK'), (0, 0, 53.8), 9.4, 1.0, rot=(4, 0, 0)), 'M_DARK', 'head')
    tag(ell(T('M_DARK'), (0, 0.4, 56.2), (6.1, 5.6, 3.3)), 'M_DARK', 'head')
    res(32, 16)
    tag(ell(T('PAINT'), HC, HR), 'PAINT', 'head', group='head')

def back_hair():
    """Rows of curls over the back of the head in M_DARK (the clown's back hair, in Mirror colour)."""
    for r, z in enumerate(CONFIG['back_rows']):
        f = math.sqrt(max(0.0, 1 - ((z - HC[2]) / HR[2]) ** 2))
        for k, ang in enumerate(CONFIG['back_angles']):
            t = math.radians(ang); rp = 'M_DARK' if (k + r) % 2 else 'M_MID'
            pos = (HR[0] * f * 0.93 * math.sin(t), HR[1] * f * 0.93 * math.cos(t) + 0.6, z)
            tag(ell(T(rp), pos, (2.0, 1.6, 2.4)), rp, 'head')

GRIN = [(-4.6, 43.6), (-3.8, 42.4), (-2.6, 41.6), (-1.3, 41.2), (0, 41.1), (1.3, 41.2), (2.6, 41.6), (3.8, 42.4), (4.6, 43.6)]

def face(expr):
    """Approved face for 'grin': dark rings round wide eyes, small pupils, brows high, red grin to the cheeks.
    Rings, grin outline, red grin and teeth are paint; eye whites, pupils and brows are not."""
    look = dict(grin=(0, 0), mock=(0.35, 0.1), rage=(0, -0.1), sad=(0, -0.35))[expr]
    for s in (-1, 1):
        x = s * 3.1
        ell(F('#1E1714'), (x, on_surface(HC, HR, x, 47.4, 0.05), 47.4), (2.0, 0.5, 2.1))['paint'] = True
        ew = dict(grin=1.5, mock=1.2, rage=0.9, sad=1.3)[expr]
        ell(F('#F4F4F2'), (x, on_surface(HC, HR, x, 47.4, 0.3), 47.4), (1.4, 0.5, ew))
        px, pz = x + look[0] * 1.2, 47.4 + look[1] * 1.5
        pr = 0.5 if expr == 'rage' else 0.7
        ell(F('#1E1714'), (px, on_surface(HC, HR, px, pz, 0.6), pz), (pr, 0.4, pr * 1.07))
        pts = ((1.2, 50.0), (2.2, 51.1), (3.3, 51.4), (4.4, 51.0), (5.2, 50.0))
        if expr == 'rage':
            pts = tuple((xx, zz - 1.4 + (xx - 1.2) * 0.45) for xx, zz in pts)
        elif expr == 'sad':
            pts = tuple((xx, zz - 0.4 - (xx - 1.2) * 0.35) for xx, zz in pts)
        elif expr == 'mock':
            pts = tuple((xx, zz + (0.8 if s > 0 else -0.6)) for xx, zz in pts)
        build.arc(F('#24212A'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.25), zz) for xx, zz in pts], (0.55, 0.4, 0.5))
    build.arc(F('#45201C'), [(x, on_surface(HC, HR, x, z, 0.1), z) for x, z in GRIN], (1.35, 0.4, 1.3))['paint'] = True
    build.arc(F('#C9604A'), [(x, on_surface(HC, HR, x, z, 0.3), z) for x, z in GRIN], (1.0, 0.4, 0.95))['paint'] = True
    build.arc(F('#F4F4F2'), [(x, on_surface(HC, HR, x, z + 0.6, 0.5), z + 0.6) for x, z in GRIN[2:-2]], (0.75, 0.3, 0.5))['paint'] = True

def bones(U): return humanoid_bones(CONFIG, U)

def idle(t, length):
    """Ta-da: legs spread wide, arms flung up and out (the approved pose), a showman's bounce."""
    p = 2 * math.pi * t / length
    K.move('hips', (0, 0, -1.2 - 0.35 * (1 - math.cos(2 * p))))
    for s in (-1, 1):
        S = side(s)
        K.rotw(f'thigh_{S}', (0, 1, 0), -s * 22)
        K.rotw(f'foot_{S}', (0, 1, 0), s * 22)
        K.aim(f'upper_arm_{S}', (s * 0.68, -0.13, 0.72)); K.aim(f'forearm_{S}', (s * 0.62, -0.15, 0.77 + 0.05 * math.sin(p)))
    K.rotw('chest', (1, 0, 0), -3 + 1.5 * math.sin(p))
    K.rotw('head', (0, 0, 1), 4 * math.sin(p))

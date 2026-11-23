"""Shame (Mirror World construct, being seen; proposal): the art/cast2 shame() rebuilt for the pipeline with the clowns'
level of modelled detail (cast2 panel: keep; Chaplin: small motion only, a shake of the shoulders, no sobbing loop).
Small and hunched in a drooping overcoat too big for it: shoulders pulled up to its ears, toes turned in, its face
buried in two huge white gloves (the clown's own), a small bowler pressed down on its head (the panel's "his bowler").
The red of the blush shows past the fingers and on its ears (its only warm colour); white face paint drips from under
the gloves down the coat. Detail: worn shoes with soles and laces, trousers with baggy knees, a knee patch and turn-ups;
the coat with a turned-up collar and rolled edge, a dark placket with silver buttons (one hangs loose on a thread),
pocket flaps, a hem band with uneven folds, a back seam and vent; long sleeves with dark cuffs and elbow patches;
flared glove cuffs, palms, four fingers and a thumb each; dark hair at the nape; the bowler's crown, band, bow, brim and
rolled rim, a pinch in the crown. Mirror World cold colours (M_PALE, M_MID, M_DARK) with PAINT gloves and RED ears.
Not on the humanoid rig (its hands live at its face): its own sixteen bones and its own clips (idle, walk, reach,
cling, shaken, hit, out), matched to its rules in night1.html (N1.shame: walks at 0.9 m/s, reaches for 0.4 s, then
clings to his back; a dodge throws it off and stuns it for 1.0 s). Moving and turning stay in the game's code."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, capsule
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # whole figure scaled about the floor after building (cast2 at 1 is about 1.4 m to the bowler's top)
    size=1.0,
    # coat: top and hem height, top and hem radius (cast2 drooping cone)
    coat_z=(35.0, 12.0), coat_R=(6.6, 8.6),
    # silver buttons down the placket (z); the loose one hangs on its thread from loose_z
    button_z=(30.5, 25.5, 15.5), loose_z=21.0,
    # feet: x of each leg, foot centre y, how far the toes turn in (degrees, cast2 22)
    leg_x=3.0, foot_y=-2.6, toe_in=22.0,
    # leg joints: hip, knee, ankle height; the knee sits a little forward (baggy)
    leg_z=(15.5, 8.4, 2.8), knee_y=-0.5,
    # arm (its left; the right mirrors in x): shoulder, elbow, wrist
    arm=((7.0, 0.0, 34.6), (7.6, -6.4, 29.4), (3.4, -7.6, 33.4)),
    # glove palm over the face: centre, radii (x mirrors)
    palm=(3.0, -7.9, 37.0), palm_R=(2.4, 1.3, 3.4),
    # finger tips under the bowler's brim (z) and how far each finger sits out from the middle (x)
    finger_x=(1.0, 2.15, 3.3, 4.35), finger_tip_z=(40.9, 41.2, 40.9, 40.2),
    # bowler: centre of the brim, brim radius, crown radii above it
    hat=(0.0, -1.6, 41.4), hat_R=6.4, crown_R=(5.0, 4.6, 2.8),
    # idle: lean in, head bowed (degrees); the shiver: shoulder hitch (units), side shake (degrees), when in the loop,
    # how many hitches a second
    idle_lean=1.0, idle_nod=3.0, shiver_up=0.45, shiver_side=1.2, shiver=(0.4, 0.9), shiver_hz=3.0,
    # walk: thigh swing and swing-leg knee bend (degrees; a shuffle of small steps)
    walk_swing=12.0, walk_knee=22.0,
    # out: how far the knees fold (degrees)
    out_fold=55.0,
)
# head centre and radii as built (cast2 head, sunk between the shoulders)
H0, R0 = (0.0, -2.2, 37.6), (5.6, 5.0, 6.0)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: pale skin and its shade
HEAD_RAMPS = ['M_PALE', 'M_MID']
# lash and mouth dark, glint, blush, pale blush, brow
FACE_FLATS = ['#071315', '#F4F4F2', '#C9604A', '#E88A72', '#11272B']
# no face paint; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the coat buttons
SPEC_RAMPS = ('SILVER',)
# checks: height range in metres (small and hunched)
CHECK = dict(height=(1.25, 1.55))
# hide is the default (eyes squeezed shut behind the gloves); peek is its 0.4 s tell (the gloves come off, it looks at
# him); wince when a gag lands; fade when beaten
EXPR = ['hide', 'peek', 'wince', 'fade']

def _grow(before):
    """Scale every object made since `before` about the origin (floor) by CONFIG size: uniform, so rotations hold."""
    import bpy
    k = CONFIG['size']
    for o in set(bpy.data.objects) - before:
        o.location = o.location * k; o.scale = o.scale * k

def body():
    import bpy
    before = set(bpy.data.objects)
    _body()
    _grow(before)

def _align(o, d):
    """Turn an object made along z so its z axis runs along d."""
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(Vector(d))
    return o

def _chain(mat, ramp, pts, r1, r2, bones):
    """Limb through points, tapered, with ball joints; bones per segment."""
    n = len(pts) - 1
    for i, (p, q) in enumerate(zip(pts, pts[1:])):
        a = r1 + (r2 - r1) * i / n; b = r1 + (r2 - r1) * (i + 1) / n
        tag(cone(mat, p, q, a, b), ramp, bones[i], cuts=2)
        if i < n - 1: tag(ell(mat, q, (b + 0.05, b + 0.05, b + 0.05)), ramp, bones[i] + ',' + bones[i + 1])

def _coat_r(z):
    (zt, zh), (rt, rh) = CONFIG['coat_z'], CONFIG['coat_R']
    return rh + (rt - rh) * (z - zh) / (zt - zh)

def _coat_at(z, a=0.0, push=0.0):
    """Point on the coat surface at height z, angle a degrees from the front (+ toward its left), pushed out by push."""
    r = _coat_r(z) + push
    return Vector((r * math.sin(math.radians(a)), -r * math.cos(math.radians(a)), z))

def _zb(z):
    """Bones for a coat part at height z: the lower coat with base, the upper with spine."""
    return 'base' if z < 18 else ('base,spine' if z < 26 else 'spine')

def _foot(s, lx, ly, z):
    """Point in a shoe's own frame (lx across toward its outside, ly along it, - toward the toe), turned in."""
    c = CONFIG; a = math.radians(-s * c['toe_in'])
    x, y = s * lx, ly
    return Vector((s * c['leg_x'] + x * math.cos(a) - y * math.sin(a), c['foot_y'] + x * math.sin(a) + y * math.cos(a), z))

def _shoes(c):
    for s in (-1, 1):
        S = 'L' if s > 0 else 'R'; rz = -s * c['toe_in']; ctr = _foot(s, 0, 0, 0)
        # worn upper and its sole (the sole's underside is the floor)
        res(24, 10)
        tag(ell(T('M_DARK'), (ctr.x, ctr.y, 1.7), (2.2, 4.4, 1.5), rot=(0, 0, rz)), 'M_DARK', f'foot_{S}')
        res(24, 6)
        tag(ell(T('M_MID'), (ctr.x, ctr.y, 0.55), (2.4, 4.7, 0.55), rot=(0, 0, rz)), 'M_MID', f'foot_{S}')
        # laces: two crossings and a bow on the instep
        res(8, 4)
        for ly in (-1.9, -0.9):
            zs = 1.7 + 1.5 * math.sqrt(1 - (ly / 4.4) ** 2)
            for a in (-1, 1):
                capsule(T('M_PALE'), _foot(s, -0.8, ly - 0.3 * a, zs - 0.15), _foot(s, 0.8, ly + 0.3 * a, zs - 0.15), 0.17, f'foot_{S}', ramp='M_PALE')
        res(10, 6)
        zb = 1.7 + 1.5 * math.sqrt(1 - (0.1 / 4.4) ** 2)
        for a in (-1, 1):
            tag(ell(T('M_PALE'), _foot(s, a * 0.55, 0.1, zb), (0.55, 0.3, 0.3), rot=(0, 0, rz + a * 20)), 'M_PALE', f'foot_{S}')

def _legs(c):
    hz, kz, az = c['leg_z']
    for s in (-1, 1):
        S = 'L' if s > 0 else 'R'; x = s * c['leg_x']
        ankle, knee, hip = Vector((x, 0, az)), Vector((x, c['knee_y'], kz)), Vector((x, 0, hz))
        # trouser leg: shin, baggy knee, thigh (up inside the coat)
        res(16, 6)
        tag(cone(T('M_MID'), ankle + Vector((0, 0, 0.1)), knee, 2.0, 1.8), 'M_MID', f'shin_{S}', cuts=2)
        res(16, 8)
        tag(ell(T('M_MID'), knee + Vector((0, -0.25, 0)), (2.05, 2.15, 2.0)), 'M_MID', f'thigh_{S},shin_{S}')
        res(16, 6)
        tag(cone(T('M_MID'), knee, hip, 1.8, 2.1), 'M_MID', f'thigh_{S}', cuts=2)
        # turn-up at the ankle
        res(20, 6)
        tag(torus(T('M_DARK'), (x, 0, az + 0.7), 1.95, 0.5), 'M_DARK', f'shin_{S}')
    # a patch on its right knee
    res(12, 6)
    k = Vector((-c['leg_x'], c['knee_y'] - 2.3, kz + 0.2))
    tag(ell(T('M_DARK'), k, (1.1, 0.35, 1.0), rot=(0, 0, 8)), 'M_DARK', 'thigh_R,shin_R')

def _coat(c):
    (zt, zh), (rt, rh) = c['coat_z'], c['coat_R']
    # the drooping coat, cut along its length so it bends at the waist
    res(30, 8)
    tag(cone(T('M_MID'), (0, 0, zt), (0, 0, zh), rt, rh), 'M_MID', 'base,spine', cuts=7)
    # hem band
    res(30, 6)
    tag(torus(T('M_DARK'), (0, 0, zh + 0.5), _coat_r(zh + 0.5) - 0.1, 0.5), 'M_DARK', 'base')
    # uneven folds on the lower coat, standing on the hem band (hanging below it they read as pegs: first render)
    res(10, 6)
    for k in range(8):
        a = 10 + 45 * k + 11 * math.sin(k * 2.3); h = 1.8 + 0.9 * math.cos(k * 1.9); p = _coat_at(zh + 0.9 + h, a, 0.05)
        tag(ell(T('M_MID'), p, (0.6, 0.35, h), rot=(0, 0, a)), 'M_MID', 'base')
    # dark placket down the front in short links, so it bends with the coat
    res(8, 4)
    zs = [33.6, 30.0, 27.0, 24.0, 21.0, 18.0, 15.0, zh + 0.6]
    for a, b in zip(zs, zs[1:]):
        capsule(T('M_DARK'), _coat_at(a, 0, 0.05), _coat_at(b, 0, 0.05), 0.42, _zb((a + b) / 2), ramp='M_DARK')
    # silver buttons, and the loose one hanging on a pale thread
    res(10, 6)
    for z in c['button_z']:
        tag(ell(T('SILVER'), _coat_at(z, 0, 0.35), (0.6, 0.45, 0.6)), 'SILVER', _zb(z))
    lz = c['loose_z']; top = _coat_at(lz, 0, 0.3); bot = _coat_at(lz - 1.7, -8, 0.75)
    res(6, 4)
    capsule(T('M_PALE'), top, bot, 0.12, _zb(lz), ramp='M_PALE')
    res(10, 6)
    tag(ell(T('SILVER'), bot + Vector((0, -0.05, -0.3)), (0.6, 0.32, 0.6), rot=(70, 0, -15)), 'SILVER', _zb(lz))
    # pocket flaps on the hips
    res(12, 6)
    for s in (-1, 1):
        a = s * 55; tag(ell(T('M_DARK'), _coat_at(18.0, a, 0.15), (2.0, 0.35, 0.8), rot=(0, 0, a)), 'M_DARK', 'base,spine')
    # back seam and the vent up from the hem
    res(8, 4)
    # starts above the hem band (at the band its end was buried and touched nothing: contact probe, first build)
    zs = [zh + 1.4, 17.0, 22.0, 27.0, 32.0]
    for a, b in zip(zs, zs[1:]):
        capsule(T('M_DARK'), _coat_at(a, 180, 0.0), _coat_at(b, 180, 0.0), 0.3, _zb((a + b) / 2), ramp='M_DARK')
    # shoulders hunched up to its ears
    res(20, 12)
    for s in (-1, 1):
        tag(ell(T('M_MID'), (s * 6.6, 0.6, 35.2), (4.2, 3.8, 4.0)), 'M_MID', 'spine,upper_arm_' + ('L' if s > 0 else 'R'))

def _collar(c):
    # turned-up collar round the back of the head, with a rolled top edge (its front sinks into the chin)
    p0, p1 = Vector((0, 0.9, 33.4)), Vector((0, 1.4, 38.4)); d = (p1 - p0).normalized()
    res(26, 6)
    tag(cone(T('M_MID'), p0, p1, 5.5, 6.1), 'M_MID', 'spine,neck')
    res(26, 6)
    tag(_align(torus(T('M_DARK'), p1, 6.05, 0.45), d), 'M_DARK', 'spine,neck')

def _drips(c):
    # white face paint dripping from under the gloves, down the coat front between the forearms
    # two long trickles, each ending in a drop (as a run of separate drops they read as more buttons: first render)
    at = lambda x, z, push: _coat_at(z, math.degrees(math.asin(x / _coat_r(z))), push)
    for x0, x1, z0, z1 in ((-0.9, -1.1, 33.2, 29.2), (0.8, 1.0, 33.0, 30.6)):
        res(8, 4)
        capsule(T('PAINT'), at(x0, z0, 0.05), at(x1, z1, 0.05), 0.26, _zb(z1), ramp='PAINT')
        res(10, 6)
        tag(ell(T('PAINT'), at(x1, z1 - 0.3, 0.1), (0.45, 0.35, 0.6)), 'PAINT', _zb(z1))

def _arms(c):
    for s in (-1, 1):
        S = 'L' if s > 0 else 'R'
        sh, el, wr = (Vector((s * p[0], p[1], p[2])) for p in c['arm'])
        # sleeve to the elbow and on, too long: the cuff reaches the wrist
        res(14, 6)
        _chain(T('M_MID'), 'M_MID', [sh, el, wr], 1.95, 1.7, [f'upper_arm_{S}', f'forearm_{S}'])
        d = (wr - el).normalized(); cuff = wr - d * 1.0
        res(18, 6)
        tag(_align(torus(T('M_DARK'), cuff, 1.75, 0.45), d), 'M_DARK', f'forearm_{S}')
        # elbow patch on the outside of the elbow
        res(12, 6)
        tag(ell(T('M_DARK'), el + Vector((s * 1.75, 0.1, -0.2)), (0.4, 1.25, 1.3)), 'M_DARK', f'upper_arm_{S},forearm_{S}')
        _glove(c, s, S, el, wr)

def _glove(c, s, S, el, wr):
    """The clown's white glove: a cuff flaring open toward the elbow with a rolled edge, the palm over its face, four
    fingers up to the brim and a thumb along the jaw."""
    d = (wr - el).normalized()
    res(18, 6)
    g0, g1 = wr - d * 1.9, wr + d * 0.7
    tag(cone(T('PAINT'), g0, g1, 2.35, 1.55), 'PAINT', f'forearm_{S},hand_{S}')
    tag(_align(torus(T('PAINT'), g0, 2.3, 0.35), d), 'PAINT', f'forearm_{S}')
    px, py, pz = c['palm']; P = Vector((s * px, py, pz))
    res(18, 10)
    tag(ell(T('PAINT'), P, c['palm_R'], rot=(-6, s * 10, 0)), 'PAINT', f'hand_{S}')
    # wrist into the palm
    res(12, 6)
    capsule(T('PAINT'), g1, P - Vector((0, 0, 1.6)), 1.4, f'hand_{S}', ramp='PAINT')
    # fingers: from the top of the palm up the forehead, a knuckle on each, tips just under the brim
    res(10, 6)
    for x, tz in zip(c['finger_x'], c['finger_tip_z']):
        b = Vector((s * x, py + 0.15, pz + 2.2 - 0.3 * abs(x - 2.2)))
        y_head = on_surface(H0, R0, s * x, tz - 0.6, 0.0)
        tip = Vector((s * x * 0.94, min(y_head - 0.55, py + 0.5), tz))
        m = b + (tip - b) * 0.55 + Vector((0, -0.25, 0))
        capsule(T('PAINT'), b, m, 0.62, f'hand_{S}', ramp='PAINT')
        capsule(T('PAINT'), m, tip, 0.56, f'hand_{S}', ramp='PAINT')
    # thumb along the jaw, pointing down and in
    t0 = P + Vector((s * 1.9, 0.5, -1.9)); t1 = t0 + Vector((-s * 0.7, 0.1, -1.6)); t2 = t1 + Vector((-s * 0.9, 0.0, -0.9))
    capsule(T('PAINT'), t0, t1, 0.62, f'hand_{S}', ramp='PAINT')
    capsule(T('PAINT'), t1, t2, 0.56, f'hand_{S}', ramp='PAINT')

def _head(c):
    # red ears poking out above the hunched shoulders
    res(14, 8)
    for s in (-1, 1):
        tag(ell(T('RED'), (s * 5.7, -1.6, 38.2), (0.9, 1.5, 2.0), rot=(0, 0, -s * 15)), 'RED', 'head')
    # dark hair at the back of the head from under the brim down into the collar
    res(24, 12)
    tag(ell(T('M_DARK'), (0, 1.0, 38.0), (5.9, 4.6, 3.9)), 'M_DARK', 'head')
    # the bowler pressed down: brim, rolled rim, band with a small bow on its left, squat crown with a pinch on top
    hx, hy, hz = c['hat']; R = c['hat_R']; cr = c['crown_R']
    res(32, 6)
    tag(cyl(T('M_DARK'), (hx, hy, hz), R, 0.7, scale=(1, 0.95, 1)), 'M_DARK', 'head')
    res(32, 6)
    tag(torus(T('M_DARK'), (hx, hy, hz + 0.15), R - 0.1, 0.4, scale=(1, 0.95, 1)), 'M_DARK', 'head')
    res(28, 12)
    tag(ell(T('M_DARK'), (hx, hy, hz + 1.8), cr), 'M_DARK', 'head')
    res(28, 6)
    tag(torus(T('M_MID'), (hx, hy, hz + 0.75), cr[0] - 0.1, 0.5, scale=(1, 0.92, 1)), 'M_MID', 'head')
    res(10, 6)
    bx = cr[0] * math.cos(math.radians(25)); by = hy - cr[1] * 0.92 * math.sin(math.radians(25))
    for a in (-1, 1):
        tag(ell(T('M_MID'), (bx + 0.1, by + a * 0.55, hz + 0.75), (0.35, 0.6, 0.38), rot=(0, 0, 25 + a * 20)), 'M_MID', 'head')
    res(14, 6)
    tag(ell(T('M_MID'), (hx, hy, hz + 1.8 + cr[2] - 0.15), (2.4, 0.45, 0.3)), 'M_MID', 'head')
    # the head itself: its own object with the face texture
    res(32, 16)
    tag(ell(T('M_PALE'), H0, R0), 'M_PALE', 'head', group='head')

def _body():
    c = CONFIG
    _shoes(c); _legs(c); _coat(c); _collar(c); _drips(c); _arms(c); _head(c)

# ---------------------------------------------------------------- faces (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Hide (default, behind the gloves): eyes squeezed shut, brows climbing to the middle, a small wobbly mouth turned
    down; the blush across both cheeks and the nose. Peek (the tell, the gloves come off): eyes open, dark ovals looking
    up at him with a glint and a wet lower lid, brows up in the middle, a small open mouth. Wince: eyes clenched into
    hooks, brows knit down, a tight crooked mouth. Fade: eyes shut and drooping, the blush pale, no mouth."""
    x0, z0 = 0.0, 38.4
    S = lambda x, z, push: (x, on_surface(H0, R0, x, z, push), z)
    blush = '#E88A72' if expr == 'fade' else '#C9604A'
    for s in (-1, 1):
        ell(F(blush), S(s * 3.9, 36.0, 0.1), (1.9, 0.3, 1.2))
    ell(F(blush), S(0.0, 37.0, 0.1), (1.5, 0.3, 0.7))
    for s in (-1, 1):
        x = x0 + s * 2.1
        if expr == 'peek':
            ell(F('#071315'), S(x, z0, 0.25), (0.7, 0.4, 0.95))
            ell(F('#F4F4F2'), S(x - s * 0.2, z0 + 0.4, 0.45), (0.25, 0.25, 0.25))
            build.arc(F('#C9D5D7'), [S(x + s * dx, z0 - 1.05 + 0.15 * abs(dx), 0.3) for dx in (-0.6, 0.0, 0.6)], (0.32, 0.25, 0.14))
            for k in range(2):
                ell(F('#071315'), S(x + s * (0.75 + 0.15 * k), z0 + 0.85 - 0.35 * k, 0.3), (0.34, 0.2, 0.12))
        elif expr == 'wince':
            build.arc(F('#071315'), [S(x + s * dx, z0 + dz, 0.25) for dx, dz in ((-0.9, -0.4), (0.0, 0.1), (0.9, -0.3))], (0.42, 0.3, 0.3))
        else:
            droop = 0.5 if expr == 'fade' else 0.0
            build.arc(F('#071315'), [S(x + s * dx, z0 + dz, 0.25) for dx, dz in ((-0.9, -0.3), (0.0, 0.15), (0.9, -0.3 - droop))], (0.42, 0.3, 0.3))
        # brows: up in the middle (sad) except the wince, knit down
        tilt = dict(hide=0.5, peek=0.6, wince=-0.45, fade=0.3)[expr]
        build.arc(F('#11272B'), [S(x + s * dx, z0 + 1.8 + tilt * (0.9 - dx) * 0.6, 0.3) for dx in (-0.9, 0.0, 0.9)], (0.36, 0.3, 0.24))
    mz = 34.8
    if expr == 'hide':
        build.arc(F('#071315'), [S(dx, mz + dz, 0.2) for dx, dz in ((-1.0, -0.3), (-0.35, 0.05), (0.3, -0.05), (0.95, -0.35))], (0.3, 0.26, 0.22))
    elif expr == 'peek':
        ell(F('#071315'), S(0.0, mz, 0.2), (0.5, 0.3, 0.6))
    elif expr == 'wince':
        build.arc(F('#071315'), [S(dx, mz + dz, 0.2) for dx, dz in ((-1.1, 0.05), (-0.4, -0.2), (0.3, 0.1), (0.9, -0.1))], (0.3, 0.28, 0.24))

def bones(U):
    """Sixteen bones: base (the lower coat), spine (the upper coat and shoulders), neck, head; upper arm, forearm and hand
    on each side (the hands rest on its face); thigh, shin and foot on each side (the toes turned in)."""
    c = CONFIG; k = U * c['size']
    V = lambda p: Vector(p) * k
    hz, kz, az = c['leg_z']
    t = [('base', V((0, 0, 12.0)), V((0, 0, 24.0)), None), ('spine', V((0, 0, 24.0)), V((0, -0.6, 35.0)), 'base'),
         ('neck', V((0, -0.6, 35.0)), V((0, -1.4, 36.6)), 'spine'), ('head', V((0, -1.4, 36.6)), V(H0), 'neck')]
    for s in (-1, 1):
        S = 'L' if s > 0 else 'R'
        sh, el, wr = ((s * p[0], p[1], p[2]) for p in c['arm'])
        tip = (s * c['palm'][0] * 0.9, c['palm'][1] + 0.3, max(c['finger_tip_z']))
        x = s * c['leg_x']; toe = _foot(s, 0, -4.6, 0.9)
        t += [(f'upper_arm_{S}', V(sh), V(el), 'spine'), (f'forearm_{S}', V(el), V(wr), f'upper_arm_{S}'),
              (f'hand_{S}', V(wr), V(tip), f'forearm_{S}'),
              (f'thigh_{S}', V((x, 0, hz)), V((x, c['knee_y'], kz)), 'base'), (f'shin_{S}', V((x, c['knee_y'], kz)), V((x, 0, az)), f'thigh_{S}'),
              (f'foot_{S}', V((x, 0, az)), V(tuple(toe)), f'shin_{S}')]
    return t

# ---------------------------------------------------------------- clips (each starts from the idle's first pose)
def _ease(f): f = min(max(f, 0.0), 1.0); return f * f * (3 - 2 * f)

def _blend_aim(n, target, e):
    """Turn bone n from where it points now toward target (armature space) by e (0..1)."""
    if e <= 0: return
    K.upd(); pb = K.P(n); cur = (pb.tail - pb.head).normalized()
    K.aim(n, cur.lerp(Vector(target).normalized(), min(e, 1.0)).normalized())

def _pose(lean=0.0, side=0.0, twist=0.0, nod=0.0, roll=0.0, shrug=0.0, legs=None, arms=None, drop=(0.0, 0.0, 0.0)):
    """Turn the bones parent first. lean > 0 bends the upper coat forward, side > 0 to its left, twist > 0 turns it to
    its left; nod > 0 drops the head forward, roll tips it (the bowler askew); shrug lifts the shoulders (units);
    legs = {S: (thigh, shin, foot)} degrees about x (thigh < 0 swings the knee forward, shin > 0 bends the knee);
    arms = (e, {bone: direction}) turns those bones toward the directions by e; drop moves the whole body (units)."""
    c = CONFIG
    if any(drop): K.move('base', drop)
    K.upd()
    if legs:
        for S, (a, b, f) in legs.items():
            if a: K.rotw(f'thigh_{S}', (1, 0, 0), a)
            K.upd()
            if b: K.rotw(f'shin_{S}', (1, 0, 0), b)
            K.upd()
            if f: K.rotw(f'foot_{S}', (1, 0, 0), f)
    K.rotw('spine', (1, 0, 0), c['idle_lean'] + lean)
    if side: K.rotw('spine', (0, 1, 0), side)
    if twist: K.rotw('spine', (0, 0, 1), twist)
    K.upd()
    K.rotw('neck', (1, 0, 0), c['idle_nod'] + nod)
    if roll: K.rotw('head', (0, 1, 0), roll)
    if shrug:
        for S in ('L', 'R'): K.move(f'upper_arm_{S}', (0, 0, shrug))
    if arms:
        e, dirs = arms
        for n in ('upper_arm_L', 'forearm_L', 'hand_L', 'upper_arm_R', 'forearm_R', 'hand_R'):
            if n in dirs: _blend_aim(n, dirs[n], e)

def _mirror(dirs):
    """Directions given for its left arm, mirrored onto its right."""
    out = {}
    for n, (x, y, z) in dirs.items(): out[n + '_L'] = (x, y, z); out[n + '_R'] = (-x, y, z)
    return out

def idle(t, length):
    """Hunched, face in its gloves; a slow breath, and once in each loop a short shake of the shoulders (three small
    hitches, the panel's 'small motion only')."""
    c = CONFIG; p = 2 * math.pi * t / length; f = t / length; a, b = c['shiver']
    w = math.sin(math.pi * (f - a) / (b - a)) if a <= f <= b else 0.0
    hitch = w * (0.5 - 0.5 * math.cos(2 * math.pi * c['shiver_hz'] * (t - a * length)))
    _pose(lean=0.8 * math.sin(p), nod=1.5 * math.sin(p + 0.6), shrug=0.25 * (0.5 + 0.5 * math.sin(p)) + c['shiver_up'] * hitch,
          side=c['shiver_side'] * w * math.sin(2 * math.pi * c['shiver_hz'] * (t - a * length)))

def walk(t, length):
    """Shuffling toward him in small steps, knees close, the shoulders rocking; the hands never leave its face."""
    c = CONFIG; p = 2 * math.pi * t / length
    legs = {}
    for S, ph in (('L', 0.0), ('R', math.pi)):
        a = -c['walk_swing'] * math.sin(p + ph)
        k = c['walk_knee'] * max(0.0, -math.cos(p + ph))
        legs[S] = (a, k, -(a + k))
    _pose(legs=legs, twist=3.0 * math.sin(p), side=1.5 * math.sin(p), shrug=0.2 * abs(math.sin(p)), lean=2.0)

def reach(t, length):
    """The 0.4 s tell (N1.shame.tell): the gloves come off its face and reach for him, the head lifts to look."""
    e = _ease(t / length / 0.75)
    dirs = _mirror(dict(upper_arm=(0.35, -0.85, -0.3), forearm=(0.1, -0.97, 0.15), hand=(0.0, -0.95, 0.3)))
    _pose(lean=10.0 * e, nod=-16.0 * e, shrug=-0.3 * e, arms=(e, dirs))

def cling(t, length):
    """Clinging to his back: bent in against him, head pressed down with the bowler tipped, arms wrapped round him,
    knees giving; it squeezes once in each loop."""
    p = 2 * math.pi * t / length; sq = 0.5 - 0.5 * math.cos(p)
    dirs = _mirror(dict(upper_arm=(0.55, -0.8, -0.1), forearm=(-0.65, -0.75, 0.05), hand=(-0.9, -0.4, 0.05)))
    legs = {S: (-10.0, 16.0, -6.0) for S in ('L', 'R')}
    _pose(lean=22.0 + 3.0 * sq, nod=14.0 + 2.0 * sq, roll=8.0, shrug=0.3 * sq, legs=legs, arms=(1.0, dirs))

def shaken(t, length):
    """Thrown off by his dodge and stunned for 1.0 s (N1.shame.stun): flung back, arms out, knees buckling; then the
    gloves go back to its face and it is back in the idle at the end."""
    f = t / length
    a = _ease(f / 0.25) * (1 - _ease((f - 0.35) / 0.65))
    b = math.sin(math.pi * min(max((f - 0.15) / 0.6, 0.0), 1.0))
    # arms flung out to the sides, forearms thrown back (straight up read as a cheer on the first render; upper arms swung
    # back stretched the shoulder pads past the gate, p99.9 1.81; out to the sides with the -18 lean still 1.62-1.67, so the
    # lean is -10 and the arms go 0.8 of the way: 1.55)
    dirs = _mirror(dict(upper_arm=(0.85, 0.05, -0.15), forearm=(0.6, 0.5, 0.45), hand=(0.4, 0.55, 0.65)))
    legs = {S: (-12.0 * b, 24.0 * b, -12.0 * b) for S in ('L', 'R')}
    _pose(lean=-10.0 * a, nod=-14.0 * a, roll=-6.0 * b, legs=legs, arms=(0.8 * a, dirs))

def hit(t, length):
    """A gag lands: the head jolts back with the bowler knocked askew, the shoulders flinch up, the knees give; back to
    the idle in 0.6 s."""
    f = t / length; k = math.sin(math.pi * f) * (1 - 0.3 * f)
    legs = {S: (-8.0 * k, 16.0 * k, -8.0 * k) for S in ('L', 'R')}
    _pose(lean=-10.0 * k, nod=-12.0 * k, roll=10.0 * k, shrug=0.8 * k, legs=legs)

def out(t, length):
    """Beaten for the night: it sinks into a crouch under its coat, folded over, face still in its gloves, the bowler
    down; the feet stay where they stood."""
    c = CONFIG; e = _ease(t / length); a = c['out_fold'] * e
    hz, kz, az = c['leg_z']; lt, ls = hz - kz, kz - az; r = math.radians(a)
    drop = (0.0, (lt - ls) * math.sin(r), -(lt + ls) * (1 - math.cos(r)))
    legs = {S: (-a, 2 * a, -a) for S in ('L', 'R')}
    _pose(lean=28.0 * e, nod=20.0 * e, shrug=0.6 * e, legs=legs, drop=drop)

def _keys(length, n): return [length * i / n for i in range(n + 1)]
# clip name -> (key times in s, poser(i, t)); lengths also written in check_glb.py (clips_by_char)
CLIPS = dict(idle=(_keys(2.0, 40), lambda i, t: idle(t, 2.0)), walk=(_keys(0.8, 8), lambda i, t: walk(t, 0.8)),
             reach=(_keys(0.4, 4), lambda i, t: reach(t, 0.4)), cling=(_keys(1.0, 10), lambda i, t: cling(t, 1.0)),
             shaken=(_keys(1.0, 10), lambda i, t: shaken(t, 1.0)), hit=(_keys(0.6, 6), lambda i, t: hit(t, 0.6)),
             out=(_keys(1.0, 5), lambda i, t: out(t, 1.0)))
# pose sheets: clip and view yaw
SHEET = (('idle', -35), ('walk', -70), ('reach', -70), ('cling', -70), ('shaken', -35), ('hit', -35), ('out', -70))

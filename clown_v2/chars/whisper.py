"""The Whisper (Mirror World construct, being seen through; proposal): the art/cast2 whisper() rebuilt for the pipeline
with the clowns' level of modelled detail, and the cast2 panel's fix: it wears the child's flat cap (the one who sees,
grown long). Since the child became a girl (owner 23 Nov 22:40) it also has her two plaits, grown long down its back.
Tall and thin in a floor-length coat with no feet showing: turned-up collar and lapels, a dark placket with five silver
buttons, pocket flaps, a half belt at the back with two buttons, a back vent, folds where the hem pools on the floor,
sloped shoulders, long sleeves with dark cuffs and a silver cuff button. A long pale neck leaning to its right; one hand
cupped to its mouth (palm, four curled fingers, thumb), the other arm hanging long with five long jointed fingers.
Dark hair over the back of the head and a fringe under the cap's peak. Eyes shut, its tiny mouth turned to the side it
whispers to (the face texture). Mirror World cold colours (M_PALE, M_MID, M_DARK); the cap keeps the child's cap's
shape in Mirror colours. Not built on the humanoid rig (no legs): its own ten bones and its own clips (idle, copy,
strike, hit, out); gliding and following the clown stay in the game's code. Bind pose: head upright (the face is
baked on an upright head), the lean and the head tilt come from the idle."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, torus, on_surface, tag, res, T, F, capsule
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # whole figure scaled about the floor after building (cast2 at 1 is about 2.1 m to the cap button)
    size=1.0,
    # coat: top centre (leans to its right like cast2), hem centre, top radius, hem radius
    coat_top=(-1.6, 0.0, 47.0), coat_hem=(0.0, 0.0, 0.0), coat_R=(4.6, 9.0),
    # buttons down the front placket (z); the placket is in 4-unit links so a button stays on it when the coat bends
    button_z=(42.0, 35.0, 28.0, 21.0, 14.0),
    # neck chain: base, bend, top (leans to its right and forward)
    neck=((-1.6, 0.0, 47.0), (-4.0, -0.8, 54.0), (-5.0, -1.2, 57.0)),
    # cupped arm (its left): shoulder, elbow, wrist; hand tip at the mouth
    arm_L=((2.6, 0.0, 45.6), (6.0, -5.0, 51.6), (-0.6, -6.4, 57.6)), hand_L_tip=(-2.6, -6.8, 60.2),
    # hanging arm (its right): shoulder, elbow, wrist; finger tips
    arm_R=((-6.0, 0.0, 45.6), (-8.4, -0.6, 34.0), (-8.6, -1.0, 24.0)), hand_R_tip=(-8.8, -1.4, 16.5),
    # the child's cap, kept a little wider than the head as on her: centre, radii
    cap=(-6.2, -1.4, 67.0), cap_R=(5.6, 5.4, 2.0),
    # plaits: top (sunk into the hair) and end of each plait (x offset from the head centre at the top, from the coat axis at
    # the end), links (9 so neighbouring links overlap)
    plait_top=(2.4, 1.4, 59.5), plait_end=(2.2, 4.7, 41.0), plait_n=9,
    # idle: lean forward, head tilt to its right (cast2 -16), nod toward the hand, side sway, degrees
    idle_lean=4.0, idle_tilt=-16.0, idle_nod=5.0, idle_sway=1.5,
)
# head centre and radii as built (cast2 head, upright)
H0, R0 = (-6.2, -1.6, 62.0), (4.4, 4.2, 6.0)
# head centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: pale skin and its shade
HEAD_RAMPS = ['M_PALE', 'M_MID']
# lash and mouth dark, glint, iris, brow
FACE_FLATS = ['#071315', '#F4F4F2', '#44666E', '#11272B']
# no face paint; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the coat and cuff buttons
SPEC_RAMPS = ('SILVER',)
# checks: height range in metres (taller than the crew: it looms)
CHECK = dict(height=(1.95, 2.3))
# hush is the default (eyes shut, whispering); see when it copies his dodge (the tell); wince when a gag lands; fade when beaten
EXPR = ['hush', 'see', 'wince', 'fade']

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

def _coat_at(z, a=0.0, push=0.0):
    """Point on the coat surface at height z, angle a degrees from the front (+ toward its left), pushed out by push."""
    c = CONFIG; (tx, _, tz), (hx, _, hz) = c['coat_top'], c['coat_hem']; rt, rh = c['coat_R']
    f = (z - hz) / (tz - hz); x0 = hx + (tx - hx) * f; r = rh + (rt - rh) * f + push
    return Vector((x0 + r * math.sin(math.radians(a)), -r * math.cos(math.radians(a)), z))

def _zb(z):
    """Bones for a coat part at height z: the lower coat bends with base, the upper with spine."""
    return 'base' if z < 14 else ('base,spine' if z < 30 else 'spine')

def _coat(c):
    (tx, ty, tz), (hx, hy, hz) = c['coat_top'], c['coat_hem']; rt, rh = c['coat_R']
    # the coat to the floor, cut along its length so it bends at the waist
    res(30, 8)
    tag(cone(T('M_MID'), (tx, ty, tz), (hx, hy, hz + 0.5), rt, rh - 0.05), 'M_MID', 'base,spine', cuts=7)
    # hem band on the floor
    res(30, 6)
    tag(torus(T('M_DARK'), (hx, hy, 0.5), rh - 0.1, 0.5), 'M_DARK', 'base')
    # folds where the hem pools on the floor
    res(10, 6)
    for k in range(10):
        # uneven heights so they read as cloth, not a ring of even tabs (first render)
        a = 18 + 36 * k + 9 * math.sin(k * 2.1); h = 2.6 + 1.0 * math.cos(k * 1.7); p = _coat_at(h, a, 0.1)
        tag(ell(T('M_MID'), p, (0.7, 0.4, h), rot=(0, 0, a)), 'M_MID', 'base')
    # sloped shoulders: a yoke over the coat top
    res(24, 10)
    tag(ell(T('M_MID'), (tx, ty, tz - 0.8), (rt + 1.0, rt - 0.6, 2.0)), 'M_MID', 'spine')
    # front placket: a dark strip down the front edge, in short links so it bends with the coat
    res(8, 4)
    zs = [44.5, 40.0, 36.0, 32.0, 28.0, 24.0, 20.0, 16.0, 12.0, 8.0, 4.0, 1.2]
    for a, b in zip(zs, zs[1:]):
        capsule(T('M_DARK'), _coat_at(a, 0, 0.05), _coat_at(b, 0, 0.05), 0.42, _zb((a + b) / 2), ramp='M_DARK')
    # silver buttons on the placket
    res(10, 6)
    for z in c['button_z']:
        tag(ell(T('SILVER'), _coat_at(z, 0, 0.35), (0.55, 0.45, 0.55)), 'SILVER', _zb(z))
    # pocket flaps on the hips
    res(12, 6)
    for s in (-1, 1):
        a = s * 55; tag(ell(T('M_DARK'), _coat_at(22.0, a, 0.15), (2.0, 0.35, 0.8), rot=(0, 0, a)), 'M_DARK', 'base,spine')
    # half belt across the back with a silver button at each end
    res(8, 4)
    angs = [140, 160, 180, 200, 220]
    for a, b in zip(angs, angs[1:]):
        capsule(T('M_DARK'), _coat_at(31.0, a, 0.1), _coat_at(31.0, b, 0.1), 0.55, 'spine', ramp='M_DARK')
    res(10, 6)
    for a in (140, 220):
        tag(ell(T('SILVER'), _coat_at(31.0, a, 0.6), (0.5, 0.5, 0.5)), 'SILVER', 'spine')
    # back vent: a dark seam up from the hem
    res(8, 4)
    zs = [1.2, 6.0, 12.0]
    for a, b in zip(zs, zs[1:]):
        capsule(T('M_DARK'), _coat_at(a, 180, 0.0), _coat_at(b, 180, 0.0), 0.3, 'base', ramp='M_DARK')

def _collar(c):
    (nx, ny, nz), (bx, by, bz), _ = c['neck']
    # turned-up collar round the neck base, with a rolled top edge
    d = Vector((bx - nx, by - ny, bz - nz)).normalized()
    p0 = Vector((nx, ny, nz - 1.2)); p1 = p0 + d * 4.6
    res(22, 6)
    tag(cone(T('M_DARK'), p0, p1, 3.2, 2.7), 'M_DARK', 'spine,neck')
    tag(_align(torus(T('M_DARK'), p1, 2.75, 0.45), d), 'M_DARK', 'spine,neck')
    # lapels: two flat points under the collar on the chest
    res(12, 6)
    for s in (-1, 1):
        p = _coat_at(43.0, s * 22, 0.25)
        tag(ell(T('M_DARK'), p, (1.4, 0.35, 2.6), rot=(0, s * -18, s * 22)), 'M_DARK', 'spine')

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

def _arms(c):
    for S, (sh, el, wr) in (('L', c['arm_L']), ('R', c['arm_R'])):
        sh, el, wr = Vector(sh), Vector(el), Vector(wr)
        # shoulder cap, sleeve, elbow, forearm sleeve
        res(14, 8)
        tag(ell(T('M_MID'), sh, (1.9, 1.9, 1.9)), 'M_MID', f'spine,upper_arm_{S}')
        res(14, 6)
        _chain(T('M_MID'), 'M_MID', [sh, el, wr], 1.5, 1.2, [f'upper_arm_{S}', f'forearm_{S}'])
        # dark cuff with a silver button
        d = (wr - el).normalized(); cuff = wr - d * 0.9
        res(18, 6)
        tag(_align(torus(T('M_DARK'), cuff, 1.25, 0.42), d), 'M_DARK', f'forearm_{S}')
        side = d.cross(Vector((0, 0, 1)) if abs(d.z) < 0.9 else Vector((0, 1, 0))).normalized()
        res(8, 6)
        tag(ell(T('SILVER'), cuff + side * 1.55, (0.35, 0.35, 0.35)), 'SILVER', f'forearm_{S}')
    _hand_cupped(c); _hand_long(c)

def _hand_cupped(c):
    """Its left hand cupped beside the mouth: a curved palm, four curled fingers toward the face, a thumb under."""
    wr = Vector(c['arm_L'][2]); tip = Vector(c['hand_L_tip'])
    d = (tip - wr).normalized()
    res(12, 6)
    tag(ell(T('M_PALE'), wr, (0.95, 0.95, 0.95)), 'M_PALE', 'forearm_L,hand_L')
    res(16, 8)
    palm = wr + d * 1.6
    tag(ell(T('M_PALE'), palm, (1.5, 0.75, 1.9), rot=(10, 20, 0)), 'M_PALE', 'hand_L')
    res(8, 6)
    for k in range(4):
        b = palm + d * 1.4 + Vector((0.35 * (k - 1.5), 0, 0.45 * (k - 1.5)))
        m = b + d * 1.0 + Vector((-0.6, 0.3, 0)); e = m + Vector((-0.8, 0.6, -0.1))
        capsule(T('M_PALE'), b, m, 0.32, 'hand_L', ramp='M_PALE')
        capsule(T('M_PALE'), m, e, 0.28, 'hand_L', ramp='M_PALE')
    th = palm + Vector((0.4, -0.2, -1.4))
    capsule(T('M_PALE'), palm + Vector((0.4, 0, -0.6)), th, 0.33, 'hand_L', ramp='M_PALE')
    capsule(T('M_PALE'), th, th + Vector((-1.0, 0.2, -0.3)), 0.3, 'hand_L', ramp='M_PALE')

def _hand_long(c):
    """Its right hand hanging long: a narrow palm and five long fingers with a knuckle joint each."""
    wr = Vector(c['arm_R'][2]); tip = Vector(c['hand_R_tip'])
    d = (tip - wr).normalized()
    res(12, 6)
    tag(ell(T('M_PALE'), wr, (0.9, 0.9, 0.9)), 'M_PALE', 'forearm_R,hand_R')
    res(16, 8)
    palm = wr + d * 1.5
    tag(ell(T('M_PALE'), palm, (1.05, 0.6, 1.6)), 'M_PALE', 'hand_R')
    res(8, 6)
    for k in range(5):
        x = 0.42 * (k - 2); b = palm + d * 1.2 + Vector((x, -0.1 * abs(k - 2), 0))
        m = b + d * 2.4 + Vector((x * 0.25, -0.15, 0)); e = m + d * (2.3 - 0.35 * abs(k - 2)) + Vector((x * 0.2, -0.35, 0))
        # thumb: from inside the palm, pointing forward and down
        if k == 0: b = palm + Vector((0.2, -0.45, -0.4)); m = b + Vector((-0.2, -1.0, -1.2)); e = m + Vector((-0.1, -0.5, -1.6))
        capsule(T('M_PALE'), b, m, 0.27, 'hand_R', ramp='M_PALE')
        tag(ell(T('M_PALE'), m, (0.3, 0.3, 0.3)), 'M_PALE', 'hand_R')
        tag(cone(T('M_PALE'), m, e, 0.25, 0.12), 'M_PALE', 'hand_R')

def _head(c):
    pts = [Vector(p) for p in c['neck']]
    # long pale neck, into the head
    res(14, 6)
    _chain(T('M_PALE'), 'M_PALE', pts + [Vector((H0[0] + 0.2, H0[1] + 0.2, 58.5))], 1.5, 1.25, ['neck', 'neck', 'neck,head'])
    # dark hair over the back and sides of the head, a fringe under the cap's peak
    res(28, 14)
    tag(ell(T('M_DARK'), (H0[0], H0[1] + 1.0, 62.4), (4.6, 4.0, 5.4)), 'M_DARK', 'head')
    res(10, 6)
    for k, xx in enumerate((-2.6, -1.3, 0.0, 1.3, 2.6)):
        z = 65.6 - 0.12 * abs(xx)
        tag(ell(T('M_DARK'), (H0[0] + xx, on_surface(H0, R0, H0[0] + xx, z, 0.3), z), (0.8, 0.5, 0.9), rot=(0, -10 + 5 * k, 0)), 'M_DARK', 'head')
    # her two plaits, grown long down its back, each tied with a pale ribbon bow
    (tx, ty, tz), (ex, ey, ez), n = c['plait_top'], c['plait_end'], c['plait_n']
    ax = c['coat_top'][0] + (c['coat_hem'][0] - c['coat_top'][0]) * (c['coat_top'][2] - ez) / c['coat_top'][2]
    for s in (-1, 1):
        res(10, 8)
        for k in range(n):
            f = k / (n - 1)
            q = (H0[0] + s * tx + (ax + s * ex - H0[0] - s * tx) * f + 0.2 * (-1) ** k, ty + (ey - ty) * f, tz + (ez - tz) * f)
            # every link weighted by the same three bones, so neighbouring links bend together (split tag sets parted mid-plait in strike and out)
            tag(ell(T('M_DARK'), q, (0.85 - 0.12 * f, 0.8, 1.7), rot=(0, 20 * (-1) ** k, 0)), 'M_DARK', 'head,neck,spine')
        res(10, 6)
        for a in (1, -1):
            tag(ell(T('M_PALE'), (ax + s * ex + a * 0.7, ey + 0.4, ez - 1.0), (0.7, 0.3, 0.42), rot=(0, a * 25, 0)), 'M_PALE', 'spine')
        tag(ell(T('M_PALE'), (ax + s * ex, ey + 0.5, ez - 1.0), (0.32, 0.32, 0.32)), 'M_PALE', 'spine')
    # the child's flat cap: crown, seam, peak, button on top (her cap's shape, in Mirror colours)
    cx, cy, cz = c['cap']; R = c['cap_R']
    res(28, 10)
    tag(ell(T('M_DARK'), (cx, cy, cz), R), 'M_DARK', 'head')
    res(28, 6)
    tag(torus(T('M_MID'), (cx, cy, cz - 0.9), R[0] - 0.45, 0.45, scale=(1, 0.96, 1)), 'M_MID', 'head')
    res(20, 8)
    tag(ell(T('M_DARK'), (cx, cy - 4.95, cz - 0.85), (4.2, 2.4, 0.55), rot=(-8, 0, 0)), 'M_DARK', 'head')
    res(10, 6)
    tag(ell(T('M_MID'), (cx, cy - 0.55, cz + R[2] - 0.1), (0.65, 0.65, 0.4)), 'M_MID', 'head')
    # the head itself: its own object with the face texture
    res(32, 16)
    tag(ell(T('M_PALE'), H0, R0), 'M_PALE', 'head', group='head')

def _body():
    c = CONFIG
    _coat(c); _collar(c); _arms(c); _head(c)

# ---------------------------------------------------------------- faces (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Hush (cast2): eyes shut as two lash lines, thin high brows, a tiny mouth on its left, toward the cupped hand.
    See (the tell, when it copies his dodge): the eyes open, the cast's dark ovals with a glint and two lashes, on him;
    the mouth a small round o. Wince: eyes squeezed into two hooks, brows knit, the mouth a short crooked line.
    Fade: eyes shut and drooping at the outer ends, brows slanting up in the middle, no mouth."""
    x0, z0 = H0[0], 62.6
    S = lambda x, z, push: (x, on_surface(H0, R0, x, z, push), z)
    for s in (-1, 1):
        x = x0 + s * 1.8
        if expr == 'see':
            ell(F('#071315'), S(x, z0, 0.25), (0.75, 0.4, 1.0))
            ell(F('#F4F4F2'), S(x - s * 0.25, z0 + 0.45, 0.45), (0.28, 0.26, 0.28))
            for k in range(2):
                z = z0 + 0.85 - 0.4 * k
                ell(F('#071315'), S(x + s * (0.8 + 0.15 * k), z, 0.3), (0.36, 0.2, 0.13))
        elif expr == 'wince':
            build.arc(F('#071315'), [S(x + s * dx, z0 + dz, 0.25) for dx, dz in ((-0.9, 0.5), (0.0, 0.0), (0.9, 0.4))], (0.42, 0.3, 0.3))
        else:
            drop = 0.5 if expr == 'fade' else 0.0
            build.arc(F('#071315'), [S(x + s * dx, z0 + dz, 0.25) for dx, dz in ((-0.9, 0.5), (0.0, 0.0), (0.9, 0.5 - 1.1 * drop))], (0.42, 0.3, 0.3))
            for k in range(2):
                xx = x + s * (0.2 + 0.55 * k)
                ell(F('#071315'), S(xx, z0 - 0.35, 0.3), (0.12, 0.2, 0.32))
        # brows
        lift = dict(hush=0.0, see=0.3, wince=-0.4, fade=0.0)[expr]
        tilt = dict(hush=0.0, see=0.0, wince=0.35, fade=-0.45)[expr]
        build.arc(F('#11272B'), [S(x + s * dx, z0 + 1.9 + lift + tilt * (0.9 - dx) * 0.6, 0.3) for dx in (-0.9, 0.0, 0.9)], (0.36, 0.3, 0.24))
    mx, mz = x0 + 1.6, 58.6
    if expr == 'hush':
        ell(F('#071315'), S(mx, mz, 0.2), (0.6, 0.3, 0.55))
    elif expr == 'see':
        ell(F('#071315'), S(mx - 0.4, mz, 0.2), (0.55, 0.3, 0.7))
    elif expr == 'wince':
        build.arc(F('#071315'), [S(mx + dx, mz + dz, 0.2) for dx, dz in ((-1.3, 0.1), (-0.5, -0.2), (0.3, 0.15), (0.9, -0.1))], (0.3, 0.28, 0.24))

def bones(U):
    """Ten bones: base (the lower coat from the floor), spine (the upper coat), neck, head, and three on each arm."""
    c = CONFIG; k = U * c['size']
    V = lambda p: Vector(p) * k
    (n0, _, n2) = c['neck']; (sl, el, wl), (sr, er, wr) = c['arm_L'], c['arm_R']
    return [('base', V((0, 0, 0)), V((-0.6, 0, 22.0)), None), ('spine', V((-0.6, 0, 22.0)), V(n0), 'base'),
            ('neck', V(n0), V(n2), 'spine'), ('head', V(n2), V(H0), 'neck'),
            ('upper_arm_L', V(sl), V(el), 'spine'), ('forearm_L', V(el), V(wl), 'upper_arm_L'), ('hand_L', V(wl), V(c['hand_L_tip']), 'forearm_L'),
            ('upper_arm_R', V(sr), V(er), 'spine'), ('forearm_R', V(er), V(wr), 'upper_arm_R'), ('hand_R', V(wr), V(c['hand_R_tip']), 'forearm_R')]

# ---------------------------------------------------------------- clips (each starts from the idle's first pose)
def _pose(lean=0.0, sway=0.0, side=0.0, nod=0.0, tilt=None, armL=0.0, armL_out=0.0, armR=0.0, armR_out=0.0, handR=0.0):
    """Turn the bones parent first. lean > 0 bends the upper coat forward, side > 0 bends it to its left; nod > 0 drops
    the head forward; armL > 0 swings the cupped hand forward and down from the mouth, armL_out > 0 out to its left;
    armR > 0 swings the long arm forward, armR_out < 0 out to its right."""
    c = CONFIG
    K.rotw('base', (0, 1, 0), sway)
    K.upd()
    K.rotw('spine', (1, 0, 0), c['idle_lean'] + lean)
    if side: K.rotw('spine', (0, 1, 0), side)
    K.upd()
    K.rotw('neck', (1, 0, 0), nod)
    K.upd()
    K.rotw('head', (0, 1, 0), c['idle_tilt'] if tilt is None else tilt)
    if armL: K.rotw('upper_arm_L', (1, 0, 0), armL)
    if armL_out: K.rotw('upper_arm_L', (0, 1, 0), armL_out)
    if armR: K.rotw('upper_arm_R', (1, 0, 0), -armR)
    if armR_out: K.rotw('upper_arm_R', (0, 1, 0), -armR_out)
    K.upd()
    if handR: K.rotw('hand_R', (1, 0, 0), -handR)

def _ease(f): f = min(max(f, 0.0), 1.0); return f * f * (3 - 2 * f)

def idle(t, length):
    """Leaning in, head tipped to its right, nodding toward the cupped hand as it whispers; the coat sways, the long
    arm swings a little, its fingers flex."""
    c = CONFIG; p = 2 * math.pi * t / length
    _pose(lean=1.5 * math.sin(p), sway=c['idle_sway'] * math.sin(p), nod=c['idle_nod'] * (0.5 + 0.5 * math.sin(2 * p)),
          armR=3.0 * math.sin(p + 1.0), handR=4.0 * math.sin(p + 2.0))

def copy(t, length):
    """The 0.4 s tell when it copies his dodge: it throws itself into his pratfall, the coat buckling to its right and
    forward, the head snapping up to look, the cupped hand leaving the mouth, the long arm flung out."""
    e = _ease(t / length / 0.75)
    _pose(lean=14.0 * e, side=-22.0 * e, nod=-14.0 * e, tilt=-16.0 + 10.0 * e, armL=30.0 * e, armL_out=25.0 * e, armR_out=-35.0 * e)

def strike(t, length):
    """Where he landed: it rears and drops onto the spot, the long arm swinging forward and down, then settles back."""
    f = t / length; k = math.sin(math.pi * f) * (1 - 0.2 * f)
    _pose(lean=30.0 * k, nod=12.0 * k, armR=95.0 * k, handR=20.0 * k, armL=10.0 * k)

def hit(t, length):
    """A gag lands: knocked back, the head flung toward its left, the cupped hand torn forward from the mouth, the long arm
    swinging back; settles back to the idle in 0.6 s."""
    f = t / length; k = math.sin(math.pi * f) * (1 - 0.3 * f)
    _pose(lean=-14.0 * k, sway=-3.0 * k, nod=-10.0 * k, tilt=-16.0 + 18.0 * k, armL=25.0 * k, armR=-20.0 * k)

def out(t, length):
    """Beaten for the night: it folds forward over itself, the head hanging to the floor, the cupped hand dropping, the
    long arm hanging straight down (bowing swings a rigid arm back, so the arm turns forward by about the lean)."""
    e = _ease(t / length)
    _pose(lean=40.0 * e, sway=2.0 * e, nod=30.0 * e, tilt=-16.0 - 8.0 * e, armL=55.0 * e, armR=42.0 * e)

def _keys(length, n): return [length * i / n for i in range(n + 1)]
# clip name -> (key times in s, poser(i, t)); lengths also written in check_glb.py (clips_by_char)
CLIPS = dict(idle=(_keys(2.0, 8), lambda i, t: idle(t, 2.0)), copy=(_keys(0.4, 4), lambda i, t: copy(t, 0.4)),
             strike=(_keys(0.4, 4), lambda i, t: strike(t, 0.4)), hit=(_keys(0.6, 6), lambda i, t: hit(t, 0.6)),
             out=(_keys(1.0, 5), lambda i, t: out(t, 1.0)))
# pose sheets: clip and view yaw
SHEET = (('idle', -35), ('copy', -70), ('strike', -70), ('hit', -35), ('out', -70))

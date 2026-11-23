"""The Light (Mirror World construct, being watched; proposal): the art/cast2 light() rebuilt for the pipeline with the
clowns' level of modelled detail. A stage spotlight on a tripod: rubber feet, two-part telescoping legs with clamp
collars and silver knobs, a centre post with a spreader collar and three braces, a hub with a lock knob; a
telescoping column with a collar and knob; a ribbed gooseneck that bends like a neck; a yoke holding the lamp on two
silver pivot bosses; the lamp housing with cooling fins, a rear cap, a carry handle, a front rim with gel-frame clips;
two barn doors (panel: two, not four) on hinges, splayed like lids; the pale lens is its one eye (the face texture:
iris, pupil, glint); a cable from the hub trailing off along the floor. Mirror World cold colours (M_PALE, M_MID,
M_DARK). Not human-shaped: its own six bones and its own clips (idle, flare, hit, out); following the clown is turned
in the game's code. Bind pose: lamp level, lens facing -y like every face here; the idle tips it down like a head."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, cyl, torus, on_surface, tag, res, T, F, capsule
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # whole figure scaled about the feet after building (cast2 at 1 is about 2.2 m to the top barn door)
    size=1.0,
    # tripod: foot distance from the centre, hub height, where the legs' upper tube ends (fraction of the leg)
    foot_R=13.0, hub_z=28.0, leg_split=0.55,
    # column: top of the lower tube, top of the upper tube (z)
    column_z=(40.0, 48.0),
    # yoke base (end of the gooseneck) and the lamp's tilt pivot (x, y, z)
    yoke=(0.0, -1.5, 55.5), pivot=(0.0, -1.5, 62.0),
    # lamp housing: back and front centre y, back and front radius
    house_y=(3.5, -6.0), house_R=(5.0, 6.4),
    # barn doors: length, half width, how far they are splayed open from the lamp axis, degrees
    door_L=6.6, door_W=5.6, door_open=40.0,
    # idle: lamp tipped down like a head, degrees; gooseneck bend, degrees; how far it scans side to side, degrees
    idle_tilt=30.0, idle_neck=6.0, idle_scan=8.0,
)
# lens dome: the face (its own object with the face texture), centre and radii as built
H0, R0 = (0.0, -6.3, 62.0), (5.9, 1.7, 5.9)
# lens centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: the pale lens and its rim shade
HEAD_RAMPS = ['M_PALE', 'M_MID']
# iris, pupil, glint, dark iris (put out)
FACE_FLATS = ['#44666E', '#071315', '#F4F4F2', '#2E3A3D']
# no face paint; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the knobs and pivot bosses
SPEC_RAMPS = ('SILVER',)
# checks: height range in metres (taller than the crew: it looms)
CHECK = dict(height=(2.0, 2.4))
# watch is the default; flare is its tell before it chases; wince when a gag lands on the lamp; dark when put out
EXPR = ['watch', 'flare', 'wince', 'dark']

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

def _feet():
    c = CONFIG
    return [Vector((c['foot_R'] * math.sin(math.radians(a)), -c['foot_R'] * math.cos(math.radians(a)), 0.8)) for a in (0, 120, 240)]

def _tripod(c):
    hub = Vector((0, 0, c['hub_z']))
    for f in _feet():
        d = (f - hub).normalized(); mid = hub + (f - hub) * c['leg_split']
        # upper tube, clamp collar with a silver knob, thinner lower tube, rubber foot
        res(12, 6)
        tag(cone(T('M_DARK'), hub, mid, 1.1, 1.0), 'M_DARK', 'base')
        tag(cone(T('M_MID'), mid, f, 0.75, 0.65), 'M_MID', 'base')
        res(14, 6)
        tag(_align(torus(T('M_MID'), mid, 1.15, 0.45), d), 'M_MID', 'base')
        side = d.cross(Vector((0, 0, 1))).normalized()
        res(8, 6)
        capsule(T('SILVER'), mid + side * 1.0, mid + side * 2.2, 0.3, 'base', ramp='SILVER')
        tag(ell(T('SILVER'), mid + side * 2.4, (0.55, 0.55, 0.55)), 'SILVER', 'base')
        res(14, 8)
        tag(ell(T('BLACK'), f, (1.6, 1.6, 0.8)), 'BLACK', 'base')
        # spreader brace from the centre-post collar to the leg
        res(8, 6)
        a = Vector((d.x, d.y, 0)).normalized() * 1.0 + Vector((0, 0, 13.0))
        capsule(T('M_MID'), a, hub + (f - hub) * 0.45, 0.35, 'base', ramp='M_MID')
    # centre post below the hub with the spreader collar, hub with its lock knob
    res(12, 6)
    tag(cyl(T('M_DARK'), (0, 0, 20.0), 0.8, 16.0), 'M_DARK', 'base')
    res(14, 6)
    tag(torus(T('M_MID'), (0, 0, 13.0), 1.0, 0.5), 'M_MID', 'base')
    res(16, 10)
    tag(ell(T('M_MID'), hub, (2.4, 2.4, 2.0)), 'M_MID', 'base')
    res(8, 6)
    capsule(T('SILVER'), hub + Vector((2.0, 0, 0)), hub + Vector((3.4, 0, 0)), 0.35, 'base', ramp='SILVER')
    tag(ell(T('SILVER'), hub + Vector((3.6, 0, 0)), (0.6, 0.6, 0.6)), 'SILVER', 'base')
    # cable from the hub, down a leg's side and trailing off along the floor
    res(8, 6)
    pts = [(1.8, 1.5, 27.0), (3.0, 4.0, 14.0), (5.0, 8.0, 0.5), (12.0, 11.0, 0.5), (18.0, 8.0, 0.5)]
    for p, q in zip(pts, pts[1:]):
        capsule(T('M_DARK'), p, q, 0.5, 'base', ramp='M_DARK')

def _column(c):
    z0, z1 = c['hub_z'], c['column_z'][0]; z2 = c['column_z'][1]
    # lower tube, collar with a knob, upper tube
    res(14, 6)
    tag(cyl(T('M_DARK'), (0, 0, (z0 + z1) / 2), 1.5, z1 - z0), 'M_DARK', 'column', cuts=2)
    tag(torus(T('M_MID'), (0, 0, z1), 1.6, 0.45), 'M_MID', 'column')
    res(8, 6)
    capsule(T('SILVER'), (1.7, 0, z1), (3.0, 0, z1), 0.35, 'column', ramp='SILVER')
    tag(ell(T('SILVER'), (3.2, 0, z1), (0.6, 0.6, 0.6)), 'SILVER', 'column')
    res(12, 6)
    tag(cyl(T('M_MID'), (0, 0, (z1 + z2) / 2 + 0.25), 1.15, z2 - z1 + 0.5), 'M_MID', 'column')
    # ribbed gooseneck from the column top to the yoke base: a core and rings along a curve
    yx, yy, yz = c['yoke']
    P = lambda t: Vector((0, yy * t * t, z2 + (yz - z2) * t))
    res(10, 6)
    n = 9
    for k in range(n):
        tag(cone(T('M_DARK'), P(k / n), P((k + 1) / n), 0.85, 0.85), 'M_DARK', 'column,neck')
    res(14, 6)
    for k in range(1, n):
        t = k / n
        tag(_align(torus(T('M_MID'), P(t), 0.95, 0.4), P(t + 0.01) - P(t - 0.01)), 'M_MID', 'column,neck')

def _yoke(c):
    yx, yy, yz = c['yoke']; px, py, pz = c['pivot']; w = c['house_R'][1] + 1.0
    res(14, 8)
    tag(ell(T('M_MID'), (yx, yy, yz), (1.6, 1.6, 0.8)), 'M_MID', 'neck')
    res(10, 6)
    capsule(T('M_DARK'), (-w, yy, yz), (w, yy, yz), 0.75, 'neck', ramp='M_DARK')
    for s in (-1, 1):
        capsule(T('M_DARK'), (s * w, yy, yz), (s * w, py, pz), 0.75, 'neck', ramp='M_DARK')
        # pivot boss through the yoke arm into the housing, with an outer knob (both turn with the lamp)
        res(12, 6)
        capsule(T('SILVER'), (s * (w - 2.0), py, pz), (s * (w + 0.9), py, pz), 0.9, 'head', ramp='SILVER')
        res(10, 8)
        tag(ell(T('SILVER'), (s * (w + 1.3), py, pz), (0.6, 0.9, 0.9)), 'SILVER', 'head')

def _house_r(y):
    """Housing radius at y (straight cone from back to front)."""
    c = CONFIG; (yb, yf), (rb, rf) = c['house_y'], c['house_R']
    return rb + (rf - rb) * (yb - y) / (yb - yf)

def _lamp(c):
    px, py, pz = c['pivot']; (yb, yf), (rb, rf) = c['house_y'], c['house_R']
    # housing, rear cap, cooling fins on the back half
    res(28, 8)
    tag(cone(T('M_DARK'), (0, yb, pz), (0, yf, pz), rb, rf), 'M_DARK', 'head')
    res(24, 10)
    tag(ell(T('M_DARK'), (0, yb, pz), (rb, 1.8, rb)), 'M_DARK', 'head')
    res(28, 6)
    for y in (2.7, 1.5):
        tag(_align(torus(T('M_MID'), (0, y, pz), _house_r(y) + 0.15, 0.4), (0, 1, 0)), 'M_MID', 'head')
    # carry handle on top: two posts and a bar
    res(8, 6)
    top = []
    for y in (2.2, -0.8):
        z0 = pz + _house_r(y) - 0.3; top.append((0, y, pz + 7.4))
        capsule(T('M_MID'), (0, y, z0), (0, y, pz + 7.4), 0.42, 'head', ramp='M_MID')
    capsule(T('M_MID'), top[0], top[1], 0.42, 'head', ramp='M_MID')
    # front rim and two gel-frame clips
    res(30, 6)
    tag(_align(torus(T('M_MID'), (0, yf, pz), rf, 0.55), (0, 1, 0)), 'M_MID', 'head')
    res(10, 6)
    for s in (-1, 1):
        tag(ell(T('M_MID'), (s * (rf + 0.2), yf + 0.4, pz), (0.5, 0.9, 1.4)), 'M_MID', 'head')
    # barn doors: a hinge on the rim top and bottom, each door splayed open like a lid
    a = math.radians(c['door_open']); L = c['door_L']
    for s, bone in ((1, 'door_T'), (-1, 'door_B')):
        hz = pz + s * (rf + 0.2)
        res(10, 6)
        capsule(T('M_MID'), (-c['door_W'] + 0.6, yf - 0.4, hz), (c['door_W'] - 0.6, yf - 0.4, hz), 0.45, 'head', ramp='M_MID')
        d = Vector((0, -math.cos(a), s * math.sin(a)))
        res(18, 8)
        tag(ell(T('M_DARK'), Vector((0, yf - 0.4, hz)) + d * (L / 2), (c['door_W'], L / 2 + 0.3, 0.35), rot=(-s * c['door_open'], 0, 0)), 'M_DARK', bone)
    # the lens itself: its own object with the face texture
    res(32, 16)
    tag(ell(T('M_PALE'), H0, R0), 'M_PALE', 'head', group='head')

def _body():
    c = CONFIG
    _tripod(c); _column(c); _yoke(c); _lamp(c)

# ---------------------------------------------------------------- lens states (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Watch: grey-green iris, dark pupil, a glint (the cast2 lens eye). Flare: iris wide, pupil pinned small, a big
    glint and a ring of glare spokes. Wince: iris squeezed, pupil a slit, a crack across the lens. Dark: a dull iris,
    a wide pupil, no glint."""
    z = H0[2]
    S = lambda x, zz, push: on_surface(H0, R0, x, zz, push)
    iris = dict(watch=(3.2, 3.2), flare=(3.9, 3.9), wince=(3.4, 1.7), dark=(3.2, 3.2))[expr]
    pupil = dict(watch=(1.6, 1.6), flare=(0.7, 0.7), wince=(1.9, 0.45), dark=(2.2, 2.2))[expr]
    ell(F('#2E3A3D' if expr == 'dark' else '#44666E'), (0, S(0, z, 0.2), z), (iris[0], 0.4, iris[1]))
    ell(F('#071315'), (0, S(0, z, 0.4), z), (pupil[0], 0.35, pupil[1]))
    if expr != 'dark':
        g = 1.3 if expr == 'flare' else 0.75
        ell(F('#F4F4F2'), (-1.7, S(-1.7, z + 1.8, 0.55), z + 1.8), (g, 0.3, g))
    if expr == 'flare':
        for k in range(8):
            t = math.radians(22.5 + 45 * k); x, zz = 4.7 * math.cos(t), z + 4.7 * math.sin(t)
            ell(F('#F4F4F2'), (x, S(x, zz, 0.2), zz), (0.45, 0.3, 0.45))
    if expr == 'wince':
        build.arc(F('#071315'), [(x, S(x, zz, 0.3), zz) for x, zz in ((1.6, z + 3.4), (2.6, z + 2.2), (3.0, z + 0.6), (4.2, z - 1.2), (4.6, z - 2.8))],
                  (0.35, 0.3, 0.3))

def bones(U):
    """Six bones: base (tripod), column, neck (gooseneck), head (lamp, from the tilt pivot to the lens), door_T, door_B."""
    c = CONFIG; k = U * c['size']
    V = lambda *a: Vector(a) * k
    px, py, pz = c['pivot']; yf, rf = c['house_y'][1], c['house_R'][1]; a = math.radians(c['door_open'])
    t = [('base', V(0, 0, 0), V(0, 0, c['hub_z']), None), ('column', V(0, 0, c['hub_z']), V(0, 0, c['column_z'][1]), 'base'),
         ('neck', V(0, 0, c['column_z'][1]), V(*c['yoke']), 'column'), ('head', V(px, py, pz), V(*H0), 'neck')]
    for s, n in ((1, 'door_T'), (-1, 'door_B')):
        h = Vector((0, yf - 0.4, pz + s * (rf + 0.2)))
        t.append((n, h * k, (h + Vector((0, -math.cos(a), s * math.sin(a))) * c['door_L']) * k, 'head'))
    return t

# ---------------------------------------------------------------- clips (each starts from the idle's first pose)
def _pose(scan=0.0, neck=None, tilt=None, door_t=0.0, door_b=0.0, roll=0.0):
    """Turn the bones parent first. neck and tilt default to the idle's; door_t > 0 and door_b > 0 close the doors."""
    c = CONFIG
    K.rotw('column', (0, 0, 1), scan)
    K.rotw('neck', (1, 0, 0), c['idle_neck'] if neck is None else neck)
    K.upd()
    K.rotw('head', (1, 0, 0), c['idle_tilt'] if tilt is None else tilt)
    if roll: K.rotw('head', (0, 1, 0), roll)
    K.upd()
    K.rotw('door_T', (1, 0, 0), door_t)
    K.rotw('door_B', (1, 0, 0), -door_b)

def _ease(f): f = min(max(f, 0.0), 1.0); return f * f * (3 - 2 * f)

def idle(t, length):
    """Scanning slowly side to side, lamp tipped down like a head, the gooseneck breathing, the doors trembling."""
    c = CONFIG; p = 2 * math.pi * t / length
    _pose(scan=c['idle_scan'] * math.sin(p), neck=c['idle_neck'] + 2.0 * math.sin(p), tilt=c['idle_tilt'] + 2.0 * math.sin(p + 0.8),
          door_t=2.0 * math.sin(2 * p), door_b=2.0 * math.sin(2 * p + 1.0))

def flare(t, length):
    """The 0.4 s tell before it chases: the lamp rears up, the gooseneck straightens, both doors swing wide open."""
    c = CONFIG; e = _ease(t / length / 0.75)
    _pose(neck=c['idle_neck'] - 10.0 * e, tilt=c['idle_tilt'] - 22.0 * e, door_t=-25.0 * e, door_b=-25.0 * e)

def hit(t, length):
    """A gag lands on the lamp: knocked back and twisted, doors flapping, settling back to the idle in 0.6 s."""
    c = CONFIG; f = t / length; k = math.sin(math.pi * f) * (1 - 0.3 * f); flap = 18.0 * math.sin(2 * math.pi * f) * (1 - f)
    _pose(scan=-10.0 * k, neck=c['idle_neck'] - 8.0 * k, tilt=c['idle_tilt'] - 25.0 * k, roll=12.0 * k, door_t=-flap, door_b=flap)

def out(t, length):
    """Put out for the night: the gooseneck droops, the lamp hangs toward the floor, the doors fall half shut."""
    c = CONFIG; e = _ease(t / length)
    _pose(neck=c['idle_neck'] + 14.0 * e, tilt=c['idle_tilt'] + 28.0 * e, door_t=30.0 * e, door_b=20.0 * e)

def _keys(length, n): return [length * i / n for i in range(n + 1)]
# clip name -> (key times in s, poser(i, t)); lengths also written in check_glb.py (clips_by_char)
CLIPS = dict(idle=(_keys(2.0, 8), lambda i, t: idle(t, 2.0)), flare=(_keys(0.4, 4), lambda i, t: flare(t, 0.4)),
             hit=(_keys(0.6, 6), lambda i, t: hit(t, 0.6)), out=(_keys(1.0, 5), lambda i, t: out(t, 1.0)))
# pose sheets: clip and view yaw
SHEET = (('idle', -35), ('flare', -70), ('hit', -35), ('out', -70))

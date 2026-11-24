"""The Stare (Mirror World construct, being judged; proposal): the art/cast2 stare() rebuilt for the pipeline with the
clowns' level of modelled detail (cast2 panel: keep). A mound of audience heads fused at the shoulders, backs turned
to him, with one great eye open in the middle of them (the panel's "the abyss looking back"). Eleven heads, each one a
different person from behind: a short crop, a bun, a bald crown with a horseshoe of hair, a cloche hat with a band, a
side parting, curls, a ponytail, a beret with its stalk, slicked hair with comb ridges, a crop with a cowlick, a
headscarf knotted at the nape; ears, neck stubs and collars sinking into the dark mound of shoulders. Their fronts
(the side away from him) are smooth: no faces. The eye sits in a dark socket rim, with a heavy upper lid carrying five
lashes and a lower lid; the eyeball is the face texture (iris, pupil, glint). Mirror World cold colours (M_PALE,
M_MID, M_DARK; the eyeball PAINT_DIM as cast2). Not human-shaped: its own seven bones (base, crowd, the left and right
heads, the eye, the two lids) and its own clips (idle, gaze, judge, hit, out); turning toward the clown stays in the
game's code. Bind pose: eye looking straight ahead (-y like every face here), upper lid heavy as cast2."""
import math
from mathutils import Vector
from chars.common import build, ell, cone, torus, on_surface, tag, res, T, F, capsule
import posekit as K

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # whole figure scaled about the floor after building (cast2 at 1 is about 0.8 m to the top head, 1.2 m wide)
    size=1.0,
    # mound of shoulders: centre and radii (sits on the floor: centre z = height radius)
    mound=(0.0, 0.0, 7.0), mound_R=(20.0, 12.0, 7.0),
    # heads (x, y, z, radius) from cast2; each gets its own hair in HAIRS (same order)
    heads=((-15, 2, 11, 4.4), (-9, 5, 15, 4.8), (-3, 6, 17, 5.0), (4, 6, 17, 5.0), (10, 5, 15, 4.8), (16, 2, 11, 4.4),
           (-12, -4, 12, 4.0), (12, -4, 12, 4.0), (-6, 1, 19, 4.4), (7, 1, 19, 4.4), (0, 3, 22, 4.2)),
    # heads further out than this from the middle (x) move with the side bones; nearer, with the crowd and the side
    side_x=(4.0, 11.0),
    # upper lid: rest angle down over the eye (cast2 heavy lid), degrees; lower lid rest angle up
    lid_T=0.0, lid_B=0.0,
    # idle: how far the eye drifts side to side, degrees; the blink, as a fraction of the idle (start, end)
    idle_look=6.0, blink=(0.68, 0.8),
)
HAIRS = ('crop', 'bun', 'bald', 'cloche', 'parting', 'curls', 'ponytail', 'beret', 'slick', 'cowlick', 'scarf')
# eyeball: the face (its own object with the face texture), centre and radii as built (cast2)
H0, R0 = (0.0, -8.4, 14.0), (7.6, 5.4, 6.8)
# eyeball centre after the size factor (the pipeline's head UV uses it)
HC = tuple(v * CONFIG['size'] for v in H0)
# face bake: the eyeball white and its shade
HEAD_RAMPS = ['PAINT_DIM', 'M_PALE']
# iris, pupil, glint, dull iris, vein
FACE_FLATS = ['#44666E', '#071315', '#F4F4F2', '#2E3A3D', '#6E8D94']
# no face paint; one colour so the paint pass has a palette
PAINT_FLATS = ['#F4F4F2']
# None = no paint layer: the gate checks every paint cell is empty
PAINT_MIN = None
# glints: the cloche band buckle and the beret's stalk ring (small, so most of it does not shine)
SPEC_RAMPS = ('SILVER',)
# checks: height range in metres (a low mound, wider than tall)
CHECK = dict(height=(0.7, 1.0))
# watch is the default; wide is its 0.4 s tell (the gaze opens); judge when it passes its verdict; dull when beaten
EXPR = ['watch', 'wide', 'judge', 'dull']

def _grow(before):
    """Scale every object made since `before` about the origin (floor) by CONFIG size: uniform, so rotations hold."""
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

def _bones_for(x):
    """Bones for a head at x: the outer heads move with their side bone, the middle ones with the crowd."""
    a, b = CONFIG['side_x']; s = 'L' if x > 0 else 'R'
    return f'heads_{s}' if abs(x) >= b else (f'crowd,heads_{s}' if abs(x) >= a else 'crowd')

def _mound(c):
    # the fused shoulders: one dark mound, a ridge of shoulder lumps under the heads
    res(36, 16)
    tag(ell(T('M_DARK'), c['mound'], c['mound_R']), 'M_DARK', 'base,crowd')
    res(16, 8)
    for x, y, z, r in c['heads']:
        tag(ell(T('M_DARK'), (x, y, z - r - 1.6), (r * 1.6, r * 1.1, 2.4)), 'M_DARK', _bones_for(x) if z > 12 else 'base,' + _bones_for(x))

def _head(c, x, y, z, r, hair):
    """One audience head from behind (+y is its face, away from him; its back faces -y): skull, ears, neck, collar,
    its own hair or hat on the back and top."""
    B = _bones_for(x)
    # pale skin, so each head's hair or hat reads against its neck and ears (in M_MID the heads read as dark lumps)
    res(20, 10)
    tag(ell(T('M_PALE'), (x, y, z), (r, r * 0.95, r * 1.1)), 'M_PALE', B)
    res(10, 6)
    for s in (-1, 1):
        tag(ell(T('M_PALE'), (x + s * r * 0.98, y + 0.2, z - 0.3), (0.6, 0.9, 1.2)), 'M_PALE', B)
    # neck stub and a collar where it sinks into the mound
    res(12, 6)
    tag(cone(T('M_PALE'), (x, y, z - r * 0.8), (x, y, z - r - 2.2), r * 0.45, r * 0.5), 'M_PALE', B)
    res(16, 6)
    tag(torus(T('M_MID'), (x, y, z - r - 1.4), r * 0.55, 0.45), 'M_MID', B)
    H = T('M_DARK')
    back = lambda dz=0.0, push=0.0, dx=0.0: (x + dx, y - math.sqrt(max(0.0, 1 - (dx / r) ** 2 - (dz / (r * 1.1)) ** 2)) * r * 0.95 - push, z + dz)
    res(20, 10)
    if hair in ('crop', 'parting', 'slick', 'cowlick', 'ponytail', 'bun', 'scarf'):
        # a hair cap over the back and top, leaving the face side bare
        tag(ell(H, (x, y - 0.6, z + 0.5), (r * 1.04, r * 0.92, r * 1.02)), 'M_DARK', B)
    if hair == 'bun':
        res(14, 8)
        tag(ell(H, back(1.2, 0.9), (r * 0.42, r * 0.38, r * 0.42)), 'M_DARK', B)
        tag(torus(T('M_PALE'), back(1.2, 0.3), r * 0.38, 0.3), 'M_PALE', B)
    elif hair == 'bald':
        # a horseshoe of hair round the back, low
        res(16, 8)
        tag(ell(H, (x, y - 0.7, z - r * 0.25), (r * 1.03, r * 0.85, r * 0.5)), 'M_DARK', B)
    elif hair == 'cloche':
        # bell hat pulled low, a band with a small silver buckle at the back
        res(22, 10)
        tag(ell(H, (x, y, z + 0.9), (r * 1.1, r * 1.05, r * 1.0)), 'M_DARK', B)
        res(22, 6)
        tag(torus(T('M_PALE'), (x, y, z - 0.2), r * 1.04, 0.45), 'M_PALE', B)
        res(8, 6)
        tag(ell(T('SILVER'), (x + 1.2, y - r * 1.04 - 0.35, z - 0.2), (0.45, 0.25, 0.4)), 'SILVER', B)
    elif hair == 'parting':
        # a pale groove where the hair parts on one side
        res(8, 4)
        for a, b in zip((-1.0, 0.6, 2.0), (0.6, 2.0, 3.2)):
            capsule(T('M_MID'), (x + 1.6, y - a * 0.6, z + r * 1.0 + 0.4), (x + 1.6, y - b * 0.6, z + r * 0.95 + 0.4), 0.2, B, ramp='M_MID')
    elif hair == 'curls':
        res(10, 6)
        for k in range(12):
            t = 2 * math.pi * k / 12; dz = r * 0.55 * math.sin(t) + 0.8; dx = r * 0.6 * math.cos(t)
            tag(ell(H, back(dz, 0.3, dx), (1.3, 1.1, 1.3)), 'M_DARK', B)
        tag(ell(H, (x, y - 0.3, z + r * 0.95), (r * 0.8, r * 0.7, 1.6)), 'M_DARK', B)
    elif hair == 'ponytail':
        res(10, 6)
        p0 = Vector(back(0.6, 0.2)); pts = [p0, p0 + Vector((0, -1.2, -1.4)), p0 + Vector((0.3, -1.6, -3.4)), p0 + Vector((0.2, -1.3, -5.2))]
        tag(torus(T('M_PALE'), p0 + Vector((0, -0.4, 0)), 0.75, 0.3), 'M_PALE', B)
        for a, b, ra, rb in zip(pts, pts[1:], (0.8, 0.85, 0.7), (0.85, 0.7, 0.3)):
            tag(cone(H, a, b, ra, rb), 'M_DARK', B); tag(ell(H, b, (rb, rb, rb)), 'M_DARK', B)
    elif hair == 'beret':
        res(22, 10)
        tag(ell(H, (x - 0.6, y - 0.2, z + r * 0.85), (r * 1.2, r * 1.15, r * 0.45), rot=(0, -12, 0)), 'M_DARK', B)
        res(8, 6)
        capsule(H, (x - 0.9, y - 0.2, z + r * 1.25), (x - 1.1, y - 0.2, z + r * 1.25 + 1.0), 0.3, B, ramp='M_DARK')
        tag(torus(T('SILVER'), (x - 0.9, y - 0.2, z + r * 1.25 + 0.15), 0.35, 0.12), 'SILVER', B)
    elif hair == 'slick':
        # comb ridges running back over the crown
        res(8, 4)
        for dx in (-1.6, 0.0, 1.6):
            pts = [(x + dx, y + 1.0, z + r * 1.05), (x + dx, y - 1.6, z + r * 0.95), (x + dx, y - r * 0.85, z + 0.8)]
            for a, b in zip(pts, pts[1:]): capsule(H, a, b, 0.4, B, ramp='M_DARK')
    elif hair == 'cowlick':
        res(10, 6)
        tag(cone(H, (x + 0.5, y - 1.2, z + r * 1.05), (x + 1.2, y - 2.4, z + r * 1.05 + 1.6), 0.9, 0.15), 'M_DARK', B)
    elif hair == 'scarf':
        # headscarf over the hair, knotted at the nape with two tails
        res(20, 10)
        tag(ell(T('M_MID'), (x, y - 0.5, z + 0.8), (r * 1.08, r * 0.98, r * 1.02)), 'M_MID', B)
        res(10, 6)
        k0 = Vector(back(-r * 0.55, 0.3))
        tag(ell(T('M_MID'), k0, (0.9, 0.7, 0.8)), 'M_MID', B)
        for s in (-1, 1):
            tag(cone(T('M_MID'), k0, k0 + Vector((s * 1.0, -0.6, -2.4)), 0.6, 0.25), 'M_MID', B)
    if hair == 'crop':
        # a clipper line across the nape
        res(16, 4)
        tag(torus(H, (x, y - 0.4, z - r * 0.35), r * 0.86, 0.28, scale=(1, 0.92, 1)), 'M_DARK', B)

def _eye(c):
    ex, ey, ez = H0; rx, ry, rz = R0
    # dark socket rim round the eye, facing him
    res(36, 12)
    tag(_align(torus(T('M_DARK'), (ex, ey + 1.6, ez), 6.2, 1.5, scale=(rx / 6.6, rz / 6.6, 1.0)), (0, 1, 0)), 'M_DARK', 'crowd')
    # heavy upper lid with five lashes, lower lid (cast2)
    res(28, 12)
    tag(ell(T('M_DARK'), (ex, ey + 0.8, ez + 5.4), (rx + 1.0, ry + 0.6, 2.6), rot=(-12, 0, 0)), 'M_DARK', 'lid_T')
    res(8, 4)
    # each lash rooted just inside the lid's front rim (the outer two of cast2's stood off it: contact probe)
    for x in (-5.6, -3.0, 0.0, 3.0, 5.6):
        b = Vector((x, ey + 0.8 - (ry + 0.6) * 0.9 * math.sqrt(1 - (x / (rx + 1.0)) ** 2), ez + 5.4 + 1.0))
        tag(cone(T('M_DARK'), b, b + Vector((x * 0.2, -2.2, 2.8)), 0.5, 0.2), 'M_DARK', 'lid_T')
    # a fold at each corner of the eye, part of the upper lid on its hinge: it keeps the lid joined to the socket rim as
    # it shuts (at 68 degrees in out the lid alone left everything it touched: floats-free gate)
    res(14, 8)
    for sx in (-1, 1):
        tag(ell(T('M_DARK'), (sx * (rx - 0.2), ey + 0.5, ez + 2.8), (1.3, 1.6, 3.6)), 'M_DARK', 'lid_T')
    res(28, 12)
    tag(ell(T('M_DARK'), (ex, ey + 0.6, ez - 5.8), (rx + 0.4, ry + 0.2, 1.8)), 'M_DARK', 'lid_B')
    # the eyeball itself: its own object with the face texture
    res(32, 16)
    tag(ell(T('PAINT_DIM'), H0, R0), 'PAINT_DIM', 'head', group='head')

def _body():
    c = CONFIG
    _mound(c)
    for (x, y, z, r), h in zip(c['heads'], HAIRS): _head(c, x, y, z, r, h)
    _eye(c)

# ---------------------------------------------------------------- eye states (baked, not shipped as geometry)
def face(expr):
    import bpy
    before = set(bpy.data.objects)
    _face(expr)
    _grow(before)

def _face(expr):
    """Watch (cast2): grey-green iris, dark pupil, a glint. Wide (the tell): iris wide, pupil pinned small, a big glint,
    fine veins on the white. Judge: the pupil a narrow upright slit in a narrowed iris. Dull: a dull iris, a wide pupil,
    no glint."""
    z = 13.6
    S = lambda x, zz, push: on_surface(H0, R0, x, zz, push)
    iris = dict(watch=(3.8, 3.8), wide=(4.4, 4.4), judge=(3.4, 3.8), dull=(3.8, 3.8))[expr]
    pupil = dict(watch=(1.9, 1.9), wide=(0.8, 0.8), judge=(0.5, 2.6), dull=(2.6, 2.6))[expr]
    ell(F('#2E3A3D' if expr == 'dull' else '#44666E'), (0, S(0, z, 0.1), z), (iris[0], 0.5, iris[1]))
    ell(F('#071315'), (0, S(0, z, 0.35), z), (pupil[0], 0.4, pupil[1]))
    if expr != 'dull':
        g = 1.2 if expr == 'wide' else 0.8
        ell(F('#F4F4F2'), (-1.6, S(-1.6, 15.4, 0.5), 15.4), (g, 0.35, g))
    if expr == 'wide':
        for k in range(6):
            t = math.radians(15 + 60 * k); pts = []
            for j in range(4):
                rr = 4.9 + 0.7 * j; tt = t + 0.12 * math.sin(j * 2.0)
                xx, zz = rr * math.cos(tt), z + rr * 0.85 * math.sin(tt)
                pts.append((xx, S(xx, zz, 0.15), zz))
            build.arc(F('#6E8D94'), pts, (0.22, 0.25, 0.22))

def bones(U):
    """Seven bones: base (the mound on the floor), crowd (the fused heads), heads_L and heads_R (the outer heads), head
    (the eye, from the socket to the eyeball centre), lid_T and lid_B (from the eyeball centre)."""
    c = CONFIG; k = U * c['size']
    V = lambda *a: Vector(a) * k
    ex, ey, ez = H0
    return [('base', V(0, 0, 0), V(0, 0, 7.0), None), ('crowd', V(0, 0, 7.0), V(0, 2.0, 22.0), 'base'),
            ('heads_L', V(5.0, 2.0, 9.0), V(15.0, 2.0, 12.0), 'crowd'), ('heads_R', V(-5.0, 2.0, 9.0), V(-15.0, 2.0, 12.0), 'crowd'),
            ('head', V(ex, ey + 5.0, ez), V(*H0), 'crowd'),
            ('lid_T', V(*H0), V(ex, ey, ez + 8.0), 'crowd'), ('lid_B', V(*H0), V(ex, ey, ez - 7.0), 'crowd')]

# ---------------------------------------------------------------- clips (each starts from the idle's first pose)
def _pose(look=0.0, lift=0.0, lean=0.0, roll=0.0, lid_t=0.0, lid_b=0.0, side_l=0.0, side_r=0.0, bulge=0.0):
    """Turn the bones parent first. lean > 0 tips the crowd toward him; lid_t > 0 lowers the upper lid over the eye,
    lid_b > 0 raises the lower lid; side_l and side_r > 0 lean the outer heads in toward the middle; bulge moves the eye
    out toward him (units)."""
    c = CONFIG
    if roll: K.rotw('base', (0, 1, 0), roll)
    K.upd()
    K.rotw('crowd', (1, 0, 0), lean)
    K.upd()
    K.rotw('heads_L', (0, 1, 0), -side_l)
    K.rotw('heads_R', (0, 1, 0), side_r)
    K.rotw('head', (0, 0, 1), look)
    if lift: K.rotw('head', (1, 0, 0), -lift)
    if bulge: K.move('head', (0, -bulge, 0))
    K.rotw('lid_T', (1, 0, 0), c['lid_T'] + lid_t)
    K.rotw('lid_B', (1, 0, 0), -(c['lid_B'] + lid_b))

def _ease(f): f = min(max(f, 0.0), 1.0); return f * f * (3 - 2 * f)

def idle(t, length):
    """The heads murmur, the outer ones leaning in and out by turns; the eye drifts slowly side to side; one blink."""
    c = CONFIG; p = 2 * math.pi * t / length; f = t / length; b0, b1 = c['blink']
    blink = math.sin(math.pi * (f - b0) / (b1 - b0)) if b0 <= f <= b1 else 0.0
    _pose(look=c['idle_look'] * math.sin(p), lean=1.5 * math.sin(p), side_l=3.0 * math.sin(p), side_r=3.0 * math.sin(p + math.pi),
          lid_t=38.0 * blink, lid_b=10.0 * blink)

def gaze(t, length):
    """The 0.4 s tell before it judges: the upper lid flies open, the eye bulges toward him, the heads lean in."""
    e = _ease(t / length / 0.75)
    _pose(lid_t=-22.0 * e, lid_b=-6.0 * e, bulge=1.4 * e, lean=6.0 * e, side_l=8.0 * e, side_r=8.0 * e)

def judge(t, length):
    """The verdict (every 1.0 s while he is in its gaze): the lids narrow to a slit and the heads nod together once."""
    f = t / length; k = math.sin(math.pi * f)
    _pose(lid_t=24.0 * k, lid_b=12.0 * k, lean=8.0 * k, lift=-4.0 * k)

def hit(t, length):
    """Hit from the side: the mound is knocked sideways, the heads sway apart, the lids squeeze shut; back to the idle
    in 0.6 s."""
    f = t / length; k = math.sin(math.pi * f) * (1 - 0.3 * f); w = math.sin(2 * math.pi * f) * (1 - f)
    _pose(roll=9.0 * k, look=-12.0 * k, lid_t=40.0 * k, lid_b=14.0 * k, side_l=-10.0 * w, side_r=10.0 * w)

def out(t, length):
    """Beaten for the night: the eye closes, the heads slump outward and the crowd sinks forward."""
    e = _ease(t / length)
    _pose(lid_t=68.0 * e, lid_b=20.0 * e, lean=10.0 * e, side_l=-12.0 * e, side_r=-12.0 * e, lift=-8.0 * e)

def _keys(length, n): return [length * i / n for i in range(n + 1)]
# clip name -> (key times in s, poser(i, t)); lengths also written in check_glb.py (clips_by_char)
CLIPS = dict(idle=(_keys(2.0, 10), lambda i, t: idle(t, 2.0)), gaze=(_keys(0.4, 4), lambda i, t: gaze(t, 0.4)),
             judge=(_keys(0.4, 4), lambda i, t: judge(t, 0.4)), hit=(_keys(0.6, 6), lambda i, t: hit(t, 0.6)),
             out=(_keys(1.0, 5), lambda i, t: out(t, 1.0)))
# pose sheets: clip and view yaw
SHEET = (('idle', -35), ('gaze', -35), ('judge', -35), ('hit', -35), ('out', -35))

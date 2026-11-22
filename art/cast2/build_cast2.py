"""The Clown and the Mirror: night-1 cast, round 1 (proposal, not approved).
New characters as data on the approved style generator: imports the helpers from
art/3_blender_3d/build.py and palette.py (both unchanged). Same toon bands, light and units
(1 unit = 1 target pixel at 64 px); renders at a wider ortho so tall figures fit one shared scale.
Stage crew (warm): stagehand, rigger, props_girl, strongman, child.
Mirror constructs, the clown's insecurities (cold): light, whisper, stare, shame.
Run: python3 -I build_cast2.py <name|all|lineup>  -> renders/<name>_<view>.png, <name>.glb"""
import math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
STYLE = os.path.join(HERE, '..', '3_blender_3d')
sys.path.insert(0, STYLE)
import bpy
import build as B
from build import toon, flat, ell, cone, cyl, capsule, torus, on_surface, arc
from palette import RAMPS

# ===== CONFIG =====
CONFIG = dict(
    # orthographic frame width in units for every render here (approved renders use 64; 80 fits the tall constructs)
    ortho=80,
    # render size, px (4 px per unit at ortho 64 in the approved renders; here 3.2 px per unit)
    res=256,
    # camera height, units (raised with the wider frame so the ground row stays near the bottom)
    camz=37,
    # views: yaw of the model root, degrees
    views=dict(front=0, left=-90, back=180, right=90),
    # sphere and cylinder segments for the web GLB (the review renders keep build.py's 32 / 16)
    glb_segs=14, glb_rings=8,
)

# Extra warm, low-chroma ramps for the stage crew [light, base, shadow, deep] (stage hue 65-80, reds near 40).
EXTRA = dict(
    WOOL=['#B8A77E', '#958459', '#6C5F3E', '#33291A'],      # work shirts, the child's smock
    CANVAS=['#D9CDB4', '#BBAE92', '#8F8269', '#463C2E'],    # aprons
    JACKET=['#8C8257', '#6D653F', '#4C462B', '#252114'],    # rigger's work jacket
    SKIRT=['#B97F66', '#96604B', '#6C4234', '#33201A'],     # props girl's skirt and vest
    SKIN_TAN=['#C89270', '#A87252', '#7E5038', '#3C2219'],  # strongman
)
RAMPS.update(EXTRA)

def rotate(o, rx=0, ry=0, rz=0):
    o.rotation_mode = 'XYZ'
    o.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
    return o

def chain(mat, pts, r1, r2=None, joints=True):
    """Limb through points, tapered from r1 to r2, with ball joints."""
    r2 = r1 if r2 is None else r2
    n = len(pts) - 1
    for i, (p, q) in enumerate(zip(pts, pts[1:])):
        a = r1 + (r2 - r1) * i / n; b = r1 + (r2 - r1) * (i + 1) / n
        cone(mat, p, q, a, b)
        if joints: ell(mat, q, (b, b, b))

def dot_eyes(HC, HR, z, dx, size=(0.8, 0.4, 0.95), col='#1E1714', glint=True, look=0.0):
    for s in (-1, 1):
        x = s * dx + look
        ell(flat(col), (x, on_surface(HC, HR, x, z, 0.2), z), size)
        if glint: ell(flat('#F4F4F2'), (x - 0.3, on_surface(HC, HR, x - 0.3, z + 0.4, 0.4), z + 0.4), (0.3, 0.25, 0.3))

# ===== STAGE CREW (warm) =====
def stagehand():
    """Old stagehand: slouched, flat cap, rolled sleeves, canvas apron, a coil of rope on one shoulder.
    Verb in the corridor: the clown walks past him."""
    for s in (-1, 1):
        ell(toon('SHOE'), (s * 3.6, -1.8, 1.5), (2.6, 4.4, 1.5))
        cyl(toon('HAT'), (s * 3.4, 0, 9.0), 2.6, 15.0)
    ell(toon('HAT'), (0, 0, 17.6), (7.0, 5.0, 3.6))
    T = (0, -0.8, 25.5); TR = (8.4, 6.0, 9.0)
    rotate(ell(toon('WOOL'), T, TR), rx=8)                                              # shirt, slouched forward
    cone(toon('CANVAS'), (0, -5.4, 27.0), (0, -6.6, 11.6), 4.6, 6.2).scale = (1, 0.22, 1)   # flat canvas apron, chest to knee
    for s in (-1, 1):
        chain(toon('WOOL'), [(s * 8.0, -0.6, 32.0), (s * 9.6, -1.2, 25.0)], 2.2, 2.0)    # upper arm
        chain(toon('SKIN'), [(s * 9.6, -1.2, 24.4), (s * 9.2, -2.2, 16.4)], 1.7, 1.5)    # rolled sleeves, bare forearm
        ell(toon('SKIN'), (s * 9.2, -2.4, 15.2), (1.8, 1.6, 2.0))
        torus(toon('WOOL'), (s * 9.6, -1.2, 24.4), 2.0, 0.7)                             # sleeve roll
    rotate(torus(toon('OCHRE'), (5.6, 0.4, 31.0), 4.6, 1.1), rx=90, rz=-25)              # rope coil on his left shoulder
    ell(toon('SKIN'), (0, -1.6, 35.0), (2.6, 2.6, 2.2))
    HC, HR = (0, -2.4, 41.0), (6.2, 5.8, 6.6)
    ell(toon('SKIN'), HC, HR)
    for s in (-1, 1): ell(toon('SKIN'), (s * 6.2, -2.2, 40.6), (1.1, 1.4, 1.8))
    dot_eyes(HC, HR, 41.6, 2.5, size=(0.75, 0.4, 0.7), glint=False)
    for s in (-1, 1):                                                                    # tired lids
        ell(toon('SKIN_LID'), (s * 2.5, on_surface(HC, HR, s * 2.5, 42.4, 0.1), 42.4), (1.4, 0.5, 0.55))
    ell(toon('SKIN'), (0, on_surface(HC, HR, 0, 40.0, 0.9), 40.0), (1.3, 1.3, 1.6))      # big nose
    arc(toon('WARM_WHITE'), [(x, on_surface(HC, HR, x, 37.9, 0.2), 37.9) for x in (-2.2, -1.1, 0, 1.1, 2.2)], (0.9, 0.5, 0.6))   # grey moustache
    ell(flat('#4A2A24'), (0, on_surface(HC, HR, 0, 36.6, 0.1), 36.6), (1.3, 0.3, 0.3))   # flat mouth
    ell(toon('HAT_BAND'), (0, -2.2, 46.4), (6.7, 6.4, 2.3))                              # flat cap
    ell(toon('HAT_BAND'), (0, -7.4, 45.4), (5.0, 2.8, 0.7))

def rigger():
    """Rigger: down on one knee, laying a floor cable from a coil slung on his back; beanie, tool belt.
    Verb in the corridor: he lays the cable, the clown jumps it."""
    T = (0, -2.6, 23.0)
    ell(toon('HAT'), (0, 0, 14.6), (6.4, 5.0, 4.0))                                      # hips
    chain(toon('HAT'), [(-3.2, 0, 13.6), (-3.4, -6.4, 2.6), (-3.4, 3.4, 2.2)], 2.6, 2.2)  # kneeling leg, shin on the floor
    ell(toon('SHOE'), (-3.4, 5.4, 1.8), (2.2, 2.8, 1.6))
    chain(toon('HAT'), [(3.4, 0, 13.6), (4.0, -7.0, 13.2), (4.0, -7.6, 2.4)], 2.6, 2.2)   # standing leg, knee forward
    ell(toon('SHOE'), (4.0, -9.4, 1.6), (2.4, 4.0, 1.6))
    rotate(ell(toon('JACKET'), T, (7.4, 5.8, 8.6)), rx=22)                               # leaning in
    rotate(torus(toon('HAT_BAND'), (0, -0.4, 16.8), 6.5, 0.8), rx=10)                    # tool belt
    ell(toon('HAT_BAND'), (5.8, -2.8, 16.0), (1.8, 1.4, 2.2))                            # pouch
    cone(toon('SILVER'), (6.6, -3.4, 17.0), (7.4, -4.0, 20.6), 0.4, 0.3)                 # spanner in the pouch
    rotate(torus(toon('BLACK'), (0, 4.4, 26.0), 4.6, 1.3), rx=80)                        # cable coil on his back
    for s, hand in ((-1, (-3.0, -13.6, 4.4)), (1, (5.0, -12.6, 6.6))):
        chain(toon('JACKET'), [(s * 7.0, -4.0, 29.0), (s * 8.4, -10.0, 20.0)], 2.1, 1.9)
        chain(toon('SKIN'), [(s * 8.4, -10.0, 20.0), hand], 1.6, 1.4)
        ell(toon('SKIN'), hand, (1.8, 1.8, 1.7))
    pts = [(-3.0, -13.8, 3.6), (-1.0, -17.0, 1.0), (-6.0, -21.0, 0.8), (-12.0, -20.0, 0.8), (-17.0, -15.0, 0.8)]
    for p, q in zip(pts, pts[1:]): capsule(toon('BLACK'), p, q, 0.8)                     # the cable he lays
    ell(toon('SKIN'), (0, -6.0, 30.0), (2.4, 2.4, 2.0))
    HC, HR = (0, -8.2, 34.4), (5.8, 5.4, 6.2)
    ell(toon('SKIN'), HC, HR)
    dot_eyes(HC, HR, 33.4, 2.2, size=(0.7, 0.4, 0.55), glint=False)                     # looking down at the cable
    ell(toon('SKIN'), (0, on_surface(HC, HR, 0, 32.0, 0.8), 32.0), (1.1, 1.1, 1.3))
    for x in (-3.0, -1.8, 1.8, 3.0):                                                      # stubble
        ell(flat('#8C5844'), (x, on_surface(HC, HR, x, 29.8, 0.05), 29.8), (0.35, 0.2, 0.35))
    ell(flat('#4A2A24'), (0.3, on_surface(HC, HR, 0.3, 30.2, 0.1), 30.2), (1.0, 0.3, 0.3))
    ell(toon('RUST_DARK'), (0, -7.8, 38.6), (6.0, 5.6, 3.8))                             # beanie
    torus(toon('RUST_HAIR'), (0, -7.9, 36.4), 5.7, 0.9, scale=(1, 0.95, 1))

def props_girl():
    """Props girl: bun with a pencil through it, canvas apron, holding a cream pie out to the clown.
    Verb in the corridor: the clown takes the prop (the pie)."""
    for s in (-1, 1):
        ell(toon('BLACK'), (s * 2.6, -1.2, 1.1), (1.8, 3.0, 1.1))
        cyl(toon('HAT'), (s * 2.6, 0, 4.6), 1.9, 7.0)                                    # boots
        cyl(toon('SKIN'), (s * 2.6, 0, 10.6), 1.6, 6.0)
    cone(toon('SKIRT'), (0, 0, 24.0), (0, 0, 12.6), 5.4, 8.4)                            # skirt to the knee
    rotate(ell(toon('CANVAS'), (0, -6.0, 18.4), (5.4, 1.2, 6.2)), rx=-12)                # apron
    ell(toon('WARM_WHITE'), (0, 0, 28.6), (6.2, 4.6, 6.2))                               # blouse
    ell(toon('SKIRT'), (0, -0.6, 27.0), (6.0, 4.4, 4.2))                                 # laced vest
    for s in (-1, 1):
        chain(toon('WARM_WHITE'), [(s * 6.0, 0, 32.4), (s * 6.6, -5.0, 27.4)], 1.8, 1.6)
        chain(toon('SKIN'), [(s * 6.6, -5.0, 27.4), (s * 3.8, -9.6, 27.2)], 1.4, 1.3)
        ell(toon('SKIN'), (s * 3.6, -10.2, 27.4), (1.5, 1.6, 1.4))
    cyl(toon('SILVER'), (0, -11.2, 27.9), 4.2, 1.2)                                      # pie tin
    ell(toon('PAINT'), (0, -11.2, 28.7), (3.8, 3.8, 1.8))                                # cream
    ell(toon('RED'), (0, -11.2, 30.6), (0.9, 0.9, 0.9))                                  # cherry
    ell(toon('SKIN'), (0, 0, 34.6), (2.0, 2.0, 1.8))
    HC, HR = (0, -0.2, 39.6), (5.6, 5.2, 6.0)
    ell(toon('SKIN'), HC, HR)
    ell(toon('RUST_HAIR'), (0, 0.9, 41.4), (6.0, 5.6, 5.4))                              # hair, back and top
    ell(toon('RUST_HAIR'), (0, 3.2, 45.6), (3.0, 3.0, 2.8))                              # bun
    cone(toon('OCHRE'), (-4.2, 3.6, 44.4), (4.4, 2.8, 47.6), 0.4, 0.25)                  # pencil through the bun
    dot_eyes(HC, HR, 39.8, 2.1, size=(0.7, 0.4, 0.95))
    ell(toon('SKIN'), (0, on_surface(HC, HR, 0, 38.4, 0.6), 38.4), (0.8, 0.8, 1.0))
    arc(flat('#933C30'), [(x, on_surface(HC, HR, x, z, 0.15), z) for x, z in ((-1.4, 36.4), (-0.6, 36.0), (0.6, 36.0), (1.4, 36.4))], (0.5, 0.3, 0.35))   # small smile
    for x, z in ((-3.0, 38.6), (-3.6, 37.8), (3.0, 38.6), (3.6, 37.8)):
        ell(flat('#A86E54'), (x, on_surface(HC, HR, x, z, 0.1), z), (0.3, 0.2, 0.3))     # freckles

def strongman():
    """Strongman: barrel chest in a striped singlet, handlebar moustache, one arm flexed,
    holding out a bulb horn. Verb in the corridor: the clown honks the horn he hands over."""
    for s in (-1, 1):
        ell(toon('BLACK'), (s * 4.4, -1.8, 1.4), (2.8, 4.2, 1.4))
        cyl(toon('HAT'), (s * 4.2, 0, 7.4), 3.0, 12.0)                                   # short thick legs
    ell(toon('BLACK'), (0, 0, 15.4), (8.4, 6.2, 4.2))                                    # trunks
    TC, TR = (0, 0, 27.0), (11.0, 8.0, 11.0)
    ell(toon('WARM_WHITE'), TC, TR)                                                      # barrel chest
    for z in (19.8, 23.4, 27.0, 30.6):
        R = TR[0] * math.sqrt(max(1 - ((z - TC[2]) / TR[2]) ** 2, 0.05))
        torus(toon('CRIMSON'), (0, 0, z), R + 0.1, 0.95, scale=(1, TR[1] / TR[0], 1))    # singlet stripes
    torus(toon('BLACK'), (0, 0, 17.6), 8.6, 1.0, scale=(1, 0.74, 1))                     # belt
    ell(toon('GOLD'), (0, -6.6, 17.6), (1.6, 0.6, 1.2))
    for s in (-1, 1): ell(toon('SKIN_TAN'), (s * 10.8, 0, 35.4), (4.6, 4.4, 4.2))        # shoulders
    chain(toon('SKIN_TAN'), [(-11.6, 0, 35.0), (-18.0, 0, 29.6), (-16.0, -1.6, 41.4)], 3.4, 2.8)   # flexed arm
    ell(toon('SKIN_TAN'), (-17.0, 0.2, 33.2), (3.4, 3.2, 3.0))                           # biceps
    ell(toon('SKIN_TAN'), (-15.8, -1.8, 42.8), (2.6, 2.4, 2.6))                          # fist
    chain(toon('SKIN_TAN'), [(11.6, 0, 35.0), (13.4, -5.6, 28.0), (9.2, -11.0, 28.8)], 3.2, 2.6)   # arm held out
    ell(toon('SKIN_TAN'), (9.0, -11.6, 29.0), (2.4, 2.4, 2.4))
    ell(toon('RED'), (11.4, -10.8, 31.0), (2.3, 2.3, 2.3))                               # horn bulb
    cone(toon('GOLD'), (8.6, -12.6, 30.2), (2.6, -17.2, 32.4), 0.7, 3.2)                 # brass bell
    ell(toon('SKIN_TAN'), (0, -0.6, 38.6), (3.6, 3.4, 2.4))
    HC, HR = (0, -1.2, 44.2), (6.0, 5.6, 6.4)
    ell(toon('SKIN_TAN'), HC, HR)
    ell(flat('#E6C2A4'), (-2.4, on_surface(HC, HR, -2.4, 48.4, 0.15), 48.4), (1.2, 0.3, 0.8))   # shine on the bald head
    dot_eyes(HC, HR, 44.8, 2.3, size=(0.65, 0.4, 0.6), glint=False)
    for s in (-1, 1):
        arc(flat('#17151B'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.2), zz) for xx, zz in ((1.2, 46.6), (2.4, 47.0), (3.6, 46.6))], (0.7, 0.4, 0.55))
    ell(toon('SKIN_TAN'), (0, on_surface(HC, HR, 0, 43.0, 0.8), 43.0), (1.2, 1.2, 1.4))
    mo = [(-5.2, 42.6), (-4.6, 41.4), (-3.4, 41.0), (-2.0, 41.4), (-0.8, 41.6), (0.8, 41.6), (2.0, 41.4), (3.4, 41.0), (4.6, 41.4), (5.2, 42.6)]
    arc(toon('BLACK'), [(x, on_surface(HC, HR, x, z, 0.5), z) for x, z in mo], (0.9, 0.7, 0.7))   # handlebar moustache
    ell(flat('#3C2219'), (0, on_surface(HC, HR, 0, 39.6, 0.1), 39.6), (1.4, 0.3, 0.4))

def child():
    """The one who sees: the stagehand's child, small, his father's flat cap far too big,
    hands behind the back, round eyes watching sideways, a straight mouth."""
    for s in (-1, 1):
        ell(toon('SHOE'), (s * 2.2, -1.0, 1.0), (1.6, 2.6, 1.0))
        cyl(toon('WARM_WHITE'), (s * 2.0, 0, 3.4), 1.4, 3.0)                             # socks
        cyl(toon('SKIN'), (s * 2.0, 0, 7.0), 1.3, 5.0)
    cone(toon('WOOL'), (0, 0, 21.6), (0, 0, 9.0), 4.8, 6.4)                              # smock
    for s in (-1, 1):
        chain(toon('WOOL'), [(s * 4.8, 0, 20.0), (s * 5.6, 2.0, 15.6)], 1.4, 1.3)
        chain(toon('SKIN'), [(s * 5.6, 2.0, 15.6), (s * 2.4, 4.6, 13.4)], 1.1, 1.0)       # hands behind the back
    ell(toon('SKIN'), (0, 0, 22.6), (1.8, 1.8, 1.4))
    HC, HR = (0, 0, 27.6), (5.6, 5.2, 5.8)
    ell(toon('SKIN'), HC, HR)
    for s in (-1, 1): ell(toon('SKIN'), (s * 5.6, 0.2, 27.2), (0.9, 1.2, 1.5))
    for s in (-1, 1):
        x = s * 2.3
        ell(flat('#F4F4F2'), (x, on_surface(HC, HR, x, 27.8, 0.2), 27.8), (1.25, 0.4, 1.35))   # round eyes
        ell(flat('#1E1714'), (x + 0.55, on_surface(HC, HR, x + 0.55, 27.7, 0.45), 27.7), (0.75, 0.35, 0.85))   # looking sideways
    ell(toon('SKIN'), (0, on_surface(HC, HR, 0, 26.2, 0.5), 26.2), (0.6, 0.6, 0.7))
    ell(flat('#8C5844'), (0, on_surface(HC, HR, 0, 24.6, 0.1), 24.6), (1.1, 0.3, 0.25))  # straight mouth: he knows
    ell(toon('HAT_BAND'), (0, 0, 32.2), (6.6, 6.4, 2.3))                                 # father's cap, too big
    ell(toon('HAT_BAND'), (0, -5.8, 31.3), (5.2, 3.0, 0.6))

# ===== MIRROR CONSTRUCTS: the clown's insecurities (cold) =====
def light():
    """The Light (being watched): a stage spotlight on a tripod whose neck bends down like a head,
    its lens one pale eye. In play it throws the beam that follows him."""
    feet = [(0, -13.0, 0.8), (11.3, 6.5, 0.8), (-11.3, 6.5, 0.8)]
    for f in feet:
        cone(toon('M_DARK'), (0, 0, 28.0), f, 1.2, 0.8)
        ell(toon('M_DARK'), f, (1.6, 1.6, 0.8))
    ell(toon('M_MID'), (0, 0, 28.0), (2.2, 2.2, 2.0))
    cone(toon('M_MID'), (0, 0, 28.0), (0, 0, 52.0), 1.5, 1.1)                            # column
    chain(toon('M_MID'), [(0, 0, 52.0), (0, -2.4, 58.0), (0, -6.0, 61.0)], 1.1, 1.0)     # neck bending forward
    back, front = (0, -4.0, 66.0), (0, -12.6, 56.0)
    cone(toon('M_DARK'), back, front, 5.4, 6.8)                                          # lamp housing
    ell(toon('M_DARK'), back, (5.4, 5.4, 5.4))
    for dx, dz in ((0, 1), (0, -1), (1, 0), (-1, 0)):                                    # barn doors, splayed like lids
        c = (front[0] + dx * 7.2, front[1] - 1.8, front[2] + dz * 6.4 - 1.4)
        rotate(ell(toon('M_DARK'), c, (3.6 if dz else 0.5, 1.6, 0.5 if dz else 3.6)), rx=-40)
    d = [(front[i] - back[i]) for i in range(3)]; L = math.sqrt(sum(v * v for v in d)); d = [v / L for v in d]
    p = lambda t: tuple(front[i] + d[i] * t for i in range(3))
    cone(toon('M_PALE'), p(0.0), p(0.5), 6.0, 6.0)                                      # lens
    cone(flat('#44666E'), p(0.5), p(0.7), 3.2, 3.2)                                     # iris
    cone(flat('#071315'), p(0.7), p(0.9), 1.6, 1.6)                                     # pupil
    ell(flat('#F4F4F2'), (p(0.95)[0] - 1.6, p(0.95)[1], p(0.95)[2] + 2.0), (0.7, 0.4, 0.7))
    pts = [(0, 0, 28.0), (2.0, 4.0, 14.0), (6.0, 9.0, 0.8), (14.0, 12.0, 0.8), (20.0, 8.0, 0.8)]
    for a, b in zip(pts, pts[1:]): capsule(toon('M_DARK'), a, b, 0.6)                    # cable trailing off

def whisper():
    """The Whisper (being seen through): tall and thin in a floor-length coat, no feet, leaning in,
    one hand cupped to its mouth, eyes shut, its tiny mouth turned to the side it whispers to."""
    cone(toon('M_MID'), (-1.6, 0, 47.0), (0, 0, 0.6), 4.6, 9.0)                          # coat to the floor
    torus(toon('M_DARK'), (-1.6, 0, 46.6), 4.6, 1.2)                                     # collar
    for z in (40.0, 32.0, 24.0):
        r = 4.6 + (47.0 - z) / 46.4 * 4.4
        ell(toon('M_DARK'), (-1.6 + (47 - z) / 46.4 * 1.6, -r - 0.1, z), (0.9, 0.5, 0.9))  # buttons
    chain(toon('M_PALE'), [(-1.6, 0, 47.0), (-4.0, -0.8, 54.0), (-5.0, -1.2, 57.0)], 1.5, 1.3)   # long neck, leaning
    HC, HR = (-6.2, -1.6, 62.0), (4.4, 4.2, 6.0)
    rotate(ell(toon('M_PALE'), HC, HR), ry=-16)
    for s in (-1, 1):
        x = HC[0] + s * 1.8
        arc(flat('#071315'), [(x + xx, on_surface(HC, HR, x + xx, zz, 0.2), zz) for xx, zz in ((-0.9, 62.6), (0, 62.1), (0.9, 62.6))], (0.42, 0.3, 0.3))   # shut eyes
    ell(flat('#071315'), (HC[0] + 1.6, on_surface(HC, HR, HC[0] + 1.6, 58.6, 0.2), 58.6), (0.6, 0.3, 0.55))   # small mouth, to one side
    chain(toon('M_MID'), [(2.6, 0, 45.6), (6.0, -5.0, 51.6), (-1.0, -6.6, 58.6)], 1.4, 1.2)   # arm up to the mouth
    rotate(ell(toon('M_PALE'), (-2.0, -6.6, 59.0), (1.6, 1.0, 2.6)), ry=20)              # cupped hand
    chain(toon('M_MID'), [(-6.0, 0, 45.6), (-8.4, -0.6, 34.0), (-8.6, -1.0, 24.0)], 1.4, 1.2)   # other arm hangs long
    for k in (-1, 0, 1):                                                                  # long fingers
        cone(toon('M_PALE'), (-8.6 + k * 0.6, -1.0, 23.0), (-8.8 + k * 0.9, -1.4, 18.0), 0.45, 0.2)

def stare():
    """The Stare (being judged): a mound of audience heads, backs turned, fused together,
    with one great eye open in the middle of them."""
    ell(toon('M_DARK'), (0, 0, 7.0), (20.0, 12.0, 8.0))                                  # mound
    heads = [(-15, 2, 11, 4.4), (-9, 5, 15, 4.8), (-3, 6, 17, 5.0), (4, 6, 17, 5.0), (10, 5, 15, 4.8), (16, 2, 11, 4.4),
             (-12, -4, 12, 4.0), (12, -4, 12, 4.0), (-6, 1, 19, 4.4), (7, 1, 19, 4.4), (0, 3, 22, 4.2)]
    for x, y, z, r in heads:
        ell(toon('M_MID'), (x, y, z), (r, r * 0.95, r * 1.1))                            # backs of heads
        for s in (-1, 1): ell(toon('M_MID'), (x + s * r * 0.98, y + 0.2, z - 0.3), (0.6, 0.9, 1.2))   # ears
    EC, ER = (0, -8.4, 14.0), (7.6, 5.4, 6.8)
    ell(toon('PAINT_DIM'), EC, ER)                                                        # eyeball
    ell(flat('#44666E'), (0, on_surface(EC, ER, 0, 13.6, 0.1), 13.6), (3.8, 0.5, 3.8))  # iris
    ell(flat('#071315'), (0, on_surface(EC, ER, 0, 13.6, 0.35), 13.6), (1.9, 0.4, 1.9))  # pupil
    ell(flat('#F4F4F2'), (-1.6, on_surface(EC, ER, -1.6, 15.4, 0.5), 15.4), (0.8, 0.35, 0.8))
    rotate(ell(toon('M_DARK'), (0, -7.6, 19.4), (8.6, 6.0, 2.6)), rx=-12)                # heavy upper lid
    ell(toon('M_DARK'), (0, -7.8, 8.2), (8.0, 5.6, 1.8))                                 # lower lid
    for x in (-5.6, -3.0, 0, 3.0, 5.6):                                                   # lashes
        cone(toon('M_DARK'), (x, -12.4, 20.4), (x * 1.2, -14.6, 23.2), 0.5, 0.2)

def shame():
    """Shame: shoulders up, toes turned in, face buried in two huge white gloves, a small bowler
    pressed down on its head; the red of the blush shows past the fingers (its only warm colour)."""
    for s in (-1, 1):
        rotate(ell(toon('M_DARK'), (s * 3.0, -2.6, 1.6), (2.8, 4.8, 1.6)), rz=-s * 22)    # toes turned in
        cyl(toon('M_MID'), (s * 3.0, 0, 8.0), 1.8, 12.0)
    cone(toon('M_MID'), (0, 0, 35.0), (0, 0, 12.0), 6.6, 8.6)                            # drooping coat
    for s in (-1, 1): ell(toon('M_MID'), (s * 6.2, 0, 35.4), (4.4, 4.0, 4.2))            # shoulders hunched up
    HC, HR = (0, -2.2, 37.6), (5.6, 5.0, 6.0)
    ell(toon('M_PALE'), HC, HR)                                                           # head sunk between them
    for s in (-1, 1):
        ell(toon('RED'), (s * 5.4, -1.2, 37.4), (1.0, 1.3, 1.7))                         # red ears
        ell(flat('#C9604A'), (s * 4.6, on_surface(HC, HR, s * 4.6, 35.8, 0.05), 35.8), (1.2, 0.4, 1.1))   # blush past the fingers
        chain(toon('M_MID'), [(s * 7.0, 0, 34.6), (s * 7.6, -6.4, 29.4), (s * 2.6, -7.4, 35.6)], 1.8, 1.6)
        ell(toon('PAINT'), (s * 2.2, -7.6, 38.4), (3.0, 1.7, 4.0))                       # glove over the face
        for k in range(3):                                                               # fingers up the forehead
            capsule(toon('PAINT'), (s * (0.9 + k * 1.2), -8.0, 41.2), (s * (0.6 + k * 1.3), -7.0, 44.0 - k * 0.6), 0.55)
    for x, z in ((-1.0, 33.0), (-1.2, 31.6), (1.4, 32.6), (1.3, 30.8), (1.2, 29.0)):
        ell(flat('#F4F4F2'), (x, -8.0 + (35 - z) * 0.1, z), (0.5, 0.35, 0.6))             # paint dripping from under the hands
    ell(toon('M_DARK'), (0, -1.6, 43.4), (5.0, 4.6, 2.6))                                # bowler, pressed down
    cyl(toon('M_DARK'), (0, -1.6, 41.4), 6.4, 0.7, scale=(1, 0.95, 1))

CHARS = dict(stagehand=stagehand, rigger=rigger, props_girl=props_girl, strongman=strongman, child=child,
             light=light, whisper=whisper, stare=stare, shame=shame)
APPROVED = dict(clown=B.clown, whiteface=B.whiteface, performer=B.performer, clinger=B.clinger)
OUT = os.path.join(HERE, 'renders')

def setup(name, fn):
    B._mats.clear()
    B.ROOT = B.reset()
    sc = bpy.context.scene
    sc.render.resolution_x = sc.render.resolution_y = CONFIG['res']
    cam = sc.camera; cam.data.ortho_scale = CONFIG['ortho']; cam.location.z = CONFIG['camz']
    fn()
    B.ROOT.scale = (B.SCALE.get(name, 1.0),) * 3
    B.ROOT.location.z = B.LIFT.get(name, 0.0)
    return sc

def render(name, fn, export=True):
    os.makedirs(OUT, exist_ok=True)
    sc = setup(name, fn)
    for view, yaw in CONFIG['views'].items():
        B.ROOT.rotation_euler = (0, 0, math.radians(yaw))
        sc.render.filepath = os.path.join(OUT, f'{name}_{view}.png')
        bpy.ops.render.render(write_still=True)
    B.ROOT.rotation_euler = (0, 0, 0)
    if not export: return
    keep = (B.CONFIG['segs'], B.CONFIG['rings'])
    B.CONFIG['segs'], B.CONFIG['rings'] = CONFIG['glb_segs'], CONFIG['glb_rings']
    sc = setup(name, fn)                                                                  # lighter rebuild of the same data for the web
    B.CONFIG['segs'], B.CONFIG['rings'] = keep
    meshes = [o for o in sc.objects if o.type == 'MESH']
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()                                                                 # one mesh, one primitive per material
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'{name}.glb'), export_format='GLB', export_apply=True)
    print(f'RESULT {name}: parts {len(meshes)}, triangles {tris}, materials {len(meshes[0].data.materials)}')

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else (sys.argv[1] if len(sys.argv) > 1 else 'all')
    if arg == 'all':
        for n, f in CHARS.items(): render(n, f)
    elif arg == 'lineup':
        for n, f in APPROVED.items(): render(n, f, export=False)
    else:
        render(arg, CHARS[arg])

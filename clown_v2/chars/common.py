"""Shared building blocks for every character: tagging parts with ramp and bones, segment control,
loop cuts for bending, materials from the approved builder, A-pose arms and the humanoid bone table.
Character modules (clown.py, whiteface.py, performer.py) import from here; the scripts pick one with CHAR."""
import math, os, sys, importlib
# approved art scripts (build.py, render3d.py, palette.py); set APPROVED to override
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import bmesh
from mathutils import Vector, Quaternion
# render3d swaps build.toon/flat/arc for the approved PBR versions when imported
import render3d
import build
assert build.toon is render3d.pbr
from build import ell, cone, cyl, torus, on_surface

__all__ = ['build', 'ell', 'cone', 'cyl', 'torus', 'on_surface', 'tag', 'res', 'loops', 'T', 'F', 'side',
           'capsule', 'arm_points', 'humanoid_bones', 'current']

def current():
    """The character module chosen by the CHAR environment variable (default: clown)."""
    return importlib.import_module('chars.' + os.environ.get('CHAR', 'clown'))

def tag(o, ramp, bones, group='body', cuts=0):
    o['ramp'] = ramp; o['bones'] = bones; o['group'] = group
    if cuts: loops(o, cuts)
    return o

def res(segs, rings):
    """Segment count for the next primitives (approved build used 32 x 16 everywhere)."""
    build.CONFIG['segs'], build.CONFIG['rings'] = segs, rings

def loops(o, n):
    """n cuts across a cylinder or cone along its own axis, so it can bend (UVs are interpolated)."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    zs = [v.co.z for v in bm.verts]; z0, z1 = min(zs), max(zs)
    for k in range(1, n + 1):
        z = z0 + (z1 - z0) * k / (n + 1)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    bm.to_mesh(o.data); bm.free()

def T(ramp): return build.toon(ramp)
def F(hexc): return build.flat(hexc)

def side(s): return 'L' if s > 0 else 'R'     # characters face -y, so +x is their left

def capsule(mat, p, q, r, bones, ramp='SKIN'):
    tag(cone(mat, p, q, r, r), ramp, bones)
    tag(ell(mat, p, (r, r, r)), ramp, bones); tag(ell(mat, q, (r, r, r)), ramp, bones)

def arm_points(cfg, s):
    """Shoulder, elbow, wrist and the two arm directions of the A-pose bind arm."""
    a, f = math.radians(cfg['arm_out']), math.radians(cfg['arm_fwd'])
    sx, sy, sz = cfg['shoulder']
    sh = Vector((s * sx, sy, sz))
    d1 = Vector((s * math.sin(a), -math.sin(f), -math.cos(a))).normalized()
    el = sh + d1 * cfg['upper_len']
    # forearm bends forward and in by the elbow angle
    axis = d1.cross(Vector((-s * 0.4, -1.0, 0))).normalized()
    d2 = (Quaternion(axis, math.radians(cfg['elbow_bend'])) @ d1).normalized()
    wr = el + d2 * cfg['fore_len']
    return sh, el, wr, d1, d2

def humanoid_bones(cfg, U):
    """21 bones shared by the humanoid cast, so clips can be shared. Heights from the character's cfg."""
    V = lambda *a: Vector(a) * U
    z = cfg['spine_z']
    t = [('hips', V(0, 0, z[0]), V(0, 0, z[1]), None), ('spine', V(0, 0, z[1]), V(0, 0, z[2]), 'hips'),
         ('chest', V(0, 0, z[2]), V(0, 0, z[3]), 'spine'), ('neck', V(0, 0, z[3]), V(0, 0, z[4]), 'chest'),
         ('head', V(0, 0, z[4]), V(0, 0, z[5]), 'neck')]
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(cfg, s)
        hb = wr + d2 * cfg['hand_len']; ft = hb + d2 * cfg['finger_len']
        x = cfg['leg_x']; hip, knee, ankle = cfg['leg_z']; tx, ty, tz = cfg['toe']
        cx, cy, cz = cfg['clavicle']
        t += [(f'clavicle_{S}', V(s * cx, cy, cz), sh * U, 'chest'), (f'upper_arm_{S}', sh * U, el * U, f'clavicle_{S}'),
              (f'forearm_{S}', el * U, wr * U, f'upper_arm_{S}'), (f'hand_{S}', wr * U, hb * U, f'forearm_{S}'),
              (f'fingers_{S}', hb * U, ft * U, f'hand_{S}'),
              (f'thigh_{S}', V(s * x, 0, hip), V(s * x, 0, knee), 'hips'), (f'shin_{S}', V(s * x, 0, knee), V(s * x, 0, ankle), f'thigh_{S}'),
              (f'foot_{S}', V(s * x, 0, ankle), V(s * (x + tx), ty, tz), f'shin_{S}')]
    return t

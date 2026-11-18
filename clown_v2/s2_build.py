"""Step 2a: clown in a rig-ready bind pose, every part tagged with its ramp and bones.
Same builder, primitives, colours and face as the approved clown (build.py + render3d.py);
changed only where a rig needs it: legs 1.1 units further apart (they overlapped), arms in an
A-pose with an elbow, hands open instead of clasped. Face features are kept apart for baking.
Run: python3 -I s2_build.py <outdir>   -> high.blend"""
import math, os, sys
# approved art scripts (build.py, render3d.py, palette.py); set APPROVED to override
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import bpy
from mathutils import Vector, Quaternion
# render3d swaps build.toon/flat/arc for the approved PBR versions when imported
import render3d
import build
assert build.toon is render3d.pbr
from build import ell, cone, cyl, torus, on_surface

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # leg centre x (approved 4.9: the two legs overlapped by 0.7 and would fuse)
    leg_x=6.0,
    # shoe centre x (approved 5.6, moved with the legs)
    shoe_x=6.6,
    # arm angle from vertical in the bind pose, degrees
    arm_out=50.0,
    # arm angle forward, degrees
    arm_fwd=8.0,
    # upper arm length (approved single arm was 12.4 in all)
    upper_len=6.4,
    # forearm length
    fore_len=6.0,
    # elbow bend in the bind pose, degrees
    elbow_bend=12.0,
    # faded painted smile: 'dots' (approved two cheek dots, painted flat) or 'arc' (one faint line under the frown)
    smile_paint='dots',
    # colour of the faded paint: red #E88A72 mixed about 60/40 with skin #D49A78
    smile_color='#DC8670',
    # cover the back of the head with curls (approved had one band of curls and bare skin above and below)
    back_hair=True,
    # heights of the extra curl rows (approved band is at 47.6; hat brim at 53.8, ruff top at 40.6)
    back_rows=(43.2, 45.4, 50.0, 52.2),
    # curl angles round the back of the head, degrees (0 = straight back)
    back_angles=(-80, -60, -40, -20, 0, 20, 40, 60, 80),
)
HC, HR = (0, 0, 47.2), (8.0, 7.4, 8.0)      # approved head centre and radii

def tag(o, ramp, bones, group='body', cuts=0):
    o['ramp'] = ramp; o['bones'] = bones; o['group'] = group
    if cuts: loops(o, cuts)
    return o

def res(segs, rings):
    """Segment count for the next primitives (approved build used 32 x 16 everywhere)."""
    build.CONFIG['segs'], build.CONFIG['rings'] = segs, rings

def loops(o, n):
    """n cuts across a cylinder or cone along its own axis, so it can bend (UVs are interpolated)."""
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data)
    zs = [v.co.z for v in bm.verts]; z0, z1 = min(zs), max(zs)
    for k in range(1, n + 1):
        z = z0 + (z1 - z0) * k / (n + 1)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    bm.to_mesh(o.data); bm.free()

def T(ramp):  return build.toon(ramp)
def F(hexc):  return build.flat(hexc)

def side(s): return 'L' if s > 0 else 'R'     # character faces -y, so +x is his left

def arm_points(s):
    c = CONFIG
    a, f = math.radians(c['arm_out']), math.radians(c['arm_fwd'])
    sh = Vector((s * 8.0, 0.6, 36.0))
    d1 = Vector((s * math.sin(a), -math.sin(f), -math.cos(a))).normalized()
    el = sh + d1 * c['upper_len']
    b = math.radians(c['elbow_bend'])                         # forearm bends forward and in
    axis = d1.cross(Vector((-s * 0.4, -1.0, 0))).normalized()   # turn the forearm toward front and body
    d2 = (Quaternion(axis, b) @ d1).normalized()
    wr = el + d2 * c['fore_len']
    return sh, el, wr, d1, d2

def body():
    c = CONFIG
    for s in (-1, 1):
        S = side(s)
        res(20, 10)
        tag(ell(T('SHOE'), (s * c['shoe_x'], -2.4, 1.8), (3.6, 6.2, 2.0), rot=(0, 0, s * 18)), 'SHOE', f'foot_{S},shin_{S}')
        res(16, 8)
        tag(cyl(T('HAT'), (s * c['leg_x'], 0, 4.4), 2.1, 3.0), 'HAT', f'shin_{S},foot_{S}', cuts=1)
        res(24, 12)
        tag(cyl(T('OCHRE'), (s * c['leg_x'], 0, 13.0), 5.6, 17.0, scale=(1, 0.9, 1)), 'OCHRE', f'hips,thigh_{S},shin_{S}', cuts=9)
    res(28, 14)
    tag(ell(T('OCHRE'), (0, 0, 20.5), (11.8, 7.4, 4.0)), 'OCHRE', 'hips')
    res(32, 16)
    o = cone(T('WARM_WHITE'), (0, 0, 21.5), (0, 0, 37.6), 13.6, 7.4); o.scale = (1, 0.72, 1)
    tag(o, 'WARM_WHITE', 'hips,spine,chest', cuts=8)
    res(10, 6)
    z = 34.6; r = 7.4 + (37.6 - z) / 16.1 * 6.2
    tag(ell(T('RED'), (0, -r * 0.72 - 0.3, z), (1.5, 1.0, 1.5)), 'RED', 'chest')
    for s in (-1, 1):
        S = side(s)
        sh, el, wr, d1, d2 = arm_points(s)
        res(20, 10)
        tag(cone(T('WARM_WHITE'), sh, el, 3.6, 3.9), 'WARM_WHITE', f'chest,clavicle_{S},upper_arm_{S},forearm_{S}', cuts=3)
        tag(ell(T('WARM_WHITE'), el, (3.9, 3.9, 3.9)), 'WARM_WHITE', f'upper_arm_{S},forearm_{S}')
        tag(cone(T('WARM_WHITE'), el, wr, 3.9, 4.3), 'WARM_WHITE', f'upper_arm_{S},forearm_{S},hand_{S}', cuts=3)
        res(14, 8)
        # open hand hanging from the cuff: palm faces the leg, thumb forward
        pc = wr + d2 * 1.6
        p = ell(T('SKIN'), pc, (1.5, 2.2, 2.3))
        p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d2)
        tag(p, 'SKIN', f'forearm_{S},hand_{S}')
        base = pc + d2 * 1.6
        res(10, 6)
        for k, dy in enumerate((-1.5, -0.5, 0.5, 1.5)):
            q0 = base + Vector((0, dy * 0.95, 0))
            q1 = q0 + d2 * (2.4 - abs(dy) * 0.35)
            capsule(T('SKIN'), q0, q1, 0.55, f'hand_{S},fingers_{S}')
        t0 = pc + Vector((0, -1.6, 0.4)); t1 = t0 + (d2 * 0.6 + Vector((0, -1.0, 0))).normalized() * 1.9
        capsule(T('SKIN'), t0, t1, 0.6, f'hand_{S}')
    res(16, 10)
    tag(torus(T('PAINT'), (0, 0, 38.6), 8.0, 2.0, scale=(1, 0.85, 1)), 'PAINT', 'chest,neck')
    for i in range(20):
        a = 2 * math.pi * i / 20; rp = 'PAINT' if i % 2 else 'WARM_WHITE'
        tag(ell(T(rp), (9.6 * math.cos(a), 9.6 * 0.85 * math.sin(a), 38.6), (2.0, 2.0, 2.3)), rp, 'chest,neck')
    # head parts that stay geometry (in the body shell): ears, hair, nose, hat
    res(12, 8)
    for s in (-1, 1):
        tag(ell(T('SKIN'), (s * 8.0, 0.2, 46.7), (1.2, 1.6, 2.0)), 'SKIN', 'head')
        tag(ell(T('RUST_HAIR'), (s * 7.4, 1.2, 49.8), (2.7, 4.6, 3.3)), 'RUST_HAIR', 'head')
        for k, ang in enumerate(range(-30, 60, 28)):
            a = math.radians(ang); rp = 'RUST_HAIR' if k % 2 else 'RUST_DARK'
            tag(ell(T(rp), (s * (7.9 + math.sin(a)), 1.2 + 3.6 * math.cos(a), 49.5 + 1.6 * math.sin(a)), (1.1, 1.6, 2.4)), rp, 'head')
    for k, ang in enumerate(range(-70, 71, 20)):
        t = math.radians(ang); rp = 'RUST_HAIR' if k % 2 else 'RUST_DARK'
        tag(ell(T(rp), (7.0 * math.sin(t), 5.6 * math.cos(t) + 0.6, 47.6), (2.0, 1.6, 2.6)), rp, 'head')
    if CONFIG['back_hair']:
        back_hair()
    res(16, 10)
    tag(ell(T('RED'), (0, on_surface(HC, HR, 0, 45.0, 0.9), 45.0), (1.8, 1.7, 1.7)), 'RED', 'head')
    res(32, 12)
    tag(cyl(T('HAT'), (0, 0, 53.8), 9.4, 1.0, rot=(4, 0, 0)), 'HAT', 'head')
    tag(ell(T('HAT'), (0, 0.4, 56.2), (6.1, 5.6, 3.3)), 'HAT', 'head')
    tag(cyl(T('HAT'), (0, 0.3, 54.6), 6.3, 0.8), 'HAT', 'head')
    # the head itself: its own object with a face texture
    res(32, 16)
    tag(ell(T('SKIN'), HC, HR), 'SKIN', 'head', group='head')

def back_hair():
    """Rows of curls over the back of the head, same curl shape and two hair ramps as the approved band."""
    for r, z in enumerate(CONFIG['back_rows']):
        f = math.sqrt(max(0.0, 1 - ((z - HC[2]) / HR[2]) ** 2))
        for k, ang in enumerate(CONFIG['back_angles']):
            t = math.radians(ang); rp = 'RUST_HAIR' if (k + r) % 2 else 'RUST_DARK'
            pos = (HR[0] * f * 0.93 * math.sin(t), HR[1] * f * 0.93 * math.cos(t) + 0.6, z)
            tag(ell(T(rp), pos, (2.0, 1.6, 2.4)), rp, 'head')

def capsule(mat, p, q, r, bones):
    o = cone(mat, p, q, r, r); tag(o, 'SKIN', bones)
    tag(ell(mat, p, (r, r, r)), 'SKIN', bones); tag(ell(mat, q, (r, r, r)), 'SKIN', bones)

# ---------------------------------------------------------------- face expressions (baked, not shipped as geometry)
EXPR = ['sad', 'smile', 'startle', 'wince']

def face(expr):
    """Approved face (clown() lines 168-179) for 'sad'; the painted parts (white under the eyes,
    red smile corners, nose) never change, only eyes, lids, brows and the real mouth move."""
    for s in (-1, 1):
        x = s * 3.1
        # paint under the eye
        build.ell(F('#F4F4F2'), (x, on_surface(HC, HR, x, 45.9, -0.15), 45.9), (1.7, 0.6, 1.2))['paint'] = True
        if expr == 'wince':                                                                      # shut: a dark lash line
            build.arc(F('#1E1714'), [(s * xx, on_surface(HC, HR, s * xx, zz, 0.3), zz)
                                     for xx, zz in ((2.0, 47.2), (3.1, 46.8), (4.2, 47.2))], (0.5, 0.4, 0.4))
            ell(T('SKIN_LID'), (x, on_surface(HC, HR, x, 47.6, 0.35), 47.6), (1.6, 0.6, 0.9))
        else:
            ey = dict(sad=(1.0, 1.1), smile=(1.0, 1.0), startle=(1.25, 1.5))[expr]
            ell(F('#1E1714'), (x, on_surface(HC, HR, x, 47.0, 0.25), 47.0), (ey[0], 0.4, ey[1]))
            lid_z = dict(sad=47.9, smile=48.4, startle=48.9)[expr]
            lid_h = dict(sad=0.85, smile=0.55, startle=0.4)[expr]
            ell(T('SKIN_LID'), (x, on_surface(HC, HR, x, lid_z, 0.5), lid_z), (1.6, 0.6, lid_h), rot=(0, s * (15 if expr == 'sad' else 0), 0))
            ell(F('#F4F4F2'), (x - s * 0.4, on_surface(HC, HR, x, 46.7, 0.45), 46.7), (0.45, 0.3, 0.45))
        bz, brot = dict(sad=(50.0, 25), smile=(50.4, -12), startle=(51.3, 0), wince=(49.3, -28))[expr]
        bx = s * 3.3
        ell(F('#3D332D'), (bx, on_surface(HC, HR, bx, bz, 0.25), bz), (2.4, 0.9, 0.6), rot=(0, s * brot, 0))
        if CONFIG['smile_paint'] == 'dots':
            ell(F('#E88A72'), (s * 3.4, on_surface(HC, HR, s * 3.4, 43.2, 0.15), 43.2), (0.7, 0.35, 0.6))['paint'] = True
    if CONFIG['smile_paint'] == 'arc':
        # one faint painted smile, wider than the real mouth and curving up past its corners
        pts = ((-4.6, 44.1), (-4.0, 42.9), (-3.1, 41.9), (-1.7, 41.2), (0, 41.0), (1.7, 41.2), (3.1, 41.9), (4.0, 42.9), (4.6, 44.1))
        build.arc(F(CONFIG['smile_color']), [(x, on_surface(HC, HR, x, z, 0.15), z) for x, z in pts], (0.45, 0.4, 0.45))['paint'] = True
    mouth = dict(sad=((-2.2, 41.9), (-1.1, 42.6), (0, 42.8), (1.1, 42.6), (2.2, 41.9)),
                 smile=((-2.4, 42.9), (-1.2, 42.2), (0, 42.0), (1.2, 42.2), (2.4, 42.9)),
                 wince=((-2.0, 42.3), (-1.0, 42.4), (0, 42.4), (1.0, 42.4), (2.0, 42.3)))
    if expr == 'startle':
        ell(F('#7A2E26'), (0, on_surface(HC, HR, 0, 42.2, 0.2), 42.2), (1.0, 0.4, 1.3))
    else:
        build.arc(F('#7A2E26'), [(x, on_surface(HC, HR, x, z, 0.2), z) for x, z in mouth[expr]], (0.6, 0.4, 0.45))

def main(out):
    os.makedirs(out, exist_ok=True)
    build.ROOT = build.reset()
    body()
    bpy.context.view_layer.update()
    res(32, 16)
    for e in EXPR:
        coll = bpy.data.collections.new('face_' + e); bpy.context.scene.collection.children.link(coll)
        before = set(bpy.data.objects)
        face(e)
        for o in set(bpy.data.objects) - before:
            for c in list(o.users_collection): c.objects.unlink(o)
            coll.objects.link(o); o['group'] = 'face_' + e
        coll.hide_render = True
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'high.blend'))
    n = sum(1 for o in bpy.data.objects if o.get('group') in ('body', 'head'))
    print('PASS parts tagged', n, 'parts; untagged meshes:',
          [o.name for o in bpy.data.objects if o.type == 'MESH' and not o.get('group')])

if __name__ == '__main__':
    main(sys.argv[1])

"""Step 3: armature from the build's joint positions, weights from each part's tagged bones,
three clips (idle, walk, slap) keyed at Muybridge photograph times, GLB export. Prints PASS/FAIL gates.
Run: python3 -I s3_rig.py <dir with low.blend>  -> clown_v2.glb, rigged.blend"""
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import bpy
from mathutils import Vector, Matrix
import s2_build as B

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # metres per approved unit (must match s2_shell)
    unit=0.03,
    # weight blend width along a bone chain at joints (approved units)
    blend=2.5,
    # radial falloff that picks the near side (approved units)
    radial=8.0,
    # frames per second the clips are sampled at
    fps=30,
    # Muybridge series 1 (walking, ordinary speed): seconds between photographs
    walk_dt=0.083,
    # walk intervals per full two-step cycle (the plate shows one step in 7 photographs)
    walk_n=12,
    # Muybridge series 32 (striking a blow): seconds between photographs
    slap_dt=0.112,
    # photographs on the slap plate
    slap_n=12,
    # idle loop length in seconds (no plate: breathing)
    idle_len=2.0,
    # walk: thigh swing either side, degrees
    walk_thigh=22.0,
    # walk: largest knee bend (mid-swing), degrees
    walk_knee=40.0,
    # walk: arm swing either side, degrees
    walk_arm=14.0,
    # walk: hip bob, approved units
    walk_bob=0.45,
)
D = sys.argv[1]
U = CONFIG['unit']
G = []
def gate(name, ok, info=''):
    G.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

def V(*a): return Vector(a) * U

def bone_table():
    t = [('hips', V(0, 0, 17), V(0, 0, 23), None), ('spine', V(0, 0, 23), V(0, 0, 30), 'hips'),
         ('chest', V(0, 0, 30), V(0, 0, 37), 'spine'), ('neck', V(0, 0, 37), V(0, 0, 40), 'chest'),
         ('head', V(0, 0, 40), V(0, 0, 57), 'neck')]
    for s in (-1, 1):
        S = B.side(s)
        sh, el, wr, d1, d2 = B.arm_points(s)
        hb = wr + d2 * 3.2; ft = hb + d2 * 2.4
        x = B.CONFIG['leg_x']
        t += [(f'clavicle_{S}', V(s * 2.0, 0.3, 35.5), sh * U, 'chest'), (f'upper_arm_{S}', sh * U, el * U, f'clavicle_{S}'),
              (f'forearm_{S}', el * U, wr * U, f'upper_arm_{S}'), (f'hand_{S}', wr * U, hb * U, f'forearm_{S}'),
              (f'fingers_{S}', hb * U, ft * U, f'hand_{S}'),
              (f'thigh_{S}', V(s * x, 0, 19), V(s * x, 0, 10.5), 'hips'), (f'shin_{S}', V(s * x, 0, 10.5), V(s * x, 0, 3.4), f'thigh_{S}'),
              (f'foot_{S}', V(s * x, 0, 3.4), V(s * (x + 0.8), -6.5, 1.2), f'shin_{S}')]
    return t

def seg_terms(P, a, b):
    """axial distance outside the segment, radial distance to its line (arrays)."""
    ab = b - a; L = np.linalg.norm(ab); u = ab / L
    t = (P - a) @ u
    ax = np.maximum(0, np.maximum(-t, t - L))
    rad = np.linalg.norm((P - a) - np.outer(t, u), axis=1)
    return ax, rad

def weights(obj, bones, part_bones, part_of_vert):
    P = np.array([v.co[:] for v in obj.data.vertices])
    names = [b[0] for b in bones]; seg = {b[0]: (np.array(b[1][:]), np.array(b[2][:])) for b in bones}
    W = np.zeros((len(P), len(names)))
    sig, rho = CONFIG['blend'] * U, CONFIG['radial'] * U
    for pi, bl in enumerate(part_bones):
        m = part_of_vert == pi
        if not m.any(): continue
        for bn in bl.split(','):
            ax, rad = seg_terms(P[m], *seg[bn])
            W[m, names.index(bn)] = np.exp(-(ax / sig) ** 2 - (rad / rho) ** 2) + 1e-6
    # keep the 4 largest, normalise
    idx = np.argsort(-W, 1)[:, 4:]
    np.put_along_axis(W, idx, 0, 1)
    W /= W.sum(1, keepdims=True)
    for n in names:
        if n not in obj.vertex_groups: obj.vertex_groups.new(name=n)
    for j, n in enumerate(names):
        vg = obj.vertex_groups[n]
        nz = np.nonzero(W[:, j] > 1e-4)[0]
        for i in nz: vg.add([int(i)], float(W[i, j]), 'REPLACE')
    return W

# ---------------------------------------------------------------- posing helpers (armature space, faces -y)
ARM = None
def P(n): return ARM.pose.bones[n]
def upd(): bpy.context.view_layer.update()
def rotw(n, axis, deg):
    upd(); pb = P(n); M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, Vector(axis)) @ Matrix.Translation(-h) @ M
def aim(n, d):
    upd(); pb = P(n); cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(d).normalized()); M = pb.matrix.copy(); h = M.translation.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M
def move(n, d):
    upd(); pb = P(n); M = pb.matrix.copy(); M.translation += Vector(d) * U; pb.matrix = M
def rest():
    for pb in ARM.pose.bones: pb.matrix_basis = Matrix.Identity(4)

def arms_down(s, out_deg):
    """Bring an arm from the 50-degree bind pose to out_deg from vertical (rotation about forward axis)."""
    S = B.side(s); rotw(f'upper_arm_{S}', (0, 1, 0), s * (B.CONFIG['arm_out'] - out_deg))

def clasp():
    """Approved off-stage pose: hands brought together low in front."""
    for s in (-1, 1):
        S = B.side(s)
        aim(f'upper_arm_{S}', (s * 0.15, -0.55, -0.82))
        aim(f'forearm_{S}', (-s * 0.62, -0.62, -0.1))
        aim(f'hand_{S}', (-s * 0.7, -0.35, -0.6))

def legs(crouch):
    """Knees bend by crouch (0..1), hips drop, feet stay roughly planted."""
    for s in (-1, 1):
        S = B.side(s)
        rotw(f'thigh_{S}', (1, 0, 0), -14 * crouch); rotw(f'shin_{S}', (1, 0, 0), 28 * crouch); rotw(f'foot_{S}', (1, 0, 0), -14 * crouch)
    move('hips', (0, 0, -1.3 * crouch))

# ---------------------------------------------------------------- clips
def pose_idle(t):
    p = 2 * math.pi * t / CONFIG['idle_len']
    move('hips', (0, 0, -0.12 * (1 - math.cos(p))))
    rotw('spine', (1, 0, 0), 0.8 * math.sin(p)); rotw('chest', (1, 0, 0), 1.5 * math.sin(p))
    clasp()
    rotw('neck', (1, 0, 0), 6); rotw('head', (0, 0, 1), -12 + 1.5 * math.sin(p + 1)); rotw('head', (1, 0, 0), 9 + 1.2 * math.sin(p))   # + tips the face down

def pose_walk(t):
    c = CONFIG; T = c['walk_dt'] * c['walk_n']; p = 2 * math.pi * t / T
    move('hips', (0, 0, c['walk_bob'] * math.cos(2 * p) - c['walk_bob']))
    rotw('hips', (0, 0, 1), 5 * math.sin(p))
    rotw('chest', (0, 0, 1), -8 * math.sin(p))
    rotw('head', (0, 0, 1), 3 * math.sin(p))
    for s, ph in ((1, p), (-1, p + math.pi)):
        S = B.side(s)
        sw = c['walk_thigh'] * math.sin(ph)                    # + = thigh forward
        kn = 6 + c['walk_knee'] * max(0.0, math.cos(ph)) ** 1.5  # most bend mid-swing
        rotw(f'thigh_{S}', (1, 0, 0), -sw)
        rotw(f'shin_{S}', (1, 0, 0), kn)
        rotw(f'foot_{S}', (1, 0, 0), 0.8 * (sw - kn))
        arms_down(s, 44)
        rotw(f'upper_arm_{S}', (1, 0, 0), c['walk_arm'] * math.sin(ph))   # arm opposite its own leg
        rotw(f'forearm_{S}', (1, 0, 0), -10 - 6 * max(0.0, -math.sin(ph)))

# slap photographs (series 32): chest yaw, spine lean, crouch, right upper-arm and forearm directions
SLAP = [
    (0, 0, 0.25, (-0.55, -0.45, -0.70), (-0.10, -0.85, -0.50)),   # 1 guard
    (-18, -2, 0.30, (-0.80, 0.35, 0.50), (-0.25, 0.25, 1.00)),    # 2 wind-up, hand high behind
    (-8, 2, 0.35, (-0.95, -0.10, 0.30), (-0.45, -0.75, 0.40)),    # 3 swing starts
    (22, 9, 0.45, (-0.25, -1.00, 0.08), (0.25, -1.00, 0.00)),     # 4 strike
    (32, 14, 0.55, (0.10, -1.00, -0.05), (0.40, -0.95, -0.10)),   # 5 follow through
    (34, 15, 0.55, (0.12, -1.00, -0.08), (0.42, -0.92, -0.15)),   # 6 hold
    (32, 14, 0.55, (0.08, -1.00, -0.12), (0.38, -0.92, -0.22)),   # 7 hold
    (25, 11, 0.50, (-0.10, -1.00, -0.25), (0.20, -0.95, -0.30)),  # 8 recover
    (15, 7, 0.40, (-0.35, -0.85, -0.45), (0.00, -0.90, -0.45)),   # 9
    (7, 3, 0.32, (-0.50, -0.60, -0.62), (-0.08, -0.88, -0.48)),   # 10
    (2, 1, 0.27, (-0.55, -0.48, -0.69), (-0.10, -0.86, -0.50)),   # 11
    (0, 0, 0.25, (-0.55, -0.45, -0.70), (-0.10, -0.85, -0.50)),   # 12 guard
]
def pose_slap_key(i):
    yaw, lean, cr, ua, fa = SLAP[i]
    legs(cr)
    rotw('spine', (1, 0, 0), -lean * 0.5); rotw('chest', (1, 0, 0), -lean * 0.5)
    rotw('spine', (0, 0, 1), yaw * 0.4); rotw('chest', (0, 0, 1), yaw * 0.6)
    rotw('head', (0, 0, 1), -yaw * 0.5)
    aim('upper_arm_R', ua); aim('forearm_R', fa)
    aim('upper_arm_L', (0.55, -0.45, -0.70)); aim('forearm_L', (0.10, -0.85, -0.50))   # left stays in guard

def key_all(frame):
    for pb in ARM.pose.bones:
        pb.keyframe_insert('rotation_quaternion', frame=frame)
        pb.keyframe_insert('location', frame=frame)

def make_action(name, times, poser):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    ARM.animation_data.action = act
    for i, t in enumerate(times):
        rest(); poser(i, t); key_all(1 + t * CONFIG['fps'])
    tr = ARM.animation_data.nla_tracks.new(); tr.name = name
    tr.strips.new(name, 1, act)
    ARM.animation_data.action = None
    return act

def export_glb(path):
    """The one export used by the build and by the mutation checks."""
    bpy.ops.object.select_all(action='DESELECT')
    for n in ('clown_rig', 'body', 'head'): bpy.data.objects[n].select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
                              export_influence_nb=4, export_anim_slide_to_zero=True, export_reset_pose_bones=True,
                              export_force_sampling=True, export_vertex_color='NONE', export_attributes=True)

def main():
    global ARM
    bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'low.blend'))
    sc = bpy.context.scene; sc.render.fps = CONFIG['fps']
    body, head = bpy.data.objects['body'], bpy.data.objects['head']
    bones = bone_table()
    arm = bpy.data.armatures.new('clown_rig'); ARM = bpy.data.objects.new('clown_rig', arm)
    sc.collection.objects.link(ARM); bpy.context.view_layer.objects.active = ARM
    bpy.ops.object.mode_set(mode='EDIT')
    for n, h, t, par in bones:
        eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t
        if par: eb.parent = arm.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in ARM.pose.bones: pb.rotation_mode = 'QUATERNION'
    gate('armature', len(bones) <= 30, f'{len(bones)} deform bones')
    # weights
    part_bones = json.loads(body['part_bones'])
    fpart = np.zeros(len(body.data.polygons), np.int32); body.data.attributes['part'].data.foreach_get('value', fpart)
    pv = np.full(len(body.data.vertices), -1, np.int32)
    for p in body.data.polygons:
        for v in p.vertices: pv[v] = fpart[p.index]
    Wb = weights(body, bones, part_bones, pv)
    Wh = weights(head, bones, ['head'], np.zeros(len(head.data.vertices), np.int32))
    inf = max(int((Wb > 0).sum(1).max()), int((Wh > 0).sum(1).max()))
    unw = int((Wb.sum(1) < 0.999).sum() + (Wh.sum(1) < 0.999).sum())
    gate('weights: every vertex weighted, <= 4 influences', unw == 0 and inf <= 4, f'unweighted {unw}, max influences {inf}')
    for o in (body, head):
        o.parent = ARM
        md = o.modifiers.new('rig', 'ARMATURE'); md.object = ARM
    # clips
    ARM.animation_data_create()
    c = CONFIG
    wt = [i * c['walk_dt'] for i in range(c['walk_n'] + 1)]
    st = [i * c['slap_dt'] for i in range(c['slap_n'])]
    it = [i * c['idle_len'] / 8 for i in range(9)]
    make_action('idle', it, lambda i, t: pose_idle(t))
    make_action('walk', wt, lambda i, t: pose_walk(t))
    make_action('slap', st, lambda i, t: pose_slap_key(i))
    rest()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'rigged.blend'))
    out = os.path.join(D, 'clown_v2.glb')
    export_glb(out)
    import struct
    with open(out, 'rb') as f:
        f.read(12); ln, _ = struct.unpack('<II', f.read(8)); j = json.loads(f.read(ln))
    anims = {a['name']: a for a in j.get('animations', [])}
    def dur(a):
        acc = j['accessors'][a['samplers'][0]['input']]; return acc['max'][0] - acc['min'][0]
    durs = {k: round(dur(a), 3) for k, a in anims.items()}
    exp = dict(idle=c['idle_len'], walk=c['walk_dt'] * c['walk_n'], slap=c['slap_dt'] * (c['slap_n'] - 1))
    ok = set(anims) == set(exp) and all(abs(durs[k] - exp[k]) <= 1.01 / c['fps'] for k in exp)
    gate('GLB: 3 clips, durations = photographs x interval', ok, f'{durs} expected {dict((k, round(v, 3)) for k, v in exp.items())}')
    gate('GLB size', True, f'{os.path.getsize(out) / 1024:.0f} KB, skins {len(j.get("skins", []))}, meshes {len(j["meshes"])}')
    json.dump(G, open(os.path.join(D, 'gates_step3.json'), 'w'), indent=1)

if __name__ == '__main__':
    main()

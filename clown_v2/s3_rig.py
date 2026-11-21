"""Step 3: armature from the character's joint positions, weights from each part's tagged bones,
three clips (idle, walk, slap) keyed at Muybridge photograph times, GLB export. Prints PASS/FAIL gates.
The character (CHAR, default clown) supplies bones, idle pose and walk style (chars/<name>.py); walk and slap
mechanics are shared (posekit.py).
Run: CHAR=clown python3 -I s3_rig.py <dir with low.blend>  -> clown_v2.glb, rigged.blend"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import bpy
from chars.common import current
import posekit as K
C = current()

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
    # Muybridge series 1 (walking, ordinary speed): seconds between photographs (0.083 on the plate; exactly 1/12 so a
    # cycle is 30 whole frames and its last frame is its first: the export samples whole frames)
    walk_dt=1 / 12,
    # walk intervals per full two-step cycle (the plate shows one step in 7 photographs)
    walk_n=12,
    # Muybridge series 32 (striking a blow): seconds between photographs
    slap_dt=0.112,
    # photographs on the slap plate
    slap_n=12,
    # idle loop length in seconds (no plate: breathing)
    idle_len=2.0,
)
D = sys.argv[1]
U = CONFIG['unit']
G = []
def gate(name, ok, info=''):
    G.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

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

def key_all(frame):
    for pb in ARM.pose.bones:
        pb.keyframe_insert('rotation_quaternion', frame=frame)
        pb.keyframe_insert('location', frame=frame)

def make_action(name, times, poser):
    # every pose is built with no action and the NLA off: the strips of the clips made earlier (idle, then walk) are
    # evaluated on view-layer updates inside the posers and leaked into these keys (F17: walk arms 59-89 deg off at
    # the loop seam, the same walk time posed twice came out 23-27 deg apart)
    ARM.animation_data.action = None
    ARM.animation_data.use_nla = False
    poses = []
    for i, t in enumerate(times):
        K.rest(); poser(i, t); K.upd()
        poses.append([(pb.rotation_quaternion.copy(), pb.location.copy()) for pb in ARM.pose.bones])
    act = bpy.data.actions.new(name); act.use_fake_user = True
    ARM.animation_data.action = act
    prev = None
    for t, pose in zip(times, poses):
        for k, (pb, (q, loc)) in enumerate(zip(ARM.pose.bones, pose)):
            # one quaternion sign from key to key, so the curves between keys take the short way round
            if prev is not None and prev[k].dot(q) < 0:
                q.negate()
            pb.rotation_quaternion = q; pb.location = loc
        prev = [q for q, _ in pose]
        key_all(1 + t * CONFIG['fps'])
    ARM.animation_data.use_nla = True
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
    bones = C.bones(U)
    arm = bpy.data.armatures.new('clown_rig'); ARM = bpy.data.objects.new('clown_rig', arm)
    sc.collection.objects.link(ARM); bpy.context.view_layer.objects.active = ARM
    bpy.ops.object.mode_set(mode='EDIT')
    for n, h, t, par in bones:
        eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t
        if par: eb.parent = arm.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in ARM.pose.bones: pb.rotation_mode = 'QUATERNION'
    K.ARM, K.U = ARM, U
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
    make_action('idle', it, lambda i, t: C.idle(t, c['idle_len']))
    make_action('walk', wt, lambda i, t: K.walk(C.CONFIG, c, t, C.WALK))
    make_action('slap', st, lambda i, t: K.slap_key(getattr(C, 'SLAP', K.SLAP), i))
    K.rest()
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

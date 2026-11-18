"""Step 3 checks: per clip, sample frames and measure edge stretch and whether parts that touch at rest
come apart (a gap = torn look). Also renders a pose sheet (3/4 view) for each clip.
Run: python3 -I s3_check.py <dir with rigged.blend> [--clips=idle,walk] [--sheet]"""
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
# approved art scripts (build.py, render3d.py, palette.py); set APPROVED to override
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
import numpy as np
import bpy
from chars.common import current
C = current()
from mathutils.bvhtree import BVHTree

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # edge length ratio (posed / rest) above which an edge counts as overstretched
    stretch_max=1.6,
    # frames sampled per clip
    samples=8,
)
D = sys.argv[1]
G = []
def gate(name, ok, info=''):
    G.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'rigged.blend'))
sc = bpy.context.scene
arm = bpy.data.objects['clown_rig']; body = bpy.data.objects['body']
fpart = np.zeros(len(body.data.polygons), np.int32); body.data.attributes['part'].data.foreach_get('value', fpart)
edges = np.array([e.vertices[:] for e in body.data.edges])
part_bones = json.loads(body['part_bones'])

def coords():
    dg = bpy.context.evaluated_depsgraph_get(); ev = body.evaluated_get(dg); me = ev.to_mesh()
    a = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', a); ev.to_mesh_clear()
    return a.reshape(-1, 3)

def part_trees(co):
    trees = {}
    for pi in np.unique(fpart):
        polys = [p for p in body.data.polygons if fpart[p.index] == pi]
        vids = sorted({v for p in polys for v in p.vertices}); remap = {v: i for i, v in enumerate(vids)}
        trees[pi] = BVHTree.FromPolygons([co[v].tolist() for v in vids], [[remap[v] for v in p.vertices] for p in polys])
    return trees

arm.animation_data.action = None
for t in arm.animation_data.nla_tracks: t.mute = True
from mathutils import Matrix
for pb in arm.pose.bones: pb.matrix_basis = Matrix.Identity(4)
sc.frame_set(1); bpy.context.view_layer.update()
rest = coords()
orig = np.array([v.co[:] for v in body.data.vertices])
gate('rest pose = bind mesh', np.abs(rest - orig).max() < 1e-5, f'max {np.abs(rest - orig).max()*1000:.3f} mm')
rl = np.linalg.norm(rest[edges[:, 0]] - rest[edges[:, 1]], axis=1)
trees0 = part_trees(rest)
pairs = []
keys = sorted(trees0)
for i, a in enumerate(keys):
    for b in keys[i + 1:]:
        if trees0[a].overlap(trees0[b]): pairs.append((a, b))
print('touching pairs at rest:', len(pairs))

def components(edges_, nodes):
    par = {n: n for n in nodes}
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for a, b in edges_: par[f(a)] = f(b)
    return len({f(n) for n in nodes})

c0 = components(pairs, keys)
print('part groups at rest:', c0)
vpart = np.zeros(len(body.data.vertices), np.int32)
for p_ in body.data.polygons:
    for v in p_.vertices: vpart[v] = fpart[p_.index]
epart = vpart[edges[:, 0]]
CLIPS = next((a.split('=')[1].split(',') for a in sys.argv if a.startswith('--clips=')), ['idle', 'walk', 'slap'])
for name in CLIPS:
    act = bpy.data.actions[name]; arm.animation_data.action = act
    f0, f1 = act.frame_range
    worst_s, worst_part, p999, worst_c, lost = 0, '', 0, c0, []
    head_up = -1.0
    for k in range(CONFIG['samples']):
        f = f0 + (f1 - f0) * k / (CONFIG['samples'] - 1)
        sc.frame_set(int(f), subframe=f - int(f)); bpy.context.view_layer.update()
        co = coords()
        r = np.linalg.norm(co[edges[:, 0]] - co[edges[:, 1]], axis=1) / np.maximum(rl, 1e-9)
        p999 = max(p999, float(np.percentile(r, 99.9)))
        if r.max() > worst_s: worst_s = float(r.max()); worst_part = part_bones[epart[r.argmax()]]
        tr = part_trees(co)
        still = [(a, b) for a, b in pairs if tr[a].overlap(tr[b])]
        cnum = components(still, keys)
        if cnum > c0:
            # which parts lost every contact
            lost += [part_bones[a] for a in keys if not any(a in pr for pr in still) and any(a in pr for pr in pairs)]
        worst_c = max(worst_c, cnum)
        if name == 'idle' and C.CHECK.get('idle_head_down'):
            # (bug) idle head tipped back: the off-stage pose has the head down, so the head bone leans forward (-y)
            hd = arm.pose.bones['head']; lean = ((hd.tail - hd.head).normalized()).y
            head_up = max(head_up, lean)
    gate(f'{name}: edge stretch p99.9 <= {CONFIG["stretch_max"]}', p999 <= CONFIG['stretch_max'],
         f'p99.9 {p999:.2f}, max {worst_s:.2f} on part [{worst_part}]')
    if name == 'idle' and C.CHECK.get('idle_head_down'):
        gate('idle: head tipped forward (looks down) on every sample', head_up < -0.1, f'least forward lean y = {head_up:.2f}')
    gate(f'{name}: nothing floats free (part groups stay {c0})', worst_c == c0, f'max groups {worst_c}; parts with no contact: {sorted(set(lost))[:5]}')

if '--sheet' in sys.argv:
    import render3d
    from PIL import Image
    for o in sc.objects:
        if o.type == 'LIGHT': bpy.data.objects.remove(o)
    piv = bpy.data.objects.new('pivot', None); sc.collection.objects.link(piv); arm.parent = piv
    piv.scale = (1 / 0.03,) * 3
    cam = bpy.data.cameras.new('cam'); co_ = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co_); sc.camera = co_
    render3d.stage('clown')
    sc.cycles.samples = 10; sc.render.resolution_x = sc.render.resolution_y = 320; sc.cycles.device = 'CPU'
    for name, yaw in (('idle', -35), ('walk', -70), ('slap', -35)):
        piv.rotation_euler = (0, 0, math.radians(yaw))
        act = bpy.data.actions[name]; arm.animation_data.action = act
        f0, f1 = act.frame_range; frames = []
        for k in range(6):
            f = f0 + (f1 - f0) * k / 5
            sc.frame_set(int(round(f)))
            p = f'/tmp/sheet_{name}_{k}.png'; sc.render.filepath = p
            bpy.ops.render.render(write_still=True); render3d.backdrop(p, 'clown'); frames.append(Image.open(p).convert('RGB'))
        s = Image.new('RGB', (320 * 6, 320))
        for k, im in enumerate(frames): s.paste(im, (320 * k, 0))
        s.save(os.path.join(D, f'pose_sheet_{name}.jpg'), quality=85)
        frames[0].save(os.path.join(D, f'{name}.gif'), save_all=True, append_images=frames[1:] + frames[-2:0:-1] if name == 'idle' else frames[1:],
                       duration=int(1000 * (f1 - f0) / 5 / 30), loop=0)
json.dump(G, open(os.path.join(D, 'gates_step3_deform.json'), 'w'), indent=1)

"""Static model gates on a rigged .blend. Each gate is a rule that must always hold; the ones marked
(bug) were added after a bug in this build. Run: python3 -I check_model.py <rigged.blend> [face_atlas.png]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import bpy

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # allowed character height, metres
    height_min=1.70,
    # allowed character height, metres
    height_max=1.90,
    # feet must touch the floor within this, metres
    floor_tol=0.01,
    # head mesh centre must lie within this distance of the head bone, metres
    head_tol=0.03,
    # face faces smaller than this area count as degenerate, square metres
    degen_area=1e-10,
    # most bone influences per vertex (three.js limit)
    max_influences=4,
    # draw-call budget per character before the outline hull
    max_materials=2,
    # two face cells must differ by at least this mean colour step (0..255)
    cell_diff=2.0,
)
G = []
def gate(name, ok, info=''):
    G.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

def seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared)); return (p - (a + ab * t)).length

def main(blend, atlas):
    c = CONFIG
    bpy.ops.wm.open_mainfile(filepath=blend)
    arm = bpy.data.objects['clown_rig']; body = bpy.data.objects['body']; head = bpy.data.objects['head']
    meshes = [body, head]
    # (bug) three.js strips dots from node names, so game code would look up the wrong name
    dotted = [b.name for b in arm.data.bones if '.' in b.name]
    gate('bone names have no dots', not dotted, dotted[:5])
    # (bug) bake step left meshes hidden from render
    hidden = [o.name for o in meshes if o.hide_render or o.hide_viewport or o.hide_get()]
    gate('every mesh visible', not hidden, hidden)
    # weights
    worst_inf, unweighted = 0, 0
    for o in meshes:
        for v in o.data.vertices:
            ws = [g.weight for g in v.groups if g.weight > 0]
            worst_inf = max(worst_inf, len(ws))
            if abs(sum(ws) - 1) > 1e-3: unweighted += 1
    gate('every vertex weighted (sum 1)', unweighted == 0, f'{unweighted} vertices off')
    gate(f'<= {c["max_influences"]} influences per vertex', worst_inf <= c['max_influences'], worst_inf)
    # geometry
    co = np.concatenate([np.array([o.matrix_world @ v.co for v in o.data.vertices]) for o in meshes])
    gate('coordinates finite', np.isfinite(co).all())
    h = co[:, 2].max() - co[:, 2].min()
    gate(f'height {c["height_min"]}-{c["height_max"]} m', c['height_min'] <= h <= c['height_max'], f'{h:.3f} m')
    gate('feet on the floor (z = 0)', abs(co[:, 2].min()) <= c['floor_tol'], f'min z {co[:, 2].min():.4f}')
    degen = sum(1 for o in meshes for p in o.data.polygons if p.area < c['degen_area'])
    gate('no degenerate faces', degen == 0, degen)
    # (bug) head was scaled about the origin and floated 1.4 m above the body
    hb = arm.data.bones['head']
    hc = sum((head.matrix_world @ v.co for v in head.data.vertices), head.matrix_world.translation * 0) / len(head.data.vertices)
    d = seg_dist(hc, arm.matrix_world @ hb.head_local, arm.matrix_world @ hb.tail_local)
    gate('head sits on its bone', d <= c['head_tol'], f'{d * 100:.1f} cm from the head bone')
    mats = len(body.data.materials) + len(head.data.materials)
    gate(f'materials <= {c["max_materials"]}', mats <= c['max_materials'], mats)
    # UVs
    bpy.context.view_layer.objects.active = body
    for o in bpy.context.scene.objects: o.select_set(o is body)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.select_all(action='DESELECT'); bpy.ops.uv.select_overlap(); bpy.ops.object.mode_set(mode='OBJECT')
    ov = sum(1 for p in body.data.polygons if p.select)
    gate('body UVs: no overlaps', ov == 0, f'{ov} faces')
    sys.argv = [sys.argv[0], os.path.dirname(blend)]
    import s2_shell
    n = s2_shell.uv_islands(head)
    gate('head UV: one island', n == 1, n)
    uv = np.empty(len(head.data.uv_layers.active.data) * 2); head.data.uv_layers.active.data.foreach_get('uv', uv)
    uv = uv.reshape(-1, 2)
    gate('head UVs inside cell 0 (u 0..0.5, v 0.5..1)', uv[:, 0].min() >= 0 and uv[:, 0].max() <= 0.5 and uv[:, 1].min() >= 0.5 and uv[:, 1].max() <= 1,
         f'u {uv[:, 0].min():.3f}..{uv[:, 0].max():.3f} v {uv[:, 1].min():.3f}..{uv[:, 1].max():.3f}')
    if atlas:
        from PIL import Image
        a = np.asarray(Image.open(atlas).convert('RGB'), float); s = a.shape[0] // 2
        cells = [a[:s, :s], a[:s, s:], a[s:, :s], a[s:, s:]]
        md = min(np.abs(cells[i] - cells[j]).mean() for i in range(4) for j in range(i + 1, 4))
        gate('the 4 face cells all differ', md >= c['cell_diff'], f'smallest mean difference {md:.1f}')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    print(f'RESULT {sum(ok for _, ok in G)} of {len(G)} pass')

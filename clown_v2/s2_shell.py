"""Step 2b: body = the approved primitives as shells in one mesh (hidden faces removed), packed UVs, colour/AO/edge/top-light bakes, palette-ramp paint,
head with its own UV island, 4 face expressions baked into a 2x2 atlas. Prints PASS/FAIL gates.
Run: python3 -I s2_shell.py <dir with high.blend>  -> low.blend, body_1024.png, face_atlas.png"""
import os, sys, time, math, json
# approved art scripts (build.py, render3d.py, palette.py); set APPROVED to override
APPROVED = os.environ.get('APPROVED', '/home/claude/pack/Clown-and-the-Mirror-session/art/Clown-and-the-Mirror-style/3_blender_3d')
sys.path.insert(0, APPROVED)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import bpy, bmesh
from mathutils import Vector
from palette import RAMPS
from chars.common import current
C = current()

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # body triangle ceiling after hidden faces are removed
    body_tris=22000,
    # head sphere segments around
    head_segs=48,
    # head sphere rings top to bottom
    head_rings=24,
    # body texture size in pixels
    body_tex=1024,
    # one face cell in pixels (atlas is 2 x 2 cells)
    face_cell=512,
    # face bake: ray start above the head surface (approved units)
    face_extrude=1.8,
    # face bake: longest ray (approved units)
    face_ray=2.6,
    # ambient occlusion samples per texel
    ao_samples=64,
    # ambient occlusion reach (approved units)
    ao_dist=3.0,
    # 3D noise scale for hue variation (per approved unit)
    noise_scale=0.15,
    # uniform scale to metres at the end (59.5 units -> 1.79 m)
    unit=0.03,
    # ramp stops along the shade value: deep, shadow, base, light
    stops=(0.0, 0.35, 0.65, 1.0),
    # face UV density across: larger = more texels on the face, fewer on the back
    face_ku=1.25,
    # face UV density up and down
    face_kv=1.4,
    # latitude of the face centre in radians (below the head's equator)
    face_lat0=-0.14,
)
D = sys.argv[1]
G = []
def gate(name, ok, info=''):
    G.append(dict(name=name, ok=bool(ok), info=str(info)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def sel(objs, active=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]

def hexf(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])

def new_img(name, w, h=None):
    im = bpy.data.images.new(name, w, h or w, alpha=False); return im

def img_np(im):
    a = np.empty(im.size[0] * im.size[1] * 4, np.float32); im.pixels.foreach_get(a)
    return a.reshape(im.size[1], im.size[0], 4)

def save_np(arr, path, alpha=None):
    h, w = arr.shape[:2]
    im = bpy.data.images.new(os.path.basename(path), w, h, alpha=alpha is not None)
    a = np.ones((h, w, 1), np.float32) if alpha is None else alpha.reshape(h, w, 1).astype(np.float32)
    rgba = np.concatenate([arr[..., :3], a], 2)
    im.pixels.foreach_set(rgba.ravel().astype(np.float32))
    im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    return im

def bake_target_mat(o, img, name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = img; m.node_tree.nodes.active = t
    o.data.materials.clear(); o.data.materials.append(m)
    return m

def emit_mat(o, img, name):
    """Emission = (pointiness, normal z 0..1, 3D noise): baked with EMIT on the low mesh."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Normal'], sep.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = CONFIG['noise_scale']
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    cmb = nt.nodes.new('ShaderNodeCombineColor')
    nt.links.new(geo.outputs['Pointiness'], cmb.inputs[0]); nt.links.new(mr.outputs['Result'], cmb.inputs[1])
    nt.links.new(nz.outputs['Fac'], cmb.inputs[2])
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(cmb.outputs[0], em.inputs['Color'])
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs['Surface'])
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.nodes.active = t
    img.colorspace_settings.name = 'Non-Color'
    o.data.materials.clear(); o.data.materials.append(m)

def bake(kind, low, highs=(), extrude=0.0, ray=0.0, samples=1, visible=()):
    sc = bpy.context.scene
    for o in sc.objects:
        if o.type == 'MESH': o.hide_render = o not in (low, *highs, *visible)
    sc.cycles.samples = samples
    b = sc.render.bake
    b.use_selected_to_active = bool(highs); b.cage_extrusion = extrude; b.max_ray_distance = ray
    b.margin = 8; b.margin_type = 'EXTEND'
    b.use_pass_direct = b.use_pass_indirect = False; b.use_pass_color = True
    sel([*highs, low], low)
    t = time.time()
    if kind == 'DIFFUSE': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
    else: bpy.ops.object.bake(type=kind)
    return time.time() - t

def paint(col, ao, emi, cands, flats):
    """Each texel takes the nearest candidate base colour; ramps shade through 4 stops by a value
    built from AO, top light (normal z), edge (pointiness) and noise; flat colours stay flat."""
    names = list(cands) + list(flats)
    bases = np.array([hexf(RAMPS[n][1]) for n in cands] + [hexf(f) for f in flats])
    c = col[..., :3]
    d = ((c[..., None, :] - bases[None, None]) ** 2).sum(-1)
    idx = d.argmin(-1)
    curv = np.clip((emi[..., 0] - 0.5) * 4 + 0.5, 0, 1)
    v = 0.30 + 0.70 * (0.55 * ao[..., 0] + 0.45 * emi[..., 1]) + 0.25 * (curv - 0.5) + 0.08 * (emi[..., 2] - 0.5)
    v = np.clip(v, 0, 1)
    out = np.zeros(c.shape, np.float32)
    st = CONFIG['stops']
    for i, n in enumerate(names):
        m = idx == i
        if not m.any(): continue
        if i < len(cands):
            r = RAMPS[n]; pts = [hexf(r[3]), hexf(r[2]), hexf(r[1]), hexf(r[0])]
            vv = v[m]
            res = np.zeros((vv.size, 3))
            for k in range(3):
                t = np.clip((vv - st[k]) / (st[k + 1] - st[k]), 0, 1)[:, None]
                inside = ((vv >= st[k]) & ((vv < st[k + 1]) | (k == 2)))[:, None]
                res = np.where(inside, pts[k] * (1 - t) + pts[k + 1] * t, res)
            out[m] = res
        else:
            out[m] = bases[i] * (0.9 + 0.1 * v[m, None])
    return out, idx, names

def main():
    T0 = time.time()
    bpy.ops.wm.open_mainfile(filepath=os.path.join(D, 'high.blend'))
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    for o in list(sc.objects):
        if o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o)
    parts = [o for o in sc.objects if o.get('group') == 'body']
    head_src = [o for o in sc.objects if o.get('group') == 'head'][0]
    # world-space copies, unparented, transforms applied
    def dup(objs):
        out = []
        for o in objs:
            c = o.copy(); c.data = o.data.copy(); sc.collection.objects.link(c)
            mw = o.matrix_world.copy(); c.parent = None; c.matrix_world = mw; out.append(c)
        sel(out); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        return out
    # each part keeps its own shell and UVs; faces buried inside other parts are deleted
    t = time.time()
    lo = dup(parts)
    bones_by_part = []
    for i, o in enumerate(lo):
        bones_by_part.append(o['bones'])
        a = o.data.attributes.new('part', 'INT', 'FACE')
        a.data.foreach_set('value', [i] * len(o.data.polygons))
    n_before = sum(tris(o) for o in lo)
    removed = cull_hidden(lo)
    sel(lo); bpy.ops.object.join(); L = bpy.context.active_object; L.name = 'body'
    L['part_bones'] = json.dumps(bones_by_part)
    bm = bmesh.new(); bm.from_mesh(L.data)
    bmesh.ops.triangulate(bm, faces=bm.faces); bm.to_mesh(L.data); bm.free()
    for p in L.data.polygons: p.use_smooth = True
    gate('body: parts joined, hidden faces removed', tris(L) <= CONFIG['body_tris'],
         f'{len(lo)} parts, {n_before} tris before, {removed} hidden faces removed, {tris(L)} tris, {time.time()-t:.1f}s')
    # UVs: the primitives' own UVs, scaled to equal texel density and packed
    sel([L]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
    bpy.ops.uv.select_all(action='DESELECT'); bpy.ops.uv.select_overlap()
    bpy.ops.object.mode_set(mode='OBJECT')
    ov = [p.index for p in L.data.polygons if p.select]
    gate('body UVs: no overlaps', len(ov) == 0, f'{len(ov)} overlapping faces, {uv_islands(L)} islands')
    # head
    hd = make_head(head_src)
    if not sc.world: sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = CONFIG['ao_dist']
    face_uv(hd)
    fi = uv_islands(hd)
    gate('head UV: one island', fi == 1, f'{fi} islands')
    # ---------------- body bakes
    N = CONFIG['body_tex']
    col = new_img('body_col', N)
    for m in L.data.materials:
        tn = m.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = col; m.node_tree.nodes.active = tn
        # (bug) the DIFFUSE colour pass is base x (1 - metallic): gold and silver baked dark and were read as other ramps
        for nd in m.node_tree.nodes:
            if nd.type == 'BSDF_PRINCIPLED': nd.inputs['Metallic'].default_value = 0.0
    dt = bake('DIFFUSE', L, (), samples=1)
    ao = new_img('body_ao', N); ao.colorspace_settings.name = 'Non-Color'; bake_target_mat(L, ao, 'bake_ao')
    dt2 = bake('AO', L, (), samples=CONFIG['ao_samples'], visible=[hd])
    emi = new_img('body_emi', N); emit_mat(L, emi, 'bake_emi')
    dt3 = bake('EMIT', L)
    gate('body bakes (colour, AO, edge/top/noise)', True, f'{dt:.1f}s / {dt2:.1f}s / {dt3:.1f}s')
    body_ramps = sorted({o['ramp'] for o in parts})
    BC, A, E = img_np(col), img_np(ao), img_np(emi)
    for n, a in (('body_col', BC), ('body_ao', A), ('body_emi', E)): save_np(a, os.path.join(D, n + '.png'))
    out, idx, names = paint(BC, A, E, body_ramps, [])
    save_np(out, os.path.join(D, 'body_1024.png'))
    # region check: every ramp used by a part gets texels
    cnt = {n: int((idx == i).sum()) for i, n in enumerate(names)}
    gate('body regions: every part ramp present in the atlas', all(v > 200 for v in cnt.values()), cnt)
    # (bug) each part's faces must read back as that part's ramp (metal once baked dark and was read as another ramp)
    pf = np.zeros(len(L.data.polygons), np.int32); L.data.attributes['part'].data.foreach_get('value', pf)
    uvl = L.data.uv_layers.active.data; hit, tot = {}, {}
    for poly in L.data.polygons:
        u = sum(uvl[k].uv[0] for k in poly.loop_indices) / poly.loop_total
        w = sum(uvl[k].uv[1] for k in poly.loop_indices) / poly.loop_total
        rp = parts[pf[poly.index]]['ramp']
        got = names[idx[min(int(w * N), N - 1), min(int(u * N), N - 1)]]
        tot[rp] = tot.get(rp, 0) + 1; hit[rp] = hit.get(rp, 0) + (got == rp)
    share = {rp: round(hit[rp] / tot[rp], 3) for rp in tot}
    gate('body regions: faces of each ramp read back as that ramp (>= 95%)', all(v >= 0.95 for v in share.values()), share)
    # ---------------- face bakes, one per expression
    Fc = CONFIG['face_cell']
    hd_ao = new_img('face_ao', Fc); hd_ao.colorspace_settings.name = 'Non-Color'; bake_target_mat(hd, hd_ao, 'f_ao')
    bake('AO', hd, (), samples=CONFIG['ao_samples'], visible=[L])
    hd_emi = new_img('face_emi', Fc); emit_mat(hd, hd_emi, 'f_emi'); bake('EMIT', hd)
    FA, FE = img_np(hd_ao), img_np(hd_emi)
    atlas = np.zeros((2 * Fc, 2 * Fc, 3), np.float32)
    patlas = np.zeros((2 * Fc, 2 * Fc, 4), np.float32)
    mag = bpy.data.materials.new('magenta'); mag.use_nodes = True
    mag.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (1, 0, 1, 1)
    face_flats = C.FACE_FLATS
    paint_flats = C.PAINT_FLATS
    # atlas cells (column, row from top) in the character's expression order; the first is the default face
    cells = dict(zip(C.EXPR, ((0, 0), (1, 0), (0, 1), (1, 1))))
    for e, (cx, cy) in cells.items():
        feats = [o for o in sc.objects if o.get('group') == 'face_' + e]
        for coll in bpy.data.collections: coll.hide_render = False
        # base cell: no paint (paint is its own layer, so it can fade, flake and change per Mask level)
        hs = dup([head_src]) + dup([o for o in feats if not o.get('paint')])
        im = new_img('face_' + e, Fc); bake_target_mat(hd, im, 'f_' + e)
        dt = bake('DIFFUSE', hd, hs, CONFIG['face_extrude'], CONFIG['face_ray'], 1)
        FC = img_np(im)
        out, idx, names = paint(FC, FA, FE, C.HEAD_RAMPS, face_flats)
        # pixels arrays are bottom-up; atlas rows from top: flip when placing
        atlas[(1 - cy) * Fc:(2 - cy) * Fc, cx * Fc:(cx + 1) * Fc] = out
        feat_px = int((idx >= 1).sum())
        gate(f'face bake {e}', feat_px > 300, f'{dt:.1f}s, feature texels {feat_px}')
        for o in hs: bpy.data.objects.remove(o)
        # paint cell: everything else magenta, so features in front of the paint (eyes) cut it out
        hs = dup([head_src]) + dup(feats)
        for o in hs:
            if not o.get('paint'): o.data.materials.clear(); o.data.materials.append(mag)
        pim = new_img('paint_' + e, Fc); bake_target_mat(hd, pim, 'p_' + e)
        bake('DIFFUSE', hd, hs, CONFIG['face_extrude'], CONFIG['face_ray'], 1)
        PC = img_np(pim)
        alpha = (np.abs(PC[..., :3] - (1, 0, 1)).max(-1) > 0.08).astype(np.float32)
        pout, _, _ = paint(PC, FA, FE, [], paint_flats)
        cell = np.concatenate([pout, alpha[..., None]], -1)
        patlas[(1 - cy) * Fc:(2 - cy) * Fc, cx * Fc:(cx + 1) * Fc] = cell
        gate(f'paint layer {e}: paint present, eyes cut it', alpha.mean() > C.PAINT_MIN, f'{alpha.mean() * 100:.1f}% of the cell painted')
        for o in hs: bpy.data.objects.remove(o)
    save_np(atlas, os.path.join(D, 'face_atlas.png'))
    save_np(patlas[..., :3], os.path.join(D, 'face_paint.png'), patlas[..., 3])
    # Blender renders and the plain GLB material show the face with paint: a combined atlas for those
    a = patlas[..., 3:4]
    save_np(atlas * (1 - a) + patlas[..., :3] * a, os.path.join(D, 'face_combined.png'))
    # cell 0 (sad) is top-left in the image = u 0..0.5, v 0.5..1
    uvl = hd.data.uv_layers.active.data
    uv = np.empty(len(uvl) * 2, np.float32); uvl.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    uv[:, 0] *= 0.5; uv[:, 1] = 0.5 + uv[:, 1] * 0.5; uvl.foreach_set('uv', uv.ravel())
    # ---------------- final materials, cleanup, scale to metres
    for o, img_path, nm in ((L, 'body_1024.png', 'body'), (hd, 'face_combined.png', 'face')):
        m = bpy.data.materials.new(nm); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = 0.65
        b.inputs['Specular IOR Level'].default_value = 0.3
        t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(D, img_path))
        m.node_tree.links.new(t.outputs['Color'], b.inputs['Base Color'])
        o.data.materials.clear(); o.data.materials.append(m)
    # shine mask as custom attribute _SPEC (not a vertex colour: three.js multiplies vertex colours into the texture)
    spec_parts = {i for i, o in enumerate(parts) if o['ramp'] in C.SPEC_RAMPS}
    fp = np.zeros(len(L.data.polygons), np.int32); L.data.attributes['part'].data.foreach_get('value', fp)
    for o, shiny in ((L, fp), (hd, None)):
        ca = o.data.attributes.new('_SPEC', 'FLOAT', 'POINT')
        val = np.zeros((len(o.data.vertices), 1), np.float32)
        if shiny is not None:
            for p in o.data.polygons:
                if shiny[p.index] in spec_parts:
                    for v in p.vertices: val[v, 0] = 1
        ca.data.foreach_set('value', val.ravel())
        if shiny is not None: n_shiny, n_all = int((val[:, 0] > 0).sum()), len(val)
    gate('spec mask: some body vertices shine, most do not', 0 < n_shiny < 0.15 * n_all, f'{n_shiny} of {n_all} vertices')
    keep = {L, hd}
    for o in list(sc.objects):
        if o not in keep: bpy.data.objects.remove(o)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    u = CONFIG['unit']
    for o in keep: o.scale = (u, u, u)
    sel(list(keep)); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    total = tris(L) + tris(hd)
    gate('triangles <= 30k (body + head)', total <= 30000, f'{tris(L)} + {tris(hd)} = {total}')
    gate('materials (= draw calls before hull) <= 2', len(L.data.materials) + len(hd.data.materials) <= 2,
         [m.name for m in L.data.materials] + [m.name for m in hd.data.materials])
    for o in keep: o.hide_render = False
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'low.blend'))
    sel(list(keep))
    bpy.ops.export_scene.gltf(filepath=os.path.join(D, 'clown_v2_static.glb'), export_format='GLB', use_selection=True)
    gate('total time', True, f'{time.time()-T0:.0f}s')
    json.dump(G, open(os.path.join(D, 'gates_step2.json'), 'w'), indent=1)

def cull_hidden(objs, eps=0.04):
    """Delete faces of each part whose centre and corners all lie inside other (closed) parts that carry every
    bone of that part (so they move together and the faces stay buried in every pose).
    Inside test: ray parity against the other part's BVH."""
    from mathutils.bvhtree import BVHTree
    trees = []
    for o in objs:
        bm = bmesh.new(); bm.from_mesh(o.data)
        trees.append((BVHTree.FromBMesh(bm), Vector([min(v.co[k] for v in bm.verts) for k in range(3)]),
                      Vector([max(v.co[k] for v in bm.verts) for k in range(3)])))
        bm.free()
    d = Vector((0.317, 0.521, 0.792)).normalized()
    def inside(p, j):
        tr, lo_, hi_ = trees[j]
        if any(p[k] < lo_[k] or p[k] > hi_[k] for k in range(3)): return False
        n = 0; q = p.copy()
        for _ in range(64):
            hit = tr.ray_cast(q, d)
            if hit[0] is None: break
            n += 1; q = hit[0] + d * 1e-4
        return n % 2 == 1
    removed = 0
    for i, o in enumerate(objs):
        me = o.data; dead = []
        # (bug) sleeves buried in the smock at bind pose were cut, then showed a hole when the arm rose
        own = set(o['bones'].split(','))
        others = [j for j in range(len(objs)) if j != i and own <= set(objs[j]['bones'].split(','))]
        for p in me.polygons:
            pts = [p.center + p.normal * eps] + [me.vertices[v].co + p.normal * eps for v in p.vertices]
            if all(any(inside(q, j) for j in others) for q in pts): dead.append(p.index)
        if dead:
            bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
            bmesh.ops.delete(bm, geom=[bm.faces[k] for k in dead], context='FACES')
            bm.to_mesh(me); bm.free(); removed += len(dead)
    return removed

def count_islands(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    seen = set(); n = 0
    for v in bm.verts:
        if v.index in seen: continue
        n += 1; st = [v]; seen.add(v.index)
        while st:
            x = st.pop()
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen: seen.add(y.index); st.append(y)
    bm.free(); return n

def make_head(src):
    """Fresh UV sphere at the approved head centre and radii, more segments for a clean face island."""
    c = CONFIG
    bpy.ops.mesh.primitive_uv_sphere_add(segments=c['head_segs'], ring_count=c['head_rings'], radius=1, location=src.matrix_world.translation)
    h = bpy.context.active_object; h.name = 'head'; h.scale = src.scale
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for p in h.data.polygons: p.use_smooth = True
    return h

# head centre of the chosen character (approved units)
HCEN = C.HC

def face_uv(h):
    """Seam at the back (+y). tanh spacing gives the front of the face most of the texels."""
    c = CONFIG
    me = h.data
    if not me.uv_layers: me.uv_layers.new()
    uvl = me.uv_layers.active.data
    def tmap(x, k, x0, lo, hi):
        f = lambda t: math.tanh(k * (t - x0))
        return (f(x) - f(lo)) / (f(hi) - f(lo))
    for p in me.polygons:
        phis = []
        for li in p.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co - Vector(HCEN)
            phis.append(math.atan2(v.x, -v.y))       # 0 = front (-y), +-pi = back
        if max(phis) - min(phis) > math.pi:           # face straddles the back seam: keep it on one side
            sgn = 1 if sum(1 for a in phis if a > 0) >= len(phis) / 2 else -1
            phis = [a if (a > 0) == (sgn > 0) or abs(a) < 1e-6 else a + sgn * 2 * math.pi for a in phis]
            phis = [max(-math.pi, min(math.pi, a)) for a in phis]
        for li, phi in zip(p.loop_indices, phis):
            v = me.vertices[me.loops[li].vertex_index].co - Vector(HCEN)
            lat = math.asin(max(-1, min(1, v.z / max(v.length, 1e-9))))
            u = tmap(phi, c['face_ku'], 0, -math.pi, math.pi)
            vv = tmap(lat, c['face_kv'], c['face_lat0'], -math.pi / 2, math.pi / 2)
            uvl[li].uv = (u, vv)

def uv_islands(o):
    """Count UV islands: faces joined when they share an edge with matching UVs on both ends."""
    me = o.data; uvl = me.uv_layers.active.data
    key = {}
    parent = list(range(len(me.polygons)))
    def find(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for p in me.polygons:
        li = list(p.loop_indices)
        for a, b in zip(li, li[1:] + li[:1]):
            va, vb = me.loops[a].vertex_index, me.loops[b].vertex_index
            ua, ub = tuple(round(x, 5) for x in uvl[a].uv), tuple(round(x, 5) for x in uvl[b].uv)
            k = tuple(sorted([(va, ua), (vb, ub)]))
            if k in key: parent[find(p.index)] = find(key[k])
            else: key[k] = p.index
    return len({find(i) for i in range(len(me.polygons))})

if __name__ == '__main__':
    main()

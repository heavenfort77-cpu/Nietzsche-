// Far level for THREE.LOD (owner 24 Nov 2026 17:28: "THREE.LOD"): from a crew figure's web GLB (art/cast2/v2/web/<id>.glb) writes
// <id>_far.glb holding only the body mesh, simplified, in the same quantized space, same skin and joint order, no textures and no clips.
// The page binds this geometry to the near body's skeleton and material (no second texture, no second mixer).
// Usage: node tools/cast_lod.mjs <in.glb> <out.glb> [ratio]   (needs @gltf-transform/core, extensions, functions 4.1.1 and meshoptimizer)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { weld, simplify, prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const [inPath, outPath, ratioArg] = process.argv.slice(2);
// share of the body's triangles kept in the far level
const RATIO = Number(ratioArg || 0.25);
// largest simplification error, as a share of the mesh size
const ERROR = 0.01;

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inPath);
const root = doc.getRoot();

let body = null;
for (const mesh of root.listMeshes()) {
  const p = mesh.listPrimitives()[0];
  if (p.getMaterial() && p.getMaterial().getName() === 'body') body = mesh; else mesh.dispose();
}
if (!body) throw new Error('no body mesh in ' + inPath);
const prim = body.listPrimitives()[0];
const before = prim.getIndices().getCount() / 3;

// store every attribute as float for the simplifier, remembering the quantized type, then put the same type back (same space as the near mesh)
const kept = {};
for (const sem of prim.listSemantics()) {
  const a = prim.getAttribute(sem);
  const n = a.getCount(), k = a.getElementSize(), f = new Float32Array(n * k), el = new Array(k);
  for (let i = 0; i < n; i++) { a.getElement(i, el); for (let j = 0; j < k; j++) f[i * k + j] = el[j]; }
  kept[sem] = { type: a.getArray().constructor, norm: a.getNormalized() };
  a.setArray(f).setNormalized(false);
}
for (const t of root.listTextures()) t.dispose();
for (const a of root.listAnimations()) a.dispose();
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERROR }), prune({ keepLeaves: true }));
const after = prim.getIndices().getCount() / 3;

const LIM = { Int8Array: 127, Uint8Array: 255, Int16Array: 32767, Uint16Array: 65535 };
for (const sem of prim.listSemantics()) {
  const a = prim.getAttribute(sem), q = kept[sem];
  if (!q || q.type === Float32Array) continue;
  const src = a.getArray(), k = a.getElementSize(), dst = new q.type(src.length), s = q.norm ? LIM[q.type.name] : 1;
  for (let i = 0; i < src.length; i += k) {
    let sum = 0;
    if (sem.startsWith('WEIGHTS')) { for (let j = 0; j < k; j++) sum += src[i + j]; }
    for (let j = 0; j < k; j++) {
      const v = sem.startsWith('WEIGHTS') && sum > 0 ? src[i + j] / sum : src[i + j];
      dst[i + j] = Math.max(-s, Math.min(s, Math.round(v * s)));
    }
  }
  a.setArray(dst).setNormalized(q.norm);
}
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write(outPath, doc);
console.log(`${outPath}: body ${before} -> ${after} triangles (ratio ${RATIO})`);

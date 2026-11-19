"""Size gate for a compressed character GLB, and proof the compression really ran.
python3 -I check_size.py <source glb> <compressed glb> <limit KB>
PASS/FAIL lines: size under the limit; every image is KTX2; meshopt compression is used; skin and clips survive."""
import sys, os, json, struct

def gltf_json(path):
    with open(path, 'rb') as f:
        magic, _, _ = struct.unpack('<4sII', f.read(12))
        assert magic == b'glTF', path
        n, kind = struct.unpack('<I4s', f.read(8))
        assert kind == b'JSON', path
        return json.loads(f.read(n))

def line(ok, text):
    print(f"{'PASS' if ok else 'FAIL'} {text}")
    return ok

def main(src, dst, limit_kb):
    a, b = gltf_json(src), gltf_json(dst)
    ka, kb = os.path.getsize(src) / 1024, os.path.getsize(dst) / 1024
    print(f'INFO size: source {ka:.0f} KB, compressed {kb:.0f} KB')
    ok = line(kb <= float(limit_kb), f'compressed GLB {kb:.0f} KB <= {limit_kb} KB')
    mimes = [im.get('mimeType', '') for im in b.get('images', [])]
    ok &= line(len(mimes) > 0 and all(m == 'image/ktx2' for m in mimes), f'every image is KTX2: {mimes}')
    used = b.get('extensionsUsed', [])
    ok &= line('EXT_meshopt_compression' in used, f'meshopt used: {used}')
    ok &= line(len(b.get('skins', [])) == len(a.get('skins', [])) and len(b.get('skins', [])) > 0,
               f"skins kept: {len(a.get('skins', []))} -> {len(b.get('skins', []))}")
    na = sorted(x.get('name', '') for x in a.get('animations', []))
    nb = sorted(x.get('name', '') for x in b.get('animations', []))
    ok &= line(na == nb and len(nb) > 0, f'clips kept: {na} -> {nb}')
    ok &= line(len(b.get('meshes', [])) == len(a.get('meshes', [])), f"meshes kept: {len(a.get('meshes', []))} -> {len(b.get('meshes', []))}")
    return ok

if __name__ == '__main__':
    main(*sys.argv[1:4])

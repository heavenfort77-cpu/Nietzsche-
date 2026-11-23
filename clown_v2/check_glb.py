"""GLB gates, read straight from the file (no Blender). Expected clip lengths come from the Muybridge
plates here, not from s3_rig, so a wrong constant in the rig script is caught.
Run: python3 -I check_glb.py <clown_v2.glb>"""
import os, sys, json, struct

# CONFIG ---------------------------------------------------------------
CONFIG = dict(
    # expected clip lengths in seconds: idle (no plate), walk = 12 x 0.083 (series 1), slap = 11 x 0.112 (series 32)
    clips=dict(idle=2.0, walk=12 * 0.083, slap=11 * 0.112),
    # a figure with its own clips (CHAR): expected lengths written here too, so a wrong time in the module is caught
    # (the Light: flare is its 0.4 s tell and hit its 0.6 s hold-off, GDD monster table; the Whisper: copy is its 0.4 s tell,
    # N1.whisper.tell in night1.html, then strike where he landed; the Stare: gaze is its 0.4 s tell, N1.stare.tell, and judge
    # its verdict, every N1.stare.every = 1.0 s; Shame: reach is its 0.4 s tell, N1.shame.tell, and shaken the 1.0 s stun after
    # his dodge, N1.shame.stun)
    clips_by_char=dict(light=dict(idle=2.0, flare=0.4, hit=0.6, out=1.0), whisper=dict(idle=2.0, copy=0.4, strike=0.4, hit=0.6, out=1.0),
                       stare=dict(idle=2.0, gaze=0.4, judge=0.4, hit=0.6, out=1.0),
                       shame=dict(idle=2.0, walk=0.8, reach=0.4, cling=1.0, shaken=1.0, hit=0.6, out=1.0)),
    # allowed error: one sampled frame at 30 fps
    clip_tol=1 / 30 + 1e-3,
    # file size ceiling before compression, KB
    max_kb=4096,
)
G = []
def gate(name, ok, info=''):
    G.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else ''), flush=True)

def main(path):
    c = CONFIG
    raw = open(path, 'rb').read()
    ln = struct.unpack('<I', raw[12:16])[0]; j = json.loads(raw[20:20 + ln])
    anims = {a['name']: a for a in j.get('animations', [])}
    def dur(a):
        acc = j['accessors'][a['samplers'][0]['input']]; return acc['max'][0] - acc['min'][0]
    durs = {k: round(dur(a), 3) for k, a in anims.items()}
    clips = c['clips_by_char'].get(os.environ.get('CHAR', ''), c['clips'])
    gate('clips are ' + ', '.join(clips), set(anims) == set(clips), sorted(anims))
    bad = {k: (durs.get(k), round(v, 3)) for k, v in clips.items() if k not in durs or abs(durs[k] - v) > c['clip_tol']}
    gate('clip lengths match the plates (within 1 frame)', not bad, bad or durs)
    gate('one skin', len(j.get('skins', [])) == 1, len(j.get('skins', [])))
    gate('two meshes (body, face)', len(j.get('meshes', [])) == 2, len(j.get('meshes', [])))
    dotted = [n.get('name', '') for n in j['nodes'] if '.' in n.get('name', '')]
    gate('node names have no dots', not dotted, dotted[:5])
    extra = [p['attributes'].keys() for m in j['meshes'] for p in m['primitives'] if 'JOINTS_1' in p['attributes']]
    gate('at most 4 joints per vertex (no JOINTS_1)', not extra)
    prims = [p['attributes'] for m in j['meshes'] for p in m['primitives']]
    # (bug) a vertex colour turned the plain three.js material black: three.js multiplies COLOR_0 into the texture
    gate('no vertex colours (COLOR_0)', not any('COLOR_0' in a for a in prims))
    gate('shine mask _SPEC on every mesh', all('_SPEC' in a for a in prims), [sorted(a) for a in prims])
    kb = len(raw) / 1024
    gate(f'file <= {c["max_kb"]} KB before compression', kb <= c['max_kb'], f'{kb:.0f} KB')
    # every animation channel targets a node that exists
    n_nodes = len(j['nodes'])
    badch = sum(1 for a in anims.values() for ch in a['channels'] if ch['target']['node'] >= n_nodes)
    gate('animation channels target real nodes', badch == 0, badch)

if __name__ == '__main__':
    main(sys.argv[1])
    print(f'RESULT {sum(ok for _, ok in G)} of {len(G)} pass')

"""Loop-seam and pop gate for looping clips (owner requirement 3: natural movement; F17).
For every bone rotation track of each looping clip, taken as a cycle (the loop seam joins the last frame to
the first; a last frame that repeats the first is dropped): no frame may sit more than LIMIT_DEG from the
midpoint (slerp 0.5) of its two neighbours. A pop or a seam jump pulls a frame off that line; fast but smooth
motion (a knee bend at 30 fps) stays within about 2 degrees.
Usage: python3 -I probe_clip_loop.py GLB [clip,clip]   (default clips: idle,walk)
MUTATE=1: turns one mid-cycle walk frame of upper_arm_L by 20 degrees first; the walk line must then FAIL."""
import json, os, struct, sys
import numpy as np

# largest distance of a frame from the midpoint of its neighbours, degrees
LIMIT_DEG = 4.0

glb = sys.argv[1]
clips = sys.argv[2].split(',') if len(sys.argv) > 2 else ['idle', 'walk']
b = open(glb, 'rb').read()
n = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + n])
off = 20 + n + 8


def acc(i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    w = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    return np.frombuffer(b, np.float32, a['count'] * w, off + bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(-1, w)


def ang(q0, q1):
    return float(np.degrees(2 * np.arccos(min(1.0, abs(float(np.dot(q0, q1)))))))


def mid(q0, q1):
    # slerp halfway, short way round (glTF quaternions are x, y, z, w; the halfway point is the normalised sum)
    q1 = q1 if np.dot(q0, q1) >= 0 else -q1
    s = q0 + q1
    return s / np.linalg.norm(s)


names = [nd.get('name') for nd in j['nodes']]
# mutation: a 20 degree pop on one frame (rotation about x, quaternion x, y, z, w)
POP = np.array([np.sin(np.radians(10)), 0, 0, np.cos(np.radians(10))], np.float32)


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz], np.float32)
fail = 0
for a in j['animations']:
    if a['name'] not in clips:
        continue
    worst = None
    for c in a['channels']:
        if c['target']['path'] != 'rotation':
            continue
        v = acc(a['samplers'][c['sampler']]['output'])
        if os.environ.get('MUTATE') and a['name'] == 'walk' and names[c['target']['node']] == 'upper_arm_L':
            v = v.copy()
            v[len(v) // 2] = qmul(POP, v[len(v) // 2])
        if ang(v[-1], v[0]) < 1e-3:
            v = v[:-1]
        m = len(v)
        for i in range(m):
            dev = ang(v[i], mid(v[i - 1], v[(i + 1) % m]))
            where = 'seam' if i == 0 else f'frame {i}'
            if worst is None or dev > worst[0]:
                worst = (dev, names[c['target']['node']], where)
    ok = worst[0] <= LIMIT_DEG
    fail += not ok
    print(f"{'PASS' if ok else 'FAIL'}  clip {a['name']}: frame furthest from its neighbours' midpoint {worst[0]:.1f} deg, {worst[1]} at {worst[2]} (max {LIMIT_DEG:g})")
print('RESULT PASS' if not fail else f'RESULT FAIL {fail}')
sys.exit(1 if fail else 0)

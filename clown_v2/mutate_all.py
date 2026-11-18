"""Mutation run: break each rule on purpose in a copy, run the checker that owns that rule, and require the
gate to FAIL. Then re-run the real build's checks (must PASS) and confirm the real files are unchanged.
Run: python3 -I mutate_all.py   (about 5 minutes)"""
import os, sys, subprocess, hashlib, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
# folder with run_page.mjs and check_clown.html; set WEB to override
WEB = os.environ.get('WEB', '/home/claude/build/web')
TMP = '/tmp/mut'
PY = [sys.executable, '-I']

# mutation -> (how it is made, checker, gate that must FAIL)
CASES = [
    ('unweighted', 'apply', 'model', 'every vertex weighted'),
    ('influence5', 'apply', 'model', 'influences per vertex'),
    ('uvoverlap', 'apply', 'model', 'body UVs: no overlaps'),
    ('headfloat', 'apply', 'model', 'head sits on its bone'),
    ('hidden', 'apply', 'model', 'every mesh visible'),
    ('dotname', 'apply', 'model', 'bone names have no dots'),
    ('dotname', 'apply', 'glb', 'node names have no dots'),
    ('drawcalls', 'apply', 'model', 'materials <='),
    ('drawcalls', 'apply', 'web', 'draw calls <= 3'),
    ('faceswap', 'apply', 'model', 'the 4 face cells all differ'),
    ('faceswap', 'apply', 'web', 'face cell swap changes the face'),
    ('badbind', 'apply', 'deform:idle', 'rest pose = bind mesh'),
    ('floating', 'apply', 'deform:slap', 'slap: nothing floats free'),
    ('stretch', 'apply', 'deform:walk', 'walk: edge stretch'),
    ('headup', 'rig', 'deform:idle', 'idle: head tipped forward'),
    ('walklen', 'rig', 'glb', 'clip lengths match the plates'),
    ('vcolor', 'apply', 'glb', 'no vertex colours'),
]
# old-build patches: (file, old text, new text): the idle head bug as first written, and a wrong walk constant
RIG_PATCH = dict(
    headup=('chars/clown.py', "K.rotw('neck', (1, 0, 0), 6); K.rotw('head', (0, 0, 1), -12 + 1.5 * math.sin(p + 1)); K.rotw('head', (1, 0, 0), 9 + 1.2 * math.sin(p))",
            "K.rotw('neck', (1, 0, 0), -6); K.rotw('head', (0, 0, 1), -12 + 1.5 * math.sin(p + 1)); K.rotw('head', (1, 0, 0), -7 + 1.2 * math.sin(p))"),
    walklen=('s3_rig.py', "    walk_n=12,", "    walk_n=10,"),
)

def sha(d):
    h = {}
    for f in sorted(os.listdir(d)):
        p = os.path.join(d, f)
        # gates_*.json are check reports, rewritten on purpose by every check run
        if os.path.isfile(p) and not f.startswith('gates_'): h[f] = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    return h

def run(cmd, cwd=HERE):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=900)
    return [l for l in (r.stdout + r.stderr).splitlines() if l.startswith(('PASS', 'FAIL'))]

def check(kind, d):
    if kind == 'model': return run(PY + ['check_model.py', os.path.join(d, 'rigged.blend'), os.path.join(d, 'face_atlas.png')])
    if kind == 'glb': return run(PY + ['check_glb.py', os.path.join(d, 'clown_v2.glb')])
    if kind.startswith('deform:'): return run(PY + ['s3_check.py', d, '--clips=' + kind.split(':')[1]])
    if kind == 'web':
        name = 'mut_' + os.path.basename(d) + '.glb'; shutil.copy(os.path.join(d, 'clown_v2.glb'), os.path.join(WEB, name))
        lines = run(['node', 'run_page.mjs', '.', 'check_clown.html?glb=' + name, 'PROBE'], cwd=WEB)
        os.remove(os.path.join(WEB, name)); return lines
    raise ValueError(kind)

def make(mut, how):
    d = os.path.join(TMP, mut)
    if os.path.isdir(d): return d
    os.makedirs(d)
    if how == 'apply':
        subprocess.run(PY + ['mut_apply.py', os.path.join(OUT, 'rigged.blend'), d, mut, os.path.join(OUT, 'face_atlas.png')],
                       cwd=HERE, capture_output=True, timeout=600, check=True)
    else:
        f, a, b = RIG_PATCH[mut]
        rd = os.path.join(d, 'rigcode')
        shutil.copytree(HERE, rd, ignore=shutil.ignore_patterns('out*', 'chk', '__pycache__', '*.blend', '*.glb', '*.png'))
        src = open(os.path.join(rd, f)).read(); assert a in src, mut
        open(os.path.join(rd, f), 'w').write(src.replace(a, b))
        shutil.copy(os.path.join(OUT, 'low.blend'), d)
        subprocess.run(PY + [os.path.join(rd, 's3_rig.py'), d], capture_output=True, timeout=600, check=True)
    return d

def main():
    shutil.rmtree(TMP, ignore_errors=True)
    before = sha(OUT)
    ok_all = 0
    for mut, how, kind, gate in CASES:
        d = make(mut, how)
        lines = check(kind, d)
        hit = [l for l in lines if gate in l]
        fired = any(l.startswith('FAIL') for l in hit)
        ok_all += fired
        print(('PASS ' if fired else 'FAIL ') + f'mutation {mut} -> {kind} gate "{gate}" fires' + (' | ' + hit[0][:140] if hit else ' | gate line not found'))
    # real build still passes everything and is untouched
    real = check('model', OUT) + check('glb', OUT) + check('web', OUT) + check('deform:idle,walk,slap', OUT)
    fails = [l for l in real if l.startswith('FAIL')]
    print(('PASS ' if not fails else 'FAIL ') + f'real build: {len(real) - len(fails)} of {len(real)} gates pass' + (' | ' + ' / '.join(fails)[:300] if fails else ''))
    same = sha(OUT) == before
    print(('PASS ' if same else 'FAIL ') + 'real build files unchanged by the mutation run (sha256)')
    print(f'RESULT mutations {ok_all} of {len(CASES)} fired; real build {"PASS" if not fails else "FAIL"}; files {"unchanged" if same else "CHANGED"}')

if __name__ == '__main__':
    main()

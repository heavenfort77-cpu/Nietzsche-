"""Mutations for the shell step (s2_shell.py): put a fixed bug back in a copy of the code, rebuild the shell from an
existing high.blend, and require the named gate to FAIL. The real code must still PASS that gate.
Run: CHAR=whiteface python3 -I mutate_shell.py out_whiteface   (needs a character with metal ramps)"""
import os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
# (name, old line, new line, gate that must fail)
MUTATIONS = [
    ('metalbake', "nd.inputs['Metallic'].default_value = 0.0", 'pass',
     'body regions: faces of each ramp read back as that ramp'),
]

def run_shell(code_dir, src_out):
    out = tempfile.mkdtemp(prefix='mshell_')
    shutil.copy(os.path.join(src_out, 'high.blend'), out)
    r = subprocess.run([sys.executable, '-I', os.path.join(code_dir, 's2_shell.py'), out], capture_output=True, text=True,
                       env=dict(os.environ, PYTHONPATH=code_dir))
    shutil.rmtree(out, ignore_errors=True)
    return r.stdout + r.stderr

def main(src_out):
    fired = 0
    for name, old, new, gate in MUTATIONS:
        tmp = tempfile.mkdtemp(prefix='mcode_')
        shutil.copytree(HERE, tmp, dirs_exist_ok=True, ignore=shutil.ignore_patterns('out*', 'chk', '__pycache__', '*.blend', '*.glb', '*.png'))
        p = os.path.join(tmp, 's2_shell.py'); s = open(p).read()
        if s.count(old) != 1:
            print(f'FAIL mutation {name}: patch target not found once in s2_shell.py'); continue
        open(p, 'w').write(s.replace(old, new))
        log = run_shell(tmp, src_out)
        ok = any(l.startswith('FAIL ' + gate) for l in log.splitlines())
        fired += ok
        print(('PASS' if ok else 'FAIL') + f' mutation {name}: gate "{gate}" fails on the broken code')
        shutil.rmtree(tmp, ignore_errors=True)
    log = run_shell(HERE, src_out)
    real = [l for l in log.splitlines() if l.startswith(('PASS', 'FAIL'))]
    bad = [l for l in real if l.startswith('FAIL')]
    print(('PASS' if not bad and real else 'FAIL') + f' real shell build: {len(real) - len(bad)} of {len(real)} gates pass')
    print(f'RESULT shell mutations {fired} of {len(MUTATIONS)} fired; real build ' + ('PASS' if not bad and real else 'FAIL'))

if __name__ == '__main__':
    main(os.path.abspath(sys.argv[1]))

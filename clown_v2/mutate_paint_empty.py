"""Mutation for the crew paint gate in s2_shell.py: with PAINT_MIN None ("no face paint") a painted character
(whiteface) must FAIL every 'paint layer ... empty' line. Prints PASS when the gate fires on all four faces.
Run: CHAR=whiteface python3 -I s2_build.py <dir>; CHAR=whiteface python3 -I mutate_paint_empty.py <dir>"""
import os, sys, io, runpy, contextlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
# bpy first: chars.common needs bmesh, which bpy provides
import bpy
del bpy
import chars.common
C = chars.common.current()
C.PAINT_MIN = None
sys.argv = ['s2_shell.py', sys.argv[1]]
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    runpy.run_path(os.path.join(HERE, 's2_shell.py'), run_name='__main__')
fails = [l for l in buf.getvalue().splitlines() if l.startswith('FAIL paint layer') and 'empty' in l]
ok = len(fails) == len(C.EXPR)
print(('PASS' if ok else 'FAIL') + f' paint-empty mutation: a painted face is caught ({len(fails)} of {len(C.EXPR)} cells)')

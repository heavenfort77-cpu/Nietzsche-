# Cold-play summary: python3 tools/coldplay/summary.py /tmp/coldplay/<name>/log.jsonl
# Prints commands spent per scene (in the order first reached), the agent's words with confusion words flagged, harness errors, page errors and fps.
import json, sys, re
rows = [json.loads(l) for l in open(sys.argv[1])]
LOST = re.compile(r"\b(no idea|not sure|confus|lost|stuck|why|what\?|nothing happen|don't know|dont know|unclear|guess|huh|weird|give up|nothing changed|doesn't|doesnt|can't|cant|where)\b", re.I)
order, count, fps = [], {}, {}
for r in rows:
    h = r.get('hidden', {})
    sc = f"{h.get('scene')}/{h.get('mode')}"
    if sc not in count: order.append(sc); count[sc] = 0; fps[sc] = []
    count[sc] += 1
    if h.get('fps'): fps[sc].append(h['fps'])
print('commands per scene (first reached order):')
for sc in order:
    f = fps[sc]
    print(f'  {sc:28s} {count[sc]:4d}' + (f'   fps median {sorted(f)[len(f)//2]}' if f else ''))
print('\nsteps (* = words of confusion):')
for r in rows:
    h, c = r.get('hidden', {}), r.get('cmd', {})
    args = ' '.join(str(c[k]) for k in ('key', 'key2', 'label', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 's') if k in c)
    mark = '*' if LOST.search(r.get('says', '')) else ' '
    err = f" [harness: {r['error']}]" if r.get('error') else ''
    pe = f" [PAGE ERROR {r['pageErrors'][0][:80]}]" if r.get('pageErrors') else ''
    print(f"{mark}{r['step']:3d} {h.get('scene')}/{h.get('mode')} L{h.get('laughs')} {c.get('a')} {args} | {r.get('says','')[:200]}{err}{pe}")
last = rows[-1].get('hidden', {}) if rows else {}
print('\nlast state:', last)

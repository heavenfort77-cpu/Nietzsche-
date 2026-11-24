# Replay a cold-play log's commands against a running harness (to check what the harness or the game did): replay.py LOG PORT [last step]
import json, sys, urllib.request
rows = [json.loads(l) for l in open(sys.argv[1])]
port, last = sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10**9
urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{port}/', data=json.dumps({'a': 'wait', 's': 4, 'says': 'replay: logo'}).encode()), timeout=200).read()
for r in rows:
    c = dict(r['cmd'])
    if r['step'] > last or c.get('a') == 'quit': break
    c['says'] = 'replay'
    urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{port}/', data=json.dumps(c).encode()), timeout=200).read()
    print('replayed', r['step'], c.get('a'))

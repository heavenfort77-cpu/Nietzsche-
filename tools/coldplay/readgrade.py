# Reading level per scene from a kid-reader cold-play log (session 40, owner 25 Nov 2026).
# Usage: python3 tools/coldplay/readgrade.py /tmp/coldplay/<name>/log.jsonl
# For every line the player was shown (the real text, before the ??? mask), in the order first seen: the scene, the
# Flesch-Kincaid grade (US school year, vowel-group syllables; short lines read low), and the words outside the Dale-Chall 4th-grade list.
# Then per scene: steps spent there and the player's own words. Uses the textstat package (pip), the same list as server.cjs KID=1.
import json, os, re, sys
import textstat

LIST = os.path.join(os.path.dirname(textstat.__file__), 'resources', 'en', 'easy_words.txt')
E = set(w.strip().lower() for w in open(LIST) if w.strip())
SUF = [('ies', 'y'), ('ied', 'y'), ('ier', 'y'), ('iest', 'y'), ('ily', 'y'), ('es', ''), ('s', ''), ('ed', ''), ('ing', ''), ('er', ''), ('est', ''), ('ly', '')]


def has(w):
    return w in E or w + 'e' in E


def easy(w):
    w = w.lower().rstrip("'")
    if has(w) or w in ("won't", "can't", "i'm"):
        return True
    m = re.match(r"^(.+?)('s|'re|'ll|'ve|'d|n't|s')$", w)
    if m:
        return has(m.group(1))
    for suf, add in SUF:
        if w.endswith(suf) and len(w) - len(suf) >= 2:
            b = w[: -len(suf)] + add
            if has(b) or (re.search(r'([b-df-hj-np-tv-z])\1$', b) and has(b[:-1])):
                return True
    return False


def hard(t):
    return [w for w in re.findall(r"[A-Za-z][A-Za-z']*", t) if not easy(w)]


# Flesch-Kincaid grade with a vowel-group syllable count (textstat's own grade needs an NLTK download the session box refuses)
def syl(w):
    w = w.lower().strip("'")
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and not w.endswith(('le', 'ee')) and n > 1:
        n -= 1
    return max(1, n)


def fk(t):
    ws = re.findall(r"[A-Za-z][A-Za-z']*", t)
    ss = max(1, len(re.findall(r'[.!?]+', t)))
    return 0.39 * len(ws) / ss + 11.8 * sum(syl(w) for w in ws) / len(ws) - 15.59


rows, seen, scenes = [], set(), {}
for line in open(sys.argv[1]):
    d = json.loads(line)
    h = d.get('hidden') or {}
    sc = h.get('scene') or '?'
    s = scenes.setdefault(sc, {'steps': [], 'says': []})
    s['steps'].append(d['step'])
    if d.get('says'):
        s['says'].append('%d: %s' % (d['step'], d['says']))
    o = d.get('orig') or {}
    for kind, items in (('text', o.get('text') or []), ('button', o.get('buttons') or [])):
        for t in items:
            if (sc, t) in seen:
                continue
            seen.add((sc, t))
            n = len(re.findall(r"[A-Za-z][A-Za-z']*", t))
            g = fk(t) if n >= 4 else None
            rows.append((d['step'], sc, kind, t, g, hard(t)))

print('| step | scene | kind | line | grade | words a 4th grader may not know |')
print('| --- | --- | --- | --- | --- | --- |')
for st, sc, k, t, g, hw in rows:
    print('| %d | %s | %s | %s | %s | %s |' % (st, sc, k, t.replace('|', '/'), '' if g is None else '%.1f' % g, ', '.join(hw)))
print()
for sc, s in scenes.items():
    print('## %s: %d steps (%d-%d)' % (sc, len(s['steps']), s['steps'][0], s['steps'][-1]))
    for x in s['says']:
        print('- ' + x)

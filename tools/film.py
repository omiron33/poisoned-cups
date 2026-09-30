"""Write film.json from tools/plan.txt and data/lyrics.json: each scene starts just before its first
line, snapped to the nearest measured beat (data/lyrics.json "beats") that doesn't cut into a sung
line. INTRO, BREAK and INTERLUDE scenes fill the instrumental gap before the next sung line."""
import json, re, sys
L = json.load(open('data/lyrics.json'))
lines, beats = L['lines'], L.get('beats', [])
dur = L.get('duration') or (lines[-1]['end'] + 8.0)
norm = lambda s: re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9' ]", '', s.lower().replace('’', "'"))).strip()
plan = []
for row in open('tools/plan.txt'):
    if not row.strip() or row.startswith('#'): continue
    head, *rest = [x.strip() for x in row.split('|')]
    sid, scene = head.split()
    plan.append((sid, scene, rest[0], int(rest[1]) if len(rest) > 1 else 1))
starts, prev_end = [], 0.0
cursor = 0.0
for i, (sid, scene, pre, occ) in enumerate(plan):
    if pre in ('INTRO',):
        starts.append(0.0); continue
    if pre.startswith('BREAK') or pre in ('INTERLUDE', 'OUTRO'):
        starts.append(None); continue
    n = 0
    for l in lines:
        if l['start'] >= cursor and norm(l['text']).startswith(norm(pre)):
            n += 1
            break
    else:
        sys.exit('no line for ' + scene + ': ' + pre)
    cursor = l['start'] + 0.01
    starts.append(l['start'] - 0.12)
# instrumental scenes start where the previous scene's last line ends
for i, s in enumerate(starts):
    if s is None:
        nxt = next((x for x in starts[i + 1:] if x is not None), 1e9)
        ends = [l['end'] for l in lines if l['end'] <= nxt + 0.3]
        starts[i] = (max(ends) if ends else 0) + 0.4
def snap(t):
    ends = [l['end'] for l in lines if l['end'] <= t + 0.001]; lo = (max(ends) if ends else 0) + 0.02
    sts = [l['start'] for l in lines if l['start'] >= t - 0.001]; hi = (min(sts) if sts else 1e9) - 0.12
    c = [b for b in beats if lo <= b <= hi and abs(b - t) < 0.4]
    b = min(c, key=lambda x: abs(x - t)) if c else t
    return round(round(b * 60) / 60, 4)
starts = [0.0] + [snap(s) for s in starts[1:]]
scenes = [{'id': p[0], 'scene': p[1], 'from': starts[i], 'to': starts[i + 1] if i + 1 < len(plan) else round(dur, 4)} for i, p in enumerate(plan)]
for s in scenes:
    if s['to'] - s['from'] < 1.0: print('WARNING short scene', s)
json.dump({'fps': 60, 'samples': 8, 'scenes': scenes}, open('film.json', 'w'), indent=1)
for s in scenes: print(s['id'], s['scene'], s['from'], s['to'], round(s['to'] - s['from'], 2))

"""Fill docs/STORYBOARD.md's judgement cells from tools/storyboard.json, row by row in film order."""
import json, re
cells = json.load(open('tools/storyboard.json'))
film = json.load(open('film.json'))['scenes']
lines = open('docs/STORYBOARD.md').read().split('\n')
rows = [i for i, l in enumerate(lines) if re.match(r'^\| \d+:\d', l)]
assert len(rows) == len(film), (len(rows), len(film))
for i, s in zip(rows, film):
    c = cells[s['scene']]
    parts = lines[i].split(' | ')
    first = parts[1].replace('TODO', '').strip()
    lines[i] = ' | '.join([parts[0], (first + ' ' + c[0]).strip(), c[1], c[2], c[3] + ' |'])
open('docs/STORYBOARD.md', 'w').write('\n'.join(lines))
print('filled', len(rows))

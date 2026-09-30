"""Build data/lyrics.json from the forced alignment (intake/words.json), the official lyric lines
and the measured beats (data/audio.json). Words keep the official spelling; each line takes the
start of its first word and the end of its last."""
import json, sys
W = json.load(open('intake/words.json'))['words']
A = json.load(open('data/audio.json'))
lines = [l.strip() for l in open('intake/sung-lyrics.txt') if l.strip()]
toks = [(i, t) for i, l in enumerate(lines) for t in l.split()]
if len(toks) != len(W):
    sys.exit(f'word count differs: lyrics {len(toks)} vs aligned {len(W)}')
words, out_lines = [], []
for (li, tok), w in zip(toks, W):
    words.append({'w': tok, 'start': round(w['start'], 3), 'end': round(w['end'], 3), 'line': li})
for i, l in enumerate(lines):
    ws = [w for w in words if w['line'] == i]
    out_lines.append({'text': l, 'start': ws[0]['start'], 'end': ws[-1]['end']})
# words never overlap the next word, and have at least 60 ms
for a, b in zip(words, words[1:]):
    a['end'] = min(a['end'], b['start'])
    if a['end'] - a['start'] < 0.06: a['end'] = min(b['start'], a['start'] + 0.06)
beats = [b['time'] for b in A['beats']]
json.dump({'source': 'force-aligned to the recording (local torchaudio CTC); machine estimates',
           'duration': A['duration'], 'bpm': A['bpm'], 'beats': beats, 'kicks': A.get('kicks', []),
           'lines': out_lines, 'words': [{k: v for k, v in w.items() if k != 'line'} for w in words]},
          open('data/lyrics.json', 'w'), indent=0)
print(len(out_lines), 'lines', len(words), 'words', 'bpm', A['bpm'], 'first', out_lines[0])

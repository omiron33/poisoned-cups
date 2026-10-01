"""Frames and depth for a scene clip: art/video/<id>.mp4 -> art/video/<id>/f0001.jpg ... and d0001.png ...
(16-bit depth, near = white, smoothed over neighbouring frames so the relief does not shimmer).
Prints the frame count for the scene file (codeScene clip.count). Same Python as tools/depth.py.
  python tools/clip-frames.py p10 [p11 ...]"""
import os, subprocess, sys, glob, numpy as np
from PIL import Image
from transformers import pipeline

SONG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf')
for id_ in sys.argv[1:]:
    src = os.path.join(SONG, 'art', 'video', f'{id_}.mp4')
    out = os.path.join(SONG, 'art', 'video', id_)
    os.makedirs(out, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', 'fps=24', '-q:v', '2', os.path.join(out, 'f%04d.jpg')], check=True)
    frames = sorted(glob.glob(os.path.join(out, 'f*.jpg')))
    raw = []
    for f in frames:
        img = Image.open(f).convert('RGB')
        raw.append(np.asarray(pipe(img)['predicted_depth'].squeeze(), dtype=np.float32))
    # one normalisation for the whole clip, then a 5-frame temporal average
    lo, hi = np.percentile(np.stack(raw), 0.5), np.percentile(np.stack(raw), 99.5)
    for i, f in enumerate(frames):
        win = raw[max(0, i - 2): i + 3]
        d = np.clip((np.mean(win, axis=0) - lo) / max(1e-6, hi - lo), 0, 1)
        size = Image.open(f).size
        Image.fromarray((d * 65535).astype(np.uint16)).resize(size, Image.BICUBIC).save(os.path.join(out, 'd' + os.path.basename(f)[1:-4] + '.png'))
    for junk in glob.glob(os.path.join(out, '._*')): os.remove(junk)
    print(id_, len(frames), 'frames')

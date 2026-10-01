"""Depth map for a still: art/<name>.png (or .jpg) -> art/<name>.depth.png, 16-bit grey, near = white.
Run with a Python that has torch and transformers (Depth Anything V2 Small, local).
  python tools/depth.py art/p09.png [more images]"""
import sys, numpy as np
from PIL import Image
from transformers import pipeline

pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf')
for path in sys.argv[1:]:
    img = Image.open(path).convert('RGB')
    d = np.asarray(pipe(img)['predicted_depth'].squeeze(), dtype=np.float32)   # relative inverse depth: big = near
    d = (d - np.percentile(d, 0.5)) / max(1e-6, np.percentile(d, 99.5) - np.percentile(d, 0.5))
    d = np.clip(d, 0, 1)
    out = Image.fromarray((d * 65535).astype(np.uint16)).resize(img.size, Image.BICUBIC)
    stem = path.rsplit('.', 1)[0]
    out.save(f'{stem}.depth.png')
    print(path, img.size, '->', f'{stem}.depth.png')

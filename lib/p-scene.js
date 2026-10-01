// A premium "people made of code" scene from one still: the image (art/<id>.png, generated) is lifted
// by its depth map (art/<id>.depth.png, tools/depth.py) and drawn in code characters (lib/p-code.js).
// The picture swirls in out of code at the start, holds with a slow camera move and spontaneous
// glitches (bigger ones on alternate beats), and swirls back out into code before the cut.
//
//   import { codeScene } from '/song/lib/p-scene.js';
//   export const kind = 'three';
//   export default (P) => codeScene(P, { name: 'p10-loads', art: 'p10', move: { from: [...], to: [...] } });
//
// opts: art (id under art/), relief (depth pop, default 0.14), gain (image brightness, default 2.6),
//   move { from: [x, y, zScale], to: [x, y, zScale], look: [x, y] }   camera start/end offsets, zScale
//   multiplies the framing distance (below 1 pushes in), look = where it aims at the end;
//   clip { count, fps }: play art/video/<art>/f####.jpg (+ d####.png depth, tools/clip-frames.py) instead
//   of the still, from the scene's start;
//   code: options for codeLook (cell, gain, rain, ...); swirlIn / swirlOut (s, default 0.9 / 0.55).
import lyrics from '/timing.js';
import { relief } from '/song/lib/p-relief.js';
import { codeLook } from '/song/lib/p-code.js';

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const beats = lyrics.beats ?? [];

export function codeScene(P, o) {
  const from = P.from, to = P.to;
  const inS = o.swirlIn ?? 0.9, outS = o.swirlOut ?? 0.55;
  // a still gets a push and drift; a moving clip only a gentle drift (it has its own motion)
  const mv = { ...(o.clip ? { from: [0.01, 0, 0.95], to: [-0.01, 0, 0.9], look: [0, 0] } : { from: [0.04, 0.01, 0.96], to: [-0.04, -0.01, 0.84], look: [0.05, 0] }), ...(o.move ?? {}) };
  let look, inner, r, dist;
  return {
    name: o.name, from, to,
    async build({ THREE, renderer, W, H }) {
      inner = new THREE.Scene(); inner.background = new THREE.Color(0, 0, 0);
      const frames = o.clip ? { dir: `/song/art/video/${o.art}`, count: o.clip.count, fps: o.clip.fps ?? 24 } : null;
      r = await relief(THREE, { image: `/song/art/${o.art}.png`, depth: `/song/art/${o.art}.depth.png`, frames, relief: o.relief ?? (frames ? 0.08 : 0.14), gain: o.gain ?? (frames ? undefined : 2.6) });
      inner.add(r.mesh);
      dist = r.framing(32, W / H);
      look = codeLook(THREE, renderer, W, H, { cell: 8, rain: 0.35, gain: 3.2, detail: 0.9, floor: 0.025, ...(o.code ?? {}), raw: P.raw });
      return { scene: look.scene };
    },
    // a moving clip: show the clip frame for this time (sub-frames share it)
    async prepare(t) { await r.seek(t - from); },
    camera(t) {
      const p = ease((t - from) / (to - from));
      const L = (a, b) => a + (b - a) * p;
      return { pos: [L(mv.from[0], mv.to[0]), L(mv.from[1], mv.to[1]), dist * L(mv.from[2], mv.to[2])], target: [mv.look[0] * p, mv.look[1] * p, 0.05], fov: 32 };
    },
    update(t, { camera }) {
      // swirl in, hold, swirl out
      const fin = ease((t - from) / inS), fout = ease((to - t) / outS);
      const out = t > to - outS;
      // a forced glitch on alternate beats, decaying fast
      let g = 0;
      for (let i = beats.length - 1; i >= 0; i--) if (beats[i] <= t) { if (i % 2 === 0) g = 0.9 * Math.exp(-(t - beats[i]) * 16); break; }
      look.set({ form: Math.min(fin, fout), glitch: g, dir: out ? -1 : 1 });
      look.render(inner, camera, t);
    },
    post() { return { exposure: 1.0, bloom: 0.35, threshold: 0.55, grain: 0.02, vignette: 0.6, ca: 0.3, ...(o.post ?? {}) }; },
    finish() { return { fade: 0 }; },
  };
}

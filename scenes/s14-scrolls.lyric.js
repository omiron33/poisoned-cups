// The words of s14-scrolls: written onto the scroll itself (a world-space plane on
// the lectern's slope), so the camera's push moves past them like the fine print.
import { cameraPlane } from '/engine.js';
import { linesFrom, flow, note, outFade, stamp, arm, strike, slash, glitch, keyOf, paint, arrive, carry } from '/song/lib/type.js';
// a calm word for arm(): rises into place like flow
const flat = (ctx, w, t, x, y, px, o) => { const s = arrive(w, t); return paint(ctx, w.w, x, y + (1 - s.k) * px * 0.18, px, { ...o, alpha: s.a * (o.alpha ?? 1) }); };

// the lie's red words in a deeper ink so they hold 4.5:1 on the vellum and its shadows
const deep = (fn, ink) => (ctx, w, t, x, y, px, o) => fn(ctx, w, t, x, y, px, { ...o, ink });
const tongueSlash = slash, liarGlitch = glitch;

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
// the sheet's slope (matches s14-scrolls.js)
const C = [0, 1.05, 0], AY = [0, 0.5646, -0.8253], AN = [0, 0.8253, 0.5646];
const at = (x, y, z) => C.map((c, i) => c + AY[i] * y + AN[i] * z + [1, 0, 0][i] * x);

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.7,
  // set full-frame over the dark hall to the right of the scroll, so every word is large and reads
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 2150, y: 1960 });
    const fade = [P.to - 0.08, P.to];
    note(ctx, 'LOT 14  ·  SCROLL  ·  MATT 23:5', 2150, 260, { px: 44, ground: 'dark', rule: 900, alpha: 0.9 * outFade(t, P.to - 0.08, P.to) });
    const liar = L2.words[L2.words.length - 1];
    stamp(ctx, 'FALSE', t, liar.start + 0.04, { x: 2700, y: 1950, px: 140, rot: -0.06, ground: 'dark' });
    // larger, so it reads from the camera's opening distance (wraps SCROLLS to a second row)
    flow(ctx, L1, t, { x: 2150, y: 620, px: 250, maxW: 1500, lead: 1.2, ground: 'dark', fade });
    // the lie: the tongue's words are hit, "God" struck, "liar" glitched; rows opened wide so the
    // foreshortened sheet never stacks them on top of each other
    arm(ctx, L2.words, t, (w, i) => { const k = keyOf(w.w); return k === 'god' ? strike : k === 'liar' ? liarGlitch : k === 'tongues' ? tongueSlash : flat; },
      { x: 2150, y: 1150, px: 210, maxW: 1500, lead: 1.3, ground: 'dark', alpha: outFade(t, fade[0], fade[1]) });
  },
});

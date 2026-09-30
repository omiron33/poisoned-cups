// The words of s14-scrolls: written onto the scroll itself (a world-space plane on
// the lectern's slope), so the camera's push moves past them like the fine print.
import { linesFrom, flow, note, outFade, stamp, arm, strike, slash, glitch, keyOf, paint, arrive, carry } from '/song/lib/type.js';
// a calm word for arm(): rises into place like flow
const flat = (ctx, w, t, x, y, px, o) => { const s = arrive(w, t); return paint(ctx, w.w, x, y + (1 - s.k) * px * 0.18, px, { ...o, alpha: s.a * (o.alpha ?? 1) }); };

// the lie's red words in a deeper ink so they hold 4.5:1 on the vellum and its shadows
const deep = (fn, ink) => (ctx, w, t, x, y, px, o) => fn(ctx, w, t, x, y, px, { ...o, ink });
const tongueSlash = deep(slash, '84, 6, 14'), liarGlitch = deep(glitch, '84, 6, 14');

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
// the sheet's slope (matches s14-scrolls.js)
const C = [0, 1.05, 0], AY = [0, 0.5646, -0.8253], AN = [0, 0.8253, 0.5646];
const at = (x, y, z) => C.map((c, i) => c + AY[i] * y + AN[i] * z + [1, 0, 0][i] * x);

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.65,
  textPlane() { return { c: at(-0.04, 0.03, 0.006), ax: [1, 0, 0], ay: AY, hs: [0.4, 0.4 * 9 / 16] }; },
  drawText(ctx, t) {
    carry(ctx, t, P, { ground: 'light' });
    const fade = [P.to - 0.08, P.to];
    note(ctx, 'LOT 14  ·  SCROLL  ·  VELLUM  ·  WAX SEAL  ·  MATT 23:5', 120, 150, { px: 58, ground: 'light', rule: 900, alpha: 0.9 * outFade(t, P.to - 0.08, P.to) });
    const liar = L2.words[L2.words.length - 1];
    stamp(ctx, 'FALSE', t, liar.start + 0.04, { x: 2850, y: 1920, px: 230, rot: -0.1, ground: 'light', color: '150, 14, 26' });
    // larger, so it reads from the camera's opening distance (wraps SCROLLS to a second row)
    flow(ctx, L1, t, { x: 100, y: 520, px: 340, maxW: 3640, lead: 1.12, ground: 'light', fade });
    // the lie: the tongue's words are hit, "God" struck, "liar" glitched; rows opened wide so the
    // foreshortened sheet never stacks them on top of each other
    arm(ctx, L2.words, t, (w, i) => { const k = keyOf(w.w); return k === 'god' ? strike : k === 'liar' ? liarGlitch : k === 'tongues' ? tongueSlash : flat; },
      { x: 100, y: 1400, px: 290, maxW: 3640, lead: 1.5, ground: 'light', alpha: outFade(t, fade[0], fade[1]) });
  },
});

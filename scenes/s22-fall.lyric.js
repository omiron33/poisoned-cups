// The words of s22-fall.
// "Turn your hearts": mercy italic, centred high, calm, in the warm light.
// "Let the proud dreams fall and tire": set in a row under it (PROUD slashed in); on "fall" the
// words drop one after another like the towers and land askew along the bottom of the frame, still
// readable; "tire" arrives already down and settles slowly, spent.
import { linesFrom, flow, paint, measure, arrive, slash, note, outFade, keyOf, spring, ease, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [LT, LP] = linesFrom('Turn your hearts', 'Let the proud dreams fall and tire');
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.75,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P);
    const fade = outFade(t, P.to - 0.2, P.to + 0.3);
    // lower and larger: clear of the SKYLINE note at the top right
    flow(ctx, LT, t, { x: 1920, y: 600, px: 240, align: 'center', alpha: fade });
    const tFall = LP.words.find((w) => /fall/i.test(w.w)).start;
    const px = 190;
    const total = LP.words.reduce((a, w) => a + measure(ctx, w.w, px), 0) - px * 0.26;
    let x = 1920 - total / 2;
    LP.words.forEach((w, i) => {
      const adv = measure(ctx, w.w, px);
      const k = keyOf(w.w);
      const td = Math.max(tFall + i * 0.06, w.start);          // when this word drops
      const late = w.start >= tFall;                             // words sung after "fall" start down
      const s = late ? 1 : spring(t, td, k === 'tire' ? 0.9 : 0.4, 0.25);
      const y = 960 + (1880 - 960) * s;
      const rot = (hsh(i + 2) - 0.5) * 0.14 * clamp01(s);
      ctx.save();
      ctx.translate(x + adv / 2, y);
      ctx.rotate(rot * (k === 'tire' ? ease.out3((t - w.start) / 1.2) : 1));
      if (k === 'proud') slash(ctx, w, t, -adv / 2, 0, px, { alpha: fade });
      else {
        const a = arrive(w, t);
        if (a.a > 0.002) paint(ctx, w.w, -adv / 2, (1 - a.k) * -px * 0.25, px, { alpha: a.a * fade });
      }
      ctx.restore();
      x += adv;
    });
    const na = clamp01((t - tFall) / 0.3) * fade;
    if (na > 0.01) note(ctx, 'LOT 22  ·  SKYLINE  ·  0 OF 8 STANDING', 3600, 250, { align: 'right', rule: 0, alpha: 0.85 * na });
  },
});

// The words of s16-see2. The hook pours: each word drops in from above the frame on its onset and
// lands in a left-hand stack with a hard bounce, the way the vipers spill over the lip. The
// question sits low on the left in the dark away from the lit cup: small words on one baseline,
// "I" struck huge in gold, "see" slashed in large.
import { linesAt, paint, measure, strike, slash, note, outFade, keyOf, clamp01, carry } from '/song/lib/type.js';
import { spring } from '/song/lib/look.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  return {
    textSize: [3840, 2160],
    shade: 0.4,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "skill" (s15) is sung across the cut
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      // the hook falls into a stack inside the safe margin
      const lift = spring(t, L2.words[0].start - 0.1, 0.4, 0.2);
      const rows = [[L1.words[0], 330, 580], [L1.words[1], 150, 780], [L1.words[2], 400, 1120]];
      for (const [w, px, y0] of rows) {
        if (t < w.start) continue;
        const u = t - w.start;
        // a drop with gravity, then a bounce that dies
        const fall = u < 0.16 ? (1 - (u / 0.16) ** 2) * -(y0 + 300) : -Math.abs(Math.sin((u - 0.16) * 22)) * Math.exp(-(u - 0.16) * 12) * px * 0.25;
        ctx.save(); ctx.translate(240, y0 + fall);
        paint(ctx, w.w, 0, 0, px, { ground: 'dark', alpha: out * clamp01(u / 0.04 + 0.5) });
        ctx.restore();
      }
      // the question, low left
      let x = 240;
      const y = 1920;
      for (const w of L2.words) {
        const k = keyOf(w.w);
        if (k === 'i') { x += strike(ctx, w, t, x, y, 560, { ground: 'dark', alpha: out }); continue; }
        // extra room before "see": its sliding halves must not sweep over "can't" beside it
        if (k.startsWith('see')) { x += 240; x += slash(ctx, w, t, x, y, 400, { ground: 'dark', alpha: out }); continue; }
        if (t >= w.start) paint(ctx, w.w, x, y, 120, { ground: 'dark', alpha: out * clamp01((t - w.start) / 0.06) });
        x += measure(ctx, w.w, 120);
      }
      note(ctx, 'LOT 16  ·  CHALICE  ·  TITANIUM  ·  CONTENTS: UNDISCLOSED  ·  MATT 23:33', 240, 1330, { alpha: 0.75 * out * lift, rule: 0 });
    },
  };
};

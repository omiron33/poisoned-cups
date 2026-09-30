// The words of s26-clean-cup (no sung words). A quiet caption quoting the verse, set in Garamond
// italic, words fading in one by one under a hairline; then the reference in mono; then the end
// title POISONED CUPS · MATTHEW 23:26, tracked capitals slowly widening until the last frame, fading
// out with the picture.
import { note, outFade, VOICES, paint, measure, clamp01, ease, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { T26 } from './s26-clean-cup.js';

const VERSE = 'First clean the inside of the cup'.split(' ');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.6,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P);
    const u = t - P.from;
    // the verse, bottom left, 6 s
    const cIn = T26.caption, cOut = T26.ref;
    if (u >= cIn && u < cOut + 0.6) {
      const a = outFade(u, cOut - 0.5, cOut);
      let x = 260;
      VERSE.forEach((w, i) => {
        const k = clamp01((u - cIn - i * 0.22) / 0.5);
        const adv = measure(ctx, w, 120, { voice: VOICES.mercy, ground: 'dark' });
        paint(ctx, w, x, 1820 + (1 - ease.out3(k)) * 20, 120, { voice: VOICES.mercy, ground: 'dark', alpha: k * a });
        x += adv;
      });
      ctx.fillStyle = `rgba(246, 240, 230, ${0.7 * a * clamp01((u - cIn) / 0.8)})`;
      ctx.fillRect(260, 1880, 1500 * ease.out3(clamp01((u - cIn) / 1.2)), 3);
    }
    // the reference, 4 s
    if (u >= T26.ref && u < T26.ref + 2.0) {
      const a = clamp01((u - T26.ref) / 0.5) * outFade(u, T26.ref + 1.6, T26.ref + 1.95);
      note(ctx, 'MATTHEW 23:26', 260, 1820, { px: 88, ground: 'dark', alpha: 0.95 * a, rule: 900 });
    }
    // the end title, from under the reference to the last frame
    const tt = T26.ref + 2.0;   // from ~164 s: the reference moves into the title
    if (u >= tt) {
      const k = clamp01((u - tt) / 0.35);
      const a = k * outFade(t, P.to - 1.0, P.to - 0.05);
      const span = (u - tt) / Math.max(1, P.to - P.from - tt);   // 0..1 to the last frame
      ctx.save();
      ctx.textAlign = 'left';
      ctx.font = `500 ${210}px "EB Garamond"`;
      ctx.letterSpacing = `${(0.2 + 0.08 * span) * 210}px`;
      const s = 'POISONED CUPS';
      const w = ctx.measureText(s).width;
      ctx.fillStyle = `rgba(246, 226, 180, ${a.toFixed(3)})`;
      ctx.fillText(s, 1920 - w / 2 + 0.1 * 210, 1720 - 20 * span);
      ctx.letterSpacing = '0px';
      ctx.restore();
      note(ctx, 'MATTHEW 23:26', 1920, 1880 - 20 * span, { px: 60, ground: 'dark', align: 'center', alpha: 0.9 * a });
    }
  },
});

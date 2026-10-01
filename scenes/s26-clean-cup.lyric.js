// The words of s26-clean-cup (v2; no sung words). Restraint: once the cup is clean and the camera
// still, the verse fades in low on the left in calm Garamond italic, word by word over a hairline;
// then MATTHEW 23:26 settles under it in small mono. Nothing glitches, nothing moves; both hold and
// fade out with the picture over the last 1.5 s.
import { note, outFade, VOICES, paint, measure, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { T26 } from './s26-clean-cup.js';

const VERSE = 'First clean the inside of the cup'.split(' ');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.5,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P);
    const u = t - P.from;
    const end = outFade(t, P.to - 1.5, P.to - 0.02);
    if (u >= T26.caption) {
      let x = 260;
      const px = 132;
      VERSE.forEach((w, i) => {
        const k = clamp01((u - T26.caption - i * 0.16) / 0.45);
        paint(ctx, w, x, 1760, px, { voice: VOICES.mercy, ground: 'dark', alpha: k * end });
        x += measure(ctx, w, px, { voice: VOICES.mercy, ground: 'dark' });
      });
      const k = clamp01((u - T26.caption) / 1.6);
      ctx.fillStyle = `rgba(232, 224, 255, ${(0.55 * end * k).toFixed(3)})`;
      ctx.fillRect(262, 1830, (x - 262 - 40) * k, 3);
    }
    if (u >= T26.ref) {
      const k = clamp01((u - T26.ref) / 0.6);
      note(ctx, 'MATTHEW 23:26', 262, 1980, { px: 58, ground: 'dark', alpha: 0.92 * k * end, color: '236, 226, 206' });
    }
  },
});

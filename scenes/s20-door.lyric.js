// The words of s20-door. "You stand in the door" stacks up the dark wall left of the doorway, one
// word slammed on each onset. "Won't walk in" glitches in on the right wall as the bars drop. On the
// low sub-cut "Or let the poor" is struck along the bottom left, and on "poor" a gold bar swings
// down across POOR like the barrier arm, stopping just above the word. A mono note sits bottom right.
import { linesAt, arm, glitch, strike, paint, measure, note, outFade, clamp01, ease, spring, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

// The stack up the wall, held still: each word gets its own fixed row (top down) and lands on its
// onset with a short eased drop in scale (done in 6 frames, decelerating), then never moves, so no
// word is shoved up by the next one.
function stack(ctx, words, t, { x, y, px, step, alpha }) {
  words.forEach((w, i) => {
    if (t < w.start) return;
    const k = ease.out3((t - w.start) / 0.1);
    const a = clamp01((t - w.start) / 0.04) * alpha;
    const wd = measure(ctx, w.w, px) - px * 0.26;
    ctx.save(); ctx.translate(x + wd / 2, y + i * step); const sc = 1 + 0.12 * (1 - k); ctx.scale(sc, sc);
    paint(ctx, w.w, -wd / 2, 0, px, { alpha: a, ground: 'dark' });
    ctx.restore();
  });
}

export default (P) => {
  const [L1, L2, L3] = linesAt(P.from - 0.5, 'You stand in the door', 'Won', 'Or let the poor');
  const tWont = L2.words[0].start;
  const wPoor = L3.words[L3.words.length - 1];
  return {
    textSize: [3840, 2160], shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "floor" (s19) is sung across the cut
      carry(ctx, t, P);
      const end = outFade(t, P.to - 0.2, P.to);
      stack(ctx, L1.words, t, { x: 260, y: 480, px: 230, step: 260, alpha: outFade(t, tWont - 0.25, tWont) });
      arm(ctx, L2.words, t, glitch, { x: 3600, y: 620, px: 180, align: 'right', alpha: end, beats: [] });
      // "Or let the poor" along the bottom left
      const px = 210, y = 1900;
      let x = 260;
      for (const w of L3.words) {
        const adv = measure(ctx, w.w, px);
        if (w === wPoor && t >= w.start) {
          // the gold barrier over POOR: pivots at the word's right end, swings from upright to level
          const k = spring(t, w.start - 0.05, 0.22, 0.2);
          const ang = -Math.PI / 2 * (1 - k);
          const wd = adv - px * 0.26;
          ctx.save();
          ctx.translate(x + wd + px * 0.2, y - px * 1.05);
          ctx.rotate(ang);
          ctx.fillStyle = `rgba(242, 196, 104, ${end.toFixed(3)})`;
          ctx.fillRect(-(wd + px * 0.45), -px * 0.05, wd + px * 0.45, px * 0.1);
          ctx.restore();
        }
        strike(ctx, w, t, x, y, px, { alpha: end, rot: 0.05 });
        x += adv;
      }
      note(ctx, 'LOT 20 · THRESHOLD · ACCESS DENIED · MATT 23:13', 3600, 2010, { px: 38, align: 'right', alpha: 0.85 * clamp01((t - P.from - 0.3) / 0.3) * end });
    },
  };
};

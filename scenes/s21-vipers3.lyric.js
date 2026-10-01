// The words of s21-vipers3 (hook rung 4, the top). The hook is near-monumental and fully digital:
// BROOD across the top, OF small, VIPERS the full width below, each struck in as misregistered
// colour plates snapping into register and cut through with raster scanlines like a giant LED
// sign over the fire. On "Who" the sign cuts out and the question takes the frame: a thin row of
// small capitals, then FIRE? huge in a thermal-camera ramp (white-hot at the top to magenta at the
// foot), scanline-cut too, with a mono temperature scale beside it.
import { linesAt, misreg, volt, glitch, measure, note, outFade, clamp01, ease, carry, voiceOf, shown, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

// raster cut: knock thin horizontal lines out of whatever is drawn in the box
function raster(ctx, x, y0, w, h, step, a) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = `rgba(0, 0, 0, ${a.toFixed(3)})`;
  for (let y = y0; y < y0 + h; y += step) ctx.fillRect(x, y, w, Math.max(2, step * 0.28));
  ctx.restore();
}

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  const W = (ctx, w, px) => measure(ctx, w.w, px) - px * 0.26;
  return {
    textSize: [3840, 2160],
    shade: 0.8,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      const gone = clamp01(1 - (t - L2.words[0].start + 0.04) / 0.08);
      if (gone > 0) {
        const o = { ground: 'dark', alpha: out * gone };
        const bpx = 520, vpx = 880, opx = 200;
        const bw = W(ctx, brood, bpx), ow = W(ctx, of, opx), gap = 110;
        const bx = 1920 - (bw + gap + ow) / 2, vx = 1920 - W(ctx, vipers, vpx) / 2;
        const bs = bpx * 1.14, vs = vpx * 1.14;
        misreg(ctx, brood, t, bx, 830, bpx, o);
        if (t >= brood.start) raster(ctx, bx - 30, 830 - bs * 0.92, bw + 60, bs * 0.95, 18, 0.85);
        volt(ctx, of, t, bx + bw + gap, 830, opx, o);
        misreg(ctx, vipers, t, vx, 1930, vpx, o);
        if (t >= vipers.start) raster(ctx, vx - 30, 1930 - vs * 0.92, W(ctx, vipers, vpx) + 60, vs * 0.95, 24, 0.85);
      } else {
        const qpx = 140;
        let tw = 0; for (const w of body) tw += measure(ctx, w.w, qpx);
        let x = 1920 - (tw - qpx * 0.26) / 2;
        for (const w of body) x += glitch(ctx, w, t, x, 560, qpx, { ground: 'dark', alpha: out });
        const u = t - fire.start + 0.02;
        if (u > 0) {
          const v = VOICES.violent, fpx = 980, size = Math.round(fpx * v.scale);
          const s = shown(fire.w).toUpperCase().replace('?', ' ?');   // a word space before the ? so it never fuses with the E
          ctx.font = v.font(size); ctx.letterSpacing = `${v.track * size}px`;
          const fw = ctx.measureText(s).width;
          const fx = 1920 - fw / 2, fy = 1900, top = fy - size * 0.88;
          const k = ease.out5(u / 0.08);
          const g = ctx.createLinearGradient(0, top, 0, fy);
          g.addColorStop(0, `rgba(255, 252, 240, ${out})`); g.addColorStop(0.45, `rgba(255, 200, 120, ${out})`); g.addColorStop(1, `rgba(255, 96, 170, ${out})`);
          ctx.save(); ctx.translate(1920, fy); ctx.scale(1 + 0.25 * (1 - k), 1 + 0.25 * (1 - k)); ctx.translate(-1920, -fy);
          ctx.globalAlpha = clamp01(k * 1.5);
          ctx.fillStyle = g; ctx.fillText(s, fx, fy);
          ctx.restore(); ctx.letterSpacing = '0px';
          // the raster cut stops short of the question mark (cut through, it read as a 2)
          ctx.font = v.font(size); ctx.letterSpacing = `${v.track * size}px`;
          const lw = ctx.measureText(s.replace(/[?]/g, '')).width; ctx.letterSpacing = '0px';
          raster(ctx, fx - 40, top - 20, lw + 40, size * 0.95, 22, 0.8);
          // (v3: no temperature scale beside FIRE: the one annotation is the grid tag)
        }
      }
      // the grid tag only over the question (over the hook it sat on top of BROOD)
      if (gone <= 0) note(ctx, 'CITY GRID  ·  CONTAINMENT: NONE  ·  MATT 23:33', 240, 190, { px: 36, alpha: 0.85 * out });
    },
  };
};

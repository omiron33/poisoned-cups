// The words of s08-see (hook rung 2). The hook arrives as a threat classification: a dossier
// block at the top left (a mono header bar, then BROOD OF VIPERS snapping into register in hot
// magenta, with a mono readout of the six units). The question runs small along a hairline at the
// bottom; the I is set huge in gold-white at the left, steady and luminous, and SEE opens like an
// iris beside the light: a gold ring dilates and the word is revealed through it, whole, never
// glitched. At the end the classification reads CLASS VOID.
import { linesAt, dossier, misreg, strike, scan, paint, measure, note, outFade, keyOf, clamp01, ease, carry, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const I = L2.words.find((w) => keyOf(w.w) === 'i');
  const see = L2.words.find((w) => keyOf(w.w).startsWith('see'));
  const tOut = P.to - 1.25;
  return {
    textSize: [3840, 2160],
    shade: 0.85,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { x: 1300, y: 1960 });
      const out = outFade(t, P.to - 0.3, P.to);
      // the classification
      const void_ = t >= see.start;
      dossier(ctx, L1.words, t, { x: 250, y: 560, px: 200, head: 'THREAT CLASS 4  ·  BROOD  ·  06 UNITS', weapon: misreg, ground: 'dark', maxW: 2200, alpha: out });
      if (t >= L1.words[2].start) note(ctx, void_ ? 'STATUS: SEEN' : 'STATUS: UNOBSERVED', 250, 690, { px: 40, alpha: 0.85 * out, color: void_ ? '255, 226, 170' : '230, 170, 220' });
      // the question, small, along a hairline at the bottom right, with gaps for I and SEE
      let sx = 2000;   // right of the rising cable, which crosses x≈2000–2400 at the end
      const qpx = 104;
      for (const w of L2.words) {
        if (w === I || w === see) {
          // a small gold slot mark where the big word belongs
          if (t >= w.start) { ctx.fillStyle = `rgba(255, 226, 170, ${(0.8 * out).toFixed(3)})`; ctx.fillRect(sx, 1960 - qpx * 0.35, qpx * 0.5, 4); }
          sx += qpx * 0.8;
          continue;
        }
        sx += scan(ctx, w, t, sx, 1960, qpx, { ground: 'dark', alpha: out });
      }
      if (t >= L2.words[0].start) { ctx.fillStyle = `rgba(230, 226, 240, ${(0.55 * out).toFixed(3)})`; ctx.fillRect(2000, 1995, 1600 * ease.out3((t - L2.words[0].start) / 0.5), 3); }
      // I: huge, gold-white, steady
      if (I && t >= I.start - 0.02) paint(ctx, I.w, 360, 1400, 900, { ground: 'dark', alpha: out * clamp01((t - I.start + 0.02) / 0.08) });
      // SEE: an iris dilates and the word is seen through it
      if (see && t >= see.start - 0.02) {
        const u = t - see.start + 0.02;
        const k = ease.out5(u / 0.08);
        const spx = 420, sw = measure(ctx, see.w, spx, { voice: VOICES.divine }) - spx * 0.26;
        const cx = 2900, cy = 1200, R = sw * 0.58 + 50;
        ctx.strokeStyle = `rgba(255, 226, 170, ${(0.85 * out).toFixed(3)})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(cx, cy - spx * 0.32, R * (0.25 + 0.75 * k), 0, Math.PI * 2); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - spx * 0.32, R * k, 0, Math.PI * 2); ctx.clip();
        paint(ctx, see.w, cx - sw / 2, cy, spx, { ground: 'dark', alpha: out, voice: VOICES.divine });
        ctx.restore();
      }
      if (t >= tOut) note(ctx, 'PATHS EXPOSED  ·  GRID 1:1', 3590, 250, { px: 40, align: 'right', alpha: 0.85 * out * clamp01((t - tOut) / 0.2) });
      note(ctx, 'MATT 23:33', 3590, 330, { px: 40, align: 'right', alpha: 0.7 * out });
    },
  };
};

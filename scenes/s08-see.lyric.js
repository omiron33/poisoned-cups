// The words of s08-see (hook rung 2). The hook arrives as a threat classification: a dossier
// block at the top left (a mono header bar, then BROOD OF VIPERS snapping into register in hot
// magenta, with a mono readout of the six units). The question runs small along a hairline at the
// bottom; the I is set huge in gold-white at the left, steady and luminous, and SEE opens like an
// iris beside the light: a gold ring dilates and the word is revealed through it, whole, never
// glitched. At the end the classification reads CLASS VOID.
import { linesAt, dossier, arm, misreg, strike, scan, paint, measure, note, outFade, keyOf, clamp01, ease, carry, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const I_SANS = { ...VOICES.divine, font: (px) => `700 ${px}px "Inter Tight"`, track: 0, scale: 1, glow: undefined };

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
      // the threat-class header, lifted clear of the caps (lib dossier() sets its bar touching them),
      // then the words laid out exactly as dossier() lays them
      if (t >= L1.words[0].start - 0.4) {
        const px = 200, k = ease.out3((t - (L1.words[0].start - 0.4)) / 0.25), head = 'THREAT CLASS 4  ·  BROOD  ·  06 UNITS';
        ctx.font = `800 ${Math.round(px * 0.26)}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.05}px`;
        const hw = ctx.measureText(head).width;
        ctx.fillStyle = `rgba(150, 255, 110, ${(0.9 * k * out).toFixed(3)})`;
        ctx.fillRect(250, 560 - px * 1.72, (hw + px * 0.4) * k, px * 0.34);
        ctx.fillStyle = `rgba(8, 10, 12, ${(k * out).toFixed(3)})`;
        ctx.fillText(head, 250 + px * 0.12, 560 - px * 1.47);
        ctx.letterSpacing = '0px';
        arm(ctx, L1.words, t, misreg, { x: 250, y: 560, px, ground: 'dark', maxW: 2200, alpha: out * (1 - 0.55 * clamp01((t - (L2.words[0].start - 0.1)) / 0.25)) });
      }
      // the question (placement pass): one row in reading order, low across the frame. The small
      // words scan in; the I is set huge in gold-white in its place in the row, steady; SEE opens
      // like an iris in its place, whole, never glitched. Nothing moves once it has landed.
      const qpx = 150, ipx = 560, spx = 380, Y = 1560;
      const sw = see ? measure(ctx, see.w, spx, { voice: VOICES.divine }) - spx * 0.26 : 0;
      const R = sw * 0.58 + 50;
      const adv = (w) => (w === I ? measure(ctx, w.w, ipx) - ipx * 0.26 + qpx * 0.75
        : w === see ? R * 2 + qpx * 0.25
        : measure(ctx, w.w, qpx));
      let sx = 250;
      for (const w of L2.words) {
        if (w === I) {
          if (t >= w.start - 0.02) paint(ctx, w.w, sx + qpx * 0.2, Y, ipx, { ground: 'dark', alpha: out * clamp01((t - w.start + 0.02) / 0.08) });
        } else if (w === see) {
          if (t >= w.start - 0.02) {
            const u = t - see.start + 0.02;
            const k = ease.out5(u / 0.08);
            const cx = sx + R + qpx * 0.1, cy = Y - spx * 0.05;
            ctx.strokeStyle = `rgba(255, 226, 170, ${(0.85 * out).toFixed(3)})`; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(cx, cy - spx * 0.32, R * (0.25 + 0.75 * k), 0, Math.PI * 2); ctx.stroke();
            ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - spx * 0.32, R * k, 0, Math.PI * 2); ctx.clip();
            paint(ctx, see.w, cx - sw / 2, cy, spx, { ground: 'dark', alpha: out, voice: VOICES.divine });
            ctx.restore();
          }
        } else scan(ctx, w, t, sx, Y, qpx, { ground: 'dark', alpha: out });
        sx += adv(w);
      }
      note(ctx, 'MATT 23:33', 3590, 250, { px: 40, align: 'right', alpha: 0.7 * out });
    },
  };
};

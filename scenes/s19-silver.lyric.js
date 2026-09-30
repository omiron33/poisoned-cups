// The words of s19-silver (v2). "Silver in your palms" is set top left over the white room in a
// cast-metal gunmetal gradient with a slow sheen that sweeps across SILVER (seductive, expensive),
// the rest in the polished claim voice, and a payout counter ticking under it. On "Blood" that line
// is gone and BLOOD lands in blood red at the same place; its reflection hangs under it as if on the
// wet floor, and the reflection smears and ripples more and more as the spill runs; "on the floor"
// settles below in the same red.
import { paint, measure, flow, note, outFade, clamp01, ease, VOICES, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lines19 } from './s19-silver.js';

// a word in cast metal: a vertical gunmetal gradient (dark enough to hold 4.5:1 on the white room)
// with a lighter band sweeping across it
function metal(ctx, w, t, x, y, px, alpha) {
  if (t < w.start - 0.02) return;
  const a = alpha * clamp01((t - w.start + 0.02) / 0.1);
  const v = VOICES.toxic;
  const s = w.w.toUpperCase().replace(/[^A-Z’']/g, '');
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = `${0.04 * size}px`;
  const wd = ctx.measureText(s).width;
  const g = ctx.createLinearGradient(0, y - size * 0.9, 0, y);
  g.addColorStop(0, 'rgb(46, 49, 56)'); g.addColorStop(0.45, 'rgb(22, 23, 28)'); g.addColorStop(0.55, 'rgb(58, 61, 68)'); g.addColorStop(1, 'rgb(14, 15, 18)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillText(s, x, y);
  // the sheen: a narrow diagonal band of lighter metal crossing the word every 1.6 s
  const ph = ((t - w.start) / 1.6) % 1;
  const sx = x - size + (wd + size * 2) * ph;
  ctx.save(); ctx.beginPath(); ctx.moveTo(sx, y - size); ctx.lineTo(sx + size * 0.35, y - size); ctx.lineTo(sx + size * 0.1, y + 10); ctx.lineTo(sx - size * 0.25, y + 10); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgb(64, 67, 74)'; ctx.fillText(s, x, y);   // sheen kept dark enough to hold 4.5:1
  ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
}

const BLOOD = '118, 0, 16';
// a red word and, under it, its reflection on the wet floor: flipped, fading, and smearing (rows
// sheared sideways and stretched) more as `smear` rises
function bled(ctx, w, t, x, y, px, alpha, smear) {
  if (t < w.start - 0.02) return 0;
  const a = alpha * clamp01((t - w.start + 0.02) / 0.08);
  const adv = paint(ctx, w.w, x, y, px, { ground: 'light', ink: BLOOD, alpha: a });
  const k = ease.out3((t - w.start - 0.34) / 0.4);   // after the line above has cleared
  if (k > 0) {
    const h = px * 0.75, rows = 14;
    for (let i = 0; i < rows; i++) {
      const f = i / rows;
      const dx = Math.sin(t * 7 + i * 0.9) * px * 0.05 * smear * (1 + f * 2) + smear * f * px * 0.3;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - px, y + 14 + f * h, adv + px * 3, h / rows + 1); ctx.clip();
      ctx.translate(dx, y + 14); ctx.scale(1, -(1 + smear * 0.6)); ctx.translate(0, -y);
      paint(ctx, w.w, x, y, px, { ground: 'light', ink: BLOOD, alpha: a * k * 0.3 * (1 - f) });
      ctx.restore();
    }
  }
  return adv;
}

export default (P) => {
  const [L1, L2] = lines19(P);
  const tB = L2.words[0].start;
  return {
    textSize: [3840, 2160], shade: 0.45,   // a pale lift round the dark words
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { x: 260, y: 1960, ground: 'light' });
      const out = outFade(t, P.to - 0.15, P.to);
      const a1 = outFade(t, tB - 0.12, tB + 0.02);
      // "in your palms" stays until 0.17 s after BLOOD lands (it must still read 0.15 s after it ends)
      const a1b = outFade(t, tB + 0.17, tB + 0.3);
      if (a1b > 0.002) {
        metal(ctx, L1.words[0], t, 240, 560, 330, a1);
        flow(ctx, L1.words.slice(1), t, { x: 250, y: 860, px: 170, ground: 'light', alpha: a1b });
        const paid = Math.floor(1000 * Math.max(0, t - L1.words[0].start) ** 1.6 * 37);
        if (t > L1.words[0].start) note(ctx, 'PAYOUT  ' + paid.toLocaleString('en-US').padStart(9, ' ') + ' CR', 250, 1010, { px: 34, ground: 'light', alpha: 0.9 * a1 });
      }
      // BLOOD, and its reflection smearing as the spill runs
      const smear = ease.inOut3((t - tB - 0.3) / 2.2);
      bled(ctx, L2.words[0], t, 240, 600, 300, out, smear);
      let x = 250;
      for (const w of L2.words.slice(1)) x += bled(ctx, w, t, x, 1080, 150, out, smear * 0.6) + 12;
    },
  };
};

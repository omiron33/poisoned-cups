// The words of s11-widow (v4).
// "Blind guides smile" is set in the kiosk's own pleasant UX type (light tracked capitals) down the
// screen's dark right column beside the contour face. After it lands it corrupts slightly:
// misregistered magenta and green plates slide out behind each word while the word stays crisp.
// It holds through its end, then dims and fades out during the pull-back (its picture is gone).
// "While the widow pays": a thermal receipt prints down the right edge of the frame: WHILE THE,
// then WIDOW in mercy italic, then PAYS hard as a receipt burst, with the fees that ate the gift
// itemised under it. The widow, the tube and the vault stay clear on the left.
// Labels (mono, never more than two at once): the screen header in shot A; the receipt header and
// DYNAMIC PRICING by the kiosk in shot B (about 70.0 to 71.4).
import { linesFrom, paint, measure, strike, cascade, note, outFade, clamp01, ease, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
const [wWhile, wThe, wWidow, wPays] = L2.words;
const HEAD = 'AI GIVING GUIDE · RATED 4.9 / 5';
const LBL = [1500, 1900];   // canvas position of the shot-B label (beside the kiosk, over the dark street)

// a word in the kiosk's UX voice, crisp; after 0.3 s colour plates start to slide out behind it
function ux(ctx, w, t, x, y, px, alpha) {
  if (t < w.start - 0.02) return;
  const a = alpha * clamp01((t - w.start + 0.02) / 0.08);
  const c = ease.inOut3((t - w.start - 0.3) / 1.0);
  if (c > 0) {
    const d = px * (0.02 + 0.05 * c);
    paint(ctx, w.w, x - d, y, px, { voice: VOICES.claim, ink: '255, 60, 170', alpha: 0.4 * c * a });
    paint(ctx, w.w, x + d, y + d * 0.3, px, { voice: VOICES.claim, ink: '90, 255, 120', alpha: 0.35 * c * a });
  }
  paint(ctx, w.w, x, y, px, { voice: VOICES.claim, alpha: a });
}

const PAPER = '240, 238, 230', INKD = '22, 20, 26';
function receipt(ctx, t, out) {
  if (t < wWhile.start - 0.12) return;
  const X = 2880, Wd = 760;
  // the paper feeds down: enough to hold each word before it is printed, a burst on PAYS
  const need = t < wWidow.start - 0.1 ? 600 : t < wPays.start - 0.1 ? 860 : 860 + 880 * ease.out5((t - (wPays.start - 0.1)) / 0.14);
  const intro = ease.out3((t - (wWhile.start - 0.12)) / 0.14);
  const H = need * intro;
  ctx.save();
  ctx.globalAlpha = out;
  ctx.fillStyle = `rgb(${PAPER})`;
  ctx.beginPath(); ctx.moveTo(X, -20); ctx.lineTo(X + Wd, -20); ctx.lineTo(X + Wd, H);
  // a torn zigzag foot
  for (let i = 12; i >= 0; i--) ctx.lineTo(X + (Wd * i) / 12, H + (i % 2 ? 18 : 0));
  ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(X, -20, Wd, H); ctx.clip();
  note(ctx, 'AI GIVING GUIDE', X + 50, 110, { px: 34, ground: 'light', alpha: 1, color: INKD });
  note(ctx, 'RATED 4.9 / 5', X + 50, 160, { px: 34, ground: 'light', alpha: 1, color: INKD });
  ctx.fillStyle = `rgb(${INKD})`; ctx.fillRect(X + 50, 200, Wd - 100, 3);
  const o = { ground: 'light' };
  let x = X + 50;
  for (const w of [wWhile, wThe]) { cascade(ctx, w, t, x, 370, 130, o); x += measure(ctx, w.w, 130, o) + 40; }
  cascade(ctx, wWidow, t, X + 50, 600, 150, o);
  strike(ctx, wPays, t, X + 50, 1040, 290, { ...o, flash: false, shake: 0.7 });
  // itemised: the gift, and the fees that take all of it
  const rows = [['GIFT', '2 LEPTA'], ['AI GUIDANCE', '−1 LEPTON'], ['PLATFORM', '−1 LEPTON'], ['TO THE POOR', '0.00']];
  rows.forEach(([a, b], i) => {
    const k = clamp01((t - (wPays.start + 0.2 + i * 0.12)) / 0.05);
    if (k <= 0) return;
    const y = 1210 + i * 80;
    note(ctx, a, X + 50, y, { px: 34, ground: 'light', alpha: k, color: INKD });
    note(ctx, b, X + Wd - 50, y, { px: 34, ground: 'light', alpha: k, color: i === 3 ? '150, 0, 80' : INKD, align: 'right' });
  });
  if (t > wPays.start + 0.7) {
    ctx.fillStyle = `rgb(${INKD})`; ctx.fillRect(X + 50, 1530, Wd - 100, 3);
    note(ctx, 'THANK YOU FOR GIVING', X + 50, 1610, { px: 34, ground: 'light', alpha: 1, color: INKD });
  }
  ctx.restore();
  ctx.restore();
}

export default (P) => ({
  textSize: [3840, 2160], shade: 0.2,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    // the cut is hard: everything holds to the last two frames
    const out = outFade(t, P.to - 0.035, P.to);
    // shot A: the screen's right column; held to its end + 0.15, then dims and fades in the pull-back
    const e1 = L1.words[2].end + 0.15;
    const a1 = t < e1 ? 1 : 0.45 * outFade(t, e1, wWhile.start + 0.45) + 0.55 * outFade(t, e1, e1 + 0.06);
    if (a1 > 0.002) {
      const px = 185, x = 2480;
      L1.words.forEach((w, i) => ux(ctx, w, t, x, 780 + i * 300, px, a1));
      note(ctx, HEAD, x, 430, { px: 36, alpha: 0.8 * a1 * clamp01((t - P.from) / 0.2) });
    }
    receipt(ctx, t, out);
    // shot B: the pricing engine's verdict by the kiosk, from the settle until "the"
    const k2 = clamp01((t - (wWhile.start + 0.4)) / 0.12) * outFade(t, wThe.start - 0.05, wThe.start + 0.1);
    if (k2 > 0.002) note(ctx, 'DYNAMIC PRICING · VULNERABILITY DETECTED', LBL[0], LBL[1], { px: 34, alpha: 0.82 * k2 });
  },
});

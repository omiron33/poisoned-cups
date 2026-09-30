// The words of s11-widow (v2). "Blind guides smile" is set in the kiosk's own pleasant UX type
// (light tracked capitals) down the screen's dark right column beside the face, and slowly corrupts
// after it lands: misregistered magenta and green plates creep out from behind each word while the
// word itself stays crisp. On "While" a thermal receipt prints down the right edge of the frame
// from the kiosk: WHILE THE, then WIDOW in mercy italic, then PAYS lands hard as a receipt burst,
// with the fees that ate the gift itemised under it.
import { linesFrom, paint, measure, strike, cascade, note, outFade, clamp01, ease, VOICES, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
const [wWhile, wThe, wWidow, wPays] = L2.words;

// a word in the kiosk's UX voice, crisp; after 0.3 s colour plates start to slide out behind it
function ux(ctx, w, t, x, y, px, alpha) {
  if (t < w.start - 0.02) return;
  const a = alpha * clamp01((t - w.start + 0.02) / 0.08);
  const c = ease.inOut3((t - w.start - 0.3) / 1.2);
  if (c > 0) {
    const d = px * (0.02 + 0.05 * c);
    paint(ctx, w.w, x - d, y, px, { voice: VOICES.claim, ink: '255, 60, 170', alpha: 0.45 * c * a });
    paint(ctx, w.w, x + d, y + d * 0.3, px, { voice: VOICES.claim, ink: '90, 255, 120', alpha: 0.4 * c * a });
  }
  paint(ctx, w.w, x, y, px, { voice: VOICES.claim, alpha: a });
}

const PAPER = '240, 238, 230', INKD = '22, 20, 26';
function receipt(ctx, t, P, out) {
  if (t < wWhile.start - 0.12) return;
  const X = 2860, Wd = 760;
  // the paper feeds down: enough to hold each word before it is printed, a burst on PAYS
  const need = t < wWidow.start - 0.1 ? 560 : t < wPays.start - 0.1 ? 820 : 820 + 900 * ease.out5((t - (wPays.start - 0.1)) / 0.14);
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
  note(ctx, 'KIOSK 11 · GUIDE VERIFIED', X + 50, 120, { px: 34, ground: 'light', alpha: 1, color: INKD });
  ctx.fillStyle = `rgb(${INKD})`; ctx.fillRect(X + 50, 160, Wd - 100, 3);
  const o = { ground: 'light' };
  let x = X + 50;
  for (const w of [wWhile, wThe]) { cascade(ctx, w, t, x, 330, 130, o); x += measure(ctx, w.w, 130, o) + 12; }
  cascade(ctx, wWidow, t, X + 50, 560, 150, o);
  strike(ctx, wPays, t, X + 50, 1010, 290, { ...o, flash: false, shake: 0.7 });
  // itemised: the gift, and the fees that take all of it
  const rows = [['GIFT', '2 LEPTA'], ['PLATFORM FEE', '-1 LEPTON'], ['PROCESSING', '-1 LEPTON'], ['TO THE POOR', '0.00']];
  rows.forEach(([a, b], i) => {
    const k = clamp01((t - (wPays.start + 0.2 + i * 0.12)) / 0.05);
    if (k <= 0) return;
    const y = 1180 + i * 80;
    note(ctx, a, X + 50, y, { px: 34, ground: 'light', alpha: k, color: INKD });
    note(ctx, b, X + Wd - 50, y, { px: 34, ground: 'light', alpha: k, color: i === 3 ? '150, 0, 80' : INKD, align: 'right' });
  });
  if (t > wPays.start + 0.7) { ctx.fillStyle = `rgb(${INKD})`; ctx.fillRect(X + 50, 1500, Wd - 100, 3); note(ctx, 'THANK YOU FOR GIVING', X + 50, 1580, { px: 34, ground: 'light', alpha: 1, color: INKD }); }
  ctx.restore();
  ctx.restore();
}

export default (P) => ({
  textSize: [3840, 2160], shade: 0.2,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 260, y: 1960 });
    const out = outFade(t, P.to - 0.12, P.to);
    // shot A: the screen's right column (fades as the camera tilts away)
    const a1 = outFade(t, wWhile.start + 0.05, wWhile.start + 0.3);
    if (a1 > 0.002) {
      const px = 185, x = 2480;
      L1.words.forEach((w, i) => ux(ctx, w, t, x, 760 + i * 300, px, a1));
      note(ctx, 'GUIDE · VERIFIED · 4.9 / 5', x, 420, { px: 36, alpha: 0.85 * a1 * clamp01((t - P.from) / 0.2) });
      const total = Math.floor(2418660 + 830000 * ease.inOut3((t - P.from) / 1.8));
      note(ctx, 'RAISED  ' + total.toLocaleString('en-US') + '.00', x, 1790, { px: 36, alpha: 0.85 * a1 * clamp01((t - P.from) / 0.2), color: '150, 255, 110' });
    }
    receipt(ctx, t, P, out);
  },
});

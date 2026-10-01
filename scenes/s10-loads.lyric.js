// The words of s10-loads.
// "Heavy loads": dropped. Each word falls the last few hundred pixels under gravity and lands hard
// on a baseline at the bottom of the frame (on its onset, still from then on), with a load-cell
// readout ticking up beside it: the weight assigned to a user.
// "That you never lift too": elevated and detached. Light claim capitals assemble from scanlines
// at the top right, with the pods; a hairline hangs from LIFT toward the load below and stops
// short of it: CONTACT NONE.
import { linesFrom, arm, scan, paint, measure, note, outFade, ease, clamp01, carry } from '/song/lib/type.js';
import { VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [LH, LN] = linesFrom('Heavy loads', 'That you never lift too');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.95,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 240, y: 300 });
    const fade = outFade(t, P.to - 0.2, P.to);
    // HEAVY LOADS: dropped under gravity onto the bottom baseline
    const px = 360, y = 1930;
    let x = 240;
    for (const w of LH.words) {
      const adv = measure(ctx, w.w, px);
      const u = t - w.start + 0.02;                 // the fall ends 0.05 s after the onset
      if (u > 0) {
        const k = clamp01(u / 0.07);
        const dy = -(1 - k * k) * 420;             // accelerating fall, no bounce
        paint(ctx, w.w, x, y + dy, px, { alpha: fade * clamp01(k * 3) * (1 - 0.55 * clamp01((t - (LN.words[0].start - 0.1)) / 0.25)) });   // dims once line 2 begins
      }
      x += adv;
    }
    // (v3: the LOAD readout over HEAVY LOADS is gone; the one annotation is CONTACT NONE)
    // YOU NEVER LIFT TOO: high, light, detached
    const lpx = 150, ly = 640, xr = 3600;
    const claim = VOICES.claim;
    const total = LN.words.reduce((a, w) => a + measure(ctx, w.w, lpx, { voice: claim }), 0) - lpx * 0.26;
    let lx = xr - total, liftX = 0, liftW = 0;
    for (const w of LN.words) {
      const adv = measure(ctx, w.w, lpx, { voice: claim });
      scan(ctx, w, t, lx, ly, lpx, { voice: claim, alpha: fade });
      if (/lift/i.test(w.w)) { liftX = lx; liftW = adv - lpx * 0.26; }
      lx += adv;
    }
    const wl = LN.words.find((w) => /lift/i.test(w.w));
    if (t > wl.start) {
      const k = ease.out3((t - wl.start) / 0.5);
      const cx = liftX + liftW / 2, y0 = ly + 70, y1 = y0 + (1300 - y0) * k;
      ctx.fillStyle = `rgba(226, 232, 244, ${(0.7 * fade).toFixed(3)})`;
      ctx.fillRect(cx - 1.5, y0, 3, y1 - y0);
      if (k > 0.98) note(ctx, 'CONTACT  NONE  ·  0.00 KG', cx, 1380, { px: 36, align: 'center', color: '226, 232, 244', alpha: 0.85 * fade });
    }
  },
});

// The words of s03-tomb. Outside, "WHITE STONE WALLS" stands in a left column like a corporate
// spec sheet, each word under a black bar that rips away on its onset. When the camera plunges
// through the crack the column is gone; inside, "Over rotting bones" hits along the bottom:
// OVER strikes, ROTTING glitches, BONES is locked on by a HUD reticle.
import { linesFrom, measure, strike, glitch, lockOn, redact, note, outFade, keyOf, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('White stone walls', 'Over rotting bones');

export default (P) => {
  const tc = L2.words[0].start - 0.45;
  return {
    textSize: [3840, 2160],
    shade: 0.5,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const f1 = outFade(t, tc - 0.15, tc + 0.2);
      L1.words.forEach((w, i) => {
        redact(ctx, w, t, 250, 760 + i * 270, 200, { ground: 'dark', alpha: f1, barAlpha: 0.95 * f1, show: P.from + 0.1 });
      });
      note(ctx, 'LOT 03  ·  MONOLITH  ·  WHITEWASHED  ·  MATT 23:27', 250, 1560, { ground: 'dark', rule: 520, px: 34, alpha: 0.85 * f1 });
      const f2 = outFade(t, P.to - 0.25, P.to);
      const pick = (w) => { const k = keyOf(w.w); return k === 'over' ? strike : k === 'rotting' ? glitch : lockOn; };
      // laid out by hand with a wider gap, so the struck word's overshoot never touches the next
      const px = 230, gap = px * 0.3, o = { ground: 'dark', alpha: f2, tag: 'SECTOR 23:27', hud: '160, 255, 120' };
      const adv = L2.words.map((w) => measure(ctx, w.w, px) - px * 0.26);
      let x = 1920 - (adv.reduce((a, b) => a + b, 0) + gap * (adv.length - 1)) / 2;
      L2.words.forEach((w, i) => { pick(w)(ctx, w, t, x, 1800, px, o); x += adv[i] + gap; });
    },
  };
};

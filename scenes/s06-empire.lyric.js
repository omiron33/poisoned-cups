// The words of s06-empire.
// "You twist the truth": set along a baseline that twists into a wave on "twist" (slashed in),
// on the left while the fibre coils. "To build your little empire": each word lands like a slab
// on a stack in the right column, bottom up, a dark rack plate with an LED under it; EMPIRE tops
// the stack with a lock-on reticle.
import { linesFrom, arrive, paint, measure, slash, lockOn, note, outFade, keyOf, spring, ease, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.6,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 240, y: 420 });   // the bottom left holds the twisting line
    const b0 = L2.words[0].start;
    // line 1: a twisting baseline on the left, on two rows (YOU TWIST / THE truth) so TRUTH stays
    // clear of the bright coil, with an extra word space so the slashed word never touches its
    // neighbours
    const tw = L1.words.find((w) => /twist/i.test(w.w)).start;
    const f1 = outFade(t, b0 - 0.35, b0 - 0.05);
    if (f1 > 0.002) {
      const px = 190;
      const amp = 45 * ease.out3((t - tw) / 0.6);
      let x = 260, row = 0;
      L1.words.forEach((w, i) => {
        if (i === 2) { x = 260; row = 1; }
        const adv = measure(ctx, w.w, px);
        const y = 1470 + row * 300 + Math.sin(i * 1.7 + (t - tw) * 2.2) * amp;
        if (/twist/i.test(w.w)) slash(ctx, w, t, x, y, px, { alpha: f1 });
        else {
          const s = arrive(w, t);
          if (s.a > 0.002) paint(ctx, w.w, x, y + (1 - s.k) * px * 0.2, px, { alpha: s.a * f1 });
        }
        x += adv + px * 0.3;
      });
    }
    // line 2: a stack of rack plates in the right column
    const fade = outFade(t, P.to - 0.25, P.to);
    const px = 150, xr = 3620, rowH = px * 1.16;
    const words = L2.words;
    // the plates stack top down in fixed rows: each lands in place (a word holds still once it
    // arrives), TO at the top and EMPIRE at the bottom
    words.forEach((w, i) => {
      if (t < w.start) return;
      const y = 1820 - (words.length - 1 - i) * rowH;
      const isEmp = keyOf(w.w).startsWith('empire');
      const adv = measure(ctx, w.w, px) - px * 0.26;
      const x = xr - adv;
      const a = clamp01((t - w.start) / 0.06) * fade;
      // the plate
      ctx.fillStyle = `rgba(6, 9, 9, ${(0.62 * a).toFixed(3)})`;
      ctx.fillRect(x - 40, y - px * 0.98, adv + 80, px * 1.1);
      ctx.fillStyle = `rgba(80, 255, 140, ${(0.9 * a).toFixed(3)})`;
      for (let j = 0; j < 6; j++) if (((j * 7 + i * 3 + Math.floor(t * 6)) % 5) > 1) ctx.fillRect(x - 40 + 16 + j * 26, y + px * 0.04, 14, 6);
      // the reticle's tag sits to the left of the plate, not above it on the LITTLE plate's row
      if (isEmp) { lockOn(ctx, w, t, x, y, px, { alpha: fade }); note(ctx, 'ASSET 01', x - 120, y - px * 0.3, { px: 34, align: 'right', color: '0, 255, 170', alpha: 0.9 * a }); }
      else paint(ctx, w.w, x, y, px, { alpha: a });
    });
    const na = Math.min(clamp01((t - b0) / 0.3), fade);
    if (na > 0.01) note(ctx, 'LOT 06  ·  SKYLINE  ·  8 TOWERS  ·  MATT 23:6', 240, 1980, { rule: 620, alpha: 0.85 * na });
  },
});

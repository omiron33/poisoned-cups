// The words of s06-empire.
// "You twist the truth": set lower left on a coiled baseline (every letter rides a fixed helix
// wave and leans with it), each word arriving as misregistered colour plates that snap into
// register; TWIST in acid green, TRUTH in the mercy italic, bent like the rest.
// "To build your little empire": each word is a 1U rack plate (vents, LEDs, a unit number) slid
// into a rack in the right column, bottom up, so the line stacks like the towers; EMPIRE tops
// the rack as a taller plate in the polished claim voice.
import { linesFrom, paint, measure, voiceOf, shown, note, outFade, keyOf, ease, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');

// one word on the coil: letters on a fixed sine baseline (phase by x), leaning with the slope
function coilWord(ctx, w, t, x0, y0, px, { amp, freq, alpha }) {
  const v = voiceOf(w.w);
  let s = shown(w.w); if (v.caps) s = s.toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const track = (v.track ?? 0) * size;
  const u = t - w.start + 0.02;
  const k = ease.out3(u / 0.09);
  const d = (1 - k) * px * 0.2;
  let x = x0;
  for (const ch of s) {
    const cw = ctx.measureText(ch).width;
    const cx = x + cw / 2;
    const y = y0 + Math.sin(cx * freq) * amp;
    const ang = Math.atan(Math.cos(cx * freq) * amp * freq) * 0.8;
    if (u > 0) {
      ctx.save(); ctx.translate(cx, y); ctx.rotate(ang);
      if (d > 0.5) {
        ctx.fillStyle = `rgba(255, 60, 170, ${(0.7 * (1 - k) * alpha).toFixed(3)})`; ctx.fillText(ch, -cw / 2 - d, 0);
        ctx.fillStyle = `rgba(80, 255, 140, ${(0.7 * (1 - k) * alpha).toFixed(3)})`; ctx.fillText(ch, -cw / 2 + d, 0);
      }
      ctx.fillStyle = `rgba(${v.color[0]}, ${(clamp01(k * 1.4) * alpha).toFixed(3)})`;
      ctx.fillText(ch, -cw / 2, 0);
      ctx.restore();
    }
    x += cw + track;
  }
  return x - x0 + px * 0.45;   // a wide word space: the leaning letters must not close it
}

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.85,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 240, y: 420 });
    const b0 = L2.words[0].start;
    // line 1: the coil, lower left on two rows (clear of the fibre at the centre)
    const f1 = outFade(t, b0 - 0.35, b0 - 0.05);
    if (f1 > 0.002) {
      const px = 210;
      let x = 250, row = 0;
      L1.words.forEach((w, i) => {
        if (i === 2) { x = 250; row = 1; }
        x += coilWord(ctx, w, t, x, 1480 + row * 330, px, { amp: 34, freq: 0.0052, alpha: f1 });
      });
      if (t > L1.words[0].start) note(ctx, 'STRAND 01  ·  TORSION 360°', 250, 2030, { px: 40, alpha: 0.8 * f1 });
    }
    // line 2: a rack in the right column, filled top down, EMPIRE the big base unit
    const fade = outFade(t, P.to - 0.25, P.to);
    const words = L2.words;
    const pxOf = (w) => (keyOf(w.w).startsWith('empire') ? 190 : 132);
    const W = Math.max(...words.map((w) => measure(ctx, w.w, pxOf(w)))) + 330, xr = 3600, x0 = xr - W;
    let yt = 700;
    words.forEach((w, i) => {
      const isEmp = keyOf(w.w).startsWith('empire');
      const px = pxOf(w);
      const h = isEmp ? px * 1.5 : px * 1.32;
      const top = yt;
      yt = top + h + 26;
      if (t < w.start - 0.02) return;
      const u = t - w.start + 0.02;
      const k = ease.out3(u / 0.08);
      const a = clamp01(k * 1.5) * fade;
      const dx = (1 - k) * 160;                        // slides into the rack from the right
      const px0 = x0 + dx;
      // the plate: black anodised face, silver hairline, vent slots, status LEDs, unit number
      ctx.strokeStyle = `rgba(190, 196, 214, ${(0.7 * a).toFixed(3)})`; ctx.lineWidth = 3;
      ctx.strokeRect(px0, top, W, h);
      // (no vent slots: beside the word they read as stray letters)
      const on = (j) => ((j * 5 + i * 3 + Math.floor(t * 5)) % 4) > 0;
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = j === 2 && isEmp ? `rgba(255, 60, 170, ${(0.95 * a).toFixed(3)})` : `rgba(90, 255, 130, ${((on(j) ? 0.95 : 0.25) * a).toFixed(3)})`;
        ctx.fillRect(px0 + W - 60, top + h * (0.24 + j * 0.2), 22, h * 0.1);
      }
      note(ctx, `U${String(i + 1).padStart(2, '0')}`, px0 + W - 100, top + h * 0.62, { px: 32, align: 'right', color: '160, 168, 190', alpha: 0.85 * a });
      paint(ctx, w.w, px0 + 140, top + h * 0.5 + px * 0.36, px, { alpha: a });
    });
    const na = Math.min(clamp01((t - b0) / 0.3), fade);
    if (na > 0.01) note(ctx, 'RACK 06  ·  5U  ·  SKYLINE', xr, 600, { px: 40, align: 'right', rule: 0, alpha: 0.85 * na });
  },
});

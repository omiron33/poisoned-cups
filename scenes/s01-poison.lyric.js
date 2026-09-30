// The words of s01-poison (v2). "You polish cups" is engraved along the outer contour of the bowl:
// thin tracked silver capitals running round the U of its belly, each word gliding a few letters
// along the curve into place as it is sung, over a hairline that follows the metal. When the camera
// rises over the rim, that line lets go and "Leave the poison in" blooms out of the liquid's glow in
// the dark left column, two heavy rows; a HUD reticle target-locks "poison" in acid green.
import { arrive, arm, lockOn, note, outFade, VOICES, shown, clamp01, ease, paint, measure, carry, project } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { poisonCamera, lines01, riseTime, PH } from './s01-poison.js';

const [L1, L2] = lines01;

// BLOOM: the word swells out of a green glow (as if lifting off the liquid) and is fully set, still
// and clean, 0.1 s after its onset
function bloom(ctx, w, t, x, y, px, o = {}) {
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.1);
  if (k < 1) {
    const sc = 0.8 + 0.2 * k;
    ctx.save(); ctx.translate(x + adv / 2, y); ctx.scale(sc, sc);
    ctx.shadowColor = `rgba(150, 255, 110, ${(0.9 * (1 - k)).toFixed(3)})`; ctx.shadowBlur = px * 0.6;
    paint(ctx, w.w, -adv / 2, 0, px, { ...o, alpha: (o.alpha ?? 1) * clamp01(k * 1.6) });
    ctx.restore();
  } else paint(ctx, w.w, x, y, px, o);
  return adv;
}

// words round the underside of a circle (centre cx, cy; baseline radius r), centred on the bottom,
// reading left to right, letters upright toward the centre
function contour(ctx, words, t, { cx, cy, r, px, alpha = 1, voice }) {
  const v = voice;
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const tr = (v.track ?? 0) * size, gap = px * 0.85;
  const strs = words.map((w) => { let s = shown(w.w); if (v.caps) s = s.toUpperCase(); return s; });
  const widths = strs.map((s) => [...s].reduce((a, ch) => a + ctx.measureText(ch).width + tr, 0) - tr);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let ang = Math.PI / 2 + total / r / 2;
  const a0 = ang;
  words.forEach((w, i) => {
    const st = arrive(w, t, 0.08);
    const slide = (1 - st.k) * (px * 0.9) / r;   // glides in along the curve from the left
    let aa = ang + slide;
    for (const ch of strs[i]) {
      const cw = ctx.measureText(ch).width;
      aa -= cw / 2 / r;
      if (st.a > 0.002) {
        ctx.save();
        ctx.translate(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r);
        ctx.rotate(aa - Math.PI / 2);
        ctx.fillStyle = `rgba(${v.color[0]}, ${(st.a * alpha).toFixed(3)})`;
        ctx.fillText(ch, -cw / 2, 0);
        ctx.restore();
      }
      aa -= cw / 2 / r + tr / r;
    }
    ang -= (widths[i] + gap) / r;
  });
  return { a0, a1: ang };
}

export default (P) => {
  const cam = poisonCamera(P)(L1.words[0].start);
  const c = project(cam, [0, PH + 0.84, 0]);
  // the bowl's radius in pixels: a point on its widest ring, across the view
  const ww = [cam.target[0] - cam.pos[0], 0, cam.target[2] - cam.pos[2]];
  const l = Math.hypot(ww[0], ww[2]);
  const side = project(cam, [(-ww[2] / l) * 0.34, PH + 0.84, (ww[0] / l) * 0.34]);
  const rPx = Math.hypot(side.x - c.x, side.y - c.y);
  const tR = riseTime();
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const a1 = outFade(t, tR + 0.05, tR + 0.3);
      if (a1 > 0.002 && t >= L1.words[0].start - 0.05) {
        const px = 118;
        const r = Math.min(rPx * 1.12 + px * 0.95, 1960 - c.y);
        // a shallow arc (a wider circle through the same lowest point) so no word is tipped far
        // enough to break up, and the words keep clear gaps at their tops
        const R = r * 3.2, cy = c.y + r - R;
        const arc = contour(ctx, L1.words, t, { cx: c.x, cy, r: R, px, alpha: a1, voice: VOICES.claim });
        // the hairline under the letters, drawn along with the words
        const k = ease.out3(clamp01((t - L1.words[0].start) / 1.4));
        ctx.strokeStyle = `rgba(226, 232, 244, ${(0.6 * a1).toFixed(3)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(c.x, cy, R + px * 0.28, arc.a0 + 0.015, arc.a0 + 0.015 - (arc.a0 - arc.a1 + 0.03) * k, true); ctx.stroke();
        note(ctx, 'PROC 01  ·  LASER POLISH  ·  PASS 1 / 1', 3590, 1990, { px: 38, ground: 'dark', align: 'right', alpha: 0.8 * a1 });
      }
      const a2 = outFade(t, P.to - 0.1, P.to);   // held at full strength until the cut
      // row 1 blooms; row 2 is the locked target with "in" kept clear of the reticle
      const pxL = 240;
      arm(ctx, L2.words.slice(0, 2), t, bloom, { x: 250, y: 860, px: pxL, ground: 'dark', alpha: a2 });
      const pw = L2.words.find((w) => /poison/i.test(w.w));
      const adv = lockOn(ctx, pw, t, 250, 860 + pxL * 1.62, pxL, { ground: 'dark', alpha: a2, tag: 'CONTAMINANT 01', hud: '150, 255, 110', flash: false });
      for (const w of L2.words.slice(L2.words.indexOf(pw) + 1)) bloom(ctx, w, t, 250 + adv + pxL * 0.5, 860 + pxL * 1.62, pxL, { ground: 'dark', alpha: a2 });
    },
  };
};

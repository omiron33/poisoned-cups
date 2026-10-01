// The words of s05-vipers (hook rung 1). BROOD OF VIPERS stacks down the left as segmented,
// snake-like type: each word a row of letters, one letter per cable segment (a sheath band under
// each), riding a gentle coil. The segments drop in on the
// word's onset. The question runs along the right as a thin machine readout, and FIRE? flares
// orange-white below it, heat-torn on the onset, then holds with faint heat ghosts rising off it.
import { linesAt, paint, measure, note, outFade, clamp01, ease, carry, voiceOf, shown, scan, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const HOT = '255, 214, 170';

// a word as a row of letter segments along a cable, left to right from x at baseline y: each letter
// one segment riding a gentle coil (a small, fixed vertical offset), a sheath band under each, the
// segments dropping in on the word's onset. (Horizontal so the word reads as one word; the coil is
// kept small so the letters stay on a line.)
function column(ctx, w, t, x, y, px, pitch, phase, alpha) {
  const u = t - w.start + 0.02;
  if (u <= 0) return;
  const v = voiceOf(w.w);
  const s = shown(w.w).toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const gap = px * 0.07;
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    const k = ease.out3((u - i * 0.008) / 0.05);
    const cw = ctx.measureText(s[i]).width;
    if (k > 0) {
      const cy = y + Math.sin(i * 0.95 + phase) * px * 0.045;
      ctx.fillStyle = `rgba(${v.color[0]}, ${(alpha * k).toFixed(3)})`;
      ctx.fillText(s[i], cx, cy - (1 - k) * px * 0.4);
      // the sheath band under each segment
      ctx.fillStyle = `rgba(210, 200, 230, ${(0.55 * alpha * k).toFixed(3)})`;
      ctx.fillRect(cx, cy + px * 0.16, cw, Math.max(3, px * 0.02));
    }
    cx += cw + gap;
  }
}

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  return {
    textSize: [3840, 2160],
    shade: 0.5,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { x: 1500, y: 1960 });
      const out = outFade(t, P.to - 0.3, P.to);
      // placement pass: once the question starts, line 1 dims back so the current line dominates
      const d1 = out * (1 - 0.55 * clamp01((t - (body[0].start - 0.1)) / 0.25));
      column(ctx, brood, t, 260, 640, 280, 0, 0.0, d1);
      column(ctx, of, t, 300, 1000, 190, 0, 1.4, d1);
      column(ctx, vipers, t, 260, 1420, 300, 0, 2.6, d1);
      
      // the question: a thin readout along the right, each word scanned in
      const qpx = 120;
      let tw = 0; for (const w of body) tw += measure(ctx, w.w, qpx);
      let x = 3600 - (tw - qpx * 0.26);
      for (const w of body) x += scan(ctx, w, t, x, 1180, qpx, { ground: 'dark', alpha: out });
      if (t >= body[0].start) { ctx.fillStyle = `rgba(210, 200, 230, ${(0.6 * out).toFixed(3)})`; ctx.fillRect(3600 - tw + qpx * 0.26, 1230, (tw - qpx * 0.26) * ease.out3((t - body[0].start) / 0.4), 3); }
      // FIRE?: orange-white, torn by heat on its onset, then still with heat ghosts rising off it
      const fpx = 470;
      const fw = measure(ctx, fire.w, fpx, { voice: VOICES.violent }) - fpx * 0.26;
      const fx = 3600 - fw, fy = 1830;
      const u = t - fire.start + 0.02;
      if (u > 0) {
        const a = out * clamp01(u / 0.05);
        const tear = 1 - ease.out3(u / 0.09);
        const g = clamp01((u - 0.2) / 0.3) * out;
        for (let j = 1; j <= 3; j++) {
          const ph = ((t * 0.9 + j / 3) % 1);
          paint(ctx, fire.w, fx + Math.sin(t * 7 + j) * 8, fy - fpx * (0.05 + 0.25 * ph), fpx, { voice: VOICES.violent, ink: '255, 120, 40', alpha: 0.13 * g * (1 - ph) });
        }
        const bands = 9, top = fy - fpx * 1.05, h = fpx * 1.3;
        for (let i = 0; i < bands; i++) {
          const sx = tear > 0.001 ? Math.sin(i * 1.7 + t * 40) * fpx * 0.12 * tear : 0;
          ctx.save(); ctx.beginPath(); ctx.rect(fx - fpx, top + (h * i) / bands, fw + fpx * 2, h / bands + 1); ctx.clip();
          paint(ctx, fire.w, fx + sx, fy, fpx, { voice: VOICES.violent, ink: HOT, alpha: a });
          ctx.restore();
        }
      }
      note(ctx, 'NEST 03  ·  5 AGENTS  ·  DORMANT  ·  MATT 23:33', 3600, 250, { px: 40, align: 'right', alpha: 0.7 * out });
    },
  };
};

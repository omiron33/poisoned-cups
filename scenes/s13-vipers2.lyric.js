// The words of s13-vipers2 (hook rung 3). BROOD OF VIPERS crawls up both frame edges like the
// vipers up the pillars: set on end, each word typed upward along its baseline behind a block
// cursor (a head leading the body), BROOD and OF up the left edge, VIPERS in the column beside them. The
// question is a scanned readout across the middle, and FIRE? is a thermal warning panel: a mono
// header, a limit gauge whose bar overruns its box past the limit tick, and FIRE? inside it,
// voltage-flickering in on the hit.
import { linesAt, linesFrom, term, scan, volt, paint, measure, note, outFade, clamp01, ease, carry, VOICES, lyrics } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  const up = (ctx, fn, w, t, x, y, px, o) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); const a = fn(ctx, w, t, 0, 0, px, o); ctx.restore(); return a; };
  // s12's second line, laid out as s12 lays it out (px 200, 0.2 px gaps, extra room before GATE)
  const cw = lyrics.words.filter((w) => w.start < P.from + 0.02 && w.end > P.from - 0.3);
  const holdGate = (ctx, t) => {
    if (!cw.length || t > P.from + 0.8) return;
    const a = 1 - clamp01((t - (cw[cw.length - 1].end + 0.32)) / 0.12);   // readable past +0.3 s, gone before VIPERS
    if (a <= 0.002) return;
    const G = linesFrom('Then you guard the gate')[0].words;
    const px2 = 200, pre = px2 * 0.5;
    const adv2 = G.map((w) => measure(ctx, w.w, px2));
    const total = adv2.reduce((p, b) => p + b, 0) + px2 * 0.2 * 4 + pre - px2 * 0.26;
    let x2 = 1920 - total / 2;
    // s12's dark hard-lock band behind the line, held with it (without it GATE's light strokes broke up on the pillar)
    ctx.fillStyle = `rgba(6, 4, 10, ${(0.97 * a).toFixed(3)})`; ctx.fillRect(560, 1640, 3280, 360);
    G.forEach((w, i) => { paint(ctx, w.w, x2, 1880, px2, { alpha: a }); x2 += adv2[i] + px2 * 0.2 + (i === 3 ? pre : 0); });
  };
  return {
    textSize: [3840, 2160],
    shade: 0.9,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "gate" (s12) is sung across the cut: hold s12's last line exactly where s12 set it (bottom
      // centre) so GATE does not jump at the cut, then fade it (carry()'s timing)
      holdGate(ctx, t);
      const out = outFade(t, P.to - 0.3, P.to);
      // placement pass: the hook dims back once the question starts, so the current line dominates
      const o = { ground: 'dark', alpha: out * (1 - 0.55 * clamp01((t - (body[0].start - 0.1)) / 0.25)), echo: false };
      // up the left edge as one block read in order: BROOD then OF in the first column, VIPERS in
      // the column beside it (the next rotated line), not split across the frame
      const bw = up(ctx, term, brood, t, 520, 1960, 370, o);   // clear of the held s12 line at the cut
      up(ctx, term, of, t, 520, 1960 - bw - 200, 370, o);
      up(ctx, term, vipers, t, 520 + 370 * 1.32, 1960, 370, o);
      // the question: a scanned readout across the middle
      const qpx = 112;
      let tw = 0; for (const w of body) tw += measure(ctx, w.w, qpx);
      let x = 1920 - (tw - qpx * 0.26) / 2;
      for (const w of body) x += scan(ctx, w, t, x, 1400, qpx, { ground: 'dark', alpha: out });
      // the thermal warning panel
      const u = t - fire.start + 0.02;
      if (u > -0.3) {
        const k = ease.out3((u + 0.3) / 0.25);
        const x0 = 1300, x1 = 2540, y0 = 1540, y1 = 1975;
        ctx.fillStyle = `rgba(14, 6, 10, ${(k * out).toFixed(3)})`;   // opaque: the halo no longer lifts it to grey
        ctx.fillRect(x0, y0, (x1 - x0) * k, y1 - y0);
        ctx.strokeStyle = `rgba(255, 180, 120, ${(0.8 * k * out).toFixed(3)})`; ctx.lineWidth = 4;
        ctx.strokeRect(x0, y0, (x1 - x0) * k, y1 - y0);
        note(ctx, 'THERMAL  ·  LIMIT 85°C  ·  EXCEEDED', x0 + 30, y0 + 64, { px: 40, alpha: 0.9 * k * out, color: '255, 200, 150' });
        // the gauge: fills to the limit tick, then overruns the box
        const gy = y0 + 92, lim = x0 + 30 + (x1 - x0 - 60) * 0.8;
        const fill = clamp01((u + 0.3) / 0.3) * 0.8 + 0.45 * ease.out3(u / 0.35);
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.18 * k * out).toFixed(3)})`; ctx.fillRect(x0 + 30, gy, x1 - x0 - 60, 16);
        ctx.fillStyle = `rgba(255, 110, 60, ${(0.95 * k * out).toFixed(3)})`; ctx.fillRect(x0 + 30, gy, (x1 - x0 - 60) * fill, 16);
        ctx.fillStyle = `rgba(255, 240, 220, ${(0.95 * k * out).toFixed(3)})`; ctx.fillRect(lim, gy - 14, 5, 44);
        if (u >= 0) {
          const fpx = 250, fw = measure(ctx, fire.w, fpx) - fpx * 0.26;
          volt(ctx, fire, t, (x0 + x1) / 2 - fw / 2, y1 - 40, fpx, { ground: 'dark', alpha: out, ink: '255, 206, 170' });
        }
      }
      note(ctx, 'GATE 02  ·  THERMAL RUNAWAY  ·  MATT 23:33', 1920, 250, { px: 40, align: 'center', alpha: 0.8 * out });
    },
  };
};

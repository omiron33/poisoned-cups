// The words of s04-prayers (v2). "Soft-spoke prayers" is set small and low under the waveform in
// light tracked capitals, each letter lifted on a gentle, still sine (a low-amplitude voice), and it
// fades in soft. On "Cut" everything changes: a flat signal line across the foot of the frame
// spikes at CUT, which strikes in huge in hot magenta at the left; LIKE follows small; SHARPENED is
// slashed in and its letters shear apart into offset fragments; STONES lands inside a jagged
// outline of cut facets, the knife-stone of the picture drawn as a hairline.
import { linesFrom, strike, slash, fracture, paint, measure, note, outFade, clamp01, ease, VOICES, carry, shown } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { prayerTimes } from '/song/scenes/s04-prayers.js';

const [L1, L2] = linesFrom('Soft-spoke prayers', 'Cut like sharpened stones');
const hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// a word set letter by letter on a still sine baseline, fading in over 0.08 s
function softWave(ctx, w, t, x, y, px, i0, alpha) {
  const v = VOICES.claim;
  const s = shown(w.w).toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const a = clamp01((t - w.start + 0.02) / 0.08) * alpha;
  let cx = x;
  for (let k = 0; k < s.length; k++) {
    const cw = ctx.measureText(s[k]).width + v.track * size;
    if (a > 0.002) {
      ctx.fillStyle = `rgba(${v.color[0]}, ${a.toFixed(3)})`;
      ctx.fillText(s[k], cx, y - 14 * Math.sin((i0 + k) * 0.55));
    }
    cx += cw;
  }
  return cx - x;
}

export default (P) => {
  const { tCut } = prayerTimes();
  return {
    textSize: [3840, 2160],
    shade: 0.5,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);   // "Over rotting bones", sung across the cut
      // ---- line 1: low and soft, centred under the waveform
      const f1 = outFade(t, tCut - 0.12, tCut + 0.02);
      if (f1 > 0.002) {
        const px = 120;
        const widths = L1.words.map((w) => { ctx.font = VOICES.claim.font(Math.round(px * VOICES.claim.scale)); ctx.letterSpacing = `${VOICES.claim.track * px * VOICES.claim.scale}px`; const m = ctx.measureText(shown(w.w).toUpperCase()).width; ctx.letterSpacing = '0px'; return m; });
        const gap = px * 0.7;
        let x = 1920 - (widths[0] + widths[1] + gap) / 2, n = 0;
        L1.words.forEach((w, i) => { softWave(ctx, w, t, x, 1640, px, n, f1); n += shown(w.w).length + 2; x += widths[i] + gap; });
        note(ctx, 'ASSISTANT  ·  VOICE  ·  −42 dB  ·  CALM', 1920, 1800, { px: 32, align: 'center', color: '200, 190, 235', alpha: 0.8 * f1 * clamp01((t - L1.words[0].start) / 0.2) });
      }
      // ---- line 2
      const f2 = outFade(t, P.to - 0.25, P.to);
      if (t >= tCut - 0.02) {
        const [cut, like, sharp, stones] = L2.words;
        const o = { ground: 'dark', alpha: f2 };
        // the signal line with its spike at CUT
        const cutAdv = measure(ctx, cut.w, 520);
        const sx = 260 + (cutAdv - 520 * 0.26) / 2;
        const u = t - tCut;
        const amp = 420 * Math.exp(-u * 5) + 40;
        ctx.strokeStyle = `rgba(255, 92, 170, ${(0.9 * f2).toFixed(3)})`; ctx.lineWidth = 5; ctx.lineJoin = 'miter';
        ctx.beginPath(); ctx.moveTo(260, 1960);
        ctx.lineTo(sx - 60, 1960); ctx.lineTo(sx - 20, 1960 - amp); ctx.lineTo(sx + 10, 1960 + amp * 0.2); ctx.lineTo(sx + 50, 1960);
        for (let k = 0; k < 14; k++) { const xx = sx + 150 + k * 210; ctx.lineTo(xx, 1960 - (hs(k) - 0.5) * 60 * clamp01((t - sharp.start) / 0.2)); }
        ctx.lineTo(3580, 1960); ctx.stroke();
        note(ctx, 'PEAK  +24 dB', sx + 80, 1960 - Math.min(amp, 300) + 40, { px: 32, color: '255, 92, 170', alpha: f2 * clamp01(1 - (u - 0.8) / 0.3) });
        strike(ctx, cut, t, 260, 1000, 520, { ...o, shake: 1.2 });
        paint(ctx, like.w, 260, 1300, 170, { ...o, alpha: f2 * clamp01((t - like.start + 0.02) / 0.06) });
        // SHARPENED: slashed in, then after it has held its letters shear into offset fragments
        const sxw = 260 + measure(ctx, like.w, 170) + 30;
        const shear = ease.out3((t - sharp.start - 0.35) / 0.25);
        if (t >= sharp.start - 0.02) {
          if (shear <= 0) slash(ctx, sharp, t, sxw, 1300, 230, { ...o, angle: 0.45 });
          else {
            const adv = measure(ctx, sharp.w, 230), top = 1300 - 230 * 1.05, h = 230 * 1.3;
            for (let b = 0; b < 4; b++) {
              ctx.save(); ctx.beginPath();
              // diagonal slices
              const x0 = sxw + (adv * b) / 4, x1 = sxw + (adv * (b + 1)) / 4;
              ctx.moveTo(x0 - 40 - (b ? 0 : 200), top); ctx.lineTo(x1 - 40 + (b === 3 ? 200 : 0), top); ctx.lineTo(x1 + 40 + (b === 3 ? 200 : 0), top + h); ctx.lineTo(x0 + 40 - (b ? 0 : 200), top + h); ctx.closePath(); ctx.clip();
              const dy = (b % 2 ? 1 : -1) * 9 * shear, dx = (b - 1.5) * 6 * shear;
              paint(ctx, sharp.w, sxw + dx, 1300 + dy, 230, o);
              ctx.restore();
            }
          }
        }
        // STONES inside a jagged outline of facets
        if (t >= stones.start - 0.02) {
          const px = 260, x = 300, y = 1760;
          const adv = measure(ctx, stones.w, px, { voice: VOICES.violent }) - px * 0.26;
          const k = ease.out3((t - stones.start + 0.02) / 0.1);
          const cx = x + adv / 2, cy = y - px * 0.45;
          const pts = [];
          const N = 11;
          for (let j = 0; j < N; j++) {
            const a = (j / N) * Math.PI * 2 + 0.2;
            const r = 1 + 0.18 * (hs(j + 3) - 0.3);
            pts.push([cx + Math.cos(a) * (adv / 2 + 70) * r * (0.7 + 0.3 * k), cy + Math.sin(a) * (px * 0.62 + 50) * r * (0.7 + 0.3 * k)]);
          }
          ctx.strokeStyle = `rgba(232, 236, 248, ${(0.85 * f2 * k).toFixed(3)})`; ctx.lineWidth = 4; ctx.lineJoin = 'miter';
          ctx.beginPath(); pts.forEach(([a, b], j) => (j ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); ctx.stroke();
          // inner facet lines from alternate vertices toward the centre, stopping short of the word
          ctx.lineWidth = 2; ctx.beginPath();
          pts.forEach(([a, b], j) => { if (j % 2) return; ctx.moveTo(a, b); ctx.lineTo(a + (cx - a) * 0.12, b + (cy - b) * 0.12); });
          ctx.stroke();
          strike(ctx, stones, t, x, y, px, { ...o, voice: VOICES.violent, ink: '236, 240, 250', from: 0.4 });
        }
        note(ctx, 'LOT 04  ·  OBSIDIAN  ·  32 EDGES  ·  MATT 23:14', 3590, 260, { ground: 'dark', align: 'right', px: 32, alpha: 0.85 * f2 });
      }
    },
  };
};

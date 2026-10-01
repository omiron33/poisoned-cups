// The words of s24-bend (hook rung 5). The last hook is a classification, cold and severe: a mono
// classification line with a five-block severity meter (filling on each word), then BUT small and
// BROOD OF VIPERS in hard cold-white capitals, fractured into place, right-aligned at the top.
// IF YOU WON'T BEND is a stress test: the line lands already stretched wide (word gaps opened, but
// kept close enough that IF reads as part of it), above a full-width strain gauge whose load readout climbs past its
// limit and whose yield stays NONE. BEND is the one soft word, in lavender italic, and it does
// not give.
import { linesAt, fracture, scan, measure, paint, note, outFade, clamp01, ease, voiceOf, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'But brood of vipers', 'If you won');
  const [but, ...hook] = L1.words;
  const L = 240, R = 3600;
  return {
    textSize: [3840, 2160],
    shade: 0.45,   // a firmer backing: the pillars moving behind WON'T read as the word moving
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const out = outFade(t, P.to - 0.3, P.to);
      // classification + severity meter, right-aligned
      if (t >= but.start - 0.3) {
        const k = ease.out3((t - (but.start - 0.3)) / 0.25);
        note(ctx, 'THREAT LEVEL  ·  BROOD', R - 5 * 70 - 30, 300, { px: 40, align: 'right', alpha: 0.9 * k * out });
        L1.words.forEach((w, i) => {
          const on = t >= w.start;
          const x = R - (4 - i) * 70 - 60 + (i === 3 ? 0 : 0);
          ctx.fillStyle = on ? `rgba(255, 92, 170, ${out})` : `rgba(230, 226, 240, ${(0.3 * k * out).toFixed(3)})`;
          ctx.fillRect(x, 262, 54, 44);
        });
        ctx.fillStyle = t >= L1.words[3].start + 0.15 ? `rgba(255, 92, 170, ${out})` : `rgba(230, 226, 240, ${(0.3 * k * out).toFixed(3)})`;
        ctx.fillRect(R - 54, 262, 54, 44);
      }
      // BUT, then the hook
      const bpx = 130, hpx = 290;
      const dimH = out * (1 - 0.55 * clamp01((t - L2.words[0].start + 0.05) / 0.2));   // previous line steps back
      let hw = 0; for (const w of hook) hw += measure(ctx, w.w, hpx);
      hw -= hpx * 0.26;
      const bw = measure(ctx, but.w, bpx) - bpx * 0.26;
      scan(ctx, but, t, R - bw, 520, bpx, { ground: 'dark', alpha: dimH });
      let x = R - hw;
      for (const w of hook) x += fracture(ctx, w, t, x, 900, hpx, { ground: 'dark', alpha: dimH, ink: '240, 244, 252' });
      // the stress line: tracked so the whole line spans the frame, positions fixed from the start
      const px = 250, words = L2.words;
      const size = (w) => Math.round(px * voiceOf(w.w).scale);
      const chars = (w) => w.w.replace(/[^A-Za-z’']/g, '').length;
      const base = words.map((w) => measure(ctx, w.w, px, { voice: { ...voiceOf(w.w), track: 0 } }) - px * 0.26);
      // letters tracked wide but not so wide they part into single letters ("IF" read as I F);
      // whatever is left of the span goes into the word gaps
      let gap = px * 0.6;
      const need = (R - L) - base.reduce((a, b) => a + b, 0) - gap * (words.length - 1);
      const perChar = 0;   // no letter tracking: tracked italic BEND parted into letters (failed OCR)
      gap = Math.min(px * 0.8, gap + (need - perChar * words.reduce((a, w) => a + chars(w) * size(w), 0)) / Math.max(1, words.length - 1));   // wide, but IF still reads as part of the line
      let sx = L;
      words.forEach((w, i) => {
        const v = { ...voiceOf(w.w), track: chars(w) <= 2 ? 0 : perChar };   // IF untracked: it must read as one word
        const wd = measure(ctx, w.w, px, { voice: v }) - px * 0.26;
        scan(ctx, w, t, sx, 1460, px, { ground: 'dark', alpha: out, voice: v });
        sx += wd + gap + perChar * size(w) * 0;
      });
      // the strain gauge
      const u0 = words[0].start;
      if (t >= u0 - 0.1) {
        const k = ease.out3((t - u0 + 0.1) / 0.3);
        ctx.fillStyle = `rgba(230, 226, 240, ${(0.7 * k * out).toFixed(3)})`;
        ctx.fillRect(L, 1540, (R - L) * k, 3);
        for (let i = 0; i <= 20; i++) ctx.fillRect(L + (R - L) * i / 20, 1528, 3, i % 5 ? 12 : 24);
        // (v3: no LOAD / TENSILE readouts under the gauge: they sat against the stress line)
      }
    },
  };
};

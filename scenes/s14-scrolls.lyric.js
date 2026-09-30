// The words of s14-scrolls live on the document display itself (onSurface on its glass): "You kiss
// the scrolls" is its reverent title, set in the claim voice's light tracked capitals, each word
// rising into place like an inscription being lit. "But your tongues call God a liar" is the
// contradiction the display is made to carry: a magenta CONTRADICTION tag, the words hit (glitch,
// strike) on the row the forked waveform runs through; GOD stays gold-white and untouched, and the
// fork strikes a red line through it; LIAR glitches in magenta.
import { linesFrom, paint, measure, arrive, strike, glitch, scan, keyOf, clamp01, ease, outFade, note, carry, VOICES } from '/song/lib/type.js';
import { fullFrame, onSurface } from '/song/lib/x-f.js';
import { rig, DOC, ROWS } from '/song/scenes/s14-scrolls.js';

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
const MPP = 0.00045;                   // metres per canvas px on the display
const X0 = -0.3 / MPP, MAXW = 0.62 / MPP;
const yOf = (wy) => -(wy - DOC.c[1]) / MPP;
const rise = (ctx, w, t, x, y, px, o) => { const k = Math.min(1, Math.max(0, (t - w.start + 0.02) / 0.08)); if (k <= 0) return measure(ctx, w.w, px, o); return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: k * (o.alpha ?? 1) }); };

// lay a row out left-aligned at X0, sized to fit MAXW (never larger than pxMax); returns positions
function row(ctx, words, pxMax, o) {
  const gap = (px) => px * 0.26;
  const w0 = words.reduce((a, w) => a + measure(ctx, w.w, 100, o) + 15, 0) - gap(100) - 15;
  const px = Math.min(pxMax, (MAXW / w0) * 100);
  let x = X0; const pos = [];
  for (const w of words) { pos.push(x); x += measure(ctx, w.w, px, o) + px * 0.4; }
  return { px, pos };
}

export default (P) => {
  const R = rig(P);
  return {
    textSize: [3840, 2160],
    shade: 0,   // the display glass is already near-black; no halo, so the veil over the scripture rows stays flat
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const cam = R.camera(t);
      const a = outFade(t, P.to - 0.1, P.to);
      onSurface(ctx, cam, DOC.c, [1, 0, 0], [0, 1, 0], MPP, () => {
        // the display's scripture rows are veiled to faint short bars, so they never read as text
        ctx.fillStyle = 'rgb(23, 20, 20)';
        ctx.fillRect(-0.345 / MPP, 0.058 / MPP, 0.69 / MPP, 0.42 / MPP);
        ctx.fillStyle = 'rgba(150, 155, 180, 0.1)';
        for (let r = 0; r < 11; r++) for (const s of [-1, 1]) {
          const ww = (0.07 + 0.12 * ((r * 7 + (s > 0 ? 3 : 0)) % 5) / 4) / MPP;
          ctx.fillRect((s < 0 ? -0.32 : 0.07) / MPP, (0.1 + r * 0.034) / MPP, ww, 5);
        }
        // the title: "You kiss" / "the scrolls"
        const claim = { voice: VOICES.claim, ground: 'dark', alpha: a };
        const r1 = [L1.words.slice(0, 2), L1.words.slice(2)];
        r1.forEach((ws, i) => {
          const { px, pos } = row(ctx, ws, 150, claim);
          const y = yOf(ROWS.title[i]) + px * 0.36;
          ws.forEach((w, j) => rise(ctx, w, t, pos[j], y, px, claim));
        });
        // the contradiction tag
        if (t >= L2.words[0].start - 0.05) {
          ctx.font = '800 30px "JetBrains Mono"'; ctx.letterSpacing = '6px';
          ctx.fillStyle = `rgba(255, 92, 170, ${(clamp01((t - L2.words[0].start + 0.05) / 0.08) * a).toFixed(3)})`;
          ctx.fillText('CONTRADICTION ALERT', X0, yOf(1.72));
          ctx.letterSpacing = '0px';
        }
        // "But your tongues" / "call God a liar"
        const o = { ground: 'dark', alpha: a, flash: false, shake: 0.4 };
        const rows = [L2.words.slice(0, 3), L2.words.slice(3)];
        rows.forEach((ws, i) => {
          const { px, pos } = row(ctx, ws, 190, o);
          const y = yOf([1.638, 1.515][i]) + px * 0.42;   // lifted clear of the fork's waveform row
          ws.forEach((w, j) => {
            const k = keyOf(w.w);
            const fn = k === 'tongues' || k === 'liar' ? glitch : k === 'call' ? strike : k === 'god' ? rise : scan;
            fn(ctx, w, t, pos[j], y, px, o);
            // the forked lie cuts a red line through GOD (the word itself is never touched)
            if (k === 'god' && t >= w.start + 0.02) {
              const wd = measure(ctx, w.w, px, o) - px * 0.26;
              const g = ease.out3((t - w.start - 0.02) / 0.07);
              ctx.fillStyle = `rgba(255, 40, 80, ${(0.95 * a).toFixed(3)})`;
              ctx.save(); ctx.translate(pos[j] - px * 0.12, y + px * 0.16); ctx.rotate(-0.04);   // under GOD, never through it
              ctx.fillRect(0, -px * 0.035, (wd + px * 0.24) * g, px * 0.07);
              ctx.restore();
            }
          });
        });
      });
    },
  };
};

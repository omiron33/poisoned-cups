// The words of s02-fringes (v2). "LONG FRINGES SWING" hangs as three credential strips dropped from
// the top of frame on lanyard lines, each word printed vertically on a white ID card (scanline
// assembly), the cards swaying a little once printed. "But your hearts stay thin" runs along the
// bottom under a signal trace whose amplitude narrows left to right and collapses to a hairline on
// THIN; each word is set smaller than the last and THIN itself flattens like the trace.
import { linesFrom, scan, term, measure, paint, note, outFade, clamp01, ease, spring, keyOf, VOICES, carry, arrive } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('Long fringes swing', 'But your hearts stay thin');
const hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export default (P) => {
  const thin = L2.words[L2.words.length - 1];
  return {
    textSize: [3840, 2160],
    shade: 0.64,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      // ---- line 1: credential strips on the right, hanging from the top edge
      L1.words.forEach((w, i) => {
        const px = 150;
        const x = 2380 + i * 470, top = 150 + i * 60;
        const len = measure(ctx, w.w, px, { ground: 'light' }) - px * 0.26;
        const cardH = len + px * 1.75, cardW = px * 1.3;
        const drop = spring(t, w.start - 0.28, 0.35, 0.25);
        if (t < w.start - 0.28) return;
        // sway only after the word has printed and held (settle gate), small and slow
        const sw = 0.018 * Math.sin((t - w.start) * 2.4 + i * 1.3) * clamp01((t - w.start - 0.35) / 0.8);
        const y0 = top - (1 - drop) * (cardH + top + 60);
        ctx.save();
        ctx.translate(x, 0); ctx.rotate(sw);
        ctx.globalAlpha = out;
        // the lanyard line
        ctx.strokeStyle = 'rgba(190, 160, 240, 0.85)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, y0 + 10); ctx.stroke();
        // the card
        ctx.fillStyle = 'rgba(236, 240, 246, 0.97)';
        ctx.beginPath(); ctx.roundRect(-cardW / 2, y0, cardW, cardH, 18); ctx.fill();
        ctx.fillStyle = 'rgba(40, 190, 70, 1)'; ctx.fillRect(-cardW / 2, y0 + 44, cardW, 16);
        ctx.fillStyle = 'rgba(20, 22, 28, 1)'; ctx.beginPath(); ctx.roundRect(-34, y0 + 14, 68, 16, 8); ctx.fill();
        ctx.font = '800 26px "JetBrains Mono"'; ctx.fillStyle = 'rgba(30, 34, 44, 1)'; ctx.letterSpacing = '4px';
        ctx.fillText(`ID-0${i + 2}`, -cardW / 2 + 18, y0 + cardH - 22);
        ctx.letterSpacing = '0px';
        // the word, printed down the card (reads top to bottom)
        ctx.save();
        ctx.translate(-px * 0.4, y0 + px * 0.98); ctx.rotate(Math.PI / 2);   // clear of the slot and the green band
        scan(ctx, w, t, 0, 0, px, { ground: 'light' });
        ctx.restore();
        ctx.restore();
        ctx.globalAlpha = 1;
      });
      // ---- line 2: shrinking words under a narrowing trace, bottom left
      const t2 = L2.words[0].start;
      if (t >= t2 - 0.3) {
        const sizes = [180, 165, 190, 140, 150];
        let x = 240;
        const pos = L2.words.map((w, i) => { const a = x; x += measure(ctx, w.w, sizes[i]) + sizes[i] * 0.12; return a; });
        const xEnd = x;
        // the trace: sampled left to right; amplitude narrows along the line and collapses on THIN
        const coll = ease.inOut3((t - thin.start - 0.1) / 0.5);
        const reveal = clamp01((t - (t2 - 0.3)) / 0.3);
        const yT = 1610;
        ctx.strokeStyle = `rgba(150, 255, 110, ${(0.95 * out).toFixed(3)})`;
        ctx.lineWidth = 6 - 3 * coll; ctx.lineJoin = 'round';
        ctx.beginPath();
        const X1 = 240 + (xEnd - 240) * reveal;
        for (let px = 240; px <= X1; px += 6) {
          const f = (px - 240) / Math.max(1, xEnd - 240);
          const env = 95 * Math.pow(1 - f, 1.6) * (1 - coll) + 2;
          const y = yT + env * Math.sin(px * 0.045 - t * 16) * (0.6 + 0.4 * Math.sin(px * 0.011 + t * 3));
          px === 240 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
        }
        ctx.stroke();
        note(ctx, 'SIGNAL  ·  CARDIAC  ·  ' + (t >= thin.start ? '−38 dB' : '−6 dB'), 240, yT - 140, { px: 34, color: '150, 255, 110', alpha: 0.9 * out * reveal });
        L2.words.forEach((w, i) => {
          if (t < w.start - 0.02) return;
          const px = sizes[i];
          if (keyOf(w.w) === 'thin') {
            // THIN lands full height, holds, then flattens to half height like the trace
            const f = 1 - 0.5 * ease.inOut3((t - w.start - 0.2) / 0.45);
            ctx.save(); ctx.translate(pos[i], 1880); ctx.scale(1, f);
            term(ctx, w, t, 0, 0, px, { ground: 'dark', alpha: out, echo: false });
            ctx.restore();
          } else term(ctx, w, t, pos[i], 1880, px, { ground: 'dark', alpha: out, echo: false });
        });
      }
      note(ctx, 'CORRIDOR B2  ·  FIBRE FRINGE  ·  150 CORES  ·  MATT 23:5', 3600, 2000, { ground: 'dark', align: 'right', px: 32, alpha: 0.8 * out });
    },
  };
};

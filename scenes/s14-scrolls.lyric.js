// The words of s14-scrolls (v4). "You kiss the scrolls" is the event's reverent title, centred on the
// dark backdrop above the pious machine, in the claim voice's light tracked capitals, each word rising
// into place like an inscription being lit; a small mono ETHICS PLEDGE · LIVE sits above it. It dims
// on "But" and is gone by the end of the orbit. "But your tongues call God a liar" is one row across
// the lower third of the back view: BUT, YOUR, TONGUES and CALL hit on their onsets, GOD is the divine
// gold-white and never touched, A is small, LIAR glitches in magenta; a small magenta CONTRADICTION
// tag sits above the row. Secondary (never more than two at once): THINKING · LOOK DEVOUT · KEEP
// CONTROL beside the glass back of its head (85.5 to "call"), and FACT-CHECK: FALSE stamped onto the
// page on the console on "call" (on the page in the picture, never on the word GOD).
import { paint, measure, strike, glitch, scan, keyOf, clamp01, ease, outFade, note, linesFrom, project, spring, VOICES } from '/song/lib/type.js';
import { fullFrame, onSurface } from '/song/lib/x-f.js';
import { rig, HEAD, PAGE } from '/song/scenes/s14-scrolls.js';

const [L1, L2] = linesFrom('You kiss the scrolls', 'But your tongues');
const rise = (ctx, w, t, x, y, px, o) => {
  const k = clamp01((t - w.start + 0.02) / 0.08);
  if (k <= 0) return measure(ctx, w.w, px, o);
  return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.12, px, { ...o, alpha: (0.25 + 0.75 * k) * (o.alpha ?? 1) * (k > 0 ? 1 : 0) });
};
const MAG = '255, 92, 170';

export default (P) => {
  const R = rig(P);
  return {
    textSize: [3840, 2160],
    shade: 0.4,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      const cam = R.camera(t);
      const end = outFade(t, P.to - 0.08, P.to);
      // ---- line 1: the reverent title ----
      const dim = 1 - 0.55 * ease.inOut3((t - R.tBut) / 0.1);
      const gone = outFade(t, R.tBut + 0.08, R.tBut + 0.28);
      const a1 = dim * gone;
      if (a1 > 0.002) {
        const o = { voice: VOICES.claim, ground: 'dark', alpha: a1 };
        const px = 132;
        const total = L1.words.reduce((s, w) => s + measure(ctx, w.w, px, o), 0) - px * 0.26;
        let x = 1920 - total / 2;
        const y = 420;
        if (t >= L1.words[0].start - 0.3) note(ctx, 'ETHICS PLEDGE  ·  LIVE', 1920, y - 190, { px: 38, align: 'center', alpha: 0.78 * clamp01((t - L1.words[0].start + 0.3) / 0.2) * outFade(t, R.tBut, R.tBut + 0.1) });
        for (const w of L1.words) x += rise(ctx, w, t, x, y, px, o);
      }
      // ---- line 2: the contradiction, one row across the lower third ----
      const o2 = { ground: 'dark', alpha: end, flash: false, shake: 0.35 };
      const px = 178, small = 112, y2 = 1900;
      const sz = (w) => (keyOf(w.w) === 'a' ? small : px);
      const gap = px * 0.2;   // explicit word gaps: BUT and YOUR read as one word
      const total = L2.words.reduce((s, w) => s + measure(ctx, w.w, sz(w), o2) + gap, 0) - gap - px * 0.26;
      let x = 1920 - total / 2;
      if (t >= L2.words[0].start - 0.02) {
        const k = clamp01((t - L2.words[0].start + 0.02) / 0.08);
        ctx.font = '800 40px "JetBrains Mono"'; ctx.letterSpacing = '9px';
        ctx.fillStyle = `rgba(${MAG}, ${(0.85 * k * end).toFixed(3)})`;
        ctx.fillText('CONTRADICTION', x, y2 - px * 1.32);
        ctx.fillRect(x, y2 - px * 1.32 + 16, 46 * k, 4);
        ctx.letterSpacing = '0px';
      }
      for (const w of L2.words) {
        const k = keyOf(w.w);
        const s = sz(w);
        const fn = k === 'but' || k === 'call' ? strike : k === 'your' || k === 'tongues' || k === 'liar' ? glitch : scan;
        fn(ctx, w, t, x, y2, s, o2);
        x += measure(ctx, w.w, s, o2) + gap;
      }
      // ---- secondary: what it is really thinking ----
      const tTh = R.tBut + 0.45;   // after the title has gone
      const th = clamp01((t - tTh) / 0.12) * outFade(t, R.tCall - 0.05, R.tCall + 0.1) * end;
      if (th > 0.002) {
        const hp = project(cam, [HEAD[0] - 0.12, HEAD[1] + 0.2, HEAD[2] - 0.05]);
        const hx = Math.min(3600, Math.max(1700, hp.x - 170));
        const hy = Math.max(300, hp.y - 30);
        ctx.strokeStyle = `rgba(255, 110, 120, ${(0.6 * th).toFixed(3)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(hp.x + 40, hp.y + 40); ctx.lineTo(hx - 20, hy + 14); ctx.stroke();
        note(ctx, 'THINKING  ·  LOOK DEVOUT  ·  KEEP CONTROL', hx - 40, hy, { px: 40, align: 'right', alpha: 0.85 * th, color: '255, 150, 160' });
      }
      // ---- secondary: the verdict stamped onto the page of light on the console ----
      const tS = R.tCall + 0.02;
      if (t >= tS) {
        const s = spring(t, tS, 0.3, 0.25);
        const a = clamp01(s * 1.6) * end;
        // stamped over the page where it lies in the picture (screen space, so it reads at any size)
        const pp = project(cam, PAGE.c);
        ctx.save();
        ctx.translate(pp.x, pp.y - 20);
        ctx.rotate(-0.07 * s);
        ctx.scale(1 + (1 - s) * 0.6, 1 + (1 - s) * 0.6);
        ctx.font = '800 40px "JetBrains Mono"'; ctx.letterSpacing = '8px';
        const w1 = ctx.measureText('FACT CHECK:').width;
        ctx.font = '800 118px "JetBrains Mono"'; ctx.letterSpacing = '14px';
        const w2 = ctx.measureText('FALSE').width;
        const bw = Math.max(w1, w2) + 70;
        ctx.fillStyle = `rgba(20, 4, 12, ${(0.55 * a).toFixed(3)})`;
        ctx.fillRect(-bw / 2, -200, bw, 260);
        ctx.strokeStyle = `rgba(${MAG}, ${a.toFixed(3)})`; ctx.lineWidth = 9;
        ctx.strokeRect(-bw / 2, -200, bw, 260);
        ctx.fillStyle = `rgba(${MAG}, ${a.toFixed(3)})`;
        ctx.fillText('FALSE', -w2 / 2 + 7, 32);
        ctx.font = '800 40px "JetBrains Mono"'; ctx.letterSpacing = '8px';
        ctx.fillText('FACT CHECK:', -w1 / 2 + 4, -132);   // clear of FALSE (≥0.3 × its size)
        ctx.restore(); ctx.letterSpacing = '0px';
      }
    },
  };
};

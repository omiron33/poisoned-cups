// The words of s15-graves. "You paint the graves" is laid down the left like coats of finish: each
// word is applied by a gloss wipe (a bright sheen edge sweeps across it and leaves it sealed) and the
// coats stack down the column. "With your incense" rises bottom right with INCENSE as vapour type
// (soft plumes lift off it and dissolve; the word itself holds still); "and your skill" lands under
// it with SKILL set as smug presentation copy on a keynote card.
import { linesFrom, paint, measure, arrive, outFade, keyOf, clamp01, ease, note, carry, VOICES } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';

const [L1, L2] = linesFrom('You paint the graves', 'With your incense');
const rise = (ctx, w, t, x, y, px, o) => { const k = Math.min(1, Math.max(0, (t - w.start + 0.02) / 0.08)); if (k <= 0) return measure(ctx, w.w, px, o); return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: k * (o.alpha ?? 1) }); };

// GLOSS: the word is wiped on left to right in 0.08 s by a bright sheen edge, then holds
function gloss(ctx, w, t, x, y, px, o) {
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.08), wd = adv - px * 0.26;
  ctx.save(); ctx.beginPath(); ctx.rect(x - px * 0.2, y - px * 1.3, px * 0.2 + (wd + px * 0.3) * k, px * 1.7); ctx.clip();
  paint(ctx, w.w, x, y, px, o);
  ctx.restore();
  if (k < 1) {
    const ex = x + (wd + px * 0.1) * k;
    ctx.save(); ctx.translate(ex, y - px * 0.4); ctx.rotate(0.18);
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.9 * (1 - k)).toFixed(3)})`;
    ctx.fillRect(-px * 0.04, -px * 0.75, px * 0.08, px * 1.5);
    ctx.restore();
  }
  return adv;
}
// VAPOUR: the word holds still; soft blurred plumes of it lift and dissolve for a second
function vapour(ctx, w, t, x, y, px, o) {
  const adv = rise(ctx, w, t, x, y, px, o);
  const u = t - w.start;
  if (u > 0.1 && u < 1.8) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const v = ((u - 0.1) / 1.7 + i / 3) % 1;
      ctx.filter = `blur(${Math.round(8 + 30 * v)}px)`;
      paint(ctx, w.w, x + Math.sin(v * 5 + i) * px * 0.1, y - px * (0.35 + 1.1 * v), px, { ...o, ink: '214, 180, 255', alpha: 0.28 * (1 - v) * (o.alpha ?? 1) });
    }
    ctx.restore();
  }
  return adv;
}
// PITCH: SKILL on a keynote card: a thin rounded frame, a small mono tag above it
function pitch(ctx, w, t, x, y, px, o) {
  const adv = measure(ctx, w.w, px, o), wd = adv - px * 0.26;
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.08), a = (o.alpha ?? 1) * k;
  ctx.strokeStyle = `rgba(226, 232, 244, ${(0.7 * a).toFixed(3)})`; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x - px * 0.35, y - px * 1.05, wd + px * 0.7, px * 1.45, px * 0.2); ctx.stroke();
  ctx.font = `800 ${Math.round(px * 0.2)}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.03}px`;
  ctx.fillStyle = `rgba(255, 92, 170, ${a.toFixed(3)})`;
  ctx.fillText('SLIDE 15/15  ·  FLAWLESS', x - px * 0.35, y - px * 1.25);
  ctx.letterSpacing = '0px';
  paint(ctx, w.w, x, y, px, { ...o, alpha: a });
  return adv;
}

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.5,
  textPlane(t, cam) { return fullFrame(cam); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 250, y: 300 });
    const a = outFade(t, P.to - 0.05, P.to + 0.2);
    // the coats, stacked down the left
    L1.words.forEach((w, i) => gloss(ctx, w, t, 2560, 470 + i * 290, 240, { ground: 'dark', alpha: a }));
    // "With your incense" / "and your skill", right-aligned at the bottom right
    const rows = [L2.words.slice(0, 3), L2.words.slice(3)];
    rows.forEach((ws, r) => {
      const px = r === 0 ? 130 : 160;
      const fns = ws.map((w) => { const k = keyOf(w.w); return k === 'incense' ? vapour : k === 'skill' ? pitch : rise; });
      const total = ws.reduce((s, w) => s + measure(ctx, w.w, px, { ground: 'dark' }), 0) - px * 0.26 + (r === 1 ? px * 0.5 : 0);
      let x = 3590 - total;
      ws.forEach((w, j) => { if (fns[j] === pitch) x += px * 0.5; x += fns[j](ctx, w, t, x, r === 0 ? 1640 : 1930, px, { ground: 'dark', alpha: a }); });
    });
    note(ctx, 'LOT 15  ·  REFINISH  ·  GLOSS WHITE  ·  2 COATS  ·  MATT 23:27', 250, 1990, { px: 38, ground: 'dark', rule: 640, alpha: 0.8 * a * outFade(t, P.to - 0.5, P.to - 0.35) });
  },
});

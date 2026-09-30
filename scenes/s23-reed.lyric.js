// The words of s23-reed: tender, no weapons. "A cracked reed bruised" is whispered in mercy's
// lavender italic, stepping down the upper left like a stalk bending over, each word breathing in
// softly. "I will never crush or kill" is set steady along the bottom right: "I" in the divine
// gold-white, the rest in the same calm italic (crush and kill are not allowed to hit here).
import { linesFrom, paint, measure, arrive, outFade, clamp01, note, VOICES } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';
import { lyrics } from '/song/lib/look.js';

const [L1, L2] = linesFrom('A cracked reed', 'I will never crush');
// a soft word: fades up over 0.1 s with a small settle, then holds
const soft = (ctx, w, t, x, y, px, o) => { const k = Math.min(1, Math.max(0, (t - w.start + 0.02) / 0.08)); if (k <= 0) return measure(ctx, w.w, px, o); return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: k * (o.alpha ?? 1) }); };

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.4,
  textPlane(t, cam) { return fullFrame(cam); },
  drawText(ctx, t) {
    // carry(ctx, t, P), laid out exactly where s22 set "fall and tire" (same size and place, so the
    // words do not jump at the cut), then gone 0.45 s after "tire" ends
    if (t < P.from + 0.8) {
      const ws = lyrics.words.filter((w) => w.start < P.from + 0.02 && w.end > P.from - 1.2 && /^(fall|and|tire)$/i.test(w.w.replace(/[^a-z]/gi, '')));
      const ca = ws.length ? 1 - clamp01((t - (ws[ws.length - 1].end + 0.45)) / 0.2) : 0;
      let fx = 290;
      if (ca > 0.002) for (const w of ws) fx += paint(ctx, w.w, fx, 1800, 250, { alpha: ca }) + 250 * 0.12;
    }
    const a = outFade(t, P.to - 0.02, P.to + 0.1);
    const mercy = { voice: VOICES.mercy, ground: 'dark', alpha: a };
    // the bending stalk: "a cracked" / "reed" / "bruised"
    const rows = [[L1.words[0], L1.words[1]], [L1.words[2]], [L1.words[3]]];
    rows.forEach((row, r) => {
      let x = 300 + r * 150 + r * r * 40;
      for (const w of row) x += soft(ctx, w, t, x, 470 + r * 250, 190, mercy) + 190 * 0.12;
    });
    // "I will never crush or kill", steady along the bottom right
    const pxI = 215, px = 170;   // "I" near the line's size so it reads as a word, not a stroke
    const I = L2.words[0], rest = L2.words.slice(1);
    const wI = measure(ctx, I.w, pxI, { ground: 'dark' });
    const wr = rest.reduce((s, w) => s + measure(ctx, w.w, px, mercy), 0) - px * 0.26;
    let x = 3590 - (wI + px * 0.1 + wr);
    x += soft(ctx, I, t, x, 1860, pxI, { ground: 'dark', alpha: a });
    for (const w of rest) x += soft(ctx, w, t, x, 1860, px, mercy);
    note(ctx, 'LOT 23  ·  SIGNAL FILAMENT  ·  STILL LIVE  ·  ISA 42:3', 250, 2010, { px: 34, ground: 'dark', alpha: 0.7 * a * (t > P.from + 0.9 ? 1 : 0) });
  },
});

// The words of s23-reed (v4): tender, no weapons. "A cracked reed bruised" is whispered in mercy's
// lavender italic, stepping down the upper left like a stalk bending over, each word breathing in
// softly (A is sung 0.04 s before the cut, so it is drawn whole from the first frame, inside the
// fade-up). "I will never crush or kill" is set steady along the bottom right: "I" in the divine
// gold-white, the rest in the same calm italic (crush and kill are not allowed to hit here).
// The system's note UNIT 0417 · DAMAGED · DISPOSE sits by the arm from "bruised" until "I", when it
// flickers out.
import { paint, measure, outFade, clamp01, note, VOICES, project } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';
import { lines23, rig } from './s23-reed.js';

// a soft word: fades up over 0.08 s with a small settle, then holds
const soft = (ctx, w, t, x, y, px, o, P) => {
  const k = w.start < P.from ? 1 : Math.min(1, Math.max(0, (t - w.start + 0.02) / 0.08));
  if (k <= 0) return measure(ctx, w.w, px, o);
  return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: k * (o.alpha ?? 1) });
};

const A_VOICE = { ...VOICES.mercy, font: (px) => `600 ${px}px "EB Garamond"` };

export default (P) => {
  const [L1, L2] = lines23(P);
  const R = rig(P);
  return {
    textSize: [3840, 2160],
    shade: 0.5,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      const a = outFade(t, P.to - 0.02, P.to + 0.1);
      const mercy = { voice: VOICES.mercy, ground: 'dark', alpha: a };
      const dim1 = { ...mercy, alpha: a * (1 - 0.55 * clamp01((t - L2.words[0].start + 0.05) / 0.2)) };
      // the bending stalk: "a cracked" / "reed" / "bruised", kept left of the shaft of light
      const rows = [[L1.words[0], L1.words[1]], [L1.words[2]], [L1.words[3]]];
      rows.forEach((row, r) => {
        let x = 280 + r * 130 + r * r * 40;
        // A upright (an italic A alone failed OCR) and at the row's size, so A and CRACKED read as one line
        for (const w of row) { const big = /^a$/i.test(w.w); x += soft(ctx, w, t, x, 430 + r * 240, 190, big ? { ...dim1, voice: A_VOICE } : dim1, P) + 190 * (big ? 0.3 : 0.12); }
      });
      // "I will never crush or kill", steady along the bottom right
      const pxI = 225, px = 190, gap = px * 0.15;   // larger, with word gaps (NEVER failed over the lit floor)
      const I = L2.words[0], rest = L2.words.slice(1);
      const wI = measure(ctx, I.w, pxI, { ground: 'dark' });
      const wr = rest.reduce((s, w) => s + measure(ctx, w.w, px, mercy) + gap, 0) - gap - px * 0.26;
      let x = 3600 - (wI + gap + wr);
      x += soft(ctx, I, t, x, 1930, pxI, { ground: 'dark', alpha: a }, P) + gap;
      for (const w of rest) x += soft(ctx, w, t, x, 1930, px, mercy, P) + gap;
      // the system's note by the arm, placed where the wrist is on "bruised"; it flickers out on "I"
      if (t >= R.tBruised) {
        const cam = R.camera(R.tBruised);
        const p = project(cam, R.wrist(R.tBruised));
        const u = t - R.tI;
        const fl = u < 0 ? 1 : u > 0.2 ? 0 : [1, 0, 1, 0.3, 0, 0.6, 0, 0, 0.2, 0, 0, 0][Math.min(11, Math.floor(u * 60))];
        const k = clamp01((t - R.tBruised) / 0.06);
        if (fl * k > 0.002) {
          ctx.fillStyle = `rgba(255, 70, 90, ${(0.9 * fl * k * a).toFixed(3)})`; const lx = Math.min(p.x + 180, 3620 - 1080), ly = p.y + 340;
          ctx.fillRect(lx - 30, ly - 34, 8, 40);
          const lw = note(ctx, 'UNIT 0417  ·  DAMAGED  ·  DISPOSE', lx, ly, { px: 38, alpha: 0.82 * fl * k * a, color: '255, 160, 170' });
        }
      }
    },
  };
};

// The words of s08-see. The hook comes classified this time: "BROOD OF VIPERS" sits under black
// redaction bars across the top and each word's bar is ripped off on its onset. Then the question,
// small and deadpan on a hairline ("do you think ... can't ... still?"), while "I" is struck huge in
// gold blackletter at the left and "see" opens like an iris at the right, beside the shaft.
import { linesAt, redact, strike, paint, measure, note, outFade, keyOf, clamp01, ease, carry, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const I = L2.words.find((w) => keyOf(w.w) === 'i');
  const see = L2.words.find((w) => keyOf(w.w).startsWith('see'));
  const small = L2.words.filter((w) => w !== I && w !== see);
  return {
    textSize: [3840, 2160],
    shade: 0.7,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      // the hook, redacted, one line across the top; it steps back when the question starts
      const back = 1;
      const px = 330;
      const ws = L1.words;
      let tw = 0; for (const w of ws) tw += measure(ctx, w.w, px);
      let x = 1920 - (tw - px * 0.26) / 2;
      // each word's bar is torn away inside that word's own slot (clipped), so the flying strips
      // never lie across a neighbour that has just been revealed
      for (const w of ws) {
        const adv = measure(ctx, w.w, px);
        ctx.save(); ctx.beginPath(); ctx.rect(x - px * 0.12, 520 - px * 1.3, adv - px * 0.26 + px * 0.24, px * 1.75); ctx.clip();
        redact(ctx, w, t, x, 520, px, { ground: 'dark', alpha: out * back, show: P.from, bar: '4, 4, 4' });
        ctx.restore();
        x += adv;
      }
      note(ctx, 'FEED 01–06  ·  NO SIGNAL  ·  MATT 23:33', 1920, 700, { align: 'center', alpha: 0.75 * out * back });
      // the question, small, on a hairline along the bottom
      let sx = 240;
      for (const w of L2.words) {
        const k = clamp01((t - w.start) / 0.08);
        // the small I is set in gold Anton (the blackletter I reads as a J at this size); the huge
        // blackletter I beside it carries the divine voice
        const v = w === I ? { ...VOICES.divine, font: (p) => `400 ${p}px "Anton"`, scale: 1, track: 0.015, caps: true } : undefined;
        if (k > 0) paint(ctx, w.w, sx, 1960, 110, { ground: 'dark', alpha: k * out, voice: v });
        sx += measure(ctx, w.w, 110, { voice: v });
      }
      if (t >= L2.words[0].start) { ctx.fillStyle = `rgba(246, 240, 230, ${0.6 * out})`; ctx.fillRect(240, 1995, 1500 * ease.out3((t - L2.words[0].start) / 0.5), 3); }
      // I: struck huge, gold blackletter
      if (I) strike(ctx, I, t, 300, 1700, 900, { ground: 'dark', alpha: out, from: 0.6 });
      // see: opens like an iris
      if (see && t >= see.start) {
        const k = ease.out5((t - see.start) / 0.3);
        const spx = 560, sw = measure(ctx, see.w, spx);
        const cx = 2650, cy = 1500;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - spx * 0.3, 60 + k * sw, 0, Math.PI * 2); ctx.clip();
        paint(ctx, see.w, cx - sw / 2, cy, spx, { ground: 'dark', alpha: out });
        ctx.restore();
      }
    },
  };
};

// The words of s17-we-see. "You say" small at the top left, then their slogan WE SEE huge and
// polished (the claim voice's light tracked capitals) on a thin launch rule with an approval tag.
// "So your" arrives small at the bottom; on "darkness" a signal blackout closes over the frame
// from top and bottom (a few static lines, NO SIGNAL) and swallows the slogan; DARKNESS and STAYS
// are left burning cold in the black. The last 12 frames are black.
import { paint, measure, arrive, outFade, keyOf, clamp01, ease, note, carry, VOICES } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';
import { rig } from '/song/scenes/s17-we-see.js';

const rise = (ctx, w, t, x, y, px, o) => { const k = Math.min(1, Math.max(0, (t - w.start + 0.02) / 0.08)); if (k <= 0) return measure(ctx, w.w, px, o); return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: k * (o.alpha ?? 1) }); };
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function centred(ctx, words, t, y, px, o, fn = rise) {
  const total = words.reduce((s, w) => s + measure(ctx, w.w, px, o), 0) - px * 0.26;
  let x = 1920 - total / 2;
  for (const w of words) x += fn(ctx, w, t, x, y, px, o);
}

export default (P) => {
  const R = rig(P);
  const { L1, L2, tDark, tBlack } = R;
  const you = L1.words.filter((w) => !/^we|^see/.test(keyOf(w.w)));
  const slogan = L1.words.filter((w) => /^we|^see/.test(keyOf(w.w)));
  const soYour = L2.words.slice(0, 2), dark = L2.words.slice(2);
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const end = outFade(t, tBlack - 0.12, tBlack - 0.02);
      // "You say", small, top left of the slogan
      let x = 560;
      for (const w of you) x += rise(ctx, w, t, x, 290, 120, { ground: 'dark' });
      // the slogan: WE SEE, polished, on a thin launch rule
      const claim = { voice: VOICES.claim, ground: 'dark' };
      centred(ctx, slogan, t, 700, 380, claim);
      if (t >= slogan[0].start) {
        const k = ease.out3((t - slogan[0].start) / 0.3);
        ctx.fillStyle = 'rgba(226, 232, 244, 0.7)'; ctx.fillRect(1920 - 900 * k, 790, 1800 * k, 4);
        note(ctx, 'SLOGAN 17  ·  APPROVED  ·  VISION PLATFORM', 1920, 862, { px: 34, align: 'center', alpha: 0.75 * k });
      }
      // "So your" at the bottom
      centred(ctx, soYour, t, 1080, 140, { ground: 'dark', alpha: end });
      // the blackout: black closes from top and bottom in 0.1 s on "darkness"
      if (t >= tDark - 0.02) {
        const k = ease.out3((t - tDark + 0.02) / 0.1);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, 3840, 1080 * k); ctx.fillRect(0, 2160 - 1080 * k, 3840, 1080 * k);
        // static lines while it closes and a few after
        const n = t - tDark < 0.3 ? 6 : 0;
        for (let i = 0; i < n; i++) {
          const h = hsh(Math.floor(t * 30) * 7 + i);
          ctx.fillStyle = `rgba(230, 236, 255, ${(0.25 + 0.4 * hsh(i + h)).toFixed(3)})`;
          ctx.fillRect(0, h * 2160, 3840, 2 + 6 * hsh(h * 3));
        }
        note(ctx, 'NO SIGNAL', 3590, 300, { px: 34, align: 'right', alpha: 0.6 * k * end });
        centred(ctx, soYour, t, 1080, 140, { ground: 'dark', alpha: end });
        // DARKNESS huge, STAYS under it
        const px = 380;
        const dw = measure(ctx, dark[0].w, px, { ground: 'dark' });
        rise(ctx, dark[0], t, 1920 - (dw - px * 0.26) / 2, 1600, px, { ground: 'dark', alpha: end });
        const sw = measure(ctx, dark[1].w, 200, { ground: 'dark' });
        rise(ctx, dark[1], t, 1920 - (sw - 200 * 0.26) / 2, 1880, 200, { ground: 'dark', alpha: end });
        if (t >= tBlack - 0.02) { ctx.fillStyle = 'rgb(0, 0, 0)'; ctx.fillRect(0, 0, 3840, 2160); }
      }
    },
  };
};

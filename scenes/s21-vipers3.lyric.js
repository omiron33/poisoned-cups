// The words of s21-vipers3. Full frame: the hook fills the screen in bone white on a dark shade over
// the fire (BROOD across the top, VIPERS the full width below), struck on the kicks with
// a hard shake. On "Who" it is ripped away and the question takes the whole frame: a hairline row of
// small capitals, then "fire?" huge.
import { linesAt, strike, slash, glitch, measure, note, outFade, clamp01, carry, BONE } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

// bone-white ink over a strong dark shade: dark ink read grey (~2:1) where the fire and smoke
// sit behind it; light ink with the shade pushing the fire down under it holds everywhere.
const INKB = BONE, HOT = '255, 250, 240';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  const center = (ctx, w, px) => 1920 - (measure(ctx, w.w, px, { ground: 'dark' }) - px * 0.26) / 2;
  return {
    textSize: [3840, 2160],
    shade: 0.9,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      const gone = clamp01(1 - (t - L2.words[0].start + 0.04) / 0.08);
      const o = { ground: 'dark', ink: INKB, alpha: out * gone, shake: 2.2, from: 1.3 };
      if (gone > 0) {
        strike(ctx, brood, t, center(ctx, brood, 560), 700, 560, o);
        glitch(ctx, of, t, center(ctx, of, 200), 960, 200, o);
        slash(ctx, vipers, t, center(ctx, vipers, 900), 1880, 900, { ...o, angle: -0.25 });
      } else {
        let tw = 0; for (const w of body) tw += measure(ctx, w.w, 150, { ground: 'dark' });
        let x = 1920 - (tw - 150 * 0.26) / 2;
        for (const w of body) x += glitch(ctx, w, t, x, 520, 150, { ground: 'dark', ink: INKB, alpha: out });
        // crisp: white-hot, a short small shake, no long drive-in
        strike(ctx, fire, t, center(ctx, fire, 1000), 1880, 1000, { ground: 'dark', ink: HOT, alpha: out, shake: 0.5, from: 0.3, flash: false });
      }
      note(ctx, 'HALL A  ·  ALL ROWS  ·  CONTAINMENT: NONE  ·  MATT 23:33', 240, 250, { px: 36, alpha: 0.85 * out, color: INKB });
    },
  };
};

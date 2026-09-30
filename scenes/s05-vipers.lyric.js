// The words of s05-vipers. "BROOD / of / VIPERS" is a towering left column, each word driven in on
// its kick (BROOD strikes, VIPERS is slashed in); the hook's second line sits bottom right, small,
// with "fire?" struck huge beneath it as the ring of fire climbs.
import { linesAt, strike, slash, glitch, flow, paint, measure, note, outFade, keyOf, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  return {
    textSize: [3840, 2160],
    shade: 0.75,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      const o = { ground: 'dark', alpha: out };
      strike(ctx, brood, t, 240, 720, 500, o);
      glitch(ctx, of, t, 260, 1000, 190, o);
      slash(ctx, vipers, t, 230, 1560, 560, o);
      // the question, larger and on two right-aligned rows with a wide word space (WHO WARNED read
      // as one word at 130 px), clear of VIPERS on the left and FIRE? below
      const bpx = 165, gap = bpx * 0.26;
      const rows = [body.slice(0, 3), body.slice(3)];
      rows.forEach((row, r) => {
        const adv = row.map((w) => measure(ctx, w.w, bpx));
        let x = 3600 - (adv.reduce((a, b) => a + b, 0) + gap * (row.length - 1) - bpx * 0.26);
        row.forEach((w, i) => { flow(ctx, [w], t, { x, y: 1190 + r * 215, px: bpx, ground: 'dark', alpha: out, rise: 0.12 }); x += adv[i] + gap; });
      });
      const fw = measure(ctx, fire.w, 440);
      strike(ctx, fire, t, 3600 - fw + 440 * 0.26, 1950, 440, o);
      note(ctx, 'LOT 05  ·  NEST  ·  CAT6 / CHROME  ·  MATT 23:33', 3600, 300, { align: 'right', rule: 0, alpha: 0.8 * out });
    },
  };
};

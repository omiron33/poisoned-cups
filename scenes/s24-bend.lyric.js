// The words of s24-bend. The last hook is a target list: "BUT / BROOD / OF / VIPERS" stacked in a
// right-hand column, each word locked in a HUD reticle as it is sung, dead still. Then "IF YOU
// WON'T" small at the lower left, and "bend" set huge in italic with no motion at all: it appears
// on its onset, rigid, and never moves.
import { linesAt, lockOn, paint, measure, note, outFade, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'But brood of vipers', 'If you won');
  const bend = L2.words[L2.words.length - 1], rest = L2.words.slice(0, -1);
  return {
    textSize: [3840, 2160],
    shade: 0.65,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "kill" (s23) is sung across the cut
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      const col = [[L1.words[0], 140, 400], [L1.words[1], 320, 880], [L1.words[2], 130, 1200], [L1.words[3], 380, 1790]];
      col.forEach(([w, px, y], i) => {
        const wd = measure(ctx, w.w, px) - px * 0.26;
        lockOn(ctx, w, t, 3560 - wd, y, px, { ground: 'dark', alpha: out, tag: 'TARGET 0' + (i + 1), hud: '200, 214, 222', lead: 0.25 });
      });
      let x = 260;
      for (const w of rest) {
        if (t >= w.start) paint(ctx, w.w, x, 1560, 160, { ground: 'dark', alpha: out });
        x += measure(ctx, w.w, 160);
      }
      if (t >= bend.start) paint(ctx, bend.w, 250, 2000, 330, { ground: 'dark', alpha: out });
      note(ctx, 'LOT 24  ·  STEEL  ·  TENSILE: UNYIELDING  ·  MATT 23:33', 260, 330, { alpha: 0.8 * out, rule: 700 });
    },
  };
};

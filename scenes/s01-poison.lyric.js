// The words of s01-poison. "You polish cups" runs along the bottom like a launch caption: "polish"
// is slashed clean, "cups" strikes. "Leave the poison in" stacks down the right column as the camera
// tilts over the rim, and a HUD reticle locks onto "poison" as the green is seen.
import { linesFrom, arm, strike, slash, lockOn, flow, note, outFade, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('You polish cups', 'Leave the poison in');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.45,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 250, y: 420 });   // the bottom left holds "You polish cups" and the LOT note
    const a = outFade(t, P.to - 0.35, P.to - 0.02);
    // "You" plain, then the veneer words with an extra gap (tracked capitals read tight otherwise)
    const you = strike(ctx, L1.words[0], t, 250, 1880, 190, { ground: 'dark', alpha: a, flash: false, shake: 0.5 });
    arm(ctx, L1.words.slice(1), t, (w, i) => (/polish/i.test(w.w) ? slash : strike),
      { x: 250 + you + 40, y: 1880, px: 190, ground: 'dark', alpha: a, flash: false, shake: 0.5 });
    arm(ctx, L2.words, t, (w, i) => (/poison/i.test(w.w) ? lockOn : strike),
      { x: 3590, y: 820, px: 220, lead: 1.5, align: 'right', maxW: 1300, ground: 'dark', alpha: a, tag: 'SUBSTANCE 01', flash: false });
    if (t > L1.words[0].start) note(ctx, 'LOT 01  ·  RIM  ·  MIRROR POLISH  ·  MATT 23:25', 250, 1990, { ground: 'dark', alpha: 0.8 * a * outFade(t, L2.words[0].start - 0.2, L2.words[0].start + 0.2) });
  },
});

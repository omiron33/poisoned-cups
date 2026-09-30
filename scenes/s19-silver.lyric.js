// The words of s19-silver, in dark ink across the upper third over the grey clean-room wall, above
// the gloves: "Silver in your palms" thumps in word by word, PALMS locked on like an asset being
// tagged; "Blood on the floor" is struck in under it, BLOOD slashed, as the red spreads. A mono
// catalogue note on a hairline rule sits top right.
import { linesAt, arm, strike, slash, lockOn, note, outFade, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

// SILVER and BLOOD in a deeper red so they hold 4.5:1 on the grey wall
const deep = (fn) => (ctx, w, t, x, y, px, o) => fn(ctx, w, t, x, y, px, /^(silver|blood)/i.test(w.w) ? { ...o, ink: '92, 8, 18' } : o);
const dStrike = deep(strike), dSlash = deep(slash);

export default (P) => {
  const [L1, L2] = linesAt(P.from - 1.0, 'Silver in your palms', 'Blood on the floor');
  return {
    textSize: [3840, 2160], shade: 0.6,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "raise" (s18) is sung across the cut; the clean room is light
      carry(ctx, t, P, { ground: 'light' });
      const out = outFade(t, P.to - 0.2, P.to);
      const o = { ground: 'light', alpha: out, rot: 0, shake: 0.5, hud: '138, 16, 28' };
      arm(ctx, L1.words, t, (w, i) => (/palms/i.test(w.w) ? lockOn : dStrike), { x: 260, y: 400, px: 190, ...o, tag: 'ASSET · SILVER' });
      arm(ctx, L2.words, t, (w, i) => (/blood/i.test(w.w) ? dSlash : strike), { x: 260, y: 720, px: 190, ...o });
      ctx.fillStyle = `rgba(20, 16, 15, ${(0.7 * out * clamp01((t - P.from - 0.3) / 0.3)).toFixed(3)})`;
      ctx.fillRect(2380, 290, 1200, 3);
      note(ctx, 'LOT 19 · 30 PIECES · CLEAN ROOM ISO 5 · MATT 27:6', 3580, 250, { px: 34, align: 'right', ground: 'light', alpha: 0.9 * clamp01((t - P.from - 0.3) / 0.3) * out });
    },
  };
};

// The words of s23-reed: tender. "A cracked reed bruised" steps down the left in mercy's italic,
// one word to a row like a stalk bending; then "I" is set huge in gold blackletter on the right,
// with "will never crush or kill" quietly beside it. No weapons here.
import { linesFrom, flow, paint, arrive, measure, note, outFade, spring, clamp01, carry } from '/song/lib/type.js';

const [L1, L2] = linesFrom('A cracked reed', 'I will never crush');
const fullFrame = (cam) => {
  const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ww = nrm(sub(cam.target, cam.pos)), r = cam.roll ?? 0;
  const uu = nrm(cross(ww, [Math.sin(r), Math.cos(r), 0])), vv = cross(uu, ww);
  const hh = Math.tan((cam.fov * Math.PI) / 360), hw = hh * 16 / 9;
  return { c: cam.pos.map((v, i) => v + ww[i]), ax: uu, ay: vv, hs: [hw, hh] };
};

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.4,
  textPlane(t, cam) { return fullFrame(cam); },
  drawText(ctx, t) {
    // "tire" (s22) is sung across the cut: held low left, above the LOT note
    carry(ctx, t, P, { y: 1850 });
    const a = outFade(t, P.to - 0.3, P.to);
    // the stepped column: "A cracked" / "reed" / "bruised"
    const rows = [[L1.words[0], L1.words[1]], [L1.words[2]], [L1.words[3]]];
    rows.forEach((row, r) => flow(ctx, row, t, { x: 260 + r * 110, y: 560 + r * 330, px: 220, ground: 'dark', alpha: a, rise: 0.3 }));
    // "I", huge and gold, settling on its onset
    const I = L2.words[0];
    if (t >= I.start) {
      const s = spring(t, I.start, 0.8, 0.15);
      ctx.save(); ctx.translate(2750, 1320); const sc = 0.92 + 0.08 * s; ctx.scale(sc, sc);
      paint(ctx, I.w, -120, 0, 620, { ground: 'dark', alpha: clamp01(s * 1.3) * a });
      ctx.restore();
    }
    flow(ctx, L2.words.slice(1), t, { x: 2380, y: 1680, px: 160, maxW: 1260, ground: 'dark', alpha: a });
    note(ctx, 'LOT 23  ·  REED  ·  WICK  ·  NOT FOR SALE  ·  ISA 42:3  ·  MATT 12:20', 260, 1990, { px: 38, ground: 'dark', rule: 700, alpha: 0.8 * a });
  },
});

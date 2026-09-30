// The words of s15-graves: "You paint the graves" slams down a left column, word over word, like
// coats of paint; "With your incense and your skill" sits bottom right, its hollow boasts
// ("incense", "skill") under black bars that are ripped off on their onsets.
import { linesFrom, arm, redact, paint, arrive, note, outFade, keyOf, clamp01, carry } from '/song/lib/type.js';

const [L1, L2] = linesFrom('You paint the graves', 'With your incense');
// SLAM, held still: each word lands at full size on its onset (a 3-frame fade, no scale spring, so
// it never moves in the frames after it arrives); older coats step up and dim only when the next
// word lands.
function coats(ctx, words, t, { x, y, px, keep = 3, gap = 0.98, ground, alpha }) {
  const n = words.filter((w) => t >= w.start).length;
  for (let i = Math.max(0, n - keep - 1); i < n; i++) {
    const w = words[i], top = i === n - 1;
    const a = clamp01((t - w.start) / 0.05) * alpha * clamp01(1 - (n - 1 - i - keep + 1) * 0.9);
    if (a < 0.003) continue;
    const size = px * (top ? 1 : 0.62);
    paint(ctx, w.w, x, y - (n - 1 - i) * px * gap * 0.72, size, { alpha: a * (top ? 1 : 0.55), ground });
  }
}
const flat = (ctx, w, t, x, y, px, o) => { const s = arrive(w, t); return paint(ctx, w.w, x, y + (1 - s.k) * px * 0.18, px, { ...o, alpha: s.a * (o.alpha ?? 1) }); };

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.6,
  textPlane(t, cam) {
    // full-frame camera plane
    const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const ww = nrm(sub(cam.target, cam.pos)), r = cam.roll ?? 0;
    const uu = nrm(cross(ww, [Math.sin(r), Math.cos(r), 0])), vv = cross(uu, ww);
    const hh = Math.tan((cam.fov * Math.PI) / 360), hw = hh * 16 / 9;
    return { c: cam.pos.map((v, i) => v + ww[i]), ax: uu, ay: vv, hs: [hw, hh] };
  },
  drawText(ctx, t) {
    // "liar" (s14) is sung across the cut: held low left, above the LOT note
    carry(ctx, t, P, { y: 1840 });
    const a = outFade(t, P.to - 0.2, P.to);
    coats(ctx, L1.words, t, { x: 250, y: 1150, px: 300, keep: 3, gap: 1.5, ground: 'dark', alpha: a });
    // only the words sung inside this scene; the rest belongs to the next
    const w2 = L2.words.filter((w) => w.start < P.to - 0.5);
    arm(ctx, w2, t, (w, i) => (['incense', 'skill'].includes(keyOf(w.w)) ? redact : flat), { x: 3600, y: 1880, px: 190, align: 'right', maxW: 2600, ground: 'dark', alpha: a });
    note(ctx, 'LOT 15  ·  MONOLITH  ·  GLOSS WHITE  ·  2 COATS  ·  MATT 23:27', 250, 1990, { px: 40, ground: 'dark', rule: 640, alpha: 0.85 * a });
  },
});

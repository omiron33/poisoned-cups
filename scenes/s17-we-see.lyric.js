// The words of s17-we-see: "You say" small at top left; their claim "we see" hand-written huge in
// marker, the pen drawing each word across its sung length; "So your darkness stays" along the
// bottom, a HUD reticle locking onto "darkness".
import { linesAt, flow, arm, lockOn, paint, arrive, measure, note, outFade, keyOf, VOICES, clamp01, ease, carry } from '/song/lib/type.js';

const flat = (ctx, w, t, x, y, px, o) => { const s = arrive(w, t); return paint(ctx, w.w, x, y + (1 - s.k) * px * 0.18, px, { ...o, alpha: s.a * (o.alpha ?? 1) }); };
const fullFrame = (cam) => {
  const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ww = nrm(sub(cam.target, cam.pos)), r = cam.roll ?? 0;
  const uu = nrm(cross(ww, [Math.sin(r), Math.cos(r), 0])), vv = cross(uu, ww);
  const hh = Math.tan((cam.fov * Math.PI) / 360), hw = hh * 16 / 9;
  return { c: cam.pos.map((v, i) => v + ww[i]), ax: uu, ay: vv, hs: [hw, hh] };
};

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'You say', 'So your darkness');
  const plain = L1.words.filter((w) => !/we|see/i.test(keyOf(w.w)));
  const claim = L1.words.filter((w) => /we|see/i.test(keyOf(w.w)));
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const a = outFade(t, P.to - 0.25, P.to);
      // the line as one: "You say" in Anton, then their claim hand-written inline, the pen drawing
      // each claim word across its sung length
      let x = 260; const y = 520, px = 190;
      for (const w of L1.words) {
        const isClaim = claim.includes(w);
        const o = isClaim ? { voice: VOICES.claim, ground: 'dark' } : { ground: 'dark' };
        const pxx = isClaim ? px * 1.5 : px;
        const adv = measure(ctx, w.w, pxx, o);
        if (t >= w.start) {
          if (isClaim) {
            const k = ease.out3((t - w.start) / Math.max(0.22, Math.min(0.6, w.end - w.start)));
            ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - pxx * 1.2, (adv + 40) * k, pxx * 1.8); ctx.clip();
            ctx.translate(x, y); ctx.rotate(-0.05);
            paint(ctx, w.w, 0, 0, pxx, { ...o, alpha: a });
            ctx.restore();
          } else { const s = arrive(w, t); paint(ctx, w.w, x, y + (1 - s.k) * px * 0.18, px, { ...o, alpha: s.a * a }); }
        }
        x += adv;
      }
      arm(ctx, L2.words, t, (w, i) => (keyOf(w.w) === 'darkness' ? lockOn : flat), { x: 1920, y: 1840, px: 200, align: 'center', maxW: 3200, ground: 'dark', alpha: a, tag: 'TARGET 17' });
      note(ctx, 'LOT 17  ·  HEADSET  ·  24K  ·  BLACK MIRROR  ·  MATT 23:16', 3580, 2010, { px: 38, ground: 'dark', align: 'right', rule: 0, alpha: 0.8 * a });
    },
  };
};

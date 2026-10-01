// The words of s12-gate (v2). "You sell the gate" is a storefront: the headline across the top in
// the polished claim voice with SELL in acid green, and three subscription tiers dealt in as price
// cards down the left wall on the beats (BASIC, PRO, and ELITE with its clearance badge). On
// "guard" the store becomes a hard lock: the tiers flip to REVOKED, an ACCESS DENIED panel slams
// onto the right wall, and "Then you guard the gate" hammers in across the bottom in Anton, GUARD
// in magenta with a voltage flicker, the last GATE locked on by a red reticle.
import { linesFrom, paint, measure, scan, volt, strike, lockOn, stamp, note, outFade, clamp01, ease, spring, VOICES, carry, lyrics } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { W12 } from './s12-gate.js';

const [L1, L2] = linesFrom('You sell the gate', 'Then you guard the gate');

function card(ctx, t, t0, { x, y, w, h, tier, price, badge, locked }) {
  if (t < t0) return;
  const k = ease.out5((t - t0) / 0.14);
  const dx = (1 - k) * -160;
  ctx.save();
  ctx.globalAlpha = clamp01(k * 1.5);
  ctx.fillStyle = 'rgba(10, 8, 16, 0.86)';
  ctx.beginPath(); ctx.roundRect(x + dx, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = locked ? 'rgba(255, 92, 170, 0.95)' : 'rgba(226, 232, 244, 0.45)'; ctx.lineWidth = 3; ctx.stroke();
  note(ctx, tier, x + dx + 36, y + 70, { px: 36, alpha: 0.95 });
  ctx.font = '300 74px "Inter Tight"'; ctx.letterSpacing = '4px';
  ctx.fillStyle = locked ? 'rgba(160, 160, 176, 1)' : 'rgba(226, 232, 244, 1)';
  ctx.fillText(price, x + dx + 36, y + 162);
  ctx.letterSpacing = '0px';
  // (v3: no REVOKED / CLEARED corner badges: the magenta frame and the lock panel say it)
  ctx.restore();
}

export default (P) => ({
  textSize: [3840, 2160], shade: 0.15,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    // "pays" is sung across the cut: carried bottom left on a dark tab (the wall there glows green)
    const cw0 = lyrics.words.filter((w) => w.start < P.from + 0.02 && w.end > P.from - 0.3);
    if (cw0.length) {
      const ca = 1 - clamp01((t - (cw0[cw0.length - 1].end + 0.45)) / 0.2);
      if (ca > 0.002 && t < P.from + 0.8) { ctx.fillStyle = `rgba(8, 6, 12, ${(0.9 * ca).toFixed(3)})`; ctx.beginPath(); ctx.roundRect(220, 1850, 1060, 150, 12); ctx.fill(); }
    }
    carry(ctx, t, P, { x: 260, y: 1960 });
    const out = outFade(t, P.to - 0.15, P.to);
    const locked = t >= W12.guard;
    // the headline: centred, the claim voice, SELL in green
    const px = 170, o = { alpha: out };
    const adv = L1.words.map((w) => measure(ctx, w.w, px, /sell/i.test(w.w) ? {} : { voice: VOICES.claim }));
    let x = 1920 - (adv.reduce((a, b) => a + b, 0) - px * 0.26) / 2;
    const top = outFade(t, W12.then - 0.2, W12.then + 0.05);
    L1.words.forEach((w, i) => {
      scan(ctx, w, t, x, 360, px, { ...o, alpha: out * top, voice: /sell/i.test(w.w) ? undefined : VOICES.claim });
      x += adv[i] + px * 0.08;
    });
    // the tiers down the left wall
    const cw = 640, ch = 200;
    card(ctx, t, W12.sell, { x: 240, y: 640, w: cw, h: ch, tier: 'BASIC', price: '$9 / MO', locked });
    card(ctx, t, W12.sell + 0.35, { x: 240, y: 880, w: cw, h: ch, tier: 'PRO', price: '$49 / MO', locked });
    card(ctx, t, W12.gate1, { x: 240, y: 1120, w: cw, h: ch, tier: 'ELITE', price: '$4,900', badge: 'CLEARED ✓'.replace(' ✓', ''), locked });
    // the lock panel on the right wall
    if (t >= W12.guard) {
      const k = spring(t, W12.guard, 0.3, 0.2);
      ctx.save(); ctx.translate(3240, 900); ctx.scale(1 + (1 - k) * 0.4, 1 + (1 - k) * 0.4);
      ctx.fillStyle = `rgba(20, 4, 12, ${(0.88 * out).toFixed(3)})`;
      ctx.fillRect(-360, -170, 720, 330);
      ctx.strokeStyle = `rgba(255, 92, 170, ${out.toFixed(3)})`; ctx.lineWidth = 6; ctx.strokeRect(-360, -170, 720, 330);
      note(ctx, 'ACCESS DENIED', 0, 20, { px: 58, align: 'center', alpha: out, color: '255, 92, 170' });
      ctx.restore();
    }
    // the hard-lock band across the frame behind the second line
    if (t >= L2.words[0].start - 0.1) {
      const k = ease.out5((t - (L2.words[0].start - 0.1)) / 0.12);
      ctx.fillStyle = `rgba(6, 4, 10, ${(0.97 * k * out).toFixed(3)})`;
      ctx.fillRect(0, 1640, 3840 * k, 360);
      ctx.fillStyle = `rgba(255, 92, 170, ${(0.9 * k * out).toFixed(3)})`;
      ctx.fillRect(0, 1640, 3840 * k, 4); ctx.fillRect(3840 * (1 - k), 1996, 3840 * k, 4);
    }
    // the second line, bottom, hard: THEN YOU plain, GUARD violent, THE plain, GATE locked on
    const px2 = 200;
    const adv2 = L2.words.map((w) => measure(ctx, w.w, px2));
    const pre = px2 * 0.5;   // extra room before GATE so its reticle clears THE
    let x2 = 1920 - (adv2.reduce((a, b) => a + b, 0) + px2 * 0.2 * 4 + pre - px2 * 0.26) / 2;
    L2.words.forEach((w, i) => {
      const fn = i === 2 ? volt : i === 4 ? lockOn : strike;
      fn(ctx, w, t, x2, 1880, px2, { alpha: out, flash: false, shake: 0.5, hud: '255, 92, 170', lead: 0.2 });
      x2 += adv2[i] + px2 * 0.2 + (i === 3 ? pre : 0);
    });
  },
});

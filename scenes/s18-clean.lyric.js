// The words of s18-clean. "YOU SAY" is a deadpan mono label; "we're clean" is written on the
// white clean-room wall in their own hand (Permanent Marker), the stroke revealed left to right as
// it is sung. "But your hands still raise" sits bottom right under black redaction bars that are
// ripped away word by word as the water clouds.
import { arm, redact, paint, measure, note, outFade, VOICES, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lines18 } from './s18-clean.js';

export default (P) => {
  const [L1, L2] = lines18(P);
  const claim = L1.words.filter((w) => !/^(you|say)$/i.test(w.w.replace(/[^a-z]/gi, '')));
  const lead = L1.words.filter((w) => /^(you|say)$/i.test(w.w.replace(/[^a-z]/gi, '')));
  return {
    textSize: [3840, 2160],
    shade: 0.25,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { ground: 'light' });
      const a1 = outFade(t, L2.words[0].start - 0.15, L2.words[0].start + 0.25);
      // YOU SAY: small mono, one word at a time
      let x = 260;
      for (const w of lead) {
        if (t >= w.start) note(ctx, w.w.toUpperCase(), x, 330, { px: 64, ground: 'light', alpha: 0.9 * a1 });
        x += 260;
      }
      if (t >= lead[0].start) ctx.fillStyle = `rgba(20, 16, 15, ${0.8 * a1})`, ctx.fillRect(260, 368, 480 * clamp01((t - lead[0].start) / 0.4), 3);
      // we're clean: written in marker, each word's stroke revealed over its duration
      let cx = 250;
      for (const w of claim) {
        const px = 300;
        const adv = measure(ctx, w.w, px, { voice: VOICES.claim, ground: 'light' });
        const k = clamp01((t - w.start) / Math.max(0.2, Math.min(0.5, w.end - w.start)));
        if (k > 0) {
          ctx.save();
          ctx.beginPath(); ctx.rect(cx - 20, 380, (adv + 40) * k, 420); ctx.clip();
          ctx.translate(cx, 700); ctx.rotate(-0.04);
          paint(ctx, w.w, 0, 0, px, { voice: VOICES.claim, ground: 'light', alpha: a1, keepPunct: false });
          ctx.restore();
        }
        cx += adv + 30;
      }
      // line 2: redacted, bottom right
      const a2 = outFade(t, P.to - 0.12, P.to - 0.01);
      arm(ctx, L2.words, t, redact, { x: 3590, y: 1900, px: 170, align: 'right', ground: 'light', alpha: a2, barAlpha: 0.92 * a2, show: L2.words[0].start - 0.5 });
      note(ctx, 'LOT 18  ·  BASIN  ·  STERILE  ·  MATT 23:25', 3590, 2010, { px: 38, ground: 'light', align: 'right', alpha: 0.8 * a2 * clamp01((t - L2.words[0].start) / 0.3) });
    },
  };
};

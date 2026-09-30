// The words of s02-fringes. "Long fringes swing": each word hangs on a hairline under one of the
// three middle fibre bundles and swings with it like a price tag, striking in on its onset.
// "But your hearts stay thin" is armed along the bottom; "thin" is slashed in two.
import { linesFrom, arm, strike, glitch, slash, note, outFade, clamp01, project, measure, keyOf, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { fringesCamera, tipOf, swingAngle } from '/song/scenes/s02-fringes.js';

const [L1, L2] = linesFrom('Long fringes swing', 'But your hearts stay thin');

export default (P) => {
  const cam = fringesCamera(P.from);
  return {
    textSize: [3840, 2160],
    shade: 0.75,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const out = outFade(t, P.to - 0.3, P.to);
      const u = t - P.from;
      const c = cam(t);
      // line 1: tags on bundles 1, 2, 3
      L1.words.forEach((w, j) => {
        if (t < w.start) return;
        const i = j * 2;
        const tip = project(c, tipOf(i, u));
        const a = -swingAngle(i, u);
        const px = 140;
        const adv = measure(ctx, w.w, px) - px * 0.26;
        const drop = 70;
        const k = clamp01((t - w.start) / 0.12);
        ctx.save();
        ctx.translate(tip.x, tip.y + 30);
        ctx.rotate(a * 0.9);
        ctx.strokeStyle = `rgba(200, 255, 245, ${(0.7 * k * out).toFixed(3)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, drop * k); ctx.stroke();
        strike(ctx, w, t, -adv / 2, drop + px * 1.02, px, { ground: 'dark', alpha: out, rot: 0.08 });
        ctx.restore();
      });
      // line 2 along the bottom
      // THIN in a lighter blood red: it sat at 4.4:1 on the lit floor
      arm(ctx, L2.words, t, (w, i) => (keyOf(w.w) === 'thin' ? (c2, w2, t2, x2, y2, p2, o2) => slash(c2, w2, t2, x2, y2, p2, { ...o2, ink: '255, 150, 140' }) : glitch),
        { x: 240, y: 1930, px: 150, ground: 'dark', alpha: out, angle: -0.5 });
      note(ctx, 'LOT 02  ·  FIBRE FRINGE  ·  5 × 30 CORES  ·  MATT 23:5', 3600, 1930, { ground: 'dark', align: 'right', px: 34, alpha: 0.85 * out });
    },
  };
};

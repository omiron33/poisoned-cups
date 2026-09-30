// The words of s09-gnat.
// "You strain a gnat": a deadpan inspection readout. A thin HUD box is pinned to the bug in the
// mesh; "You strain a" sits small top left, and GNAT locks on beside the bug itself.
// "Let the camel through": set along the bottom; CAMEL rides down with the falling camel (pinned to
// its side) and drops into its place in the line as the camel lands on "through" (glitched in).
import { linesFrom, flow, lockOn, strike, glitch, measure, note, outFade, keyOf, clamp01, project, ease, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { gnatCamera } from '/song/scenes/s09-gnat.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');
const MH = 1.25;

export default (P) => {
  let cam = null;
  const camAt = gnatCamera(P);
  const tCam = L2.words.find((w) => /camel/i.test(w.w)).start;
  const tThr = L2.words.find((w) => /through/i.test(w.w)).start;
  const drop = 2.6, g = (2 * drop) / Math.pow(tThr - tCam, 2);
  const camelY = (t) => 0.25 + Math.max(0, drop - 0.5 * g * Math.max(0, t - tCam) ** 2);
  return {
    textSize: [3840, 2160],
    shade: 0.7,
    textPlane(t, c) { cam = c; return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      cam = camAt(t);
      const tLet = L2.words[0].start;
      const f1 = outFade(t, tLet - 0.3, tLet - 0.05);
      const gnatW = L1.words.find((w) => /gnat/i.test(w.w));
      if (f1 > 0.002) {
        flow(ctx, L1.words.filter((w) => w !== gnatW), t, { x: 240, y: 420, px: 150, alpha: f1 });
        note(ctx, 'FILTER 09  ·  MESH 0.016  ·  MATT 23:24', 240, 560, { rule: 560, alpha: 0.8 * f1 });
        if (cam) {
          const b = project(cam, [0.004, MH + 0.008, 0]);
          // the inspection box round the bug
          const k = ease.out3((t - P.from) / 0.5);
          const r = 150 + 240 * (1 - k);
          ctx.strokeStyle = `rgba(0, 255, 170, ${(0.8 * f1).toFixed(3)})`; ctx.lineWidth = 3;
          ctx.strokeRect(b.x - r, b.y - r * 0.7, r * 2, r * 1.4);
          ctx.fillStyle = `rgba(0, 255, 170, ${(0.85 * f1).toFixed(3)})`;
          ctx.font = '800 34px "JetBrains Mono"';
          ctx.fillText('0.0031 G  ·  FLAGGED', b.x - r, b.y + r * 0.7 + 48);
          ctx.fillRect(b.x + r, b.y, 120, 3);
          lockOn(ctx, gnatW, t, b.x + r + 190, b.y + 70, 190, { alpha: f1, tag: 'BUG 0x01' });
        }
      }
      // line 2 along the bottom
      const fade = outFade(t, P.to - 0.2, P.to);
      const px = 250, y = 1880;
      let x = 240;
      for (const w of L2.words) {
        const adv = measure(ctx, w.w, px);
        const k = keyOf(w.w);
        if (k === 'camel') {
          let yy = y;
          if (cam && t < tThr) {
            const pj = project(cam, [0.75, camelY(t) + 0.95, 0.0]);
            yy = Math.max(400, Math.min(y, pj.y));
          }
          if (t >= w.start && yy > -px) strike(ctx, w, t, x, yy, px * 1.25, { alpha: fade, flash: false });
          x += measure(ctx, w.w, px * 1.25);
          continue;
        }
        if (k === 'through') glitch(ctx, w, t, x, y, px, { alpha: fade });
        else flow(ctx, [w], t, { x, y, px, alpha: fade });
        x += adv;
      }
    },
  };
};

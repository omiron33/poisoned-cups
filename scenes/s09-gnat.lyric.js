// The words of s09-gnat.
// "You strain a gnat": micro-small and forensic. The camera holds the drone dead centre, so a thin
// inspection box is drawn round it there, and the line types out beside it as a terminal readout;
// GNAT is locked on as the specimen, with a weight and a verdict in mono under it.
// "Let the camel through": huge and shameless. LET THE sits top left; CAMEL strikes in from far
// larger than the frame (it clips the edges for a few frames) and lands across the width;
// THROUGH passes in with a trailing signal echo under it.
import { linesFrom, term, lockOn, strike, ghost, arm, note, outFade, clamp01, ease, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.95,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 240, y: 1960 });
    const tLet = L2.words[0].start;
    const f1 = outFade(t, tLet - 0.3, tLet - 0.05);
    if (f1 > 0.002) {
      // the inspection box round the drone at the frame's centre
      const k = ease.out3((t - P.from) / 0.45);
      const r = 170 + 260 * (1 - k);
      ctx.strokeStyle = `rgba(255, 92, 170, ${(0.85 * f1).toFixed(3)})`; ctx.lineWidth = 3;
      const L = 60;
      ctx.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const cx = 1920 + sx * r, cy = 1080 + sy * r * 0.72;
        ctx.moveTo(cx - sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy - sy * L);
      }
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 92, 170, ${(0.85 * f1).toFixed(3)})`;
      ctx.fillRect(1920 + r, 1080, 190, 3);
      // the readout: tiny, typed
      const words = L1.words.slice(0, -1), gnat = L1.words[L1.words.length - 1];
      arm(ctx, words, t, term, { x: 2330, y: 960, px: 136, maxW: 1400, alpha: f1 });   // big enough to hold against the mesh
      lockOn(ctx, gnat, t, 2330, 1260, 160, { alpha: f1, tag: 'SPECIMEN 0x01', hud: '255, 92, 170', flash: false });
      if (t > gnat.start) note(ctx, 'MASS 0.0031 G  ·  LANE A  ·  REJECTED', 2330, 1420, { px: 36, color: '255, 150, 200', alpha: 0.9 * f1 });
      note(ctx, 'FILTER 09  ·  PITCH 0.0045', 240, 250, { px: 38, rule: 420, alpha: 0.8 * f1 });
    }
    // line 2: huge
    const fade = outFade(t, P.to - 0.2, P.to);
    const [wLet, wThe, wCamel, wThr] = L2.words;
    arm(ctx, [wLet, wThe], t, strike, { x: 240, y: 400, px: 190, alpha: fade, flash: false, shake: 0.4 });
    strike(ctx, wCamel, t, 240, 1400, 640, { alpha: fade, from: 0.25, rot: 0.03, flash: false, shake: 0.4 });   // drives in from only a little larger, so it never rides up over LET THE
    if (wThr) ghost(ctx, wThr, t, 250, 1840, 280, { alpha: fade, dir: -1 });
    if (t > wCamel.start) note(ctx, 'LANE B  ·  CARGO 40 FT  ·  38,000 KG  ·  CLEARED  ·  MATT 23:24', 3600, 1990, { px: 38, align: 'right', color: '150, 255, 110', alpha: 0.9 * fade });
  },
});

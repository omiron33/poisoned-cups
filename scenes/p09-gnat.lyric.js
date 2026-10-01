// The words of s09-gnat (v4).
// "You strain a gnat": micro-small and forensic. A thin cold-white detection box (corner brackets,
// projected from the man's figure) closes on him on "strain"; the line types out at a fixed screen
// position beside it in plain cold white; GNAT is locked on in toxic green; two deadpan system labels
// sit under it (the violation from "strain", the fine from "gnat"). Line 1 dims on "Let" and fades
// out during the whip pan, because its picture is gone.
// "Let the camel through": huge and shameless. LET THE top left; CAMEL strikes in larger than the
// frame (it clips the edges for a few frames) and lands across the width over the hauler's black
// side; THROUGH passes in with a trailing signal echo; a convoy note bottom right.
import { linesFrom, term, lockOn, strike, ghost, arm, note, outFade, clamp01, ease, measure, project } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { gnatRig } from '/song/scenes/s09-gnat.js';

const [L1, L2] = linesFrom('You strain a gnat', 'Let the camel through');
const COLD = '236, 242, 252';
const ACID = '150, 255, 110';

export default (P) => {
  const R = gnatRig(P);
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const { tStrain, gnat, tLet, tCamel } = R;
      // line 1 and its box: full until "Let", dimmed to 45% on it, gone by the end of the whip
      const f1 = (1 - 0.55 * ease.out3((t - tLet) / 0.06)) * outFade(t, tLet + 0.08, tLet + 0.3);
      if (f1 > 0.002) {
        // the detection box, projected from his figure
        const cam = R.camera(t);
        const y0 = R.manY(t), z0 = R.manZ(t);
        let x0 = 1e9, x1 = -1e9, ya = 1e9, yb = -1e9;
        for (const dx of [-0.42, 0.42]) for (const dy of [-0.02, 1.9]) for (const dz of [-0.4, 0.45]) {
          const s = project(cam, [dx, y0 + dy, z0 + dz]);
          x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); ya = Math.min(ya, s.y); yb = Math.max(yb, s.y);
        }
        const k = ease.out3((t - (tStrain - 0.12)) / 0.3);
        if (k > 0) {
          const cx = (x0 + x1) / 2, cy = (ya + yb) / 2;
          const hw = ((x1 - x0) / 2) * (1 + 0.9 * (1 - k)), hh = ((yb - ya) / 2) * (1 + 0.5 * (1 - k));
          const a = clamp01(k * 2) * f1 * 0.9;
          ctx.strokeStyle = `rgba(${COLD}, ${a.toFixed(3)})`; ctx.lineWidth = 4;
          const L = Math.min(hw, hh) * 0.35;
          ctx.beginPath();
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            const px = cx + sx * hw, py = cy + sy * hh;
            ctx.moveTo(px - sx * L, py); ctx.lineTo(px, py); ctx.lineTo(px, py - sy * L);
          }
          ctx.stroke();
          // a hairline leader from the box to the readout
          ctx.fillStyle = `rgba(${COLD}, ${(a * 0.6).toFixed(3)})`;
          ctx.fillRect(cx + hw + 30, TX.y - 40, Math.max(0, TX.x - (cx + hw) - 70), 3);
        }
        // the readout, at a fixed screen position
        const words = L1.words.slice(0, -1);
        arm(ctx, words, t, term, { x: TX.x, y: TX.y, px: TX.px, maxW: 2000, alpha: f1, ink: COLD, echo: false });
        let gx = TX.x;
        for (const w of words) gx += measure(ctx, w.w, TX.px, {});
        gx += TX.px * 0.25;
        ctx.save(); ctx.globalAlpha = f1;   // (lockOn's bracket ignores alpha)
        lockOn(ctx, gnat, t, gx, TX.y, TX.px, { hud: ACID, flash: false, lead: 0.2 });
        ctx.restore();
        if (t > tStrain) note(ctx, 'VIOLATION  ·  JAYWALK  ·  CONF 0.998', TX.x, TX.y + 150, { px: 38, color: COLD, alpha: 0.8 * f1 * clamp01((t - tStrain) / 0.1) });
        if (t > gnat.start) note(ctx, 'FINE $250  ·  SCORE −40', TX.x, TX.y + 215, { px: 38, color: ACID, alpha: 0.8 * f1 * clamp01((t - gnat.start) / 0.1) });
      }
      // line 2: huge
      const fade = outFade(t, P.to - 0.04, P.to + 0.01);
      const [wLet, wThe, wCamel, wThr] = L2.words;
      arm(ctx, [wLet, wThe], t, strike, { x: 240, y: 430, px: 210, alpha: fade, flash: false, shake: 0.4 });
      const cpx = 600;   // huge but inside the reader's grasp (was 720)
      const cadv = measure(ctx, wCamel.w, cpx, {}) - cpx * 0.26;
      strike(ctx, wCamel, t, 1920 - cadv / 2, 1640, cpx, { alpha: fade, from: 1.4, rot: 0.02, flash: false, shake: 0.35 });
      if (wThr) { const tw = measure(ctx, wThr.w, 270, {}) - 270 * 0.26; ghost(ctx, wThr, t, 3600 - tw, 1990, 270, { alpha: fade, dir: -1 }); }
      if (t > tCamel) note(ctx, 'CONVOY  ·  EXEMPT  ·  CAMERAS AVERTED  ·  MATT 23:24', 240, 1990, { px: 38, color: ACID, alpha: 0.85 * fade * clamp01((t - tCamel) / 0.1) });
    },
  };
};
const TX = { x: 2240, y: 1180, px: 120 };

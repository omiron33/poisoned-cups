// The words of s11-widow. "Blind guides smile" is targeted down the left edge like a HUD read-out
// (BLIND locked on, GUIDES struck, SMILE glitching: a veneer that won't hold still). "While the widow
// pays" falls down a right-hand column like the two coins: WIDOW drops in on its onset and settles,
// PAYS strikes in below it. A mono spec note sits bottom left.
import { linesFrom, arm, lockOn, strike, glitch, flow, paint, measure, arrive, note, outFade, spring, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import scene from './s11-widow.js';
import { project } from '/song/lib/look.js';

const [L1, L2] = linesFrom('Blind guides smile', 'While the widow pays');
const [wWhile, wThe, wWidow, wPays] = L2.words;
const wSmile = L1.words[2];

// the terminal's UI words, drawn in the screen's own plane (an affine map from screen-local units)
const TERM = [-0.42, 0, -0.2], C = Math.cos(0.42), S = Math.sin(0.42);
const toWorld = (x, y, z = 0.056) => [TERM[0] + x, TERM[1] + 1.36 + C * y + S * z, TERM[2] - 0.08 - S * y + C * z];
function screenText(ctx, cam, t) {
  const o = project(cam, toWorld(0, 0)), ex = project(cam, toWorld(0.01, 0)), ey = project(cam, toWorld(0, 0.01));
  if (o.z <= 0.05) return;
  ctx.save();
  ctx.setTransform((ex.x - o.x) / 100, (ex.y - o.y) / 100, (ey.x - o.x) / 100, (ey.y - o.y) / 100, o.x, o.y);
  // 1 unit = 0.1 mm on the screen, x right, y up (the flip keeps glyphs upright)
  ctx.scale(1, -1);
  const txt = (s, x, y, px, ink, weight = 800) => {
    ctx.font = `${weight} ${px}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.08}px`;
    ctx.fillStyle = `rgb(${ink})`; ctx.fillText(s, x, -y);
  };
  const ok = t >= wSmile.start;
  txt(ok ? 'APPROVED' : 'VERIFIED GUIDE', -300, 480, ok ? 330 : 230, ok ? '6, 70, 28' : '20, 40, 30');
  // wide word spaces: the screen is seen at a steep angle, so tight spaces closed up
  txt('TRUSTED   ·   5.0', -300, 150, 150, '30, 60, 45', 500);
  txt('THANK   YOU', 640, -1330, 190, '236, 255, 240');
  ctx.restore();
  ctx.letterSpacing = '0px';
}

let cam0 = null;
export default (P) => { cam0 = scene(P); return ({
  textSize: [3840, 2160], shade: 0.4,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 280, y: 1500 });   // the bottom left holds the LOT note
    if (cam0) screenText(ctx, cam0.camera(t), t);
    const out = outFade(t, P.to - 0.12, P.to);
    arm(ctx, L1.words, t, (w, i) => [lockOn, strike, glitch][i % 3], { x: 280, y: 900, px: 175, maxW: 960, lead: 1.4, tag: 'SUBJECT 11 · GUIDE', alpha: out });
    const X = 2820;
    flow(ctx, [wWhile, wThe], t, { x: X, y: 1180, px: 140, ground: 'dark', alpha: out });
    // WIDOW drops from above like a coin and settles with a small bounce
    if (t >= wWidow.start) {
      const s = spring(t, wWidow.start, 0.42, 0.45);
      const a = arrive(wWidow, t).a;
      paint(ctx, wWidow.w, X, 1540 - (1 - s) * 420, 210, { alpha: a * out, ground: 'dark' });
    }
    strike(ctx, wPays, t, X, 1880, 230, { alpha: out, rot: 0.08 });
    // top right, on the clear backdrop: at the bottom left it ran over the terminal's lit base plate
    note(ctx, 'LOT 11 · OFFERING TERMINAL · 2 LEPTA · MARK 12:42', 3580, 300, { px: 40, align: 'right', alpha: 0.85 * clamp01((t - P.from - 0.4) / 0.3) * out });
  },
}); };

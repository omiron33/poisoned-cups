// The words of s03-tomb (v2). Outside, "WHITE STONE WALLS" is set like architectural signage on the
// pale corridor at the left: graphite capitals drawn by a plotter pass (a hairline sweeps across
// and leaves the word), each with a dimension line above it (ticks and a measurement). When the
// camera drives through the crack the signage is gone; inside, "Over rotting bones" builds from
// flickering machine labels pinned by leader lines to the blades, trunks and coolant: each word in
// its own label panel with a mono fault tag, voltage-flickering on.
import { linesFrom, measure, paint, volt, note, outFade, clamp01, ease, keyOf, carry, project, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { tombCamera, crackX } from '/song/scenes/s03-tomb.js';

const [L1, L2] = linesFrom('White stone walls', 'Over rotting bones');
// the claim voice at a heavier weight: the light strokes broke up on the grey (walls read 3.25:1)
const SIGN = { ...VOICES.claim, font: (px) => `500 ${px}px "Inter Tight"` };

// PLOT: the word is drawn by a hairline that sweeps left to right across it in 0.08 s
function plot(ctx, w, t, x, y, px, o) {
  const adv = measure(ctx, w.w, px, o), wd = adv - px * 0.26;
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.08);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - px * 1.2, (wd + 20) * k, px * 1.6); ctx.clip();
  paint(ctx, w.w, x, y, px, o);
  ctx.restore();
  if (k < 1) { ctx.fillStyle = `rgba(30, 34, 44, ${(o.alpha ?? 1).toFixed(3)})`; ctx.fillRect(x + wd * k, y - px * 1.0, 3, px * 1.2); }
  return adv;
}

export default (P) => {
  const tc = L2.words[0].start - 0.45;
  const cam = tombCamera(P.from);
  const MC = [0, 1.3, 0];
  // the internal components each label points at (world space, inside the monolith)
  const cx = crackX(1.2);
  const targets = [[-0.37, 1.45, -0.45], [0.0, 1.62, -0.6], [0.37, 1.0, -0.5]];
  return {
    textSize: [3840, 2160],
    shade: 0.85,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { ground: 'light' });
      // ---- outside: architectural signage, graphite on the pale corridor
      const f1 = outFade(t, tc - 0.15, tc + 0.15);
      if (f1 > 0.002) {
        const ink = '30, 34, 44';
        L1.words.forEach((w, i) => {
          const px = 200, x = 260, y = 700 + i * 360;
          if (t < w.start - 0.25) return;
          const wd = measure(ctx, w.w, px, { ground: 'light', voice: SIGN }) - px * 0.26;
          // the dimension line draws itself just before the word
          const k = ease.out3((t - (w.start - 0.25)) / 0.25);
          const yl = y - px * 1.05;
          ctx.strokeStyle = `rgba(${ink}, ${(0.8 * f1).toFixed(3)})`; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, yl); ctx.lineTo(x + wd * k, yl);
          ctx.moveTo(x, yl - 18); ctx.lineTo(x, yl + 18);
          if (k > 0.98) { ctx.moveTo(x + wd, yl - 18); ctx.lineTo(x + wd, yl + 18); }
          ctx.stroke();
          plot(ctx, w, t, x, y, px, { ground: 'light', alpha: f1, ink: '6, 8, 14', voice: SIGN });   // near-black: the light strokes need it on the grey
        });
        note(ctx, 'UNIT 03  ·  MONOLITH  ·  CLEAN ROOM WHITE  ·  MATT 23:27', 260, 1880, { px: 32, color: '30, 34, 44', rule: 700, alpha: 0.85 * f1 });
      }
      // ---- inside: machine labels on leaders
      const f2 = outFade(t, P.to - 0.25, P.to);
      const c = cam(t);
      const spots = [[300, 640], [1320, 1180], [1900, 1760]];
      L2.words.forEach((w, i) => {
        if (t < w.start - 0.02) return;
        const px = 210;
        const [x, y] = spots[i];
        const wd = measure(ctx, w.w, px) - px * 0.26;
        const k = clamp01((t - w.start + 0.02) / 0.08);
        const hot = keyOf(w.w) !== 'over';
        const col = hot ? '255, 92, 170' : '150, 255, 110';
        // the panel and its frame
        const bx = x - 40, by = y - px * 1.08, bw = wd + 80, bh = px * 1.4;
        ctx.fillStyle = `rgba(8, 8, 12, ${(f2 * k).toFixed(3)})`; ctx.fillRect(bx, by, bw, bh);   // opaque: the halo no longer lifts the panel to grey
        ctx.strokeStyle = `rgba(${col}, ${(0.9 * f2 * k).toFixed(3)})`; ctx.lineWidth = 4; ctx.strokeRect(bx, by, bw, bh);
        // the leader to its component (the line follows the camera; the label stays still)
        const q = project(c, targets[i]);
        if (q.z > 0.05) {
          const ax = q.x < bx ? bx : q.x > bx + bw ? bx + bw : q.x, ay = q.y < by ? by : by + bh;
          ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(q.x, q.y); ctx.stroke();
          ctx.fillStyle = `rgba(${col}, ${(f2 * k).toFixed(3)})`; ctx.beginPath(); ctx.arc(q.x, q.y, 12, 0, Math.PI * 2); ctx.fill();
        }
        volt(ctx, w, t, x, y, px, { ground: 'dark', alpha: f2, ink: hot ? '255, 150, 206' : undefined });   // a lighter magenta
      });
    },
  };
};

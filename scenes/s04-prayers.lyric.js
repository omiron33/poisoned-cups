// The words of s04-prayers. "Soft-spoke prayers" rides the chrome waveform itself: each word
// floats just above a bead, rising and falling with the voice, set quiet in tracked capitals.
// On "Cut" the waveform shatters and the second line is thrown down a diagonal staircase, every
// word slashed in along the blades' angle; it stays while the last blade strikes the rack.
import { linesFrom, slash, note, outFade, clamp01, project, measure, arrive, paint, keyOf, carry, ease } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { prayersCamera, prayerTimes, beadPosJS } from '/song/scenes/s04-prayers.js';

const [L1, L2] = linesFrom('Soft-spoke prayers', 'Cut like sharpened stones');

export default (P) => {
  const cam = prayersCamera(P.from, P.to);
  const { tA, tCut } = prayerTimes(P.to);
  return {
    textSize: [3840, 2160],
    shade: 0.6,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);   // "Over rotting bones", sung across the cut
      const u = t - P.from;
      const c = cam(t);
      // line 1, pinned above beads 5 and 14 once the camera has pulled back
      const f1 = clamp01((t - tA) / 0.15) * outFade(t, tCut - 0.05, tCut + 0.08);
      [5, 14].forEach((bi, j) => {
        const w = L1.words[j];
        const s = arrive(w, t);
        if (s.a < 0.002 || f1 <= 0) return;
        // the word lands where its bead is at its onset and holds still there for 0.3 s (it must
        // settle before it moves), then eases over 0.45 s into riding the bead
        const at = (tt) => { const b = beadPosJS(bi, tt - P.from); return project(cam(tt), [b[0], b[1] + 0.13, b[2]]); };
        const q0 = at(Math.max(w.start, tA)), q1 = at(t);
        const m = ease.inOut3((t - Math.max(w.start, tA) - 0.3) / 0.45);
        const q = { x: q0.x + (q1.x - q0.x) * m, y: q0.y + (q1.y - q0.y) * m };
        const px = 110;
        const wd = measure(ctx, w.w, px) - px * 0.26;
        paint(ctx, w.w, q.x - wd / 2, q.y, px, { ground: 'dark', alpha: s.a * f1 });
        ctx.fillStyle = `rgba(230, 236, 232, ${(0.6 * s.a * f1).toFixed(3)})`;
        ctx.fillRect(q.x - 1.5, q.y + 20, 3, 60);
      });
      // line 2: a staircase of slashed words
      const f2 = outFade(t, P.to - 0.25, P.to);
      L2.words.forEach((w, i) => {
        // LIKE steps a little further right, off the strip light that stands just left of it
        slash(ctx, w, t, 280 + i * 700 + (i === 1 ? 140 : 0), 560 + i * 390, 230, { ground: 'dark', alpha: f2, angle: 0.5 });
      });
      if (t >= tA) note(ctx, 'LOT 04  ·  VOICE WAVEFORM  ·  21 BEADS  ·  MATT 23:14', 3590, 1940, { ground: 'dark', align: 'right', px: 34, alpha: 0.85 * f2 });
    },
  };
};

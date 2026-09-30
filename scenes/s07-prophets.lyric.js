// The words of s07-prophets. "You honor prophets" is carved on the pillars themselves: one word
// on each white shaft below its screen, dark ink on white stone, struck in on its onset and riding
// the pillar as the camera sinks. "That your fathers tried to kill" is a right-hand column, one
// word a row like names on a memorial roll; KILL is locked on as the traces flatline.
import { linesFrom, strike, lockOn, glitch, note, outFade, clamp01, project, measure, keyOf, VOICES, carry, ease, paint } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { prophetsCamera, prophetTimes, PX } from '/song/scenes/s07-prophets.js';

const [L1, L2] = linesFrom('You honor prophets', 'That your fathers tried to kill');

export default (P) => {
  const cam = prophetsCamera(P.from);
  const { tB } = prophetTimes();
  return {
    textSize: [3840, 2160],
    shade: 0.65,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);   // "To build your little empire": EMPIRE is sung across the cut
      const c = cam(t);
      // line 1, carved on the pillars. Each word lands where its pillar is at its onset and holds
      // still for 0.3 s before it eases into riding the pillar as the camera sinks. PROPHETS is
      // still being sung at the cut to the close-up, so after the cut the whole line holds, still,
      // on the dark screen at the left until 0.45 s after PROPHETS ends.
      if (t < tB) L1.words.forEach((w, i) => {
        const px = 104;
        const at = (tt) => project(cam(tt), [PX[i], 1.12, 0.35]);
        const q0 = at(w.start), q1 = at(t);
        const m = ease.inOut3((t - w.start - 0.3) / 0.45);
        const q = { x: q0.x + (q1.x - q0.x) * m, y: q0.y + (q1.y - q0.y) * m };
        const wd = measure(ctx, w.w, px, { ground: 'light' }) - px * 0.26;
        strike(ctx, w, t, q.x - wd / 2, q.y, px, { ground: 'light', alpha: 1, flash: false, rot: 0.05, shake: 0.3 });
      });
      else {
        const last = L1.words[L1.words.length - 1];
        const a = 1 - clamp01((t - (last.end + 0.45)) / 0.2);
        if (a > 0.002) { let x = 440; for (const w of L1.words) x += paint(ctx, w.w, x, 1650, 104, { ground: 'dark', alpha: a }); }
      }
      const f2 = outFade(t, P.to - 0.25, P.to);
      L2.words.forEach((w, i) => {
        const px = 150;
        const isKill = keyOf(w.w) === 'kill';
        const wd = measure(ctx, w.w, px) - px * 0.26;
        const x = 3300 - wd, y = 470 + i * 235;
        (isKill ? lockOn : i % 2 ? glitch : strike)(ctx, w, t, x, y, px, { ground: 'dark', alpha: f2, hud: '255, 90, 80', ...(isKill ? { ink: '255, 156, 108' } : {}) });   // KILL a lighter flame: 3.9:1 on the lit floor
        // the reticle's tag sits to the right of KILL, not above it against the TO row
        if (isKill && t >= w.start + 0.05) note(ctx, 'FLATLINE', 3400, y - px * 0.3, { px: 34, color: '255, 90, 80', alpha: 0.9 * f2 * clamp01((t - w.start - 0.05) / 0.15) });
      });
      if (t >= tB) note(ctx, 'LOT 07  ·  MEMORIAL ARRAY  ·  3 UNITS  ·  MATT 23:29', 3300, 1990, { ground: 'dark', px: 34, align: 'right', alpha: 0.85 * f2 * clamp01((t - tB) / 0.2) });
    },
  };
};

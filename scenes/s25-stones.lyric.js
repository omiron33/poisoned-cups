// The words of s25-stones: written into the system's own materials. Each word burns on the surface
// that lights for it (see SURF in the picture): The and stones on the pylons' access rails, will on a
// server housing, speak on a dead screen, My high on the concrete back wall in gold-white (the one
// stable, luminous word), and the held will on the floor slab. Each is mapped into the surface's
// perspective (onSurface), so the camera's held steps carry them like the architecture they are.
import { linesFrom, paint, measure, note, outFade, clamp01, ease, voiceOf, carry } from '/song/lib/type.js';
import { fullFrame, onSurface } from '/song/lib/x-f.js';
import { rig, SURF } from '/song/scenes/s25-stones.js';

const [L] = linesFrom('The stones will speak');
const PLAIN = voiceOf('the');
const PX = 200;
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const blendCam = (a, b, k) => (k >= 1 ? b : { pos: lerp(a.pos, b.pos, k), target: lerp(a.target, b.target, k), fov: a.fov + (b.fov - a.fov) * k, roll: 0 });

export default (P) => {
  const R = rig(P);
  return {
    textSize: [3840, 2160],
    shade: 0.6,   // screen-fixed words now sit over the lit cracks: a firmer halo
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const cam = R.camera(t);
      const a = outFade(t, P.to - 0.1, P.to);
      // placement audit: the words no longer ride the surfaces (the camera's steps carried them); they
      // hold fixed screen places in the same reading path: THE STONES WILL / SPEAK MY / WILL
      const ROWS = [[0, 1, 2], [3, 4], [5]], YS = [380, 800, 1840], PXS = [200, 200, 250];
      ROWS.forEach((row, r) => {
        const px = PXS[r], gap = px * 0.45;
        const vs = row.map((i) => (i === 4 ? voiceOf(L.words[i].w) : PLAIN));
        const ws = row.map((i, j) => measure(ctx, L.words[i].w, px, { voice: vs[j] }) - px * 0.26);
        let x = 1920 - (ws.reduce((p, q) => p + q, 0) + gap * (row.length - 1)) / 2;
        row.forEach((i, j) => {
          const w = L.words[i], isMy = i === 4, voice = vs[j];
          if (t >= w.start - 0.02) {
            const k = clamp01((t - w.start + 0.02) / 0.08);
            paint(ctx, w.w, x, YS[r], px, { voice, ground: 'dark', alpha: k * a, ink: isMy ? undefined : '255, 246, 234' });
            // the burn: a white flash on the onset (never on My, which only brightens)
            const hot = Math.exp(-(t - w.start) * 9) * (isMy ? 0 : 1);
            if (hot > 0.02) paint(ctx, w.w, x, YS[r], px, { voice, ground: 'dark', ink: '255, 255, 255', alpha: hot * k * a });
          }
          x += ws[j] + gap;
        });
      });
      note(ctx, 'LOT 25  ·  WITNESS  ·  THE SYSTEM TESTIFIES  ·  LUKE 19:40', 1920, 2010, { px: 38, ground: 'dark', align: 'center', alpha: 0.8 * a * outFade(t, R.on[5] - 0.3, R.on[5]) });
    },
  };
};

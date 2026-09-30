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
    shade: 0.4,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const cam = R.camera(t);
      const a = outFade(t, P.to - 0.1, P.to);
      L.words.forEach((w, i) => {
        if (t < w.start - 0.02) return;
        const s = SURF[i];
        const isMy = i === 4;
        const voice = isMy ? voiceOf(w.w) : PLAIN;
        const size = PX * voice.scale;
        const mpp = s.h / (size * (isMy ? 0.66 : 0.8));
        const k = clamp01((t - w.start + 0.02) / 0.08);
        // the settle gate: a word holds still on screen for 0.3 s after it lands (the camera starts its
        // next step 0.14 s after the onset), then eases back onto its surface as the camera carries it
        const hold = isMy ? cam : blendCam(R.camera(w.start + 0.02), cam, ease.inOut3(clamp01((t - w.start - 0.3) / 0.22)));
        onSurface(ctx, hold, s.c, s.ax, s.ay, mpp, () => {
          const tw = measure(ctx, w.w, PX, { voice }) - PX * 0.26;
          const y = size * (isMy ? 0.33 : 0.4);
          paint(ctx, w.w, -tw / 2, y, PX, { voice, ground: 'dark', alpha: k * a, ink: isMy ? undefined : '255, 246, 234' });
          // the burn: a white flash on the onset (never on My, which only brightens)
          const hot = Math.exp(-(t - w.start) * 9) * (isMy ? 0 : 1);
          if (hot > 0.02) paint(ctx, w.w, -tw / 2, y, PX, { voice, ground: 'dark', ink: '255, 255, 255', alpha: hot * k * a });
        });
      });
      note(ctx, 'LOT 25  ·  WITNESS  ·  THE SYSTEM TESTIFIES  ·  LUKE 19:40', 1920, 2010, { px: 38, ground: 'dark', align: 'center', alpha: 0.8 * a * outFade(t, R.on[5] - 0.3, R.on[5]) });
    },
  };
};

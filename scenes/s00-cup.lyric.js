// The title of s00-cup. POISONED glitches in on the first kick and CUPS lands tracked like a luxury
// logotype on the next; MATTHEW 23 stamps under them. The intro stays spotless: one faint glitch
// flicker on POISONED when the rim flashes, nothing more.
import { glitch, strike, note, stamp, outFade, VOICES, nextBeat, beats, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { leakTime } from './s00-cup.js';

export default (P) => {
  const tP = nextBeat(P.from + 0.05), tC = nextBeat(tP + 0.3), tM = nextBeat(tC + 1.0);
  const tLeak = leakTime(P);
  const pulse = [tLeak];
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const a = outFade(t, P.to - 0.45, P.to - 0.05);
      const x = 250;
      // POISONED: plain Anton; one faint glitch flicker when the rim flashes
      glitch(ctx, { w: 'POISONED', start: tP }, t, x, 740, 270, { ground: 'dark', alpha: a, beats: pulse });
      strike(ctx, { w: 'CUPS', start: tC }, t, x + 10, 1030, 230, { ground: 'dark', alpha: a, voice: VOICES.veneer });
      if (t >= tM) stamp(ctx, 'MATTHEW 23', t, tM, { x: x + 330, y: 1300, px: 62, rot: -0.04, color: '196, 206, 216', alpha: a });
      if (t >= tM + 0.66) note(ctx, 'LOT 00  ·  CHALICE  ·  TITANIUM / 24K  ·  MATT 23:25', 3590, 1960, { ground: 'dark', align: 'right', rule: 0, alpha: 0.85 * a });
    },
  };
};

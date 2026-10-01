// The words of s25-stones (v4): fixed screen rows above the overthrow, one reading path:
// THE STONES WILL / SPEAK MY on two rows high over the falling pylons, and the held WILL on the
// bottom row over the crowd. MY is divine gold-white, the only gold, and never flashes; every other
// word lands with a white burn flash. The falls are staged left, back and right in the band between
// the rows, so no row sits over a falling pylon or the breach of light. LUKE 19:40 is a small mono
// note under the second row, gone before the held "will". Mid-key to 149.5, then the words fade into
// the white.
import { linesFrom, paint, measure, note, outFade, clamp01, voiceOf } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';

const [L] = linesFrom('The stones will speak');
const PLAIN = voiceOf('the');

export default (P) => {
  const on = L.words.map((w) => w.start);
  return {
    textSize: [3840, 2160],
    shade: 0.8,   // a firm backing: the rows sit over the hall's dark upper wall and the faces
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      const a = outFade(t, P.to - 0.37, P.to - 0.24);   // readable to 149.65 (will ends 149.50), gone before the white peaks
      const ROWS = [[0, 1, 2], [3, 4], [5]], YS = [400, 680, 1860], PXS = [200, 200, 250];
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
            const hot = Math.exp(-(t - w.start) * 9) * (isMy ? 0 : 1);
            if (hot > 0.02) paint(ctx, w.w, x, YS[r], px, { voice, ground: 'dark', ink: '255, 255, 255', alpha: hot * k * a });
          }
          x += ws[j] + gap;
        });
      });
      const na = 0.8 * clamp01((t - P.from - 0.1) / 0.25) * outFade(t, on[5] - 0.35, on[5] - 0.05);
      if (na > 0.002) note(ctx, 'LUKE 19:40', 1920, 790, { px: 38, ground: 'dark', align: 'center', alpha: na });
    },
  };
};

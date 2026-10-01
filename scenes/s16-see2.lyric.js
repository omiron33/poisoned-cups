// The words of s16-see2 (v2). The hook is filed as a dossier header, top left: a green file bar
// (DOSSIER 16 · THREAT CLASS: VIPER) and the words scanned in under it in heavy magenta. The
// question sits low on the left, small machine-white words on one baseline, until "I" arrives in
// gold-white Garamond, large, stable, lit; "see" follows in the same voice, revealed top-down by
// the falling light in 0.08 s. Neither divine word is ever glitched. A mono tag in the top-right
// margin notes the faces freezing when "see" lands.
import { linesAt, arm, scan, paint, measure, note, outFade, keyOf, clamp01, ease, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lyrics } from '/song/lib/look.js';

// the carried line from s15, as carry() lays it out but with a wider word space (the default space
// let "YOUR INCENSE" read as one word on the encoded film)
function carryWide(ctx, t, P, { x = 240, y = 1960, px = 96 } = {}) {
  if (t > P.from + 0.8) return;
  const ws = lyrics.words.filter((w) => w.start < P.from + 0.02 && w.end > P.from - 0.3);
  if (!ws.length) return;
  const line = lyrics.lines.find((l) => l.start <= ws[0].start + 1e-3 && l.end >= ws[0].end - 1e-3);
  const words = line ? lyrics.words.filter((w) => w.start >= line.start - 1e-3 && w.end <= line.end + 1e-3) : ws;
  const a = 1 - clamp01((t - (ws[ws.length - 1].end + 0.45)) / 0.2);
  if (a <= 0.002) return;
  let cx = x;
  for (const w of words) cx += paint(ctx, w.w, cx, y, px, { alpha: a, ground: 'dark' }) + px * 0.2;
}
// the dossier header bar, lifted clear of the hook (lib dossier() sets it touching the caps)
function header(ctx, t, t0, x, y, px, head, alpha) {
  if (t < t0 - 0.4) return;
  const k = ease.out3((t - (t0 - 0.4)) / 0.25);
  ctx.font = `800 ${Math.round(px * 0.26)}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.05}px`;
  const hw = ctx.measureText(head).width;
  ctx.fillStyle = `rgba(150, 255, 110, ${(0.9 * k * alpha).toFixed(3)})`;
  ctx.fillRect(x, y - px * 1.72, (hw + px * 0.4) * k, px * 0.34);
  ctx.fillStyle = `rgba(8, 10, 12, ${(k * alpha).toFixed(3)})`;
  ctx.fillText(head, x + px * 0.12, y - px * 1.47);
  ctx.letterSpacing = '0px';
}

// the light falls on a word: revealed top to bottom in 0.08 s, then still
function descend(ctx, w, t, x, y, px, o = {}) {
  const adv = measure(ctx, w.w, px, o);
  const u = t - w.start + 0.02;
  if (u <= 0) return adv;
  const k = ease.out3(u / 0.08);
  ctx.save();
  ctx.beginPath(); ctx.rect(x - px * 0.3, y - px * 1.3, adv + px * 0.6, px * 1.75 * k); ctx.clip();
  paint(ctx, w.w, x, y, px, o);
  ctx.restore();
  return adv;
}

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Do you think');
  const tSee = L2.words.find((w) => /^see/i.test(w.w)).start;
  return {
    textSize: [3840, 2160],
    shade: 0.7,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carryWide(ctx, t, P);   // carry(ctx, t, P) with wider spacing
      const out = outFade(t, P.to - 0.3, P.to - 0.02);
      header(ctx, t, L1.words[0].start, 250, 660, 200, 'DOSSIER 16  ·  THREAT CLASS: VIPER', out);
      arm(ctx, L1.words, t, scan, { x: 250, y: 660, px: 200, maxW: 2000, ground: 'dark', alpha: out });
      if (t >= tSee) note(ctx, 'FACES 03  ·  STATUS: FROZEN', 3590, 250, { px: 40, align: 'right', alpha: 0.85 * out * clamp01((t - tSee) / 0.15), color: '255, 120, 190' });
      // the question, low left
      let x = 250;
      const y = 1880;
      for (const w of L2.words) {
        const k = keyOf(w.w);
        if (k === 'i') { x += 10; x += descend(ctx, w, t, x, y, 180, { ground: 'dark', alpha: out }); x += 30; continue; }
        if (k.startsWith('see')) { x += 150;   // clear room: SEE revealing beside CAN'T must not read as CAN'T moving
          x += descend(ctx, w, t, x, y, 400, { ground: 'dark', alpha: out, voice: VOICES.divine }); x += 30; continue; }
        if (t >= w.start - 0.02) paint(ctx, w.w, x, y, 120, { ground: 'dark', alpha: out * clamp01((t - w.start + 0.02) / 0.06) });
        x += measure(ctx, w.w, 120);
      }
    },
  };
};

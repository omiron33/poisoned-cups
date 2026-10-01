// The words of s22-fall.
// "Turn your hearts": calm, the mercy italic, high on the left in the core's first warm light;
// each word simply rises into place. No glitch.
// "Let the proud dreams": polished campaign copy, light tracked capitals in a hairline banner with
// a campaign tag, each word loading in behind a thin progress bar. Once DREAMS has been read, the
// banner loses its structural integrity: the frame's corners come loose and the letters sag and
// lean, still legible. "fall" drops in letter by letter below it; "tire" flickers like a failing
// supply and holds.
import { linesFrom, paint, measure, arrive, buffer, cascade, volt, voiceOf, shown, note, outFade, ease, clamp01, carry, VOICES } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [LT, LP] = linesFrom('Turn your hearts', 'Let the proud dreams fall and tire');
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// a word drawn a letter at a time, each letter sagging and leaning by c (0 intact .. 1 slumped)
function sagWord(ctx, w, x, y, px, c, seed, alpha, voice) {
  const v = voice;
  const s = shown(w.w).toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const track = v.track * size;
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    const cw = ctx.measureText(s[i]).width;
    const h = hsh(seed + i * 3.1);
    ctx.save();
    ctx.translate(cx + cw / 2, y + c * px * (0.08 + 0.22 * h));
    ctx.rotate(c * (h - 0.5) * 0.22);
    ctx.fillStyle = `rgba(${v.color[0]}, ${(alpha * (1 - 0.2 * c)).toFixed(3)})`;
    ctx.fillText(s[i], -cw / 2, 0);
    ctx.restore();
    cx += cw + track;
  }
}

// each banner word loads behind a thin progress bar set well below the baseline (lib buffer()'s bar
// hugs the word and read as a stroke of it); the bar is gone the moment the word lands, and the word
// never moves
function load(ctx, w, t, x, y, px, o) {
  const adv = measure(ctx, w.w, px, o), wd = adv - px * 0.26;
  const pre = clamp01((t - (w.start - 0.4)) / 0.4);
  if (pre <= 0) return adv;
  if (t < w.start) {
    ctx.fillStyle = `rgba(226, 232, 244, ${(0.25 * o.alpha).toFixed(3)})`; ctx.fillRect(x, y + px * 0.5, wd, 3);
    ctx.fillStyle = `rgba(226, 232, 244, ${(0.8 * o.alpha).toFixed(3)})`; ctx.fillRect(x, y + px * 0.5, wd * pre, 3);
  }
  if (t >= w.start - 0.02) paint(ctx, w.w, x, y, px, { ...o, alpha: o.alpha * clamp01((t - w.start + 0.02) / 0.05) });
  return adv;
}

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.7,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P, { x: 240, y: 1990 });
    const fade = outFade(t, P.to - 0.2, P.to + 0.3);
    // TURN YOUR HEARTS
    // the mercy italic set in capitals: in lower case the italic h of "hearts" read as a b
    const MERCY = { ...VOICES.mercy, caps: true, track: 0.05 };
    const mpx = 190;   // larger (was 170): TURN and YOUR failed to read over the towers
    const dimT = 1 - 0.55 * clamp01((t - LP.words[0].start - 0.05) / 0.2);   // the previous line steps back (after HEARTS' end + 0.2 s)
    let x = 250;
    for (const w of LT.words) {
      const s = arrive(w, t, 0.1);
      if (s.a > 0.002) paint(ctx, w.w, x, 560 + (1 - s.k) * mpx * 0.15, mpx, { alpha: s.a * fade * dimT, voice: MERCY });
      x += measure(ctx, w.w, mpx, { voice: MERCY }) + mpx * 0.1;
    }
    // the campaign banner
    const words = LP.words.slice(0, 4);
    const rest = LP.words.slice(4);
    // the claim capitals one weight up (300 broke up over the busy towers)
    const claim = { ...VOICES.claim, font: (px) => `500 ${px}px "Inter Tight"` };
    const bpx = 150, by = 1230, bx = 290;   // larger (was 128): THE failed over the towers
    const dreams = words[3];
    const c = ease.in2(clamp01((t - (dreams.end + 0.2)) / 0.7));
    const gap = bpx * 0.3;
    const bw = words.reduce((a, w) => a + measure(ctx, w.w, bpx, { voice: claim }) + gap, 0) - bpx * 0.26 - gap;
    if (t > words[0].start - 0.4) {
      const k = ease.out3((t - (words[0].start - 0.4)) / 0.3);
      const x0 = bx - 50, y0 = by - bpx * 1.25, x1 = bx + bw + 50, y1 = by + bpx * 0.45;
      ctx.strokeStyle = `rgba(226, 232, 244, ${(0.75 * k * fade).toFixed(3)})`; ctx.lineWidth = 3;
      // four frame sides; once it fails each comes loose from its corner and droops
      const side = (ax, ay, bx2, by2, i) => {
        const d = c * (40 + 60 * hsh(i + 20));
        ctx.beginPath(); ctx.moveTo(ax, ay + (i % 2 ? d : 0)); ctx.lineTo(bx2, by2 + (i % 2 ? 0 : d)); ctx.stroke();
      };
      side(x0, y0, x1, y0, 0); side(x1, y0, x1, y1, 1); side(x1, y1, x0, y1, 2); side(x0, y1, x0, y0, 3);
      note(ctx, 'ROADMAP  ·  SUPERINTELLIGENCE 2030  ·  APPROVED', x0, y0 - 60, { px: 34, color: '226, 232, 244', alpha: 0.8 * k * fade * (1 - 0.5 * c) });
    }
    let wx = bx;
    words.forEach((w, i) => {
      const adv = measure(ctx, w.w, bpx, { voice: claim });
      load(ctx, w, t, wx, by, bpx, { voice: claim, alpha: fade });   // placement audit: the words stay put; only the frame fails
      wx += adv + gap;
    });
    // FALL AND TIRE
    const fpx = 250;
    let fx = 290;
    for (const w of rest) {
      const adv = measure(ctx, w.w, fpx);
      // full strength to the cut: s23 carries these three words on at this exact place and size
      if (/fall/i.test(w.w)) cascade(ctx, w, t, fx, 1800, fpx, { alpha: 1 });
      else if (/tire/i.test(w.w)) volt(ctx, w, t, fx, 1800, fpx, { alpha: 1 });
      else { const s = arrive(w, t, 0.08); if (s.a > 0.002) paint(ctx, w.w, fx, 1800, fpx, { alpha: s.a }); }
      fx += adv + fpx * 0.12;
    }
    const tFall = rest[0].start;
    const na = clamp01((t - tFall) / 0.3) * fade;
    if (na > 0.01) note(ctx, 'CONTROL 22  ·  0 OF 8 STANDING  ·  CORE WARM', 250, 170, { px: 40, alpha: 0.85 * na });
  },
});

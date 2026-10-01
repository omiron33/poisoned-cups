// The words of s06-empire (v4).
// "You twist the truth": one row top left, about 220 px. YOU and THE plain cold white, TWIST acid
// green arriving as a row of letters twisted about the baseline that untwists into place within
// 0.1 s, TRUTH in the mercy italic. It dims to 45% on "To".
// "To build your little empire": one baseline along the bottom; every word sits on its own small
// dark card chip with a silver hairline that drops onto the baseline on the onset (0.08 s, then
// still). LITTLE is half size; EMPIRE lands bigger in the claim voice.
// The hero post (secondary, but readable) rides its glass card via onSurface: typed, twisted
// ("isn't" -> "is"), published. Three nearer reposts carry readable lies. Note top right.
import { paint, measure, voiceOf, shown, note, outFade, keyOf, ease, clamp01, linesFrom, VOICES } from '/song/lib/type.js';
import { fullFrame, onSurface } from '/song/lib/x-f.js';
import { drawPost, ACCOUNTS } from '/song/lib/x-v4-post.js';
import { T, HERO, LIES, camera, heroXf, flyOff, rot } from '/song/scenes/s06-empire.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');
const COUNTERS = [['reply', '38K'], ['repost', '2.1M'], ['like', '4.8M'], ['views', '91M']];
const HERO_POST = {
  account: ACCOUNTS.safety, time: 'now', body: "The model isn't safe.",
  typeAt: T.you - 0.11, cps: 62, twist: { word: "isn't", to: 'is', at: T.tw }, publishAt: T.truth, counters: COUNTERS,
};
const LIE_POSTS = [
  { account: ACCOUNTS.prosperity, time: '1s', body: 'AI will create more jobs than it takes.', counters: [['reply', '12K'], ['repost', '640K'], ['like', '1.9M'], ['views', '38M']] },
  { account: ACCOUNTS.assistant, time: '1s', body: 'Your privacy is our priority.', counters: [['reply', '9K'], ['repost', '410K'], ['like', '1.2M'], ['views', '22M']] },
  { account: ACCOUNTS.future, time: '2s', body: 'No one will be left behind.', counters: [['reply', '21K'], ['repost', '880K'], ['like', '2.6M'], ['views', '51M']] },
];
const CW = 1000;   // canvas px across a hero-size card

// a post on a world card of half size hs (scaled s), centre c, tipped / yawed
function postOn(ctx, cam, c, s, tip, yaw, post, t, alpha) {
  const hs = HERO.hs;
  const o0 = rot([-hs[0] * s, hs[1] * s, 0.0125 * s], tip, yaw);
  const o = [c[0] + o0[0], c[1] + o0[1], c[2] + o0[2]];
  // only while the face looks toward the camera
  const n = rot([0, 0, 1], tip, yaw);
  const v = [cam.pos[0] - c[0], cam.pos[1] - c[1], cam.pos[2] - c[2]];
  if (n[0] * v[0] + n[1] * v[1] + n[2] * v[2] <= 0) return;
  onSurface(ctx, cam, o, rot([1, 0, 0], tip, yaw), rot([0, 1, 0], tip, yaw), (2 * hs[0] * s) / CW,
    () => drawPost(ctx, 0, 0, CW, post, t, { h: CW * hs[1] / hs[0], px: CW * 0.085, alpha }));
}

// TWIST: each letter turned about the baseline (a helix through the row) untwisting in 0.1 s
function twistWord(ctx, w, t, x, y, px, alpha) {
  const v = voiceOf(w.w);
  const s = shown(w.w).toUpperCase();
  const size = Math.round(px * v.scale);
  ctx.font = v.font(size); ctx.letterSpacing = '0px';
  const track = (v.track ?? 0) * size;
  let cx = x;
  [...s].forEach((ch, j) => {
    const cw = ctx.measureText(ch).width;
    const k = ease.out3((t - w.start + 0.02 - j * 0.012) / 0.07);
    if (k > 0) {
      const ang = (1 - k) * (Math.PI * 0.9 + j * 0.5);
      ctx.save(); ctx.translate(cx + cw / 2, y - size * 0.36);
      ctx.scale(1, Math.max(0.05, Math.abs(Math.cos(ang))));
      ctx.fillStyle = `rgba(${v.color[0]}, ${(clamp01(k * 1.6) * alpha).toFixed(3)})`;
      ctx.fillText(ch, -cw / 2, size * 0.36);
      ctx.restore();
    }
    cx += cw + track;
  });
  return cx - x - track + px * 0.26;
}

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0,
  textPlane(t, cam) { return fullFrame(cam); },
  drawText(ctx, t) {
    const cam = camera(t);
    const end = outFade(t, P.to - 0.12, P.to);

    // the posts (secondary): the three lies, then the hero on top
    const fly = flyOff(t);
    LIES.forEach((L, i) => {
      const uu = t - (T.truthEnd + L.at);
      if (uu <= 0 || fly[1] > 3) return;
      const sc = L.s * Math.max(0.05, 1 - Math.exp(-uu * 9) * Math.cos(uu * 14));
      const tip = ease.inOut3((t - T.b0 - 0.03 * i) / 0.22) * Math.PI / 2 * (t > T.b0 ? 1 : 0);
      postOn(ctx, cam, [L.c[0] + fly[0], L.c[1] + fly[1], L.c[2] + fly[2]], sc, tip, 0, LIE_POSTS[i], t, clamp01(uu / 0.08) * outFade(t, T.b0 - 0.02, T.b0 + 0.1));
    });
    const h = heroXf(t);
    if (h.s > 0 && h.c[1] < 3.2) postOn(ctx, cam, h.c, h.s, h.tip, h.yaw, HERO_POST, t, end * (t < T.little ? outFade(t, T.b0 + 0.02, T.b0 + 0.16) : clamp01((t - T.emp + 0.3) / 0.15)));

    // line 1, top left
    const dim = 1 - 0.55 * ease.inOut3((t - L2.words[0].start) / 0.15);
    const a1 = dim * end;
    const px1 = 220;
    let x = 250; const y1 = 430;
    L1.words.forEach((w) => {
      if (t < w.start - 0.02) { x += measure(ctx, w.w, px1); return; }
      if (/twist/i.test(w.w)) { x += twistWord(ctx, w, t, x, y1, px1, a1); return; }
      const k = ease.out3((t - w.start + 0.02) / 0.08);
      x += paint(ctx, w.w, x, y1, px1, { alpha: clamp01(k * 1.3) * a1 });
    });

    // line 2: chips on one bottom baseline
    const base = 1930;
    const pxOf = (w) => { const k = keyOf(w.w); return k === 'little' ? 92 : k.startsWith('empire') ? 210 : 172; };
    let x2 = 260;
    L2.words.forEach((w) => {
      const px = pxOf(w);
      const isEmp = keyOf(w.w).startsWith('empire');
      const o = isEmp ? { voice: VOICES.claim } : {};
      const ww = measure(ctx, w.w, px, o) - px * 0.26;
      const v = o.voice ?? voiceOf(w.w);
      const capH = Math.round(px * v.scale) * 0.74;
      const padX = px * 0.32, padY = px * 0.26;
      const cw = ww + padX * 2, ch = capH + padY * 2;
      const x0 = x2;
      x2 += cw + Math.max(40, px * 0.3);
      if (t < w.start - 0.02) return;
      const k = ease.out3((t - w.start + 0.02) / 0.08);
      const a = clamp01(k * 1.6) * end;
      const dy = (1 - k) * -px * 0.5;
      const top = base - capH - padY + dy;
      ctx.fillStyle = `rgba(11, 12, 16, ${(0.88 * a).toFixed(3)})`;
      ctx.fillRect(x0, top, cw, ch);
      ctx.strokeStyle = `rgba(200, 206, 222, ${(0.75 * a).toFixed(3)})`; ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 1.5, top + 1.5, cw - 3, ch - 3);
      paint(ctx, w.w, x0 + padX, base + dy, px, { ...o, alpha: a });
    });

    // the note, top right
    const na = clamp01((t - (T.truthEnd + 0.01)) / 0.2) * outFade(t, T.little - 0.05, T.little + 0.15);
    if (na > 0.01) note(ctx, 'AMPLIFIED  ·  40,000 AGENT ACCOUNTS', 3600, 300, { px: 40, align: 'right', alpha: 0.8 * na });
  },
});

// The words of s17-we-see (v4). Outside: "You say" small at the top left; WE SEE huge and polished in
// the claim voice on a thin launch rule with a small silver approval mark, set over the dark sky left
// of the eye (never over the white housing). Tracking boxes (thin cold corner brackets with tiny mono
// IDs) close on the nearest dozen heads and all lock on "see"; the note VISION MODEL 9 · ACCURACY
// 99.97% · ALL TRACKED sits top right. On the dive the slogan, boxes and note are gone. Inside: "SO
// YOUR" small low in the frame; DARKNESS and STAYS land large in the black and burn cold, never
// moving; BLACK BOX · INTERPRETABILITY 0.0% sits beside the cube from 104.6. Last 12 frames black.
import { paint, measure, outFade, keyOf, clamp01, ease, note, project, VOICES } from '/song/lib/type.js';
import { fullFrame } from '/song/lib/x-f.js';
import { rig, PEOPLE, CUBE } from '/song/scenes/s17-we-see.js';

const rise = (ctx, w, t, x, y, px, o) => {
  const k = clamp01((t - w.start + 0.02) / 0.08);
  if (k <= 0) return measure(ctx, w.w, px, o);
  return paint(ctx, w.w, x, y + (1 - k) * (1 - k) * px * 0.1, px, { ...o, alpha: (0.3 + 0.7 * k) * (o.alpha ?? 1) });
};
const COLD = { color: ['232, 240, 255', '16, 16, 22'], font: (px) => `400 ${px}px "Anton"`, track: 0.03, scale: 1, caps: true, glow: '150, 190, 255' };

export default (P) => {
  const R = rig(P);
  const { L1, L2 } = R;
  const you = L1.words.filter((w) => !/^we|^see/.test(keyOf(w.w)));
  const slogan = L1.words.filter((w) => /^we|^see/.test(keyOf(w.w)));
  const soYour = L2.words.slice(0, 2), dark = L2.words[2], stays = L2.words[3];
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      if (t >= R.tBlack) return;
      const cam = R.camera(t);
      // ---- outside: gone on the dive ----
      const out = outFade(t, R.tSo - 0.03, R.tSo + 0.05);
      if (out > 0.002) {
        let x = 240;
        for (const w of you) x += rise(ctx, w, t, x, 330, 112, { ground: 'dark', alpha: out });
        const claim = { voice: VOICES.claim, ground: 'dark', alpha: out };
        let sx = 230;
        for (const w of slogan) sx += rise(ctx, w, t, sx, 760, 380, claim);
        if (t >= slogan[0].start - 0.02) {
          const k = ease.out3((t - slogan[0].start + 0.02) / 0.3);
          ctx.fillStyle = `rgba(226, 232, 244, ${(0.75 * out).toFixed(3)})`;
          ctx.fillRect(240, 840, 1560 * k, 4);
          // the approval mark: a small silver hexagon with a chevron, at the end of the rule
          const s = clamp01((t - slogan[slogan.length - 1].start) / 0.1);
          if (s > 0) {
            const cx = 1860, cy = 842, r = 34;
            ctx.strokeStyle = `rgba(214, 222, 236, ${(0.9 * s * out).toFixed(3)})`; ctx.lineWidth = 5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); }
            ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 14, cy + 1); ctx.lineTo(cx - 3, cy + 12); ctx.lineTo(cx + 16, cy - 11); ctx.stroke();
          }
        }
        // tracking boxes on the nearest heads: search from "we", lock on "see"
        const t0 = R.tWe - 0.1;
        if (t >= t0) {
          const lock = ease.out3((t - R.tSee + 0.02) / 0.1);
          const a = clamp01((t - t0) / 0.15) * out;
          // the dozen nearest heads that sit inside the safe frame (picked on the locked camera at "see")
          const lc = R.camera(R.tSee + 0.3);
          const pick = PEOPLE.filter((p) => { const q = project(lc, [p.x, 1.62 * p.sc + 0.06, p.z]); return q.z > 0.1 && q.x > 320 && q.x < 3520 && q.y > 300 && q.y < 1840; })
            .sort((a, b) => b.z - a.z).reduce((acc, p) => {
              const q = project(lc, [p.x, 1.62 * p.sc + 0.06, p.z]);
              if (acc.length < 10 && acc.every((o) => Math.hypot(o.q.x - q.x, o.q.y - q.y) > 300)) acc.push({ ...p, q });
              return acc;
            }, []);
          pick.forEach((p, j) => {
            const hp = project(cam, [p.x, 1.62 * p.sc + 0.06, p.z]);
            if (hp.z <= 0.1) return;
            if (hp.x < 320 || hp.x > 3520 || hp.y > 1880 || hp.y < 300) return;   // keep boxes and IDs inside the safe frame
            const sz = 1.0 / hp.z * 1150;
            const jx = (1 - lock) * Math.sin(t * 9 + j * 2.1) * sz * 0.5, jy = (1 - lock) * Math.cos(t * 7 + j) * sz * 0.4;
            const w = sz * (1 + 0.8 * (1 - lock)), h = w * 1.15;
            const x0 = hp.x - w / 2 + jx, y0 = hp.y - h / 2 + jy, L = w * 0.24;
            const c = lock > 0.5 ? '235, 242, 255' : '170, 190, 220';
            ctx.strokeStyle = `rgba(${c}, ${(a * (0.55 + 0.4 * lock)).toFixed(3)})`; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
            ctx.moveTo(x0 + w - L, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + L);
            ctx.moveTo(x0 + w, y0 + h - L); ctx.lineTo(x0 + w, y0 + h); ctx.lineTo(x0 + w - L, y0 + h);
            ctx.moveTo(x0 + L, y0 + h); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0, y0 + h - L);
            ctx.stroke();
            if (lock > 0.01) {
              ctx.font = '500 32px "JetBrains Mono"'; ctx.letterSpacing = '3px';
              ctx.fillStyle = `rgba(${c}, ${(0.8 * a * lock).toFixed(3)})`;
              ctx.fillText('ID ' + String(400 + ((p.seed * 37) % 600)).padStart(4, '0'), x0, y0 - 12);
              ctx.letterSpacing = '0px';
            }
          });
          if (t >= R.tSee - 0.02) note(ctx, 'VISION MODEL 9  ·  ACCURACY 99.97%  ·  ALL TRACKED', 3600, 250, { px: 40, align: 'right', alpha: 0.8 * clamp01((t - R.tSee + 0.02) / 0.12) * out });
        }
      }
      // ---- inside ----
      const end = outFade(t, R.tBlack - 0.1, R.tBlack - 0.01);
      if (t >= soYour[0].start - 0.02) {
        const o = { ground: 'dark', alpha: end };
        const px = 170, gap = px * 0.2;   // SO was too small to read (was 112)
        const tw = soYour.reduce((s, w) => s + measure(ctx, w.w, px, o) + gap, 0) - gap - px * 0.26;
        let x = 1920 - tw / 2;
        for (const w of soYour) x += rise(ctx, w, t, x, 1330, px, o) + gap;
      }
      const cold = { voice: COLD, ground: 'dark', alpha: end };
      const dw = measure(ctx, dark.w, 340, cold) - 340 * 0.26;
      rise(ctx, dark, t, 1920 - dw / 2, 1700, 340, cold);
      const sw = measure(ctx, stays.w, 220, cold) - 220 * 0.26;
      rise(ctx, stays, t, 1920 - sw / 2, 1955, 220, cold);
      // the label beside the box
      const tb = R.tStays + 0.11;
      if (t >= tb) {
        const cp = project(cam, [CUBE.c[0] + CUBE.s * 1.6, CUBE.c[1], CUBE.c[2]]);
        note(ctx, 'BLACK BOX  ·  INTERPRETABILITY 0.0%', Math.min(3500, cp.x + 60), cp.y + 14, { px: 38, alpha: 0.78 * clamp01((t - tb) / 0.15) * end });
      }
    },
  };
};

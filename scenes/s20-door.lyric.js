// The words of s20-door (v2). "You stand in the door" is threshold text: it runs vertically up the
// left jamb of the doorway, word by word from the floor up, beside a hairline rule. On "Won't" the
// system hard-freezes: WON'T WALK IN snaps into the lit doorway in dark ink inside a freeze-frame box
// with a FROZEN timecode tag, and holds dead still. On the low cut "Or let the poor" sits on the dark
// wall left of the door; on "poor" a hazard-striped barrier arm swings down and stops just above the
// line, and denial prompts stack up on the right wall, one per beat.
import { paint, measure, strike, volt, cascade, note, outFade, clamp01, ease, spring, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lines20 } from './s20-door.js';

export default (P) => {
  const [L1, L2, L3] = lines20(P);
  const tWont = L2.words[0].start, tOr = L3.words[0].start;
  const wPoor = L3.words[L3.words.length - 1];
  return {
    textSize: [3840, 2160], shade: 0.1,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { x: 240, y: 1960 });
      const end = outFade(t, P.to - 0.15, P.to);
      const shotA = outFade(t, tOr - 0.15, tOr);
      // 1 · up the left jamb: one word per row, stacked from the floor up, set flush right against
      //     a hairline rule on the jamb (each word stays horizontal so it reads cleanly)
      if (shotA > 0.002) {
        const px = 130, lead = px * 1.32, xr = 1190;
        L1.words.forEach((w, i) => {
          const wd = measure(ctx, w.w, px) - px * 0.26;
          cascade(ctx, w, t, xr - wd, 1720 - i * lead, px, { alpha: shotA });
        });
        const k = ease.out3((t - L1.words[0].start + 0.1) / 0.6);
        const top = 1720 - (L1.words.length - 1) * lead - px;
        ctx.fillStyle = `rgba(238, 242, 250, ${(0.6 * shotA).toFixed(3)})`; ctx.fillRect(xr + 50, 1740 - (1740 - top) * k, 3, (1740 - top) * k);
        if (t > L1.words[0].start) note(ctx, 'OCCUPANT 1', xr, 1830, { px: 32, alpha: 0.8 * shotA, align: 'right' });
      }
      // 2 · frozen in the doorway, dark ink on its light
      if (t >= tWont - 0.02 && shotA > 0.002) {
        const cx = 1920;
        const w1 = L2.words[0], rest = L2.words.slice(1);
        const px1 = 230, px2 = 190;
        const a1 = measure(ctx, w1.w, px1) - px1 * 0.26;
        volt(ctx, w1, t, cx - a1 / 2, 900, px1, { ground: 'light', alpha: shotA });
        const a2 = rest.reduce((s, w) => s + measure(ctx, w.w, px2), 0) - px2 * 0.26;
        let x = cx - a2 / 2;
        for (const w of rest) { volt(ctx, w, t, x, 1190, px2, { ground: 'light', alpha: shotA }); x += measure(ctx, w.w, px2) + px2 * 0.12; }
        const k = clamp01((t - tWont) / 0.06);
        ctx.strokeStyle = `rgba(16, 16, 22, ${(0.9 * k * shotA).toFixed(3)})`; ctx.lineWidth = 5;
        ctx.strokeRect(cx - 400, 610, 800, 680);
        note(ctx, 'FROZEN  ' + (t - tWont).toFixed(2).padStart(5, '0'), cx - 380, 1360, { px: 32, ground: 'light', alpha: k * shotA, color: '16, 16, 22' });
      }
      // 3 · the low cut: on the dark wall left of the door, a barrier arm comes down over it
      if (t >= tOr - 0.02) {
        const px = 170, y = 820;
        let x = 240;
        for (const w of L3.words) { strike(ctx, w, t, x, y, px, { alpha: end, flash: false, shake: 0.4 }); x += measure(ctx, w.w, px) + px * 0.2; }
        const lineW = x - px * 0.36 - 240;
        if (t >= wPoor.start - 0.08) {
          const k = spring(t, wPoor.start - 0.08, 0.22, 0.2);
          ctx.save();
          ctx.translate(240 + lineW + 60, y - px * 1.45);
          ctx.rotate(Math.PI / 2 * (1 - Math.min(1, k)));   // swings down from upright, never through the words
          // hazard stripes: magenta and black
          const L = lineW + 120, h = 34;
          ctx.fillStyle = `rgba(255, 92, 170, ${end.toFixed(3)})`; ctx.fillRect(-L, -h / 2, L, h);
          ctx.fillStyle = `rgba(10, 8, 12, ${end.toFixed(3)})`;
          for (let s = -L; s < 0; s += 60) { ctx.beginPath(); ctx.moveTo(s, -h / 2); ctx.lineTo(s + 28, -h / 2); ctx.lineTo(s + 8, h / 2); ctx.lineTo(s - 20, h / 2); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        }
        const prompts = ['TIER: NONE', 'ID: EXPIRED', 'BATTERY 3%', 'ACCESS DENIED'];
        const beats = [tOr, tOr + 0.39, tOr + 0.74, tOr + 1.07];
        prompts.forEach((s, i) => {
          if (t < beats[i]) return;
          const kk = ease.out5((t - beats[i]) / 0.1);
          const yy = 560 + i * 110;
          ctx.fillStyle = `rgba(255, 92, 170, ${(0.95 * kk * end).toFixed(3)})`; ctx.fillRect(2700, yy - 34, 10, 40);
          note(ctx, '× ' + s, 2740, yy, { px: 40, alpha: kk * end, color: '255, 150, 200' });
        });
      }
    },
  };
};

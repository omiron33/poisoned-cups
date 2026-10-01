// The words of s20-door (v4). "You stand in the door" is threshold text: one word per row down the
// dark wall left of the door, flush right against a hairline rule (YOU is sung 0.09 s before the cut,
// so it is drawn fully formed on the first frame). On "Won't" the system hard-freezes: WON'T WALK IN
// snaps into a freeze-frame box on the dark wall right of the door (the doorway is the man's), with a
// FROZEN timecode, and holds dead still. On the low 3/4 cut "Or let the poor" sits high on the dark
// above the people; on "poor" a hazard-striped barrier arm swings down above the line. The four
// people get thin tracking brackets with their denial scores, one per beat, and the eligibility
// model's prompts stack in the top right.
import { measure, strike, volt, cascade, note, outFade, clamp01, ease, spring, project } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lines20, camera20, PEOPLE } from './s20-door.js';

export default (P) => {
  const [L1, L2, L3] = lines20(P);
  const tWont = L2.words[0].start, tOr = L3.words[0].start;
  const wPoor = L3.words[L3.words.length - 1];
  const cam = camera20(P);
  return {
    textSize: [3840, 2160], shade: 0.1,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      const end = outFade(t, P.to - 0.15, P.to);
      const shotA = outFade(t, tOr - 0.15, tOr);
      // the jamb stack leaves once WON'T has frozen (so there is only one IN on screen)
      const jamb = shotA * outFade(t, tWont + 0.25, tWont + 0.45) * (1 - 0.55 * clamp01((t - tWont + 0.02) / 0.12));
      const door = outFade(t, tOr - 0.04, tOr);
      // 1 · down the dark wall left of the door, flush right against a hairline rule
      if (jamb > 0.002) {
        const px = 190, lead = px * 1.3, xr = 1150;   // IN large enough to read (was 165)
        L1.words.forEach((w, i) => {
          const wd = measure(ctx, w.w, px) - px * 0.26;
          cascade(ctx, w, t, xr - wd, 1430 - (L1.words.length - 1 - i) * lead, px, { alpha: jamb });
        });
        const top = 1430 - (L1.words.length - 1) * lead - px;
        ctx.fillStyle = `rgba(238, 242, 250, ${(0.6 * jamb).toFixed(3)})`; ctx.fillRect(xr + 50, top, 3, 1450 - top);
        note(ctx, "OCCUPANT 1", xr, 1530, { px: 32, alpha: 0.8 * jamb, align: 'right' });
      }
      // 2 · frozen on the dark wall right of the door
      if (t >= tWont - 0.02 && door > 0.002) {
        const x0 = 2640;
        const w1 = L2.words[0], rest = L2.words.slice(1);
        const px1 = 230, px2 = 190;
        volt(ctx, w1, t, x0, 900, px1, { alpha: door });
        let x = x0;
        for (const w of rest) { volt(ctx, w, t, x, 1190, px2, { alpha: door }); x += measure(ctx, w.w, px2) + px2 * 0.12; }
        const k = clamp01((t - tWont) / 0.06);
        ctx.strokeStyle = `rgba(238, 242, 250, ${(0.85 * k * door).toFixed(3)})`; ctx.lineWidth = 5;
        ctx.strokeRect(x0 - 110, 610, 860, 680);
        note(ctx, 'FROZEN  ' + (t - tWont).toFixed(2).padStart(5, '0'), x0 - 90, 1370, { px: 34, alpha: 0.85 * k * door });
      }
      // 3 · the low cut: high on the dark above the people; the barrier arm comes down above it
      if (t >= tOr - 0.02) {
        const px = 170, y = 470, x0 = 260;
        let x = x0;
        for (const w of L3.words) { strike(ctx, w, t, x, y, px, { alpha: end, flash: false, shake: 0.4 }); x += measure(ctx, w.w, px) + px * 0.2; }
        const lineW = x - px * 0.36 - x0;
        if (t >= wPoor.start - 0.08) {
          const k = spring(t, wPoor.start - 0.08, 0.22, 0.2);
          ctx.save();
          ctx.translate(x0 + lineW + 60, y - px * 1.45);
          ctx.rotate(Math.PI / 2 * (1 - Math.min(1, k)));   // swings down from upright, never through the words
          const L = lineW + 120, h = 34;
          ctx.fillStyle = `rgba(255, 92, 170, ${end.toFixed(3)})`; ctx.fillRect(-L, -h / 2, L, h);
          ctx.fillStyle = `rgba(10, 8, 12, ${end.toFixed(3)})`;
          for (let s = -L; s < 0; s += 60) { ctx.beginPath(); ctx.moveTo(s, -h / 2); ctx.lineTo(s + 28, -h / 2); ctx.lineTo(s + 8, h / 2); ctx.lineTo(s - 20, h / 2); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        }
        // tracking brackets on the four, one per word of the line, each with its denial score
        const c = cam(t);
        const onsets = L3.words.map((w) => w.start);
        PEOPLE.forEach((pp, i) => {
          const t0 = onsets[Math.min(i, onsets.length - 1)];
          if (t < t0) return;
          const kk = ease.out5((t - t0) / 0.1);
          const a = project(c, [pp.x, 1.92, pp.z]), b = project(c, [pp.x, 0.0, pp.z]);
          const hh = b.y - a.y, ww = hh * 0.42, cx = (a.x + b.x) / 2;
          const x1 = cx - ww / 2, y1 = a.y, L = ww * 0.22;
          const col = '255, 120, 180';
          ctx.strokeStyle = `rgba(${col}, ${(0.8 * kk * end).toFixed(3)})`; ctx.lineWidth = 4;
          const s = 1 + (1 - kk) * 0.15;
          ctx.save(); ctx.translate(cx, y1 + hh / 2); ctx.scale(s, s); ctx.translate(-cx, -(y1 + hh / 2));
          ctx.beginPath();
          for (const [px0, py0, dx, dy] of [[x1, y1, 1, 1], [x1 + ww, y1, -1, 1], [x1, y1 + hh, 1, -1], [x1 + ww, y1 + hh, -1, -1]]) {
            ctx.moveTo(px0 + dx * L, py0); ctx.lineTo(px0, py0); ctx.lineTo(px0, py0 + dy * L);
          }
          ctx.stroke(); ctx.restore();
          note(ctx, pp.label, x1, y1 + hh + 52, { px: 32, alpha: 0.85 * kk * end, color: col });
        });
        const prompts = ['ELIGIBILITY MODEL: DENIED', 'APPEAL: AUTOMATED'];
        const beats = [tOr + 0.2, wPoor.start + 0.05];
        prompts.forEach((s, i) => {
          if (t < beats[i]) return;
          const kk = ease.out5((t - beats[i]) / 0.1);
          const yy = 300 + i * 125;   // clear line spacing between the two prompts
          ctx.fillStyle = `rgba(255, 92, 170, ${(0.95 * kk * end).toFixed(3)})`; ctx.fillRect(2560, yy - 32, 8, 38);
          note(ctx, '× ' + s, 2590, yy, { px: 38, alpha: 0.85 * kk * end, color: '255, 150, 200' });
        });
      }
    },
  };
};

// The words of s07-prophets (v2). "You honor prophets" is the wall's official tribute copy: set
// high and centred above the screens in light tracked capitals between two hairline UI laurels,
// under a small mono "IN MEMORIAM" line, each word fading up clean on its onset. When the feed
// corrupts, "That your fathers" is typed into a system log at the left in mono, and "TRIED TO
// KILL" interrupts as a harsh system override: a magenta header bar snaps across and the words
// hit huge in hot magenta, TRIED and TO voltage-flickering, KILL glitch-cut on the hit.
import { linesFrom, term, volt, glitch, arm, paint, measure, note, outFade, clamp01, ease, VOICES, project } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { prophetTimes, prophetsCamera, bustX, PLH } from '/song/scenes/s07-prophets.js';

const [L1, L2] = linesFrom('You honor prophets', 'That your fathers tried to kill');

// a UI laurel: leaf dashes along an arc, opening toward the text
function laurel(ctx, cx, cy, r, side, a) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(side, 1);
  ctx.strokeStyle = `rgba(214, 222, 240, ${(0.85 * a).toFixed(3)})`; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.62, Math.PI * 1.38); ctx.stroke();
  for (let k = 0; k < 7; k++) {
    const an = Math.PI * (0.66 + k * 0.1);
    const x = Math.cos(an) * r, y = Math.sin(an) * r;
    ctx.save(); ctx.translate(x, y); ctx.rotate(an + (k % 2 ? 0.9 : -0.9) + Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.09, r * 0.035, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export default (P) => {
  const { tB } = prophetTimes();
  const cam = prophetsCamera(P.from, P.to);
  // plinth plates under the two nearest busts (secondary, mono): the tribute, then the record
  const PLATES = [[3, 'RESEARCHER 03  ·  WARNED', 'TERMINATED'], [4, 'ENGINEER 05  ·  WARNED', 'SILENCED  ·  NDA']];
  return {
    textSize: [3840, 2160],
    shade: 0.9,
    textPlane(t, c) { return cameraPlane(c, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // ---- tribute copy
      const last = L1.words[L1.words.length - 1];
      const f1 = clamp01((t - (L1.words[0].start - 0.3)) / 0.3) * outFade(t, Math.max(tB, last.end + 0.2), Math.max(tB, last.end + 0.2) + 0.25);
      if (f1 > 0.002) {
        const px = 150, v = VOICES.claim, y = 400;
        const adv = L1.words.map((w) => measure(ctx, w.w, px, { voice: v }));
        const total = adv.reduce((a, b) => a + b, 0) - px * 0.26 + px * 0.3;
        let x = 1920 - total / 2;
        note(ctx, 'IN  MEMORIAM', 1920, y - px - 70, { px: 40, align: 'center', color: '214, 222, 240', alpha: 0.8 * f1 });
        laurel(ctx, x - 150, y - px * 0.4, 150, 1, f1);
        laurel(ctx, x + total + 150, y - px * 0.4, 150, -1, f1);
        L1.words.forEach((w, i) => {
          const a = clamp01((t - w.start + 0.02) / 0.08) * f1;
          if (a > 0.002) paint(ctx, w.w, x, y, px, { voice: v, alpha: a, ground: 'dark' });
          x += adv[i] + px * 0.15;
        });
      }
      // ---- plinth plates: pinned to the plinth faces; they flip on "That"; gone before the override header
      {
        const [, , , tried] = L2.words;
        const pa = clamp01((t - (P.from + 0.3)) / 0.3) * outFade(t, tried.start - 0.45, tried.start - 0.25);
        if (pa > 0.002) {
          const c = cam(t);
          for (const [i, a, b] of PLATES) {
            const q = project(c, [bustX(i), PLH - 0.16, 0.205]);
            const flip = t >= tB;
            note(ctx, flip ? b : a, q.x, q.y, { px: 34, align: 'center', color: flip ? '255, 150, 190' : '214, 222, 240', alpha: 0.82 * pa });
          }
        }
      }
      // ---- the override
      const f2 = outFade(t, P.to - 0.25, P.to);
      const [that, your, fathers, tried, to, kill] = L2.words;
      if (t >= that.start - 0.02) {
        const ex = ease.out3((t - that.start) / 0.2);
        let x = 260;
        for (const w of [that, your, fathers]) x += term(ctx, w, t, x, 1320, 175, { voice: VOICES.cite, ground: 'dark', alpha: f2, echo: false }) + 20;   // large enough that THAT reads
      }
      if (t >= tried.start - 0.4) {
        // the override header: a slim bar centred in the gap between the two rows (lib dossier()
        // set a tall bar that touched both), then the words laid out exactly as dossier() does
        {
          const k = ease.out3((t - (tried.start - 0.4)) / 0.25), hp = 40, head = 'SYSTEM OVERRIDE  ·  HISTORY REWRITE';
          ctx.font = `800 ${hp}px "JetBrains Mono"`; ctx.letterSpacing = `${hp * 0.2}px`;
          const hw = ctx.measureText(head).width;
          ctx.fillStyle = `rgba(150, 255, 110, ${(0.9 * k * f2).toFixed(3)})`;
          ctx.fillRect(260, 1392, (hw + hp * 0.8) * k, hp * 1.4);
          ctx.fillStyle = `rgba(8, 10, 12, ${(k * f2).toFixed(3)})`;
          if (k > 0.98) ctx.fillText(head, 260 + hp * 0.4, 1392 + hp * 1.07);
          ctx.letterSpacing = '0px';
        }
        arm(ctx, [tried, to, kill], t, (w, i) => (i === 2 ? glitch : volt), {
          x: 260, y: 1820, px: 330, maxW: 3300, ground: 'dark', alpha: f2,
          voice: VOICES.violent, ink: '255, 158, 212',   // a lighter magenta: the red bars sit behind it
        });
      }
      // (no corner caption here: it sat on the red bars and crowded the override)
    },
  };
};

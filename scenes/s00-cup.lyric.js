// The title of s00-cup (v2). POISONED assembles out of broken scanlines: slices of the word arrive
// out of order as unstable signal fragments, jittering sideways, and lock into register one after
// another across two beats. CUPS follows as a polished tracked logotype, scanned in clean. Then
// MATTHEW 23 is filed underneath as a system classification tag (a green header bar with the class
// and a hairline of mono metadata). Everything then holds, still, to the cut.
import { paint, measure, scan, note, outFade, VOICES, nextBeat, clamp01, ease, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// slices of a word arriving as signal fragments between t0 and t0 + span, then locked
function assemble(ctx, word, t, t0, span, x, y, px, o) {
  const n = 16, top = y - px * 1.02, h = px * 1.3;
  const adv = measure(ctx, word, px, o);
  for (let i = 0; i < n; i++) {
    const at = t0 + span * hsh(i * 3.7 + 1);          // when this slice locks
    const pre = at - 0.35;                              // it flickers in as a fragment before that
    if (t < pre) continue;
    const f = Math.floor(t * 30);
    let dx = 0, a = 1;
    if (t < at) {
      const live = hsh(f * 7 + i) > 0.45;
      if (!live) continue;
      dx = (hsh(f * 13 + i * 5) - 0.5) * px * 1.6;
      a = 0.55;
    } else {
      const k = ease.out3((t - at) / 0.06);
      dx = (1 - k) * px * 0.3 * (i % 2 ? 1 : -1);
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x - px * 2, top + (h * i) / n, adv + px * 4, h / n + 0.8); ctx.clip();
    paint(ctx, word, x + dx, y, px, { ...o, alpha: (o.alpha ?? 1) * a });
    if (t < at + 0.05) paint(ctx, word, x + dx - px * 0.05, y, px, { ...o, ink: '150, 255, 110', alpha: 0.35 * (o.alpha ?? 1) });
    ctx.restore();
  }
  return adv;
}

export default (P) => {
  const tP = nextBeat(P.from + 1.2), tC = nextBeat(tP + 1.1), tM = nextBeat(tC + 1.0);
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const a = outFade(t, P.to - 0.4, P.to - 0.04);
      const x = 250;
      assemble(ctx, 'POISONED', t, tP - 0.25, 0.55, x, 760, 280, { ground: 'dark', alpha: a });
      scan(ctx, { w: 'CUPS', start: tC }, t, x + 8, 1060, 250, { ground: 'dark', alpha: a, voice: VOICES.claim });
      // the classification tag
      if (t >= tM - 0.25) {
        const k = ease.out3((t - (tM - 0.25)) / 0.3);
        const y = 1300, px = 64;
        ctx.font = `800 ${px}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.1}px`;
        const label = 'CLASS  MATTHEW 23';
        const w = ctx.measureText(label).width;
        ctx.fillStyle = `rgba(150, 255, 110, ${(0.95 * a).toFixed(3)})`;
        ctx.fillRect(x + 8, y - px * 1.02, (w + px * 0.8) * k, px * 1.4);
        if (k > 0.98) { ctx.fillStyle = `rgba(8, 10, 12, ${a.toFixed(3)})`; ctx.fillText(label, x + 8 + px * 0.4, y); }
        ctx.letterSpacing = '0px';
      }
      if (t >= tM + 0.5) {
        const k = clamp01((t - tM - 0.5) / 0.25);
        note(ctx, 'OBJ 00  ·  CHALICE  ·  TI / AU', x + 8, 1460, { px: 40, ground: 'dark', alpha: 0.85 * a * k, color: '200, 214, 226' });
      }
    },
  };
};

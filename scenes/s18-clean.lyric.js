// The words of s18-clean (v2). "YOU SAY" is a small mono system prompt at the top left; "we're
// clean" arrives as corporate assurance: thin tracked capitals with a green verified tick badge
// that pops beside them. When the water turns, that assurance clears and "But your hands still
// raise" is set as a row of interface buttons along the bottom, one word per button, each with its
// action caption above it (APPROVE, CONFIRM, AUTHORISE, EXECUTE, RAISE ↑) popping in on the word's
// onset: the gesture is authorisation, over and over. Small command-prompt echoes run beneath.
import { paint, measure, scan, note, outFade, VOICES, clamp01, ease, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';
import { lines18 } from './s18-clean.js';

const INK = '16, 18, 24';
const GREEN = '20, 110, 40';
const CAPS = ['APPROVE', 'CONFIRM', 'AUTHORISE', 'EXECUTE', 'SIGN  ↑'];

// a button chip holding one word, popped in over 0.08 s on the onset, then still
function chip(ctx, w, t, x, y, px, cap, alpha) {
  const adv = measure(ctx, w.w, px, { ground: 'light' }) - px * 0.26;
  const padX = px * 0.42, h = px * 1.45;
  const cw = Math.max(adv + padX * 2, px * 2.2);
  const u = t - w.start + 0.02;
  if (u > 0) {
    const k = ease.out3(u / 0.08), sc = 0.9 + 0.1 * k;
    ctx.save(); ctx.translate(x + cw / 2, y - px * 0.36); ctx.scale(sc, sc); ctx.translate(-(x + cw / 2), -(y - px * 0.36));
    const a = alpha * clamp01(k * 1.5);
    ctx.fillStyle = `rgba(250, 252, 252, ${(0.92 * a).toFixed(3)})`;
    ctx.beginPath(); ctx.roundRect(x, y - px * 1.08, cw, h, px * 0.3); ctx.fill();
    ctx.strokeStyle = `rgba(${INK}, ${(0.9 * a).toFixed(3)})`; ctx.lineWidth = 5; ctx.stroke();
    paint(ctx, w.w, x + (cw - adv) / 2, y, px, { ground: 'light', alpha: a });
    // caption and a tick above the button
    ctx.font = `800 ${Math.round(px * 0.26)}px "JetBrains Mono"`; ctx.letterSpacing = `${px * 0.03}px`;
    ctx.fillStyle = `rgba(${GREEN}, ${a.toFixed(3)})`;
    ctx.fillText('✓ ' + cap, x + px * 0.1, y - px * 1.3);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
  return cw;
}

export default (P) => {
  const [L1, L2] = lines18(P);
  const lead = L1.words.filter((w) => /^(you|say)$/i.test(w.w.replace(/[^a-z]/gi, '')));
  const claim = L1.words.filter((w) => !lead.includes(w));
  return {
    textSize: [3840, 2160],
    shade: 0.3,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      carry(ctx, t, P, { ground: 'light' });
      const a1 = outFade(t, L2.words[0].start - 0.1, L2.words[0].start + 0.2);
      // YOU SAY: a prompt, typed in
      let x = 260;
      if (t >= lead[0].start - 0.02) note(ctx, '>', x, 372, { px: 80, ground: 'light', alpha: 0.9 * a1, color: GREEN });
      x += 110;
      // heavy mono so the prompt words hold full contrast on the pale room
      ctx.font = '800 96px "JetBrains Mono"'; ctx.letterSpacing = '8px';
      for (const w of lead) {
        const s = w.w.toUpperCase();
        if (t >= w.start - 0.02) { ctx.fillStyle = `rgba(${INK}, ${a1.toFixed(3)})`; ctx.fillText(s, x, 372); }
        x += ctx.measureText(s).width + 70;
      }
      ctx.letterSpacing = '0px';
      // we're clean: corporate assurance, scanned in clean, then the verified badge
      let cx = 250;
      for (const w of claim) cx += scan(ctx, w, t, cx, 680, 250, { voice: { ...VOICES.claim, font: (px) => `600 ${px}px "Inter Tight"` }, ink: '8, 10, 16', ground: 'light', alpha: a1 }) + 20;
      const last = claim[claim.length - 1];
      if (t >= last.start + 0.12) {
        const k = ease.out3((t - last.start - 0.12) / 0.12);
        const r = 70, bx = cx + 60 + r, by = 680 - 95;
        ctx.fillStyle = `rgba(${GREEN}, ${(a1 * k).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(bx, by, r * (0.7 + 0.3 * k), 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(250, 252, 252, ${(a1 * k).toFixed(3)})`; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 30, by + 2); ctx.lineTo(bx - 8, by + 26); ctx.lineTo(bx + 34, by - 24); ctx.stroke();
      }
      // line 2: a row of buttons along the bottom
      x = 250;
      L2.words.forEach((w, i) => { x += chip(ctx, w, t, x, 1900, 150, CAPS[i] ?? 'CONFIRM', 1) + 60; });
    },
  };
};

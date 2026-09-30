// The words of s12-gate, centred like a checkout: "You sell the gate" across the top, SELL slashed
// in on its onset; "Then you guard the gate" across the bottom under redaction bars that rip away
// word by word as the leaves slam, the bolts shoot and the grid flares.
import { linesFrom, slash, strike, glitch, redact, note, outFade, clamp01, measure, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [L1, L2] = linesFrom('You sell the gate', 'Then you guard the gate');

// one centred row with an extra word space (the slashed and struck words ran close), each word
// by its own weapon
function row(ctx, words, t, pick, { x, y, px, gap, ...o }) {
  const adv = words.map((w) => measure(ctx, w.w, px, o));
  let cx = x - (adv.reduce((a, b) => a + b, 0) + gap * (words.length - 1) - px * 0.26) / 2;
  words.forEach((w, i) => { pick(w)(ctx, w, t, cx, y, px, o); cx += adv[i] + gap; });
}
// a redaction bar torn away inside its own word's slot (clipped), so the flying strips never lie
// across a neighbour that has just been revealed
function boxedRedact(ctx, w, t, x, y, px, o) {
  const adv = measure(ctx, w.w, px, o);
  ctx.save(); ctx.beginPath(); ctx.rect(x - px * 0.12, y - px * 1.3, adv - px * 0.26 + px * 0.24, px * 1.75); ctx.clip();
  redact(ctx, w, t, x, y, px, o);
  ctx.restore();
  return adv;
}

export default (P) => ({
  textSize: [3840, 2160], shade: 0.9,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    carry(ctx, t, P);   // "While the widow pays": PAYS is sung across the cut
    const out = outFade(t, P.to - 0.2, P.to);
    // the top line sits a little higher, above the grid's top beam
    row(ctx, L1.words, t, (w) => (/sell/i.test(w.w) ? slash : strike), { x: 1920, y: 385, px: 190, gap: 190 * 0.22, alpha: out, shake: 0.6 });
    row(ctx, L2.words, t, (w) => (/guard/i.test(w.w) ? glitch : boxedRedact), { x: 1920, y: 1900, px: 190, gap: 190 * 0.22, alpha: out, barAlpha: 0.92 * out, show: L2.words[0].start - 0.45 });
    note(ctx, 'LOT 12 · PAYWALL · GILT · MATT 23:13', 3640, 2010, { px: 38, align: 'right', alpha: 0.85 * clamp01((t - P.from - 0.3) / 0.3) * out });
  },
});

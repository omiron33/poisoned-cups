// The words of s10-loads.
// "Heavy loads": struck in down the left column, one word a row, landing like the crates.
// "That you never lift too": in the close-up, the words hang a measured gap above a hairline rule
// and never touch it (a dimension bracket reads GAP 0.02 M); NEVER is redacted in; on "lift" the
// whole line lifts away from the rule, the way the glove does.
import { linesFrom, strike, paint, measure, arrive, redact, note, outFade, keyOf, ease, clamp01, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

const [LH, LN] = linesFrom('Heavy loads', 'That you never lift too');

export default (P) => ({
  textSize: [3840, 2160],
  shade: 0.75,
  textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
  drawText(ctx, t) {
    // "Let the camel through": THROUGH is sung across the cut. Set in the dark band under the belt,
    // above the LOAD note that fades in at the bottom left.
    carry(ctx, t, P, { x: 240, y: 1790 });
    const tCut = LN.words[0].start - 0.2;
    const tLift = LN.words.find((w) => /lift/i.test(w.w)).start;
    const f1 = outFade(t, tCut - 0.25, tCut);
    if (f1 > 0.002) {
      // HEAVY and LOADS each strike in on their own row, stacked like the crates
      // they drive in from only a little larger and barely turned, so LOADS landing never covers
      // HEAVY while HEAVY is still being read
      LH.words.forEach((w, i) => strike(ctx, w, t, 240, 800 + i * 490, 400, { alpha: f1, from: 0.25, rot: -0.04, shake: 0.6 }));
      note(ctx, 'LOAD 10  ·  2 CRATES  ·  STRAPPED  ·  MATT 23:4', 240, 1980, { rule: 640, alpha: 0.85 * Math.min(f1, clamp01((t - LH.words[0].start) / 0.3)) });
    }
    if (t < tCut) return;
    const fade = outFade(t, P.to - 0.25, P.to);
    const px = 170, base = 1720, x0 = 240;
    const lift = ease.inOut3((t - tLift) / 0.7) * 150;
    const ruleY = base + 90;
    // the rule and the dimension bracket (they stay; the words go)
    const k = clamp01((t - tCut) / 0.25) * fade;
    let x = x0;
    const xs = LN.words.map((w) => { const a = x; x += measure(ctx, w.w, px); return a; });
    const xEnd = x - px * 0.26;
    ctx.fillStyle = `rgba(246, 240, 230, ${(0.9 * k).toFixed(3)})`;
    ctx.fillRect(x0, ruleY, (xEnd - x0) * ease.out3((t - tCut) / 0.4), 3);
    ctx.fillRect(xEnd + 40, base + 30 - lift, 3, ruleY - base - 30 + lift);
    ctx.fillRect(xEnd + 28, base + 30 - lift, 27, 3);
    ctx.fillRect(xEnd + 28, ruleY, 27, 3);
    ctx.font = '800 40px "JetBrains Mono"';
    ctx.fillText(t < tLift ? 'GAP 0.02 M' : 'GAP ' + (0.02 + lift / 150 * 1.2).toFixed(2) + ' M', xEnd + 80, ruleY - 10);
    LN.words.forEach((w, i) => {
      const y = base - lift;
      if (keyOf(w.w) === 'never') { redact(ctx, w, t, xs[i], y, px, { alpha: fade, show: tCut }); return; }
      const s = arrive(w, t);
      if (s.a > 0.002) paint(ctx, w.w, xs[i], y - (1 - s.k) * px * 0.3, px, { alpha: s.a * fade });
    });
  },
});

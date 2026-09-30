// The words of s13-vipers2. The hook climbs: "BROOD OF" runs up the left edge and "VIPERS" up the
// right edge, turned on end like the rising viper between them, each word struck on its kick.
// The question sits level across the middle-bottom in glitching capitals, "fire?" struck larger.
import { linesAt, strike, slash, glitch, measure, note, outFade, carry } from '/song/lib/type.js';
import { cameraPlane } from '/engine.js';

export default (P) => {
  const [L1, L2] = linesAt(P.from - 0.6, 'Brood of vipers', 'Who warned you');
  const [brood, of, vipers] = L1.words;
  const body = L2.words.slice(0, -1), fire = L2.words[L2.words.length - 1];
  const up = (ctx, fn, w, t, x, y, px, o) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); fn(ctx, w, t, 0, 0, px, o); ctx.restore(); };
  return {
    textSize: [3840, 2160],
    shade: 0.32,
    textPlane(t, cam) { return cameraPlane(cam, { width: 1, dist: 1, aspect: 16 / 9 }); },
    drawText(ctx, t) {
      // "gate" (s12) is sung across the cut: keep it readable, clear of BROOD's lower-left column
      carry(ctx, t, P, { x: 900, y: 1960 });
      const out = outFade(t, P.to - 0.3, P.to);
      const o = { ground: 'dark', alpha: out };
      // chorus 2's type is larger than chorus 1's and carries ember-red edges
      ctx.shadowColor = `rgba(255, 70, 20, ${0.85 * out})`; ctx.shadowBlur = 18;
      // up the left edge: BROOD then OF (reading bottom to top), baseline along x
      // (sizes keep both columns inside the frame; OF sits well clear of BROOD's top)
      up(ctx, strike, brood, t, 680, 1960, 420, o);
      up(ctx, glitch, of, t, 680, 1960 - measure(ctx, brood.w, 420) - 150, 190, o);
      // up the right edge: VIPERS, huge (sized so the whole word stays on screen)
      up(ctx, slash, vipers, t, 3480, 1960, 440, { ...o, angle: -0.5 });
      // the question, level, between them
      let x = 900;
      for (const w of body) x += glitch(ctx, w, t, x, 1560, 120, o);
      const fw = measure(ctx, fire.w, 380);
      strike(ctx, fire, t, 1920 - fw / 2 + 60, 1960, 380, o);
      ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
      note(ctx, 'ROW C  ·  RACKS 01–18  ·  THERMAL  ·  MATT 23:33', 900, 300, { alpha: 0.8 * out, rule: 900 });
    },
  };
};

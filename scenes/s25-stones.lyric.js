// The words of s25-stones, the climax, and the only lyric in the film written into the world: as
// each stone lifts, its word is cut into its face and burns white in time with the voice, one word
// per stone: The / stones / will / speak / My / will. The held "will" burns hottest and keeps
// growing as its stone climbs. (Positions come from the picture's own rig via project().)
import { linesFrom, paint, measure, note, outFade, spring, clamp01, ease, project, VOICES, voiceOf, carry } from '/song/lib/type.js';
import { rig } from '/song/scenes/s25-stones.js';

const [L] = linesFrom('The stones will speak');
const fullFrame = (cam) => {
  const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ww = nrm(sub(cam.target, cam.pos)), r = cam.roll ?? 0;
  const uu = nrm(cross(ww, [Math.sin(r), Math.cos(r), 0])), vv = cross(uu, ww);
  const hh = Math.tan((cam.fov * Math.PI) / 360), hw = hh * 16 / 9;
  return { c: cam.pos.map((v, i) => v + ww[i]), ax: uu, ay: vv, hs: [hw, hh] };
};

export default (P) => {
  const R = rig(P);
  return {
    textSize: [3840, 2160],
    shade: 0.45,
    textPlane(t, cam) { return fullFrame(cam); },
    drawText(ctx, t) {
      carry(ctx, t, P);
      const cam = R.camera(t);
      const a = outFade(t, P.to - 0.12, P.to);
      L.words.forEach((w, i) => {
        if (t < w.start) return;
        const c = R.pos(t, i);
        const face = [c[0], c[1] - 0.005, c[2] + 0.14];
        const pc = project(cam, face), pl = project(cam, [face[0] - 0.15, face[1], face[2]]), pr = project(cam, [face[0] + 0.15, face[1], face[2]]);
        if (pc.z <= 0.05) return;
        const faceW = Math.hypot(pr.x - pl.x, pr.y - pl.y);
        const isWill = i === 5;
        const grow = isWill ? 1 + 0.25 * ease.inOut3((t - w.start) / (P.to - w.start)) : 1;
        const wd100 = measure(ctx, w.w, 100);
        const px = Math.min(380, (faceW * 0.8 / wd100) * 100) * grow;   // leaves room for the channel
        const s = spring(t, w.start, 0.35, 0.2);
        const wd = measure(ctx, w.w, px);
        ctx.save(); ctx.translate(pc.x, pc.y + px * 0.3);
        const sc = 1.25 - 0.25 * s; ctx.scale(sc, sc);
        // the cut channel: an opaque, scorched near-black recess the word burns inside, so the white word
        // holds 4.5:1 however hot (HDR) the stone face around it glows
        const size = px * voiceOf(w.w).scale;
        const tw = wd - px * 0.26, pad = size * 0.2;
        ctx.save();
        ctx.fillStyle = `rgba(10, 7, 6, ${(clamp01(s * 1.6) * a).toFixed(3)})`;
        ctx.shadowColor = `rgba(10, 7, 6, ${(0.8 * clamp01(s * 1.6) * a).toFixed(3)})`; ctx.shadowBlur = size * 0.18;
        ctx.beginPath(); ctx.roundRect(-tw / 2 - pad, -size * 0.86, tw + pad * 2, size * 1.2, size * 0.12); ctx.fill();
        ctx.restore();
        // burn: a white-hot flash on the onset, settling to the word's voice (the last "will" stays white)
        const isMy = i === 4;
        const hot = isMy ? Math.exp(-(t - w.start) * 6) : 1;
        paint(ctx, w.w, -wd / 2 + px * 0.13, 0, px, { ground: 'dark', alpha: clamp01(s * 1.6) * a });
        if (hot > 0.02) paint(ctx, w.w, -wd / 2 + px * 0.13, 0, px, { ground: 'dark', ink: '255, 250, 236', alpha: hot * a });
        ctx.restore();
      });
      note(ctx, 'LOT 25  ·  RUBBLE  ·  CONCRETE  ·  CARVED LIGHT  ·  LUKE 19:40', 1920, 1990, { px: 38, ground: 'dark', align: 'center', alpha: 0.8 * a * (1 - R.rise(t)) });
    },
  };
};

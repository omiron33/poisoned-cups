// 06 · "You twist the truth / To build your little empire"
// Outside: one glowing optical fibre standing in a dark wet hall, twisting on "twist" into a tight
// helix. Inside: the camera pulls back as black GPU slabs rain down and stack into server towers
// round it, a little skyline, and the twisted fibre ends up as the antenna on the tallest tower.
import { ease, grade, rgb, orbit, keys, spring } from '/song/lib/look.js';
import { STUDIO_GLSL, STUDIO_UNIFORMS } from '/song/lib/studio.js';
import { EMPIRE_GLSL, empireUniforms, towerState } from '/song/lib/x-empire.js';
import { linesFrom } from '/song/lib/look.js';

const [L1, L2] = linesFrom('You twist the truth', 'To build your little empire');
const setV = (u, k, a) => { const v = u[k].value; if (v && v.set) v.set(...a); else u[k].value = a; };

export default (P) => {
  const t0 = P.from;
  const tw = L1.words.find((w) => /twist/i.test(w.w)).start;
  const b0 = L2.words[0].start;                         // "To": the build begins
  const emp = L2.words[L2.words.length - 1].start;     // "empire": the last tower tops out
  const order = [5, 3, 1, 7, 2, 6, 4];
  const build = order.map((k, i) => [k, b0 + i * 0.2, b0 + i * 0.2 + 0.55]);
  build.push([0, b0 + 0.25, emp]);
  const camera = (t) => {
    const pull = ease.inOut3((t - (b0 - 0.35)) / 0.9);
    const u = t - t0;
    return orbit(t, {
      target: [0, 0.95 - 0.45 * pull, 0],
      yaw: 0.35 - 0.06 * u,
      pitch: 0.05 + 0.2 * pull,
      dist: 1.25 + 2.5 * pull,
      fov: 32, drift: 0.008,
    });
  };
  return {
    name: 's06-empire', from: P.from, to: P.to,
    frag: STUDIO_GLSL + EMPIRE_GLSL + /* glsl */ `
float mapObj(vec3 p, out int id) { return empireSDF(p, id); }
Mat material(int id, vec3 p, vec3 n) { return empireMat(id, p, n); }
vec3 shade(vec2 fc) {
  vec3 ro; vec3 rd = camRay(fc, ro);
  float depth;
  return studio(ro, rd, depth);
}`,
    uniforms: {
      ...STUDIO_UNIFORMS,
      uCycA: rgb('84, 110, 104', 1.3), uCycB: rgb('30, 42, 46', 1.0),
      uFloorCol: rgb('70, 78, 76', 0.7), uFloorRough: 0.1, uGrime: 0.9,
      uKeyDir: [-0.3, 1.0, 0.45], uKeyCol: [2.0, 2.3, 2.4], uKeySize: 0.35,
      uRimA: [1.9, 2.1, 2.2], uRimB: [0.4, 1.9, 0.7],
      uHaze: 0.045, uHazeCol: [0.075, 0.1, 0.09],
      ...empireUniforms(),
      uFibLo: 0.0, uFibHi: 1.4, uFibFollow: 0,
    },
    camera,
    textPlane(t, cam) { return { c: [0, 0, 0], ax: [1, 0, 0], ay: [0, 1, 0], hs: [0, 0] }; },
    update(t, u) {
      u.uTwist.value = spring(t, tw, 0.8, 0.25);
      const v = towerState(t, { build });
      const arr = u.uLv.value; for (let i = 0; i < 32; i++) arr[i] = v[i];
      const pulse = 1 + 0.25 * Math.exp(-Math.max(0, t - tw) * 6) * (t > tw ? 1 : 0);
      u.uGlow.value = pulse;
      setV(u, 'uP1', [0.05, 1.0, 0.25]);
      setV(u, 'uP1c', [0.5 * pulse, 2.6 * pulse, 1.2 * pulse]);
    },
    post(t) { return grade(t, { exposure: 1.05, bloom: 0.1, threshold: 1.1 }); },
  };
};
